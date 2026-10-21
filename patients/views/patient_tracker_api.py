
import json
from datetime import date, timedelta

from django.db import transaction
from django.db.models import Q
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from patients.models import Patient, PatientMonthlyTracker
from reception.models import PatientAssignment

from .helpers import (
    _can_view_patient_tracker,
    normalize_patient_id,
)


# Only these registration types qualify a patient for the tracker.
ELIGIBLE_REGISTRATION_CATEGORIES = (
    "appointment",
    "walk_in",
)

EVALUATION_CATEGORY = "initial_evaluation"


def _tracker_month(value=None):
    """Return the first day of the requested month."""
    if not value:
        today = timezone.localdate()
        return today.replace(day=1)

    try:
        if len(value) == 7:
            parsed = date.fromisoformat(value + "-01")
        else:
            parsed = date.fromisoformat(value)

        return parsed.replace(day=1)
    except (TypeError, ValueError):
        raise ValueError("Invalid month. Use YYYY-MM format.")


def _tracker_month_end(month):
    """Return the last day of a month."""
    return (
        month.replace(day=28) + timedelta(days=4)
    ).replace(day=1) - timedelta(days=1)


def _tracker_next_month(month):
    """Return the first day of the following month."""
    return (
        month.replace(day=28) + timedelta(days=4)
    ).replace(day=1)


def _tracker_status(session_count):
    """Calculate status from utilized sessions."""
    session_count = int(session_count or 0)

    if session_count == 0:
        return PatientMonthlyTracker.STATUS_INACTIVE

    if session_count <= 2:
        return PatientMonthlyTracker.STATUS_LOW

    if session_count <= 5:
        return PatientMonthlyTracker.STATUS_MODERATE

    return PatientMonthlyTracker.STATUS_HIGH


def _tracker_json_body(request):
    """Safely parse a JSON request body."""
    try:
        body = request.body.decode("utf-8")
        return json.loads(body) if body.strip() else {}
    except (UnicodeDecodeError, json.JSONDecodeError):
        return None


def _tracker_find_patient(data):
    """
    Find a patient by database ID or file number.

    Accepts:
      - id
      - patient_db_id
      - patient_id as database ID or file number
      - file_number
    """
    database_id = data.get("patient_db_id") or data.get("id")

    if database_id is not None:
        try:
            return Patient.objects.get(pk=int(database_id))
        except (Patient.DoesNotExist, TypeError, ValueError):
            return None

    supplied_id = data.get("file_number") or data.get("patient_id")

    if supplied_id is None:
        return None

    supplied_id = str(supplied_id).strip()

    if not supplied_id:
        return None

    if supplied_id.isdigit():
        patient = Patient.objects.filter(
            pk=int(supplied_id)
        ).first()

        if patient:
            return patient

    normalized = normalize_patient_id(supplied_id).casefold()

    for patient in Patient.objects.filter(
        is_archived=False
    ).only("id", "patient_id"):
        if (
            normalize_patient_id(patient.patient_id).casefold()
            == normalized
        ):
            return patient

    return None


def _tracker_eligible_patient_ids(month):
    """
    Return patients with an appointment or walk-in registration
    on or before the end of the selected month.
    """
    month_end = _tracker_month_end(month)

    return (
        PatientAssignment.objects.filter(
            category__in=ELIGIBLE_REGISTRATION_CATEGORIES,
            assignment_date__lte=month_end,
            patient__is_archived=False,
        )
        .values_list("patient_id", flat=True)
        .distinct()
    )


def _tracker_is_new_evaluation(patient, month):
    """
    Mark NEW in the month of the first eligible registration
    only if an initial evaluation was registered earlier.
    """
    month_end = _tracker_month_end(month)

    first_eligible_assignment = (
        PatientAssignment.objects.filter(
            patient=patient,
            category__in=ELIGIBLE_REGISTRATION_CATEGORIES,
            assignment_date__lte=month_end,
        )
        .order_by("assignment_date", "created_at", "pk")
        .first()
    )

    if not first_eligible_assignment:
        return False

    if first_eligible_assignment.assignment_date.replace(
        day=1
    ) != month:
        return False

    return PatientAssignment.objects.filter(
        patient=patient,
        category=EVALUATION_CATEGORY,
        assignment_date__lt=first_eligible_assignment.assignment_date,
    ).exists()


def _tracker_assignment_session_count(patient, month):
    """
    Fallback count of appointment/walk-in assignments in the month.

    This counts registrations, not necessarily completed visits.
    Use the clinic's confirmed completed-visit or billing source
    if utilized sessions must represent completed physiotherapy visits.
    """
    month_end = _tracker_month_end(month)

    return PatientAssignment.objects.filter(
        patient=patient,
        category__in=ELIGIBLE_REGISTRATION_CATEGORIES,
        assignment_date__gte=month,
        assignment_date__lte=month_end,
    ).count()


def _tracker_last_assignment_date(patient, month):
    """Return the latest eligible assignment date in the month."""
    month_end = _tracker_month_end(month)

    return (
        PatientAssignment.objects.filter(
            patient=patient,
            category__in=ELIGIBLE_REGISTRATION_CATEGORIES,
            assignment_date__gte=month,
            assignment_date__lte=month_end,
        )
        .order_by("-assignment_date", "-created_at")
        .values_list("assignment_date", flat=True)
        .first()
    )


def _tracker_get_speciality(patient, month):
    """
    Return the most recent non-empty speciality from an eligible
    appointment/walk-in assignment on or before the selected month end.

    Uses the PatientAssignment speciality field. If your model stores
    speciality under another field, that model field must be checked.
    """
    month_end = _tracker_month_end(month)

    assignment = (
        PatientAssignment.objects.filter(
            patient=patient,
            category__in=ELIGIBLE_REGISTRATION_CATEGORIES,
            assignment_date__lte=month_end,
        )
        .exclude(speciality__isnull=True)
        .exclude(speciality__exact="")
        .order_by("-assignment_date", "-created_at", "-pk")
        .only("speciality")
        .first()
    )

    if not assignment or not assignment.speciality:
        return ""

    return str(assignment.speciality).strip()


def _tracker_update_weekly_status(month):
    """
    Recalculate status after the first week of the current month.
    Historical months can be recalculated at any time.
    """
    today = timezone.localdate()
    current_month = today.replace(day=1)

    if month > current_month:
        return

    if month == current_month and today.day < 8:
        return

    records = PatientMonthlyTracker.objects.filter(
        month=month
    ).exclude(
        status=PatientMonthlyTracker.STATUS_OTHER_THERAPIST
    )

    for record in records.iterator():
        calculated_status = _tracker_status(
            record.utilized_sessions
        )

        if record.status != calculated_status:
            record.status = calculated_status
            record.save(update_fields=["status", "updated_at"])


def _tracker_row(patient, month):
    """Build a consistent tracker row."""
    record = PatientMonthlyTracker.objects.filter(
        patient=patient,
        month=month,
    ).first()

    if record:
        # Existing monthly tracker values remain authoritative.
        sessions = int(record.utilized_sessions or 0)
        status = record.status
        last_seen = record.last_seen_date
    else:
        # Fallback for patients without a monthly tracker record.
        sessions = _tracker_assignment_session_count(
            patient,
            month,
        )
        status = _tracker_status(sessions)
        last_seen = _tracker_last_assignment_date(
            patient,
            month,
        )

    status_labels = dict(PatientMonthlyTracker.STATUS_CHOICES)

    is_new_evaluation = _tracker_is_new_evaluation(
        patient,
        month,
    )

    speciality = _tracker_get_speciality(
        patient,
        month,
    )

    return {
        "id": patient.id,
        "name": patient.name,
        "patient_id": patient.patient_id,
        "file_number": patient.patient_id,
        "utilized_sessions": sessions,
        "sessions_taken": sessions,
        "session_count": sessions,
        "sessions_count": sessions,
        "status": status,
        "status_label": status_labels.get(status, status),
        "speciality": speciality,
        "specialty": speciality,
        "last_seen_date": str(last_seen) if last_seen else None,
        "latest_seen_date": str(last_seen) if last_seen else None,
        "is_new_evaluation": is_new_evaluation,
        "month": month.strftime("%Y-%m"),
    }


@csrf_exempt
def patient_tracker_api(request):
    """
    Monthly physiotherapy tracker.

    GET:
        /patients/tracker/?month=YYYY-MM&search=...

    POST:
        rollover
    """
    if not _can_view_patient_tracker(request.user):
        return JsonResponse(
            {"error": "Not authorized"},
            status=403,
        )

    if request.method == "GET":
        try:
            month = _tracker_month(request.GET.get("month"))
        except ValueError as exc:
            return JsonResponse(
                {"error": str(exc)},
                status=400,
            )

        _tracker_update_weekly_status(month)

        search = (request.GET.get("search") or "").strip()

        eligible_patient_ids = _tracker_eligible_patient_ids(month)

        patients_qs = Patient.objects.filter(
            is_archived=False,
            id__in=eligible_patient_ids,
        ).order_by("name")

        if search:
            normalized_search = normalize_patient_id(
                search
            ).casefold()

            matching_ids = []

            for existing in patients_qs.only(
                "id", "patient_id"
            ).iterator():
                normalized_file_number = normalize_patient_id(
                    existing.patient_id
                ).casefold()

                if normalized_search in normalized_file_number:
                    matching_ids.append(existing.id)

            patients_qs = patients_qs.filter(
                Q(name__icontains=search)
                | Q(patient_id__icontains=search)
                | Q(id__in=matching_ids)
            )

        patient_rows = [
            _tracker_row(patient, month)
            for patient in patients_qs
        ]

        return JsonResponse({
            "patients": patient_rows,
            "month": month.strftime("%Y-%m"),
        })

    if request.method != "POST":
        return JsonResponse(
            {"error": "Method not allowed"},
            status=405,
        )

    data = _tracker_json_body(request)

    if data is None:
        return JsonResponse(
            {"error": "Invalid JSON request body"},
            status=400,
        )

    action = (data.get("action") or "").strip().lower()

    try:
        month = _tracker_month(data.get("month"))
    except ValueError as exc:
        return JsonResponse(
            {"error": str(exc)},
            status=400,
        )

    if action == "rollover":
        next_month = _tracker_next_month(month)

        excluded_statuses = [
            PatientMonthlyTracker.STATUS_INACTIVE,
            PatientMonthlyTracker.STATUS_OTHER_THERAPIST,
        ]

        eligible_patient_ids = _tracker_eligible_patient_ids(month)
        copied_count = 0

        with transaction.atomic():
            source_records = (
                PatientMonthlyTracker.objects.filter(
                    month=month,
                    patient__is_archived=False,
                    patient_id__in=eligible_patient_ids,
                ).exclude(
                    status__in=excluded_statuses
                )
            )

            for source in source_records.iterator():
                _, created = (
                    PatientMonthlyTracker.objects.get_or_create(
                        patient=source.patient,
                        month=next_month,
                        defaults={
                            "utilized_sessions": 0,
                            "status": source.status,
                            "last_seen_date": None,
                            "is_new_evaluation": False,
                        },
                    )
                )

                if created:
                    copied_count += 1

        return JsonResponse({
            "success": True,
            "message": (
                "Monthly rollover completed for "
                f"{next_month.strftime('%Y-%m')}."
            ),
            "source_month": month.strftime("%Y-%m"),
            "next_month": next_month.strftime("%Y-%m"),
            "patients_carried_forward": copied_count,
        })

    return JsonResponse(
        {
            "error": "Unknown action.",
            "supported_actions": ["rollover"],
        },
        status=400,
    )

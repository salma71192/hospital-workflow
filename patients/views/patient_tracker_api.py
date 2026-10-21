
import json
from datetime import date, timedelta

from django.db import transaction
from django.db.models import Q, Count
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from patients.models import (
    Patient,
    PatientMonthlyTracker,
    PatientMonthlySession,
)
from reception.models import PatientAssignment

from .helpers import (
    _can_view_patient_tracker,
    normalize_patient_id,
)


ELIGIBLE_REGISTRATION_CATEGORIES = (
    "appointment",
    "walk_in",
)

EVALUATION_CATEGORY = "initial_evaluation"

SESSION_INSURANCE_TYPES = {
    "thiqa": "thiqa",
    "daman": "daman",
    "cash": "cash",
}


def _tracker_month(value=None):
    """Return the first day of the requested month."""
    if not value:
        return timezone.localdate().replace(day=1)

    try:
        value = str(value).strip()

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
        data = json.loads(body) if body.strip() else {}

        if not isinstance(data, dict):
            return None

        return data

    except (UnicodeDecodeError, json.JSONDecodeError):
        return None


def _tracker_find_patient(data):
    """Find a patient by database ID or patient file number."""
    database_id = data.get("patient_db_id") or data.get("id")

    if database_id is not None:
        try:
            return Patient.objects.filter(
                is_archived=False
            ).get(pk=int(database_id))

        except (
            Patient.DoesNotExist,
            TypeError,
            ValueError,
        ):
            return None

    supplied_id = (
        data.get("file_number")
        or data.get("patient_id")
    )

    if supplied_id is None:
        return None

    supplied_id = str(supplied_id).strip()

    if not supplied_id:
        return None

    normalized = normalize_patient_id(
        supplied_id
    ).casefold()

    patients = Patient.objects.filter(
        is_archived=False
    ).only("id", "patient_id")

    for patient in patients.iterator():
        if (
            normalize_patient_id(
                patient.patient_id
            ).casefold()
            == normalized
        ):
            return patient

    return None


def _tracker_therapist_assignments(user):
    """
    Return assignments belonging to the logged-in therapist.

    The assigned therapist is used for access control.
    The user who created an assignment may be a receptionist.
    """
    if not user or not getattr(
        user, "is_authenticated", False
    ):
        return PatientAssignment.objects.none()

    return PatientAssignment.objects.filter(
        therapist_id=user.pk
    )


def _tracker_eligible_patient_ids(month, user):
    """
    Return non-archived patients with an eligible assignment
    by the end of the requested month.
    """
    month_end = _tracker_month_end(month)

    return (
        _tracker_therapist_assignments(user)
        .filter(
            category__in=ELIGIBLE_REGISTRATION_CATEGORIES,
            assignment_date__lte=month_end,
            patient__is_archived=False,
        )
        .values_list("patient_id", flat=True)
        .distinct()
    )


def _tracker_patient_is_eligible(patient, month, user):
    """Check eligibility against the assignment's patient_id."""
    month_end = _tracker_month_end(month)

    return _tracker_therapist_assignments(user).filter(
        patient_id=patient.pk,
        category__in=ELIGIBLE_REGISTRATION_CATEGORIES,
        assignment_date__lte=month_end,
        patient__is_archived=False,
    ).exists()


def _tracker_is_new_evaluation(patient, month, user):
    """Determine whether the patient meets the existing NEW criteria."""
    month_end = _tracker_month_end(month)

    first_eligible_assignment = (
        _tracker_therapist_assignments(user)
        .filter(
            patient=patient,
            category__in=ELIGIBLE_REGISTRATION_CATEGORIES,
            assignment_date__lte=month_end,
        )
        .order_by(
            "assignment_date",
            "created_at",
            "pk",
        )
        .first()
    )

    if not first_eligible_assignment:
        return False

    if first_eligible_assignment.assignment_date.replace(
        day=1
    ) != month:
        return False

    return _tracker_therapist_assignments(user).filter(
        patient=patient,
        category=EVALUATION_CATEGORY,
        assignment_date__lt=(
            first_eligible_assignment.assignment_date
        ),
    ).exists()


def _tracker_assignment_session_count(patient, month, user):
    """Count eligible assignments for this therapist in the month."""
    month_end = _tracker_month_end(month)

    return (
        _tracker_therapist_assignments(user)
        .filter(
            patient=patient,
            category__in=ELIGIBLE_REGISTRATION_CATEGORIES,
            assignment_date__gte=month,
            assignment_date__lte=month_end,
        )
        .count()
    )


def _tracker_last_assignment_date(patient, month, user):
    """Return this therapist's latest eligible assignment date."""
    month_end = _tracker_month_end(month)

    return (
        _tracker_therapist_assignments(user)
        .filter(
            patient=patient,
            category__in=ELIGIBLE_REGISTRATION_CATEGORIES,
            assignment_date__gte=month,
            assignment_date__lte=month_end,
        )
        .order_by("-assignment_date", "-created_at")
        .values_list("assignment_date", flat=True)
        .first()
    )


def _tracker_get_speciality(patient, month, user):
    """Return the latest non-empty specialty for this therapist."""
    month_end = _tracker_month_end(month)

    assignment = (
        _tracker_therapist_assignments(user)
        .filter(
            patient=patient,
            category__in=ELIGIBLE_REGISTRATION_CATEGORIES,
            assignment_date__lte=month_end,
        )
        .exclude(speciality__isnull=True)
        .exclude(speciality__exact="")
        .order_by(
            "-assignment_date",
            "-created_at",
            "-pk",
        )
        .only("speciality")
        .first()
    )

    if not assignment or not assignment.speciality:
        return ""

    return str(assignment.speciality).strip()


def _tracker_normalize_insurance_type(value):
    """Normalize Thiqa, Daman, and Cash insurance labels."""
    if value is None:
        return None

    normalized = str(value).strip().casefold()

    aliases = {
        "thiqa": "thiqa",
        "thiqa insurance": "thiqa",
        "daman": "daman",
        "daman insurance": "daman",
        "cash": "cash",
        "self-pay": "cash",
        "self pay": "cash",
        "selfpay": "cash",
    }

    return aliases.get(normalized)


def _tracker_session_counts(record):
    """Return the monthly counts for Thiqa, Daman, and Cash."""
    counts = {
        "thiqa_sessions": 0,
        "daman_sessions": 0,
        "cash_sessions": 0,
    }

    if not record:
        return counts

    grouped_counts = (
        PatientMonthlySession.objects
        .filter(tracker=record)
        .values("insurance_type")
        .annotate(total=Count("id"))
    )

    for item in grouped_counts:
        field = f"{item['insurance_type']}_sessions"

        if field in counts:
            counts[field] = item["total"]

    # Preserve counters for older tracker records that have no
    # corresponding individual session records.
    for field in counts:
        counts[field] = max(
            counts[field],
            int(getattr(record, field, 0) or 0),
        )

    return counts


def _tracker_row(patient, month, user):
    """Build one patient tracker row."""
    record = PatientMonthlyTracker.objects.filter(
        patient=patient,
        month=month,
    ).first()

    if record:
        sessions = int(record.utilized_sessions or 0)
        status = record.status
        last_seen = record.last_seen_date
        category_counts = _tracker_session_counts(record)

    else:
        sessions = _tracker_assignment_session_count(
            patient,
            month,
            user,
        )
        status = _tracker_status(sessions)
        last_seen = _tracker_last_assignment_date(
            patient,
            month,
            user,
        )

        category_counts = {
            "thiqa_sessions": 0,
            "daman_sessions": 0,
            "cash_sessions": 0,
        }

    status_labels = dict(
        PatientMonthlyTracker.STATUS_CHOICES
    )

    is_new_evaluation = _tracker_is_new_evaluation(
        patient,
        month,
        user,
    )

    speciality = _tracker_get_speciality(
        patient,
        month,
        user,
    )

    insurance_type = _tracker_normalize_insurance_type(
        getattr(patient, "insurance_provider", "")
    ) or ""

    return {
        "id": patient.id,
        "patient_db_id": patient.id,
        "name": patient.name,
        "patient_id": patient.patient_id,
        "file_number": patient.patient_id,
        "insurance_type": insurance_type,
        "insurance_provider": getattr(
            patient,
            "insurance_provider",
            "",
        ) or "",
        "utilized_sessions": sessions,
        "sessions_taken": sessions,
        "session_count": sessions,
        "sessions_count": sessions,
        **category_counts,
        "status": status,
        "status_label": status_labels.get(
            status,
            status,
        ),
        "speciality": speciality,
        "specialty": speciality,
        "last_seen_date": (
            str(last_seen) if last_seen else None
        ),
        "latest_seen_date": (
            str(last_seen) if last_seen else None
        ),
        "is_new_evaluation": is_new_evaluation,
        "month": month.strftime("%Y-%m"),
    }


def _tracker_record_session(request, data, month):
    """Save one session and update the relevant monthly counters."""
    patient = _tracker_find_patient(data)

    if not patient:
        return JsonResponse(
            {"error": "Patient not found or archived."},
            status=404,
        )

    if not _tracker_patient_is_eligible(
        patient,
        month,
        request.user,
    ):
        return JsonResponse(
            {
                "error": (
                    "You can only record sessions for patients "
                    "assigned to you for the selected month."
                )
            },
            status=403,
        )

    insurance_type = _tracker_normalize_insurance_type(
        data.get("insurance_type")
    )

    if insurance_type not in SESSION_INSURANCE_TYPES.values():
        return JsonResponse(
            {
                "error": (
                    "Invalid insurance_type. "
                    "Use Thiqa, Daman, or Cash."
                )
            },
            status=400,
        )

    raw_session_date = data.get("session_date")

    if raw_session_date:
        try:
            session_date = date.fromisoformat(
                str(raw_session_date)
            )
        except (TypeError, ValueError):
            return JsonResponse(
                {
                    "error": (
                        "Invalid session_date. Use YYYY-MM-DD."
                    )
                },
                status=400,
            )
    else:
        session_date = timezone.localdate()

    if session_date.replace(day=1) != month:
        return JsonResponse(
            {
                "error": (
                    "The session date must be within "
                    "the selected month."
                )
            },
            status=400,
        )

    notes = str(data.get("notes") or "").strip()

    try:
        with transaction.atomic():
            tracker, _ = (
                PatientMonthlyTracker.objects
                .select_for_update()
                .get_or_create(
                    patient=patient,
                    month=month,
                    defaults={
                        "utilized_sessions": 0,
                        "thiqa_sessions": 0,
                        "daman_sessions": 0,
                        "cash_sessions": 0,
                        "status": (
                            PatientMonthlyTracker.STATUS_INACTIVE
                        ),
                        "last_seen_date": None,
                        "is_new_evaluation": False,
                    },
                )
            )

            session_record = PatientMonthlySession.objects.create(
                tracker=tracker,
                patient=patient,
                session_date=session_date,
                insurance_type=insurance_type,
                notes=notes,
                recorded_by=request.user,
            )

            # Every visit increments the total, including Cash.
            tracker.utilized_sessions = (
                int(tracker.utilized_sessions or 0) + 1
            )

            # Only increment the selected insurance category.
            counter_field = f"{insurance_type}_sessions"

            setattr(
                tracker,
                counter_field,
                int(
                    getattr(tracker, counter_field, 0) or 0
                ) + 1,
            )

            if (
                tracker.last_seen_date is None
                or session_date > tracker.last_seen_date
            ):
                tracker.last_seen_date = session_date

            tracker.status = _tracker_status(
                tracker.utilized_sessions
            )

            tracker.save(
                update_fields=[
                    "utilized_sessions",
                    "thiqa_sessions",
                    "daman_sessions",
                    "cash_sessions",
                    "last_seen_date",
                    "status",
                    "updated_at",
                ]
            )

    except Exception:
        return JsonResponse(
            {
                "error": (
                    "Unable to record the session. Check that "
                    "the tracker models and database migrations "
                    "are up to date."
                )
            },
            status=500,
        )

    return JsonResponse(
        {
            "success": True,
            "message": "Session recorded successfully.",
            "session": {
                "id": session_record.pk,
                "patient_db_id": patient.pk,
                "session_date": str(session_date),
                "insurance_type": insurance_type,
                "notes": notes,
            },
            "tracker": {
                "patient_db_id": patient.pk,
                "month": month.strftime("%Y-%m"),
                "utilized_sessions": tracker.utilized_sessions,
                "thiqa_sessions": tracker.thiqa_sessions,
                "daman_sessions": tracker.daman_sessions,
                "cash_sessions": tracker.cash_sessions,
                "status": tracker.status,
            },
        },
        status=201,
    )


@csrf_exempt
def patient_tracker_api(request):
    """
    Monthly physiotherapy tracker.

    GET:
        /patients/tracker/?month=YYYY-MM&search=...

    POST record_session:
        {
            "action": "record_session",
            "patient_db_id": 123,
            "month": "2026-10",
            "session_date": "2026-10-21",
            "insurance_type": "cash",
            "notes": ""
        }

    POST rollover:
        {
            "action": "rollover",
            "month": "2026-10"
        }
    """
    if not _can_view_patient_tracker(request.user):
        return JsonResponse(
            {"error": "Not authorized"},
            status=403,
        )

    if request.method == "GET":
        try:
            month = _tracker_month(
                request.GET.get("month")
            )

            eligible_patient_ids = (
                _tracker_eligible_patient_ids(
                    month,
                    request.user,
                )
            )

        except ValueError as exc:
            return JsonResponse(
                {"error": str(exc)},
                status=400,
            )

        except Exception:
            return JsonResponse(
                {
                    "error": (
                        "Unable to load the tracker. "
                        "Please check the therapist assignment "
                        "and patient registration records."
                    )
                },
                status=500,
            )

        _tracker_update_weekly_status(month)

        search = (
            request.GET.get("search") or ""
        ).strip()

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
                "id",
                "patient_id",
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
            _tracker_row(
                patient,
                month,
                request.user,
            )
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
            {
                "error": (
                    "Invalid JSON request body. "
                    "Send a JSON object."
                )
            },
            status=400,
        )

    action = (
        data.get("action") or ""
    ).strip().lower()

    try:
        month = _tracker_month(data.get("month"))
    except ValueError as exc:
        return JsonResponse(
            {"error": str(exc)},
            status=400,
        )

    if action == "record_session":
        return _tracker_record_session(
            request,
            data,
            month,
        )

    if action == "rollover":
        next_month = _tracker_next_month(month)

        excluded_statuses = [
            PatientMonthlyTracker.STATUS_INACTIVE,
            PatientMonthlyTracker.STATUS_OTHER_THERAPIST,
        ]

        eligible_patient_ids = (
            _tracker_eligible_patient_ids(
                month,
                request.user,
            )
        )

        copied_count = 0

        with transaction.atomic():
            source_records = (
                PatientMonthlyTracker.objects
                .filter(
                    month=month,
                    patient__is_archived=False,
                    patient_id__in=eligible_patient_ids,
                )
                .exclude(
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
                            "thiqa_sessions": 0,
                            "daman_sessions": 0,
                            "cash_sessions": 0,
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
            "supported_actions": [
                "rollover",
                "record_session",
            ],
        },
        status=400,
    )


def _tracker_update_weekly_status(month):
    """Recalculate monthly tracker status using existing rules."""
    today = timezone.localdate()
    current_month = today.replace(day=1)

    if month > current_month:
        return

    if month == current_month and today.day < 8:
        return

    records = (
        PatientMonthlyTracker.objects
        .filter(month=month)
        .exclude(
            status=PatientMonthlyTracker.STATUS_OTHER_THERAPIST
        )
    )

    for record in records.iterator():
        calculated_status = _tracker_status(
            record.utilized_sessions
        )

        if record.status != calculated_status:
            record.status = calculated_status
            record.save(
                update_fields=["status", "updated_at"]
            )

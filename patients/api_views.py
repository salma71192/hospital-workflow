
import json
import re
from datetime import date

from django.db import IntegrityError, transaction
from django.db.models import Q
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from .models import Patient
from callcenter.models import Appointment


def normalize_patient_id(value):
    """Remove whitespace so differently spaced IDs match."""
    if value is None:
        return ""
    return re.sub(r"\s+", "", str(value)).strip()


def _role(user):
    return (getattr(user, "role", "") or "").strip().lower()


def _is_admin(user):
    return user.is_authenticated and (
        user.is_superuser or _role(user) == "admin"
    )


def _can_create_patient(user):
    return user.is_authenticated and (
        user.is_superuser or _role(user) in [
            "admin",
            "reception",
            "reception_supervisor",
            "approvals",
            "callcenter",
            "callcenter_supervisor",
        ]
    )


def _can_edit_patient(user):
    return _can_create_patient(user)


def _can_view_patient_tracker(user):
    return user.is_authenticated and (
        user.is_superuser or _role(user) in [
            "admin",
            "physio",
            "reception",
            "reception_supervisor",
            "callcenter",
            "callcenter_supervisor",
            "approvals",
        ]
    )


def _patient_to_dict(patient):
    return {
        "id": patient.id,
        "name": patient.name,
        "patient_id": patient.patient_id,
        "current_approval_number": patient.current_approval_number,
        "approval_start_date": (
            str(patient.approval_start_date)
            if patient.approval_start_date else ""
        ),
        "approval_expiry_date": (
            str(patient.approval_expiry_date)
            if patient.approval_expiry_date else ""
        ),
        "approved_sessions": patient.approved_sessions,
        "approved_cpt_codes": patient.approved_cpt_codes or [],
        "sessions_taken": patient.sessions_taken,
        "taken_with": patient.taken_with,
        "current_future_appointments": patient.current_future_appointments,
        "insurance_provider": patient.insurance_provider or "",
        "created_at": (
            patient.created_at.isoformat() if patient.created_at else ""
        ),
        "registered_at": (
            patient.registered_at.isoformat()
            if patient.registered_at else ""
        ),
        "registered_by": (
            patient.registered_by.username if patient.registered_by else ""
        ),
        "registered_by_role": patient.registered_by_role or "",
        "is_archived": getattr(patient, "is_archived", False),
        "archived_at": (
            patient.archived_at.isoformat()
            if getattr(patient, "archived_at", None) else ""
        ),
    }


def _get_patient_status(patient, latest_seen_date):
    today_value = date.today()

    if getattr(patient, "is_archived", False):
        return "archived"

    expiry_date = getattr(patient, "approval_expiry_date", None)
    approved_sessions = int(patient.approved_sessions or 0)
    sessions_taken = int(patient.sessions_taken or 0)
    remaining_sessions = max(approved_sessions - sessions_taken, 0)

    if expiry_date and expiry_date < today_value:
        return "expired"

    if latest_seen_date:
        days_since_seen = (today_value - latest_seen_date).days
        if days_since_seen > 30:
            return "inactive"
        if days_since_seen > 14:
            return "irregular"

    if remaining_sessions <= 0:
        return "inactive"

    return "active"


def _find_duplicate_patient(patient_id, exclude_id=None):
    normalized_id = normalize_patient_id(patient_id)

    if not normalized_id:
        return None

    patients = Patient.objects.all()

    if exclude_id is not None:
        patients = patients.exclude(id=exclude_id)

    for existing in patients.only("id", "patient_id").iterator():
        if normalize_patient_id(existing.patient_id).casefold() == (
            normalized_id.casefold()
        ):
            return existing

    return None


def _duplicate_error():
    return JsonResponse({
        "success": False,
        "error": "This patient file number already exists.",
    }, status=400)


def _parse_json(request):
    try:
        data = json.loads(request.body or b"{}")
        if not isinstance(data, dict):
            raise ValueError("Expected a JSON object")
        return data, None
    except (json.JSONDecodeError, UnicodeDecodeError, ValueError):
        return None, JsonResponse(
            {"error": "Invalid JSON object"},
            status=400,
        )


@csrf_exempt
def patients_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    if request.method == "GET":
        search = (request.GET.get("search") or "").strip()
        show_archived = (
            request.GET.get("archived", "").strip().lower() == "true"
        )
        show_all = (
            request.GET.get("include_archived", "").strip().lower()
            == "true"
        )

        patients_qs = Patient.objects.select_related(
            "registered_by"
        ).all()

        if show_archived or show_all:
            if not _is_admin(request.user):
                return JsonResponse(
                    {"error": "Only admin can view archived patient files"},
                    status=403,
                )
            if show_archived:
                patients_qs = patients_qs.filter(is_archived=True)
        else:
            patients_qs = patients_qs.filter(is_archived=False)

        if search:
            normalized_search = normalize_patient_id(search).casefold()
            matching_ids = []

            for existing in Patient.objects.only(
                "id", "patient_id"
            ).iterator():
                if normalized_search in normalize_patient_id(
                    existing.patient_id
                ).casefold():
                    matching_ids.append(existing.id)

            patients_qs = patients_qs.filter(
                Q(name__icontains=search)
                | Q(patient_id__icontains=search)
                | Q(id__in=matching_ids)
            )

        patients = [
            _patient_to_dict(patient)
            for patient in patients_qs.order_by("-created_at").distinct()
        ]
        return JsonResponse({"patients": patients})

    if request.method == "POST":
        if not _can_create_patient(request.user):
            return JsonResponse(
                {"error": "Not allowed to create patients"},
                status=403,
            )

        data, error = _parse_json(request)
        if error:
            return error

        name = (data.get("name") or "").strip()
        patient_id = normalize_patient_id(data.get("patient_id"))

        if not name or not patient_id:
            return JsonResponse(
                {"error": "Name and patient ID are required"},
                status=400,
            )

        if _find_duplicate_patient(patient_id):
            return _duplicate_error()

        try:
            with transaction.atomic():
                patient = Patient.objects.create(
                    name=name,
                    patient_id=patient_id,
                    registered_by=request.user,
                    registered_by_role=(
                        getattr(request.user, "role", "")
                        or ("admin" if request.user.is_superuser else "")
                    ),
                )
        except IntegrityError:
            return _duplicate_error()
        except ValueError as exc:
            return JsonResponse({"error": str(exc)}, status=400)

        return JsonResponse({
            "success": True,
            "message": "Patient file created successfully",
            "patient": _patient_to_dict(patient),
        }, status=201)

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def patient_detail_api(request, patient_id):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    try:
        patient = Patient.objects.select_related("registered_by").get(
            id=patient_id
        )
    except (Patient.DoesNotExist, ValueError, TypeError):
        return JsonResponse({"error": "Patient not found"}, status=404)

    if request.method == "GET":
        if patient.is_archived and not _is_admin(request.user):
            return JsonResponse(
                {"error": "Patient file not found"},
                status=404,
            )
        return JsonResponse({"patient": _patient_to_dict(patient)})

    if request.method == "PUT":
        if not _can_edit_patient(request.user):
            return JsonResponse(
                {"error": "Not allowed to edit patient files"},
                status=403,
            )

        if patient.is_archived and not _is_admin(request.user):
            return JsonResponse(
                {"error": "Only admin can edit archived patient files"},
                status=403,
            )

        data, error = _parse_json(request)
        if error:
            return error

        name = (data.get("name") or "").strip()
        new_patient_id = normalize_patient_id(data.get("patient_id"))

        if not name or not new_patient_id:
            return JsonResponse(
                {"error": "Name and patient ID are required"},
                status=400,
            )

        if _find_duplicate_patient(new_patient_id, exclude_id=patient.id):
            return _duplicate_error()

        try:
            approved_sessions = int(data.get("approved_sessions", 0))
            sessions_taken = int(data.get("sessions_taken", 0))
            if approved_sessions < 0 or sessions_taken < 0:
                raise ValueError
        except (TypeError, ValueError):
            return JsonResponse(
                {"error": "Session counts must be non-negative numbers"},
                status=400,
            )

        patient.name = name
        patient.patient_id = new_patient_id
        patient.current_approval_number = (
            (data.get("current_approval_number") or "").strip() or None
        )
        patient.approval_start_date = data.get("approval_start_date") or None
        patient.approval_expiry_date = data.get("approval_expiry_date") or None
        patient.approved_sessions = approved_sessions
        patient.sessions_taken = sessions_taken
        patient.taken_with = (data.get("taken_with") or "").strip() or None
        patient.current_future_appointments = (
            data.get("current_future_appointments") or None
        )
        patient.insurance_provider = (
            (data.get("insurance_provider") or "").strip() or None
        )

        if "approved_cpt_codes" in data:
            patient.approved_cpt_codes = data.get("approved_cpt_codes") or []

        try:
            with transaction.atomic():
                patient.save()
        except IntegrityError:
            return _duplicate_error()
        except ValueError as exc:
            return JsonResponse({"error": str(exc)}, status=400)

        return JsonResponse({
            "success": True,
            "message": "Patient file updated successfully",
            "patient": _patient_to_dict(patient),
        })

    if request.method == "POST":
        if not _is_admin(request.user):
            return JsonResponse(
                {"error": "Only admin can archive or restore patient files"},
                status=403,
            )

        data, error = _parse_json(request)
        if error:
            return error

        action = (data.get("action") or "").strip().lower()

        if action == "archive":
            if not patient.is_archived:
                patient.is_archived = True
                patient.archived_at = timezone.now()
                patient.save(update_fields=["is_archived", "archived_at"])

            return JsonResponse({
                "success": True,
                "message": "Patient file archived successfully",
                "patient": _patient_to_dict(patient),
            })

        if action == "restore":
            if patient.is_archived:
                patient.is_archived = False
                patient.archived_at = None
                patient.save(update_fields=["is_archived", "archived_at"])

            return JsonResponse({
                "success": True,
                "message": "Patient file restored successfully",
                "patient": _patient_to_dict(patient),
            })

        return JsonResponse({
            "error": "Unknown action. Use 'archive' or 'restore'."
        }, status=400)

    if request.method == "DELETE":
        if not _is_admin(request.user):
            return JsonResponse(
                {"error": "Only admin can permanently delete patient files"},
                status=403,
            )

        data, error = _parse_json(request)
        if error:
            return error

        if data.get("confirm") != patient.patient_id:
            return JsonResponse({
                "error": (
                    "Deletion not confirmed. Send the patient's exact "
                    "file number in the 'confirm' field."
                )
            }, status=400)

        try:
            with transaction.atomic():
                # Delete appointments associated with this patient first.
                appointments = Appointment.objects.filter(
                    patient_id=patient.pk
                )
                appointments_deleted = appointments.count()
                appointments.delete()

                # Django will handle related objects according to each
                # relationship's on_delete setting.
                patient.delete()

        except IntegrityError:
            return JsonResponse({
                "success": False,
                "error": (
                    "Deletion was blocked by another related record. "
                    "The transaction was rolled back. Inspect the related "
                    "models and their on_delete settings."
                ),
            }, status=409)

        return JsonResponse({
            "success": True,
            "message": (
                "Patient and deletable related records were permanently "
                "deleted."
            ),
            "appointments_deleted": appointments_deleted,
        })

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def patient_tracker_api(request):
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    if not _can_view_patient_tracker(request.user):
        return JsonResponse({"error": "Not authorized"}, status=403)

    today_value = date.today()
    role = _role(request.user)
    search = (request.GET.get("search") or "").strip()

    patients_qs = Patient.objects.filter(
        is_archived=False
    ).order_by("name")

    if search:
        normalized_search = normalize_patient_id(search).casefold()
        matching_ids = []

        for existing in Patient.objects.filter(
            is_archived=False
        ).only("id", "patient_id").iterator():
            if normalized_search in normalize_patient_id(
                existing.patient_id
            ).casefold():
                matching_ids.append(existing.id)

        patients_qs = patients_qs.filter(
            Q(name__icontains=search)
            | Q(patient_id__icontains=search)
            | Q(id__in=matching_ids)
        )

    patient_rows = []

    for patient in patients_qs:
        appointments_qs = Appointment.objects.filter(
            patient_id=patient.id
        )

        if role == "physio":
            appointments_qs = appointments_qs.filter(
                therapist_id=request.user.id
            )

        latest_seen = (
            appointments_qs.filter(appointment_date__lte=today_value)
            .order_by("-appointment_date", "-appointment_time")
            .values_list("appointment_date", flat=True)
            .first()
        )

        future_count = appointments_qs.filter(
            appointment_date__gte=today_value
        ).count()

        latest_therapist_id = (
            appointments_qs.order_by(
                "-appointment_date", "-appointment_time"
            )
            .values_list("therapist_id", flat=True)
            .first()
        )

        if role == "physio" and not latest_therapist_id:
            continue

        approved_sessions = int(patient.approved_sessions or 0)
        sessions_taken = int(patient.sessions_taken or 0)
        remaining_sessions = max(
            approved_sessions - sessions_taken,
            0,
        )

        patient_rows.append({
            "id": patient.id,
            "name": patient.name,
            "patient_id": patient.patient_id,
            "approved_sessions": approved_sessions,
            "sessions_taken": sessions_taken,
            "remaining_sessions": remaining_sessions,
            "status": _get_patient_status(patient, latest_seen),
            "latest_seen_date": str(latest_seen) if latest_seen else None,
            "current_future_appointments": future_count,
            "therapist_id": latest_therapist_id,
        })

    return JsonResponse({"patients": patient_rows})

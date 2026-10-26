
import json
import re

from django.http import JsonResponse
from django.utils import timezone

from patients.models import Patient


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
        user.is_superuser
        or _role(user) in [
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
        user.is_superuser
        or _role(user) in [
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
        "gender": patient.gender or "",
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
        "current_future_appointments": (
            patient.current_future_appointments
        ),
        "insurance_provider": patient.insurance_provider or "",
        "created_at": (
            patient.created_at.isoformat() if patient.created_at else ""
        ),
        "registered_at": (
            patient.registered_at.isoformat()
            if patient.registered_at else ""
        ),
        "registered_by": (
            patient.registered_by.username
            if patient.registered_by else ""
        ),
        "registered_by_role": patient.registered_by_role or "",
        "is_archived": getattr(patient, "is_archived", False),
        "archived_at": (
            patient.archived_at.isoformat()
            if getattr(patient, "archived_at", None) else ""
        ),
    }


def _get_patient_status(patient, latest_seen_date):
    today_value = timezone.localdate()

    if getattr(patient, "is_archived", False):
        return "archived"

    expiry_date = getattr(patient, "approval_expiry_date", None)
    approved_sessions = int(patient.approved_sessions or 0)
    sessions_taken = int(patient.sessions_taken or 0)
    remaining_sessions = max(
        approved_sessions - sessions_taken,
        0,
    )

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
        if normalize_patient_id(
            existing.patient_id
        ).casefold() == normalized_id.casefold():
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

    except (
        json.JSONDecodeError,
        UnicodeDecodeError,
        ValueError,
    ):
        return None, JsonResponse(
            {"error": "Invalid JSON object"},
            status=400,
        )

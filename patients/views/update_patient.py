
from django.db import IntegrityError, transaction
from django.http import JsonResponse

from patients.models import Patient

from .helpers import (
    _can_edit_patient,
    _duplicate_error,
    _find_duplicate_patient,
    _is_admin,
    _parse_json,
    _patient_to_dict,
    normalize_patient_id,
)


def update_patient(request, patient):
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
    new_patient_id = normalize_patient_id(
        data.get("patient_id")
    )

    if not name or not new_patient_id:
        return JsonResponse(
            {"error": "Name and patient ID are required"},
            status=400,
        )

    if _find_duplicate_patient(
        new_patient_id,
        exclude_id=patient.id,
    ):
        return _duplicate_error()

    try:
        approved_sessions = int(
            data.get("approved_sessions", 0)
        )
        sessions_taken = int(
            data.get("sessions_taken", 0)
        )

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
        (data.get("current_approval_number") or "").strip()
        or None
    )

    patient.approval_start_date = (
        data.get("approval_start_date") or None
    )

    patient.approval_expiry_date = (
        data.get("approval_expiry_date") or None
    )

    patient.approved_sessions = approved_sessions
    patient.sessions_taken = sessions_taken

    patient.taken_with = (
        (data.get("taken_with") or "").strip()
        or None
    )

    patient.current_future_appointments = (
        data.get("current_future_appointments") or None
    )

    patient.gender = (data.get("gender") or "").strip()

    patient.insurance_provider = (
        (data.get("insurance_provider") or "").strip()
        or None
    )

    if "approved_cpt_codes" in data:
        patient.approved_cpt_codes = (
            data.get("approved_cpt_codes") or []
        )

    try:
        with transaction.atomic():
            patient.save()

    except IntegrityError:
        return _duplicate_error()

    except ValueError as exc:
        return JsonResponse(
            {"error": str(exc)},
            status=400,
        )

    return JsonResponse({
        "success": True,
        "message": "Patient file updated successfully",
        "patient": _patient_to_dict(patient),
    })

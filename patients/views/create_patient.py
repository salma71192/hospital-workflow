
from django.db import IntegrityError, transaction
from django.http import JsonResponse

from patients.models import Patient

from .helpers import (
    _duplicate_error,
    _find_duplicate_patient,
    _parse_json,
    _patient_to_dict,
    normalize_patient_id,
)


def create_patient(request):
    data, error = _parse_json(request)

    if error:
        return error

    name = (data.get("name") or "").strip()
    patient_id = normalize_patient_id(
        data.get("patient_id")
    )

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
                    or (
                        "admin"
                        if request.user.is_superuser
                        else ""
                    )
                ),
            )

    except IntegrityError:
        return _duplicate_error()

    except ValueError as exc:
        return JsonResponse(
            {"error": str(exc)},
            status=400,
        )

    return JsonResponse(
        {
            "success": True,
            "message": "Patient file created successfully",
            "patient": _patient_to_dict(patient),
        },
        status=201,
    )

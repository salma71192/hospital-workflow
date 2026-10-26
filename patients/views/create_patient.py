import json

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
    patient_id = normalize_patient_id(data.get("patient_id"))
    gender = (data.get("gender") or "").strip()
    insurance_provider = (
        data.get("insurance_provider") or ""
    ).strip()

    # Validate required fields.
    if not name or not patient_id:
        return JsonResponse(
            {"error": "Name and patient ID are required"},
            status=400,
        )

    # Validate gender.
    allowed_genders = {"Male", "Female"}

    if gender not in allowed_genders:
        return JsonResponse(
            {"error": "Please select a valid gender: Male or Female"},
            status=400,
        )

    # Validate insurance provider.
    allowed_insurance_providers = {"Thiqa", "Daman"}

    if insurance_provider not in allowed_insurance_providers:
        return JsonResponse(
            {
                "error": (
                    "Please select a valid insurance provider: "
                    "Thiqa or Daman"
                )
            },
            status=400,
        )

    # Check for duplicate patient file numbers.
    if _find_duplicate_patient(patient_id):
        return _duplicate_error()

    try:
        with transaction.atomic():
            patient = Patient.objects.create(
                name=name,
                patient_id=patient_id,
                gender=gender,
                insurance_provider=insurance_provider,
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

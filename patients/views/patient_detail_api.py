
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from patients.models import Patient

from .delete_patient import delete_patient
from .helpers import (
    _is_admin,
    _parse_json,
    _patient_to_dict,
)
from .update_patient import update_patient


@csrf_exempt
def patient_detail_api(request, patient_id):
    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "Not authenticated"},
            status=401,
        )

    try:
        patient = Patient.objects.select_related(
            "registered_by"
        ).get(id=patient_id)

    except (Patient.DoesNotExist, ValueError, TypeError):
        return JsonResponse(
            {"error": "Patient not found"},
            status=404,
        )

    if request.method == "GET":
        if patient.is_archived and not _is_admin(request.user):
            return JsonResponse(
                {"error": "Patient file not found"},
                status=404,
            )

        return JsonResponse({
            "patient": _patient_to_dict(patient),
        })

    if request.method == "PUT":
        return update_patient(request, patient)

    if request.method == "POST":
        if not _is_admin(request.user):
            return JsonResponse(
                {
                    "error": (
                        "Only admin can archive or restore patient files"
                    )
                },
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
                patient.save(
                    update_fields=["is_archived", "archived_at"]
                )

            return JsonResponse({
                "success": True,
                "message": "Patient file archived successfully",
                "patient": _patient_to_dict(patient),
            })

        if action == "restore":
            if patient.is_archived:
                patient.is_archived = False
                patient.archived_at = None
                patient.save(
                    update_fields=["is_archived", "archived_at"]
                )

            return JsonResponse({
                "success": True,
                "message": "Patient file restored successfully",
                "patient": _patient_to_dict(patient),
            })

        return JsonResponse(
            {
                "error": (
                    "Unknown action. Use 'archive' or 'restore'."
                )
            },
            status=400,
        )

    if request.method == "DELETE":
        return delete_patient(request, patient)

    return JsonResponse(
        {"error": "Method not allowed"},
        status=405,
    )

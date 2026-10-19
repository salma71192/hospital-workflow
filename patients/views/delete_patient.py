
from django.db import IntegrityError, transaction
from django.http import JsonResponse

from callcenter.models import Appointment

from .helpers import _is_admin, _parse_json


def delete_patient(request, patient):
    if not _is_admin(request.user):
        return JsonResponse(
            {"error": "Only admin can permanently delete patient files"},
            status=403,
        )

    data, error = _parse_json(request)

    if error:
        return error

    if data.get("confirm") != patient.patient_id:
        return JsonResponse(
            {
                "error": (
                    "Deletion not confirmed. Send the patient's "
                    "exact file number in the 'confirm' field."
                )
            },
            status=400,
        )

    try:
        with transaction.atomic():
            appointments = Appointment.objects.filter(
                patient_id=patient.pk
            )

            appointments_deleted = appointments.count()
            appointments.delete()
            patient.delete()

    except IntegrityError:
        return JsonResponse(
            {
                "success": False,
                "error": (
                    "Deletion was blocked by another related record. "
                    "The transaction was rolled back. Inspect the related "
                    "models and their on_delete settings."
                ),
            },
            status=409,
        )

    return JsonResponse({
        "success": True,
        "message": (
            "Patient and deletable related records were permanently "
            "deleted."
        ),
        "appointments_deleted": appointments_deleted,
    })

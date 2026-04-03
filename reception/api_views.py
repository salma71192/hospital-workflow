from .api_assignments import therapists_api, staff_filters_api, assignments_api
from .api_tracker import physio_tracker_api, follow_up_required_api

from django.http import JsonResponse
from .models import PatientAssignment

__all__ = [
    "therapists_api",
    "staff_filters_api",
    "assignments_api",
    "physio_tracker_api",
    "follow_up_required_api",
    "last_therapist_api",
]


def last_therapist_api(request, patient_id):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authorized"}, status=403)

    last = (
        PatientAssignment.objects
        .filter(patient_id=patient_id)
        .order_by("-assignment_date", "-id")
        .select_related("therapist")
        .first()
    )

    if not last:
        return JsonResponse({"therapist": None})

    return JsonResponse({
        "therapist": {
            "id": last.therapist.id,
            "name": last.therapist.username,
        }
    })
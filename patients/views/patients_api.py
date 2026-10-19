
from django.db.models import Q
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from patients.models import Patient

from .create_patient import create_patient
from .helpers import (
    _can_create_patient,
    _is_admin,
    _patient_to_dict,
    normalize_patient_id,
)


@csrf_exempt
def patients_api(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "Not authenticated"},
            status=401,
        )

    if request.method == "GET":
        search = (request.GET.get("search") or "").strip()

        show_archived = (
            request.GET.get("archived", "").strip().lower()
            == "true"
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
                    {
                        "error": (
                            "Only admin can view archived patient files"
                        )
                    },
                    status=403,
                )

            if show_archived:
                patients_qs = patients_qs.filter(is_archived=True)

        else:
            patients_qs = patients_qs.filter(is_archived=False)

        if search:
            normalized_search = normalize_patient_id(
                search
            ).casefold()

            matching_ids = []

            for existing in Patient.objects.only(
                "id",
                "patient_id",
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
            for patient in patients_qs.order_by(
                "-created_at"
            ).distinct()
        ]

        return JsonResponse({"patients": patients})

    if request.method == "POST":
        if not _can_create_patient(request.user):
            return JsonResponse(
                {"error": "Not allowed to create patients"},
                status=403,
            )

        return create_patient(request)

    return JsonResponse(
        {"error": "Method not allowed"},
        status=405,
    )

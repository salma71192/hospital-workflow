import json

from django.db.models import Q
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from patients.models import Patient
from reception.models import PatientAssignment

from .create_patient import create_patient
from .helpers import (
    _can_create_patient,
    _is_admin,
    _patient_to_dict,
    normalize_patient_id,
)


# Existing specialty dropdown options.
VISIT_SPECIALITIES = {
    "Pediatrics",
    "Neuro",
    "TMJ",
    "Scoliosis",
    "Women Health - Pregnancy",
    "Women Health - Pelvic",
    "Lymphedema",
    "Lipodema",
    "Sports",
}


# Only therapists can manage visit specialties.
THERAPIST_ROLES = {
    "physio",
    "physiotherapist",
    "therapist",
    "pt",
}


def _can_manage_visit_speciality(user):
    """
    Allow only physiotherapists/therapists to manage
    the specialty of an individual visit.
    """
    if not user.is_authenticated:
        return False

    role = str(
        getattr(user, "role", "") or ""
    ).strip().lower()

    return role in THERAPIST_ROLES


@csrf_exempt
def update_visit_speciality_api(
    request,
    patient_id,
    assignment_id,
):
    """
    Add, update, or remove the specialty for one visit.

    POST/PATCH:
        {
            "speciality": "TMJ"
        }

    DELETE:
        Removes the specialty from this visit only.
    """

    # Authentication
    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "Not authenticated"},
            status=401,
        )

    # Therapist-only permission
    if not _can_manage_visit_speciality(request.user):
        return JsonResponse(
            {
                "error": (
                    "Only therapists can manage visit specialties"
                )
            },
            status=403,
        )

    # Allowed methods
    if request.method not in ("POST", "PATCH", "DELETE"):
        return JsonResponse(
            {"error": "Method not allowed"},
            status=405,
        )

    # Find the specific visit belonging to this patient.
    try:
        assignment = PatientAssignment.objects.get(
            id=assignment_id,
            patient_id=patient_id,
        )

    except PatientAssignment.DoesNotExist:
        return JsonResponse(
            {"error": "Visit record not found"},
            status=404,
        )

    # Remove specialty from this visit only.
    if request.method == "DELETE":
        assignment.speciality = ""

        assignment.save(
            update_fields=["speciality"]
        )

        return JsonResponse({
            "success": True,
            "message": "Specialty removed from this visit",
            "assignment_id": assignment.id,
            "speciality": "",
        })

    # Read request data.
    try:
        data = json.loads(
            request.body or "{}"
        )

    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse(
            {"error": "Invalid JSON data"},
            status=400,
        )

    if not isinstance(data, dict):
        return JsonResponse(
            {"error": "Invalid request data"},
            status=400,
        )

    speciality = str(
        data.get("speciality") or ""
    ).strip()

    # Validate specialty.
    if not speciality:
        return JsonResponse(
            {"error": "Please select a specialty"},
            status=400,
        )

    if speciality not in VISIT_SPECIALITIES:
        return JsonResponse(
            {
                "error": (
                    "Please select a valid specialty "
                    "from the existing list"
                )
            },
            status=400,
        )

    # Update only the selected visit.
    assignment.speciality = speciality

    assignment.save(
        update_fields=["speciality"]
    )

    return JsonResponse({
        "success": True,
        "message": "Specialty updated successfully",
        "assignment_id": assignment.id,
        "speciality": assignment.speciality,
    })


@csrf_exempt
def patients_api(request):

    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "Not authenticated"},
            status=401,
        )

    # GET: List and search patients.
    if request.method == "GET":

        search = (
            request.GET.get("search") or ""
        ).strip()

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

        # Archived patient access.
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
                patients_qs = patients_qs.filter(
                    is_archived=True
                )

        else:
            patients_qs = patients_qs.filter(
                is_archived=False
            )

        # Patient search.
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

                    matching_ids.append(
                        existing.id
                    )

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

        return JsonResponse({
            "patients": patients
        })

    # POST: Create patient.
    if request.method == "POST":

        if not _can_create_patient(request.user):
            return JsonResponse(
                {"error": "Not allowed to create patients"},
                status=403,
            )

        # Patient creation is handled by create_patient().
        # That function must validate and save insurance_provider.
        return create_patient(request)

    return JsonResponse(
        {"error": "Method not allowed"},
        status=405,
    )
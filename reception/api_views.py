import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model

from patients.models import Patient
from .models import PatientAssignment

User = get_user_model()


@csrf_exempt
def therapists_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    therapists = list(
        User.objects.filter(role="physio").values("id", "username")
    )
    return JsonResponse({"therapists": therapists})


@csrf_exempt
def assignments_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    if request.method == "GET":
        date_value = request.GET.get("date")
        role = getattr(request.user, "role", "")

        assignments_qs = PatientAssignment.objects.select_related("patient", "therapist")

        if date_value:
            assignments_qs = assignments_qs.filter(assignment_date=date_value)

        if role == "physio":
            assignments_qs = assignments_qs.filter(therapist=request.user)

        assignments = [
            {
                "id": item.id,
                "patient_id": item.patient.id,
                "patient_name": item.patient.name,
                "patient_file_id": item.patient.patient_id,
                "therapist_id": item.therapist.id,
                "therapist_name": item.therapist.username,
                "assignment_date": str(item.assignment_date),
                "notes": item.notes or "",
            }
            for item in assignments_qs
        ]

        return JsonResponse({"assignments": assignments})

    if request.method == "POST":
        if not (
            request.user.is_superuser
            or getattr(request.user, "role", "") in ["admin", "reception", "reception_supervisor"]
        ):
            return JsonResponse(
                {"error": "Only reception or admin can assign patients"},
                status=403,
            )

        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        patient_id = data.get("patient_id")
        therapist_id = data.get("therapist_id")
        assignment_date = data.get("assignment_date")
        notes = data.get("notes", "")

        if not patient_id or not therapist_id or not assignment_date:
            return JsonResponse(
                {"error": "Patient, therapist, and date are required"},
                status=400,
            )

        try:
            patient = Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            return JsonResponse({"error": "Patient not found"}, status=404)

        try:
            therapist = User.objects.get(id=therapist_id, role="physio")
        except User.DoesNotExist:
            return JsonResponse({"error": "Therapist not found"}, status=404)

        assignment = PatientAssignment.objects.create(
            patient=patient,
            therapist=therapist,
            assignment_date=assignment_date,
            notes=notes or None,
        )

        return JsonResponse({
            "success": True,
            "message": "Patient assigned successfully",
            "assignment": {
                "id": assignment.id,
                "patient_name": assignment.patient.name,
                "therapist_name": assignment.therapist.username,
                "assignment_date": str(assignment.assignment_date),
            },
        })

    return JsonResponse({"error": "Method not allowed"}, status=405)
import json
from datetime import datetime
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
def staff_filters_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    if not (request.user.is_superuser or getattr(request.user, "role", "") == "admin"):
        return JsonResponse({"error": "Only admin can view staff filters"}, status=403)

    receptionists = list(
        User.objects.filter(role__in=["reception", "reception_supervisor"])
        .values("id", "username", "role")
    )

    therapists = list(
        User.objects.filter(role="physio")
        .values("id", "username", "role")
    )

    return JsonResponse({
        "receptionists": receptionists,
        "therapists": therapists,
    })


@csrf_exempt
def assignments_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    if request.method == "GET":
        start_date = request.GET.get("start_date")
        end_date = request.GET.get("end_date")
        created_by_id = request.GET.get("created_by_id")
        therapist_id = request.GET.get("therapist_id")

        assignments_qs = PatientAssignment.objects.select_related(
            "patient", "therapist", "created_by"
        )

        if start_date:
            try:
                datetime.strptime(start_date, "%Y-%m-%d")
                assignments_qs = assignments_qs.filter(assignment_date__gte=start_date)
            except ValueError:
                return JsonResponse({"error": "Invalid start_date format"}, status=400)

        if end_date:
            try:
                datetime.strptime(end_date, "%Y-%m-%d")
                assignments_qs = assignments_qs.filter(assignment_date__lte=end_date)
            except ValueError:
                return JsonResponse({"error": "Invalid end_date format"}, status=400)

        role = getattr(request.user, "role", "")

        if request.user.is_superuser or role == "admin":
            # Admin must pick ONE filter, otherwise return empty list
            if created_by_id:
                assignments_qs = assignments_qs.filter(created_by_id=created_by_id)
            elif therapist_id:
                assignments_qs = assignments_qs.filter(therapist_id=therapist_id)
            else:
                assignments_qs = assignments_qs.none()

        elif role == "physio":
            assignments_qs = assignments_qs.filter(therapist=request.user)

        elif role == "reception":
            assignments_qs = assignments_qs.filter(created_by=request.user)

        assignments_qs = assignments_qs.order_by("-assignment_date", "-created_at")

        assignments = [
            {
                "id": item.id,
                "patient_id": item.patient.id,
                "patient_name": item.patient.name,
                "patient_file_id": item.patient.patient_id,
                "therapist_id": item.therapist.id,
                "therapist_name": item.therapist.username,
                "created_by_id": item.created_by.id if item.created_by else None,
                "created_by_name": item.created_by.username if item.created_by else "-",
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
            datetime.strptime(assignment_date, "%Y-%m-%d")
        except ValueError:
            return JsonResponse({"error": "Invalid assignment date format"}, status=400)

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
            created_by=request.user,
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
                "created_by_name": assignment.created_by.username if assignment.created_by else "-",
                "assignment_date": str(assignment.assignment_date),
            },
        })

    return JsonResponse({"error": "Method not allowed"}, status=405)
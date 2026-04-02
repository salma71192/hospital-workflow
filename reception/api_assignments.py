from datetime import date
import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from patients.models import Patient
from .models import PatientAssignment
from .api_helpers import User, is_admin, parse_date


def therapists_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    therapists = User.objects.filter(role="physio").values("id", "username")
    return JsonResponse({"therapists": list(therapists)})


def staff_filters_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    users = User.objects.exclude(role="visitor").values(
        "id", "username", "role"
    )
    return JsonResponse({"users": list(users)})


@csrf_exempt
def assignments_api(request, assignment_id=None):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    role = (getattr(request.user, "role", "") or "").strip().lower()
    admin = is_admin(request.user)

    if request.method == "GET":
        start_date = parse_date(request.GET.get("start_date"))
        end_date = parse_date(request.GET.get("end_date"))

        qs = PatientAssignment.objects.select_related("patient", "therapist", "created_by")

        if start_date:
            qs = qs.filter(assignment_date__gte=start_date)
        if end_date:
            qs = qs.filter(assignment_date__lte=end_date)

        viewed_user_id = request.GET.get("viewed_user_id")
        viewed_user_role = (request.GET.get("viewed_user_role") or "").strip().lower()

        if admin:
            if viewed_user_id and viewed_user_role == "physio":
                qs = qs.filter(therapist_id=viewed_user_id)
            elif viewed_user_id and viewed_user_role == "reception":
                qs = qs.filter(created_by_id=viewed_user_id)
        elif role == "physio":
            qs = qs.filter(therapist=request.user)
        elif role == "reception":
            qs = qs.filter(created_by=request.user)

        assignments = [
            {
                "id": a.id,
                "patient_id": a.patient.id,
                "patient_name": a.patient.name,
                "patient_file_id": a.patient.patient_id,
                "therapist_id": a.therapist.id if a.therapist else None,
                "therapist_name": a.therapist.username if a.therapist else "-",
                "assignment_date": str(a.assignment_date),
                "category": a.category,
                "category_label": a.get_category_display() if hasattr(a, "get_category_display") else a.category,
                "notes": a.notes or "",
                "created_by_id": a.created_by.id if a.created_by else None,
                "created_by_name": a.created_by.username if a.created_by else "",
                "can_edit_today": a.assignment_date == date.today(),
                "can_cancel_today": a.assignment_date == date.today(),
            }
            for a in qs.order_by("-assignment_date", "-created_at")
        ]

        return JsonResponse({"assignments": assignments})

    if request.method == "POST":
        if role not in ["reception", "admin", "reception_supervisor"] and not admin:
            return JsonResponse({"error": "Not allowed"}, status=403)

        try:
            data = json.loads(request.body)
        except Exception:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        patient_id = data.get("patient_id")
        therapist_id = data.get("therapist_id")
        category = data.get("category", "appointment")
        notes = data.get("notes", "")

        if not patient_id or not therapist_id:
            return JsonResponse({"error": "Missing fields"}, status=400)

        try:
            patient = Patient.objects.get(id=patient_id)
            therapist = User.objects.get(id=therapist_id, role="physio")
        except Exception:
            return JsonResponse({"error": "Invalid patient or therapist"}, status=400)

        today = date.today()

        if PatientAssignment.objects.filter(
            patient=patient,
            assignment_date=today,
        ).exists():
            return JsonResponse(
                {"error": "This patient is already assigned today"},
                status=400,
            )

        assignment = PatientAssignment.objects.create(
            patient=patient,
            therapist=therapist,
            assignment_date=today,
            category=category,
            notes=notes,
            created_by=request.user,
        )

        return JsonResponse({
            "success": True,
            "message": "Patient assigned successfully",
            "id": assignment.id,
        })

    if request.method == "PUT":
        try:
            assignment = PatientAssignment.objects.get(id=assignment_id)
        except PatientAssignment.DoesNotExist:
            return JsonResponse({"error": "Not found"}, status=404)

        if not admin and assignment.assignment_date != date.today():
            return JsonResponse({"error": "You can only edit today's assignments"}, status=403)

        if not admin and assignment.created_by != request.user:
            return JsonResponse({"error": "Not allowed"}, status=403)

        try:
            data = json.loads(request.body)
        except Exception:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        therapist_id = data.get("therapist_id")
        category = data.get("category", assignment.category)
        notes = data.get("notes", "")

        if therapist_id:
            try:
                assignment.therapist = User.objects.get(id=therapist_id, role="physio")
            except Exception:
                return JsonResponse({"error": "Invalid therapist"}, status=400)

        assignment.category = category
        assignment.notes = notes
        assignment.save()

        return JsonResponse({
            "success": True,
            "message": "Assignment updated successfully",
        })

    if request.method == "DELETE":
        try:
            assignment = PatientAssignment.objects.get(id=assignment_id)
        except PatientAssignment.DoesNotExist:
            return JsonResponse({"error": "Not found"}, status=404)

        if not admin and assignment.assignment_date != date.today():
            return JsonResponse({"error": "Cannot delete past assignments"}, status=403)

        if not admin and assignment.created_by != request.user:
            return JsonResponse({"error": "Not allowed"}, status=403)

        assignment.delete()
        return JsonResponse({"success": True, "message": "Assignment cancelled successfully"})

    return JsonResponse({"error": "Method not allowed"}, status=405)
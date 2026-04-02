import json
from datetime import date
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from patients.models import Patient
from .models import PatientAssignment

User = get_user_model()


def _is_admin(user):
    role = (getattr(user, "role", "") or "").strip().lower()
    return user.is_superuser or role == "admin"


def _can_assign(user):
    role = (getattr(user, "role", "") or "").strip().lower()
    return user.is_superuser or role in ["admin", "reception", "reception_supervisor"]


def _same_day_edit_allowed(user, assignment):
    role = (getattr(user, "role", "") or "").strip().lower()
    today = date.today()

    if user.is_superuser or role == "admin":
        return True

    if role in ["reception", "reception_supervisor"]:
        return assignment.assignment_date == today

    return False


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

    if not _is_admin(request.user):
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
def assignments_api(request, assignment_id=None):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    if request.method == "GET":
        start_date = request.GET.get("start_date")
        end_date = request.GET.get("end_date")
        created_by_id = request.GET.get("created_by_id")
        therapist_id = request.GET.get("therapist_id")
        viewed_user_id = request.GET.get("viewed_user_id")
        viewed_user_role = (request.GET.get("viewed_user_role") or "").strip().lower()

        assignments_qs = PatientAssignment.objects.select_related(
            "patient", "therapist", "created_by"
        )

        if assignment_id is not None:
            assignments_qs = assignments_qs.filter(id=assignment_id)

        if start_date:
            assignments_qs = assignments_qs.filter(assignment_date__gte=start_date)

        if end_date:
            assignments_qs = assignments_qs.filter(assignment_date__lte=end_date)

        role = (getattr(request.user, "role", "") or "").strip().lower()
        is_admin = _is_admin(request.user)

        if is_admin:
            if created_by_id:
                assignments_qs = assignments_qs.filter(created_by_id=created_by_id)
            if therapist_id:
                assignments_qs = assignments_qs.filter(therapist_id=therapist_id)

            if viewed_user_id and viewed_user_role == "physio":
                assignments_qs = assignments_qs.filter(therapist_id=viewed_user_id)
            elif viewed_user_id and viewed_user_role == "reception":
                assignments_qs = assignments_qs.filter(created_by_id=viewed_user_id)

        elif role == "physio":
            assignments_qs = assignments_qs.filter(therapist_id=request.user.id)

        elif role == "reception":
            assignments_qs = assignments_qs.filter(created_by_id=request.user.id)

        elif role == "reception_supervisor":
            pass

        else:
            return JsonResponse(
                {"error": f"Unauthorized role for assignments: {role}"},
                status=403,
            )

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
                "category": item.category,
                "category_label": item.get_category_display(),
                "notes": item.notes or "",
                "can_edit_today": _same_day_edit_allowed(request.user, item),
                "can_cancel_today": _same_day_edit_allowed(request.user, item),
            }
            for item in assignments_qs
        ]

        if assignment_id is not None:
            if not assignments:
                return JsonResponse({"error": "Assignment not found"}, status=404)
            return JsonResponse({"assignment": assignments[0]})

        return JsonResponse({"assignments": assignments})

    if request.method == "POST":
        if not _can_assign(request.user):
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
        category = data.get("category", "appointment")
        notes = data.get("notes", "")
        today = date.today()

        valid_categories = [
            "appointment",
            "walk_in",
            "initial_evaluation",
            "task_without_eligibility",
        ]

        if not patient_id or not therapist_id:
            return JsonResponse(
                {"error": "Patient and therapist are required"},
                status=400,
            )

        if category not in valid_categories:
            return JsonResponse({"error": "Invalid category"}, status=400)

        try:
            patient = Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            return JsonResponse({"error": "Patient not found"}, status=404)

        try:
            therapist = User.objects.get(id=therapist_id, role="physio")
        except User.DoesNotExist:
            return JsonResponse({"error": "Therapist not found"}, status=404)

        # explicit duplicate prevention
        existing = PatientAssignment.objects.filter(
            patient=patient,
            assignment_date=today,
        ).exists()

        if existing:
            return JsonResponse(
                {"error": "This patient is already assigned today"},
                status=400,
            )

        try:
            assignment = PatientAssignment.objects.create(
                patient=patient,
                therapist=therapist,
                created_by=request.user,
                assignment_date=today,
                category=category,
                notes=notes or None,
            )
        except IntegrityError:
            return JsonResponse(
                {"error": "This patient is already assigned today"},
                status=400,
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
                "category": assignment.category,
                "category_label": assignment.get_category_display(),
            },
        })

    if request.method == "PUT":
        if assignment_id is None:
            return JsonResponse({"error": "Assignment ID is required"}, status=400)

        try:
            assignment = PatientAssignment.objects.get(id=assignment_id)
        except PatientAssignment.DoesNotExist:
            return JsonResponse({"error": "Assignment not found"}, status=404)

        if not _same_day_edit_allowed(request.user, assignment):
            return JsonResponse(
                {"error": "You can only edit assignments for today"},
                status=403,
            )

        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        therapist_id = data.get("therapist_id", assignment.therapist_id)
        category = data.get("category", assignment.category)
        notes = data.get("notes", assignment.notes or "")

        valid_categories = [
            "appointment",
            "walk_in",
            "initial_evaluation",
            "task_without_eligibility",
        ]

        if category not in valid_categories:
            return JsonResponse({"error": "Invalid category"}, status=400)

        try:
            therapist = User.objects.get(id=therapist_id, role="physio")
        except User.DoesNotExist:
            return JsonResponse({"error": "Therapist not found"}, status=404)

        assignment.therapist = therapist
        assignment.category = category
        assignment.notes = notes or None
        # force same original day / no day changes by reception
        assignment.assignment_date = assignment.assignment_date

        try:
            assignment.save()
        except IntegrityError:
            return JsonResponse(
                {"error": "This patient is already assigned today"},
                status=400,
            )

        return JsonResponse({
            "success": True,
            "message": "Assignment updated successfully",
        })

    if request.method == "DELETE":
        if assignment_id is None:
            return JsonResponse({"error": "Assignment ID is required"}, status=400)

        try:
            assignment = PatientAssignment.objects.get(id=assignment_id)
        except PatientAssignment.DoesNotExist:
            return JsonResponse({"error": "Assignment not found"}, status=404)

        if not _same_day_edit_allowed(request.user, assignment):
            return JsonResponse(
                {"error": "You can only cancel assignments for today"},
                status=403,
            )

        assignment.delete()
        return JsonResponse({
            "success": True,
            "message": "Assignment cancelled successfully",
        })

    return JsonResponse({"error": "Method not allowed"}, status=405)
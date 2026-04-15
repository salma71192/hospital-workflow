from datetime import timedelta
import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from patients.models import Patient
from callcenter.models import Appointment
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


def _mark_today_appointment_attended(patient, therapist, marked_by):
    today_value = timezone.localdate()

    appointment = (
        Appointment.objects
        .select_related("patient")
        .filter(
            patient=patient,
            appointment_date=today_value,
        )
        .order_by("appointment_time", "id")
        .first()
    )

    if not appointment:
        return None

    therapist_changed = str(appointment.therapist_id) != str(therapist.id)
    already_attended = getattr(appointment, "attendance_status", "") == "attended"

    updated_fields = []

    if therapist_changed:
        appointment.therapist = therapist
        updated_fields.append("therapist")

    if hasattr(appointment, "attendance_status") and hasattr(appointment, "attended_at"):
        if not already_attended:
            appointment.attendance_status = "attended"
            appointment.attended_at = timezone.now()
            updated_fields.extend(["attendance_status", "attended_at"])

            patient.sessions_taken = int(patient.sessions_taken or 0) + 1
            patient.taken_with = therapist.username
            patient.save(update_fields=["sessions_taken", "taken_with"])
        else:
            patient.taken_with = therapist.username
            patient.save(update_fields=["taken_with"])
    else:
        patient.taken_with = therapist.username
        patient.save(update_fields=["taken_with"])

    if updated_fields:
        appointment.save(update_fields=updated_fields)

    return appointment


@csrf_exempt
def assignments_api(request, assignment_id=None):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    role = (getattr(request.user, "role", "") or "").strip().lower()
    admin = is_admin(request.user)
    today_value = timezone.localdate()

    # =========================
    # GET
    # =========================
    if request.method == "GET":
        start_date = parse_date(request.GET.get("start_date"))
        end_date = parse_date(request.GET.get("end_date"))

        # Default tracker = current month
        if not start_date and not end_date:
            start_date = today_value.replace(day=1)

            if start_date.month == 12:
                next_month = start_date.replace(
                    year=start_date.year + 1,
                    month=1,
                    day=1,
                )
            else:
                next_month = start_date.replace(
                    month=start_date.month + 1,
                    day=1,
                )

            end_date = next_month - timedelta(days=1)

        elif start_date and not end_date:
            end_date = start_date

        elif end_date and not start_date:
            start_date = end_date

        qs = PatientAssignment.objects.select_related(
            "patient",
            "therapist",
            "created_by",
        )

        if start_date:
            qs = qs.filter(assignment_date__gte=start_date)

        if end_date:
            qs = qs.filter(assignment_date__lte=end_date)

        user_id = (request.GET.get("user_id") or "").strip()
        therapist_id = (request.GET.get("therapist_id") or "").strip()
        patient_search = (request.GET.get("patient") or "").strip()

        if user_id and user_id != "all":
            qs = qs.filter(created_by_id=user_id)

        if therapist_id and therapist_id != "all":
            qs = qs.filter(therapist_id=therapist_id)

        if patient_search:
            qs = qs.filter(
                Q(patient__name__icontains=patient_search) |
                Q(patient__patient_id__icontains=patient_search)
            )

        viewed_user_id = (request.GET.get("viewed_user_id") or "").strip()
        viewed_user_role = (request.GET.get("viewed_user_role") or "").strip().lower()

        if admin:
            if viewed_user_id and viewed_user_role == "physio":
                qs = qs.filter(therapist_id=viewed_user_id)
            elif viewed_user_id and viewed_user_role in ["reception", "reception_supervisor"]:
                qs = qs.filter(created_by_id=viewed_user_id)

        elif role == "physio":
            qs = qs.filter(therapist=request.user)

        elif role in ["reception", "reception_supervisor"]:
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
                "can_edit_today": a.assignment_date == today_value,
                "can_cancel_today": a.assignment_date == today_value,
            }
            for a in qs.order_by("-assignment_date", "-created_at")
        ]

        agents = list(
            User.objects.filter(
                role__in=["reception", "reception_supervisor", "admin"]
            ).values("id", "username", "role")
        )

        therapists = list(
            User.objects.filter(role="physio").values("id", "username")
        )

        return JsonResponse({
            "assignments": assignments,
            "agents": agents,
            "therapists": therapists,
            "start_date": str(start_date) if start_date else "",
            "end_date": str(end_date) if end_date else "",
        })

    # =========================
    # POST
    # =========================
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

        if PatientAssignment.objects.filter(
            patient=patient,
            assignment_date=today_value,
        ).exists():
            return JsonResponse(
                {"error": "This patient is already assigned today"},
                status=400,
            )

        with transaction.atomic():
            assignment = PatientAssignment.objects.create(
                patient=patient,
                therapist=therapist,
                assignment_date=today_value,
                category=category,
                notes=notes,
                created_by=request.user,
            )

            _mark_today_appointment_attended(
                patient=patient,
                therapist=therapist,
                marked_by=request.user,
            )

        return JsonResponse({
            "success": True,
            "message": "Patient assigned successfully",
            "id": assignment.id,
        })

    # =========================
    # PUT
    # =========================
    if request.method == "PUT":
        try:
            assignment = PatientAssignment.objects.select_related(
                "patient",
                "therapist",
            ).get(id=assignment_id)
        except PatientAssignment.DoesNotExist:
            return JsonResponse({"error": "Not found"}, status=404)

        if assignment.assignment_date != today_value and not admin:
            return JsonResponse({"error": "You can only edit today's assignments"}, status=403)

        can_edit_assignment = admin or role in [
            "reception",
            "reception_supervisor",
        ]

        if not can_edit_assignment:
            return JsonResponse({"error": "Not allowed"}, status=403)

        try:
            data = json.loads(request.body)
        except Exception:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        therapist_id = data.get("therapist_id")
        category = data.get("category", assignment.category)
        notes = data.get("notes", "")

        new_therapist = assignment.therapist
        if therapist_id:
            try:
                new_therapist = User.objects.get(id=therapist_id, role="physio")
            except Exception:
                return JsonResponse({"error": "Invalid therapist"}, status=400)

        with transaction.atomic():
            assignment.therapist = new_therapist
            assignment.category = category
            assignment.notes = notes
            assignment.save()

            _mark_today_appointment_attended(
                patient=assignment.patient,
                therapist=new_therapist,
                marked_by=request.user,
            )

        return JsonResponse({
            "success": True,
            "message": "Assignment updated successfully",
        })

    # =========================
    # DELETE
    # =========================
    if request.method == "DELETE":
        try:
            assignment = PatientAssignment.objects.get(id=assignment_id)
        except PatientAssignment.DoesNotExist:
            return JsonResponse({"error": "Not found"}, status=404)

        if not admin and assignment.assignment_date != today_value:
            return JsonResponse({"error": "Cannot delete past assignments"}, status=403)

        can_delete_assignment = admin or role in [
            "reception",
            "reception_supervisor",
        ]

        if not can_delete_assignment:
            return JsonResponse({"error": "Not allowed"}, status=403)

        assignment.delete()
        return JsonResponse({
            "success": True,
            "message": "Assignment cancelled successfully",
        })

    return JsonResponse({"error": "Method not allowed"}, status=405)
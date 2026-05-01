from .api_assignments import therapists_api, staff_filters_api, assignments_api
from .api_tracker import physio_tracker_api, follow_up_required_api

from django.contrib.auth import get_user_model
from django.db.models import Q
from django.http import JsonResponse
from django.utils import timezone

from patients.models import Patient
from callcenter.models import Appointment
from .models import PatientAssignment

User = get_user_model()

__all__ = [
    "therapists_api",
    "staff_filters_api",
    "assignments_api",
    "physio_tracker_api",
    "follow_up_required_api",
    "last_therapist_api",
    "leaderboard_api",
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

    if not last or not last.therapist:
        return JsonResponse({"therapist": None})

    return JsonResponse({
        "therapist": {
            "id": last.therapist.id,
            "name": last.therapist.username,
        }
    })


def leaderboard_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authorized"}, status=403)

    scope = (request.GET.get("scope") or "reception").strip().lower()

    today = timezone.localdate()
    month_start = today.replace(day=1)

    rows = []

    if scope == "callcenter":
        users = User.objects.filter(
            Q(role__icontains="callcenter")
            | Q(role__icontains="call_center")
            | Q(role__icontains="call center")
            | Q(role__icontains="call")
        ).order_by("username")

        for user in users:
            today_count = Appointment.objects.filter(
                created_by=user,
                created_at__date=today,
            ).count()

            monthly_count = Appointment.objects.filter(
                created_by=user,
                created_at__date__gte=month_start,
                created_at__date__lte=today,
            ).count()

            rows.append({
                "user_id": user.id,
                "name": getattr(user, "name", None) or user.username,
                "username": user.username,
                "role": user.role,
                "today": today_count,
                "monthly": monthly_count,
                "count": monthly_count,
                "target": 100,
                "conversion": 100 if monthly_count > 0 else 0,
            })

    elif scope == "reception":
        users = User.objects.filter(
            Q(role__icontains="reception")
            | Q(role__icontains="admin")
        ).order_by("username")

        for user in users:
            today_files = Patient.objects.filter(
                created_by=user,
                created_at__date=today,
            ).count()

            monthly_files = Patient.objects.filter(
                created_by=user,
                created_at__date__gte=month_start,
                created_at__date__lte=today,
            ).count()

            today_assignments = PatientAssignment.objects.filter(
                created_by=user,
                assignment_date=today,
            ).count()

            monthly_assignments = PatientAssignment.objects.filter(
                created_by=user,
                assignment_date__gte=month_start,
                assignment_date__lte=today,
            ).count()

            today_total = today_files + today_assignments
            monthly_total = monthly_files + monthly_assignments

            rows.append({
                "user_id": user.id,
                "name": getattr(user, "name", None) or user.username,
                "username": user.username,
                "role": user.role,
                "today": today_total,
                "monthly": monthly_total,
                "count": monthly_total,
                "target": 100,
                "conversion": 100 if monthly_total > 0 else 0,
                "new_files": monthly_files,
                "assignments": monthly_assignments,
            })

    elif scope == "physio":
        users = User.objects.filter(
            Q(role__icontains="physio")
            | Q(role__icontains="physiotherapist")
        ).order_by("username")

        for user in users:
            today_appointments = Appointment.objects.filter(
                therapist=user,
                appointment_date=today,
            ).count()

            monthly_appointments = Appointment.objects.filter(
                therapist=user,
                appointment_date__gte=month_start,
                appointment_date__lte=today,
            ).count()

            today_attended = Appointment.objects.filter(
                therapist=user,
                appointment_date=today,
                attendance_status="attended",
            ).count()

            monthly_attended = Appointment.objects.filter(
                therapist=user,
                appointment_date__gte=month_start,
                appointment_date__lte=today,
                attendance_status="attended",
            ).count()

            conversion = (
                round((monthly_attended / monthly_appointments) * 100)
                if monthly_appointments
                else 0
            )

            rows.append({
                "user_id": user.id,
                "name": getattr(user, "name", None) or user.username,
                "username": user.username,
                "role": user.role,
                "today": today_appointments,
                "monthly": monthly_appointments,
                "count": monthly_appointments,
                "target": 100,
                "completed": monthly_attended,
                "total": monthly_appointments,
                "conversion": conversion,
            })

    else:
        return JsonResponse({"error": "Invalid scope"}, status=400)

    rows = sorted(rows, key=lambda row: row["monthly"], reverse=True)

    return JsonResponse({
        "scope": scope,
        "date": str(today),
        "leaderboard": rows,
    })
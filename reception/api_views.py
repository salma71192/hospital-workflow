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


def get_user_display_name(user):
    try:
        if getattr(user, "name", None):
            return user.name

        if getattr(user, "full_name", None):
            return user.full_name

        if hasattr(user, "get_full_name"):
            full_name = user.get_full_name()
            if full_name:
                return full_name

        return user.username
    except Exception:
        return getattr(user, "username", "Unknown User")


def get_user_role(user):
    return (getattr(user, "role", "") or "").strip()


def get_users_by_roles(role_query):
    return User.objects.filter(role_query).exclude(role__isnull=True).order_by("username")


def safe_count(model, **filters):
    try:
        return model.objects.filter(**filters).count()
    except Exception as e:
        print("LEADERBOARD COUNT ERROR:", model.__name__, filters, str(e))
        return 0


def leaderboard_api(request):
    try:
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Not authorized"}, status=403)

        scope = (request.GET.get("scope") or "reception").strip().lower()

        today = timezone.localdate()
        month_start = today.replace(day=1)

        rows = []

        if scope == "callcenter":
            users = get_users_by_roles(
                Q(role__iexact="callcenter")
                | Q(role__iexact="callcenter_supervisor")
                | Q(role__iexact="call_center")
                | Q(role__iexact="call_center_supervisor")
            )

            for user in users:
                today_count = safe_count(
                    Appointment,
                    created_by_id=user.id,
                    created_at__date=today,
                )

                monthly_count = safe_count(
                    Appointment,
                    created_by_id=user.id,
                    created_at__date__gte=month_start,
                    created_at__date__lte=today,
                )

                rows.append({
                    "user_id": user.id,
                    "name": get_user_display_name(user),
                    "username": user.username,
                    "role": get_user_role(user),
                    "today": today_count,
                    "monthly": monthly_count,
                    "count": monthly_count,
                    "target": 100,
                    "conversion": 100 if monthly_count > 0 else 0,
                })

        elif scope == "reception":
            users = get_users_by_roles(
                Q(role__iexact="reception")
                | Q(role__iexact="receptionist")
                | Q(role__iexact="reception_supervisor")
                | Q(role__iexact="frontdesk")
                | Q(role__iexact="front_desk")
                | Q(role__iexact="registration")
            )

            for user in users:
                today_files = safe_count(
                    Patient,
                    created_by_id=user.id,
                    created_at__date=today,
                )

                monthly_files = safe_count(
                    Patient,
                    created_by_id=user.id,
                    created_at__date__gte=month_start,
                    created_at__date__lte=today,
                )

                today_assignments = safe_count(
                    PatientAssignment,
                    created_by_id=user.id,
                    assignment_date=today,
                )

                monthly_assignments = safe_count(
                    PatientAssignment,
                    created_by_id=user.id,
                    assignment_date__gte=month_start,
                    assignment_date__lte=today,
                )

                today_total = today_files + today_assignments
                monthly_total = monthly_files + monthly_assignments

                rows.append({
                    "user_id": user.id,
                    "name": get_user_display_name(user),
                    "username": user.username,
                    "role": get_user_role(user),
                    "today": today_total,
                    "monthly": monthly_total,
                    "count": monthly_total,
                    "target": 100,
                    "conversion": 100 if monthly_total > 0 else 0,
                    "new_files": monthly_files,
                    "assignments": monthly_assignments,
                })

        elif scope == "physio":
            users = get_users_by_roles(
                Q(role__iexact="physio")
                | Q(role__iexact="physiotherapist")
                | Q(role__iexact="therapist")
                | Q(role__iexact="pt")
            )

            for user in users:
                today_appointments = safe_count(
                    Appointment,
                    therapist_id=user.id,
                    appointment_date=today,
                )

                monthly_appointments = safe_count(
                    Appointment,
                    therapist_id=user.id,
                    appointment_date__gte=month_start,
                    appointment_date__lte=today,
                )

                monthly_attended = safe_count(
                    Appointment,
                    therapist_id=user.id,
                    appointment_date__gte=month_start,
                    appointment_date__lte=today,
                    attendance_status="attended",
                )

                today_assignments = safe_count(
                    PatientAssignment,
                    therapist_id=user.id,
                    assignment_date=today,
                )

                monthly_assignments = safe_count(
                    PatientAssignment,
                    therapist_id=user.id,
                    assignment_date__gte=month_start,
                    assignment_date__lte=today,
                )

                today_total = today_appointments + today_assignments
                monthly_total = monthly_appointments + monthly_assignments

                conversion = (
                    round((monthly_attended / monthly_appointments) * 100)
                    if monthly_appointments
                    else 0
                )

                rows.append({
                    "user_id": user.id,
                    "name": get_user_display_name(user),
                    "username": user.username,
                    "role": get_user_role(user),
                    "today": today_total,
                    "monthly": monthly_total,
                    "count": monthly_total,
                    "target": 100,
                    "completed": monthly_attended,
                    "total": monthly_appointments,
                    "conversion": conversion,
                    "appointments": monthly_appointments,
                    "assignments": monthly_assignments,
                })

        else:
            return JsonResponse({"error": "Invalid scope"}, status=400)

        rows = sorted(rows, key=lambda row: row["monthly"], reverse=True)

        return JsonResponse({
            "scope": scope,
            "date": str(today),
            "leaderboard": rows,
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            "error": "Server error",
            "details": str(e),
        }, status=500)
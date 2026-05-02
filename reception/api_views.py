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


# ================= LAST THERAPIST =================

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


# ================= LEADERBOARD =================

def get_user_display_name(user):
    return (
        getattr(user, "name", None)
        or getattr(user, "full_name", None)
        or user.get_full_name()
        or user.username
    )


def get_users_from_ids_and_roles(user_ids, role_query):
    role_ids = User.objects.filter(role_query).values_list("id", flat=True)
    all_ids = set(user_ids)
    all_ids.update(role_ids)
    return User.objects.filter(id__in=all_ids).order_by("username")


def leaderboard_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authorized"}, status=403)

    scope = (request.GET.get("scope") or "reception").strip().lower()

    today = timezone.localdate()
    month_start = today.replace(day=1)

    rows = []

    # ================= CALL CENTER =================
    if scope == "callcenter":
        activity_user_ids = Appointment.objects.filter(
            created_by__isnull=False,
        ).values_list("created_by_id", flat=True)

        users = get_users_from_ids_and_roles(
            activity_user_ids,
            Q(role__icontains="callcenter")
            | Q(role__icontains="call_center")
            | Q(role__icontains="call center")
            | Q(role__icontains="call"),
        )

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
                "name": get_user_display_name(user),
                "username": user.username,
                "role": user.role,
                "today": today_count,
                "monthly": monthly_count,
                "count": monthly_count,
                "target": 100,
                "conversion": 100 if monthly_count > 0 else 0,
            })

    # ================= RECEPTION =================
    elif scope == "reception":
        activity_user_ids = set()

        activity_user_ids.update(
            Patient.objects.filter(created_by__isnull=False)
            .values_list("created_by_id", flat=True)
        )

        activity_user_ids.update(
            PatientAssignment.objects.filter(created_by__isnull=False)
            .values_list("created_by_id", flat=True)
        )

        users = get_users_from_ids_and_roles(
            activity_user_ids,
            Q(role__icontains="reception")
            | Q(role__icontains="receptionist")
            | Q(role__icontains="frontdesk")
            | Q(role__icontains="front_desk")
            | Q(role__icontains="front desk")
            | Q(role__icontains="registration")
            | Q(role__icontains="admin"),
        )

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
                "name": get_user_display_name(user),
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

    # ================= PHYSIO =================
    elif scope == "physio":
        activity_user_ids = set()

        activity_user_ids.update(
            Appointment.objects.filter(therapist__isnull=False)
            .values_list("therapist_id", flat=True)
        )

        activity_user_ids.update(
            PatientAssignment.objects.filter(therapist__isnull=False)
            .values_list("therapist_id", flat=True)
        )

        users = get_users_from_ids_and_roles(
            activity_user_ids,
            Q(role__icontains="physio")
            | Q(role__icontains="physiotherapist")
            | Q(role__icontains="therapist")
            | Q(role__icontains="pt"),
        )

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

            monthly_attended = Appointment.objects.filter(
                therapist=user,
                appointment_date__gte=month_start,
                appointment_date__lte=today,
                attendance_status="attended",
            ).count()

            today_assignments = PatientAssignment.objects.filter(
                therapist=user,
                assignment_date=today,
            ).count()

            monthly_assignments = PatientAssignment.objects.filter(
                therapist=user,
                assignment_date__gte=month_start,
                assignment_date__lte=today,
            ).count()

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
                "role": user.role,
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
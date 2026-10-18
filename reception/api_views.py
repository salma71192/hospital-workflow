from datetime import datetime
import traceback
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.http import JsonResponse
from django.utils import timezone
from patients.models import Patient
from callcenter.models import Appointment
from .models import PatientAssignment
from .api_assignments import (
    therapists_api,
    staff_filters_api,
    assignments_api,
)
from .api_tracker import (
    physio_tracker_api,
    follow_up_required_api,
)
User = get_user_model()
__all__ = [
    "therapists_api",
    "staff_filters_api",
    "assignments_api",
    "physio_tracker_api",
    "follow_up_required_api",
    "last_therapist_api",
    "leaderboard_api",
    "evaluation_tracker_api",
]
def get_user_display_name(user):
    """Return the user's display name, falling back to username."""
    try:
        name = getattr(user, "name", None)
        if name:
            return name
        full_name = getattr(user, "full_name", None)
        if full_name:
            return full_name
        if hasattr(user, "get_full_name"):
            full_name = user.get_full_name()
            if full_name:
                return full_name
        return getattr(user, "username", "Unknown User")
    except Exception:
        return getattr(user, "username", "Unknown User")
def get_user_role(user):
    return (getattr(user, "role", "") or "").strip()
def get_users_by_roles(role_query):
    return (
        User.objects.filter(role_query)
        .exclude(role__isnull=True)
        .order_by("username")
    )
def safe_count(model, **filters):
    """Count matching records without crashing the entire leaderboard."""
    try:
        return model.objects.filter(**filters).count()
    except Exception as exc:
        print(
            "LEADERBOARD COUNT ERROR:",
            model.__name__,
            filters,
            str(exc),
        )
        return 0
def is_admin_user(user):
    role = (getattr(user, "role", "") or "").strip().lower()
    return user.is_superuser or role == "admin"
def evaluation_tracker_api(request):
    """
    Return initial-evaluation counts and details for each physiotherapist.
    Optional query parameters:
        start_date=YYYY-MM-DD
        end_date=YYYY-MM-DD
    """
    try:
        if not request.user.is_authenticated:
            return JsonResponse(
                {"error": "Not authorized"},
                status=403,
            )
        current_role = (
            getattr(request.user, "role", "") or ""
        ).strip().lower()
        allowed_roles = {
            "admin",
            "reception",
            "receptionist",
            "reception_supervisor",
            "frontdesk",
            "front_desk",
            "registration",
        }
        if not (
            request.user.is_superuser
            or current_role in allowed_roles
        ):
            return JsonResponse(
                {
                    "error": (
                        "You do not have permission to view "
                        "evaluation data"
                    )
                },
                status=403,
            )
        today = timezone.localdate()
        start_value = request.GET.get("start_date")
        end_value = request.GET.get("end_date")
        try:
            start_date = (
                datetime.strptime(start_value, "%Y-%m-%d").date()
                if start_value
                else today.replace(day=1)
            )
            end_date = (
                datetime.strptime(end_value, "%Y-%m-%d").date()
                if end_value
                else today
            )
        except (TypeError, ValueError):
            return JsonResponse(
                {"error": "Invalid date format. Use YYYY-MM-DD."},
                status=400,
            )
        if start_date > end_date:
            return JsonResponse(
                {"error": "Start date cannot be after end date."},
                status=400,
            )
        physio_roles = (
            Q(role__iexact="physio")
            | Q(role__iexact="physiotherapist")
            | Q(role__iexact="therapist")
            | Q(role__iexact="pt")
        )
        therapists = list(
            User.objects.filter(physio_roles).order_by("username")
        )
        evaluations = (
            PatientAssignment.objects.filter(
                category__in=["initial_evaluation", "initial_eval"],
                assignment_date__gte=start_date,
                assignment_date__lte=end_date,
                therapist__in=therapists,
            )
            .select_related("patient", "therapist", "created_by")
            .order_by("assignment_date", "id")
        )
        evaluations_by_therapist = {}
        for assignment in evaluations:
            therapist_id = assignment.therapist_id
            if not therapist_id:
                continue
            patient = assignment.patient
            receptionist = getattr(assignment, "created_by", None)
            evaluation_details = {
                "id": assignment.id,
                "evaluation_id": assignment.id,
                "patient_id": assignment.patient_id,
                "patient_name": (
                    getattr(patient, "name", "") if patient else ""
                ),
                "file_number": (
                    getattr(patient, "patient_id", "")
                    if patient else ""
                ),
                "receptionist_name": (
                    get_user_display_name(receptionist)
                    if receptionist else ""
                ),
                "evaluation_date": str(assignment.assignment_date),
                "referring_physician": (
                    getattr(assignment, "referring_physician", "") or ""
                ),
                "specialty": (
                    getattr(assignment, "speciality", "") or ""
                ),
                "category": assignment.category,
            }
            evaluations_by_therapist.setdefault(
                therapist_id, []
            ).append(evaluation_details)
        rows = []
        total = 0
        for therapist in therapists:
            therapist_evaluations = evaluations_by_therapist.get(
                therapist.id, []
            )
            count = len(therapist_evaluations)
            total += count
            display_name = get_user_display_name(therapist)
            rows.append({
                "therapist_id": therapist.id,
                "id": therapist.id,
                "therapist_name": display_name,
                "name": display_name,
                "username": therapist.username,
                "count": count,
                "total": count,
                "evaluation_count": count,
                "evaluations": therapist_evaluations,
            })
        rows.sort(key=lambda row: row["therapist_name"].lower())
        return JsonResponse({
            "start_date": str(start_date),
            "end_date": str(end_date),
            "total": total,
            "therapists": rows,
        })
    except Exception as exc:
        traceback.print_exc()
        return JsonResponse(
            {
                "error": "Could not load evaluation data",
                "details": str(exc),
            },
            status=500,
        )
def last_therapist_api(request, patient_id):
    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "Not authorized"},
            status=403,
        )
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
            "name": get_user_display_name(last.therapist),
        }
    })
def leaderboard_api(request):
    """
    Return today's and current month's counts by staff member.
    Physio registrations are counted from PatientAssignment.
    Appointment bookings are counted separately from Appointment.
    """
    try:
        if not request.user.is_authenticated:
            return JsonResponse(
                {"error": "Not authorized"},
                status=403,
            )
        scope = (
            request.GET.get("scope") or "reception"
        ).strip().lower()
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
                    registered_by_id=user.id,
                    created_at__date=today,
                )
                monthly_files = safe_count(
                    Patient,
                    registered_by_id=user.id,
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
                # Registration/assignment counts do not require a booking.
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
                # Booking statistics are kept separate.
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
                today_total = today_assignments
                monthly_total = monthly_assignments
                conversion = (
                    round(monthly_attended / monthly_appointments * 100)
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
                    "today_appointments": today_appointments,
                    "assignments": monthly_assignments,
                    "today_assignments": today_assignments,
                })
        else:
            return JsonResponse(
                {"error": "Invalid scope"},
                status=400,
            )
        rows.sort(
            key=lambda row: row["monthly"],
            reverse=True,
        )
        return JsonResponse({
            "scope": scope,
            "date": str(today),
            "leaderboard": rows,
        })
    except Exception as exc:
        traceback.print_exc()
        return JsonResponse(
            {
                "error": "Server error",
                "details": str(exc),
            },
            status=500,
        )
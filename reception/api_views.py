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
    "physio_leaderboard_monthly_api",
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
def parse_date(value, default):
    """Parse YYYY-MM-DD and return the supplied default when empty."""
    if not value:
        return default
    return datetime.strptime(value, "%Y-%m-%d").date()
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
            "rehab_manager",
            "rehab manager",
            "rehab-manager",
        }
        if not (
            request.user.is_superuser
            or current_role in allowed_roles
        ):
            return JsonResponse(
                {
                    "error": (
                        "You do not have permission "
                        "to view evaluation data"
                    )
                },
                status=403,
            )
        today = timezone.localdate()
        try:
            start_date = parse_date(
                request.GET.get("start_date"),
                today.replace(day=1),
            )
            end_date = parse_date(
                request.GET.get("end_date"),
                today,
            )
        except (TypeError, ValueError):
            return JsonResponse(
                {
                    "error": (
                        "Invalid date format. Use YYYY-MM-DD."
                    )
                },
                status=400,
            )
        if start_date > end_date:
            return JsonResponse(
                {
                    "error": (
                        "Start date cannot be after end date."
                    )
                },
                status=400,
            )
        physio_roles = (
            Q(role__iexact="physio")
            | Q(role__iexact="physiotherapist")
            | Q(role__iexact="therapist")
            | Q(role__iexact="pt")
        )
        therapists = list(
            User.objects.filter(
                physio_roles
            ).order_by("username")
        )
        evaluations = (
            PatientAssignment.objects.filter(
                category__in=[
                    "initial_evaluation",
                    "initial_eval",
                ],
                assignment_date__gte=start_date,
                assignment_date__lte=end_date,
                therapist__in=therapists,
            )
            .select_related(
                "patient",
                "therapist",
                "created_by",
            )
            .order_by("assignment_date", "id")
        )
        evaluations_by_therapist = {}
        for assignment in evaluations:
            therapist_id = assignment.therapist_id
            if not therapist_id:
                continue
            patient = assignment.patient
            receptionist = assignment.created_by
            details = {
                "id": assignment.id,
                "evaluation_id": assignment.id,
                "patient_id": assignment.patient_id,
                "patient_name": (
                    getattr(patient, "name", "")
                    if patient else ""
                ),
                "file_number": (
                    getattr(patient, "patient_id", "")
                    if patient else ""
                ),
                "receptionist_name": (
                    get_user_display_name(receptionist)
                    if receptionist else ""
                ),
                "evaluation_date": str(
                    assignment.assignment_date
                ),
                "referring_physician": (
                    assignment.referring_physician or ""
                ),
                "specialty": assignment.speciality or "",
                "category": assignment.category,
            }
            evaluations_by_therapist.setdefault(
                therapist_id, []
            ).append(details)
        rows = []
        total = 0
        for therapist in therapists:
            details = evaluations_by_therapist.get(
                therapist.id, []
            )
            count = len(details)
            total += count
            name = get_user_display_name(therapist)
            rows.append({
                "therapist_id": therapist.id,
                "id": therapist.id,
                "therapist_name": name,
                "name": name,
                "username": therapist.username,
                "count": count,
                "total": count,
                "evaluation_count": count,
                "evaluations": details,
            })
        rows.sort(
            key=lambda row: row["therapist_name"].lower()
        )
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
def _physio_roles_query():
    return (
        Q(role__iexact="physio")
        | Q(role__iexact="physiotherapist")
        | Q(role__iexact="therapist")
        | Q(role__iexact="pt")
    )
def _physio_monthly_rows(start_date, end_date):
    """Build monthly assignment counts for all physiotherapists."""
    eligible_categories = [
        "appointment",
        "walk_in",
        "cash",
        "initial_evaluation",
        "initial_eval",
        "evaluation",
    ]
    therapists = User.objects.filter(
        _physio_roles_query()
    ).order_by("username")
    rows = []
    for therapist in therapists:
        assignments = PatientAssignment.objects.filter(
            therapist_id=therapist.id,
            assignment_date__gte=start_date,
            assignment_date__lte=end_date,
            category__in=eligible_categories,
        )
        appointment_count = assignments.filter(
            category="appointment"
        ).count()
        walk_in_count = assignments.filter(
            category="walk_in"
        ).count()
        cash_count = assignments.filter(
            category="cash"
        ).count()
        evaluation_count = assignments.filter(
            category__in=[
                "initial_evaluation",
                "initial_eval",
                "evaluation",
            ]
        ).count()
        total = (
            appointment_count
            + walk_in_count
            + cash_count
            + evaluation_count
        )
        name = get_user_display_name(therapist)
        rows.append({
            "therapist_id": therapist.id,
            "user_id": therapist.id,
            "id": therapist.id,
            "therapist_name": name,
            "name": name,
            "username": therapist.username,
            "appointment_count": appointment_count,
            "walk_in_count": walk_in_count,
            "cash_count": cash_count,
            "evaluation_count": evaluation_count,
            "monthly_patients_seen": total,
            "patients_seen": total,
            "monthly_count": total,
            "count": total,
        })
    rows.sort(
        key=lambda row: row["monthly_patients_seen"],
        reverse=True,
    )
    return rows
def physio_leaderboard_monthly_api(request):
    """
    Monthly physiotherapy leaderboard.
    Optional query parameter:
        month=YYYY-MM
    Counts eligible PatientAssignment records in the requested month.
    The current month is used by default.
    """
    try:
        if not request.user.is_authenticated:
            return JsonResponse(
                {"error": "Not authorized"},
                status=403,
            )
        today = timezone.localdate()
        month_value = request.GET.get("month")
        try:
            if month_value:
                month_date = datetime.strptime(
                    month_value,
                    "%Y-%m",
                ).date()
            else:
                month_date = today
        except (TypeError, ValueError):
            return JsonResponse(
                {
                    "error": (
                        "Invalid month format. Use YYYY-MM."
                    )
                },
                status=400,
            )
        start_date = month_date.replace(day=1)
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
        end_date = next_month - timezone.timedelta(days=1)
        if (
            start_date.year == today.year
            and start_date.month == today.month
        ):
            end_date = min(end_date, today)
        rows = _physio_monthly_rows(
            start_date,
            end_date,
        )
        return JsonResponse({
            "period": "monthly",
            "month": start_date.strftime("%Y-%m"),
            "start_date": str(start_date),
            "end_date": str(end_date),
            "total": sum(
                row["monthly_patients_seen"]
                for row in rows
            ),
            "leaderboard": rows,
            "results": rows,
        })
    except Exception as exc:
        traceback.print_exc()
        return JsonResponse(
            {
                "error": (
                    "Could not load monthly "
                    "physiotherapy leaderboard"
                ),
                "details": str(exc),
            },
            status=500,
        )
def leaderboard_api(request):
    """
    Return daily and monthly leaderboard counts.
    Existing reception and call-center behavior is preserved.
    Physiotherapy counts eligible assignments by assignment date.
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
        if scope == "callcenter":
            users = get_users_by_roles(
                Q(role__iexact="callcenter")
                | Q(role__iexact="callcenter_supervisor")
                | Q(role__iexact="call_center")
                | Q(role__iexact="call_center_supervisor")
            )
            rows = []
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
                    "conversion": (
                        100 if monthly_count > 0 else 0
                    ),
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
            rows = []
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
                today_total = (
                    today_files + today_assignments
                )
                monthly_total = (
                    monthly_files + monthly_assignments
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
                    "conversion": (
                        100 if monthly_total > 0 else 0
                    ),
                    "new_files": monthly_files,
                    "assignments": monthly_assignments,
                })
        elif scope == "physio":
            rows = []
            users = get_users_by_roles(
                _physio_roles_query()
            )
            eligible_categories = [
                "appointment",
                "walk_in",
                "cash",
                "initial_evaluation",
                "initial_eval",
                "evaluation",
            ]
            for user in users:
                today_assignments = safe_count(
                    PatientAssignment,
                    therapist_id=user.id,
                    assignment_date=today,
                    category__in=eligible_categories,
                )
                monthly_assignments = safe_count(
                    PatientAssignment,
                    therapist_id=user.id,
                    assignment_date__gte=month_start,
                    assignment_date__lte=today,
                    category__in=eligible_categories,
                )
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
                rows.append({
                    "user_id": user.id,
                    "name": get_user_display_name(user),
                    "username": user.username,
                    "role": get_user_role(user),
                    "today": today_assignments,
                    "monthly": monthly_assignments,
                    "count": monthly_assignments,
                    "target": 100,
                    "completed": monthly_attended,
                    "total": monthly_appointments,
                    "conversion": (
                        round(
                            monthly_attended
                            / monthly_appointments
                            * 100
                        )
                        if monthly_appointments else 0
                    ),
                    "appointments": monthly_appointments,
                    "today_appointments": today_appointments,
                    "assignments": monthly_assignments,
                    "today_assignments": today_assignments,
                    "appointment_count": safe_count(
                        PatientAssignment,
                        therapist_id=user.id,
                        assignment_date__gte=month_start,
                        assignment_date__lte=today,
                        category="appointment",
                    ),
                    "walk_in_count": safe_count(
                        PatientAssignment,
                        therapist_id=user.id,
                        assignment_date__gte=month_start,
                        assignment_date__lte=today,
                        category="walk_in",
                    ),
                    "cash_count": safe_count(
                        PatientAssignment,
                        therapist_id=user.id,
                        assignment_date__gte=month_start,
                        assignment_date__lte=today,
                        category="cash",
                    ),
                    "evaluation_count": safe_count(
                        PatientAssignment,
                        therapist_id=user.id,
                        assignment_date__gte=month_start,
                        assignment_date__lte=today,
                        category__in=[
                            "initial_evaluation",
                            "initial_eval",
                            "evaluation",
                        ],
                    ),
                    "excluded_task_count": safe_count(
                        PatientAssignment,
                        therapist_id=user.id,
                        assignment_date__gte=month_start,
                        assignment_date__lte=today,
                        category="task_without_eligibility",
                    ),
                })
            rows.sort(
                key=lambda row: row["monthly"],
                reverse=True,
            )
        else:
            return JsonResponse(
                {"error": "Invalid scope"},
                status=400,
            )
        if scope != "physio":
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
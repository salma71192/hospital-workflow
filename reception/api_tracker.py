from datetime import date, datetime

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q, Count, Max

from .models import PatientAssignment
from .api_helpers import is_admin


def build_tracker_rows(grouped, today):
    patients = []

    for g in grouped:
        approved = g["patient__approved_sessions"] or 0
        used = g["sessions_taken"] or 0
        remaining = max(approved - used, 0)

        latest_seen = g["latest_seen"]
        expiry = g["patient__approval_expiry_date"]

        if expiry and expiry < today:
            status = "expired"
        elif latest_seen:
            days = (today - latest_seen).days
            if days > 30:
                status = "inactive"
            elif days > 7:
                status = "irregular"
            else:
                status = "active"
        else:
            status = "inactive"

        patients.append({
            "id": g["patient_id"],
            "name": g["patient__name"],
            "patient_id": g["patient__patient_id"],
            "approved_sessions": approved,
            "sessions_taken": used,
            "remaining_sessions": remaining,
            "status": status,
            "current_approval_number": g["patient__current_approval_number"],
            "current_future_appointments": g["patient__current_future_appointments"],
            "latest_seen_date": str(latest_seen) if latest_seen else "",
        })

    return patients


def build_tracker_queryset(request):
    role = (getattr(request.user, "role", "") or "").strip().lower()
    admin = is_admin(request.user)

    month = request.GET.get("month")
    search = (request.GET.get("search") or "").strip()

    if month:
        try:
            month_start = datetime.strptime(month, "%Y-%m").date().replace(day=1)
        except Exception:
            return None, None, JsonResponse({"error": "Invalid month format"}, status=400)
    else:
        today = date.today()
        month_start = today.replace(day=1)

    if month_start.month == 12:
        next_month = month_start.replace(year=month_start.year + 1, month=1, day=1)
    else:
        next_month = month_start.replace(month=month_start.month + 1, day=1)

    qs = PatientAssignment.objects.select_related("patient", "therapist").filter(
        assignment_date__gte=month_start,
        assignment_date__lt=next_month,
    )

    viewed_user_id = request.GET.get("viewed_user_id")
    viewed_user_role = (request.GET.get("viewed_user_role") or "").strip().lower()

    if admin:
        if viewed_user_id and viewed_user_role == "physio":
            qs = qs.filter(therapist_id=viewed_user_id)
    else:
        qs = qs.filter(therapist=request.user)

    if search:
        qs = qs.filter(
            Q(patient__name__icontains=search)
            | Q(patient__patient_id__icontains=search)
        )

    grouped = (
        qs.values(
            "patient_id",
            "patient__name",
            "patient__patient_id",
            "patient__approved_sessions",
            "patient__current_approval_number",
            "patient__current_future_appointments",
            "patient__approval_expiry_date",
        )
        .annotate(
            sessions_taken=Count("id"),
            latest_seen=Max("assignment_date"),
        )
        .order_by("patient__name")
    )

    return grouped, month_start, None


@csrf_exempt
def physio_tracker_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    role = (getattr(request.user, "role", "") or "").strip().lower()
    admin = is_admin(request.user)

    if not (admin or role == "physio"):
        return JsonResponse({"error": "Not authorized"}, status=403)

    grouped, month_start, error = build_tracker_queryset(request)
    if error:
        return error

    patients = build_tracker_rows(grouped, date.today())

    return JsonResponse({
        "month": month_start.strftime("%Y-%m"),
        "patients": patients,
    })


@csrf_exempt
def follow_up_required_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    role = (getattr(request.user, "role", "") or "").strip().lower()
    admin = is_admin(request.user)

    if not (admin or role == "physio"):
        return JsonResponse({"error": "Not authorized"}, status=403)

    grouped, month_start, error = build_tracker_queryset(request)
    if error:
        return error

    patients = build_tracker_rows(grouped, date.today())
    follow_up = [
        p for p in patients
        if p["status"] in ["irregular", "inactive", "expired"]
    ]

    return JsonResponse({
        "month": month_start.strftime("%Y-%m"),
        "patients": follow_up,
    })
from datetime import date, datetime
import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q, Count, Max
from django.contrib.auth import get_user_model

from patients.models import Patient
from .models import PatientAssignment

User = get_user_model()


def _is_admin(user):
    role = (getattr(user, "role", "") or "").strip().lower()
    return user.is_superuser or role == "admin"


def _parse_date(value):
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except Exception:
        return None


def _build_tracker_rows(grouped, today):
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
    is_admin = _is_admin(request.user)

    if request.method == "GET":
        start_date = _parse_date(request.GET.get("start_date"))
        end_date = _parse_date(request.GET.get("end_date"))

        qs = PatientAssignment.objects.select_related("patient", "therapist")

        if start_date:
            qs = qs.filter(assignment_date__gte=start_date)
        if end_date:
            qs = qs.filter(assignment_date__lte=end_date)

        viewed_user_id = request.GET.get("viewed_user_id")
        viewed_user_role = (request.GET.get("viewed_user_role") or "").strip().lower()

        if is_admin:
            if viewed_user_id and viewed_user_role == "physio":
                qs = qs.filter(therapist_id=viewed_user_id)
        elif role == "physio":
            qs = qs.filter(therapist=request.user)
        elif role == "reception":
            qs = qs.filter(created_by=request.user)

        assignments = [
            {
                "id": a.id,
                "patient_id": a.patient.id,
                "patient_name": a.patient.name,
                "therapist_id": a.therapist.id if a.therapist else None,
                "therapist_name": a.therapist.username if a.therapist else "-",
                "assignment_date": str(a.assignment_date),
                "category": a.category,
                "notes": a.notes or "",
                "created_by": a.created_by.username if a.created_by else "",
            }
            for a in qs.order_by("-assignment_date", "-created_at")
        ]

        return JsonResponse({"assignments": assignments})

    if request.method == "POST":
        if role not in ["reception", "admin"] and not is_admin:
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
            therapist = User.objects.get(id=therapist_id)
        except Exception:
            return JsonResponse({"error": "Invalid patient or therapist"}, status=400)

        today = date.today()

        if PatientAssignment.objects.filter(
            patient=patient,
            assignment_date=today,
        ).exists():
            return JsonResponse(
                {"error": "Patient already assigned today"},
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

        return JsonResponse({"success": True, "id": assignment.id})

    if request.method == "DELETE":
        try:
            assignment = PatientAssignment.objects.get(id=assignment_id)
        except Exception:
            return JsonResponse({"error": "Not found"}, status=404)

        if assignment.assignment_date != date.today():
            return JsonResponse(
                {"error": "Cannot delete past assignments"},
                status=403,
            )

        if not (is_admin or assignment.created_by == request.user):
            return JsonResponse({"error": "Not allowed"}, status=403)

        assignment.delete()
        return JsonResponse({"success": True})

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def physio_tracker_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    role = (getattr(request.user, "role", "") or "").strip().lower()
    is_admin = _is_admin(request.user)

    if not (is_admin or role == "physio"):
        return JsonResponse({"error": "Not authorized"}, status=403)

    month = request.GET.get("month")
    search = (request.GET.get("search") or "").strip()

    if month:
        try:
            month_start = datetime.strptime(month, "%Y-%m").date().replace(day=1)
        except Exception:
            return JsonResponse({"error": "Invalid month format"}, status=400)
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

    if is_admin:
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

    today = date.today()
    patients = _build_tracker_rows(grouped, today)

    return JsonResponse({
        "month": month_start.strftime("%Y-%m"),
        "patients": patients,
    })


@csrf_exempt
def follow_up_required_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    role = (getattr(request.user, "role", "") or "").strip().lower()
    is_admin = _is_admin(request.user)

    if not (is_admin or role == "physio"):
        return JsonResponse({"error": "Not authorized"}, status=403)

    month = request.GET.get("month")
    search = (request.GET.get("search") or "").strip()

    if month:
        try:
            month_start = datetime.strptime(month, "%Y-%m").date().replace(day=1)
        except Exception:
            return JsonResponse({"error": "Invalid month format"}, status=400)
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

    if is_admin:
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

    today = date.today()
    patients = _build_tracker_rows(grouped, today)
    follow_up = [
        p for p in patients
        if p["status"] in ["irregular", "inactive", "expired"]
    ]

    return JsonResponse({
        "month": month_start.strftime("%Y-%m"),
        "patients": follow_up,
    })
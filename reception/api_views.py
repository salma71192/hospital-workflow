
from datetime import datetime
import json
import traceback

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from patients.models import Patient
from callcenter.models import Appointment

from .models import PatientAssignment, PhysioReferral, Physician
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
    "physicians_api",
    "physio_referrals_api",
    "physio_referral_detail_api",
]


# ============================================================
# SHARED HELPERS
# ============================================================

def get_user_display_name(user):
    """Return a user's display name, falling back to username."""
    if not user:
        return "Unknown User"

    try:
        for field in ("name", "display_name", "full_name"):
            value = getattr(user, field, None)
            if value and str(value).strip():
                return str(value).strip()

        if hasattr(user, "get_full_name"):
            value = user.get_full_name()
            if value and str(value).strip():
                return str(value).strip()

        return getattr(user, "username", "Unknown User") or "Unknown User"
    except Exception:
        return getattr(user, "username", "Unknown User")


def get_user_role(user):
    return str(getattr(user, "role", "") or "").strip().lower()


def get_users_by_roles(role_query):
    return (
        User.objects.filter(role_query)
        .exclude(role__isnull=True)
        .order_by("username")
    )


def safe_count(model, **filters):
    """Count matching records without crashing the leaderboard."""
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
    return user.is_authenticated and (
        user.is_superuser or get_user_role(user) == "admin"
    )


def parse_date(value, default):
    """Parse YYYY-MM-DD and return the supplied default when empty."""
    if not value:
        return default
    return datetime.strptime(value, "%Y-%m-%d").date()


def _physio_roles_query():
    return (
        Q(role__iexact="physio")
        | Q(role__iexact="physiotherapist")
        | Q(role__iexact="therapist")
        | Q(role__iexact="pt")
    )


# ============================================================
# EVALUATION TRACKER
# ============================================================

def evaluation_tracker_api(request):
    """Return initial-evaluation counts and details for each physiotherapist."""
    try:
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Not authorized"}, status=403)

        allowed_roles = {
            "admin", "reception", "receptionist",
            "reception_supervisor", "frontdesk", "front_desk",
            "registration", "rehab_manager", "rehab manager",
            "rehab-manager",
        }

        if not (
            request.user.is_superuser
            or get_user_role(request.user) in allowed_roles
        ):
            return JsonResponse(
                {"error": "You do not have permission to view evaluation data"},
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
                {"error": "Invalid date format. Use YYYY-MM-DD."},
                status=400,
            )

        if start_date > end_date:
            return JsonResponse(
                {"error": "Start date cannot be after end date."},
                status=400,
            )

        therapists = list(
            User.objects.filter(_physio_roles_query()).order_by("username")
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

        grouped = {}

        for assignment in evaluations:
            if not assignment.therapist_id:
                continue

            patient = assignment.patient
            receptionist = assignment.created_by

            grouped.setdefault(assignment.therapist_id, []).append({
                "id": assignment.id,
                "evaluation_id": assignment.id,
                "patient_id": assignment.patient_id,
                "patient_name": getattr(patient, "name", "") if patient else "",
                "file_number": getattr(patient, "patient_id", "") if patient else "",
                "receptionist_name": (
                    get_user_display_name(receptionist) if receptionist else ""
                ),
                "evaluation_date": str(assignment.assignment_date),
                "referring_physician": assignment.referring_physician or "",
                "specialty": assignment.speciality or "",
                "category": assignment.category,
            })

        rows = []

        for therapist in therapists:
            details = grouped.get(therapist.id, [])
            name = get_user_display_name(therapist)
            count = len(details)

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

        rows.sort(key=lambda row: row["therapist_name"].lower())

        return JsonResponse({
            "start_date": str(start_date),
            "end_date": str(end_date),
            "total": sum(row["count"] for row in rows),
            "therapists": rows,
        })

    except Exception as exc:
        traceback.print_exc()
        return JsonResponse({
            "error": "Could not load evaluation data",
            "details": str(exc),
        }, status=500)


# ============================================================
# LAST THERAPIST
# ============================================================

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
            "name": get_user_display_name(last.therapist),
        }
    })


# ============================================================
# PHYSIOTHERAPY LEADERBOARD HELPERS
# ============================================================

def _physio_monthly_rows(start_date, end_date):
    eligible_categories = [
        "appointment", "walk_in", "cash",
        "initial_evaluation", "initial_eval", "evaluation",
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

        appointment_count = assignments.filter(category="appointment").count()
        walk_in_count = assignments.filter(category="walk_in").count()
        cash_count = assignments.filter(category="cash").count()
        evaluation_count = assignments.filter(
            category__in=["initial_evaluation", "initial_eval", "evaluation"]
        ).count()

        total = (
            appointment_count + walk_in_count
            + cash_count + evaluation_count
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

    rows.sort(key=lambda row: row["monthly_patients_seen"], reverse=True)
    return rows


# ============================================================
# MONTHLY PHYSIOTHERAPY LEADERBOARD
# ============================================================

def physio_leaderboard_monthly_api(request):
    try:
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Not authorized"}, status=403)

        today = timezone.localdate()
        month_value = request.GET.get("month")

        try:
            month_date = (
                datetime.strptime(month_value, "%Y-%m").date()
                if month_value else today
            )
        except (TypeError, ValueError):
            return JsonResponse(
                {"error": "Invalid month format. Use YYYY-MM."},
                status=400,
            )

        start_date = month_date.replace(day=1)

        if start_date.month == 12:
            next_month = start_date.replace(
                year=start_date.year + 1, month=1, day=1
            )
        else:
            next_month = start_date.replace(
                month=start_date.month + 1, day=1
            )

        end_date = next_month - timezone.timedelta(days=1)

        if start_date.year == today.year and start_date.month == today.month:
            end_date = min(end_date, today)

        rows = _physio_monthly_rows(start_date, end_date)

        return JsonResponse({
            "period": "monthly",
            "month": start_date.strftime("%Y-%m"),
            "start_date": str(start_date),
            "end_date": str(end_date),
            "total": sum(row["monthly_patients_seen"] for row in rows),
            "leaderboard": rows,
            "results": rows,
        })

    except Exception as exc:
        traceback.print_exc()
        return JsonResponse({
            "error": "Could not load monthly physiotherapy leaderboard",
            "details": str(exc),
        }, status=500)


# ============================================================
# GENERAL LEADERBOARD
# ============================================================

def leaderboard_api(request):
    """Return daily and monthly leaderboard counts."""
    try:
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Not authorized"}, status=403)

        scope = (request.GET.get("scope") or "reception").strip().lower()
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
            users = get_users_by_roles(_physio_roles_query())
            eligible_categories = [
                "appointment", "walk_in", "cash",
                "initial_evaluation", "initial_eval", "evaluation",
            ]
            rows = []

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
                        round(monthly_attended / monthly_appointments * 100)
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
                            "initial_evaluation", "initial_eval", "evaluation"
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

            rows.sort(key=lambda row: row["monthly"], reverse=True)

        else:
            return JsonResponse({"error": "Invalid scope"}, status=400)

        if scope != "physio":
            rows.sort(key=lambda row: row["monthly"], reverse=True)

        return JsonResponse({
            "scope": scope,
            "date": str(today),
            "leaderboard": rows,
        })

    except Exception as exc:
        traceback.print_exc()
        return JsonResponse({
            "error": "Server error",
            "details": str(exc),
        }, status=500)


# ============================================================
# PHYSIO REFERRALS
# ============================================================

def _referral_user_allowed(user):
    if not user.is_authenticated:
        return False

    allowed_roles = {
        "admin", "physio", "physiotherapist", "therapist", "pt",
        "doctor", "physician", "reception", "receptionist",
        "reception_supervisor", "rehab_manager", "rehab manager",
        "rehab-manager",
    }

    return user.is_superuser or get_user_role(user) in allowed_roles


def _physician_display_name(physician):
    if not physician:
        return ""

    for field in (
        "name", "display_name", "full_name", "physician_name",
        "first_name", "username",
    ):
        value = getattr(physician, field, None)
        if value and str(value).strip():
            return str(value).strip()

    if hasattr(physician, "get_full_name"):
        value = physician.get_full_name()
        if value and str(value).strip():
            return str(value).strip()

    return str(physician).strip()


def _referral_to_dict(referral):
    patient = referral.patient
    physician = referral.physician
    referred_by = referral.referred_by

    return {
        "id": referral.id,
        "patient": referral.patient_id,
        "patient_id": referral.patient_id,
        "patient_name": getattr(patient, "name", "") or "",
        "patient_file_id": getattr(patient, "patient_id", "") or "",
        "physician": referral.physician_id,
        "physician_id": referral.physician_id,
        "physician_name": _physician_display_name(physician),
        "referred_by": referral.referred_by_id,
        "referred_by_name": (
            get_user_display_name(referred_by) if referred_by else ""
        ),
        "reason": referral.reason,
        "status": referral.status,
        "status_label": referral.get_status_display(),
        "created_at": referral.created_at.isoformat(),
        "updated_at": referral.updated_at.isoformat(),
    }


def _json_body(request):
    try:
        data = json.loads(request.body or b"{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None, JsonResponse({"error": "Invalid JSON"}, status=400)

    if not isinstance(data, dict):
        return None, JsonResponse(
            {"error": "JSON body must be an object"},
            status=400,
        )

    return data, None


def _resolve_patient(data):
    raw_id = data.get("patient", data.get("patient_id"))
    if raw_id in (None, ""):
        return None, JsonResponse({"error": "Patient is required"}, status=400)

    try:
        patient_id = int(raw_id)
    except (TypeError, ValueError):
        return None, JsonResponse(
            {"error": "Patient ID must be a valid integer"},
            status=400,
        )

    patient = Patient.objects.filter(pk=patient_id).first()
    if not patient:
        return None, JsonResponse({"error": "Patient not found"}, status=404)

    return patient, None


def _resolve_physician(data):
    """
    Resolve the selected ID against Physician.pk.

    The frontend must submit the ID returned by physicians_api,
    not a physician's displayed name or a User ID from another list.
    """
    raw_id = data.get("physician", data.get("physician_id"))

    if raw_id in (None, ""):
        return None, JsonResponse(
            {"error": "Physician is required"},
            status=400,
        )

    try:
        physician_id = int(raw_id)
    except (TypeError, ValueError):
        return None, JsonResponse(
            {"error": "Physician ID must be a valid integer"},
            status=400,
        )

    physician = Physician.objects.filter(pk=physician_id).first()
    if not physician:
        return None, JsonResponse(
            {
                "error": (
                    f"Physician ID {physician_id} was not found "
                    "in the Physician table. Check the dropdown IDs."
                )
            },
            status=404,
        )

    if not _physician_display_name(physician):
        return None, JsonResponse(
            {"error": "The selected physician has no display name"},
            status=400,
        )

    return physician, None


@csrf_exempt
def physicians_api(request):
    """GET /api/users/physicians/"""
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authorized"}, status=403)

    if not _referral_user_allowed(request.user):
        return JsonResponse({
            "error": "You do not have permission to view physicians."
        }, status=403)

    try:
        results = []
        seen_ids = set()

        # Source of IDs must match the PhysioReferral.physician relation.
        for physician in Physician.objects.all().order_by("id"):
            name = _physician_display_name(physician)
            if not name:
                continue

            results.append({
                "id": physician.pk,
                "name": name,
                "display_name": name,
                "full_name": name,
                "physician_id": physician.pk,
                "label": name,
                "value": physician.pk,
            })
            seen_ids.add(physician.pk)

        return JsonResponse({
            "physicians": results,
            "count": len(results),
        })

    except Exception as exc:
        traceback.print_exc()
        return JsonResponse({
            "error": "Could not load physicians",
            "details": str(exc),
        }, status=500)


@csrf_exempt
def physio_referrals_api(request):
    """
    GET: list referrals.
    POST: create a referral.

    Expected POST:
    {
        "patient": 123,
        "physician": 456,
        "reason": "Referral reason"
    }
    """
    if request.method not in {"GET", "POST"}:
        return JsonResponse({"error": "Method not allowed"}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authorized"}, status=403)

    if not _referral_user_allowed(request.user):
        return JsonResponse({
            "error": "You do not have permission to access referrals."
        }, status=403)

    if request.method == "GET":
        referrals = (
            PhysioReferral.objects
            .select_related("patient", "physician", "referred_by")
            .all()
            .order_by("-created_at")
        )

        status_value = (request.GET.get("status") or "").strip().lower()
        valid_statuses = {
            choice[0] for choice in PhysioReferral.STATUS_CHOICES
        }

        if status_value:
            if status_value not in valid_statuses:
                return JsonResponse(
                    {"error": "Invalid referral status"},
                    status=400,
                )
            referrals = referrals.filter(status=status_value)

        return JsonResponse({
            "referrals": [_referral_to_dict(item) for item in referrals],
            "count": referrals.count(),
        })

    data, error_response = _json_body(request)
    if error_response:
        return error_response

    patient, error_response = _resolve_patient(data)
    if error_response:
        return error_response

    physician, error_response = _resolve_physician(data)
    if error_response:
        return error_response

    reason = data.get("reason")
    if not isinstance(reason, str) or not reason.strip():
        return JsonResponse(
            {"error": "Referral reason is required"},
            status=400,
        )

    try:
        with transaction.atomic():
            referral = PhysioReferral.objects.create(
                patient=patient,
                physician=physician,
                referred_by=request.user,
                reason=reason.strip(),
                status="awaiting",
            )

        referral = (
            PhysioReferral.objects
            .select_related("patient", "physician", "referred_by")
            .get(pk=referral.pk)
        )

        return JsonResponse({
            "success": True,
            "message": "Referral created successfully.",
            "referral": _referral_to_dict(referral),
        }, status=201)

    except Exception as exc:
        traceback.print_exc()
        return JsonResponse({
            "error": "Could not create referral",
            "details": str(exc),
        }, status=500)


@csrf_exempt
def physio_referral_detail_api(request, referral_id):
    """
    GET: retrieve one referral.
    PATCH: edit patient, physician, reason and/or status.
    PUT: update patient, physician, reason and status.
    DELETE: delete the referral.
    """
    allowed_methods = {"GET", "PATCH", "PUT", "DELETE"}

    if request.method not in allowed_methods:
        return JsonResponse({"error": "Method not allowed"}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authorized"}, status=403)

    if not _referral_user_allowed(request.user):
        return JsonResponse({
            "error": "You do not have permission to access referrals."
        }, status=403)

    if request.method == "DELETE":
        referral = PhysioReferral.objects.filter(pk=referral_id).first()
        if not referral:
            return JsonResponse({"error": "Referral not found"}, status=404)

        try:
            referral.delete()
            return JsonResponse({
                "success": True,
                "deleted_id": referral_id,
                "message": "Referral deleted successfully.",
            })
        except Exception as exc:
            traceback.print_exc()
            return JsonResponse({
                "error": "Could not delete referral",
                "details": str(exc),
            }, status=500)

    referral = (
        PhysioReferral.objects
        .select_related("patient", "physician", "referred_by")
        .filter(pk=referral_id)
        .first()
    )

    if not referral:
        return JsonResponse({"error": "Referral not found"}, status=404)

    if request.method == "GET":
        return JsonResponse({"referral": _referral_to_dict(referral)})

    data, error_response = _json_body(request)
    if error_response:
        return error_response

    valid_statuses = {
        choice[0] for choice in PhysioReferral.STATUS_CHOICES
    }

    # For PUT require all editable fields. PATCH accepts partial updates.
    if request.method == "PUT":
        required = ("patient", "physician", "reason", "status")
        missing = [
            key for key in required
            if key not in data
        ]
        if missing:
            return JsonResponse({
                "error": "PUT requires patient, physician, reason and status",
                "missing_fields": missing,
            }, status=400)

    try:
        with transaction.atomic():
            changed_fields = []

            patient_supplied = (
                "patient" in data or "patient_id" in data
            )
            if patient_supplied:
                patient, error_response = _resolve_patient(data)
                if error_response:
                    return error_response
                referral.patient = patient
                changed_fields.append("patient")

            physician_supplied = (
                "physician" in data or "physician_id" in data
            )
            if physician_supplied:
                physician, error_response = _resolve_physician(data)
                if error_response:
                    return error_response
                referral.physician = physician
                changed_fields.append("physician")

            if "reason" in data:
                reason = data.get("reason")
                if not isinstance(reason, str) or not reason.strip():
                    return JsonResponse({
                        "error": "Referral reason cannot be empty"
                    }, status=400)
                referral.reason = reason.strip()
                changed_fields.append("reason")

            if "status" in data:
                status_value = str(data.get("status") or "").strip().lower()
                if status_value not in valid_statuses:
                    return JsonResponse({
                        "error": (
                            "Invalid status. Valid options: "
                            + ", ".join(sorted(valid_statuses))
                        )
                    }, status=400)
                referral.status = status_value
                changed_fields.append("status")

            if not changed_fields:
                return JsonResponse({
                    "error": (
                        "No editable fields provided. Send patient, "
                        "physician, reason or status."
                    )
                }, status=400)

            changed_fields.append("updated_at")
            referral.save(update_fields=list(set(changed_fields)))

        referral = (
            PhysioReferral.objects
            .select_related("patient", "physician", "referred_by")
            .get(pk=referral_id)
        )

        return JsonResponse({
            "success": True,
            "message": "Referral updated successfully.",
            "referral": _referral_to_dict(referral),
        })

    except Exception as exc:
        traceback.print_exc()
        return JsonResponse({
            "error": "Could not update referral",
            "details": str(exc),
        }, status=500)

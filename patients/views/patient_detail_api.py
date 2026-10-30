
from datetime import date
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from patients.models import (
    Patient,
    PatientMonthlyTracker,
    PatientMonthlySession,
)
from reception.models import PatientAssignment
from rcm.models import Claim

from .delete_patient import delete_patient
from .helpers import (
    _is_admin,
    _parse_json,
    _patient_to_dict,
)
from .update_patient import update_patient


MONTHLY_SESSION_LIMIT = 6
ALLOWED_PERIODS = (1, 3, 6)


def _get_approval_status(patient):
    claim = (
        Claim.objects
        .filter(patient_id=patient.pk)
        .order_by("-created_at", "-pk")
        .first()
    )

    if claim and claim.status:
        return str(claim.status).strip()

    return "Approved"


def _get_user_display(user):
    if not user:
        return ""

    full_name = user.get_full_name().strip()
    return full_name or user.username


def _get_month_start(year, month):
    return date(year, month, 1)


def _add_months(month_date, offset):
    """
    Return the first day of a month offset from month_date.
    """
    month_index = (
        month_date.year * 12
        + month_date.month - 1
        + offset
    )

    year = month_index // 12
    month = month_index % 12 + 1

    return date(year, month, 1)


def _get_selected_month(request):
    """
    Read the month selected in the frontend.

    Expected format: YYYY-MM
    Defaults to the current month.
    """
    month_value = (request.GET.get("month") or "").strip()

    if not month_value:
        today = timezone.localdate()
        return date(today.year, today.month, 1)

    try:
        year, month = map(int, month_value.split("-"))

        if month < 1 or month > 12:
            raise ValueError

        selected_month = date(year, month, 1)

        today = timezone.localdate()
        current_month = date(today.year, today.month, 1)

        if selected_month > current_month:
            raise ValueError

        return selected_month

    except (ValueError, TypeError):
        raise ValueError("Invalid month. Use YYYY-MM.")


def _get_registration_history(patient):
    assignments = (
        PatientAssignment.objects
        .filter(patient_id=patient.pk)
        .select_related("created_by", "therapist")
        .order_by(
            "-assignment_date",
            "-created_at",
            "-pk",
        )
    )

    return [
        {
            "id": assignment.pk,
            "visit_number": assignment.visit_number,
            "registration_date": str(
                assignment.assignment_date
            ),
            "assignment_date": str(
                assignment.assignment_date
            ),
            "registered_by": _get_user_display(
                assignment.created_by
            ),
            "created_by_name": _get_user_display(
                assignment.created_by
            ),
            "therapist": _get_user_display(
                assignment.therapist
            ),
            "therapist_name": _get_user_display(
                assignment.therapist
            ),
            "category": assignment.category or "",
            "referring_physician": (
                getattr(
                    assignment,
                    "referring_physician",
                    "",
                ) or ""
            ),
            "speciality": (
                getattr(
                    assignment,
                    "speciality",
                    "",
                ) or ""
            ),
        }
        for assignment in assignments
    ]


def _get_monthly_utilization(
    patient,
    selected_month,
    number_of_months=1,
):
    """
    Return monthly tracker utilization.

    PatientMonthlyTracker.utilized_sessions is the
    source of truth for sessions used.
    """

    months = []

    start_month = _add_months(
        selected_month,
        -(number_of_months - 1),
    )

    for offset in range(number_of_months):
        month_date = _add_months(
            start_month,
            offset,
        )

        tracker = (
            PatientMonthlyTracker.objects
            .filter(
                patient=patient,
                month=month_date,
            )
            .first()
        )

        sessions_used = (
            int(tracker.utilized_sessions or 0)
            if tracker
            else 0
        )

        sessions_allowed = MONTHLY_SESSION_LIMIT

        months.append({
            "month": month_date.strftime("%Y-%m"),
            "month_label": month_date.strftime("%b %Y"),
            "sessions_used": sessions_used,
            "utilized_sessions": sessions_used,
            "sessions_taken": sessions_used,
            "used_sessions": sessions_used,
            "sessions_allowed": sessions_allowed,
            "remaining_sessions": max(
                sessions_allowed - sessions_used,
                0,
            ),
            "utilization_percentage": round(
                sessions_used / sessions_allowed * 100,
                1,
            ),
            "thiqa_sessions": (
                int(tracker.thiqa_sessions or 0)
                if tracker else 0
            ),
            "daman_sessions": (
                int(tracker.daman_sessions or 0)
                if tracker else 0
            ),
            "cash_sessions": (
                int(tracker.cash_sessions or 0)
                if tracker else 0
            ),
        })

    total_used = sum(
        item["sessions_used"]
        for item in months
    )

    total_allowed = (
        MONTHLY_SESSION_LIMIT * number_of_months
    )

    return {
        "period_months": number_of_months,
        "selected_month": selected_month.strftime("%Y-%m"),
        "monthly_limit": MONTHLY_SESSION_LIMIT,
        "total_sessions_used": total_used,
        "total_sessions_allowed": total_allowed,
        "remaining_sessions": max(
            total_allowed - total_used,
            0,
        ),
        "utilization_percentage": round(
            total_used / total_allowed * 100,
            1,
        ),
        "months": months,
    }


def _get_session_history(
    patient,
    selected_month,
):
    """
    Return actual recorded sessions for the selected month.
    """

    next_month = _add_months(selected_month, 1)

    sessions = (
        PatientMonthlySession.objects
        .filter(
            patient=patient,
            session_date__gte=selected_month,
            session_date__lt=next_month,
        )
        .select_related("recorded_by")
        .order_by(
            "-session_date",
            "-created_at",
        )
    )

    return [
        {
            "id": session.pk,
            "session_date": str(session.session_date),
            "insurance_type": session.insurance_type,
            "notes": session.notes or "",
            "recorded_by": _get_user_display(
                session.recorded_by
            ),
        }
        for session in sessions
    ]


@csrf_exempt
def patient_detail_api(request, patient_id):

    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "Not authenticated"},
            status=401,
        )

    try:
        patient = (
            Patient.objects
            .select_related("registered_by")
            .get(id=patient_id)
        )

    except (
        Patient.DoesNotExist,
        ValueError,
        TypeError,
    ):
        return JsonResponse(
            {"error": "Patient not found"},
            status=404,
        )

    # --------------------------------------------------
    # GET PATIENT DETAILS
    # --------------------------------------------------

    if request.method == "GET":

        if (
            patient.is_archived
            and not _is_admin(request.user)
        ):
            return JsonResponse(
                {"error": "Patient file not found"},
                status=404,
            )

        try:
            selected_month = _get_selected_month(request)

        except ValueError as error:
            return JsonResponse(
                {"error": str(error)},
                status=400,
            )

        try:
            number_of_months = int(
                request.GET.get("months", 1)
            )

            if number_of_months not in ALLOWED_PERIODS:
                raise ValueError

        except (TypeError, ValueError):
            return JsonResponse(
                {
                    "error": (
                        "Invalid months value. "
                        "Use 1, 3, or 6."
                    )
                },
                status=400,
            )

        patient_data = _patient_to_dict(patient)

        approval_status = _get_approval_status(patient)

        patient_data.update({
            "approval_status": approval_status,
            "rcm_approval_status": approval_status,
        })

        try:
            registration_history = (
                _get_registration_history(patient)
            )

            utilization = _get_monthly_utilization(
                patient=patient,
                selected_month=selected_month,
                number_of_months=number_of_months,
            )

            session_history = _get_session_history(
                patient=patient,
                selected_month=selected_month,
            )

        except Exception as error:
            print(
                "Patient detail history/utilization error:",
                str(error),
            )

            return JsonResponse(
                {
                    "error": (
                        "Unable to load patient history "
                        "and utilization."
                    )
                },
                status=500,
            )

        # The frontend can read monthly_utilization
        # directly as an array.
        monthly_rows = utilization["months"]

        selected_month_row = next(
            (
                item
                for item in monthly_rows
                if item["month"]
                == selected_month.strftime("%Y-%m")
            ),
            None,
        )

        selected_sessions_used = (
            selected_month_row["sessions_used"]
            if selected_month_row
            else 0
        )

        return JsonResponse({
            "patient": patient_data,

            "approval_status": approval_status,

            "registration_history": (
                registration_history
            ),

            # Array format for the frontend.
            "monthly_utilization": monthly_rows,

            # Full utilization summary.
            "utilization": utilization,

            "selected_month": (
                selected_month.strftime("%Y-%m")
            ),

            "current_month_utilization": (
                selected_sessions_used
            ),

            "sessions_used": (
                selected_sessions_used
            ),

            "sessions_allowed": (
                MONTHLY_SESSION_LIMIT
            ),

            "session_history": session_history,
        })

    # --------------------------------------------------
    # UPDATE PATIENT
    # --------------------------------------------------

    if request.method == "PUT":
        return update_patient(request, patient)

    # --------------------------------------------------
    # ARCHIVE / RESTORE PATIENT
    # --------------------------------------------------

    if request.method == "POST":

        if not _is_admin(request.user):
            return JsonResponse(
                {
                    "error": (
                        "Only admin can archive or "
                        "restore patient files"
                    )
                },
                status=403,
            )

        data, error = _parse_json(request)

        if error:
            return error

        action = (
            data.get("action") or ""
        ).strip().lower()

        if action == "archive":

            if not patient.is_archived:
                patient.is_archived = True
                patient.archived_at = timezone.now()

                patient.save(
                    update_fields=[
                        "is_archived",
                        "archived_at",
                    ]
                )

            return JsonResponse({
                "success": True,
                "message": (
                    "Patient file archived successfully"
                ),
                "patient": _patient_to_dict(patient),
            })

        if action == "restore":

            if patient.is_archived:
                patient.is_archived = False
                patient.archived_at = None

                patient.save(
                    update_fields=[
                        "is_archived",
                        "archived_at",
                    ]
                )

            return JsonResponse({
                "success": True,
                "message": (
                    "Patient file restored successfully"
                ),
                "patient": _patient_to_dict(patient),
            })

        return JsonResponse(
            {
                "error": (
                    "Unknown action. Use 'archive' "
                    "or 'restore'."
                )
            },
            status=400,
        )

    # --------------------------------------------------
    # DELETE PATIENT
    # --------------------------------------------------

    if request.method == "DELETE":
        return delete_patient(request, patient)

    return JsonResponse(
        {"error": "Method not allowed"},
        status=405,
    )

from datetime import date, timedelta
from django.http import JsonResponse
from django.contrib.auth import get_user_model

from patients.models import Patient
from reception.models import PatientAssignment
from approvals.models import ApprovalAlert
from .helpers import can_use_approvals


def _ensure_open_alert(patient, alert_type, notes="", created_by=None):
    existing = ApprovalAlert.objects.filter(
        patient=patient,
        alert_type=alert_type,
        status="open",
    ).first()

    if existing:
        return existing

    return ApprovalAlert.objects.create(
        patient=patient,
        alert_type=alert_type,
        status="open",
        notes=notes or None,
        created_by=created_by,
    )


def _resolve_open_alerts(patient, alert_type, resolution_action, resolved_by=None):
    alerts = ApprovalAlert.objects.filter(
        patient=patient,
        alert_type=alert_type,
        status="open",
    )

    for alert in alerts:
        alert.status = "resolved"
        alert.resolution_action = resolution_action
        alert.resolved_by = resolved_by
        alert.resolved_at = date.today()
        alert.save()


def approvals_alerts_api(request):
    if not can_use_approvals(request.user):
        return JsonResponse({"error": "Not authorized"}, status=403)

    today = date.today()
    soon = today + timedelta(days=7)

    alerts = []
    seen = set()

    patients = Patient.objects.only(
        "id",
        "name",
        "patient_id",
        "approval_expiry_date",
        "approved_sessions",
        "sessions_taken",
    )

    for patient in patients:
        expiry = patient.approval_expiry_date
        approved = patient.approved_sessions or 0
        used = patient.sessions_taken or 0
        remaining = approved - used

        # EXPIRED
        if expiry and expiry < today:
            _ensure_open_alert(
                patient=patient,
                alert_type="expired",
                notes=f"Approval expired on {expiry}",
                created_by=request.user,
            )

            key = f"{patient.id}-expired"
            if key not in seen:
                alerts.append({
                    "level": "danger",
                    "message": f"{patient.name} approval expired",
                    "patient_id": patient.id,
                })
                seen.add(key)

        # NEAR EXPIRY
        elif expiry and expiry <= soon:
            _ensure_open_alert(
                patient=patient,
                alert_type="near_expiry",
                notes=f"Approval expires on {expiry}",
                created_by=request.user,
            )

            key = f"{patient.id}-soon"
            if key not in seen:
                alerts.append({
                    "level": "warning",
                    "message": f"{patient.name} expires in {(expiry - today).days} days",
                    "patient_id": patient.id,
                })
                seen.add(key)

        # LOW SESSIONS PANEL ONLY
        if approved > 0 and remaining <= 2:
            key = f"{patient.id}-low"
            if key not in seen:
                alerts.append({
                    "level": "warning",
                    "message": f"{patient.name} has {remaining} sessions left",
                    "patient_id": patient.id,
                })
                seen.add(key)

    return JsonResponse({"alerts": alerts[:20]})


def physio_alerts_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authorized"}, status=403)

    today = date.today()
    alerts = []
    seen = set()

    viewed_user_id = request.GET.get("viewed_user_id")
    current_user = request.user

    if viewed_user_id:
        User = get_user_model()
        try:
            current_user = User.objects.get(id=viewed_user_id)
        except User.DoesNotExist:
            pass

    assignments = PatientAssignment.objects.filter(
        therapist=current_user,
        assignment_date=today,
    ).select_related("patient")

    for assignment in assignments:
        patient = assignment.patient
        approved = patient.approved_sessions or 0
        used = patient.sessions_taken or 0
        remaining = approved - used

        if approved > 0 and remaining == 1:
            key = f"{patient.id}-last-session"
            if key not in seen:
                alerts.append({
                    "level": "warning",
                    "message": f"{patient.name} is on last session - renewal needed",
                    "patient_id": patient.id,
                })
                seen.add(key)

    return JsonResponse({"alerts": alerts})
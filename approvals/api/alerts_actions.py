from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone

from patients.models import Patient
from approvals.models import ApprovalAlert
from .helpers import can_use_approvals, parse_json


def approval_alerts_list_api(request):
    if not can_use_approvals(request.user):
        return JsonResponse({"error": "Not authorized"}, status=403)

    alert_type = (request.GET.get("type") or "").strip().lower()

    alerts = (
        ApprovalAlert.objects
        .select_related("patient")
        .filter(status="open")
        .order_by("-created_at")
    )

    if alert_type:
        alerts = alerts.filter(alert_type=alert_type)

    rows = []
    for item in alerts:
        rows.append({
            "id": item.id,
            "patient_id_db": item.patient.id,
            "patient_name": item.patient.name,
            "patient_id": item.patient.patient_id,
            "alert_type": item.alert_type,
            "created_at": item.created_at.isoformat() if item.created_at else "",
            "notes": item.notes or "",
        })

    return JsonResponse({"alerts": rows})


@csrf_exempt
def create_approval_alert_api(request, patient_id):
    if not can_use_approvals(request.user):
        return JsonResponse({"error": "Not authorized"}, status=403)

    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        patient = Patient.objects.get(id=patient_id)
    except Patient.DoesNotExist:
        return JsonResponse({"error": "Patient not found"}, status=404)

    data = parse_json(request)
    if data is None:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    alert_type = (data.get("alert_type") or "").strip().lower()
    notes = (data.get("notes") or "").strip()

    if alert_type not in ["expired", "near_expiry", "rejected"]:
        return JsonResponse({"error": "Invalid alert type"}, status=400)

    existing = ApprovalAlert.objects.filter(
        patient=patient,
        alert_type=alert_type,
        status="open",
    ).first()

    if existing:
        return JsonResponse({
            "success": True,
            "message": "Open alert already exists",
            "alert_id": existing.id,
        })

    alert = ApprovalAlert.objects.create(
        patient=patient,
        alert_type=alert_type,
        status="open",
        notes=notes or None,
    )

    return JsonResponse({
        "success": True,
        "message": "Alert created successfully",
        "alert_id": alert.id,
    })


@csrf_exempt
def resolve_approval_alert_api(request, alert_id):
    if not can_use_approvals(request.user):
        return JsonResponse({"error": "Not authorized"}, status=403)

    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    data = parse_json(request)
    if data is None:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    try:
        alert = ApprovalAlert.objects.get(id=alert_id, status="open")
    except ApprovalAlert.DoesNotExist:
        return JsonResponse({"error": "Alert not found"}, status=404)

    resolution_action = (data.get("resolution_action") or "").strip()

    allowed_actions = {
        "expired": ["renewed"],
        "near_expiry": ["call_center_notified", "renewed"],
        "rejected": ["patient_notified"],
    }

    if resolution_action not in allowed_actions.get(alert.alert_type, []):
        return JsonResponse({"error": "Invalid resolution action"}, status=400)

    alert.status = "resolved"
    alert.resolution_action = resolution_action
    alert.resolved_by = request.user
    alert.resolved_at = timezone.now()
    alert.save()

    return JsonResponse({
        "success": True,
        "message": "Alert resolved successfully",
    })
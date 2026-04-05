from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone

from patients.models import Patient
from approvals.models import PatientApproval, ApprovalHistory, ApprovalAlert
from .helpers import can_use_approvals, parse_json, validate_date


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
        alert.resolved_at = timezone.now()
        alert.save()


@csrf_exempt
def patient_approval_api(request, patient_id):
    if not can_use_approvals(request.user):
        return JsonResponse({"error": "Not authorized"}, status=403)

    try:
        patient = Patient.objects.get(id=patient_id)
    except Patient.DoesNotExist:
        return JsonResponse({"error": "Patient not found"}, status=404)

    approval, _ = PatientApproval.objects.get_or_create(patient=patient)

    if request.method == "GET":
        return JsonResponse({
            "patient": {
                "id": patient.id,
                "name": patient.name,
                "patient_id": patient.patient_id,
            },
            "approval": {
                "insurance_provider": approval.insurance_provider,
                "authorization_number": approval.authorization_number or "",
                "start_date": str(approval.start_date) if approval.start_date else "",
                "expiry_date": str(approval.expiry_date) if approval.expiry_date else "",
                "approved_sessions": approval.approved_sessions or 0,
                "approved_cpt_codes": approval.approved_cpt_codes or [],
                "notes": approval.notes or "",
                "created_by": approval.created_by.username if approval.created_by else "",
                "updated_by": approval.updated_by.username if approval.updated_by else "",
            },
        })

    if request.method in ["POST", "PUT"]:
        data = parse_json(request)
        if data is None:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        expiry_date = validate_date(data.get("expiry_date"))
        if data.get("expiry_date") and not expiry_date:
            return JsonResponse({"error": "Invalid expiry_date"}, status=400)

        try:
            approved_sessions = int(data.get("approved_sessions", 0))
            if approved_sessions < 0:
                approved_sessions = 0
        except Exception:
            return JsonResponse({"error": "approved_sessions must be a number"}, status=400)

        codes = data.get("approved_cpt_codes", [])
        if not isinstance(codes, list):
            return JsonResponse({"error": "approved_cpt_codes must be a list"}, status=400)

        insurance_provider = (data.get("insurance_provider") or "thiqa").strip().lower()
        authorization_number = (data.get("authorization_number") or "").strip() or None
        notes = data.get("notes") or None

        if authorization_number:
            duplicate = (
                PatientApproval.objects
                .filter(authorization_number=authorization_number)
                .exclude(id=approval.id)
                .select_related("patient")
                .first()
            )
            if duplicate:
                return JsonResponse(
                    {"error": f"Authorization number already used for patient {duplicate.patient.name}"},
                    status=400,
                )

        start_date = approval.start_date or timezone.localdate()

        approval.insurance_provider = insurance_provider
        approval.authorization_number = authorization_number
        approval.start_date = start_date
        approval.expiry_date = expiry_date
        approval.approved_sessions = approved_sessions
        approval.approved_cpt_codes = codes
        approval.notes = notes

        if not approval.created_by:
            approval.created_by = request.user

        approval.updated_by = request.user
        approval.save()

        patient.current_approval_number = authorization_number
        patient.approval_start_date = start_date
        patient.approval_expiry_date = expiry_date
        patient.approved_sessions = approved_sessions
        patient.approved_cpt_codes = codes
        patient.insurance_provider = insurance_provider
        patient.save()

        history_item = (
            ApprovalHistory.objects
            .filter(
                patient=patient,
                authorization_number=authorization_number,
                status="active",
            )
            .order_by("-updated_at", "-id")
            .first()
        )

        if history_item:
            history_item.start_date = start_date
            history_item.expiry_date = expiry_date
            history_item.approved_sessions = approved_sessions
            history_item.insurance_provider = insurance_provider
            history_item.approved_cpt_codes = codes
            history_item.updated_by = request.user
            history_item.status = "active"
            history_item.save()
        else:
            ApprovalHistory.objects.create(
                patient=patient,
                authorization_number=authorization_number,
                approved_sessions=approved_sessions,
                start_date=start_date,
                expiry_date=expiry_date,
                insurance_provider=insurance_provider,
                approved_cpt_codes=codes,
                status="active",
                updated_by=request.user,
            )

        # Auto-resolve alerts after renewal/update
        _resolve_open_alerts(patient, "expired", "renewed", request.user)
        _resolve_open_alerts(patient, "near_expiry", "renewed", request.user)

        return JsonResponse({
            "success": True,
            "message": "Approval saved successfully",
        })

    if request.method == "DELETE":
        old_authorization_number = approval.authorization_number

        if old_authorization_number:
            history_item = (
                ApprovalHistory.objects
                .filter(
                    patient=patient,
                    authorization_number=old_authorization_number,
                    status="active",
                )
                .order_by("-updated_at", "-id")
                .first()
            )

            if history_item:
                history_item.status = "deleted"
                history_item.updated_by = request.user
                history_item.save()

        approval.delete()

        patient.current_approval_number = None
        patient.approval_start_date = None
        patient.approval_expiry_date = None
        patient.approved_sessions = 0
        patient.approved_cpt_codes = []
        patient.insurance_provider = None
        patient.save()

        return JsonResponse({
            "success": True,
            "message": "Approval deleted successfully",
        })

    return JsonResponse({"error": "Method not allowed"}, status=405)
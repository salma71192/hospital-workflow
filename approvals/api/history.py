from django.http import JsonResponse
from django.utils import timezone
from django.db.models import Q

from patients.models import Patient
from approvals.models import PatientApproval, ApprovalHistory
from .helpers import can_use_approvals


def approval_history_api(request):
    if not can_use_approvals(request.user):
        return JsonResponse({"error": "Not authorized"}, status=403)

    rows = []
    today = timezone.localdate()
    month = (request.GET.get("month") or "").strip()
    search = (request.GET.get("search") or "").strip()
    approval_type = (request.GET.get("approval_type") or "").strip().lower()

    approvals = (
        PatientApproval.objects
        .select_related("patient")
        .all()
        .order_by("-updated_at")
    )

    if month:
        try:
            year, month_num = month.split("-")
            approvals = approvals.filter(
                updated_at__year=int(year),
                updated_at__month=int(month_num),
            )
        except Exception:
            return JsonResponse({"error": "Invalid month format. Use YYYY-MM"}, status=400)

    if approval_type:
        approvals = approvals.filter(insurance_provider=approval_type)

    if search:
        approvals = approvals.filter(
            Q(patient__name__icontains=search) |
            Q(patient__patient_id__icontains=search) |
            Q(authorization_number__icontains=search)
        )

    for approval in approvals:
        patient = approval.patient

        approved_quantity = approval.approved_sessions or 0
        used_sessions = patient.sessions_taken or 0
        remaining_sessions = max(approved_quantity - used_sessions, 0)
        booked = bool((patient.current_future_appointments or "").strip())
        cpt_count = len(approval.approved_cpt_codes or [])

        if approval.expiry_date and approval.expiry_date < today:
            status = "Expired"
        elif remaining_sessions <= 1 and approved_quantity > 0:
            status = "Renewal Needed"
        elif remaining_sessions <= 2 and approved_quantity > 0:
            status = "Low Sessions"
        else:
            status = "Active"

        rows.append({
            "patient_id_db": patient.id,
            "patient_name": patient.name,
            "patient_id": patient.patient_id,
            "authorization_number": approval.authorization_number or "",
            "approval_type": approval.insurance_provider or "thiqa",
            "cpt_count": cpt_count,
            "approval_date": str(approval.start_date) if approval.start_date else "",
            "expiry_date": str(approval.expiry_date) if approval.expiry_date else "",
            "approved_quantity": approved_quantity,
            "booked": "Yes" if booked else "No",
            "used_sessions": used_sessions,
            "remaining_sessions": remaining_sessions,
            "status": status,
        })

    return JsonResponse({"history": rows})


def patient_approval_timeline_api(request, patient_id):
    if not can_use_approvals(request.user):
        return JsonResponse({"error": "Not authorized"}, status=403)

    try:
        patient = Patient.objects.get(id=patient_id)
    except Patient.DoesNotExist:
        return JsonResponse({"error": "Patient not found"}, status=404)

    today = timezone.localdate()
    rows = []

    history_items = (
        ApprovalHistory.objects
        .filter(patient=patient)
        .order_by("-updated_at")
    )

    current_used_sessions = patient.sessions_taken or 0

    for item in history_items:
        approved_quantity = item.approved_sessions or 0
        remaining_sessions = max(approved_quantity - current_used_sessions, 0)

        if item.status == "deleted":
            status = "Deleted"
        elif item.expiry_date and item.expiry_date < today:
            status = "Expired"
        elif remaining_sessions <= 1 and approved_quantity > 0:
            status = "Renewal Needed"
        elif remaining_sessions <= 2 and approved_quantity > 0:
            status = "Low Sessions"
        else:
            status = "Active"

        rows.append({
            "id": item.id,
            "authorization_number": item.authorization_number or "",
            "approval_date": str(item.updated_at.date()) if item.updated_at else "",
            "start_date": str(item.start_date) if item.start_date else "",
            "expiry_date": str(item.expiry_date) if item.expiry_date else "",
            "approved_sessions": approved_quantity,
            "used_sessions": current_used_sessions,
            "remaining_sessions": remaining_sessions,
            "status": status,
            "insurance_provider": item.insurance_provider or "thiqa",
            "approved_cpt_codes": item.approved_cpt_codes or [],
        })

    return JsonResponse({
        "patient": {
            "id": patient.id,
            "name": patient.name,
            "patient_id": patient.patient_id,
        },
        "timeline": rows,
    })
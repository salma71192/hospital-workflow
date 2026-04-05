import json
from datetime import datetime, date, timedelta

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone

from patients.models import Patient
from reception.models import PatientAssignment
from .models import PatientApproval, InsuranceBillingCode, ApprovalHistory


def _can_use_approvals(user):
    if not user.is_authenticated:
        return False
    role = (getattr(user, "role", "") or "").strip().lower()
    return user.is_superuser or role in ["admin", "approvals"]


def _parse_json(request):
    try:
        raw = request.body.decode("utf-8") if request.body else "{}"
        return json.loads(raw)
    except Exception:
        return None


def _validate_date(value):
    if not value:
        return None
    try:
        datetime.strptime(value, "%Y-%m-%d")
        return value
    except Exception:
        return None


@csrf_exempt
def patient_approval_api(request, patient_id):
    if not _can_use_approvals(request.user):
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
            }
        })

    if request.method in ["POST", "PUT"]:
        data = _parse_json(request)
        if data is None:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        start_date = _validate_date(data.get("start_date"))
        expiry_date = _validate_date(data.get("expiry_date"))

        if data.get("start_date") and not start_date:
            return JsonResponse({"error": "Invalid start_date"}, status=400)

        if data.get("expiry_date") and not expiry_date:
            return JsonResponse({"error": "Invalid expiry_date"}, status=400)

        try:
            approved_sessions = int(data.get("approved_sessions", 0))
            if approved_sessions < 0:
                approved_sessions = 0
        except Exception:
            return JsonResponse(
                {"error": "approved_sessions must be a number"},
                status=400,
            )

        codes = data.get("approved_cpt_codes", [])
        if not isinstance(codes, list):
            return JsonResponse(
                {"error": "approved_cpt_codes must be a list"},
                status=400,
            )

        insurance_provider = data.get("insurance_provider", "thiqa")
        authorization_number = (data.get("authorization_number") or "").strip() or None
        notes = data.get("notes") or None

        if authorization_number:
            duplicate = (
                PatientApproval.objects
                .filter(authorization_number=authorization_number)
                .exclude(patient=patient)
                .select_related("patient")
                .first()
            )
            if duplicate:
                return JsonResponse(
                    {
                        "error": f"Authorization number already used for patient {duplicate.patient.name}"
                    },
                    status=400,
                )

        ApprovalHistory.objects.create(
            patient=patient,
            authorization_number=authorization_number,
            approved_sessions=approved_sessions,
            expiry_date=expiry_date,
            insurance_provider=insurance_provider,
            approved_cpt_codes=codes,
            updated_by=request.user,
        )

        approval.insurance_provider = insurance_provider
        approval.authorization_number = authorization_number
        approval.start_date = start_date
        approval.expiry_date = expiry_date
        approval.approved_sessions = approved_sessions
        approval.approved_cpt_codes = codes
        approval.notes = notes
        approval.save()

        patient.current_approval_number = authorization_number
        patient.approval_start_date = start_date
        patient.approval_expiry_date = expiry_date
        patient.approved_sessions = approved_sessions
        patient.approved_cpt_codes = codes
        patient.insurance_provider = insurance_provider
        patient.save()

        return JsonResponse({
            "success": True,
            "message": "Approval updated successfully",
        })

    return JsonResponse({"error": "Method not allowed"}, status=405)


def approvals_alerts_api(request):
    if not _can_use_approvals(request.user):
        return JsonResponse({"error": "Not authorized"}, status=403)

    today = date.today()
    soon = today + timedelta(days=7)

    alerts = []
    seen = set()

    patients = Patient.objects.only(
        "id",
        "name",
        "approval_expiry_date",
        "approved_sessions",
        "sessions_taken",
    )

    for p in patients:
        expiry = p.approval_expiry_date
        approved = p.approved_sessions or 0
        used = p.sessions_taken or 0
        remaining = approved - used

        if expiry and expiry < today:
            key = f"{p.id}-expired"
            if key not in seen:
                alerts.append({
                    "level": "danger",
                    "message": f"{p.name} approval expired",
                    "patient_id": p.id,
                })
                seen.add(key)

        elif expiry and expiry <= soon:
            key = f"{p.id}-soon"
            if key not in seen:
                alerts.append({
                    "level": "warning",
                    "message": f"{p.name} expires in {(expiry - today).days} days",
                    "patient_id": p.id,
                })
                seen.add(key)

        if approved > 0 and remaining <= 2:
            key = f"{p.id}-low"
            if key not in seen:
                alerts.append({
                    "level": "warning",
                    "message": f"{p.name} has {remaining} sessions left",
                    "patient_id": p.id,
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
        from django.contrib.auth import get_user_model
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

        if approved <= 0:
            continue

        if remaining == 1:
            key = f"{patient.id}-last-session"
            if key not in seen:
                alerts.append({
                    "level": "warning",
                    "message": f"{patient.name} is on last session - renewal needed",
                    "patient_id": patient.id,
                })
                seen.add(key)

    return JsonResponse({"alerts": alerts})


@csrf_exempt
def billing_codes_api(request):
    if not _can_use_approvals(request.user):
        return JsonResponse({"error": "Not authorized"}, status=403)

    provider = request.GET.get("provider", "thiqa")

    if request.method == "GET":
        qs = InsuranceBillingCode.objects.filter(insurance_provider=provider)
        codes = list(
            qs.values(
                "id",
                "insurance_provider",
                "code",
                "default_sessions",
            )
        )
        return JsonResponse({"codes": codes})

    if request.method == "POST":
        data = _parse_json(request)
        if data is None:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        code = (data.get("code") or "").strip()
        insurance_provider = data.get("insurance_provider", "thiqa")

        try:
            default_sessions = int(data.get("default_sessions", 6))
            if default_sessions < 0:
                default_sessions = 0
        except Exception:
            return JsonResponse(
                {"error": "default_sessions must be a number"},
                status=400,
            )

        if not code:
            return JsonResponse({"error": "Code is required"}, status=400)

        obj, created = InsuranceBillingCode.objects.update_or_create(
            insurance_provider=insurance_provider,
            code=code,
            defaults={
                "default_sessions": default_sessions,
            },
        )

        return JsonResponse({
            "success": True,
            "created": created,
            "id": obj.id,
            "message": "CPT code saved successfully",
        })

    if request.method == "DELETE":
        data = _parse_json(request)
        if data is None:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        code_id = data.get("id")
        if not code_id:
            return JsonResponse({"error": "Code id is required"}, status=400)

        try:
            obj = InsuranceBillingCode.objects.get(id=code_id)
        except InsuranceBillingCode.DoesNotExist:
            return JsonResponse({"error": "Code not found"}, status=404)

        obj.delete()
        return JsonResponse({
            "success": True,
            "message": "CPT code deleted successfully",
        })

    return JsonResponse({"error": "Method not allowed"}, status=405)


def approval_history_api(request):
    if not _can_use_approvals(request.user):
        return JsonResponse({"error": "Not authorized"}, status=403)

    rows = []
    today = timezone.localdate()
    month = (request.GET.get("month") or "").strip()

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
            return JsonResponse(
                {"error": "Invalid month format. Use YYYY-MM"},
                status=400,
            )

    for approval in approvals:
        patient = approval.patient

        approved_quantity = approval.approved_sessions or 0
        used_sessions = patient.sessions_taken or 0
        remaining_sessions = max(approved_quantity - used_sessions, 0)

        booked = bool((patient.current_future_appointments or "").strip())

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
    if not _can_use_approvals(request.user):
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
        .order_by("-created_at")
    )

    current_used_sessions = patient.sessions_taken or 0

    for item in history_items:
        approved_quantity = item.approved_sessions or 0
        remaining_sessions = max(approved_quantity - current_used_sessions, 0)

        if item.expiry_date and item.expiry_date < today:
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
            "approval_date": str(item.created_at.date()) if item.created_at else "",
            "start_date": str(item.created_at.date()) if item.created_at else "",
            "expiry_date": str(item.expiry_date) if item.expiry_date else "",
            "approved_sessions": approved_quantity,
            "used_sessions": current_used_sessions,
            "remaining_sessions": remaining_sessions,
            "status": status,
            "insurance_provider": item.insurance_provider or "thiqa",
            "approved_cpt_codes": item.approved_cpt_codes or [],
        })

    current_approval = getattr(patient, "approval_record", None)
    if current_approval and not history_items.exists():
        approved_quantity = current_approval.approved_sessions or 0
        remaining_sessions = max(approved_quantity - current_used_sessions, 0)

        if current_approval.expiry_date and current_approval.expiry_date < today:
            status = "Expired"
        elif remaining_sessions <= 1 and approved_quantity > 0:
            status = "Renewal Needed"
        elif remaining_sessions <= 2 and approved_quantity > 0:
            status = "Low Sessions"
        else:
            status = "Active"

        rows.append({
            "id": f"current-{patient.id}",
            "authorization_number": current_approval.authorization_number or "",
            "approval_date": str(current_approval.updated_at.date()) if current_approval.updated_at else "",
            "start_date": str(current_approval.start_date) if current_approval.start_date else "",
            "expiry_date": str(current_approval.expiry_date) if current_approval.expiry_date else "",
            "approved_sessions": approved_quantity,
            "used_sessions": current_used_sessions,
            "remaining_sessions": remaining_sessions,
            "status": status,
            "insurance_provider": current_approval.insurance_provider or "thiqa",
            "approved_cpt_codes": current_approval.approved_cpt_codes or [],
        })

    return JsonResponse({
        "patient": {
            "id": patient.id,
            "name": patient.name,
            "patient_id": patient.patient_id,
        },
        "timeline": rows,
    })
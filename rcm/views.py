
import json
from datetime import date

from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from patients.models import Patient
from .models import Claim, RenewalAlert


User = get_user_model()

# Update these values to match the role names in your users model.
CLAIM_MANAGEMENT_ROLES = {
    "admin",
    "rcm",
}


def get_patient(patient_id):
    try:
        return Patient.objects.get(pk=patient_id)
    except (Patient.DoesNotExist, ValueError, TypeError):
        return None


def read_json(request):
    try:
        return json.loads(request.body or b"{}"), None
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None, JsonResponse(
            {"error": "Invalid JSON request body."},
            status=400,
        )


def patient_name_of(patient):
    return (
        getattr(patient, "name", None)
        or getattr(patient, "full_name", None)
        or getattr(patient, "patient_name", None)
        or str(patient)
    )


def patient_file_number_of(patient):
    for field in (
        "file_number",
        "patient_file_number",
        "patient_id",
        "patient_number",
        "medical_record_number",
        "medical_record_no",
        "mrn",
        "file_no",
    ):
        value = getattr(patient, field, None)
        if value not in (None, ""):
            return str(value)

    return "—"


def user_name_of(user):
    if not user:
        return ""

    return (
        getattr(user, "display_name", None)
        or getattr(user, "full_name", None)
        or getattr(user, "name", None)
        or getattr(user, "username", None)
        or getattr(user, "email", None)
        or f"User #{user.pk}"
    )


def claim_to_dict(claim):
    patient = claim.patient
    creator = getattr(claim, "created_by", None)

    creator_data = None

    if creator:
        creator_data = {
            "id": creator.pk,
            "username": getattr(creator, "username", ""),
            "display_name": user_name_of(creator),
            "full_name": user_name_of(creator),
        }

    created_at = claim.created_at
    updated_at = claim.updated_at
    file_number = patient_file_number_of(patient)

    return {
        "id": claim.pk,
        "patientId": claim.patient_id,
        "patientName": patient_name_of(patient),
        "patientFileNumber": file_number,
        "file_number": file_number,
        "claimId": claim.claim_id,
        "status": claim.status,
        "rejectionReason": claim.rejection_reason,
        "rejection_reason": claim.rejection_reason,
        "created_by": creator_data,
        "created_by_id": claim.created_by_id,
        "created_by_name": user_name_of(creator),
        "createdAt": created_at.isoformat() if created_at else None,
        "created_at": created_at.isoformat() if created_at else None,
        "updatedAt": updated_at.isoformat() if updated_at else None,
        "updated_at": updated_at.isoformat() if updated_at else None,
    }


def alert_to_dict(alert):
    patient = alert.patient

    return {
        "id": alert.pk,
        "patientId": alert.patient_id,
        "patientName": patient_name_of(patient),
        "patientFileNumber": patient_file_number_of(patient),
        "renewalDate": alert.renewal_date.isoformat(),
        "createdAt": alert.created_at.isoformat(),
    }


def user_can_manage_claims(user):
    if not user or not user.is_authenticated:
        return False

    if user.is_superuser or user.is_staff:
        return True

    role = str(getattr(user, "role", "") or "").strip().lower()

    return role in CLAIM_MANAGEMENT_ROLES


def claim_permission_error(request, claim):
    user = request.user

    if not user.is_authenticated:
        return JsonResponse(
            {"error": "Please log in to manage claims."},
            status=401,
        )

    # Administrators and authorized RCM users can manage claims
    # created by other users.
    if user_can_manage_claims(user):
        return None

    # Non-RCM users may manage only their own claims.
    if not claim.created_by_id:
        return JsonResponse(
            {
                "error": (
                    "This claim has no recorded creator. "
                    "Please contact an administrator."
                )
            },
            status=403,
        )

    if claim.created_by_id != user.pk:
        return JsonResponse(
            {"error": "You can only manage claims that you created."},
            status=403,
        )

    # Preserve the original same-day restriction for non-RCM users.
    if not claim.created_at:
        return JsonResponse(
            {"error": "The claim creation date is unavailable."},
            status=403,
        )

    created_date = timezone.localtime(claim.created_at).date()

    if created_date != timezone.localdate():
        return JsonResponse(
            {
                "error": (
                    "Claims can only be edited or deleted "
                    "on the day they were created."
                )
            },
            status=403,
        )

    return None


@csrf_exempt
@require_http_methods(["GET", "POST"])
def claims_list_create(request):
    if request.method == "GET":
        patient_id = request.GET.get("patient_id")

        queryset = Claim.objects.select_related(
            "patient",
            "created_by",
        )

        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)

        return JsonResponse({
            "results": [
                claim_to_dict(claim)
                for claim in queryset
            ]
        })

    # Require authentication to create claims.
    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "Please log in to create claims."},
            status=401,
        )

    data, error = read_json(request)

    if error:
        return error

    patient_id = data.get("patientId", data.get("patient_id"))

    claim_id = str(
        data.get("claimId", data.get("claim_id", ""))
    ).strip()

    status = data.get("status", "Pending")

    rejection_reason = str(
        data.get(
            "rejectionReason",
            data.get("rejection_reason", ""),
        )
    ).strip()

    if not patient_id:
        return JsonResponse(
            {"error": "Patient is required."},
            status=400,
        )

    patient = get_patient(patient_id)

    if not patient:
        return JsonResponse(
            {"error": "Patient was not found."},
            status=404,
        )

    if not claim_id:
        return JsonResponse(
            {"error": "Claim ID is required."},
            status=400,
        )

    if status not in {"Approved", "Rejected", "Pending"}:
        return JsonResponse(
            {"error": "Invalid claim status."},
            status=400,
        )

    if status == "Rejected" and not rejection_reason:
        return JsonResponse(
            {"error": "A rejection reason is required."},
            status=400,
        )

    try:
        claim = Claim.objects.create(
            patient=patient,
            claim_id=claim_id,
            status=status,
            rejection_reason=(
                rejection_reason if status == "Rejected" else ""
            ),
            created_by=request.user,
        )
    except IntegrityError:
        return JsonResponse(
            {
                "error": (
                    "This Claim ID already exists for this patient."
                )
            },
            status=409,
        )

    claim = Claim.objects.select_related(
        "patient",
        "created_by",
    ).get(pk=claim.pk)

    return JsonResponse(
        {"claim": claim_to_dict(claim)},
        status=201,
    )


@csrf_exempt
@require_http_methods(["GET", "PUT", "PATCH", "DELETE"])
def claim_detail(request, claim_pk):
    try:
        claim = Claim.objects.select_related(
            "patient",
            "created_by",
        ).get(pk=claim_pk)
    except Claim.DoesNotExist:
        return JsonResponse(
            {"error": "Claim was not found."},
            status=404,
        )

    if request.method == "GET":
        return JsonResponse({
            "claim": claim_to_dict(claim)
        })

    permission_error = claim_permission_error(request, claim)

    if permission_error:
        return permission_error

    if request.method == "DELETE":
        claim.delete()

        return JsonResponse({
            "message": "Claim deleted successfully."
        })

    data, error = read_json(request)

    if error:
        return error

    status = data.get("status", claim.status)

    rejection_reason = str(
        data.get(
            "rejection_reason",
            data.get(
                "rejectionReason",
                claim.rejection_reason,
            ),
        )
        or ""
    ).strip()

    if status not in {"Approved", "Rejected", "Pending"}:
        return JsonResponse(
            {"error": "Invalid claim status."},
            status=400,
        )

    if status == "Rejected" and not rejection_reason:
        return JsonResponse(
            {"error": "A rejection reason is required."},
            status=400,
        )

    claim.status = status
    claim.rejection_reason = (
        rejection_reason if status == "Rejected" else ""
    )

    claim.save(
        update_fields=[
            "status",
            "rejection_reason",
            "updated_at",
        ]
    )

    claim = Claim.objects.select_related(
        "patient",
        "created_by",
    ).get(pk=claim.pk)

    return JsonResponse({
        "claim": claim_to_dict(claim)
    })


@csrf_exempt
@require_http_methods(["GET", "POST"])
def renewal_alerts_list_create(request):
    if request.method == "GET":
        patient_id = request.GET.get("patient_id")

        queryset = RenewalAlert.objects.select_related("patient")

        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)

        return JsonResponse({
            "results": [
                alert_to_dict(alert)
                for alert in queryset
            ]
        })

    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "Please log in to create renewal alerts."},
            status=401,
        )

    data, error = read_json(request)

    if error:
        return error

    patient_id = data.get("patientId", data.get("patient_id"))

    renewal_date = data.get(
        "renewalDate",
        data.get("renewal_date"),
    )

    if not patient_id:
        return JsonResponse(
            {"error": "Patient is required."},
            status=400,
        )

    patient = get_patient(patient_id)

    if not patient:
        return JsonResponse(
            {"error": "Patient was not found."},
            status=404,
        )

    if not renewal_date:
        return JsonResponse(
            {"error": "Renewal date is required."},
            status=400,
        )

    try:
        parsed_date = date.fromisoformat(renewal_date)
    except (ValueError, TypeError):
        return JsonResponse(
            {
                "error": (
                    "Renewal date must use YYYY-MM-DD format."
                )
            },
            status=400,
        )

    alert = RenewalAlert.objects.create(
        patient=patient,
        renewal_date=parsed_date,
    )

    return JsonResponse(
        {"alert": alert_to_dict(alert)},
        status=201,
    )

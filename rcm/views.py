
import json
from datetime import date

from django.db import IntegrityError, transaction
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from patients.models import Patient
from .models import Claim, RenewalAlert


CLAIM_MANAGEMENT_ROLES = {"admin", "rcm"}

VALID_CLAIM_STATUSES = {
    "Approved",
    "Rejected",
    "Pending",
    "Submitted",
}


def read_json(request):
    try:
        return json.loads(request.body or b"{}"), None
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None, JsonResponse(
            {"error": "Invalid JSON request body."},
            status=400,
        )


def get_patient(patient_id):
    try:
        return Patient.objects.get(pk=patient_id)
    except (Patient.DoesNotExist, ValueError, TypeError):
        return None


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
    creator = claim.created_by
    file_number = patient_file_number_of(patient)

    creator_data = None
    if creator:
        creator_data = {
            "id": creator.pk,
            "username": getattr(creator, "username", ""),
            "display_name": user_name_of(creator),
            "full_name": user_name_of(creator),
        }

    return {
        "id": claim.pk,
        "patientId": claim.patient_id,
        "patient_id": claim.patient_id,
        "patientName": patient_name_of(patient),
        "patientFileNumber": file_number,
        "file_number": file_number,
        "claimId": claim.claim_id,
        "claim_id": claim.claim_id,
        "status": claim.status,
        "rejectionReason": claim.rejection_reason,
        "rejection_reason": claim.rejection_reason,
        "created_by": creator_data,
        "created_by_id": claim.created_by_id,
        "created_by_name": user_name_of(creator),
        "createdAt": (
            claim.created_at.isoformat()
            if claim.created_at else None
        ),
        "created_at": (
            claim.created_at.isoformat()
            if claim.created_at else None
        ),
        "updatedAt": (
            claim.updated_at.isoformat()
            if claim.updated_at else None
        ),
        "updated_at": (
            claim.updated_at.isoformat()
            if claim.updated_at else None
        ),
    }


def alert_to_dict(alert):
    patient = alert.patient
    file_number = patient_file_number_of(patient)

    linked_claim_id = ""
    if alert.claim_id and alert.claim:
        linked_claim_id = alert.claim.claim_id

    return {
        "id": alert.pk,
        "patientId": alert.patient_id,
        "patient_id": alert.patient_id,
        "patientName": patient_name_of(patient),
        "patientFileNumber": file_number,
        "file_number": file_number,
        "claimPk": alert.claim_id,
        "claimId": alert.claim_id_value or linked_claim_id,
        "alertType": alert.alert_type,
        "renewalDate": alert.renewal_date.isoformat(),
        "renewal_date": alert.renewal_date.isoformat(),
        "status": alert.status,
        "message": alert.message,
        "rejectionReason": alert.rejection_reason,
        "rejection_reason": alert.rejection_reason,
        "submissionDate": (
            alert.submission_date.isoformat()
            if alert.submission_date else None
        ),
        "createdAt": alert.created_at.isoformat(),
        "updatedAt": alert.updated_at.isoformat(),
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

    if user_can_manage_claims(user):
        return None

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


def parse_date(value):
    if not value:
        return None

    try:
        return date.fromisoformat(value)
    except (ValueError, TypeError):
        return None


@csrf_exempt
@require_http_methods(["GET", "POST"])
def claims_list_create(request):
    if request.method == "GET":
        queryset = Claim.objects.select_related(
            "patient",
            "created_by",
        )

        patient_id = request.GET.get("patient_id")
        claim_id = (
            request.GET.get("claim_id")
            or request.GET.get("claimId")
            or ""
        ).strip()

        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)

        if claim_id:
            queryset = queryset.filter(claim_id__iexact=claim_id)

        return JsonResponse({
            "results": [
                claim_to_dict(claim)
                for claim in queryset
            ]
        })

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
        ) or ""
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

    # New claims are created in their initial status.
    # Existing claims must be updated through claim_detail.
    if status not in {"Approved", "Rejected", "Pending"}:
        return JsonResponse(
            {"error": "Invalid initial claim status."},
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
                    "This Claim ID already exists for this patient. "
                    "Search for the existing claim instead."
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
        return JsonResponse({"claim": claim_to_dict(claim)})

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
            data.get("rejectionReason", claim.rejection_reason),
        ) or ""
    ).strip()

    alert_id = data.get("alertId", data.get("alert_id"))

    if status not in VALID_CLAIM_STATUSES:
        return JsonResponse(
            {"error": "Invalid claim status."},
            status=400,
        )

    if status == "Rejected" and not rejection_reason:
        return JsonResponse(
            {"error": "A rejection reason is required."},
            status=400,
        )

    # If this is a renewal update, validate the alert and date
    # before changing the claim.
    renewal_alert = None

    if status == "Submitted" and alert_id:
        try:
            renewal_alert = RenewalAlert.objects.select_related(
                "claim"
            ).get(
                pk=alert_id,
                patient_id=claim.patient_id,
            )
        except RenewalAlert.DoesNotExist:
            return JsonResponse(
                {"error": "Renewal alert was not found."},
                status=404,
            )

        if renewal_alert.alert_type != "renewal":
            return JsonResponse(
                {"error": "This alert is not a renewal alert."},
                status=400,
            )

        if renewal_alert.claim_id and renewal_alert.claim_id != claim.pk:
            return JsonResponse(
                {"error": "This alert belongs to another claim."},
                status=400,
            )

        if renewal_alert.renewal_date != timezone.localdate():
            return JsonResponse(
                {
                    "error": (
                        "This claim can only be renewed "
                        "on its scheduled renewal date."
                    )
                },
                status=400,
            )

    with transaction.atomic():
        claim.status = status
        claim.rejection_reason = (
            rejection_reason if status == "Rejected" else ""
        )
        claim.save(update_fields=[
            "status",
            "rejection_reason",
            "updated_at",
        ])

        if renewal_alert:
            renewal_alert.claim = claim
            renewal_alert.claim_id_value = claim.claim_id
            renewal_alert.status = "Submitted"
            renewal_alert.submission_date = timezone.now()
            renewal_alert.save(update_fields=[
                "claim",
                "claim_id_value",
                "status",
                "submission_date",
                "updated_at",
            ])

    claim = Claim.objects.select_related(
        "patient",
        "created_by",
    ).get(pk=claim.pk)

    return JsonResponse({"claim": claim_to_dict(claim)})


@csrf_exempt
@require_http_methods(["GET", "POST"])
def renewal_alerts_list_create(request):
    if request.method == "GET":
        queryset = RenewalAlert.objects.select_related(
            "patient",
            "claim",
        )

        patient_id = request.GET.get("patient_id")
        claim_id = (
            request.GET.get("claim_id")
            or request.GET.get("claimId")
            or ""
        ).strip()

        selected_date = request.GET.get("date", "").strip()
        selected_month = request.GET.get("month", "").strip()
        alert_type = request.GET.get("alert_type", "").strip().lower()
        include_all = request.GET.get("all", "").lower() in {
            "1", "true", "yes"
        }

        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)

        if claim_id:
            queryset = queryset.filter(
                claim_id_value__iexact=claim_id
            )

        if alert_type in {"renewal", "rejection"}:
            queryset = queryset.filter(alert_type=alert_type)

        if selected_date:
            parsed_date = parse_date(selected_date)

            if not parsed_date:
                return JsonResponse(
                    {"error": "date must use YYYY-MM-DD format."},
                    status=400,
                )

            queryset = queryset.filter(renewal_date=parsed_date)

        elif selected_month:
            try:
                month_start = date.fromisoformat(
                    f"{selected_month}-01"
                )
            except (ValueError, TypeError):
                return JsonResponse(
                    {"error": "month must use YYYY-MM format."},
                    status=400,
                )

            if month_start.month == 12:
                month_end = date(month_start.year + 1, 1, 1)
            else:
                month_end = date(
                    month_start.year,
                    month_start.month + 1,
                    1,
                )

            queryset = queryset.filter(
                renewal_date__gte=month_start,
                renewal_date__lt=month_end,
            )

        elif not include_all:
            # Default view: alerts due today.
            queryset = queryset.filter(
                renewal_date=timezone.localdate()
            )

        return JsonResponse({
            "results": [
                alert_to_dict(alert)
                for alert in queryset
            ]
        })

    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "Please log in to create alerts."},
            status=401,
        )

    data, error = read_json(request)
    if error:
        return error

    patient_id = data.get("patientId", data.get("patient_id"))
    claim_pk = data.get("claimPk", data.get("claim_pk"))

    claim_id_value = str(
        data.get("claimId", data.get("claim_id", "")) or ""
    ).strip()

    renewal_date_value = data.get(
        "renewalDate",
        data.get("renewal_date"),
    )

    alert_type = str(
        data.get("alertType", data.get("alert_type", "renewal"))
    ).strip().lower()

    message = str(data.get("message", "") or "").strip()

    rejection_reason = str(
        data.get(
            "rejectionReason",
            data.get("rejection_reason", ""),
        ) or ""
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

    parsed_date = parse_date(renewal_date_value)
    if not parsed_date:
        return JsonResponse(
            {"error": "Renewal date must use YYYY-MM-DD format."},
            status=400,
        )

    if alert_type not in {"renewal", "rejection"}:
        return JsonResponse(
            {"error": "Alert type must be renewal or rejection."},
            status=400,
        )

    claim = None

    if claim_pk:
        try:
            claim = Claim.objects.get(
                pk=claim_pk,
                patient_id=patient.pk,
            )
        except (Claim.DoesNotExist, ValueError, TypeError):
            return JsonResponse(
                {
                    "error": (
                        "The linked claim was not found "
                        "for this patient."
                    )
                },
                status=404,
            )

    if claim and not claim_id_value:
        claim_id_value = claim.claim_id

    # Avoid duplicate pending alerts for the same patient,
    # Claim ID, alert type, and scheduled date.
    if claim_id_value:
        existing = RenewalAlert.objects.filter(
            patient=patient,
            claim_id_value=claim_id_value,
            alert_type=alert_type,
            renewal_date=parsed_date,
            status="Pending",
        ).first()

        if existing:
            return JsonResponse(
                {
                    "alert": alert_to_dict(existing),
                    "duplicate": True,
                },
                status=200,
            )

    alert = RenewalAlert.objects.create(
        patient=patient,
        claim=claim,
        claim_id_value=claim_id_value,
        alert_type=alert_type,
        renewal_date=parsed_date,
        rejection_reason=rejection_reason,
        message=message,
    )

    return JsonResponse(
        {"alert": alert_to_dict(alert)},
        status=201,
    )

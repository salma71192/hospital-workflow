
import json
from datetime import date

from django.db import IntegrityError, transaction
from django.db.models import ProtectedError
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from patients.models import Patient
from .models import Claim, ClaimHistory, RenewalAlert


CLAIM_MANAGEMENT_ROLES = {"admin", "rcm"}

VALID_CLAIM_STATUSES = {
    "Approved",
    "Rejected",
    "Pending",
    "Submitted",
}


# =========================================================
# GENERAL HELPERS
# =========================================================

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


def user_data_of(user):
    if not user:
        return None

    name = user_name_of(user)

    return {
        "id": user.pk,
        "username": getattr(user, "username", "") or "",
        "name": name,
        "display_name": name,
        "full_name": name,
        "email": getattr(user, "email", "") or "",
    }


def parse_date(value):
    if not value:
        return None

    try:
        return date.fromisoformat(str(value)[:10])
    except (ValueError, TypeError):
        return None


def is_authenticated_user(user):
    return bool(user and user.is_authenticated)


def user_can_manage_claims(user):
    if not is_authenticated_user(user):
        return False

    if user.is_superuser or user.is_staff:
        return True

    role = str(getattr(user, "role", "") or "").strip().lower()
    return role in CLAIM_MANAGEMENT_ROLES


def record_claim_history(
    claim,
    event,
    previous_status="",
    new_status="",
    rejection_reason="",
    notes="",
    renewal_date=None,
    user=None,
):
    """
    Create an audit record for a claim event.

    The history record and the related claim change should be
    saved inside the same transaction.
    """
    return ClaimHistory.objects.create(
        claim=claim,
        event=event,
        previous_status=previous_status or "",
        new_status=new_status or "",
        rejection_reason=rejection_reason or "",
        notes=notes or "",
        renewal_date=renewal_date,
        created_by=(
            user if is_authenticated_user(user) else None
        ),
    )


# =========================================================
# SERIALIZERS
# =========================================================

def history_to_dict(record):
    claim = record.claim
    patient = claim.patient

    event_user = user_name_of(record.created_by)
    original_creator = user_name_of(claim.created_by)

    event_user_data = user_data_of(record.created_by)
    original_creator_data = user_data_of(claim.created_by)

    event_type = record.event

    # Compatibility for older records where the initial claim
    # was created directly with Rejected status and recorded as
    # a Rejected event with no previous status.
    if (
        event_type == "Rejected"
        and not record.previous_status
        and record.new_status == "Rejected"
    ):
        event_type = "Created"

    renewal_date = (
        record.renewal_date.isoformat()
        if record.renewal_date
        else None
    )

    created_at = (
        record.created_at.isoformat()
        if record.created_at
        else None
    )

    event_user_id = record.created_by_id

    return {
        "id": record.pk,
        "claimPk": claim.pk,
        "claim_pk": claim.pk,
        "claimId": claim.claim_id,
        "claim_id": claim.claim_id,
        "patientId": claim.patient_id,
        "patient_id": claim.patient_id,
        "patientName": patient_name_of(patient),

        "event": event_type,
        "eventType": event_type,
        "event_type": event_type,
        "eventLabel": event_type,
        "event_label": event_type,

        "previousStatus": record.previous_status,
        "previous_status": record.previous_status,
        "newStatus": record.new_status,
        "new_status": record.new_status,
        "status": record.new_status,

        # User who performed this specific event.
        "createdBy": event_user,
        "created_by": event_user,
        "createdByName": event_user,
        "created_by_name": event_user,
        "created_by_id": event_user_id,
        "createdById": event_user_id,

        "user": event_user_data,
        "userName": event_user,
        "user_name": event_user,
        "userId": event_user_id,
        "user_id": event_user_id,

        "changedBy": event_user,
        "changed_by": event_user,
        "changedByName": event_user,
        "changed_by_name": event_user,
        "changedById": event_user_id,
        "changed_by_id": event_user_id,

        "editedBy": event_user,
        "edited_by": event_user,
        "editedByName": event_user,
        "edited_by_name": event_user,

        "actor": event_user_data,
        "actorName": event_user,
        "actor_name": event_user,

        # Original claim creator.
        "claimCreator": original_creator,
        "claim_creator": original_creator,
        "claimCreatedBy": original_creator,
        "claim_created_by": original_creator,
        "claimCreatedByName": original_creator,
        "claim_created_by_name": original_creator,
        "claimCreatedById": claim.created_by_id,
        "claim_created_by_id": claim.created_by_id,
        "originalCreator": original_creator,
        "original_creator": original_creator,
        "originalCreatorId": claim.created_by_id,
        "original_creator_id": claim.created_by_id,
        "claimCreatorData": original_creator_data,

        "rejectionReason": record.rejection_reason,
        "rejection_reason": record.rejection_reason,
        "notes": record.notes,
        "renewalDate": renewal_date,
        "renewal_date": renewal_date,
        "createdAt": created_at,
        "created_at": created_at,
        "date": created_at,
    }


def claim_to_dict(claim):
    patient = claim.patient
    creator = claim.created_by

    file_number = patient_file_number_of(patient)
    creator_name = user_name_of(creator)

    created_at = (
        claim.created_at.isoformat()
        if claim.created_at
        else None
    )

    updated_at = (
        claim.updated_at.isoformat()
        if claim.updated_at
        else None
    )

    history_records = (
        ClaimHistory.objects
        .filter(claim_id=claim.pk)
        .select_related(
            "claim",
            "claim__patient",
            "claim__created_by",
            "created_by",
        )
        .order_by("created_at", "pk")
    )

    history = [
        history_to_dict(record)
        for record in history_records
    ]

    creator_data = user_data_of(creator)

    return {
        "id": claim.pk,
        "pk": claim.pk,
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
        "created_by_name": creator_name,
        "createdBy": creator_name,
        "createdByName": creator_name,
        "createdById": claim.created_by_id,
        "claimCreator": creator_name,
        "claim_creator": creator_name,
        "creator": creator_data,

        "createdAt": created_at,
        "created_at": created_at,
        "updatedAt": updated_at,
        "updated_at": updated_at,

        "history": history,
    }


def alert_to_dict(alert):
    patient = alert.patient
    claim = alert.claim

    file_number = patient_file_number_of(patient)

    linked_claim_id = claim.claim_id if claim else ""
    claim_status = claim.status if claim else None
    claim_pk = claim.pk if claim else None

    rejection_reason = alert.rejection_reason or ""

    if claim:
        rejection_reason = (
            claim.rejection_reason or rejection_reason
        )

    renewal_date = (
        alert.renewal_date.isoformat()
        if alert.renewal_date
        else None
    )

    submission_date = (
        alert.submission_date.isoformat()
        if alert.submission_date
        else None
    )

    created_at = (
        alert.created_at.isoformat()
        if alert.created_at
        else None
    )

    updated_at = (
        alert.updated_at.isoformat()
        if alert.updated_at
        else None
    )

    return {
        "id": alert.pk,
        "patientId": alert.patient_id,
        "patient_id": alert.patient_id,
        "patientName": patient_name_of(patient),
        "patientFileNumber": file_number,
        "file_number": file_number,
        "claimPk": claim_pk,
        "claim_pk": claim_pk,
        "claimId": alert.claim_id_value or linked_claim_id,
        "claim_id_value": alert.claim_id_value or linked_claim_id,
        "claim_status": claim_status,
        "claimStatus": claim_status,
        "claim": {
            "id": claim_pk,
            "pk": claim_pk,
            "claim_id": linked_claim_id,
            "claimId": linked_claim_id,
            "status": claim_status,
            "rejection_reason": (
                claim.rejection_reason if claim else ""
            ),
        } if claim else None,
        "renewal_status": alert.status,
        "renewalStatus": alert.status,
        "status": claim_status or alert.status,
        "alertType": alert.alert_type,
        "alert_type": alert.alert_type,
        "renewalDate": renewal_date,
        "renewal_date": renewal_date,
        "message": alert.message,
        "rejectionReason": rejection_reason,
        "rejection_reason": rejection_reason,
        "submissionDate": submission_date,
        "submission_date": submission_date,
        "createdAt": created_at,
        "updatedAt": updated_at,
    }


# =========================================================
# PERMISSIONS
# =========================================================

def claim_permission_error(request, claim):
    user = request.user

    if not is_authenticated_user(user):
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
            {
                "error": (
                    "You can only manage claims that you created."
                )
            },
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


def renewal_alert_permission_error(request):
    if not is_authenticated_user(request.user):
        return JsonResponse(
            {"error": "Please log in to manage renewal alerts."},
            status=401,
        )

    if not user_can_manage_claims(request.user):
        return JsonResponse(
            {
                "error": (
                    "You do not have permission to edit "
                    "or delete renewal alerts."
                )
            },
            status=403,
        )

    return None


# =========================================================
# CLAIMS: GET LIST / POST CREATE OR RESUBMIT
# =========================================================

@csrf_exempt
@require_http_methods(["GET", "POST"])
def claims_list_create(request):
    if request.method == "GET":
        queryset = (
            Claim.objects
            .select_related("patient", "created_by")
            .order_by("-created_at", "-pk")
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

    if not is_authenticated_user(request.user):
        return JsonResponse(
            {"error": "Please log in to create claims."},
            status=401,
        )

    data, error = read_json(request)

    if error:
        return error

    patient_id = data.get("patientId", data.get("patient_id"))

    claim_id = str(
        data.get("claimId", data.get("claim_id", "")) or ""
    ).strip()

    status = str(
        data.get("status", "Pending") or "Pending"
    ).strip()

    rejection_reason = str(
        data.get(
            "rejectionReason",
            data.get("rejection_reason", ""),
        ) or ""
    ).strip()

    renewal_alert_id = data.get(
        "renewalAlertId",
        data.get("renewal_alert_id"),
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

    if not claim_id and not renewal_alert_id:
        return JsonResponse(
            {"error": "Claim ID is required."},
            status=400,
        )

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

    try:
        with transaction.atomic():
            renewal_alert = None

            # RESUBMIT THROUGH AN EXISTING RENEWAL REMINDER
            if renewal_alert_id:
                try:
                    renewal_alert = (
                        RenewalAlert.objects
                        .select_for_update(of=("self",))
                        .get(
                            pk=renewal_alert_id,
                            patient_id=patient.pk,
                            alert_type="renewal",
                        )
                    )
                except (
                    RenewalAlert.DoesNotExist,
                    ValueError,
                    TypeError,
                ):
                    return JsonResponse(
                        {"error": "Renewal alert was not found."},
                        status=404,
                    )

                if renewal_alert.status == "Submitted":
                    return JsonResponse(
                        {
                            "error": (
                                "This renewal has already been submitted."
                            )
                        },
                        status=409,
                    )

                if renewal_alert.renewal_date != timezone.localdate():
                    return JsonResponse(
                        {
                            "error": (
                                "This renewal can only be submitted "
                                "on its scheduled renewal date."
                            )
                        },
                        status=400,
                    )

                existing_claim = None

                if renewal_alert.claim_id:
                    try:
                        existing_claim = (
                            Claim.objects
                            .select_for_update(of=("self",))
                            .get(pk=renewal_alert.claim_id)
                        )
                    except Claim.DoesNotExist:
                        existing_claim = None

                if (
                    not existing_claim
                    and renewal_alert.claim_id_value
                ):
                    existing_claim = (
                        Claim.objects
                        .select_for_update(of=("self",))
                        .filter(
                            patient_id=patient.pk,
                            claim_id__iexact=(
                                renewal_alert.claim_id_value
                            ),
                        )
                        .first()
                    )

                if not existing_claim:
                    return JsonResponse(
                        {
                            "error": (
                                "No existing claim is linked to this "
                                "renewal. Link the original claim before "
                                "resubmitting."
                            )
                        },
                        status=400,
                    )

                if existing_claim.patient_id != patient.pk:
                    return JsonResponse(
                        {
                            "error": (
                                "The claim belongs to another patient."
                            )
                        },
                        status=400,
                    )

                previous_status = existing_claim.status
                previous_rejection_reason = (
                    existing_claim.rejection_reason or ""
                )

                existing_claim.status = "Submitted"
                existing_claim.rejection_reason = ""

                existing_claim.save(
                    update_fields=[
                        "status",
                        "rejection_reason",
                        "updated_at",
                    ]
                )

                record_claim_history(
                    claim=existing_claim,
                    event="Resubmitted",
                    previous_status=previous_status,
                    new_status="Submitted",
                    rejection_reason=(
                        renewal_alert.rejection_reason
                        or previous_rejection_reason
                    ),
                    notes="Claim resubmitted from the renewal reminder.",
                    renewal_date=renewal_alert.renewal_date,
                    user=request.user,
                )

                renewal_alert.claim = existing_claim
                renewal_alert.claim_id_value = existing_claim.claim_id
                renewal_alert.status = "Submitted"
                renewal_alert.submission_date = timezone.now()

                renewal_alert.save(
                    update_fields=[
                        "claim",
                        "claim_id_value",
                        "status",
                        "submission_date",
                        "updated_at",
                    ]
                )

                claim = existing_claim

            # CREATE A NEW CLAIM
            else:
                existing_claim = (
                    Claim.objects
                    .filter(
                        patient=patient,
                        claim_id__iexact=claim_id,
                    )
                    .first()
                )

                if existing_claim:
                    return JsonResponse(
                        {
                            "error": (
                                "This Claim ID already exists for this "
                                "patient. Use the existing claim's renewal "
                                "reminder to resubmit it."
                            ),
                            "existingClaimPk": existing_claim.pk,
                        },
                        status=409,
                    )

                claim = Claim.objects.create(
                    patient=patient,
                    claim_id=claim_id,
                    status=status,
                    rejection_reason=(
                        rejection_reason
                        if status == "Rejected"
                        else ""
                    ),
                    created_by=request.user,
                )

                # Always record the initial event as Created.
                # The initial status is stored in new_status.
                record_claim_history(
                    claim=claim,
                    event="Created",
                    previous_status="",
                    new_status=status,
                    rejection_reason=(
                        rejection_reason
                        if status == "Rejected"
                        else ""
                    ),
                    notes="Claim created.",
                    user=request.user,
                )

    except IntegrityError:
        return JsonResponse(
            {
                "error": (
                    "This Claim ID already exists for this patient. "
                    "Search for the existing claim or use a different "
                    "claim reference."
                )
            },
            status=409,
        )

    claim = (
        Claim.objects
        .select_related("patient", "created_by")
        .get(pk=claim.pk)
    )

    response_data = {
        "claim": claim_to_dict(claim),
        "message": (
            "Existing claim resubmitted successfully."
            if renewal_alert_id
            else "Claim created successfully."
        ),
    }

    if renewal_alert_id:
        renewal_alert = (
            RenewalAlert.objects
            .select_related("patient", "claim")
            .get(pk=renewal_alert_id)
        )

        response_data["alert"] = alert_to_dict(renewal_alert)

    return JsonResponse(
        response_data,
        status=200 if renewal_alert_id else 201,
    )


# =========================================================
# CLAIM DETAIL: GET / PATCH / PUT / DELETE
# =========================================================

@csrf_exempt
@require_http_methods(["GET", "PUT", "PATCH", "DELETE"])
def claim_detail(request, claim_pk):
    try:
        claim = (
            Claim.objects
            .select_related("patient", "created_by")
            .get(pk=claim_pk)
        )
    except (
        Claim.DoesNotExist,
        ValueError,
        TypeError,
    ):
        return JsonResponse(
            {"error": "Claim was not found."},
            status=404,
        )

    if request.method == "GET":
        claim_data = claim_to_dict(claim)
        return JsonResponse({
            "claim": claim_data,
            **claim_data,
        })

    permission_error = claim_permission_error(request, claim)

    if permission_error:
        return permission_error

    if request.method == "DELETE":
        try:
            with transaction.atomic():
                # Preserve the original protection behavior for
                # claims linked to protected records.
                ClaimHistory.objects.filter(
                    claim_id=claim.pk
                ).delete()

                claim.delete()

        except ProtectedError:
            return JsonResponse(
                {
                    "error": (
                        "This claim is linked to other protected "
                        "records and cannot be deleted. Remove or "
                        "unlink those records first."
                    )
                },
                status=409,
            )

        return JsonResponse({
            "message": "Claim deleted successfully."
        })

    data, error = read_json(request)

    if error:
        return error

    status = str(
        data.get("status", claim.status) or claim.status
    ).strip()

    rejection_reason = str(
        data.get(
            "rejection_reason",
            data.get("rejectionReason", claim.rejection_reason),
        ) or ""
    ).strip()

    alert_id = data.get(
        "alertId",
        data.get(
            "alert_id",
            data.get(
                "renewalAlertId",
                data.get("renewal_alert_id"),
            ),
        ),
    )

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

    try:
        with transaction.atomic():
            claim = (
                Claim.objects
                .select_for_update(of=("self",))
                .select_related("patient", "created_by")
                .get(pk=claim_pk)
            )

            previous_status = claim.status
            previous_rejection_reason = (
                claim.rejection_reason or ""
            )

            renewal_alert = None

            if alert_id:
                try:
                    renewal_alert = (
                        RenewalAlert.objects
                        .select_for_update(of=("self",))
                        .get(
                            pk=alert_id,
                            patient_id=claim.patient_id,
                            alert_type="renewal",
                        )
                    )
                except (
                    RenewalAlert.DoesNotExist,
                    ValueError,
                    TypeError,
                ):
                    return JsonResponse(
                        {"error": "Renewal alert was not found."},
                        status=404,
                    )

                if (
                    renewal_alert.claim_id
                    and renewal_alert.claim_id != claim.pk
                ):
                    return JsonResponse(
                        {
                            "error": (
                                "This alert belongs to another claim."
                            )
                        },
                        status=400,
                    )

                if renewal_alert.status == "Submitted":
                    return JsonResponse(
                        {
                            "error": (
                                "This renewal has already been submitted."
                            )
                        },
                        status=409,
                    )

                if (
                    status == "Submitted"
                    and renewal_alert.renewal_date
                    != timezone.localdate()
                ):
                    return JsonResponse(
                        {
                            "error": (
                                "This renewal can only be submitted "
                                "on its scheduled renewal date."
                            )
                        },
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

            # Record an audit entry when the status changes.
            if previous_status != status:
                if status == "Rejected":
                    event = "Rejected"
                elif (
                    status == "Submitted"
                    and previous_status == "Rejected"
                ):
                    event = "Resubmitted"
                elif status == "Submitted":
                    event = "Submitted"
                elif status == "Approved":
                    event = "Approved"
                else:
                    event = "Status Changed"

                record_claim_history(
                    claim=claim,
                    event=event,
                    previous_status=previous_status,
                    new_status=status,
                    rejection_reason=(
                        rejection_reason
                        if status == "Rejected"
                        else previous_rejection_reason
                    ),
                    notes=(
                        "Claim resubmitted."
                        if event == "Resubmitted"
                        else "Claim status updated."
                    ),
                    renewal_date=(
                        renewal_alert.renewal_date
                        if renewal_alert
                        else None
                    ),
                    user=request.user,
                )

            elif (
                status == "Rejected"
                and previous_rejection_reason != rejection_reason
            ):
                # Record a history entry when the rejection reason
                # changes even if the status remains Rejected.
                record_claim_history(
                    claim=claim,
                    event="Rejected",
                    previous_status=previous_status,
                    new_status=status,
                    rejection_reason=rejection_reason,
                    notes="Claim rejection reason updated.",
                    user=request.user,
                )

            if renewal_alert and status == "Submitted":
                renewal_alert.claim = claim
                renewal_alert.claim_id_value = claim.claim_id
                renewal_alert.status = "Submitted"
                renewal_alert.submission_date = timezone.now()

                renewal_alert.save(
                    update_fields=[
                        "claim",
                        "claim_id_value",
                        "status",
                        "submission_date",
                        "updated_at",
                    ]
                )

    except Claim.DoesNotExist:
        return JsonResponse(
            {"error": "Claim was not found."},
            status=404,
        )

    claim = (
        Claim.objects
        .select_related("patient", "created_by")
        .get(pk=claim.pk)
    )

    claim_data = claim_to_dict(claim)

    response_data = {
        "claim": claim_data,
        **claim_data,
        "message": "Claim updated successfully.",
    }

    if alert_id:
        updated_alert = (
            RenewalAlert.objects
            .select_related("patient", "claim")
            .get(pk=alert_id)
        )

        response_data["alert"] = alert_to_dict(updated_alert)

    return JsonResponse(response_data)


# =========================================================
# CLAIM HISTORY: GENERAL AND CLAIM-SPECIFIC GET
# =========================================================

@csrf_exempt
@require_http_methods(["GET"])
def claim_history_list(request, claim_pk=None):
    """
    Supports:
      GET /api/rcm/claim-history/
      GET /api/rcm/claims/<claim_pk>/history/

    History is returned oldest first.
    """
    if not is_authenticated_user(request.user):
        return JsonResponse(
            {"error": "Please log in to view claim history."},
            status=401,
        )

    queryset = (
        ClaimHistory.objects
        .select_related(
            "claim",
            "claim__patient",
            "claim__created_by",
            "created_by",
        )
        .order_by("created_at", "pk")
    )

    if claim_pk is not None:
        if not Claim.objects.filter(pk=claim_pk).exists():
            return JsonResponse(
                {"error": "Claim was not found."},
                status=404,
            )

        queryset = queryset.filter(claim_id=claim_pk)

    query_claim_pk = request.GET.get("claim_pk")

    claim_id = (
        request.GET.get("claim_id")
        or request.GET.get("claimId")
        or ""
    ).strip()

    patient_id = request.GET.get("patient_id")
    event = request.GET.get("event", "").strip()

    if query_claim_pk and claim_pk is None:
        queryset = queryset.filter(claim_id=query_claim_pk)

    if claim_id:
        queryset = queryset.filter(
            claim__claim_id__iexact=claim_id
        )

    if patient_id:
        queryset = queryset.filter(
            claim__patient_id=patient_id
        )

    if event:
        queryset = queryset.filter(event__iexact=event)

    return JsonResponse({
        "results": [
            history_to_dict(record)
            for record in queryset
        ]
    })


# =========================================================
# RENEWAL ALERTS: GET LIST / POST CREATE
# Only renewal reminders are supported.
# =========================================================

@csrf_exempt
@require_http_methods(["GET", "POST"])
def renewal_alerts_list_create(request):
    if request.method == "GET":
        queryset = (
            RenewalAlert.objects
            .select_related("patient", "claim")
            .filter(alert_type="renewal")
            .order_by("renewal_date", "pk")
        )

        patient_id = request.GET.get("patient_id")

        claim_id = (
            request.GET.get("claim_id")
            or request.GET.get("claimId")
            or ""
        ).strip()

        selected_date = request.GET.get("date", "").strip()
        selected_month = request.GET.get("month", "").strip()

        include_all = request.GET.get("all", "").lower() in {
            "1",
            "true",
            "yes",
        }

        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)

        if claim_id:
            queryset = queryset.filter(
                claim_id_value__iexact=claim_id
            )

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
                month_end = date(
                    month_start.year + 1,
                    1,
                    1,
                )
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
            queryset = queryset.filter(
                renewal_date=timezone.localdate()
            )

        return JsonResponse({
            "results": [
                alert_to_dict(alert)
                for alert in queryset
            ]
        })

    if not is_authenticated_user(request.user):
        return JsonResponse(
            {"error": "Please log in to create renewal reminders."},
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

    message = str(data.get("message", "") or "").strip()

    rejection_reason = str(
        data.get(
            "rejectionReason",
            data.get("rejection_reason", ""),
        ) or ""
    ).strip()

    requested_alert_type = str(
        data.get(
            "alertType",
            data.get("alert_type", "renewal"),
        ) or "renewal"
    ).strip().lower()

    if requested_alert_type != "renewal":
        return JsonResponse(
            {"error": "Only renewal reminders are supported."},
            status=400,
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

    parsed_date = parse_date(renewal_date_value)

    if not parsed_date:
        return JsonResponse(
            {
                "error": (
                    "Renewal date must use YYYY-MM-DD format."
                )
            },
            status=400,
        )

    if parsed_date < timezone.localdate():
        return JsonResponse(
            {"error": "The renewal date cannot be in the past."},
            status=400,
        )

    claim = None

    if claim_pk:
        try:
            claim = Claim.objects.get(
                pk=claim_pk,
                patient_id=patient.pk,
            )
        except (
            Claim.DoesNotExist,
            ValueError,
            TypeError,
        ):
            return JsonResponse(
                {
                    "error": (
                        "The linked claim was not found for this patient."
                    )
                },
                status=404,
            )

    elif claim_id_value:
        claim = (
            Claim.objects
            .filter(
                patient_id=patient.pk,
                claim_id__iexact=claim_id_value,
            )
            .first()
        )

    if claim and not claim_id_value:
        claim_id_value = claim.claim_id

    if claim_id_value:
        existing = (
            RenewalAlert.objects
            .filter(
                patient=patient,
                claim_id_value=claim_id_value,
                alert_type="renewal",
                renewal_date=parsed_date,
                status="Pending",
            )
            .first()
        )

        if existing:
            existing = (
                RenewalAlert.objects
                .select_related("patient", "claim")
                .get(pk=existing.pk)
            )

            return JsonResponse(
                {
                    "alert": alert_to_dict(existing),
                    "duplicate": True,
                    "message": (
                        "A matching pending renewal reminder "
                        "already exists."
                    ),
                },
                status=200,
            )

    with transaction.atomic():
        alert = RenewalAlert.objects.create(
            patient=patient,
            claim=claim,
            claim_id_value=claim_id_value,
            alert_type="renewal",
            renewal_date=parsed_date,
            rejection_reason=rejection_reason,
            message=message,
        )

        # Scheduling a reminder does not change claim status.
        if claim:
            record_claim_history(
                claim=claim,
                event="Renewal Scheduled",
                previous_status=claim.status,
                new_status=claim.status,
                rejection_reason=(
                    rejection_reason or claim.rejection_reason
                ),
                notes=(
                    message
                    or "A renewal reminder was scheduled."
                ),
                renewal_date=parsed_date,
                user=request.user,
            )

    alert = (
        RenewalAlert.objects
        .select_related("patient", "claim")
        .get(pk=alert.pk)
    )

    return JsonResponse(
        {
            "alert": alert_to_dict(alert),
            "message": "Renewal reminder created successfully.",
        },
        status=201,
    )


# =========================================================
# RENEWAL ALERT DETAIL: GET / PATCH / PUT / DELETE
# =========================================================

@csrf_exempt
@require_http_methods(["GET", "PATCH", "PUT", "DELETE"])
def renewal_alert_detail(request, alert_pk):
    try:
        alert = (
            RenewalAlert.objects
            .select_related("patient", "claim")
            .get(
                pk=alert_pk,
                alert_type="renewal",
            )
        )
    except (
        RenewalAlert.DoesNotExist,
        ValueError,
        TypeError,
    ):
        return JsonResponse(
            {"error": "Renewal reminder was not found."},
            status=404,
        )

    if request.method == "GET":
        return JsonResponse({"alert": alert_to_dict(alert)})

    permission_error = renewal_alert_permission_error(request)

    if permission_error:
        return permission_error

    with transaction.atomic():
        try:
            alert = (
                RenewalAlert.objects
                .select_for_update(of=("self",))
                .get(
                    pk=alert_pk,
                    alert_type="renewal",
                )
            )
        except RenewalAlert.DoesNotExist:
            return JsonResponse(
                {"error": "Renewal reminder was not found."},
                status=404,
            )

        today = timezone.localdate()

        if alert.renewal_date and alert.renewal_date < today:
            return JsonResponse(
                {
                    "error": (
                        "Past renewal reminders cannot be edited "
                        "or deleted."
                    )
                },
                status=403,
            )

        if alert.status == "Submitted":
            return JsonResponse(
                {
                    "error": (
                        "A submitted renewal reminder cannot be "
                        "edited or deleted."
                    )
                },
                status=403,
            )

        if request.method == "DELETE":
            # Preserve claim history when deleting a reminder.
            alert.delete()

            return JsonResponse({
                "message": "Renewal reminder deleted successfully."
            })

        data, error = read_json(request)

        if error:
            return error

        old_renewal_date = alert.renewal_date
        old_message = alert.message

        if "renewal_date" in data or "renewalDate" in data:
            renewal_date_value = data.get(
                "renewal_date",
                data.get("renewalDate"),
            )

            parsed_date = parse_date(renewal_date_value)

            if not parsed_date:
                return JsonResponse(
                    {
                        "error": (
                            "Renewal date must use YYYY-MM-DD format."
                        )
                    },
                    status=400,
                )

            if parsed_date < today:
                return JsonResponse(
                    {"error": "The renewal date cannot be in the past."},
                    status=400,
                )

            alert.renewal_date = parsed_date

        if "message" in data:
            alert.message = str(
                data.get("message") or ""
            ).strip()

        alert.save()

        if (
            alert.claim_id
            and (
                old_renewal_date != alert.renewal_date
                or old_message != alert.message
            )
        ):
            claim = (
                Claim.objects
                .select_related("patient", "created_by")
                .get(pk=alert.claim_id)
            )

            record_claim_history(
                claim=claim,
                event="Renewal Scheduled",
                previous_status=claim.status,
                new_status=claim.status,
                rejection_reason=(
                    alert.rejection_reason
                    or claim.rejection_reason
                ),
                notes=(
                    alert.message
                    or "The renewal reminder was updated."
                ),
                renewal_date=alert.renewal_date,
                user=request.user,
            )

        alert = (
            RenewalAlert.objects
            .select_related("patient", "claim")
            .get(pk=alert.pk)
        )

        return JsonResponse({
            "alert": alert_to_dict(alert),
            "message": "Renewal reminder updated successfully.",
        })


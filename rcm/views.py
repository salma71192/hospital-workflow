import json
import re
from datetime import date, datetime, timedelta

from django.db import IntegrityError, transaction
from django.db.models import ProtectedError
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from patients.models import Patient, normalize_patient_id
from .models import Claim, ClaimHistory, RenewalAlert


CLAIM_MANAGEMENT_ROLES = {"admin", "rcm"}

VALID_CLAIM_STATUSES = {
    "Approved",
    "Rejected",
    "Pending",
    "Submitted",
}

APPROVAL_FIELDS = {
    "requesting_clinician": (
        "requestingClinician",
        "requesting_clinician",
    ),
    "authorization_number": (
        "authorizationNumber",
        "authorization_number",
        "approvalNumber",
        "approval_number",
    ),
    "approval_date": ("approvalDate", "approval_date"),
    "expiration_date": ("expirationDate", "expiration_date"),
    "approved_visits": ("approvedVisits", "approved_visits"),
    "approved_units": ("approvedUnits", "approved_units"),
    "approved_service": (
        "approvedService",
        "approved_service",
        "service",
    ),
    "payer": (
        "payer",
        "insurance",
        "insuranceCompany",
        "insurance_company",
    ),
}

IMPORT_COLUMN_ALIASES = {
    "patientfilenumber": "patient_file_number",
    "filenumber": "patient_file_number",
    "mrn": "patient_file_number",
    "medicalrecordnumber": "patient_file_number",
    "medicalrecordno": "patient_file_number",
    "patientnumber": "patient_file_number",
    "fileno": "patient_file_number",
    "claimid": "claim_id",
    "requestingclinician": "requesting_clinician",
    "authorizationnumber": "authorization_number",
    "approvalnumber": "authorization_number",
    "approvaldate": "approval_date",
    "expirationdate": "expiration_date",
    "approvedvisits": "approved_visits",
    "approvedunits": "approved_units",
    "approvedservice": "approved_service",
    "service": "approved_service",
    "insurancepayer": "payer",
    "insurancecompany": "payer",
    "insurance": "payer",
    "payer": "payer",
    "approvalstatus": "status",
    "status": "status",
    "rejectionreason": "rejection_reason",
}


# =========================================================
# GENERAL HELPERS
# =========================================================

def json_error(message, status=400, **extra):
    return JsonResponse(
        {"error": message, **extra},
        status=status,
    )


def read_json(request):
    try:
        data = json.loads(request.body or b"{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None, json_error("Invalid JSON request body.")

    if not isinstance(data, dict):
        return None, json_error(
            "The request body must be a JSON object."
        )

    return data, None


def normalize_column_name(value):
    return re.sub(
        r"[^a-z0-9]",
        "",
        str(value or "").lower(),
    )


def normalize_import_row(row):
    normalized = dict(row)

    for original_key, value in row.items():
        key = normalize_column_name(original_key)
        canonical = IMPORT_COLUMN_ALIASES.get(key)

        if canonical:
            normalized[canonical] = value

    if "rowNumber" in row:
        normalized["rowNumber"] = row["rowNumber"]
    elif "row_number" in row:
        normalized["rowNumber"] = row["row_number"]

    return normalized


def get_value(data, *keys, default=None):
    for key in keys:
        if key in data:
            return data.get(key)

    return default


def get_patient(patient_pk):
    try:
        return Patient.objects.get(pk=patient_pk)
    except (
        Patient.DoesNotExist,
        ValueError,
        TypeError,
    ):
        return None


def patient_name_of(patient):
    return (
        getattr(patient, "name", None)
        or getattr(patient, "full_name", None)
        or getattr(patient, "patient_name", None)
        or str(patient)
    )


def patient_file_number_field():
    available = {
        field.name
        for field in Patient._meta.get_fields()
        if getattr(field, "concrete", False)
    }

    for name in (
        "patient_id",
        "file_number",
        "patient_file_number",
        "patient_number",
        "medical_record_number",
        "medical_record_no",
        "mrn",
        "file_no",
    ):
        if name in available:
            return name

    return None


def patient_file_number_of(patient):
    field = patient_file_number_field()

    if field:
        value = getattr(patient, field, None)

        if value not in (None, ""):
            return str(value)

    return "—"


def find_patient_by_file_number(file_number):
    file_number = normalize_patient_id(file_number)

    if not file_number:
        return None, "Patient file number is required."

    field = patient_file_number_field()

    if not field:
        return None, (
            "Patient file-number field could not be identified."
        )

    patient = Patient.objects.filter(
        **{f"{field}__iexact": file_number}
    ).first()

    if not patient:
        return None, (
            f"No patient found with file number {file_number}."
        )

    return patient, None


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


def is_authenticated_user(user):
    return bool(user and user.is_authenticated)


def user_can_manage_claims(user):
    if not is_authenticated_user(user):
        return False

    if user.is_superuser or user.is_staff:
        return True

    role = str(
        getattr(user, "role", "") or ""
    ).strip().lower()

    return role in CLAIM_MANAGEMENT_ROLES


def require_login(
    request,
    message="Please log in to continue.",
):
    if not is_authenticated_user(request.user):
        return json_error(message, 401)

    return None


def require_claim_manager(request):
    if not is_authenticated_user(request.user):
        return json_error(
            "Please log in to continue.",
            401,
        )

    if not user_can_manage_claims(request.user):
        return json_error(
            "You do not have permission to perform this action.",
            403,
        )

    return None


# =========================================================
# DATE AND FIELD VALIDATION
# =========================================================

def parse_date(value):
    if value in (None, ""):
        return None

    if isinstance(value, datetime):
        return value.date()

    if isinstance(value, date):
        return value

    # Excel serial dates.
    if isinstance(value, (int, float)):
        try:
            serial = float(value)

            if serial <= 0:
                return None

            return (
                date(1899, 12, 30)
                + timedelta(days=int(serial))
            )

        except (
            ValueError,
            TypeError,
            OverflowError,
        ):
            return None

    value = str(value).strip()

    if not value:
        return None

    # Numeric strings can also represent Excel serial dates.
    if re.fullmatch(r"\d+(\.\d+)?", value):
        try:
            serial = float(value)

            if serial > 0:
                return (
                    date(1899, 12, 30)
                    + timedelta(days=int(serial))
                )

        except (
            ValueError,
            TypeError,
            OverflowError,
        ):
            pass

    try:
        return date.fromisoformat(value[:10])
    except (ValueError, TypeError):
        pass

    try:
        return datetime.fromisoformat(
            value.replace("Z", "+00:00")
        ).date()
    except (ValueError, TypeError):
        pass

    formats = (
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%d-%m-%Y",
        "%Y/%m/%d",
        "%d.%m.%Y",
        "%d/%m/%y",
        "%m/%d/%y",
    )

    for date_format in formats:
        try:
            return datetime.strptime(
                value,
                date_format,
            ).date()
        except (ValueError, TypeError):
            continue

    return None


def approval_values_from_data(data, importing=False):
    values = {}
    errors = []

    for model_field, aliases in APPROVAL_FIELDS.items():
        supplied = any(
            alias in data
            for alias in aliases
        )

        if not supplied:
            continue

        raw = get_value(data, *aliases)

        # Blank spreadsheet cells should not erase existing values.
        if importing and raw in (None, ""):
            continue

        if model_field in {
            "approval_date",
            "expiration_date",
        }:
            parsed = parse_date(raw)

            if raw not in (None, "") and parsed is None:
                errors.append(
                    f"{model_field.replace('_', ' ').title()} "
                    "contains an invalid date."
                )
                continue

            values[model_field] = parsed

        elif model_field in {
            "approved_visits",
            "approved_units",
        }:
            if raw in (None, ""):
                values[model_field] = None
                continue

            try:
                number = float(str(raw).strip())

                if not number.is_integer() or number < 0:
                    raise ValueError

                values[model_field] = int(number)

            except (ValueError, TypeError):
                errors.append(
                    f"{model_field.replace('_', ' ').title()} "
                    "must be a non-negative whole number."
                )

        else:
            values[model_field] = str(
                raw or ""
            ).strip()

    return values, errors


def get_status(data, default="Pending"):
    raw = str(
        data.get("status", default) or default
    ).strip()

    for valid in VALID_CLAIM_STATUSES:
        if raw.lower() == valid.lower():
            return valid

    return raw


def validate_status(status, rejection_reason):
    if status not in VALID_CLAIM_STATUSES:
        return "Invalid claim status."

    if status == "Rejected" and not rejection_reason:
        return "A rejection reason is required."

    return None


# =========================================================
# HISTORY
# =========================================================

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


def history_to_dict(record):
    claim = record.claim
    actor = record.created_by

    actor_name = user_name_of(actor)
    creator_name = user_name_of(claim.created_by)

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

    return {
        "id": record.pk,
        "claimPk": claim.pk,
        "claim_pk": claim.pk,
        "claimId": claim.claim_id,
        "claim_id": claim.claim_id,
        "patientId": claim.patient_id,
        "patient_id": claim.patient_id,
        "patientName": patient_name_of(claim.patient),

        "event": record.event,
        "eventType": record.event,
        "event_type": record.event,
        "eventLabel": record.event,
        "event_label": record.event,

        "previousStatus": record.previous_status,
        "previous_status": record.previous_status,
        "newStatus": record.new_status,
        "new_status": record.new_status,
        "status": record.new_status,

        "createdBy": actor_name,
        "created_by": actor_name,
        "createdByName": actor_name,
        "created_by_name": actor_name,
        "created_by_id": record.created_by_id,
        "createdById": record.created_by_id,

        "user": user_data_of(actor),
        "userName": actor_name,
        "user_name": actor_name,
        "userId": record.created_by_id,
        "user_id": record.created_by_id,

        "changedBy": actor_name,
        "changed_by": actor_name,
        "changedByName": actor_name,
        "changed_by_name": actor_name,
        "changedById": record.created_by_id,
        "changed_by_id": record.created_by_id,

        "editedBy": actor_name,
        "edited_by": actor_name,
        "editedByName": actor_name,
        "edited_by_name": actor_name,

        "actor": user_data_of(actor),
        "actorName": actor_name,
        "actor_name": actor_name,

        "claimCreator": creator_name,
        "claim_creator": creator_name,
        "claimCreatedBy": creator_name,
        "claim_created_by": creator_name,
        "claimCreatedByName": creator_name,
        "claim_created_by_name": creator_name,
        "claimCreatedById": claim.created_by_id,
        "claim_created_by_id": claim.created_by_id,
        "originalCreator": creator_name,
        "original_creator": creator_name,
        "originalCreatorId": claim.created_by_id,
        "original_creator_id": claim.created_by_id,
        "claimCreatorData": user_data_of(claim.created_by),

        "rejectionReason": record.rejection_reason,
        "rejection_reason": record.rejection_reason,
        "notes": record.notes,
        "renewalDate": renewal_date,
        "renewal_date": renewal_date,
        "createdAt": created_at,
        "created_at": created_at,
        "date": created_at,
    }


def get_claim_history(claim):
    records = (
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

    return [
        history_to_dict(record)
        for record in records
    ]


# =========================================================
# SERIALIZERS
# =========================================================

def claim_to_dict(claim):
    patient = claim.patient
    creator = claim.created_by

    approval_date = (
        claim.approval_date.isoformat()
        if claim.approval_date
        else None
    )

    expiration_date = (
        claim.expiration_date.isoformat()
        if claim.expiration_date
        else None
    )

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

    file_number = patient_file_number_of(patient)
    creator_name = user_name_of(creator)
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

        "requestingClinician": claim.requesting_clinician,
        "requesting_clinician": claim.requesting_clinician,
        "authorizationNumber": claim.authorization_number,
        "authorization_number": claim.authorization_number,
        "approvalDate": approval_date,
        "approval_date": approval_date,
        "expirationDate": expiration_date,
        "expiration_date": expiration_date,
        "approvedVisits": claim.approved_visits,
        "approved_visits": claim.approved_visits,
        "approvedUnits": claim.approved_units,
        "approved_units": claim.approved_units,
        "approvedService": claim.approved_service,
        "approved_service": claim.approved_service,
        "payer": claim.payer,
        "insurance": claim.payer,

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

        "history": get_claim_history(claim),
    }


def alert_to_dict(alert):
    patient = alert.patient
    claim = alert.claim

    file_number = patient_file_number_of(patient)
    linked_claim_id = claim.claim_id if claim else ""
    claim_status = claim.status if claim else None

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

    rejection_reason = alert.rejection_reason or ""

    if claim and claim.rejection_reason:
        rejection_reason = claim.rejection_reason

    effective_status = claim_status or alert.status

    return {
        "id": alert.pk,
        "patientId": alert.patient_id,
        "patient_id": alert.patient_id,
        "patientName": patient_name_of(patient),
        "patientFileNumber": file_number,
        "file_number": file_number,

        "claimPk": claim.pk if claim else None,
        "claim_pk": claim.pk if claim else None,
        "claimId": alert.claim_id_value or linked_claim_id,
        "claim_id_value": alert.claim_id_value or linked_claim_id,

        "claim_status": claim_status,
        "claimStatus": claim_status,
        "claim": {
            "id": claim.pk,
            "pk": claim.pk,
            "claim_id": linked_claim_id,
            "claimId": linked_claim_id,
            "status": claim_status,
            "rejection_reason": claim.rejection_reason,
        } if claim else None,

        "renewal_status": effective_status,
        "renewalStatus": effective_status,
        "status": effective_status,

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
        return json_error(
            "Please log in to manage claims.",
            401,
        )

    if user_can_manage_claims(user):
        return None

    if not claim.created_by_id:
        return json_error(
            "This claim has no recorded creator. Contact an administrator.",
            403,
        )

    if claim.created_by_id != user.pk:
        return json_error(
            "You can only manage claims that you created.",
            403,
        )

    if not claim.created_at:
        return json_error(
            "The claim creation date is unavailable.",
            403,
        )

    created_date = timezone.localtime(
        claim.created_at
    ).date()

    if created_date != timezone.localdate():
        return json_error(
            "Claims can only be edited on the day they were created.",
            403,
        )

    return None


def renewal_alert_permission_error(request):
    return require_claim_manager(request)


# =========================================================
# CLAIM LIST / CREATE / RESUBMIT
# =========================================================

@csrf_exempt
@require_http_methods(["GET", "POST"])
def claims_list_create(request):
    if request.method == "GET":
        login_error = require_login(
            request,
            "Please log in to view claims.",
        )

        if login_error:
            return login_error

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
            queryset = queryset.filter(
                patient_id=patient_id
            )

        if claim_id:
            queryset = queryset.filter(
                claim_id__iexact=claim_id
            )

        return JsonResponse({
            "results": [
                claim_to_dict(claim)
                for claim in queryset
            ]
        })

    login_error = require_login(
        request,
        "Please log in to create claims.",
    )

    if login_error:
        return login_error

    data, error = read_json(request)

    if error:
        return error

    patient_pk = get_value(
        data,
        "patientId",
        "patient_id",
    )

    claim_id = str(
        get_value(
            data,
            "claimId",
            "claim_id",
            default="",
        ) or ""
    ).strip()

    status = get_status(data)

    rejection_reason = str(
        get_value(
            data,
            "rejectionReason",
            "rejection_reason",
            default="",
        ) or ""
    ).strip()

    renewal_alert_id = get_value(
        data,
        "renewalAlertId",
        "renewal_alert_id",
    )

    approval_values, approval_errors = (
        approval_values_from_data(data)
    )

    if approval_errors:
        return json_error(" ".join(approval_errors))

    if not patient_pk:
        return json_error("Patient is required.")

    patient = get_patient(patient_pk)

    if not patient:
        return json_error("Patient was not found.", 404)

    if not claim_id and not renewal_alert_id:
        return json_error("Claim ID is required.")

    status_error = validate_status(
        status,
        rejection_reason,
    )

    if status_error:
        return json_error(status_error)

    try:
        with transaction.atomic():
            renewal_alert = None

            if renewal_alert_id:
                try:
                    renewal_alert = (
                        RenewalAlert.objects
                        .select_for_update()
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
                    return json_error(
                        "Renewal alert was not found.",
                        404,
                    )

                if renewal_alert.status in {
                    "Submitted",
                    "Approved",
                }:
                    return json_error(
                        "This renewal has already been "
                        f"{renewal_alert.status.lower()}.",
                        409,
                    )

                if (
                    renewal_alert.renewal_date
                    != timezone.localdate()
                ):
                    return json_error(
                        "This renewal can only be submitted on its "
                        "scheduled renewal date."
                    )

                claim = None

                if renewal_alert.claim_id:
                    claim = (
                        Claim.objects
                        .select_for_update()
                        .filter(pk=renewal_alert.claim_id)
                        .first()
                    )

                if (
                    not claim
                    and renewal_alert.claim_id_value
                ):
                    claim = (
                        Claim.objects
                        .select_for_update()
                        .filter(
                            patient_id=patient.pk,
                            claim_id__iexact=(
                                renewal_alert.claim_id_value
                            ),
                        )
                        .first()
                    )

                if not claim:
                    return json_error(
                        "No existing claim is linked to this renewal. "
                        "Link the original claim before resubmitting."
                    )

                if claim.patient_id != patient.pk:
                    return json_error(
                        "The claim belongs to another patient."
                    )

                previous_status = claim.status
                previous_reason = claim.rejection_reason or ""

                claim.status = "Submitted"
                claim.rejection_reason = ""

                for field, value in approval_values.items():
                    setattr(claim, field, value)

                claim.save()

                record_claim_history(
                    claim=claim,
                    event="Resubmitted",
                    previous_status=previous_status,
                    new_status="Submitted",
                    rejection_reason=(
                        renewal_alert.rejection_reason
                        or previous_reason
                    ),
                    notes=(
                        "Claim resubmitted from the renewal reminder."
                    ),
                    renewal_date=renewal_alert.renewal_date,
                    user=request.user,
                )

                renewal_alert.claim = claim
                renewal_alert.claim_id_value = claim.claim_id
                renewal_alert.status = "Submitted"
                renewal_alert.submission_date = timezone.now()
                renewal_alert.save()

            else:
                existing = Claim.objects.filter(
                    patient=patient,
                    claim_id__iexact=claim_id,
                ).first()

                if existing:
                    return json_error(
                        "This Claim ID already exists for this patient. "
                        "Use the existing claim's renewal reminder to "
                        "resubmit it.",
                        409,
                        existingClaimPk=existing.pk,
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
                    **approval_values,
                )

                record_claim_history(
                    claim=claim,
                    event="Created",
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
        return json_error(
            "This Claim ID already exists for this patient.",
            409,
        )

    claim = (
        Claim.objects
        .select_related("patient", "created_by")
        .get(pk=claim.pk)
    )

    response = {
        "claim": claim_to_dict(claim),
        "message": (
            "Existing claim resubmitted successfully."
            if renewal_alert_id
            else "Claim created successfully."
        ),
    }

    if renewal_alert_id:
        alert = (
            RenewalAlert.objects
            .select_related("patient", "claim")
            .get(pk=renewal_alert_id)
        )

        response["alert"] = alert_to_dict(alert)

    return JsonResponse(
        response,
        status=200 if renewal_alert_id else 201,
    )


# =========================================================
# BULK IMPORT
# =========================================================

@csrf_exempt
@require_http_methods(["POST"])
def claims_bulk_import(request):
    permission_error = require_claim_manager(request)

    if permission_error:
        return permission_error

    data, error = read_json(request)

    if error:
        return error

    rows = data.get("claims")

    if not isinstance(rows, list) or not rows:
        return json_error(
            "Please provide a non-empty claims list."
        )

    created_count = 0
    updated_count = 0
    failed_count = 0
    results = []

    for index, original_row in enumerate(rows, start=1):
        if not isinstance(original_row, dict):
            failed_count += 1

            results.append({
                "row": index + 1,
                "status": "failed",
                "message": "Invalid row format.",
            })

            continue

        row = normalize_import_row(original_row)
        excel_row = row.get("rowNumber", index + 1)

        try:
            with transaction.atomic():
                file_number = get_value(
                    row,
                    "patient_file_number",
                    "patientFileNumber",
                    "fileNumber",
                    "file_number",
                    "mrn",
                    "medicalRecordNumber",
                    "medical_record_number",
                )

                patient, patient_error = (
                    find_patient_by_file_number(file_number)
                )

                if patient_error:
                    raise ValueError(patient_error)

                claim_id = str(
                    get_value(
                        row,
                        "claim_id",
                        "claimId",
                        default="",
                    ) or ""
                ).strip()

                if not claim_id:
                    raise ValueError("Claim ID is required.")

                status = get_status(row)

                rejection_reason = str(
                    get_value(
                        row,
                        "rejection_reason",
                        "rejectionReason",
                        default="",
                    ) or ""
                ).strip()

                status_error = validate_status(
                    status,
                    rejection_reason,
                )

                if status_error:
                    raise ValueError(status_error)

                approval_values, approval_errors = (
                    approval_values_from_data(
                        row,
                        importing=True,
                    )
                )

                if approval_errors:
                    raise ValueError(
                        " ".join(approval_errors)
                    )

                claim = (
                    Claim.objects
                    .select_for_update()
                    .filter(
                        patient=patient,
                        claim_id__iexact=claim_id,
                    )
                    .first()
                )

                if claim:
                    previous_status = claim.status
                    previous_reason = (
                        claim.rejection_reason or ""
                    )

                    claim.status = status
                    claim.rejection_reason = (
                        rejection_reason
                        if status == "Rejected"
                        else ""
                    )

                    for field, value in approval_values.items():
                        setattr(claim, field, value)

                    claim.save()

                    if previous_status != status:
                        event = {
                            "Approved": "Approved",
                            "Rejected": "Rejected",
                            "Submitted": "Submitted",
                            "Pending": "Status Changed",
                        }[status]

                        record_claim_history(
                            claim=claim,
                            event=event,
                            previous_status=previous_status,
                            new_status=status,
                            rejection_reason=(
                                rejection_reason
                                if status == "Rejected"
                                else previous_reason
                            ),
                            notes=(
                                "Claim updated from Excel approval import."
                            ),
                            user=request.user,
                        )

                    elif (
                        status == "Rejected"
                        and previous_reason != rejection_reason
                    ):
                        record_claim_history(
                            claim=claim,
                            event="Rejected",
                            previous_status=previous_status,
                            new_status=status,
                            rejection_reason=rejection_reason,
                            notes=(
                                "Rejection details updated from Excel import."
                            ),
                            user=request.user,
                        )

                    updated_count += 1
                    result_status = "updated"
                    result_message = "Existing claim updated."

                else:
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
                        **approval_values,
                    )

                    record_claim_history(
                        claim=claim,
                        event="Created",
                        new_status=status,
                        rejection_reason=(
                            rejection_reason
                            if status == "Rejected"
                            else ""
                        ),
                        notes=(
                            "Claim created from Excel approval import."
                        ),
                        user=request.user,
                    )

                    created_count += 1
                    result_status = "created"
                    result_message = (
                        "Claim imported successfully."
                    )

                # Keep linked alerts consistent with the imported claim.
                linked_alerts = RenewalAlert.objects.filter(
                    claim=claim
                )

                for alert in linked_alerts:
                    alert.status = claim.status
                    alert.save()

                claim = (
                    Claim.objects
                    .select_related("patient", "created_by")
                    .get(pk=claim.pk)
                )

                results.append({
                    "row": excel_row,
                    "status": result_status,
                    "message": result_message,
                    "claim": claim_to_dict(claim),
                })

        except (ValueError, IntegrityError) as exc:
            failed_count += 1

            results.append({
                "row": excel_row,
                "status": "failed",
                "message": str(exc),
            })

        except Exception:
            failed_count += 1

            results.append({
                "row": excel_row,
                "status": "failed",
                "message": (
                    "Could not import this row. Check the patient number, "
                    "claim ID, dates, and approval values."
                ),
            })

    message = (
        "All claims imported successfully."
        if failed_count == 0
        else (
            "Import completed with errors. "
            "Please review the failed rows."
        )
    )

    return JsonResponse({
        "success": failed_count == 0,
        "message": message,
        "created": created_count,
        "updated": updated_count,
        "failed": failed_count,
        "total": len(rows),
        "results": results,
    })


# =========================================================
# CLAIM DETAIL
# =========================================================

@csrf_exempt
@require_http_methods(["GET", "PUT", "PATCH", "DELETE"])
def claim_detail(request, claim_pk):
    login_error = require_login(
        request,
        "Please log in to view claims.",
    )

    if login_error:
        return login_error

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
        return json_error("Claim was not found.", 404)

    if request.method == "GET":
        claim_data = claim_to_dict(claim)

        return JsonResponse({
            "claim": claim_data,
            **claim_data,
        })

    permission_error = claim_permission_error(
        request,
        claim,
    )

    if permission_error:
        return permission_error

    if request.method == "DELETE":
        if ClaimHistory.objects.filter(claim=claim).exists():
            return json_error(
                "This claim has permanent history records and cannot be "
                "deleted. Keep it for audit purposes or implement an "
                "archive feature instead.",
                409,
            )

        try:
            with transaction.atomic():
                claim.delete()

        except ProtectedError:
            return json_error(
                "This claim is linked to protected records and cannot "
                "be deleted.",
                409,
            )

        return JsonResponse({
            "message": "Claim deleted successfully."
        })

    data, error = read_json(request)

    if error:
        return error

    status = get_status(data, claim.status)

    rejection_reason = str(
        get_value(
            data,
            "rejection_reason",
            "rejectionReason",
            default=claim.rejection_reason,
        ) or ""
    ).strip()

    approval_values, approval_errors = (
        approval_values_from_data(data)
    )

    if approval_errors:
        return json_error(" ".join(approval_errors))

    status_error = validate_status(
        status,
        rejection_reason,
    )

    if status_error:
        return json_error(status_error)

    alert_id = get_value(
        data,
        "alertId",
        "alert_id",
        "renewalAlertId",
        "renewal_alert_id",
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
            previous_reason = claim.rejection_reason or ""

            alert = None

            if alert_id:
                try:
                    alert = (
                        RenewalAlert.objects
                        .select_for_update()
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
                    return json_error(
                        "Renewal alert was not found.",
                        404,
                    )

                if (
                    alert.claim_id
                    and alert.claim_id != claim.pk
                ):
                    return json_error(
                        "This alert belongs to another claim."
                    )

                if alert.status == "Approved":
                    return json_error(
                        "This renewal has already been approved.",
                        409,
                    )

                if (
                    alert.status == "Submitted"
                    and status == "Submitted"
                ):
                    return json_error(
                        "This renewal has already been submitted.",
                        409,
                    )

                if (
                    status == "Submitted"
                    and alert.renewal_date != timezone.localdate()
                ):
                    return json_error(
                        "This renewal can only be submitted on its "
                        "scheduled renewal date."
                    )

            claim.status = status

            claim.rejection_reason = (
                rejection_reason
                if status == "Rejected"
                else ""
            )

            for field, value in approval_values.items():
                setattr(claim, field, value)

            claim.save()

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
                        else previous_reason
                    ),
                    notes=(
                        "Claim resubmitted."
                        if event == "Resubmitted"
                        else "Claim status updated."
                    ),
                    renewal_date=(
                        alert.renewal_date
                        if alert
                        else None
                    ),
                    user=request.user,
                )

            elif (
                status == "Rejected"
                and previous_reason != rejection_reason
            ):
                record_claim_history(
                    claim=claim,
                    event="Rejected",
                    previous_status=previous_status,
                    new_status=status,
                    rejection_reason=rejection_reason,
                    notes="Claim rejection reason updated.",
                    user=request.user,
                )

            # Update linked alerts after updating the claim.
            alerts_to_update = RenewalAlert.objects.filter(
                claim=claim
            )

            if alert:
                alert.claim = claim
                alert.claim_id_value = claim.claim_id

                alerts_to_update = RenewalAlert.objects.filter(
                    pk=alert.pk
                )

            for linked_alert in alerts_to_update:
                if status == "Submitted":
                    linked_alert.submission_date = timezone.now()

                linked_alert.save()

    except Claim.DoesNotExist:
        return json_error("Claim was not found.", 404)

    claim = (
        Claim.objects
        .select_related("patient", "created_by")
        .get(pk=claim.pk)
    )

    claim_data = claim_to_dict(claim)

    response = {
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

        response["alert"] = alert_to_dict(updated_alert)

    return JsonResponse(response)


# =========================================================
# APPROVE RENEWAL ALERT
# =========================================================

@csrf_exempt
@require_http_methods(["POST"])
def approve_renewal_alert(request, alert_pk):
    permission_error = renewal_alert_permission_error(request)

    if permission_error:
        return permission_error

    try:
        with transaction.atomic():
            alert = (
                RenewalAlert.objects
                .select_for_update(of=("self",))
                .select_related("patient", "claim")
                .get(
                    pk=alert_pk,
                    alert_type="renewal",
                )
            )

            claim = None

            if alert.claim_id:
                claim = (
                    Claim.objects
                    .select_for_update()
                    .filter(pk=alert.claim_id)
                    .first()
                )

            if (
                not claim
                and alert.claim_id_value
            ):
                claim = (
                    Claim.objects
                    .select_for_update()
                    .filter(
                        patient_id=alert.patient_id,
                        claim_id__iexact=alert.claim_id_value,
                    )
                    .first()
                )

            if not claim:
                return json_error(
                    "This renewal has no linked claim. Link the original "
                    "claim before approving."
                )

            if claim.patient_id != alert.patient_id:
                return json_error(
                    "The claim belongs to another patient."
                )

            previous_status = claim.status
            previous_reason = claim.rejection_reason or ""

            if claim.status != "Approved":
                claim.status = "Approved"
                claim.rejection_reason = ""
                claim.save()

                record_claim_history(
                    claim=claim,
                    event="Approved",
                    previous_status=previous_status,
                    new_status="Approved",
                    rejection_reason=previous_reason,
                    notes="Claim approved from Renewal Alerts.",
                    renewal_date=alert.renewal_date,
                    user=request.user,
                )

            alert.claim = claim
            alert.claim_id_value = claim.claim_id
            alert.status = "Approved"
            alert.save()

            alert = (
                RenewalAlert.objects
                .select_related("patient", "claim")
                .get(pk=alert.pk)
            )

            claim = (
                Claim.objects
                .select_related("patient", "created_by")
                .get(pk=claim.pk)
            )

    except RenewalAlert.DoesNotExist:
        return json_error(
            "Renewal reminder was not found.",
            404,
        )

    return JsonResponse({
        "message": "Renewal approved successfully.",
        "alert": alert_to_dict(alert),
        "claim": claim_to_dict(claim),
    })


# =========================================================
# CLAIM HISTORY
# =========================================================

@csrf_exempt
@require_http_methods(["GET"])
def claim_history_list(request, claim_pk=None):
    login_error = require_login(
        request,
        "Please log in to view claim history.",
    )

    if login_error:
        return login_error

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
            return json_error(
                "Claim was not found.",
                404,
            )

        queryset = queryset.filter(
            claim_id=claim_pk
        )

    query_claim_pk = request.GET.get("claim_pk")

    claim_id = (
        request.GET.get("claim_id")
        or request.GET.get("claimId")
        or ""
    ).strip()

    patient_id = request.GET.get("patient_id")
    event = request.GET.get("event", "").strip()

    if query_claim_pk and claim_pk is None:
        queryset = queryset.filter(
            claim_id=query_claim_pk
        )

    if claim_id:
        queryset = queryset.filter(
            claim__claim_id__iexact=claim_id
        )

    if patient_id:
        queryset = queryset.filter(
            claim__patient_id=patient_id
        )

    if event:
        queryset = queryset.filter(
            event__iexact=event
        )

    return JsonResponse({
        "results": [
            history_to_dict(record)
            for record in queryset
        ]
    })


# =========================================================
# RENEWAL ALERT LIST / CREATE
# =========================================================

@csrf_exempt
@require_http_methods(["GET", "POST"])
def renewal_alerts_list_create(request):
    if request.method == "GET":
        login_error = require_login(
            request,
            "Please log in to view renewal reminders.",
        )

        if login_error:
            return login_error

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

        selected_date = request.GET.get(
            "date",
            "",
        ).strip()

        selected_month = request.GET.get(
            "month",
            "",
        ).strip()

        include_all = request.GET.get(
            "all",
            "",
        ).lower() in {
            "1",
            "true",
            "yes",
        }

        if patient_id:
            queryset = queryset.filter(
                patient_id=patient_id
            )

        if claim_id:
            queryset = queryset.filter(
                claim_id_value__iexact=claim_id
            )

        if selected_date:
            parsed = parse_date(selected_date)

            if not parsed:
                return json_error(
                    "date must use YYYY-MM-DD format."
                )

            queryset = queryset.filter(
                renewal_date=parsed
            )

        elif selected_month:
            try:
                month_start = date.fromisoformat(
                    f"{selected_month}-01"
                )

            except (ValueError, TypeError):
                return json_error(
                    "month must use YYYY-MM format."
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

    login_error = require_login(
        request,
        "Please log in to create renewal reminders.",
    )

    if login_error:
        return login_error

    data, error = read_json(request)

    if error:
        return error

    patient_pk = get_value(
        data,
        "patientId",
        "patient_id",
    )

    claim_pk = get_value(
        data,
        "claimPk",
        "claim_pk",
    )

    claim_id_value = str(
        get_value(
            data,
            "claimId",
            "claim_id",
            default="",
        ) or ""
    ).strip()

    renewal_date_value = get_value(
        data,
        "renewalDate",
        "renewal_date",
    )

    message = str(
        data.get("message", "") or ""
    ).strip()

    rejection_reason = str(
        get_value(
            data,
            "rejectionReason",
            "rejection_reason",
            default="",
        ) or ""
    ).strip()

    alert_type = str(
        get_value(
            data,
            "alertType",
            "alert_type",
            default="renewal",
        ) or "renewal"
    ).strip().lower()

    if alert_type != "renewal":
        return json_error(
            "Only renewal reminders are supported."
        )

    if not patient_pk:
        return json_error("Patient is required.")

    patient = get_patient(patient_pk)

    if not patient:
        return json_error(
            "Patient was not found.",
            404,
        )

    parsed_date = parse_date(renewal_date_value)

    if not parsed_date:
        return json_error(
            "Renewal date must use YYYY-MM-DD format."
        )

    if parsed_date < timezone.localdate():
        return json_error(
            "The renewal date cannot be in the past."
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
            return json_error(
                "The linked claim was not found for this patient.",
                404,
            )

    elif claim_id_value:
        claim = Claim.objects.filter(
            patient_id=patient.pk,
            claim_id__iexact=claim_id_value,
        ).first()

        if not claim:
            return json_error(
                "No claim was found with this Claim ID for the patient.",
                404,
            )

    if claim:
        claim_id_value = claim.claim_id

    if claim_id_value:
        duplicate = RenewalAlert.objects.filter(
            patient=patient,
            claim_id_value__iexact=claim_id_value,
            alert_type="renewal",
            renewal_date=parsed_date,
            status="Pending",
        ).first()

        if duplicate:
            duplicate = (
                RenewalAlert.objects
                .select_related("patient", "claim")
                .get(pk=duplicate.pk)
            )

            return JsonResponse({
                "alert": alert_to_dict(duplicate),
                "duplicate": True,
                "message": (
                    "A matching pending renewal reminder already exists."
                ),
            })

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

        if claim:
            record_claim_history(
                claim=claim,
                event="Renewal Scheduled",
                previous_status=claim.status,
                new_status=claim.status,
                rejection_reason=(
                    rejection_reason
                    or claim.rejection_reason
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

    return JsonResponse({
        "alert": alert_to_dict(alert),
        "message": "Renewal reminder created successfully.",
    }, status=201)


# =========================================================
# RENEWAL ALERT DETAIL
# =========================================================

@csrf_exempt
@require_http_methods(["GET", "PATCH", "PUT", "DELETE"])
def renewal_alert_detail(request, alert_pk):
    login_error = require_login(
        request,
        "Please log in to view renewal reminders.",
    )

    if login_error:
        return login_error

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
        return json_error(
            "Renewal reminder was not found.",
            404,
        )

    if request.method == "GET":
        return JsonResponse({
            "alert": alert_to_dict(alert)
        })

    permission_error = renewal_alert_permission_error(
        request
    )

    if permission_error:
        return permission_error

    with transaction.atomic():
        try:
            alert = (
                RenewalAlert.objects
                .select_for_update(of=("self",))
                .select_related("patient", "claim")
                .get(
                    pk=alert_pk,
                    alert_type="renewal",
                )
            )

        except RenewalAlert.DoesNotExist:
            return json_error(
                "Renewal reminder was not found.",
                404,
            )

        if (
            alert.status == "Approved"
            or (
                alert.claim_id
                and alert.claim.status == "Approved"
            )
        ):
            return json_error(
                "An approved renewal reminder cannot be edited or deleted.",
                403,
            )

        today = timezone.localdate()

        if (
            alert.renewal_date
            and alert.renewal_date < today
        ):
            return json_error(
                "Past renewal reminders cannot be edited or deleted.",
                403,
            )

        if alert.status == "Submitted":
            return json_error(
                "A submitted renewal reminder cannot be edited or deleted.",
                403,
            )

        if request.method == "DELETE":
            alert.delete()

            return JsonResponse({
                "message": (
                    "Renewal reminder deleted successfully."
                )
            })

        data, error = read_json(request)

        if error:
            return error

        old_date = alert.renewal_date
        old_message = alert.message

        if (
            "renewal_date" in data
            or "renewalDate" in data
        ):
            raw_date = get_value(
                data,
                "renewal_date",
                "renewalDate",
            )

            parsed_date = parse_date(raw_date)

            if not parsed_date:
                return json_error(
                    "Renewal date must use YYYY-MM-DD format."
                )

            if parsed_date < today:
                return json_error(
                    "The renewal date cannot be in the past."
                )

            alert.renewal_date = parsed_date

        if "message" in data:
            alert.message = str(
                data.get("message") or ""
            ).strip()

        # RenewalAlert.save() synchronizes status from its linked claim.
        alert.save()

        if (
            alert.claim_id
            and (
                old_date != alert.renewal_date
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
            "message": (
                "Renewal reminder updated successfully."
            ),
        })
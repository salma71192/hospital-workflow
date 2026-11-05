import json
import unicodedata
from datetime import date, datetime, time, timedelta

from django.apps import apps
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

from patients.models import Patient
from schedules.models import TherapistAppointment
from schedules.permissions import (
    can_manage_schedules,
    get_therapist_identity,
)


# =========================================================
# CONFIGURATION
# =========================================================

MAX_APPOINTMENTS = 200

DEFAULT_CONFIRMATION_STATUS = "unconfirmed"
DEFAULT_APPOINTMENT_TYPE = "followup"

CONFIRMATION_STATUSES = {
    "confirmed",
    "unconfirmed",
    "no_answer",
    "phone_off",
    "cancelled",
    "rescheduled",
}

FOLLOW_UP_STATUSES = {
    "unconfirmed",
    "no_answer",
    "phone_off",
}

APPOINTMENT_TYPES = {
    "followup",
    "evaluation",
}


# =========================================================
# RESPONSE AND AUTHENTICATION HELPERS
# Shared with appointments.py and imports.py
# =========================================================

def error(message, status=400):
    return JsonResponse({"error": str(message)}, status=status)


def require_login(request):
    if not request.user.is_authenticated:
        return error("Not authenticated", 401)

    return None


def require_manager(request):
    auth_error = require_login(request)

    if auth_error is not None:
        return auth_error

    if not can_manage_schedules(request.user):
        return error("Call Center permission required", 403)

    return None


def read_json(request):
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        return None

    return payload if isinstance(payload, dict) else None


def parse_date(value):
    if isinstance(value, datetime):
        return value.date()

    if isinstance(value, date):
        return value

    try:
        return date.fromisoformat(str(value))
    except (ValueError, TypeError):
        return None


def parse_time(value):
    if isinstance(value, datetime):
        return value.time()

    if isinstance(value, time):
        return value

    if value in (None, ""):
        return None

    try:
        return time.fromisoformat(str(value))
    except (ValueError, TypeError):
        return None


def normalized_name(value):
    return " ".join(
        unicodedata.normalize(
            "NFKC",
            str(value or ""),
        ).casefold().split()
    )


def normalize_status(value):
    value = str(value or "").strip().lower()

    aliases = {
        "no answer": "no_answer",
        "no-answer": "no_answer",
        "phone off": "phone_off",
        "phone-off": "phone_off",
        "canceled": "cancelled",
    }

    return aliases.get(value, value)


def model_has_field(field_name):
    return any(
        field.name == field_name
        for field in TherapistAppointment._meta.fields
    )


def get_history_model():
    try:
        return apps.get_model(
            "schedules",
            "AppointmentStatusHistory",
        )
    except LookupError:
        return None


def history_enabled():
    return get_history_model() is not None


def require_history_support():
    if not history_enabled():
        return error(
            "Appointment history is not configured. "
            "Add AppointmentStatusHistory to models.py "
            "and run migrations.",
            409,
        )

    return None


def require_extended_fields(*field_names):
    missing = [
        field
        for field in field_names
        if not model_has_field(field)
    ]

    if missing:
        return error(
            "Database model update required. "
            "Missing fields: " + ", ".join(missing),
            409,
        )

    return None


# =========================================================
# THERAPIST HELPERS
# =========================================================

def get_active_therapist(username):
    if not isinstance(username, str):
        return None

    username = username.strip()

    if not username:
        return None

    User = get_user_model()

    return User.objects.filter(
        username=username,
        role="physio",
        is_active=True,
    ).first()


def therapist_display_name(user):
    if user is None:
        return ""

    return (
        user.get_full_name().strip()
        or user.username
    )


# =========================================================
# PATIENT MATCHING
# =========================================================

def build_patient_index():
    index = {}

    patients = Patient.objects.filter(
        is_archived=False,
    ).only(
        "id",
        "name",
        "patient_id",
    )

    for patient in patients:
        key = normalized_name(patient.name)

        if not key:
            continue

        if key in index:
            index[key] = None
        else:
            index[key] = patient

    return index


def find_exact_patient(name, patient_index=None):
    if patient_index is None:
        patient_index = build_patient_index()

    return patient_index.get(normalized_name(name))


def resolve_patient(name, supplied_id=None, index=None):
    if supplied_id not in (None, ""):
        try:
            patient = Patient.objects.get(
                pk=supplied_id,
                is_archived=False,
            )
        except (
            Patient.DoesNotExist,
            ValueError,
            TypeError,
        ):
            raise ValueError("Invalid patient selection")

        if normalized_name(patient.name) != normalized_name(name):
            raise ValueError(
                "Patient name does not match selected record"
            )

        return patient

    return find_exact_patient(name, index)


# =========================================================
# APPOINTMENT SERIALIZATION
# =========================================================

def serialize_appointment(appointment):
    patient = appointment.patient

    creator = None
    if model_has_field("created_by"):
        creator = appointment.created_by

    result = {
        "id": appointment.id,
        "therapist": appointment.therapist,
        "date": appointment.appointment_date.isoformat(),
        "appointment_date": appointment.appointment_date.isoformat(),
        "time": (
            appointment.appointment_time.strftime("%H:%M")
            if appointment.appointment_time
            else None
        ),
        "appointment_time": (
            appointment.appointment_time.strftime("%H:%M")
            if appointment.appointment_time
            else None
        ),
        "patient_id": appointment.patient_id,
        "patient_name": appointment.patient_name,
        "file_number": patient.patient_id if patient else "",
        "confirmation_status": appointment.confirmation_status,
        "appointment_type": appointment.appointment_type,
        "source": appointment.source,
        "created_at": appointment.created_at.isoformat(),
        "updated_at": appointment.updated_at.isoformat(),
        "requires_follow_up": (
            appointment.confirmation_status in FOLLOW_UP_STATUSES
        ),
        "created_by": (
            therapist_display_name(creator)
            if creator
            else "Unknown staff"
        ),
        "created_by_id": (
            creator.id if creator else None
        ),
        "created_by_username": (
            creator.username if creator else None
        ),
    }

    optional_fields = (
        "notes",
        "second_call_attempts",
        "rescheduled_to_date",
        "rescheduled_to_time",
    )

    for field in optional_fields:
        if not model_has_field(field):
            continue

        value = getattr(appointment, field)

        if isinstance(value, (date, time, datetime)):
            value = value.isoformat()

        result[field] = value

    return result


def serialize_queryset(queryset):
    return [
        serialize_appointment(item)
        for item in queryset.select_related(
            "patient",
            "created_by",
        )
    ]


# =========================================================
# SUMMARY
# =========================================================

def calculate_summary(appointments):
    summary = {
        "total": len(appointments),
        "confirmed": 0,
        "unconfirmed": 0,
        "no_answer": 0,
        "phone_off": 0,
        "cancelled": 0,
        "rescheduled": 0,
        "evaluations": 0,
    }

    for item in appointments:
        status = normalize_status(
            item.get("confirmation_status")
        )

        if status in summary:
            summary[status] += 1

        if item.get("appointment_type") == "evaluation":
            summary["evaluations"] += 1

    summary["unconfirmed_total"] = (
        summary["unconfirmed"]
        + summary["no_answer"]
        + summary["phone_off"]
    )

    return summary


# =========================================================
# AUDIT HISTORY
# Shared with appointments.py
# =========================================================

def create_status_event(
    appointment,
    user,
    action,
    old_status="",
    new_status="",
    note="",
):
    History = get_history_model()

    if History is None:
        return None

    return History.objects.create(
        appointment=appointment,
        changed_by=user,
        action=action,
        old_status=old_status or "",
        new_status=new_status or "",
        note=note or "",
    )


def serialize_status_event(event):
    return {
        "id": event.id,
        "action": event.action,
        "old_status": event.old_status or None,
        "new_status": event.new_status or None,
        "note": event.note,
        "changed_by": (
            therapist_display_name(event.changed_by)
            if event.changed_by
            else "Unknown staff"
        ),
        "created_at": event.created_at.isoformat(),
    }


# =========================================================
# DIRECTORY: CALL CENTER USERS
# =========================================================

def get_call_center_users():
    User = get_user_model()

    users = User.objects.filter(
        is_active=True,
    ).exclude(
        role="physio",
    ).order_by(
        "first_name",
        "last_name",
        "username",
    )

    return [
        {
            "id": user.id,
            "username": user.username,
            "name": therapist_display_name(user),
        }
        for user in users
    ]


# =========================================================
# THERAPIST DIRECTORY
# =========================================================

@require_http_methods(["GET"])
def schedule_therapists_api(request):
    auth_error = require_manager(request)

    if auth_error is not None:
        return auth_error

    User = get_user_model()

    therapists = User.objects.filter(
        role="physio",
        is_active=True,
    ).order_by(
        "first_name",
        "last_name",
        "username",
    )

    return JsonResponse({
        "therapists": [
            {
                "id": user.id,
                "username": user.username,
                "name": therapist_display_name(user),
                "first_name": user.first_name,
                "last_name": user.last_name,
            }
            for user in therapists
        ]
    })


# =========================================================
# PHYSIOTHERAPIST'S OWN SCHEDULE
# =========================================================

@require_http_methods(["GET"])
def my_schedule_api(request):
    auth_error = require_login(request)

    if auth_error is not None:
        return auth_error

    therapist_username = get_therapist_identity(request.user)

    if not therapist_username:
        return error(
            "No physiotherapist identity configured",
            403,
        )

    selected_date = parse_date(request.GET.get("date"))

    if not selected_date:
        return error("A valid date is required")

    queryset = TherapistAppointment.objects.filter(
        therapist=therapist_username,
        appointment_date=selected_date,
    )

    last_record = queryset.order_by("-updated_at").first()

    appointments = serialize_queryset(
        queryset.order_by("appointment_time", "id")
    )

    return JsonResponse({
        "therapist": therapist_username,
        "therapist_name": therapist_display_name(request.user),
        "date": selected_date.isoformat(),
        "appointments": appointments,
        "summary": calculate_summary(appointments),
        "last_updated": (
            last_record.updated_at.isoformat()
            if last_record
            else None
        ),
    })


# =========================================================
# SCHEDULE HISTORY FILTER HELPERS
# =========================================================

def get_month_range(value):
    """
    Accepts YYYY-MM and returns the first and last date
    of that month.
    """
    try:
        year, month = [
            int(part)
            for part in str(value).split("-")
        ]

        if month < 1 or month > 12:
            return None

        start_date = date(year, month, 1)

        if month == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month + 1, 1)

        return start_date, end_date

    except (ValueError, TypeError):
        return None


def apply_status_filter(queryset, status):
    status = normalize_status(status)

    if not status:
        return queryset

    if status == "unconfirmed":
        return queryset.filter(
            confirmation_status__in=FOLLOW_UP_STATUSES
        )

    if status not in CONFIRMATION_STATUSES:
        return None

    return queryset.filter(
        confirmation_status=status
    )


# =========================================================
# CALL CENTER SCHEDULE / HISTORY
# =========================================================

@require_http_methods(["GET"])
def schedule_list_api(request):
    auth_error = require_manager(request)

    if auth_error is not None:
        return auth_error

    therapist_username = (
        request.GET.get("therapist") or ""
    ).strip()

    selected_date_value = (
        request.GET.get("date") or ""
    ).strip()

    selected_month_value = (
        request.GET.get("month") or ""
    ).strip()

    created_by_value = (
        request.GET.get("created_by") or ""
    ).strip()

    status_filter = (
        request.GET.get("status") or ""
    ).strip()

    queryset = TherapistAppointment.objects.select_related(
        "patient",
        "created_by",
    )

    # -----------------------------------------------------
    # DATE OR MONTH FILTER
    # -----------------------------------------------------

    if selected_month_value:
        month_range = get_month_range(selected_month_value)

        if month_range is None:
            return error("A valid month is required. Use YYYY-MM.")

        start_date, end_date = month_range

        queryset = queryset.filter(
            appointment_date__gte=start_date,
            appointment_date__lt=end_date,
        )

        response_date = None
        response_month = selected_month_value

    elif selected_date_value:
        selected_date = parse_date(selected_date_value)

        if selected_date is None:
            return error("A valid date is required")

        queryset = queryset.filter(
            appointment_date=selected_date
        )

        response_date = selected_date.isoformat()
        response_month = None

    else:
        return error(
            "Provide either a date (YYYY-MM-DD) "
            "or month (YYYY-MM)."
        )

    # -----------------------------------------------------
    # PHYSIOTHERAPIST FILTER
    # -----------------------------------------------------

    therapist_user = None

    if therapist_username:
        therapist_user = get_active_therapist(
            therapist_username
        )

        if therapist_user is None:
            return error(
                "Please select a valid active physiotherapist"
            )

        queryset = queryset.filter(
            therapist=therapist_user.username
        )

    # -----------------------------------------------------
    # CALL CENTER USER FILTER
    # -----------------------------------------------------

    if created_by_value:
        try:
            created_by_id = int(created_by_value)
        except (ValueError, TypeError):
            return error("Invalid Call Center user")

        queryset = queryset.filter(
            created_by_id=created_by_id
        )

    # -----------------------------------------------------
    # ORDER AND BASE APPOINTMENT LIST
    # -----------------------------------------------------

    queryset = queryset.order_by(
        "appointment_date",
        "appointment_time",
        "id",
    )

    all_appointments = serialize_queryset(queryset)

    # Summary is calculated before applying the status
    # filter, so the cards always show the full totals
    # for the selected date/month and other filters.
    summary = calculate_summary(all_appointments)

    # -----------------------------------------------------
    # STATUS FILTER
    # -----------------------------------------------------

    filtered_queryset = apply_status_filter(
        queryset,
        status_filter,
    )

    if filtered_queryset is None:
        return error("Invalid appointment status filter")

    appointments = serialize_queryset(filtered_queryset)

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return JsonResponse({
        "therapist": (
            therapist_user.username
            if therapist_user
            else therapist_username or None
        ),
        "therapist_name": (
            therapist_display_name(therapist_user)
            if therapist_user
            else None
        ),
        "date": response_date,
        "month": response_month,
        "appointments": appointments,
        "summary": summary,
        "active_status_filter": (
            normalize_status(status_filter)
            if status_filter
            else None
        ),
        "filters": {
            "therapist": therapist_username or None,
            "created_by": created_by_value or None,
            "status": status_filter or None,
        },
        "call_center_users": get_call_center_users(),
        "total": len(appointments),
    })


# =========================================================
# PATIENT SEARCH
# =========================================================

@require_http_methods(["GET"])
def schedule_patient_search_api(request):
    auth_error = require_manager(request)

    if auth_error is not None:
        return auth_error

    query = (request.GET.get("q") or "").strip()

    if len(query) < 2:
        return JsonResponse({"matches": []})

    patients = Patient.objects.filter(
        is_archived=False,
    ).filter(
        Q(name__icontains=query)
        | Q(patient_id__icontains=query)
    ).order_by("name")[:20]

    return JsonResponse({
        "matches": [
            {
                "id": patient.id,
                "name": patient.name,
                "file_number": patient.patient_id,
            }
            for patient in patients
        ]
    })


# =========================================================
# VALIDATE APPOINTMENT
# Used by save_schedule_api
# =========================================================

def validate_appointment(item, patient_index=None):
    if not isinstance(item, dict):
        raise ValueError("Each appointment must be an object")

    name = str(item.get("patient_name") or "").strip()

    appointment_time = parse_time(
        item.get("time") or item.get("appointment_time")
    )

    confirmation_status = normalize_status(
        item.get(
            "confirmation_status",
            DEFAULT_CONFIRMATION_STATUS,
        )
    )

    appointment_type = str(
        item.get(
            "appointment_type",
            DEFAULT_APPOINTMENT_TYPE,
        )
    ).strip().lower()

    if not name or len(name) > 255:
        raise ValueError("A valid patient name is required")

    if appointment_time is None:
        raise ValueError(
            f"Enter a valid appointment time for {name}"
        )

    if confirmation_status not in CONFIRMATION_STATUSES:
        raise ValueError(
            f"Invalid confirmation status for {name}"
        )

    if appointment_type not in APPOINTMENT_TYPES:
        raise ValueError(
            f"Invalid appointment type for {name}"
        )

    patient = resolve_patient(
        name,
        item.get("patient_id"),
        patient_index,
    )

    appointment_id = item.get("id")

    if appointment_id in ("", None):
        appointment_id = None
    else:
        try:
            appointment_id = int(appointment_id)

            if appointment_id <= 0:
                raise ValueError

        except (ValueError, TypeError):
            raise ValueError(
                f"Invalid appointment ID for {name}"
            )

    source = str(
        item.get("source") or "manual"
    ).strip().lower()

    if source not in {"excel", "concepts", "manual"}:
        raise ValueError(
            f"Invalid appointment source for {name}"
        )

    return {
        "id": appointment_id,
        "patient_name": name,
        "appointment_time": appointment_time,
        "confirmation_status": confirmation_status,
        "appointment_type": appointment_type,
        "patient": patient,
        "source": source,
    }


# =========================================================
# SAVE / PUBLISH SCHEDULE
# =========================================================

@require_http_methods(["POST"])
def save_schedule_api(request):
    auth_error = require_manager(request)

    if auth_error is not None:
        return auth_error

    payload = read_json(request)

    if payload is None:
        return error("Invalid JSON body")

    therapist_username = str(
        payload.get("therapist") or ""
    ).strip()

    selected_date = parse_date(payload.get("date"))
    incoming = payload.get("appointments")

    therapist_user = get_active_therapist(therapist_username)

    if therapist_user is None:
        return error(
            "Please select a valid active physiotherapist"
        )

    if not selected_date:
        return error("A valid schedule date is required")

    if not isinstance(incoming, list):
        return error("Appointments must be a list")

    if not 1 <= len(incoming) <= MAX_APPOINTMENTS:
        return error(
            "Schedule must contain 1 to 200 appointments"
        )

    patient_index = build_patient_index()
    validated = []

    try:
        for index, item in enumerate(incoming):
            try:
                validated.append(
                    validate_appointment(item, patient_index)
                )
            except ValueError as exc:
                raise ValueError(
                    f"Row {index + 1}: {exc}"
                )

    except ValueError as exc:
        return error(str(exc))

    supplied_ids = [
        entry["id"]
        for entry in validated
        if entry["id"] is not None
    ]

    if len(supplied_ids) != len(set(supplied_ids)):
        return error(
            "Duplicate appointment IDs were submitted"
        )

    with transaction.atomic():
        existing = {
            item.id: item
            for item in TherapistAppointment.objects
            .select_for_update()
            .filter(
                therapist=therapist_user.username,
                appointment_date=selected_date,
            )
        }

        for appointment_id in supplied_ids:
            if appointment_id not in existing:
                return error(
                    "An appointment ID does not belong "
                    "to the selected therapist and date"
                )

        for entry in validated:
            appointment_id = entry["id"]

            if appointment_id is not None:
                record = existing[appointment_id]
                old_status = record.confirmation_status
                changes = []

                for field in (
                    "patient",
                    "patient_name",
                    "appointment_time",
                    "confirmation_status",
                    "appointment_type",
                ):
                    new_value = entry[field]

                    if getattr(record, field) != new_value:
                        changes.append(
                            f"{field}: "
                            f"{getattr(record, field)} "
                            f"-> {new_value}"
                        )
                        setattr(record, field, new_value)

                if changes:
                    record.save()

                    create_status_event(
                        appointment=record,
                        user=request.user,
                        action=(
                            "status_updated"
                            if old_status != record.confirmation_status
                            else "appointment_updated"
                        ),
                        old_status=old_status,
                        new_status=record.confirmation_status,
                        note="; ".join(changes),
                    )

            else:
                record = TherapistAppointment.objects.create(
                    therapist=therapist_user.username,
                    appointment_date=selected_date,
                    patient=entry["patient"],
                    patient_name=entry["patient_name"],
                    appointment_time=entry["appointment_time"],
                    confirmation_status=entry["confirmation_status"],
                    appointment_type=entry["appointment_type"],
                    created_by=request.user,
                    source=entry["source"],
                )

                create_status_event(
                    appointment=record,
                    user=request.user,
                    action="appointment_created",
                    new_status=record.confirmation_status,
                    note=(
                        f"Created from {entry['source']} "
                        "published schedule"
                    ),
                )

    queryset = TherapistAppointment.objects.filter(
        therapist=therapist_user.username,
        appointment_date=selected_date,
    ).order_by("appointment_time", "id")

    saved = serialize_queryset(queryset)

    return JsonResponse({
        "message": "Schedule saved successfully",
        "therapist": therapist_user.username,
        "therapist_name": therapist_display_name(therapist_user),
        "date": selected_date.isoformat(),
        "appointments": saved,
        "summary": calculate_summary(saved),
        "total": len(saved),
    })
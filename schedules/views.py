
import json
import logging
import re
import unicodedata
from datetime import date, datetime, time

from django.apps import apps
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_http_methods

from openpyxl import load_workbook
from openpyxl.utils.datetime import from_excel

from patients.models import Patient
from .models import TherapistAppointment
from .permissions import (
    can_manage_schedules,
    get_therapist_identity,
)


logger = logging.getLogger(__name__)


# =========================================================
# CONFIGURATION
# =========================================================

MAX_APPOINTMENTS = 200
MAX_EXCEL_BYTES = 10 * 1024 * 1024
MAX_EXCEL_ROWS = 10000

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

ADMINISTRATIVE_TERMS = (
    "ask the therapist",
    "ask the terapist",
    "double booking",
    "duty time",
    "system initialized",
    "file version",
    "employees",
    "information",
    "schedule",
    "appointment",
    "working hours",
    "break time",
    "lunch break",
    "not available",
    "patient search",
    "select therapist",
)


# =========================================================
# RESPONSE AND AUTHENTICATION
# =========================================================

def error(message, status=400):
    return JsonResponse(
        {"error": str(message)},
        status=status,
    )


def require_login(request):
    if not request.user.is_authenticated:
        return error("Not authenticated", 401)

    return None


def require_manager(request):
    auth_error = require_login(request)

    if auth_error is not None:
        return auth_error

    if not can_manage_schedules(request.user):
        return error(
            "Call Center permission required",
            403,
        )

    return None


def read_json(request):
    try:
        payload = json.loads(
            request.body.decode("utf-8")
        )
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

    return patient_index.get(
        normalized_name(name)
    )


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
            raise ValueError(
                "Invalid patient selection"
            )

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

    result = {
        "id": appointment.id,
        "therapist": appointment.therapist,
        "date": appointment.appointment_date.isoformat(),
        "appointment_date": (
            appointment.appointment_date.isoformat()
        ),
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
        "file_number": (
            patient.patient_id if patient else ""
        ),
        "confirmation_status": appointment.confirmation_status,
        "appointment_type": appointment.appointment_type,
        "source": appointment.source,
        "created_at": appointment.created_at.isoformat(),
        "updated_at": appointment.updated_at.isoformat(),
        "requires_follow_up": (
            appointment.confirmation_status
            in FOLLOW_UP_STATUSES
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
        for item in queryset.select_related("patient")
    ]


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

    return summary


# =========================================================
# AUDIT HISTORY
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
# MY SCHEDULE
# =========================================================

@require_http_methods(["GET"])
def my_schedule_api(request):
    auth_error = require_login(request)

    if auth_error is not None:
        return auth_error

    therapist_username = get_therapist_identity(
        request.user
    )

    if not therapist_username:
        return error(
            "No physiotherapist identity configured",
            403,
        )

    selected_date = parse_date(
        request.GET.get("date")
    )

    if not selected_date:
        return error("A valid date is required")

    queryset = TherapistAppointment.objects.filter(
        therapist=therapist_username,
        appointment_date=selected_date,
    )

    last_record = queryset.order_by(
        "-updated_at"
    ).first()

    appointments = serialize_queryset(
        queryset.order_by(
            "appointment_time",
            "id",
        )
    )

    return JsonResponse({
        "therapist": therapist_username,
        "therapist_name": therapist_display_name(
            request.user
        ),
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
# CALL CENTER SCHEDULE
# =========================================================

@require_http_methods(["GET"])
def schedule_list_api(request):
    auth_error = require_manager(request)

    if auth_error is not None:
        return auth_error

    therapist_username = (
        request.GET.get("therapist") or ""
    ).strip()

    selected_date = parse_date(
        request.GET.get("date")
    )

    if not selected_date:
        return error("A valid date is required")

    therapist_user = get_active_therapist(
        therapist_username
    )

    if therapist_user is None:
        return error(
            "Please select a valid active physiotherapist"
        )

    queryset = TherapistAppointment.objects.filter(
        therapist=therapist_user.username,
        appointment_date=selected_date,
    ).order_by(
        "appointment_time",
        "id",
    )

    appointments = serialize_queryset(queryset)

    return JsonResponse({
        "therapist": therapist_user.username,
        "therapist_name": therapist_display_name(
            therapist_user
        ),
        "date": selected_date.isoformat(),
        "appointments": appointments,
        "summary": calculate_summary(appointments),
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
# =========================================================

def validate_appointment(item, patient_index=None):
    if not isinstance(item, dict):
        raise ValueError(
            "Each appointment must be an object"
        )

    name = str(
        item.get("patient_name") or ""
    ).strip()

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
        raise ValueError(
            "A valid patient name is required"
        )

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

    if source not in {
        "excel",
        "concepts",
        "manual",
    }:
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

    selected_date = parse_date(
        payload.get("date")
    )

    incoming = payload.get("appointments")

    therapist_user = get_active_therapist(
        therapist_username
    )

    if therapist_user is None:
        return error(
            "Please select a valid active physiotherapist"
        )

    if not selected_date:
        return error(
            "A valid schedule date is required"
        )

    if not isinstance(incoming, list):
        return error(
            "Appointments must be a list"
        )

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
                    validate_appointment(
                        item,
                        patient_index,
                    )
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
    ).order_by(
        "appointment_time",
        "id",
    )

    saved = serialize_queryset(queryset)

    return JsonResponse({
        "message": "Schedule saved successfully",
        "therapist": therapist_user.username,
        "therapist_name": therapist_display_name(
            therapist_user
        ),
        "date": selected_date.isoformat(),
        "appointments": saved,
        "summary": calculate_summary(saved),
        "total": len(saved),
    })


# =========================================================
# INDIVIDUAL APPOINTMENT VALIDATION
# =========================================================

def validate_schedule_record(payload, existing=None):
    if not isinstance(payload, dict):
        raise ValueError("Invalid appointment data")

    if existing is None:
        therapist = str(
            payload.get("therapist") or ""
        ).strip()

        therapist_user = get_active_therapist(therapist)

        if therapist_user is None:
            raise ValueError(
                "Select a valid active physiotherapist"
            )

        selected_date = parse_date(
            payload.get("date")
            or payload.get("appointment_date")
        )

        if selected_date is None:
            raise ValueError(
                "A valid appointment date is required"
            )
    else:
        therapist = existing.therapist
        selected_date = existing.appointment_date

        supplied_therapist = payload.get("therapist")

        if (
            supplied_therapist is not None
            and supplied_therapist != therapist
        ):
            raise ValueError(
                "Original therapist cannot be changed"
            )

        supplied_date = payload.get(
            "date",
            payload.get("appointment_date"),
        )

        if supplied_date is not None:
            if parse_date(supplied_date) != selected_date:
                raise ValueError(
                    "Original appointment date cannot be changed"
                )

    name = str(
        payload.get(
            "patient_name",
            existing.patient_name if existing else "",
        ) or ""
    ).strip()

    if not name or len(name) > 255:
        raise ValueError(
            "A valid patient name is required"
        )

    appointment_time = parse_time(
        payload.get(
            "time",
            payload.get(
                "appointment_time",
                existing.appointment_time
                if existing else None,
            ),
        )
    )

    if appointment_time is None:
        raise ValueError(
            "A valid appointment time is required"
        )

    if existing is not None:
        if appointment_time != existing.appointment_time:
            raise ValueError(
                "Original appointment time cannot be changed. "
                "Use Rescheduled with a new date and time."
            )

    status = normalize_status(
        payload.get(
            "confirmation_status",
            existing.confirmation_status
            if existing else DEFAULT_CONFIRMATION_STATUS,
        )
    )

    if status not in CONFIRMATION_STATUSES:
        raise ValueError(
            "Invalid confirmation status"
        )

    appointment_type = str(
        payload.get(
            "appointment_type",
            existing.appointment_type
            if existing else DEFAULT_APPOINTMENT_TYPE,
        )
    ).strip().lower()

    if appointment_type not in APPOINTMENT_TYPES:
        raise ValueError(
            "Invalid appointment type"
        )

    patient_id = payload.get(
        "patient_id",
        existing.patient_id if existing else None,
    )

    patient = resolve_patient(
        name,
        patient_id,
    )

    data = {
        "therapist": therapist,
        "appointment_date": selected_date,
        "appointment_time": appointment_time,
        "patient": patient,
        "patient_name": name,
        "confirmation_status": status,
        "appointment_type": appointment_type,
    }

    if model_has_field("notes"):
        notes = str(
            payload.get(
                "notes",
                existing.notes if existing else "",
            ) or ""
        )

        if len(notes) > 10000:
            raise ValueError(
                "Appointment notes are too long"
            )

        data["notes"] = notes

    if status == "rescheduled":
        required = require_extended_fields(
            "rescheduled_to_date",
            "rescheduled_to_time",
        )

        if required is not None:
            raise ValueError(
                "Rescheduling requires the expanded "
                "appointment database model"
            )

        new_date = parse_date(
            payload.get(
                "rescheduled_to_date",
                getattr(
                    existing,
                    "rescheduled_to_date",
                    None,
                ),
            )
        )

        new_time = parse_time(
            payload.get(
                "rescheduled_to_time",
                getattr(
                    existing,
                    "rescheduled_to_time",
                    None,
                ),
            )
        )

        if new_date is None or new_time is None:
            raise ValueError(
                "Rescheduling requires a new date and time"
            )

        if (
            new_date == selected_date
            and new_time == appointment_time
        ):
            raise ValueError(
                "New slot must differ from original slot"
            )

        data["rescheduled_to_date"] = new_date
        data["rescheduled_to_time"] = new_time

    else:
        if model_has_field("rescheduled_to_date"):
            data["rescheduled_to_date"] = None

        if model_has_field("rescheduled_to_time"):
            data["rescheduled_to_time"] = None

    return data


# =========================================================
# CREATE APPOINTMENT
# =========================================================

@require_http_methods(["POST"])
def schedule_appointment_create_api(request):
    auth_error = require_manager(request)

    if auth_error is not None:
        return auth_error

    payload = read_json(request)

    if payload is None:
        return error("Invalid JSON body")

    try:
        data = validate_schedule_record(payload)
    except ValueError as exc:
        return error(str(exc))

    with transaction.atomic():
        appointment = TherapistAppointment.objects.create(
            **data,
            created_by=request.user,
            source="manual",
        )

        create_status_event(
            appointment=appointment,
            user=request.user,
            action="appointment_created",
            new_status=appointment.confirmation_status,
            note="Appointment created manually",
        )

    return JsonResponse(
        {
            "message": "Appointment created",
            "appointment": serialize_appointment(
                appointment
            ),
        },
        status=201,
    )


# =========================================================
# VIEW / EDIT APPOINTMENT
# =========================================================

@require_http_methods(["GET", "PATCH"])
def schedule_appointment_detail_api(
    request,
    appointment_id,
):
    auth_error = require_manager(request)

    if auth_error is not None:
        return auth_error

    if request.method == "GET":
        appointment = get_object_or_404(
            TherapistAppointment.objects.select_related(
                "patient"
            ),
            pk=appointment_id,
        )

        return JsonResponse({
            "appointment": serialize_appointment(
                appointment
            )
        })

    payload = read_json(request)

    if payload is None:
        return error("Invalid JSON body")

    with transaction.atomic():
        appointment = get_object_or_404(
            TherapistAppointment.objects.select_for_update(),
            pk=appointment_id,
        )

        old_status = appointment.confirmation_status

        try:
            data = validate_schedule_record(
                payload,
                existing=appointment,
            )
        except ValueError as exc:
            return error(str(exc))

        changes = []

        for field, value in data.items():
            old_value = getattr(appointment, field)

            if old_value != value:
                changes.append(
                    f"{field}: {old_value} -> {value}"
                )
                setattr(appointment, field, value)

        if changes:
            appointment.save()

            create_status_event(
                appointment=appointment,
                user=request.user,
                action=(
                    "status_updated"
                    if old_status != appointment.confirmation_status
                    else "appointment_updated"
                ),
                old_status=old_status,
                new_status=appointment.confirmation_status,
                note="; ".join(changes),
            )

    return JsonResponse({
        "message": (
            "Appointment updated"
            if changes
            else "No changes detected"
        ),
        "appointment": serialize_appointment(
            appointment
        ),
    })


# =========================================================
# APPOINTMENT HISTORY
# =========================================================

@require_http_methods(["GET"])
def schedule_appointment_history_api(
    request,
    appointment_id,
):
    auth_error = require_manager(request)

    if auth_error is not None:
        return auth_error

    history_error = require_history_support()

    if history_error is not None:
        return history_error

    appointment = get_object_or_404(
        TherapistAppointment,
        pk=appointment_id,
    )

    History = get_history_model()

    events = History.objects.filter(
        appointment=appointment,
    ).select_related(
        "changed_by"
    ).order_by(
        "-created_at",
        "-id",
    )

    return JsonResponse({
        "appointment_id": appointment.id,
        "history": [
            serialize_status_event(event)
            for event in events
        ],
    })


# =========================================================
# CALL CENTER ALERTS
# =========================================================

@require_http_methods(["GET"])
def schedule_alerts_api(request):
    auth_error = require_manager(request)

    if auth_error is not None:
        return auth_error

    queryset = TherapistAppointment.objects.filter(
        confirmation_status__in=FOLLOW_UP_STATUSES,
    ).select_related(
        "patient"
    )

    therapist = (
        request.GET.get("therapist") or ""
    ).strip()

    if therapist:
        queryset = queryset.filter(
            therapist=therapist
        )

    date_value = request.GET.get("date")

    if date_value:
        selected_date = parse_date(date_value)

        if selected_date is None:
            return error("Invalid date")

        queryset = queryset.filter(
            appointment_date=selected_date
        )

    queryset = queryset.order_by(
        "appointment_date",
        "appointment_time",
        "id",
    )

    total = queryset.count()
    appointments = list(queryset[:500])

    return JsonResponse({
        "alerts": [
            serialize_appointment(item)
            for item in appointments
        ],
        "total": total,
        "truncated": total > 500,
    })


# =========================================================
# RECORD CALL ATTEMPT
# =========================================================

@require_http_methods(["POST"])
def schedule_call_attempt_api(
    request,
    appointment_id,
):
    auth_error = require_manager(request)

    if auth_error is not None:
        return auth_error

    field_error = require_extended_fields(
        "second_call_attempts"
    )

    if field_error is not None:
        return field_error

    history_error = require_history_support()

    if history_error is not None:
        return history_error

    payload = read_json(request)

    if payload is None:
        return error("Invalid JSON body")

    note = str(
        payload.get("note") or ""
    ).strip()

    if len(note) > 2000:
        return error("Call note is too long")

    with transaction.atomic():
        appointment = get_object_or_404(
            TherapistAppointment.objects.select_for_update(),
            pk=appointment_id,
        )

        if (
            appointment.confirmation_status
            not in FOLLOW_UP_STATUSES
        ):
            return error(
                "This appointment does not require "
                "a follow-up call"
            )

        appointment.second_call_attempts += 1

        appointment.save(
            update_fields=[
                "second_call_attempts",
                "updated_at",
            ]
        )

        create_status_event(
            appointment=appointment,
            user=request.user,
            action="call_attempt",
            old_status=appointment.confirmation_status,
            new_status=appointment.confirmation_status,
            note=(
                f"Call attempt "
                f"{appointment.second_call_attempts}"
                + (f": {note}" if note else "")
            ),
        )

    return JsonResponse({
        "message": "Call attempt recorded",
        "appointment": serialize_appointment(
            appointment
        ),
    })


# =========================================================
# EXCEL SCHEDULE IMPORT
# REPLACES SCREENSHOT OCR
# =========================================================

EXCEL_HEADER_ALIASES = {
    "patient_name": {
        "patient name",
        "patient",
        "name",
        "patient full name",
        "full name",
        "patientname",
    },
    "time": {
        "time",
        "appointment time",
        "start time",
        "booking time",
        "start",
        "from",
    },
    "date": {
        "date",
        "appointment date",
        "booking date",
        "visit date",
    },
    "therapist": {
        "therapist",
        "therapist name",
        "physiotherapist",
        "physio",
        "provider",
        "doctor",
    },
    "file_number": {
        "file number",
        "file no",
        "file no.",
        "file",
        "patient id",
        "patient number",
        "medical record number",
        "mrn",
    },
    "confirmation_status": {
        "confirmation status",
        "confirmation",
        "status",
        "booking status",
        "confirmed",
    },
    "appointment_type": {
        "appointment type",
        "visit type",
        "type",
        "service type",
    },
}


def normalize_excel_header(value):
    text = unicodedata.normalize(
        "NFKC",
        str(value or ""),
    ).strip().casefold()

    text = re.sub(
        r"[_\-/]+",
        " ",
        text,
    )

    return re.sub(
        r"\s+",
        " ",
        text,
    )


def identify_excel_column(value):
    normalized = normalize_excel_header(value)

    for field, aliases in EXCEL_HEADER_ALIASES.items():
        if normalized in aliases:
            return field

    return None


def find_excel_headers(worksheet):
    maximum = min(
        worksheet.max_row or 0,
        30,
    )

    for row_number, row in enumerate(
        worksheet.iter_rows(
            min_row=1,
            max_row=maximum,
            values_only=True,
        ),
        start=1,
    ):
        columns = {}

        for index, cell in enumerate(row):
            field = identify_excel_column(cell)

            if field and field not in columns:
                columns[field] = index

        if (
            "patient_name" in columns
            and "time" in columns
        ):
            return row_number, columns

    return None, None


def get_excel_value(row, columns, field):
    index = columns.get(field)

    if index is None or index >= len(row):
        return None

    return row[index]


# =========================================================
# EXCEL DATE NORMALIZATION
# =========================================================

def normalize_excel_date(value, epoch=None):
    if value is None or value == "":
        return None

    if isinstance(value, datetime):
        return value.date()

    if isinstance(value, date):
        return value

    if isinstance(value, (int, float)):
        try:
            result = (
                from_excel(value, epoch=epoch)
                if epoch is not None
                else from_excel(value)
            )

            if isinstance(result, datetime):
                return result.date()

            if isinstance(result, date):
                return result

        except (ValueError, TypeError, OverflowError):
            return None

    text = str(value).strip()

    formats = (
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%d-%m-%Y",
        "%d.%m.%Y",
    )

    for fmt in formats:
        try:
            return datetime.strptime(
                text,
                fmt,
            ).date()
        except ValueError:
            continue

    return None


# =========================================================
# EXCEL TIME NORMALIZATION
# =========================================================

def normalize_excel_time(value, epoch=None):
    if value is None or value == "":
        return None

    if isinstance(value, (datetime, time)):
        return value.strftime("%H:%M")

    if isinstance(value, (int, float)):
        try:
            result = (
                from_excel(value, epoch=epoch)
                if epoch is not None
                else from_excel(value)
            )

            if isinstance(result, (datetime, time)):
                return result.strftime("%H:%M")

        except (ValueError, TypeError, OverflowError):
            return None

        return None

    text = re.sub(
        r"\s+",
        " ",
        str(value).strip(),
    ).upper()

    formats = (
        "%H:%M",
        "%H:%M:%S",
        "%I:%M %p",
        "%I:%M%p",
        "%I %p",
    )

    for fmt in formats:
        try:
            return datetime.strptime(
                text,
                fmt,
            ).strftime("%H:%M")
        except ValueError:
            continue

    return None


# =========================================================
# EXCEL STATUS AND TYPE
# =========================================================

def normalize_excel_status(value):
    if value is None or str(value).strip() == "":
        return DEFAULT_CONFIRMATION_STATUS, False

    text = normalize_excel_header(value)

    aliases = {
        "confirmed": "confirmed",
        "yes": "confirmed",
        "true": "confirmed",
        "unconfirmed": "unconfirmed",
        "not confirmed": "unconfirmed",
        "pending": "unconfirmed",
        "no answer": "no_answer",
        "phone off": "phone_off",
        "cancelled": "cancelled",
        "canceled": "cancelled",
        "rescheduled": "rescheduled",
    }

    status = aliases.get(text)

    if status:
        return status, True

    return DEFAULT_CONFIRMATION_STATUS, False


def normalize_excel_type(value):
    if value is None or str(value).strip() == "":
        return DEFAULT_APPOINTMENT_TYPE

    text = normalize_excel_header(value)

    evaluation_terms = (
        "evaluation",
        "assessment",
        "initial",
        "new patient",
    )

    if any(term in text for term in evaluation_terms):
        return "evaluation"

    return "followup"


def get_excel_file_number(value):
    if value is None:
        return ""

    if isinstance(value, float) and value.is_integer():
        return str(int(value))

    return str(value).strip()


# =========================================================
# MATCH EXCEL PATIENTS
# =========================================================

def build_excel_patient_indexes():
    by_name = {}
    by_file = {}

    patients = Patient.objects.filter(
        is_archived=False,
    ).only(
        "id",
        "name",
        "patient_id",
    )

    for patient in patients:
        name_key = normalized_name(patient.name)

        file_key = str(
            patient.patient_id or ""
        ).strip()

        if name_key:
            if name_key in by_name:
                by_name[name_key] = None
            else:
                by_name[name_key] = patient

        if file_key:
            if file_key in by_file:
                by_file[file_key] = None
            else:
                by_file[file_key] = patient

    return by_name, by_file


def match_excel_patient(
    name,
    file_number,
    by_name,
    by_file,
):
    if file_number:
        patient = by_file.get(file_number)

        # Never link a file number to a
        # different patient name automatically.
        if (
            patient is not None
            and normalized_name(patient.name)
            == normalized_name(name)
        ):
            return patient

        return None

    return by_name.get(
        normalized_name(name)
    )


def is_administrative_text(text):
    value = normalized_name(text)

    return any(
        term in value
        for term in ADMINISTRATIVE_TERMS
    )


# =========================================================
# READ EXCEL SCHEDULE
# =========================================================

def read_excel_schedule(
    uploaded,
    selected_date,
    therapist_user,
):
    if uploaded is None:
        raise ValueError(
            "Please select an Excel schedule"
        )

    if not uploaded.name.lower().endswith(".xlsx"):
        raise ValueError(
            "Only .xlsx Excel files are supported"
        )

    if uploaded.size == 0:
        raise ValueError(
            "The Excel file is empty"
        )

    if uploaded.size > MAX_EXCEL_BYTES:
        raise ValueError(
            "Excel file exceeds the 10 MB limit"
        )

    try:
        workbook = load_workbook(
            uploaded,
            read_only=True,
            data_only=True,
        )
    except Exception as exc:
        raise ValueError(
            "Unable to read Excel workbook"
        ) from exc

    appointments = []
    warnings = []
    detected_sheets = []

    processed_rows = 0
    skipped_rows = 0
    unknown_times = 0

    by_name, by_file = build_excel_patient_indexes()

    try:
        for worksheet in workbook.worksheets:
            header_row, columns = find_excel_headers(
                worksheet
            )

            if columns is None:
                warnings.append(
                    f"Sheet '{worksheet.title}' skipped: "
                    "Patient Name and Time columns "
                    "were not found."
                )
                continue

            detected_sheets.append(
                worksheet.title
            )

            rows = worksheet.iter_rows(
                min_row=header_row + 1,
                values_only=True,
            )

            for row_number, row in enumerate(
                rows,
                start=header_row + 1,
            ):
                processed_rows += 1

                if processed_rows > MAX_EXCEL_ROWS:
                    raise ValueError(
                        "Excel file contains too many rows"
                    )

                raw_name = get_excel_value(
                    row,
                    columns,
                    "patient_name",
                )

                name = " ".join(
                    str(raw_name or "").split()
                )

                if not name:
                    continue

                if len(name) > 255:
                    skipped_rows += 1

                    warnings.append(
                        f"Sheet '{worksheet.title}', "
                        f"row {row_number}: "
                        "Patient name is too long."
                    )
                    continue

                if is_administrative_text(name):
                    skipped_rows += 1
                    continue

                # -------------------------------------
                # DATE FILTER
                # -------------------------------------

                excel_date_value = get_excel_value(
                    row,
                    columns,
                    "date",
                )

                if excel_date_value not in (None, ""):
                    row_date = normalize_excel_date(
                        excel_date_value,
                        workbook.epoch,
                    )

                    if row_date is None:
                        skipped_rows += 1

                        warnings.append(
                            f"Sheet '{worksheet.title}', "
                            f"row {row_number}: "
                            "Unrecognized appointment date."
                        )
                        continue

                    if row_date != selected_date:
                        continue

                # -------------------------------------
                # THERAPIST FILTER
                # -------------------------------------

                excel_therapist = get_excel_value(
                    row,
                    columns,
                    "therapist",
                )

                if excel_therapist not in (None, ""):
                    accepted_names = {
                        normalized_name(
                            therapist_user.username
                        ),
                        normalized_name(
                            therapist_display_name(
                                therapist_user
                            )
                        ),
                    }

                    if (
                        normalized_name(excel_therapist)
                        not in accepted_names
                    ):
                        continue

                # -------------------------------------
                # APPOINTMENT TIME
                # -------------------------------------

                appointment_time = normalize_excel_time(
                    get_excel_value(
                        row,
                        columns,
                        "time",
                    ),
                    workbook.epoch,
                )

                if appointment_time is None:
                    unknown_times += 1

                # -------------------------------------
                # PATIENT MATCHING
                # -------------------------------------

                file_number = get_excel_file_number(
                    get_excel_value(
                        row,
                        columns,
                        "file_number",
                    )
                )

                patient = match_excel_patient(
                    name,
                    file_number,
                    by_name,
                    by_file,
                )

                # -------------------------------------
                # CONFIRMATION AND TYPE
                # -------------------------------------

                status, status_known = (
                    normalize_excel_status(
                        get_excel_value(
                            row,
                            columns,
                            "confirmation_status",
                        )
                    )
                )

                appointment_type = normalize_excel_type(
                    get_excel_value(
                        row,
                        columns,
                        "appointment_type",
                    )
                )

                # -------------------------------------
                # PREVIEW RECORD
                # -------------------------------------

                appointments.append({
                    "time": appointment_time,
                    "patient_name": name,
                    "patient_id": (
                        patient.id if patient else None
                    ),
                    "file_number": (
                        str(patient.patient_id)
                        if patient
                        else file_number
                    ),
                    "confirmation_status": status,
                    "appointment_type": appointment_type,
                    "matched": patient is not None,
                    "needs_review": (
                        appointment_time is None
                        or not status_known
                        or patient is None
                    ),
                    "source": "excel",
                    "confirmation_known": status_known,
                    "time_known": (
                        appointment_time is not None
                    ),
                    "excel_sheet": worksheet.title,
                    "excel_row": row_number,
                    "import_key": (
                        f"{worksheet.title}:{row_number}"
                    ),
                })

                if len(appointments) > MAX_APPOINTMENTS:
                    raise ValueError(
                        "More than 200 appointments "
                        "were found. Import a smaller schedule."
                    )

    finally:
        workbook.close()

    appointments.sort(
        key=lambda item: (
            item["time"] or "99:99",
            item["excel_sheet"],
            item["excel_row"],
        )
    )

    if not detected_sheets:
        raise ValueError(
            "No worksheet contains recognizable "
            "Patient Name and Time columns."
        )

    if unknown_times:
        warnings.append(
            f"{unknown_times} appointments have "
            "unrecognized times. Correct these "
            "before publishing."
        )

    if skipped_rows:
        warnings.append(
            f"{skipped_rows} rows were skipped."
        )

    warnings.append(
        "Review all imported appointments before saving. "
        "Excel rows are preserved, including double bookings."
    )

    debug = {
        "processed_rows": processed_rows,
        "skipped_rows": skipped_rows,
        "detected_sheets": detected_sheets,
        "unknown_times": unknown_times,
    }

    return appointments, warnings, debug


# =========================================================
# EXCEL EXTRACTION API
# =========================================================

@require_http_methods(["POST"])
def extract_schedule_api(request):
    """
    POST /api/physio/schedule/extract/

    Multipart form:
        file: .xlsx workbook
        therapist: therapist username
        date: YYYY-MM-DD

    Returns an Excel appointment preview.
    Does not save appointments automatically.
    """

    auth_error = require_manager(request)

    if auth_error is not None:
        return auth_error

    uploaded = request.FILES.get("file")

    therapist_username = str(
        request.POST.get("therapist") or ""
    ).strip()

    therapist_user = get_active_therapist(
        therapist_username
    )

    selected_date = parse_date(
        request.POST.get("date")
    )

    if therapist_user is None:
        return error(
            "Please select a valid active physiotherapist"
        )

    if selected_date is None:
        return error(
            "Please select a valid schedule date"
        )

    try:
        appointments, warnings, debug = (
            read_excel_schedule(
                uploaded,
                selected_date,
                therapist_user,
            )
        )

    except ValueError as exc:
        return error(
            str(exc),
            422,
        )

    except Exception:
        logger.exception(
            "Unexpected Excel schedule import error"
        )

        return error(
            "Unexpected Excel import error",
            500,
        )

    matched_count = sum(
        item["matched"]
        for item in appointments
    )

    review_count = sum(
        item["needs_review"]
        for item in appointments
    )

    return JsonResponse({
        "message": (
            "Excel schedule imported successfully. "
            "Review appointments before publishing."
        ),
        "therapist": therapist_user.username,
        "therapist_name": therapist_display_name(
            therapist_user
        ),
        "date": selected_date.isoformat(),
        "appointments": appointments,
        "summary": calculate_summary(appointments),
        "total": len(appointments),
        "matched_count": matched_count,
        "unmatched_count": (
            len(appointments) - matched_count
        ),
        "missing_time_count": debug["unknown_times"],
        "review_count": review_count,
        "warnings": warnings,
        "requires_review": True,
        "published": False,
        "import_method": "excel",
        "api_cost": 0,
        "import_debug": debug,
    })

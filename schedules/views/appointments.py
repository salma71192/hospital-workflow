
from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_http_methods

from schedules.models import TherapistAppointment

from .schedule import (
    CONFIRMATION_STATUSES,
    DEFAULT_APPOINTMENT_TYPE,
    DEFAULT_CONFIRMATION_STATUS,
    FOLLOW_UP_STATUSES,
    error,
    require_manager,
    require_extended_fields,
    require_history_support,
    read_json,
    parse_date,
    parse_time,
    normalize_status,
    model_has_field,
    get_active_therapist,
    therapist_display_name,
    resolve_patient,
    create_status_event,
    serialize_appointment,
    serialize_status_event,
)


# =========================================================
# VALIDATE INDIVIDUAL APPOINTMENT
# =========================================================

def validate_schedule_record(payload, existing=None):
    if not isinstance(payload, dict):
        raise ValueError("Invalid appointment data")

    # -----------------------------------------------------
    # THERAPIST AND ORIGINAL DATE
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # PATIENT
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # APPOINTMENT TIME
    # -----------------------------------------------------

    appointment_time = parse_time(
        payload.get(
            "time",
            payload.get(
                "appointment_time",
                existing.appointment_time if existing else None,
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

    # -----------------------------------------------------
    # CONFIRMATION STATUS
    # -----------------------------------------------------

    status = normalize_status(
        payload.get(
            "confirmation_status",
            existing.confirmation_status
            if existing
            else DEFAULT_CONFIRMATION_STATUS,
        )
    )

    if status not in CONFIRMATION_STATUSES:
        raise ValueError(
            "Invalid confirmation status"
        )

    # -----------------------------------------------------
    # APPOINTMENT TYPE
    # -----------------------------------------------------

    appointment_type = str(
        payload.get(
            "appointment_type",
            existing.appointment_type
            if existing
            else DEFAULT_APPOINTMENT_TYPE,
        )
    ).strip().lower()

    if appointment_type not in {"followup", "evaluation"}:
        raise ValueError(
            "Invalid appointment type"
        )

    # -----------------------------------------------------
    # PATIENT RECORD MATCHING
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # NOTES
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # RESCHEDULING
    # -----------------------------------------------------

    if status == "rescheduled":
        if (
            not model_has_field("rescheduled_to_date")
            or not model_has_field("rescheduled_to_time")
        ):
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
# POST /appointments/
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

    appointment = TherapistAppointment.objects.select_related(
        "patient",
        "created_by",
    ).get(pk=appointment.pk)

    return JsonResponse(
        {
            "message": "Appointment created",
            "appointment": serialize_appointment(appointment),
        },
        status=201,
    )


# =========================================================
# VIEW / EDIT APPOINTMENT
# GET /appointments/<id>/
# PATCH /appointments/<id>/
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
                "patient",
                "created_by",
            ),
            pk=appointment_id,
        )

        return JsonResponse({
            "appointment": serialize_appointment(appointment)
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

    appointment = TherapistAppointment.objects.select_related(
        "patient",
        "created_by",
    ).get(pk=appointment_id)

    return JsonResponse({
        "message": (
            "Appointment updated"
            if changes
            else "No changes detected"
        ),
        "appointment": serialize_appointment(appointment),
    })


# =========================================================
# PERMANENT APPOINTMENT HISTORY
# GET /appointments/<id>/history/
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

    from django.apps import apps

    History = apps.get_model(
        "schedules",
        "AppointmentStatusHistory",
    )

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
# GET /alerts/
# =========================================================

@require_http_methods(["GET"])
def schedule_alerts_api(request):
    auth_error = require_manager(request)

    if auth_error is not None:
        return auth_error

    queryset = TherapistAppointment.objects.filter(
        confirmation_status__in=FOLLOW_UP_STATUSES,
    ).select_related(
        "patient",
        "created_by",
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
# RECORD FOLLOW-UP CALL ATTEMPT
# POST /alerts/<id>/call-attempt/
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

        if appointment.confirmation_status not in FOLLOW_UP_STATUSES:
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
                f"Call attempt {appointment.second_call_attempts}"
                + (f": {note}" if note else "")
            ),
        )

    appointment = TherapistAppointment.objects.select_related(
        "patient",
        "created_by",
    ).get(pk=appointment_id)

    return JsonResponse({
        "message": "Call attempt recorded",
        "appointment": serialize_appointment(appointment),
    })

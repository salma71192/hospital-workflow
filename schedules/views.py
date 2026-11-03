
import json
import unicodedata

from datetime import date, time

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

from patients.models import Patient

from .models import TherapistAppointment

from .permissions import (
    can_manage_schedules,
    get_therapist_identity,
)


# =========================================================
# GENERAL HELPERS
# =========================================================

def error(message, status=400):
    return JsonResponse(
        {"error": message},
        status=status,
    )


def require_login(request):
    if not request.user.is_authenticated:
        return error(
            "Not authenticated",
            401,
        )

    return None


def require_manager(request):
    auth_error = require_login(request)

    if auth_error:
        return auth_error

    if not can_manage_schedules(request.user):
        return error(
            "Call Center permission required",
            403,
        )

    return None


def parse_date(value):
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError):
        return None


def parse_time(value):
    try:
        return time.fromisoformat(
            str(value).strip()
        )
    except (TypeError, ValueError):
        return None


def normalized_name(value):
    value = unicodedata.normalize(
        "NFKC",
        str(value or ""),
    )

    return " ".join(
        value.casefold().split()
    )


def read_json(request):
    try:
        result = json.loads(
            request.body.decode("utf-8")
        )
    except (
        ValueError,
        UnicodeDecodeError,
    ):
        return None

    if not isinstance(result, dict):
        return None

    return result


# =========================================================
# THERAPIST HELPERS
# =========================================================

def get_active_therapist(username):
    """
    Resolve a therapist by their authenticated
    username, not their display name.

    Only active users with role='physio'
    are valid therapist schedule owners.
    """

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
# APPOINTMENT SERIALIZATION
# =========================================================

def serialize_appointment(appointment):
    patient = appointment.patient

    return {
        "id": appointment.id,

        "therapist": appointment.therapist,

        "date": (
            appointment.appointment_date.isoformat()
        ),

        "time": (
            appointment.appointment_time.strftime(
                "%H:%M"
            )
        ),

        "patient_id": appointment.patient_id,

        "patient_name": appointment.patient_name,

        "file_number": (
            patient.patient_id
            if patient
            else ""
        ),

        "confirmation_status": (
            appointment.confirmation_status
        ),

        "appointment_type": (
            appointment.appointment_type
        ),

        "source": appointment.source,
    }


def serialize_queryset(queryset):
    return [
        serialize_appointment(item)
        for item in queryset.select_related(
            "patient"
        )
    ]


def calculate_summary(appointments):
    return {
        "total": len(appointments),

        "confirmed": sum(
            1
            for item in appointments
            if item["confirmation_status"]
            == "confirmed"
        ),

        "unconfirmed": sum(
            1
            for item in appointments
            if item["confirmation_status"]
            == "unconfirmed"
        ),

        "evaluations": sum(
            1
            for item in appointments
            if item["appointment_type"]
            == "evaluation"
        ),
    }


# =========================================================
# THERAPIST DIRECTORY
# =========================================================

@require_http_methods(["GET"])
def schedule_therapists_api(request):
    """
    Return the actual physiotherapists registered
    in the application's users database.

    Only Call Center and authorized administrators
    may access this directory.
    """

    auth_error = require_manager(request)

    if auth_error:
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
                "id": therapist.id,

                "username": therapist.username,

                "name": therapist_display_name(
                    therapist
                ),

                "first_name": therapist.first_name,

                "last_name": therapist.last_name,
            }
            for therapist in therapists
        ]
    })


# =========================================================
# MY SCHEDULE - PHYSIOTHERAPIST READ ONLY
# =========================================================

@require_http_methods(["GET"])
def my_schedule_api(request):
    """
    Physiotherapists can retrieve only their
    own published schedule.

    The therapist identifier comes from the
    authenticated user, never from a query
    parameter supplied by the frontend.
    """

    auth_error = require_login(request)

    if auth_error:
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
        return error(
            "A valid date is required"
        )

    queryset = TherapistAppointment.objects.filter(
        therapist=therapist_username,
        appointment_date=selected_date,
    )

    last_record = queryset.order_by(
        "-updated_at"
    ).first()

    appointments = serialize_queryset(queryset)

    return JsonResponse({
        "therapist": therapist_username,

        "therapist_name": therapist_display_name(
            request.user
        ),

        "date": selected_date.isoformat(),

        "appointments": appointments,

        "summary": calculate_summary(
            appointments
        ),

        "last_updated": (
            last_record.updated_at.isoformat()
            if last_record
            else None
        ),
    })


# =========================================================
# CALL CENTER - VIEW THERAPIST SCHEDULE
# =========================================================

@require_http_methods(["GET"])
def schedule_list_api(request):
    """
    Call Center can retrieve the schedule
    of a selected therapist for a selected date.
    """

    auth_error = require_manager(request)

    if auth_error:
        return auth_error

    therapist_username = (
        request.GET.get("therapist") or ""
    ).strip()

    selected_date = parse_date(
        request.GET.get("date")
    )

    if not selected_date:
        return error(
            "A valid date is required"
        )

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
    )

    appointments = serialize_queryset(queryset)

    return JsonResponse({
        "therapist": therapist_user.username,

        "therapist_name": therapist_display_name(
            therapist_user
        ),

        "date": selected_date.isoformat(),

        "appointments": appointments,

        "summary": calculate_summary(
            appointments
        ),
    })


# =========================================================
# PATIENT SEARCH
# =========================================================

@require_http_methods(["GET"])
def schedule_patient_search_api(request):
    """
    Search existing active patients by name
    or hospital file number.
    """

    auth_error = require_manager(request)

    if auth_error:
        return auth_error

    query = (
        request.GET.get("q") or ""
    ).strip()

    if len(query) < 2:
        return JsonResponse({
            "matches": []
        })

    patients = Patient.objects.filter(
        is_archived=False,
    ).filter(
        Q(name__icontains=query)
        | Q(patient_id__icontains=query)
    ).order_by(
        "name"
    )[:20]

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
# AUTOMATIC PATIENT MATCHING
# =========================================================

def find_exact_patient(name):
    """
    Automatically match a patient only when
    exactly one active patient has the same
    normalized full name.

    Ambiguous or unmatched names remain
    unlinked until Call Center reviews them.
    """

    normalized = normalized_name(name)

    if not normalized:
        return None

    matches = []

    patients = Patient.objects.filter(
        is_archived=False,
    ).only(
        "id",
        "name",
    )

    for patient in patients:
        if normalized_name(
            patient.name
        ) == normalized:

            matches.append(patient)

            if len(matches) > 1:
                return None

    if len(matches) == 1:
        return matches[0]

    return None


# =========================================================
# APPOINTMENT VALIDATION
# =========================================================

def validate_appointment(item):
    """
    Validate an individual appointment before
    publishing.

    Confirmation and appointment type are
    separate fields.

    Orange evaluation appointments must have
    their confirmation status reviewed.
    """

    if not isinstance(item, dict):
        raise ValueError(
            "Each appointment must be an object"
        )

    name = str(
        item.get("patient_name") or ""
    ).strip()

    appointment_time = parse_time(
        item.get("time")
    )

    confirmation_status = item.get(
        "confirmation_status"
    )

    appointment_type = item.get(
        "appointment_type"
    )

    if not name:
        raise ValueError(
            "Patient name is required"
        )

    if len(name) > 255:
        raise ValueError(
            "Patient name is too long"
        )

    if appointment_time is None:
        raise ValueError(
            f"Invalid appointment time for {name}"
        )

    if confirmation_status not in {
        "confirmed",
        "unconfirmed",
    }:
        raise ValueError(
            f"Invalid confirmation status for {name}"
        )

    if appointment_type not in {
        "followup",
        "evaluation",
    }:
        raise ValueError(
            f"Invalid appointment type for {name}"
        )

    patient = None

    supplied_patient_id = item.get(
        "patient_id"
    )

    if supplied_patient_id not in (
        None,
        "",
    ):
        try:
            patient = Patient.objects.get(
                pk=supplied_patient_id,
                is_archived=False,
            )

        except (
            Patient.DoesNotExist,
            ValueError,
            TypeError,
        ):
            raise ValueError(
                f"Invalid patient selection for {name}"
            )

        if normalized_name(
            patient.name
        ) != normalized_name(name):
            raise ValueError(
                f"Selected patient record does not "
                f"match the name {name}"
            )

    else:
        patient = find_exact_patient(
            name
        )

    return {
        "patient_name": name,

        "appointment_time": appointment_time,

        "confirmation_status": (
            confirmation_status
        ),

        "appointment_type": appointment_type,

        "patient": patient,
    }


# =========================================================
# PUBLISH / REPLACE SCHEDULE
# =========================================================

@require_http_methods(["POST"])
def save_schedule_api(request):
    """
    Publish a reviewed therapist schedule.

    The new schedule replaces all previously
    published appointments for the same
    therapist and date.

    The operation is atomic:
    either every appointment is saved,
    or none of the previous appointments
    are changed.
    """

    auth_error = require_manager(request)

    if auth_error:
        return auth_error

    payload = read_json(request)

    if payload is None:
        return error(
            "Invalid JSON body"
        )

    therapist_username = str(
        payload.get("therapist") or ""
    ).strip()

    selected_date = parse_date(
        payload.get("date")
    )

    appointments = payload.get(
        "appointments"
    )

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

    if not isinstance(appointments, list):
        return error(
            "Appointments must be a list"
        )

    if len(appointments) == 0:
        return error(
            "At least one appointment is required"
        )

    if len(appointments) > 200:
        return error(
            "Maximum 200 appointments per schedule"
        )

    validated = []

    try:
        for index, item in enumerate(
            appointments
        ):
            try:
                validated.append(
                    validate_appointment(item)
                )

            except ValueError as exc:
                raise ValueError(
                    f"Row {index + 1}: {exc}"
                )

    except ValueError as exc:
        return error(
            str(exc)
        )

    # -----------------------------------------------------
    # ATOMIC REPLACEMENT
    # -----------------------------------------------------

    with transaction.atomic():

        TherapistAppointment.objects.filter(
            therapist=therapist_user.username,
            appointment_date=selected_date,
        ).delete()

        new_records = [
            TherapistAppointment(
                therapist=therapist_user.username,

                appointment_date=selected_date,

                patient=entry["patient"],

                patient_name=entry["patient_name"],

                appointment_time=entry[
                    "appointment_time"
                ],

                confirmation_status=entry[
                    "confirmation_status"
                ],

                appointment_type=entry[
                    "appointment_type"
                ],

                created_by=request.user,

                source="concepts",
            )
            for entry in validated
        ]

        TherapistAppointment.objects.bulk_create(
            new_records
        )

    # -----------------------------------------------------
    # RETURN PUBLISHED SCHEDULE
    # -----------------------------------------------------

    saved_queryset = (
        TherapistAppointment.objects.filter(
            therapist=therapist_user.username,
            appointment_date=selected_date,
        )
    )

    saved_appointments = serialize_queryset(
        saved_queryset
    )

    return JsonResponse({
        "message": (
            "Schedule published successfully"
        ),

        "therapist": therapist_user.username,

        "therapist_name": therapist_display_name(
            therapist_user
        ),

        "date": selected_date.isoformat(),

        "appointments": saved_appointments,

        "summary": calculate_summary(
            saved_appointments
        ),

        "total": len(
            saved_appointments
        ),
    })


# =========================================================
# SCREENSHOT EXTRACTION
# =========================================================

@require_http_methods(["POST"])
def extract_schedule_api(request):
    """
    Reserved endpoint for screenshot extraction.

    It will eventually:
    1. Receive a Concepts Booking System screenshot.
    2. Identify appointment blocks and times.
    3. Read patient names.
    4. Interpret booking colors.
    5. Return appointments for Call Center review.

    No appointments are published automatically.
    """

    auth_error = require_manager(request)

    if auth_error:
        return auth_error

    return JsonResponse(
        {
            "error": (
                "Screenshot extraction is not "
                "configured yet. Please enter "
                "appointments manually until "
                "the extraction service is added."
            )
        },
        status=501,
    )

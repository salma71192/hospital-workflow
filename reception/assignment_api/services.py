
from django.utils import timezone
from django.contrib.auth import get_user_model

from callcenter.models import Appointment
from reception.models import PatientAssignment

from .constants import PHYSIO_ROLES
from .helpers import error

User = get_user_model()


def physiotherapists_queryset(user_model=None):
    model = user_model or User

    return model.objects.filter(
        role__in=list(PHYSIO_ROLES)
    ).order_by("username")


def get_physio(therapist_id, user_model=None):
    model = user_model or User

    return model.objects.get(
        id=therapist_id,
        role__in=list(PHYSIO_ROLES),
    )


def get_assignment(
    assignment_id,
    assignment_model=None,
):
    model = assignment_model or PatientAssignment

    try:
        assignment = (
            model.objects
            .select_related(
                "patient",
                "therapist",
                "created_by",
            )
            .get(id=assignment_id)
        )

        return assignment, None

    except (
        model.DoesNotExist,
        ValueError,
        TypeError,
    ):
        return None, error("Assignment not found", 404)


def mark_today_appointment_attended(
    patient,
    therapist,
    marked_by=None,
):
    today_value = timezone.localdate()

    appointment = (
        Appointment.objects
        .filter(
            patient=patient,
            appointment_date=today_value,
        )
        .order_by("appointment_time", "id")
        .first()
    )

    if not appointment:
        return None

    updated_fields = []

    if str(appointment.therapist_id) != str(therapist.id):
        appointment.therapist = therapist
        updated_fields.append("therapist")

    already_attended = (
        getattr(appointment, "attendance_status", "")
        == "attended"
    )

    if (
        hasattr(appointment, "attendance_status")
        and hasattr(appointment, "attended_at")
    ):
        if not already_attended:
            appointment.attendance_status = "attended"
            appointment.attended_at = timezone.now()

            updated_fields.extend([
                "attendance_status",
                "attended_at",
            ])

            patient.sessions_taken = (
                int(patient.sessions_taken or 0) + 1
            )

        patient.taken_with = therapist.username

        patient.save(
            update_fields=[
                "sessions_taken",
                "taken_with",
            ] if not already_attended else ["taken_with"]
        )

    else:
        patient.taken_with = therapist.username
        patient.save(update_fields=["taken_with"])

    if updated_fields:
        appointment.save(update_fields=updated_fields)

    return appointment

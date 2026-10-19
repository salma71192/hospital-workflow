
from django.contrib.auth import get_user_model
from django.db import transaction
from django.http import JsonResponse

from reception.models import PatientAssignment

from .helpers import error, read_json, validate_fields
from .permissions import can_manage_assignment
from .services import (
    get_assignment,
    get_physio,
    mark_today_appointment_attended,
)

User = get_user_model()


def update_assignment(
    request,
    assignment_id,
    role,
    admin,
    today_value,
):
    if not assignment_id:
        return error("Assignment ID is required")

    assignment, lookup_error = get_assignment(assignment_id)
    if lookup_error:
        return lookup_error

    if not can_manage_assignment(
        request.user,
        assignment,
        admin,
        role,
        today_value,
    ):
        return error(
            "You do not have permission to edit this "
            "registration. Reception can edit only its "
            "own registrations dated today.",
            403,
        )

    data, body_error = read_json(request)
    if body_error:
        return body_error

    fields, validation_error = validate_fields(
        data,
        assignment=assignment,
    )
    if validation_error:
        return validation_error

    new_assignment_date = assignment.assignment_date

    if admin and "assignment_date" in data:
        from reception.api_helpers import parse_date

        parsed_date = parse_date(data.get("assignment_date"))
        if not parsed_date:
            return error("Invalid assignment date")

        new_assignment_date = parsed_date

    new_therapist = assignment.therapist
    therapist_id = data.get("therapist_id")

    if therapist_id:
        try:
            new_therapist = get_physio(therapist_id)
        except (User.DoesNotExist, ValueError, TypeError):
            return error("Invalid therapist")

    duplicate_exists = (
        PatientAssignment.objects.filter(
            patient_id=assignment.patient_id,
            assignment_date=new_assignment_date,
        )
        .exclude(id=assignment.id)
        .exists()
    )

    if duplicate_exists:
        return error(
            "This patient is already assigned "
            "on the selected date"
        )

    with transaction.atomic():
        assignment.therapist = new_therapist
        assignment.category = fields["category"]
        assignment.visit_number = fields["visit_number"]
        assignment.referring_physician = fields[
            "referring_physician"
        ]
        assignment.speciality = fields["speciality"]
        assignment.notes = fields["notes"]
        assignment.assignment_date = new_assignment_date
        assignment.save()

        if new_assignment_date == today_value:
            mark_today_appointment_attended(
                patient=assignment.patient,
                therapist=new_therapist,
                marked_by=request.user,
            )

    return JsonResponse({
        "success": True,
        "message": "Assignment updated successfully",
        "id": assignment.id,
        "assignment_date": str(assignment.assignment_date),
        "therapist_id": new_therapist.id,
        "therapist_name": new_therapist.username,
        "category": assignment.category,
        "visit_number": assignment.visit_number,
        "referring_physician": assignment.referring_physician,
        "speciality": assignment.speciality,
        "specialty": assignment.speciality,
    })

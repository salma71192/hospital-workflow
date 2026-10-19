
from django.contrib.auth import get_user_model
from django.db import transaction
from django.http import JsonResponse

from patients.models import Patient
from reception.models import PatientAssignment

from .helpers import error, read_json, validate_fields
from .permissions import is_reception_role
from .services import get_physio, mark_today_appointment_attended

User = get_user_model()


def create_assignment(request, role, admin, today_value):
    if not (admin or is_reception_role(role)):
        return error("Not allowed", 403)

    data, body_error = read_json(request)
    if body_error:
        return body_error

    patient_id = data.get("patient_id")
    therapist_id = data.get("therapist_id")

    if not patient_id or not therapist_id:
        return error("Missing patient or therapist")

    fields, validation_error = validate_fields(data)
    if validation_error:
        return validation_error

    if admin:
        submitted_date = data.get("assignment_date")

        if submitted_date:
            from reception.api_helpers import parse_date

            assignment_date = parse_date(submitted_date)

            if not assignment_date:
                return error("Invalid assignment date")
        else:
            assignment_date = today_value
    else:
        assignment_date = today_value

    try:
        patient = Patient.objects.get(id=patient_id)
        therapist = get_physio(therapist_id)
    except (
        Patient.DoesNotExist,
        User.DoesNotExist,
        ValueError,
        TypeError,
    ):
        return error("Invalid patient or therapist")

    with transaction.atomic():
        locked_patient = (
            Patient.objects
            .select_for_update()
            .get(id=patient.id)
        )

        already_assigned = PatientAssignment.objects.filter(
            patient=locked_patient,
            assignment_date=assignment_date,
        ).exists()

        if already_assigned:
            return error(
                "This patient is already assigned "
                "on the selected date"
            )

        assignment = PatientAssignment.objects.create(
            patient=locked_patient,
            therapist=therapist,
            assignment_date=assignment_date,
            category=fields["category"],
            visit_number=fields["visit_number"],
            referring_physician=fields["referring_physician"],
            speciality=fields["speciality"],
            notes=fields["notes"],
            created_by=request.user,
        )

        if assignment_date == today_value:
            mark_today_appointment_attended(
                patient=locked_patient,
                therapist=therapist,
                marked_by=request.user,
            )

    return JsonResponse({
        "success": True,
        "message": "Patient assigned successfully",
        "id": assignment.id,
        "assignment_date": str(assignment.assignment_date),
        "therapist_id": therapist.id,
        "therapist_name": therapist.username,
        "category": assignment.category,
        "visit_number": assignment.visit_number,
        "referring_physician": assignment.referring_physician,
        "speciality": assignment.speciality,
        "specialty": assignment.speciality,
    })

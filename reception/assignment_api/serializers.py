
from .permissions import can_manage_assignment


def assignment_to_dict(
    assignment,
    today_value,
    user,
    admin,
    role,
):
    can_manage = can_manage_assignment(
        user=user,
        assignment=assignment,
        admin=admin,
        role=role,
        today_value=today_value,
    )

    patient = assignment.patient
    therapist = assignment.therapist
    creator = assignment.created_by

    return {
        "id": assignment.id,
        "patient_id": assignment.patient_id,
        "patient_name": patient.name if patient else "-",
        "patient_file_id": patient.patient_id if patient else "-",
        "therapist_id": assignment.therapist_id,
        "therapist_name": therapist.username if therapist else "-",
        "assignment_date": str(assignment.assignment_date),
        "category": assignment.category,
        "category_label": assignment.get_category_display(),
        "visit_number": assignment.visit_number,
        "referring_physician": assignment.referring_physician or "",
        "speciality": assignment.speciality or "",
        "specialty": assignment.speciality or "",
        "notes": assignment.notes or "",
        "created_by_id": assignment.created_by_id,
        "created_by_name": creator.username if creator else "",
        "can_edit": can_manage,
        "can_delete": can_manage,
        "can_edit_today": can_manage,
        "can_cancel_today": can_manage,
    }

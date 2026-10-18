
import json

from django.http import JsonResponse

from reception.models import PatientAssignment
from reception.api_helpers import parse_date

from .constants import PHYSICIAN_NAMES


def error(message, status=400):
    return JsonResponse(
        {"error": message},
        status=status,
    )


def read_json(request):
    try:
        data = json.loads(request.body or b"{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None, error("Invalid JSON")

    if not isinstance(data, dict):
        return None, error(
            "Request body must be a JSON object"
        )

    return data, None


def get_request_date(request, parameter_name):
    raw_value = (
        request.GET.get(parameter_name) or ""
    ).strip()

    if not raw_value:
        return None, None

    parsed_value = parse_date(raw_value)

    if not parsed_value:
        return None, error(
            f"Invalid {parameter_name.replace('_', ' ')}"
        )

    return parsed_value, None


def valid_category(category):
    valid_categories = {
        choice[0]
        for choice in PatientAssignment.CATEGORY_CHOICES
    }
    return category in valid_categories


def validate_fields(data, assignment=None):
    category = data.get(
        "category",
        assignment.category if assignment else "appointment",
    )

    notes = (
        data.get(
            "notes",
            assignment.notes if assignment else "",
        )
        or ""
    )

    speciality = (
        data.get(
            "speciality",
            data.get(
                "specialty",
                assignment.speciality if assignment else "",
            ),
        )
        or ""
    ).strip()

    referring_physician = (
        data.get(
            "referring_physician",
            assignment.referring_physician if assignment else "",
        )
        or ""
    ).strip()

    visit_number = data.get(
        "visit_number",
        assignment.visit_number if assignment else None,
    )

    if not valid_category(category):
        return None, error("Invalid assignment category")

    if not str(visit_number or "").strip():
        return None, error("Visit Number is required")

    try:
        visit_number = int(visit_number)
        if visit_number < 1:
            raise ValueError
    except (ValueError, TypeError):
        return None, error(
            "Visit Number must be a positive integer"
        )

    if (
        category == "initial_evaluation"
        and not referring_physician
    ):
        return None, error(
            "Referring Physician is required "
            "for Initial Evaluation"
        )

    if (
        referring_physician
        and referring_physician not in PHYSICIAN_NAMES
    ):
        return None, error("Invalid referring physician")

    return {
        "category": category,
        "notes": notes,
        "speciality": speciality,
        "referring_physician": referring_physician,
        "visit_number": visit_number,
    }, None

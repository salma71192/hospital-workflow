
import json

from django.http import JsonResponse

from reception.models import PatientAssignment, Physician
from reception.api_helpers import parse_date

from .constants import PHYSICIAN_NAMES


EXTERNAL_REFERRAL_PREFIX = "External Referral:"


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


def normalize_physician_name(name):
    """
    Normalize physician names by removing surrounding
    whitespace, collapsing repeated spaces, and ignoring
    capitalization.
    """
    return " ".join(
        str(name or "").split()
    ).casefold()


def get_physician_names():
    """
    Return normalized physician names from both the
    configured list and the Physician database table.
    """
    names = {
        normalize_physician_name(name)
        for name in PHYSICIAN_NAMES
        if normalize_physician_name(name)
    }

    database_names = Physician.objects.values_list(
        "name",
        flat=True,
    )

    names.update(
        normalize_physician_name(name)
        for name in database_names
        if normalize_physician_name(name)
    )

    return names


def validate_fields(data, assignment=None):
    """
    Validate assignment fields for creation and updates.

    For updates, fields omitted from the request retain
    their existing values.
    """
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
            (
                assignment.referring_physician
                if assignment
                else ""
            ),
        )
        or ""
    ).strip()

    visit_number = data.get(
        "visit_number",
        assignment.visit_number if assignment else None,
    )

    # Validate assignment category.
    if not valid_category(category):
        return None, error(
            "Invalid assignment category"
        )

    # Validate visit number.
    if not str(visit_number or "").strip():
        return None, error(
            "Visit Number is required"
        )

    try:
        visit_number = int(visit_number)

        if visit_number < 1:
            raise ValueError

    except (ValueError, TypeError):
        return None, error(
            "Visit Number must be a positive integer"
        )

    # Initial evaluations require a referring physician.
    if (
        category == "initial_evaluation"
        and not referring_physician
    ):
        return None, error(
            "Referring Physician is required "
            "for Initial Evaluation"
        )

    # Validate the referring physician.
    if referring_physician:
        normalized_name = normalize_physician_name(
            referring_physician
        )

        normalized_external_prefix = normalize_physician_name(
            EXTERNAL_REFERRAL_PREFIX
        )

        # Handle external referrals without requiring the
        # physician to exist in the Physician database.
        if normalized_name.startswith(
            normalized_external_prefix
        ):
            prefix_length = len(
                EXTERNAL_REFERRAL_PREFIX
            )

            external_name = referring_physician[
                prefix_length:
            ].strip()

            if not external_name:
                return None, error(
                    "Please enter the external referring "
                    "physician's name"
                )

            referring_physician = (
                f"{EXTERNAL_REFERRAL_PREFIX} "
                f"{external_name}"
            )

        else:
            valid_physicians = get_physician_names()

            if normalized_name not in valid_physicians:
                return None, error(
                    "Invalid referring physician"
                )

            # Use the canonical spelling from the database
            # when a matching physician record exists.
            database_physicians = Physician.objects.all()

            for physician in database_physicians:
                if (
                    normalize_physician_name(physician.name)
                    == normalized_name
                ):
                    referring_physician = physician.name
                    break

    return {
        "category": category,
        "notes": notes,
        "speciality": speciality,
        "referring_physician": referring_physician,
        "visit_number": visit_number,
    }, None

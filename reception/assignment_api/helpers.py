
import json

from django.http import JsonResponse
from django.contrib.auth import get_user_model

from reception.models import PatientAssignment
from reception.api_helpers import parse_date


User = get_user_model()

EXTERNAL_REFERRAL_PREFIX = "External Referral:"
EXTERNAL_REFERRAL_LABEL = "External Referral"

PHYSICIAN_ROLES = ("physician", "doctor")


def error(message, status=400):
    return JsonResponse({"error": message}, status=status)


def read_json(request):
    try:
        data = json.loads(request.body or b"{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None, error("Invalid JSON")

    if not isinstance(data, dict):
        return None, error("Request body must be a JSON object")

    return data, None


def get_request_date(request, parameter_name):
    raw_value = (request.GET.get(parameter_name) or "").strip()

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
    """Normalize whitespace and capitalization for comparison."""
    return " ".join(str(name or "").split()).casefold()


def get_physician_users():
    """Return active users whose role identifies them as physicians."""
    return User.objects.filter(
        is_active=True,
        role__in=PHYSICIAN_ROLES,
    ).order_by("id")


def get_user_physician_names(user):
    """
    Return the possible names used to identify a physician user.

    Prefer the display name, then the name, then the username.
    Other populated fields are retained as aliases for matching.
    """
    names = []

    for field in ("display_name", "name", "username"):
        value = getattr(user, field, None)

        if isinstance(value, str) and value.strip():
            cleaned = " ".join(value.split())

            if cleaned not in names:
                names.append(cleaned)

    return names


def get_physician_names():
    """Return normalized names exposed by active physician users."""
    names = set()

    for user in get_physician_users():
        for name in get_user_physician_names(user):
            normalized = normalize_physician_name(name)

            if normalized:
                names.add(normalized)

    return names


def get_canonical_physician_name(name):
    """Resolve a submitted name to an active physician user's name."""
    normalized_name = normalize_physician_name(name)

    if not normalized_name:
        return None

    for user in get_physician_users():
        user_names = get_user_physician_names(user)

        for user_name in user_names:
            if normalize_physician_name(user_name) == normalized_name:
                display_name = getattr(user, "display_name", None)

                if isinstance(display_name, str) and display_name.strip():
                    return " ".join(display_name.split())

                actual_name = getattr(user, "name", None)

                if isinstance(actual_name, str) and actual_name.strip():
                    return " ".join(actual_name.split())

                return user_name

    return None


def extract_physician_name(value):
    """Accept a physician name string or a dictionary containing a name."""
    if isinstance(value, dict):
        value = (
            value.get("display_name")
            or value.get("name")
            or value.get("username")
            or ""
        )

    if value is None:
        return ""

    if not isinstance(value, str):
        value = str(value) if isinstance(value, (int, float)) else ""

    return " ".join(value.split())


def is_external_referral(value):
    """
    Recognize both supported external referral formats:
    - External Referral
    - External Referral: Physician Name
    """
    normalized_value = normalize_physician_name(value)

    normalized_label = normalize_physician_name(
        EXTERNAL_REFERRAL_LABEL
    )

    normalized_prefix = normalize_physician_name(
        EXTERNAL_REFERRAL_PREFIX
    )

    return (
        normalized_value == normalized_label
        or normalized_value.startswith(normalized_prefix)
    )


def normalize_external_referral(value):
    """
    Keep the simple External Referral label when no external name
    is supplied. Preserve the legacy format when a name is provided.
    """
    value = extract_physician_name(value)

    if normalize_physician_name(value) == normalize_physician_name(
        EXTERNAL_REFERRAL_LABEL
    ):
        return EXTERNAL_REFERRAL_LABEL

    normalized_prefix = normalize_physician_name(
        EXTERNAL_REFERRAL_PREFIX
    )

    if normalize_physician_name(value).startswith(normalized_prefix):
        external_name = value[len(EXTERNAL_REFERRAL_PREFIX):].strip()

        if not external_name:
            return EXTERNAL_REFERRAL_LABEL

        return f"{EXTERNAL_REFERRAL_PREFIX} {external_name}"

    return EXTERNAL_REFERRAL_LABEL


def validate_fields(data, assignment=None):
    """Validate assignment fields for creation and updates."""

    category = data.get(
        "category",
        assignment.category if assignment else "appointment",
    )

    notes = (
        data.get("notes", assignment.notes if assignment else "")
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
    )

    if not isinstance(speciality, str):
        speciality = str(speciality)

    speciality = speciality.strip()

    referring_physician = extract_physician_name(
        data.get(
            "referring_physician",
            assignment.referring_physician if assignment else "",
        )
    )

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
        return None, error("Visit Number must be a positive integer")

    # Initial evaluations still require a referral source.
    # "External Referral" is a valid source without a physician name.
    if category == "initial_evaluation" and not referring_physician:
        return None, error(
            "Referring Physician is required for Initial Evaluation"
        )

    if referring_physician:
        if is_external_referral(referring_physician):
            # Do not require an external physician or facility name.
            referring_physician = normalize_external_referral(
                referring_physician
            )

        else:
            # Keep the existing validation for registered physicians.
            canonical_name = get_canonical_physician_name(
                referring_physician
            )

            if canonical_name is None:
                print(
                    "PHYSICIAN VALIDATION DEBUG:",
                    {
                        "submitted_name": referring_physician,
                        "normalized_name": normalize_physician_name(
                            referring_physician
                        ),
                        "physician_users": [
                            {
                                "id": user.id,
                                "names": get_user_physician_names(user),
                                "role": user.role,
                            }
                            for user in get_physician_users()
                        ],
                    },
                    flush=True,
                )

                return None, error("Invalid referring physician")

            referring_physician = canonical_name

    return {
        "category": category,
        "notes": notes,
        "speciality": speciality,
        "referring_physician": referring_physician,
        "visit_number": visit_number,
    }, None

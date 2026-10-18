
from .constants import (
    ADMIN_ROLES,
    PHYSIO_ROLES,
    RECEPTION_ROLES,
)


def normalise_role_value(value):
    return (
        str(value or "")
        .strip()
        .lower()
        .replace("-", "_")
        .replace(" ", "_")
    )


def normalised_role(user):
    return normalise_role_value(
        getattr(user, "role", "")
    )


def is_admin_user(user):
    return (
        normalised_role(user) in ADMIN_ROLES
        or bool(
            getattr(user, "is_superuser", False)
        )
    )


def is_reception_role(role):
    return normalise_role_value(role) in RECEPTION_ROLES


def is_physio_role(role):
    return normalise_role_value(role) in PHYSIO_ROLES


def is_allowed_viewer(user):
    role = normalised_role(user)

    return (
        is_admin_user(user)
        or is_reception_role(role)
        or is_physio_role(role)
    )


def can_manage_assignment(
    user,
    assignment,
    admin,
    role,
    today_value,
):
    # Admin can edit/delete any registration.
    if admin:
        return True

    # Reception can manage only its own registrations
    # dated today.
    if not is_reception_role(role):
        return False

    return (
        assignment.created_by_id == user.id
        and assignment.assignment_date == today_value
    )

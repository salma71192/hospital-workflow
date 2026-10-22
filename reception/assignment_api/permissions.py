
from .constants import ADMIN_ROLES, PHYSIO_ROLES, RECEPTION_ROLES


CEO_ROLES = {
    "visitor_ceo",
    "ceo",
}

REHAB_MANAGER_ROLES = {
    "rehab_manager",
    "rehabmanager",
}


def normalise_role_value(value):
    return (
        str(value or "")
        .strip()
        .lower()
        .replace("-", "_")
        .replace(" ", "_")
    )


def normalised_role(user):
    return normalise_role_value(getattr(user, "role", ""))


def is_admin_user(user):
    return (
        normalised_role(user) in ADMIN_ROLES
        or bool(getattr(user, "is_superuser", False))
    )


def is_rehab_manager_role(role):
    return normalise_role_value(role) in REHAB_MANAGER_ROLES


def is_reception_role(role):
    return normalise_role_value(role) in RECEPTION_ROLES


def is_physio_role(role):
    return normalise_role_value(role) in PHYSIO_ROLES


def is_ceo_role(role):
    return normalise_role_value(role) in CEO_ROLES


def is_allowed_viewer(user):
    role = normalised_role(user)

    return (
        is_admin_user(user)
        or is_reception_role(role)
        or is_physio_role(role)
        or is_ceo_role(role)
        or is_rehab_manager_role(role)
    )


def can_manage_assignment(user, assignment, admin, role, today_value):
    # Admin can manage any assignment.
    if admin or is_admin_user(user):
        return True

    # CEO can view statistics but cannot manage assignments.
    if is_ceo_role(role) or is_ceo_role(normalised_role(user)):
        return False

    # Rehab Manager can view assignments but cannot manage them here.
    if is_rehab_manager_role(role) or is_rehab_manager_role(
        normalised_role(user)
    ):
        return False

    # Only reception can manage assignments they created today.
    if not is_reception_role(role):
        return False

    return (
        assignment.created_by_id == user.id
        and assignment.assignment_date == today_value
    )

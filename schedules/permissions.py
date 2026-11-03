
def can_manage_schedules(user):
    """
    Admin, Call Center, and Call Center Supervisor
    can upload and manage therapist schedules.
    """
    if not user.is_authenticated:
        return False

    if user.is_superuser:
        return True

    return user.role in {
        "admin",
        "callcenter",
        "callcenter_supervisor",
    }


def get_therapist_identity(user):
    """
    Return the unique identifier of the
    authenticated physiotherapist.

    Currently uses the username.

    The Call Center therapist selector must
    submit this same username.
    """
    if not user.is_authenticated:
        return None

    if user.role != "physio":
        return None

    return user.username


def can_view_therapist_schedule(user, therapist):
    """
    Call Center and admins can view any schedule.

    Physiotherapists can only view schedules
    associated with their own username.
    """
    if can_manage_schedules(user):
        return True

    identity = get_therapist_identity(user)

    return (
        identity is not None
        and identity == therapist
    )

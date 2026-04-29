def can_use_callcenter(user):
    if not getattr(user, "is_authenticated", False):
        return False

    role = (getattr(user, "role", "") or "").strip().lower()

    allowed_roles = {
        "admin",
        "callcenter",
        "callcenter_supervisor",
        "reception",
        "reception_supervisor",
        "physio",
    }

    return bool(user.is_superuser or role in allowed_roles)
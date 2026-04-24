def can_use_callcenter(user):
    if not user or not user.is_authenticated:
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

    return user.is_superuser or role in allowed_roles
def can_use_callcenter(user):
    if not user.is_authenticated:
        return False

    role = (getattr(user, "role", "") or "").strip().lower()

    return user.is_superuser or role in [
        "admin",
        "callcenter",
        "callcenter_supervisor",
        "reception",
        "reception_supervisor",
        "physio",
    ]
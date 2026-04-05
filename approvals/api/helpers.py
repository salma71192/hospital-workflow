import json
from datetime import datetime


def can_use_approvals(user):
    if not user.is_authenticated:
        return False
    role = (getattr(user, "role", "") or "").strip().lower()
    return user.is_superuser or role in ["admin", "approvals"]


def parse_json(request):
    try:
        raw = request.body.decode("utf-8") if request.body else "{}"
        return json.loads(raw)
    except Exception:
        return None


def validate_date(value):
    if not value:
        return None
    try:
        datetime.strptime(value, "%Y-%m-%d")
        return value
    except Exception:
        return None
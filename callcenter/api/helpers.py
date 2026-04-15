from datetime import datetime, timedelta
from django.utils import timezone


def validate_date(value):
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except Exception:
        return None


def validate_time(value):
    try:
        return datetime.strptime(value, "%H:%M").time()
    except Exception:
        return None


def today():
    return timezone.localdate()


def tomorrow():
    return today() + timedelta(days=1)


def now_time():
    return timezone.localtime().time().replace(second=0, microsecond=0)


def is_past_datetime(appointment_date, appointment_time):
    if not appointment_date or not appointment_time:
        return False

    if appointment_date < today():
        return True

    if appointment_date == today() and appointment_time < now_time():
        return True

    return False
from datetime import datetime, timedelta
from django.utils import timezone


def validate_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except Exception:
        return None


def validate_time(value):
    if not value:
        return None
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
    """
    Returns True if the given date/time is in the past
    """

    if not appointment_date or not appointment_time:
        return False

    current_date = today()
    current_time = now_time()

    # past day
    if appointment_date < current_date:
        return True

    # same day but past time
    if appointment_date == current_date and appointment_time < current_time:
        return True

    return False
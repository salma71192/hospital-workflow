from datetime import datetime, timedelta
from django.utils import timezone


def validate_date(value):
    if not value:
        return None

    try:
        return datetime.strptime(str(value), "%Y-%m-%d").date()
    except Exception:
        return None


def validate_time(value):
    if not value:
        return None

    try:
        return datetime.strptime(str(value), "%H:%M").time()
    except Exception:
        return None


def today():
    return timezone.localdate()


def tomorrow():
    return today() + timedelta(days=1)


def now_time():
    now = timezone.localtime()
    return now.replace(second=0, microsecond=0).time()


def combine_datetime(date_value, time_value):
    if not date_value or not time_value:
        return None

    naive_dt = datetime.combine(date_value, time_value)
    current_timezone = timezone.get_current_timezone()

    return timezone.make_aware(naive_dt, current_timezone)


def is_past_datetime(appointment_date, appointment_time):
    if not appointment_date or not appointment_time:
        return False

    appointment_dt = combine_datetime(appointment_date, appointment_time)
    now_dt = timezone.localtime()

    if not appointment_dt:
        return False

    return appointment_dt < now_dt


def is_today(date_value):
    return date_value == today()


def is_future_date(date_value):
    return bool(date_value and date_value > today())


def get_time_period(time_value):
    if not time_value:
        return ""

    hour = time_value.hour

    if 8 <= hour < 12:
        return "morning"

    if 12 <= hour < 17:
        return "afternoon"

    return "evening"


def is_valid_time_period(value):
    return value in ["", "morning", "afternoon", "evening"]
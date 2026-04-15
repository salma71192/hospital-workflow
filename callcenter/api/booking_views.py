import json
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from .helpers import validate_date, validate_time, is_past_datetime
from .serializers import serialize_booking
from .permissions import can_use_callcenter

from callcenter.models import Appointment

User = get_user_model()


def json_error(message, status=400, extra=None):
    payload = {"error": message}
    if extra:
        payload.update(extra)
    return JsonResponse(payload, status=status)


def parse_json(request):
    try:
        raw = request.body.decode("utf-8") if request.body else "{}"
        return json.loads(raw)
    except Exception:
        return None


def booking_base_queryset():
    return Appointment.objects.select_related("patient", "therapist", "created_by")


def get_therapists_queryset():
    return User.objects.filter(role="physio").order_by("username")


def get_agents_queryset():
    return User.objects.filter(
        role__in=[
            "admin",
            "callcenter",
            "callcenter_supervisor",
            "reception",
            "reception_supervisor",
        ]
    ).order_by("username")


def serialize_user(user):
    return {
        "id": user.id,
        "name": user.username,
    }


def today_local():
    return timezone.localdate()


def now_local_time():
    return timezone.localtime().time().replace(second=0, microsecond=0)


def tomorrow_local():
    return today_local() + timedelta(days=1)


def two_weeks_forward():
    return today_local() + timedelta(days=14)


def first_day_of_current_month():
    today_value = today_local()
    return today_value.replace(day=1)


def last_day_of_current_month():
    first_day = first_day_of_current_month()
    if first_day.month == 12:
        next_month = first_day.replace(year=first_day.year + 1, month=1, day=1)
    else:
        next_month = first_day.replace(month=first_day.month + 1, day=1)
    return next_month - timedelta(days=1)


def generate_time_strings():
    time_strings = []
    for hour in range(8, 22):
        time_strings.append(f"{hour:02d}:00")
        time_strings.append(f"{hour:02d}:30")
    time_strings.append("22:00")
    return time_strings


def get_slot_count(
    therapist_id,
    appointment_date,
    appointment_time,
    exclude_booking_id=None,
):
    qs = Appointment.objects.filter(
        therapist_id=therapist_id,
        appointment_date=appointment_date,
        appointment_time=appointment_time,
    )

    if exclude_booking_id:
        qs = qs.exclude(id=exclude_booking_id)

    return qs.count()


def get_existing_patient_booking(
    patient_id,
    appointment_date,
    exclude_booking_id=None,
):
    qs = booking_base_queryset().filter(
        patient_id=patient_id,
        appointment_date=appointment_date,
    )

    if exclude_booking_id:
        qs = qs.exclude(id=exclude_booking_id)

    return qs.first()


def ensure_booking_slot_available(
    therapist_id,
    appointment_date,
    appointment_time,
    exclude_booking_id=None,
):
    slot_count = get_slot_count(
        therapist_id=therapist_id,
        appointment_date=appointment_date,
        appointment_time=appointment_time,
        exclude_booking_id=exclude_booking_id,
    )

    if slot_count >= 2:
        return json_error("This slot is fully booked", status=400)

    return None


def ensure_patient_has_no_booking_that_day(
    patient_id,
    appointment_date,
    exclude_booking_id=None,
):
    existing_booking = get_existing_patient_booking(
        patient_id=patient_id,
        appointment_date=appointment_date,
        exclude_booking_id=exclude_booking_id,
    )

    if existing_booking:
        return json_error(
            "Patient already has a booking on this day",
            status=400,
            extra={"existing_booking": serialize_booking(existing_booking)},
        )

    return None


def therapists_api(request):
    if not can_use_callcenter(request.user):
        return json_error("Not authorized", 403)

    therapists = get_therapists_queryset()

    return JsonResponse({
        "therapists": [serialize_user(t) for t in therapists]
    })


def slots_api(request):
    if not can_use_callcenter(request.user):
        return json_error("Not authorized", 403)

    therapist_id = request.GET.get("therapist_id")
    appointment_date = validate_date(request.GET.get("date"))

    if not therapist_id or not appointment_date:
        return JsonResponse({"slots": []})

    role = (getattr(request.user, "role", "") or "").strip().lower()
    if role == "physio" and str(therapist_id) != str(request.user.id):
        return json_error("Not authorized", 403)

    bookings = Appointment.objects.filter(
        therapist_id=therapist_id,
        appointment_date=appointment_date,
    )

    today_value = today_local()
    now_time = now_local_time()

    slots = []
    for time_str in generate_time_strings():
        booking_time = validate_time(time_str)
        count = bookings.filter(appointment_time=booking_time).count()

        status = "available"
        if appointment_date < today_value:
            status = "past"
        elif appointment_date == today_value and booking_time < now_time:
            status = "past"
        elif count == 1:
            status = "partial"
        elif count >= 2:
            status = "blocked"

        slots.append({
            "time": time_str,
            "bookings_count": count,
            "status": status,
        })

    return JsonResponse({"slots": slots})


@csrf_exempt
def bookings_api(request):
    if not can_use_callcenter(request.user):
        return json_error("Not authorized", 403)

    if request.method != "POST":
        return json_error("Method not allowed", 405)

    data = parse_json(request)
    if not data:
        return json_error("Invalid JSON", 400)

    patient_id = data.get("patient_id")
    therapist_id = data.get("therapist_id")
    appointment_date = validate_date(data.get("appointment_date"))
    appointment_time = validate_time(data.get("appointment_time"))
    notes = (data.get("notes") or "").strip() or None

    if not all([patient_id, therapist_id, appointment_date, appointment_time]):
        return json_error("Missing required fields", 400)

    role = (getattr(request.user, "role", "") or "").strip().lower()
    if role == "physio" and str(therapist_id) != str(request.user.id):
        return json_error("You can only book under your own name", 403)

    if is_past_datetime(appointment_date, appointment_time):
        return json_error(
            "This time has already passed. Please choose an available future slot.",
            400,
        )

    slot_error = ensure_booking_slot_available(
        therapist_id=therapist_id,
        appointment_date=appointment_date,
        appointment_time=appointment_time,
    )
    if slot_error:
        return slot_error

    patient_booking_error = ensure_patient_has_no_booking_that_day(
        patient_id=patient_id,
        appointment_date=appointment_date,
    )
    if patient_booking_error:
        return patient_booking_error

    appointment = Appointment.objects.create(
        patient_id=patient_id,
        therapist_id=therapist_id,
        appointment_date=appointment_date,
        appointment_time=appointment_time,
        notes=notes,
        created_by=request.user,
        attendance_status="no_show",
    )

    return JsonResponse({
        "success": True,
        "message": "Appointment booked successfully",
        "booking": {
            "id": appointment.id,
        },
    })


@csrf_exempt
def booking_detail_api(request, booking_id):
    if not can_use_callcenter(request.user):
        return json_error("Not authorized", 403)

    try:
        appointment = booking_base_queryset().get(id=booking_id)
    except Appointment.DoesNotExist:
        return json_error("Booking not found", 404)

    role = (getattr(request.user, "role", "") or "").strip().lower()
    is_admin = request.user.is_superuser or role == "admin"

    if role == "physio" and appointment.therapist_id != request.user.id:
        return json_error("Not authorized", 403)

    is_past = is_past_datetime(
        appointment.appointment_date,
        appointment.appointment_time,
    )

    if request.method == "PUT":
        if is_past:
            return json_error("Past appointments cannot be edited", 403)

        data = parse_json(request)
        if not data:
            return json_error("Invalid JSON", 400)

        therapist_id = data.get("therapist_id")
        appointment_date = validate_date(data.get("appointment_date"))
        appointment_time = validate_time(data.get("appointment_time"))
        notes = (data.get("notes") or "").strip() or None

        if not all([therapist_id, appointment_date, appointment_time]):
            return json_error("Missing required fields", 400)

        if is_past_datetime(appointment_date, appointment_time):
            return json_error(
                "This selected time has already passed. Please choose another available slot.",
                400,
            )

        if role == "physio" and str(therapist_id) != str(request.user.id):
            return json_error("You can only book under your own name", 403)

        slot_error = ensure_booking_slot_available(
            therapist_id=therapist_id,
            appointment_date=appointment_date,
            appointment_time=appointment_time,
            exclude_booking_id=appointment.id,
        )
        if slot_error:
            return slot_error

        patient_booking_error = ensure_patient_has_no_booking_that_day(
            patient_id=appointment.patient_id,
            appointment_date=appointment_date,
            exclude_booking_id=appointment.id,
        )
        if patient_booking_error:
            return patient_booking_error

        appointment.therapist_id = therapist_id
        appointment.appointment_date = appointment_date
        appointment.appointment_time = appointment_time
        appointment.notes = notes
        appointment.save()

        return JsonResponse({
            "success": True,
            "message": "Booking updated successfully",
            "booking": serialize_booking(appointment),
        })

    if request.method == "DELETE":
        if is_past and not is_admin:
            return json_error("Only admin can delete past appointments", 403)

        appointment.delete()

        return JsonResponse({
            "success": True,
            "message": "Booking deleted successfully",
        })

    return json_error("Method not allowed", 405)


def today_bookings_api(request):
    if not can_use_callcenter(request.user):
        return json_error("Not authorized", 403)

    today_value = today_local()
    patient_search = (request.GET.get("patient") or "").strip()

    qs = booking_base_queryset().filter(
        created_at__date=today_value,
        appointment_date__gte=today_value,
        created_by=request.user,
    )

    if patient_search:
        qs = qs.filter(
            Q(patient__name__icontains=patient_search) |
            Q(patient__patient_id__icontains=patient_search)
        )

    qs = qs.order_by("appointment_date", "appointment_time", "created_at")

    return JsonResponse({
        "count": qs.count(),
        "bookings": [serialize_booking(b) for b in qs],
    })


def today_appointments_api(request):
    if not can_use_callcenter(request.user):
        return json_error("Not authorized", 403)

    today_value = today_local()
    patient_search = (request.GET.get("patient") or "").strip()

    qs = booking_base_queryset().filter(
        appointment_date=today_value
    )

    role = (getattr(request.user, "role", "") or "").strip().lower()
    if role == "physio":
        qs = qs.filter(therapist_id=request.user.id)

    if patient_search:
        qs = qs.filter(
            Q(patient__name__icontains=patient_search) |
            Q(patient__patient_id__icontains=patient_search)
        )

    qs = qs.order_by("appointment_time", "created_at")

    total = qs.count()
    attended = qs.filter(attendance_status="attended").count()
    no_show = qs.filter(attendance_status="no_show").count()

    return JsonResponse({
        "count": total,
        "stats": {
            "appointments": {
                "total": total,
                "attended": attended,
                "no_show": no_show,
            }
        },
        "bookings": [serialize_booking(b) for b in qs],
    })


def monthly_bookings_api(request):
    if not can_use_callcenter(request.user):
        return json_error("Not authorized", 403)

    month_start = first_day_of_current_month()
    month_end = last_day_of_current_month()

    from_date = validate_date(request.GET.get("from_date")) or month_start
    to_date = validate_date(request.GET.get("to_date")) or month_end
    user_id = (request.GET.get("user_id") or "").strip()
    patient_search = (request.GET.get("patient") or "").strip()
    therapist_id = (request.GET.get("therapist_id") or "").strip()

    if from_date < month_start:
        from_date = month_start
    if to_date > month_end:
        to_date = month_end

    if from_date > to_date:
        return json_error("From date cannot be after to date", 400)

    qs = booking_base_queryset().filter(
        appointment_date__gte=from_date,
        appointment_date__lte=to_date,
    )

    if user_id and user_id != "all":
        qs = qs.filter(created_by_id=user_id)

    role = (getattr(request.user, "role", "") or "").strip().lower()
    if role == "physio":
        qs = qs.filter(therapist_id=request.user.id)

    if therapist_id and therapist_id != "all":
        qs = qs.filter(therapist_id=therapist_id)

    if patient_search:
        qs = qs.filter(
            Q(patient__name__icontains=patient_search) |
            Q(patient__patient_id__icontains=patient_search)
        )

    qs = qs.order_by("appointment_date", "appointment_time", "created_at")

    agents = get_agents_queryset()
    therapists = get_therapists_queryset()

    return JsonResponse({
        "count": qs.count(),
        "bookings": [serialize_booking(b) for b in qs],
        "agents": [serialize_user(a) for a in agents],
        "therapists": [serialize_user(t) for t in therapists],
        "from_date": str(from_date),
        "to_date": str(to_date),
    })


def future_bookings_api(request):
    if not can_use_callcenter(request.user):
        return json_error("Not authorized", 403)

    min_date = tomorrow_local()
    max_date = two_weeks_forward()

    from_date = validate_date(request.GET.get("from_date")) or min_date
    to_date = validate_date(request.GET.get("to_date")) or max_date
    therapist_id = (request.GET.get("therapist_id") or "").strip()
    user_id = (request.GET.get("user_id") or "").strip()
    patient_search = (request.GET.get("patient") or "").strip()

    if from_date < min_date:
        from_date = min_date
    if to_date > max_date:
        to_date = max_date

    if from_date > to_date:
        return json_error("From date cannot be after to date", 400)

    qs = booking_base_queryset().filter(
        appointment_date__gte=from_date,
        appointment_date__lte=to_date,
    )

    if user_id and user_id != "all":
        qs = qs.filter(created_by_id=user_id)

    role = (getattr(request.user, "role", "") or "").strip().lower()
    if role == "physio":
        qs = qs.filter(therapist_id=request.user.id)

    if therapist_id and therapist_id != "all":
        qs = qs.filter(therapist_id=therapist_id)

    if patient_search:
        qs = qs.filter(
            Q(patient__name__icontains=patient_search) |
            Q(patient__patient_id__icontains=patient_search)
        )

    qs = qs.order_by("appointment_date", "appointment_time")

    therapist_summary_qs = (
        qs.values("therapist_id", "therapist__username")
        .annotate(booked_slots=Count("id"))
        .order_by("therapist__username")
    )

    day_summary_qs = (
        qs.values("appointment_date")
        .annotate(booked_slots=Count("id"))
        .order_by("appointment_date")
    )

    therapists = get_therapists_queryset()
    agents = get_agents_queryset()

    return JsonResponse({
        "count": qs.count(),
        "bookings": [serialize_booking(b) for b in qs],
        "therapist_summary": [
            {
                "therapist_id": row["therapist_id"],
                "therapist_name": row["therapist__username"],
                "booked_slots": row["booked_slots"],
            }
            for row in therapist_summary_qs
        ],
        "day_summary": [
            {
                "date": str(row["appointment_date"]),
                "booked_slots": row["booked_slots"],
            }
            for row in day_summary_qs
        ],
        "therapists": [serialize_user(t) for t in therapists],
        "agents": [serialize_user(a) for a in agents],
        "from_date": str(from_date),
        "to_date": str(to_date),
    })
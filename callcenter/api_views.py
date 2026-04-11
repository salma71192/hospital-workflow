import json
from datetime import datetime, date, timedelta

from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import Appointment

User = get_user_model()


# =========================
# PERMISSIONS
# =========================
def _can_use_callcenter(user):
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


# =========================
# BASIC HELPERS
# =========================
def _json_error(message, status=400, extra=None):
    payload = {"error": message}
    if extra:
        payload.update(extra)
    return JsonResponse(payload, status=status)


def _parse_json(request):
    try:
        raw = request.body.decode("utf-8") if request.body else "{}"
        return json.loads(raw)
    except Exception:
        return None


def _validate_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except Exception:
        return None


def _validate_time(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%H:%M").time()
    except Exception:
        return None


def _today():
    return date.today()


def _tomorrow():
    return _today() + timedelta(days=1)


def _first_day_of_current_month():
    today_value = _today()
    return today_value.replace(day=1)


# =========================
# SERIALIZERS
# =========================
def _serialize_booking(booking):
    return {
        "id": booking.id,
        "patient_db_id": booking.patient.id,
        "patient_name": booking.patient.name,
        "patient_id": booking.patient.patient_id,
        "therapist_name": booking.therapist.username,
        "therapist_id": booking.therapist.id,
        "appointment_date": str(booking.appointment_date),
        "appointment_time": booking.appointment_time.strftime("%H:%M"),
        "notes": booking.notes or "",
        "created_by_name": booking.created_by.username if booking.created_by else "",
        "created_by_id": booking.created_by.id if booking.created_by else None,
    }


def _serialize_user(user):
    return {
        "id": user.id,
        "name": user.username,
    }


# =========================
# QUERY HELPERS
# =========================
def _booking_base_queryset():
    return Appointment.objects.select_related("patient", "therapist", "created_by")


def _get_therapists_queryset():
    return User.objects.filter(role="physio").order_by("username")


def _get_agents_queryset():
    return User.objects.filter(
        role__in=[
            "callcenter",
            "callcenter_supervisor",
            "reception",
            "reception_supervisor",
        ]
    ).order_by("username")


def _generate_time_slots():
    slots = []
    for hour in range(8, 22):
        slots.append(f"{hour:02d}:00")
        slots.append(f"{hour:02d}:30")
    slots.append("22:00")
    return slots


def _get_slot_count(therapist_id, appointment_date, appointment_time, exclude_booking_id=None):
    qs = Appointment.objects.filter(
        therapist_id=therapist_id,
        appointment_date=appointment_date,
        appointment_time=appointment_time,
    )

    if exclude_booking_id:
        qs = qs.exclude(id=exclude_booking_id)

    return qs.count()


def _get_existing_patient_booking(patient_id, appointment_date, exclude_booking_id=None):
    qs = (
        _booking_base_queryset()
        .filter(
            patient_id=patient_id,
            appointment_date=appointment_date,
        )
    )

    if exclude_booking_id:
        qs = qs.exclude(id=exclude_booking_id)

    return qs.first()


def _validate_booking_payload(data):
    patient_id = data.get("patient_id")
    therapist_id = data.get("therapist_id")
    appointment_date = _validate_date(data.get("appointment_date"))
    appointment_time = _validate_time(data.get("appointment_time"))
    notes = (data.get("notes") or "").strip() or None

    return {
        "patient_id": patient_id,
        "therapist_id": therapist_id,
        "appointment_date": appointment_date,
        "appointment_time": appointment_time,
        "notes": notes,
    }


def _validate_booking_update_payload(data):
    therapist_id = data.get("therapist_id")
    appointment_date = _validate_date(data.get("appointment_date"))
    appointment_time = _validate_time(data.get("appointment_time"))
    notes = (data.get("notes") or "").strip() or None

    return {
        "therapist_id": therapist_id,
        "appointment_date": appointment_date,
        "appointment_time": appointment_time,
        "notes": notes,
    }


def _ensure_booking_slot_available(
    therapist_id,
    appointment_date,
    appointment_time,
    exclude_booking_id=None,
):
    slot_count = _get_slot_count(
        therapist_id=therapist_id,
        appointment_date=appointment_date,
        appointment_time=appointment_time,
        exclude_booking_id=exclude_booking_id,
    )

    if slot_count >= 2:
        return _json_error("This slot is fully booked", status=400)

    return None


def _ensure_patient_has_no_booking_that_day(patient_id, appointment_date, exclude_booking_id=None):
    existing_booking = _get_existing_patient_booking(
        patient_id=patient_id,
        appointment_date=appointment_date,
        exclude_booking_id=exclude_booking_id,
    )

    if existing_booking:
        return _json_error(
            "Patient already has a booking on this day",
            status=400,
            extra={"existing_booking": _serialize_booking(existing_booking)},
        )

    return None


# =========================
# THERAPISTS
# =========================
def therapists_api(request):
    if not _can_use_callcenter(request.user):
        return _json_error("Not authorized", status=403)

    therapists = _get_therapists_queryset()

    return JsonResponse({
        "therapists": [_serialize_user(t) for t in therapists]
    })


# =========================
# SLOTS
# =========================
def slots_api(request):
    if not _can_use_callcenter(request.user):
        return _json_error("Not authorized", status=403)

    therapist_id = request.GET.get("therapist_id")
    appointment_date = _validate_date(request.GET.get("date"))

    if not therapist_id or not appointment_date:
        return JsonResponse({"slots": []})

    if getattr(request.user, "role", "") == "physio" and str(therapist_id) != str(request.user.id):
        return _json_error("Not authorized", status=403)

    bookings = Appointment.objects.filter(
        therapist_id=therapist_id,
        appointment_date=appointment_date,
    )

    slots = []
    for time_str in _generate_time_slots():
        booking_time = _validate_time(time_str)
        count = bookings.filter(appointment_time=booking_time).count()

        status = "available"
        if count == 1:
            status = "partial"
        elif count >= 2:
            status = "blocked"

        slots.append({
            "time": time_str,
            "bookings_count": count,
            "status": status,
        })

    return JsonResponse({"slots": slots})


# =========================
# CREATE BOOKING
# =========================
@csrf_exempt
def bookings_api(request):
    if not _can_use_callcenter(request.user):
        return _json_error("Not authorized", status=403)

    if request.method != "POST":
        return _json_error("Method not allowed", status=405)

    data = _parse_json(request)
    if not data:
        return _json_error("Invalid JSON", status=400)

    payload = _validate_booking_payload(data)

    if not all([
        payload["patient_id"],
        payload["therapist_id"],
        payload["appointment_date"],
        payload["appointment_time"],
    ]):
        return _json_error("Missing required fields", status=400)

    if getattr(request.user, "role", "") == "physio":
        if str(payload["therapist_id"]) != str(request.user.id):
            return _json_error("You can only book under your own name", status=403)

    slot_error = _ensure_booking_slot_available(
        therapist_id=payload["therapist_id"],
        appointment_date=payload["appointment_date"],
        appointment_time=payload["appointment_time"],
    )
    if slot_error:
        return slot_error

    patient_booking_error = _ensure_patient_has_no_booking_that_day(
        patient_id=payload["patient_id"],
        appointment_date=payload["appointment_date"],
    )
    if patient_booking_error:
        return patient_booking_error

    appointment = Appointment.objects.create(
        patient_id=payload["patient_id"],
        therapist_id=payload["therapist_id"],
        appointment_date=payload["appointment_date"],
        appointment_time=payload["appointment_time"],
        notes=payload["notes"],
        created_by=request.user,
    )

    return JsonResponse({
        "success": True,
        "message": "Appointment booked successfully",
        "booking": {
            "id": appointment.id,
        },
    })


# =========================
# UPDATE / DELETE BOOKING
# =========================
@csrf_exempt
def booking_detail_api(request, booking_id):
    if not _can_use_callcenter(request.user):
        return _json_error("Not authorized", status=403)

    try:
        appointment = _booking_base_queryset().get(id=booking_id)
    except Appointment.DoesNotExist:
        return _json_error("Booking not found", status=404)

    if getattr(request.user, "role", "") == "physio":
        if appointment.therapist_id != request.user.id:
            return _json_error("Not authorized", status=403)

    if request.method == "PUT":
        data = _parse_json(request)
        if not data:
            return _json_error("Invalid JSON", status=400)

        payload = _validate_booking_update_payload(data)

        if not all([
            payload["therapist_id"],
            payload["appointment_date"],
            payload["appointment_time"],
        ]):
            return _json_error("Missing required fields", status=400)

        if getattr(request.user, "role", "") == "physio":
            if str(payload["therapist_id"]) != str(request.user.id):
                return _json_error("You can only book under your own name", status=403)

        slot_error = _ensure_booking_slot_available(
            therapist_id=payload["therapist_id"],
            appointment_date=payload["appointment_date"],
            appointment_time=payload["appointment_time"],
            exclude_booking_id=appointment.id,
        )
        if slot_error:
            return slot_error

        patient_booking_error = _ensure_patient_has_no_booking_that_day(
            patient_id=appointment.patient_id,
            appointment_date=payload["appointment_date"],
            exclude_booking_id=appointment.id,
        )
        if patient_booking_error:
            return patient_booking_error

        appointment.therapist_id = payload["therapist_id"]
        appointment.appointment_date = payload["appointment_date"]
        appointment.appointment_time = payload["appointment_time"]
        appointment.notes = payload["notes"]
        appointment.save()

        return JsonResponse({
            "success": True,
            "message": "Booking updated successfully",
            "booking": _serialize_booking(appointment),
        })

    if request.method == "DELETE":
        appointment.delete()
        return JsonResponse({
            "success": True,
            "message": "Booking deleted successfully",
        })

    return _json_error("Method not allowed", status=405)


# =========================
# TODAY BOOKINGS
# =========================
def today_bookings_api(request):
    if not _can_use_callcenter(request.user):
        return _json_error("Not authorized", status=403)

    today_value = _today()
    patient_search = (request.GET.get("patient") or "").strip()

    qs = _booking_base_queryset().filter(appointment_date__gte=today_value)

    if getattr(request.user, "role", "") == "physio":
        qs = qs.filter(therapist_id=request.user.id)
    else:
        qs = qs.filter(
            created_by=request.user,
            created_at__date=today_value,
        )

    if patient_search:
        qs = qs.filter(
            Q(patient__name__icontains=patient_search) |
            Q(patient__patient_id__icontains=patient_search)
        )

    qs = qs.order_by("appointment_date", "appointment_time", "created_at")

    return JsonResponse({
        "count": qs.count(),
        "bookings": [_serialize_booking(b) for b in qs],
    })


# =========================
# BOOKING TRACKER (DATE RANGE)
# =========================
def monthly_bookings_api(request):
    if not _can_use_callcenter(request.user):
        return _json_error("Not authorized", status=403)

    from_date = _validate_date(request.GET.get("from_date")) or _first_day_of_current_month()
    to_date = _validate_date(request.GET.get("to_date")) or _today()
    user_id = (request.GET.get("user_id") or "").strip()
    patient_search = (request.GET.get("patient") or "").strip()
    therapist_id = (request.GET.get("therapist_id") or "").strip()

    if from_date and to_date and from_date > to_date:
        return _json_error("From date cannot be after to date", status=400)

    if getattr(request.user, "role", "") == "physio":
        qs = _booking_base_queryset().filter(
            therapist_id=request.user.id,
            appointment_date__gte=from_date,
            appointment_date__lte=to_date,
        )
    else:
        qs = _booking_base_queryset().filter(
            created_at__date__gte=from_date,
            created_at__date__lte=to_date,
        )

        if user_id and user_id != "all":
            qs = qs.filter(created_by_id=user_id)

        if therapist_id and therapist_id != "all":
            qs = qs.filter(therapist_id=therapist_id)

    if patient_search:
        qs = qs.filter(
            Q(patient__name__icontains=patient_search) |
            Q(patient__patient_id__icontains=patient_search)
        )

    qs = qs.order_by("appointment_date", "appointment_time", "created_at")

    agents = _get_agents_queryset()
    therapists = _get_therapists_queryset()

    return JsonResponse({
        "count": qs.count(),
        "bookings": [_serialize_booking(b) for b in qs],
        "agents": [_serialize_user(a) for a in agents],
        "therapists": [_serialize_user(t) for t in therapists],
        "from_date": str(from_date),
        "to_date": str(to_date),
    })


# =========================
# FUTURE BOOKINGS
# =========================
def future_bookings_api(request):
    if not _can_use_callcenter(request.user):
        return _json_error("Not authorized", status=403)

    tomorrow = _tomorrow()

    from_date = _validate_date(request.GET.get("from_date")) or tomorrow
    to_date = _validate_date(request.GET.get("to_date"))
    therapist_id = (request.GET.get("therapist_id") or "").strip()
    user_id = (request.GET.get("user_id") or "").strip()
    patient_search = (request.GET.get("patient") or "").strip()

    if from_date < tomorrow:
        from_date = tomorrow

    if to_date and to_date < tomorrow:
        to_date = tomorrow

    if to_date and from_date > to_date:
        return _json_error("From date cannot be after to date", status=400)

    qs = _booking_base_queryset().filter(appointment_date__gte=from_date)

    if to_date:
        qs = qs.filter(appointment_date__lte=to_date)

    if getattr(request.user, "role", "") == "physio":
        qs = qs.filter(therapist_id=request.user.id)
    else:
        if therapist_id and therapist_id != "all":
            qs = qs.filter(therapist_id=therapist_id)

        if user_id and user_id != "all":
            qs = qs.filter(created_by_id=user_id)

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

    therapists = _get_therapists_queryset()
    agents = _get_agents_queryset()

    return JsonResponse({
        "count": qs.count(),
        "bookings": [_serialize_booking(b) for b in qs],
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
        "therapists": [_serialize_user(t) for t in therapists],
        "agents": [_serialize_user(a) for a in agents],
        "min_date": str(tomorrow),
    })
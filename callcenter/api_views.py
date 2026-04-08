import json
from datetime import datetime, date

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
    ]


# =========================
# HELPERS
# =========================
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


def _generate_time_slots():
    slots = []
    for hour in range(8, 22):
        slots.append(f"{hour:02d}:00")
        slots.append(f"{hour:02d}:30")
    slots.append("22:00")
    return slots


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


# =========================
# THERAPISTS
# =========================
def therapists_api(request):
    if not _can_use_callcenter(request.user):
        return JsonResponse({"error": "Not authorized"}, status=403)

    therapists = User.objects.filter(role="physio").order_by("username")

    return JsonResponse({
        "therapists": [
            {"id": t.id, "name": t.username}
            for t in therapists
        ]
    })


# =========================
# SLOTS
# =========================
def slots_api(request):
    if not _can_use_callcenter(request.user):
        return JsonResponse({"error": "Not authorized"}, status=403)

    therapist_id = request.GET.get("therapist_id")
    appointment_date = request.GET.get("date")

    parsed_date = _validate_date(appointment_date)
    if not therapist_id or not parsed_date:
        return JsonResponse({"slots": []})

    bookings = Appointment.objects.filter(
        therapist_id=therapist_id,
        appointment_date=parsed_date,
    )

    slots = []
    for time_str in _generate_time_slots():
        count = bookings.filter(
            appointment_time=_validate_time(time_str)
        ).count()

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
        return JsonResponse({"error": "Not authorized"}, status=403)

    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    data = _parse_json(request)
    if not data:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    patient_id = data.get("patient_id")
    therapist_id = data.get("therapist_id")
    appointment_date = _validate_date(data.get("appointment_date"))
    appointment_time = _validate_time(data.get("appointment_time"))
    notes = (data.get("notes") or "").strip() or None

    if not all([patient_id, therapist_id, appointment_date, appointment_time]):
        return JsonResponse({"error": "Missing required fields"}, status=400)

    slot_count = Appointment.objects.filter(
        therapist_id=therapist_id,
        appointment_date=appointment_date,
        appointment_time=appointment_time,
    ).count()

    if slot_count >= 2:
        return JsonResponse({"error": "This slot is fully booked"}, status=400)

    existing_booking = (
        Appointment.objects
        .select_related("patient", "therapist", "created_by")
        .filter(
            patient_id=patient_id,
            appointment_date=appointment_date,
        )
        .first()
    )

    if existing_booking:
        return JsonResponse(
            {
                "error": "Patient already has a booking on this day",
                "existing_booking": _serialize_booking(existing_booking),
            },
            status=400,
        )

    appointment = Appointment.objects.create(
        patient_id=patient_id,
        therapist_id=therapist_id,
        appointment_date=appointment_date,
        appointment_time=appointment_time,
        notes=notes,
        created_by=request.user,
    )

    return JsonResponse({
        "success": True,
        "message": "Appointment booked successfully",
        "booking": {
            "id": appointment.id,
        }
    })


# =========================
# UPDATE / DELETE BOOKING
# =========================
@csrf_exempt
def booking_detail_api(request, booking_id):
    if not _can_use_callcenter(request.user):
        return JsonResponse({"error": "Not authorized"}, status=403)

    try:
        appointment = Appointment.objects.select_related(
            "patient", "therapist", "created_by"
        ).get(id=booking_id)
    except Appointment.DoesNotExist:
        return JsonResponse({"error": "Booking not found"}, status=404)

    if request.method == "PUT":
        data = _parse_json(request)
        if not data:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        therapist_id = data.get("therapist_id")
        appointment_date = _validate_date(data.get("appointment_date"))
        appointment_time = _validate_time(data.get("appointment_time"))
        notes = (data.get("notes") or "").strip() or None

        if not all([therapist_id, appointment_date, appointment_time]):
            return JsonResponse({"error": "Missing required fields"}, status=400)

        slot_count = Appointment.objects.filter(
            therapist_id=therapist_id,
            appointment_date=appointment_date,
            appointment_time=appointment_time,
        ).exclude(id=appointment.id).count()

        if slot_count >= 2:
            return JsonResponse({"error": "This slot is fully booked"}, status=400)

        existing_booking = (
            Appointment.objects
            .select_related("patient", "therapist", "created_by")
            .filter(
                patient_id=appointment.patient_id,
                appointment_date=appointment_date,
            )
            .exclude(id=appointment.id)
            .first()
        )

        if existing_booking:
            return JsonResponse(
                {
                    "error": "Patient already has a booking on this day",
                    "existing_booking": _serialize_booking(existing_booking),
                },
                status=400,
            )

        appointment.therapist_id = therapist_id
        appointment.appointment_date = appointment_date
        appointment.appointment_time = appointment_time
        appointment.notes = notes
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

    return JsonResponse({"error": "Method not allowed"}, status=405)


# =========================
# TODAY BOOKINGS
# =========================
def today_bookings_api(request):
    if not _can_use_callcenter(request.user):
        return JsonResponse({"error": "Not authorized"}, status=403)

    today_value = _validate_date(request.GET.get("date")) or date.today()

    qs = (
        Appointment.objects
        .select_related("patient", "therapist", "created_by")
        .filter(created_by=request.user, appointment_date=today_value)
        .order_by("appointment_time")
    )

    return JsonResponse({
        "count": qs.count(),
        "bookings": [_serialize_booking(b) for b in qs],
    })


# =========================
# MONTHLY BOOKINGS
# =========================
def monthly_bookings_api(request):
    if not _can_use_callcenter(request.user):
        return JsonResponse({"error": "Not authorized"}, status=403)

    month_value = request.GET.get("month")
    user_id = request.GET.get("user_id")
    patient_search = request.GET.get("patient")
    therapist_id = request.GET.get("therapist_id")

    today_value = date.today()
    year = today_value.year
    month_num = today_value.month

    if month_value:
        try:
            year, month_num = map(int, month_value.split("-"))
        except Exception:
            return JsonResponse({"error": "Invalid month"}, status=400)

    qs = (
        Appointment.objects
        .select_related("patient", "therapist", "created_by")
        .filter(
            appointment_date__year=year,
            appointment_date__month=month_num,
        )
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

    qs = qs.order_by("appointment_date", "appointment_time")

    agents = User.objects.filter(
        role__in=[
            "callcenter",
            "callcenter_supervisor",
            "reception",
            "reception_supervisor",
        ]
    ).order_by("username")

    therapists = User.objects.filter(role="physio").order_by("username")

    return JsonResponse({
        "count": qs.count(),
        "bookings": [_serialize_booking(b) for b in qs],
        "agents": [{"id": a.id, "name": a.username} for a in agents],
        "therapists": [{"id": t.id, "name": t.username} for t in therapists],
    })


# =========================
# FUTURE BOOKINGS
# =========================
def future_bookings_api(request):
    if not _can_use_callcenter(request.user):
        return JsonResponse({"error": "Not authorized"}, status=403)

    today_value = date.today()

    from_date = _validate_date(request.GET.get("from_date")) or today_value
    to_date = _validate_date(request.GET.get("to_date"))
    therapist_id = request.GET.get("therapist_id")
    day_value = _validate_date(request.GET.get("day"))

    qs = (
        Appointment.objects
        .select_related("patient", "therapist", "created_by")
        .filter(appointment_date__gte=from_date)
    )

    if to_date:
        qs = qs.filter(appointment_date__lte=to_date)

    if therapist_id and therapist_id != "all":
        qs = qs.filter(therapist_id=therapist_id)

    if day_value:
        qs = qs.filter(appointment_date=day_value)

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

    therapists = User.objects.filter(role="physio").order_by("username")

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
        "therapists": [{"id": t.id, "name": t.username} for t in therapists],
    })
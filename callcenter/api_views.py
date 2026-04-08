import json
from datetime import datetime, date, timedelta

from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import Appointment

User = get_user_model()


def _can_use_callcenter(user):
    if not user.is_authenticated:
        return False

    role = (getattr(user, "role", "") or "").strip().lower()
    return user.is_superuser or role in [
        "admin",
        "callcenter",
        "callcenter_supervisor",
    ]


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


def therapists_api(request):
    if not _can_use_callcenter(request.user):
        return JsonResponse({"error": "Not authorized"}, status=403)

    therapists = User.objects.filter(role="physio").order_by("username")

    return JsonResponse({
        "therapists": [
            {
                "id": therapist.id,
                "name": therapist.username,
            }
            for therapist in therapists
        ]
    })


def slots_api(request):
    if not _can_use_callcenter(request.user):
        return JsonResponse({"error": "Not authorized"}, status=403)

    therapist_id = request.GET.get("therapist_id")
    appointment_date = request.GET.get("date")

    if not therapist_id or not appointment_date:
        return JsonResponse({"slots": []})

    parsed_date = _validate_date(appointment_date)
    if not parsed_date:
        return JsonResponse({"error": "Invalid date"}, status=400)

    bookings = Appointment.objects.filter(
        therapist_id=therapist_id,
        appointment_date=parsed_date,
    )

    all_times = _generate_time_slots()
    slots = []

    for slot_time in all_times:
        count = bookings.filter(
            appointment_time=_validate_time(slot_time)
        ).count()

        if count >= 2:
            status = "blocked"
        elif count == 1:
            status = "partial"
        else:
            status = "available"

        slots.append({
            "time": slot_time,
            "bookings_count": count,
            "status": status,
        })

    return JsonResponse({"slots": slots})


@csrf_exempt
def bookings_api(request):
    if not _can_use_callcenter(request.user):
        return JsonResponse({"error": "Not authorized"}, status=403)

    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    data = _parse_json(request)
    if data is None:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    patient_id = data.get("patient_id")
    therapist_id = data.get("therapist_id")
    appointment_date = _validate_date(data.get("appointment_date"))
    appointment_time = _validate_time(data.get("appointment_time"))
    notes = (data.get("notes") or "").strip() or None

    if not patient_id:
        return JsonResponse({"error": "Patient is required"}, status=400)

    if not therapist_id:
        return JsonResponse({"error": "Therapist is required"}, status=400)

    if not appointment_date:
        return JsonResponse({"error": "Invalid appointment_date"}, status=400)

    if not appointment_time:
        return JsonResponse({"error": "Invalid appointment_time"}, status=400)

    existing_count = Appointment.objects.filter(
        therapist_id=therapist_id,
        appointment_date=appointment_date,
        appointment_time=appointment_time,
    ).count()

    if existing_count >= 2:
        return JsonResponse({"error": "This slot is fully booked"}, status=400)

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
            "patient_id": appointment.patient_id,
            "therapist_id": appointment.therapist_id,
            "appointment_date": str(appointment.appointment_date),
            "appointment_time": appointment.appointment_time.strftime("%H:%M"),
            "notes": appointment.notes or "",
        },
    })


def today_bookings_api(request):
    if not _can_use_callcenter(request.user):
        return JsonResponse({"error": "Not authorized"}, status=403)

    today = _validate_date(request.GET.get("date")) or date.today()

    bookings_qs = (
        Appointment.objects
        .select_related("patient", "therapist", "created_by")
        .filter(
            created_by=request.user,
            appointment_date=today,
        )
        .order_by("appointment_time", "created_at")
    )

    bookings = [
        {
            "id": booking.id,
            "patient_name": booking.patient.name,
            "patient_id": booking.patient.patient_id,
            "therapist_name": booking.therapist.username,
            "appointment_date": str(booking.appointment_date),
            "appointment_time": booking.appointment_time.strftime("%H:%M"),
            "notes": booking.notes or "",
            "created_by_name": booking.created_by.username if booking.created_by else "",
        }
        for booking in bookings_qs
    ]

    return JsonResponse({
        "count": len(bookings),
        "bookings": bookings,
    })


def monthly_bookings_api(request):
    if not _can_use_callcenter(request.user):
        return JsonResponse({"error": "Not authorized"}, status=403)

    month_value = (request.GET.get("month") or "").strip()
    user_id = (request.GET.get("user_id") or "").strip()
    patient_search = (request.GET.get("patient") or "").strip()

    if month_value:
        try:
            year, month_num = month_value.split("-")
            year = int(year)
            month_num = int(month_num)
        except Exception:
            return JsonResponse({"error": "Invalid month format. Use YYYY-MM"}, status=400)
    else:
        today = date.today()
        year = today.year
        month_num = today.month
        month_value = f"{year}-{month_num:02d}"

    bookings_qs = (
        Appointment.objects
        .select_related("patient", "therapist", "created_by")
        .filter(
            appointment_date__year=year,
            appointment_date__month=month_num,
        )
        .order_by("appointment_date", "appointment_time", "created_at")
    )

    if user_id and user_id != "all":
        bookings_qs = bookings_qs.filter(created_by_id=user_id)

    if patient_search:
        bookings_qs = bookings_qs.filter(
            Q(patient__name__icontains=patient_search) |
            Q(patient__patient_id__icontains=patient_search)
        )

    bookings = [
        {
            "id": booking.id,
            "patient_name": booking.patient.name,
            "patient_id": booking.patient.patient_id,
            "therapist_name": booking.therapist.username,
            "appointment_date": str(booking.appointment_date),
            "appointment_time": booking.appointment_time.strftime("%H:%M"),
            "notes": booking.notes or "",
            "created_by_name": booking.created_by.username if booking.created_by else "",
            "created_by_id": booking.created_by.id if booking.created_by else None,
        }
        for booking in bookings_qs
    ]

    agents = User.objects.filter(
        role__in=["callcenter", "callcenter_supervisor"]
    ).order_by("username")

    return JsonResponse({
        "count": len(bookings),
        "month": month_value,
        "bookings": bookings,
        "agents": [
            {
                "id": agent.id,
                "name": agent.username,
            }
            for agent in agents
        ],
    })


def future_bookings_api(request):
    if not _can_use_callcenter(request.user):
        return JsonResponse({"error": "Not authorized"}, status=403)

    today = date.today()

    from_date = _validate_date(request.GET.get("from_date")) or today
    to_date = _validate_date(request.GET.get("to_date"))
    therapist_id = (request.GET.get("therapist_id") or "").strip()
    day_value = _validate_date(request.GET.get("day"))

    bookings_qs = (
        Appointment.objects
        .select_related("patient", "therapist", "created_by")
        .filter(appointment_date__gte=from_date)
        .order_by("appointment_date", "appointment_time", "created_at")
    )

    if to_date:
        bookings_qs = bookings_qs.filter(appointment_date__lte=to_date)

    if therapist_id and therapist_id != "all":
        bookings_qs = bookings_qs.filter(therapist_id=therapist_id)

    if day_value:
        bookings_qs = bookings_qs.filter(appointment_date=day_value)

    bookings = [
        {
            "id": booking.id,
            "patient_name": booking.patient.name,
            "patient_id": booking.patient.patient_id,
            "therapist_name": booking.therapist.username,
            "therapist_id": booking.therapist.id,
            "appointment_date": str(booking.appointment_date),
            "appointment_time": booking.appointment_time.strftime("%H:%M"),
            "notes": booking.notes or "",
            "created_by_name": booking.created_by.username if booking.created_by else "",
        }
        for booking in bookings_qs
    ]

    therapist_summary_qs = (
        bookings_qs
        .values("therapist_id", "therapist__username")
        .annotate(booked_slots=Count("id"))
        .order_by("therapist__username")
    )

    day_summary_qs = (
        bookings_qs
        .values("appointment_date")
        .annotate(booked_slots=Count("id"))
        .order_by("appointment_date")
    )

    therapist_summary = [
        {
            "therapist_id": row["therapist_id"],
            "therapist_name": row["therapist__username"],
            "booked_slots": row["booked_slots"],
        }
        for row in therapist_summary_qs
    ]

    day_summary = [
        {
            "date": str(row["appointment_date"]),
            "booked_slots": row["booked_slots"],
        }
        for row in day_summary_qs
    ]

    therapists = User.objects.filter(role="physio").order_by("username")

    return JsonResponse({
        "count": len(bookings),
        "bookings": bookings,
        "therapist_summary": therapist_summary,
        "day_summary": day_summary,
        "therapists": [
            {
                "id": therapist.id,
                "name": therapist.username,
            }
            for therapist in therapists
        ],
    })
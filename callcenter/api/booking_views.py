import json
from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from callcenter.helpers import validate_date, validate_time, is_past_datetime
from callcenter.permissions import can_use_callcenter
from callcenter.serializers import serialize_booking, serialize_user
from callcenter.models import Appointment, WaitingListEntry
from reception.models import PatientAssignment

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


def today_local():
    return timezone.localdate()


def now_local_time():
    return timezone.localtime().time().replace(second=0, microsecond=0)


def tomorrow_local():
    return today_local() + timedelta(days=1)


def two_weeks_forward():
    return today_local() + timedelta(days=14)


def first_day_of_current_month():
    return today_local().replace(day=1)


def last_day_of_current_month():
    first_day = first_day_of_current_month()

    if first_day.month == 12:
        next_month = first_day.replace(year=first_day.year + 1, month=1, day=1)
    else:
        next_month = first_day.replace(month=first_day.month + 1, day=1)

    return next_month - timedelta(days=1)


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
            "physio",
        ]
    ).order_by("username")


def get_request_role(request):
    return (getattr(request.user, "role", "") or "").strip().lower()


def get_visible_agents_queryset(request):
    role = get_request_role(request)

    if role == "physio" and not request.user.is_superuser:
        return User.objects.filter(
            Q(
                role__in=[
                    "admin",
                    "callcenter",
                    "callcenter_supervisor",
                    "reception",
                    "reception_supervisor",
                ]
            )
            | Q(id=request.user.id)
        ).order_by("username")

    return get_agents_queryset()


def get_visible_therapists_queryset(request):
    role = get_request_role(request)

    if role == "physio" and not request.user.is_superuser:
        return User.objects.filter(id=request.user.id).order_by("username")

    return get_therapists_queryset()


def apply_booking_tracker_filters(request, qs):
    role = get_request_role(request)

    therapist_id = (request.GET.get("therapist_id") or "").strip()
    user_id = (request.GET.get("user_id") or "").strip()
    patient_search = (request.GET.get("patient") or "").strip()

    if role == "physio" and not request.user.is_superuser:
        qs = qs.filter(therapist_id=request.user.id)

        if user_id and user_id != "all":
            qs = qs.filter(created_by_id=user_id)
    else:
        if therapist_id and therapist_id != "all":
            qs = qs.filter(therapist_id=therapist_id)

        if user_id and user_id != "all":
            qs = qs.filter(created_by_id=user_id)

    if patient_search:
        qs = qs.filter(
            Q(patient__name__icontains=patient_search)
            | Q(patient__patient_id__icontains=patient_search)
        )

    return qs


def generate_time_strings():
    times = []

    for hour in range(8, 22):
        times.append(f"{hour:02d}:00")
        times.append(f"{hour:02d}:30")

    times.append("22:00")
    return times


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
        return json_error(
            "This slot is fully booked",
            400,
            extra={"slot_full": True},
        )

    return None


def get_existing_patient_booking(patient_id, appointment_date, exclude_booking_id=None):
    qs = booking_base_queryset().filter(
        patient_id=patient_id,
        appointment_date=appointment_date,
    )

    if exclude_booking_id:
        qs = qs.exclude(id=exclude_booking_id)

    return qs.first()


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
            400,
            extra={"existing_booking": serialize_booking(existing_booking)},
        )

    return None


def get_time_period_for_time(appointment_time):
    if not appointment_time:
        return ""

    hour = appointment_time.hour

    if 8 <= hour < 12:
        return "morning"

    if 12 <= hour < 17:
        return "afternoon"

    return "evening"


def notify_waiting_list_for_free_slot(therapist_id, appointment_date, appointment_time):
    period = get_time_period_for_time(appointment_time)

    matches = WaitingListEntry.objects.filter(status="waiting").filter(
        Q(preferred_therapist_id=therapist_id)
        | Q(preferred_therapist__isnull=True)
    ).filter(
        Q(preferred_date=appointment_date)
        | Q(preferred_date__isnull=True)
    )

    if period:
        matches = matches.filter(
            Q(preferred_time_period=period)
            | Q(preferred_time_period="")
        )

    matched_ids = list(matches.values_list("id", flat=True))

    matches.update(
        status="notified",
        status_changed_at=timezone.now(),
    )

    return matched_ids


def move_waiting_list_to_booked(patient_id, therapist_id=None, appointment_date=None):
    WaitingListEntry.objects.filter(
        patient_id=patient_id,
        status__in=["waiting", "notified"],
    ).update(
        status="booked",
        status_changed_at=timezone.now(),
    )


def _get_month_range(month_value):
    try:
        year, month_num = map(int, str(month_value).split("-"))
        start_date = date(year, month_num, 1)

        if month_num == 12:
            end_date = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(year, month_num + 1, 1) - timedelta(days=1)

        return start_date, end_date
    except Exception:
        return None, None


def _get_previous_day_range(selected_date):
    previous_day = selected_date - timedelta(days=1)
    return previous_day, previous_day


def _get_previous_month_range(start_date):
    if start_date.month == 1:
        prev_year = start_date.year - 1
        prev_month = 12
    else:
        prev_year = start_date.year
        prev_month = start_date.month - 1

    prev_start = date(prev_year, prev_month, 1)

    if prev_month == 12:
        prev_end = date(prev_year + 1, 1, 1) - timedelta(days=1)
    else:
        prev_end = date(prev_year, prev_month + 1, 1) - timedelta(days=1)

    return prev_start, prev_end


def _build_statistics_rows(start_date, end_date, therapist_id=None):
    appointments_qs = Appointment.objects.filter(
        appointment_date__gte=start_date,
        appointment_date__lte=end_date,
    )

    assignments_qs = PatientAssignment.objects.filter(
        assignment_date__gte=start_date,
        assignment_date__lte=end_date,
    )

    if therapist_id and str(therapist_id) != "all":
        appointments_qs = appointments_qs.filter(therapist_id=therapist_id)
        assignments_qs = assignments_qs.filter(therapist_id=therapist_id)

    therapists = get_therapists_queryset()
    period_days = (end_date - start_date).days + 1
    available_per_therapist = period_days * 20

    rows = []

    for therapist in therapists:
        if therapist_id and str(therapist_id) != "all":
            if str(therapist.id) != str(therapist_id):
                continue

        therapist_appointments = appointments_qs.filter(therapist_id=therapist.id)
        therapist_assignments = assignments_qs.filter(therapist_id=therapist.id)

        booked = therapist_appointments.count()
        attended = therapist_appointments.filter(attendance_status="attended").count()
        no_show = therapist_appointments.filter(attendance_status="no_show").count()

        walk_in = therapist_assignments.filter(category="walk_in").count()
        initial_eval = therapist_assignments.filter(
            Q(category="initial_evaluation") | Q(category="initial_eval")
        ).count()

        seen = attended + walk_in + initial_eval

        rows.append({
            "therapist_id": therapist.id,
            "therapist_name": therapist.username,
            "available_slots": available_per_therapist,
            "booked": booked,
            "walk_in": walk_in,
            "seen": seen,
            "initial_eval": initial_eval,
            "no_show": no_show,
        })

    totals = {
        "available_slots": sum(row["available_slots"] for row in rows),
        "booked": sum(row["booked"] for row in rows),
        "walk_in": sum(row["walk_in"] for row in rows),
        "seen": sum(row["seen"] for row in rows),
        "initial_eval": sum(row["initial_eval"] for row in rows),
        "no_show": sum(row["no_show"] for row in rows),
    }

    return rows, totals


def therapists_api(request):
    if not can_use_callcenter(request.user):
        return json_error("Not authorized", 403)

    therapists = get_therapists_queryset()

    return JsonResponse({
        "therapists": [serialize_user(t) for t in therapists],
    })


def slots_api(request):
    if not can_use_callcenter(request.user):
        return json_error("Not authorized", 403)

    therapist_id = request.GET.get("therapist_id")
    appointment_date = validate_date(request.GET.get("date"))

    if not therapist_id or not appointment_date:
        return JsonResponse({"slots": []})

    role = get_request_role(request)

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

    role = get_request_role(request)

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

    move_waiting_list_to_booked(patient_id=patient_id)

    return JsonResponse({
        "success": True,
        "message": "Appointment booked successfully",
        "booking": {"id": appointment.id},
    })


@csrf_exempt
def booking_detail_api(request, booking_id):
    if not can_use_callcenter(request.user):
        return json_error("Not authorized", 403)

    try:
        appointment = booking_base_queryset().get(id=booking_id)
    except Appointment.DoesNotExist:
        return json_error("Booking not found", 404)

    role = get_request_role(request)
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

        old_therapist_id = appointment.therapist_id
        old_date = appointment.appointment_date
        old_time = appointment.appointment_time

        appointment.therapist_id = therapist_id
        appointment.appointment_date = appointment_date
        appointment.appointment_time = appointment_time
        appointment.notes = notes
        appointment.save()

        alert_ids = notify_waiting_list_for_free_slot(
            old_therapist_id,
            old_date,
            old_time,
        )

        move_waiting_list_to_booked(patient_id=appointment.patient_id)

        return JsonResponse({
            "success": True,
            "message": "Booking updated successfully",
            "booking": serialize_booking(appointment),
            "waiting_list_alert_ids": alert_ids,
            "alerts": alert_ids,
        })

    if request.method == "DELETE":
        if is_past and not is_admin:
            return json_error("Only admin can delete past appointments", 403)

        therapist_id = appointment.therapist_id
        appointment_date = appointment.appointment_date
        appointment_time = appointment.appointment_time

        appointment.delete()

        alert_ids = notify_waiting_list_for_free_slot(
            therapist_id,
            appointment_date,
            appointment_time,
        )

        return JsonResponse({
            "success": True,
            "message": "Booking deleted successfully",
            "waiting_list_alert_ids": alert_ids,
            "alerts": alert_ids,
        })

    return json_error("Method not allowed", 405)


def booking_tracker_api(request):
    if not can_use_callcenter(request.user):
        return json_error("Not authorized", 403)

    mode = (request.GET.get("mode") or "today").strip().lower()

    if mode == "today":
        selected_date = validate_date(request.GET.get("date")) or today_local()

        qs = booking_base_queryset().filter(appointment_date=selected_date)
        qs = apply_booking_tracker_filters(request, qs)
        qs = qs.order_by("appointment_date", "appointment_time", "created_at")

        return JsonResponse({
            "mode": "today",
            "date": str(selected_date),
            "count": qs.count(),
            "bookings": [serialize_booking(b) for b in qs],
            "agents": [serialize_user(a) for a in get_visible_agents_queryset(request)],
            "therapists": [
                serialize_user(t) for t in get_visible_therapists_queryset(request)
            ],
            "therapist_summary": [],
            "day_summary": [],
        })

    if mode == "future":
        from_date = validate_date(request.GET.get("from_date")) or tomorrow_local()
        to_date = validate_date(request.GET.get("to_date")) or two_weeks_forward()

        if from_date > to_date:
            return json_error("From date cannot be after to date", 400)

        qs = booking_base_queryset().filter(
            appointment_date__gte=from_date,
            appointment_date__lte=to_date,
        )

        qs = apply_booking_tracker_filters(request, qs)
        qs = qs.order_by("appointment_date", "appointment_time", "created_at")

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

        return JsonResponse({
            "mode": "future",
            "from_date": str(from_date),
            "to_date": str(to_date),
            "count": qs.count(),
            "bookings": [serialize_booking(b) for b in qs],
            "agents": [serialize_user(a) for a in get_visible_agents_queryset(request)],
            "therapists": [
                serialize_user(t) for t in get_visible_therapists_queryset(request)
            ],
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
        })

    if mode == "monthly":
        from_date = validate_date(request.GET.get("from_date")) or first_day_of_current_month()
        to_date = validate_date(request.GET.get("to_date")) or last_day_of_current_month()

        if from_date > to_date:
            return json_error("From date cannot be after to date", 400)

        qs = booking_base_queryset().filter(
            appointment_date__gte=from_date,
            appointment_date__lte=to_date,
        )

        qs = apply_booking_tracker_filters(request, qs)
        qs = qs.order_by("appointment_date", "appointment_time", "created_at")

        return JsonResponse({
            "mode": "monthly",
            "from_date": str(from_date),
            "to_date": str(to_date),
            "count": qs.count(),
            "bookings": [serialize_booking(b) for b in qs],
            "agents": [serialize_user(a) for a in get_visible_agents_queryset(request)],
            "therapists": [
                serialize_user(t) for t in get_visible_therapists_queryset(request)
            ],
            "therapist_summary": [],
            "day_summary": [],
        })

    return json_error("Invalid mode", 400)


def today_appointments_api(request):
    if not can_use_callcenter(request.user):
        return json_error("Not authorized", 403)

    today_value = today_local()
    patient_search = (request.GET.get("patient") or "").strip()

    qs = booking_base_queryset().filter(appointment_date=today_value)

    role = get_request_role(request)

    if role == "physio":
        qs = qs.filter(therapist_id=request.user.id)

    if patient_search:
        qs = qs.filter(
            Q(patient__name__icontains=patient_search)
            | Q(patient__patient_id__icontains=patient_search)
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


def today_statistics_api(request):
    if not can_use_callcenter(request.user):
        return json_error("Not authorized", 403)

    role = get_request_role(request)

    allowed_roles = [
        "admin",
        "callcenter",
        "callcenter_supervisor",
        "reception_supervisor",
        "physio",
    ]

    if role not in allowed_roles and not request.user.is_superuser:
        return json_error("Not authorized", 403)

    selected_date = validate_date(request.GET.get("date")) or today_local()
    therapist_id = (request.GET.get("therapist_id") or "").strip() or None

    if role == "physio" and not request.user.is_superuser:
        therapist_id = request.user.id

    rows, totals = _build_statistics_rows(
        start_date=selected_date,
        end_date=selected_date,
        therapist_id=therapist_id,
    )

    prev_start, prev_end = _get_previous_day_range(selected_date)

    previous_rows, _ = _build_statistics_rows(
        start_date=prev_start,
        end_date=prev_end,
        therapist_id=therapist_id,
    )

    previous_map = {str(row["therapist_id"]): row for row in previous_rows}

    for row in rows:
        prev_row = previous_map.get(str(row["therapist_id"]), {})
        row["previous_booked"] = prev_row.get("booked", 0)
        row["trend_booked"] = row["booked"] - row["previous_booked"]
        row["capacity_warning"] = row["booked"] >= row["available_slots"] * 0.9

    return JsonResponse({
        "date": str(selected_date),
        "rows": rows,
        "totals": totals,
        "mode": "day",
    })


def monthly_statistics_api(request):
    if not can_use_callcenter(request.user):
        return json_error("Not authorized", 403)

    role = get_request_role(request)

    allowed_roles = [
        "admin",
        "callcenter",
        "callcenter_supervisor",
        "reception_supervisor",
        "physio",
    ]

    if role not in allowed_roles and not request.user.is_superuser:
        return json_error("Not authorized", 403)

    month_value = request.GET.get("month")
    therapist_id = (request.GET.get("therapist_id") or "").strip() or None

    start_date, end_date = _get_month_range(month_value)

    if not start_date or not end_date:
        return json_error("Invalid month format. Use YYYY-MM", 400)

    if role == "physio" and not request.user.is_superuser:
        therapist_id = request.user.id

    rows, totals = _build_statistics_rows(
        start_date=start_date,
        end_date=end_date,
        therapist_id=therapist_id,
    )

    prev_start, prev_end = _get_previous_month_range(start_date)

    previous_rows, _ = _build_statistics_rows(
        start_date=prev_start,
        end_date=prev_end,
        therapist_id=therapist_id,
    )

    previous_map = {str(row["therapist_id"]): row for row in previous_rows}

    for row in rows:
        prev_row = previous_map.get(str(row["therapist_id"]), {})
        row["previous_booked"] = prev_row.get("booked", 0)
        row["trend_booked"] = row["booked"] - row["previous_booked"]
        row["capacity_warning"] = row["booked"] >= row["available_slots"] * 0.9

    return JsonResponse({
        "date": str(month_value),
        "rows": rows,
        "totals": totals,
        "mode": "month",
    })


def my_booking_stats_api(request):
    if not can_use_callcenter(request.user):
        return json_error("Not authorized", 403)

    today_value = today_local()
    month_start = today_value.replace(day=1)

    today_count = Appointment.objects.filter(
        created_by=request.user,
        created_at__date=today_value,
    ).count()

    monthly_count = Appointment.objects.filter(
        created_by=request.user,
        created_at__date__gte=month_start,
        created_at__date__lte=today_value,
    ).count()

    return JsonResponse({
        "today": today_count,
        "monthly": monthly_count,
    })
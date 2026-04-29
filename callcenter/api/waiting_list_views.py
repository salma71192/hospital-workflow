import json

from django.db.models import Q
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from callcenter.helpers import validate_date, validate_time
from callcenter.models import Appointment, WaitingListEntry
from callcenter.permissions import can_use_callcenter


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


def serialize_waiting_list_entry(entry):
    return {
        "id": entry.id,
        "patient_db_id": entry.patient.id if entry.patient else None,
        "patient_name": entry.patient.name if entry.patient else "",
        "patient_id": entry.patient.patient_id if entry.patient else "",
        "preferred_therapist_id": (
            entry.preferred_therapist.id if entry.preferred_therapist else None
        ),
        "preferred_therapist_name": (
            entry.preferred_therapist.username if entry.preferred_therapist else ""
        ),
        "preferred_date": str(entry.preferred_date) if entry.preferred_date else "",
        "preferred_time_period": entry.preferred_time_period or "",
        "notes": entry.notes or "",
        "status": entry.status,
        "created_by_id": entry.created_by.id if entry.created_by else None,
        "created_by_name": entry.created_by.username if entry.created_by else "",
        "created_at": entry.created_at.isoformat() if entry.created_at else None,
        "status_changed_at": (
            entry.status_changed_at.isoformat()
            if getattr(entry, "status_changed_at", None)
            else None
        ),
    }


def get_time_period_for_time(appointment_time):
    if not appointment_time:
        return ""

    hour = appointment_time.hour

    if 8 <= hour < 12:
        return "morning"

    if 12 <= hour < 17:
        return "afternoon"

    return "evening"


def mark_waiting_entry_booked(patient_id, therapist_id=None, appointment_date=None):
    qs = WaitingListEntry.objects.filter(
        patient_id=patient_id,
        status__in=["waiting", "notified"],
    )

    if therapist_id:
        qs = qs.filter(
            Q(preferred_therapist_id=therapist_id)
            | Q(preferred_therapist__isnull=True)
        )

    if appointment_date:
        qs = qs.filter(
            Q(preferred_date=appointment_date)
            | Q(preferred_date__isnull=True)
        )

    qs.update(status="booked", status_changed_at=timezone.now())


def get_matching_waiting_entries(therapist_id, appointment_date, appointment_time=None):
    period = get_time_period_for_time(appointment_time)

    qs = WaitingListEntry.objects.select_related(
        "patient",
        "preferred_therapist",
        "created_by",
    ).filter(
        status="waiting",
    ).filter(
        Q(preferred_therapist_id=therapist_id)
        | Q(preferred_therapist__isnull=True)
    ).filter(
        Q(preferred_date=appointment_date)
        | Q(preferred_date__isnull=True)
    )

    if period:
        qs = qs.filter(
            Q(preferred_time_period=period)
            | Q(preferred_time_period="")
        )

    return qs


@csrf_exempt
def waiting_list_api(request):
    if not can_use_callcenter(request.user):
        return json_error("Not authorized", 403)

    if request.method == "GET":
        status = (request.GET.get("status") or "active").strip().lower()
        patient_search = (request.GET.get("patient") or "").strip()
        therapist_id = (request.GET.get("therapist_id") or "").strip()
        user_id = (request.GET.get("user_id") or "").strip()
        preferred_date = validate_date(
            request.GET.get("preferred_date") or request.GET.get("date")
        )

        qs = WaitingListEntry.objects.select_related(
            "patient",
            "preferred_therapist",
            "created_by",
        )

        if status == "active":
            qs = qs.filter(status__in=["waiting", "notified"])
        elif status == "history":
            qs = qs.filter(status__in=["booked", "cancelled"])
        elif status != "all":
            qs = qs.filter(status=status)

        if patient_search:
            qs = qs.filter(
                Q(patient__name__icontains=patient_search)
                | Q(patient__patient_id__icontains=patient_search)
            )

        if therapist_id and therapist_id != "all":
            qs = qs.filter(preferred_therapist_id=therapist_id)

        if user_id and user_id != "all":
            qs = qs.filter(created_by_id=user_id)

        if preferred_date:
            if status == "history":
                qs = qs.filter(
                    Q(status_changed_at__date=preferred_date)
                    | Q(preferred_date=preferred_date)
                )
            else:
                qs = qs.filter(preferred_date=preferred_date)

        qs = qs.order_by("-created_at")

        return JsonResponse({
            "count": qs.count(),
            "waiting_list": [
                serialize_waiting_list_entry(entry)
                for entry in qs
            ],
        })

    if request.method == "POST":
        data = parse_json(request)
        if not data:
            return json_error("Invalid JSON", 400)

        patient_id = data.get("patient_id")
        preferred_therapist_id = data.get("preferred_therapist_id") or None
        preferred_date = validate_date(data.get("preferred_date"))
        preferred_time_period = (
            data.get("preferred_time_period") or ""
        ).strip().lower()
        notes = (data.get("notes") or "").strip()

        if not patient_id:
            return json_error("Missing patient", 400)

        if preferred_time_period not in ["", "morning", "afternoon", "evening"]:
            return json_error("Invalid preferred time period", 400)

        existing = WaitingListEntry.objects.filter(
            patient_id=patient_id,
            preferred_date=preferred_date,
            preferred_time_period=preferred_time_period,
            status__in=["waiting", "notified"],
        ).first()

        if existing:
            return JsonResponse({
                "success": True,
                "message": "Patient is already on the waiting list",
                "entry": serialize_waiting_list_entry(existing),
            })

        entry = WaitingListEntry.objects.create(
            patient_id=patient_id,
            preferred_therapist_id=preferred_therapist_id,
            preferred_date=preferred_date,
            preferred_time_period=preferred_time_period,
            notes=notes,
            status="waiting",
            created_by=request.user,
        )

        return JsonResponse({
            "success": True,
            "message": "Patient added to waiting list",
            "entry": serialize_waiting_list_entry(entry),
        })

    return json_error("Method not allowed", 405)


@csrf_exempt
def waiting_list_detail_api(request, entry_id):
    if not can_use_callcenter(request.user):
        return json_error("Not authorized", 403)

    try:
        entry = WaitingListEntry.objects.select_related(
            "patient",
            "preferred_therapist",
            "created_by",
        ).get(id=entry_id)
    except WaitingListEntry.DoesNotExist:
        return json_error("Waiting list entry not found", 404)

    if request.method == "PUT":
        data = parse_json(request)
        if not data:
            return json_error("Invalid JSON", 400)

        if "preferred_therapist_id" in data:
            entry.preferred_therapist_id = data.get("preferred_therapist_id") or None

        if "preferred_date" in data:
            entry.preferred_date = validate_date(data.get("preferred_date"))

        if "preferred_time_period" in data:
            preferred_time_period = (
                data.get("preferred_time_period") or ""
            ).strip().lower()

            if preferred_time_period not in ["", "morning", "afternoon", "evening"]:
                return json_error("Invalid preferred time period", 400)

            entry.preferred_time_period = preferred_time_period

        if "notes" in data:
            entry.notes = (data.get("notes") or "").strip()

        if "status" in data:
            status = (data.get("status") or "").strip().lower()

            if status not in ["waiting", "notified", "booked", "cancelled"]:
                return json_error("Invalid status", 400)

            if entry.status != status:
                entry.status = status
                entry.status_changed_at = timezone.now()

        entry.save()

        return JsonResponse({
            "success": True,
            "message": "Waiting list updated",
            "entry": serialize_waiting_list_entry(entry),
        })

    if request.method == "DELETE":
        entry.status = "cancelled"
        entry.status_changed_at = timezone.now()
        entry.save()

        return JsonResponse({
            "success": True,
            "message": "Waiting list entry moved to history",
            "entry": serialize_waiting_list_entry(entry),
        })

    return json_error("Method not allowed", 405)


def waiting_list_alerts_api(request):
    if not can_use_callcenter(request.user):
        return json_error("Not authorized", 403)

    therapist_id = request.GET.get("therapist_id")
    appointment_date = validate_date(request.GET.get("date"))
    appointment_time = validate_time(request.GET.get("time"))

    if not therapist_id or not appointment_date:
        return JsonResponse({
            "count": 0,
            "alerts": [],
        })

    if appointment_time:
        slot_count = Appointment.objects.filter(
            therapist_id=therapist_id,
            appointment_date=appointment_date,
            appointment_time=appointment_time,
        ).count()

        if slot_count >= 2:
            return JsonResponse({
                "count": 0,
                "alerts": [],
            })

    matches = get_matching_waiting_entries(
        therapist_id=therapist_id,
        appointment_date=appointment_date,
        appointment_time=appointment_time,
    )

    matched_ids = list(matches.values_list("id", flat=True))

    WaitingListEntry.objects.filter(id__in=matched_ids).update(
        status="notified",
        status_changed_at=timezone.now(),
    )

    alerts = WaitingListEntry.objects.select_related(
        "patient",
        "preferred_therapist",
        "created_by",
    ).filter(id__in=matched_ids)

    return JsonResponse({
        "count": alerts.count(),
        "alerts": [
            serialize_waiting_list_entry(entry)
            for entry in alerts
        ],
    })
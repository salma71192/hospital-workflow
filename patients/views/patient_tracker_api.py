
from django.db.models import Q
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from callcenter.models import Appointment
from patients.models import Patient

from .helpers import (
    _can_view_patient_tracker,
    _get_patient_status,
    _role,
    normalize_patient_id,
)


@csrf_exempt
def patient_tracker_api(request):
    if request.method != "GET":
        return JsonResponse(
            {"error": "Method not allowed"},
            status=405,
        )

    if not _can_view_patient_tracker(request.user):
        return JsonResponse(
            {"error": "Not authorized"},
            status=403,
        )

    today_value = timezone.localdate()
    role = _role(request.user)
    search = (request.GET.get("search") or "").strip()

    patients_qs = Patient.objects.filter(
        is_archived=False
    ).order_by("name")

    if search:
        normalized_search = normalize_patient_id(
            search
        ).casefold()

        matching_ids = []

        for existing in Patient.objects.filter(
            is_archived=False
        ).only("id", "patient_id").iterator():
            if normalized_search in normalize_patient_id(
                existing.patient_id
            ).casefold():
                matching_ids.append(existing.id)

        patients_qs = patients_qs.filter(
            Q(name__icontains=search)
            | Q(patient_id__icontains=search)
            | Q(id__in=matching_ids)
        )

    patient_rows = []

    for patient in patients_qs:
        appointments_qs = Appointment.objects.filter(
            patient_id=patient.id
        )

        # Physios see only their own appointment activity.
        if role == "physio" and not request.user.is_superuser:
            appointments_qs = appointments_qs.filter(
                therapist_id=request.user.id
            )

        latest_seen = (
            appointments_qs.filter(
                attendance_status="attended",
                appointment_date__lte=today_value,
            )
            .order_by(
                "-appointment_date",
                "-appointment_time",
            )
            .values_list("appointment_date", flat=True)
            .first()
        )

        future_count = appointments_qs.filter(
            appointment_date__gte=today_value
        ).count()

        latest_appointment = (
            appointments_qs.order_by(
                "-appointment_date",
                "-appointment_time",
                "-created_at",
            ).first()
        )

        approved_sessions = int(
            patient.approved_sessions or 0
        )

        sessions_taken = int(
            patient.sessions_taken or 0
        )

        remaining_sessions = max(
            approved_sessions - sessions_taken,
            0,
        )

        # Appointment visits attended by this therapist, up to today.
        attended_count = appointments_qs.filter(
            attendance_status="attended",
            appointment_date__lte=today_value,
        ).count()

        therapist_id = (
            latest_appointment.therapist_id
            if latest_appointment else None
        )

        therapist_name = ""

        if latest_appointment and latest_appointment.therapist:
            therapist_name = (
                latest_appointment.therapist.get_full_name()
                or latest_appointment.therapist.username
            )

        # Walk-in visits are not counted because the walk-in model/source
        # has not been provided.
        walk_in_count = 0

        # For physios, omit patients without their own appointments.
        if (
            role == "physio"
            and not request.user.is_superuser
            and not appointments_qs.exists()
        ):
            continue

        patient_rows.append({
            "id": patient.id,
            "name": patient.name,
            "patient_id": patient.patient_id,
            "approved_sessions": approved_sessions,
            "sessions_taken": sessions_taken,
            "remaining_sessions": remaining_sessions,
            "status": _get_patient_status(
                patient,
                latest_seen,
            ),
            "latest_seen_date": (
                str(latest_seen) if latest_seen else None
            ),
            "current_future_appointments": future_count,
            "therapist_id": therapist_id,
            "last_treated_by_name": therapist_name,
            "appointment_sessions": attended_count,
            "appointments_utilized": attended_count,
            "appointment_count": attended_count,
            "qualifying_utilized_sessions": (
                attended_count + walk_in_count
            ),
            "walk_in_sessions": walk_in_count,
            "walkin_sessions": walk_in_count,
            "walk_in_count": walk_in_count,
            "walkin_count": walk_in_count,
            "utilized_walk_ins": walk_in_count,
        })

    return JsonResponse({"patients": patient_rows})

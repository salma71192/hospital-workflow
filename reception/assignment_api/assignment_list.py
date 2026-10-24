
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.http import JsonResponse

from reception.models import PatientAssignment

from .constants import (
    ADMIN_ROLES,
    RECEPTION_ROLES,
    PHYSICIAN_NAMES,
)
from .helpers import error, get_request_date
from .permissions import (
    is_allowed_viewer,
    is_ceo_role,
    is_physio_role,
    is_reception_role,
    is_rehab_manager_role,
    normalise_role_value,
)
from .serializers import assignment_to_dict
from .services import physiotherapists_queryset

User = get_user_model()


def list_assignments(request, role, admin, today_value):
    # Check whether this user can view assignments.
    if not is_allowed_viewer(request.user):
        return error("Not allowed", 403)

    role = normalise_role_value(role)
    admin = admin or bool(getattr(request.user, "is_superuser", False))

    # Identify special viewer roles using the authenticated user's role.
    user_role = normalise_role_value(
        getattr(request.user, "role", "")
    )
    ceo = is_ceo_role(user_role)
    rehab_manager = is_rehab_manager_role(user_role)

    # Date filters
    start_date, date_error = get_request_date(request, "start_date")
    if date_error:
        return date_error

    end_date, date_error = get_request_date(request, "end_date")
    if date_error:
        return date_error

    if start_date and end_date and start_date > end_date:
        return error("Start date cannot be after end date")

    qs = PatientAssignment.objects.select_related(
        "patient",
        "therapist",
        "created_by",
    )

    if start_date:
        qs = qs.filter(assignment_date__gte=start_date)

    if end_date:
        qs = qs.filter(assignment_date__lte=end_date)

    # Search by patient name or patient ID.
    patient_search = (request.GET.get("patient") or "").strip()

    if patient_search:
        qs = qs.filter(
            Q(patient__name__icontains=patient_search)
            | Q(patient__patient_id__icontains=patient_search)
        )

    # Filter by therapist or selected user.
    therapist_id = (request.GET.get("therapist_id") or "").strip()
    viewed_user_id = (request.GET.get("viewed_user_id") or "").strip()
    viewed_user_role = normalise_role_value(
        request.GET.get("viewed_user_role") or ""
    )
    user_id = (request.GET.get("user_id") or "").strip()

    if therapist_id and therapist_id.lower() != "all":
        try:
            qs = qs.filter(therapist_id=int(therapist_id))
        except (ValueError, TypeError):
            return error("Invalid therapist filter")

    # Role-based visibility.
    if admin:
        selected_user_id = (
            user_id
            if user_id and user_id.lower() != "all"
            else ""
        )

        if viewed_user_id and viewed_user_id.lower() != "all":
            if (
                viewed_user_role in RECEPTION_ROLES
                or viewed_user_role in ADMIN_ROLES
            ):
                selected_user_id = viewed_user_id

            elif is_physio_role(viewed_user_role):
                try:
                    qs = qs.filter(
                        therapist_id=int(viewed_user_id)
                    )
                except (ValueError, TypeError):
                    return error("Invalid viewed user filter")

        if selected_user_id:
            try:
                qs = qs.filter(
                    created_by_id=int(selected_user_id)
                )
            except (ValueError, TypeError):
                return error("Invalid user filter")

    elif is_reception_role(role):
        # Reception sees today's assignments when no dates are supplied.
        if not start_date and not end_date:
            qs = qs.filter(assignment_date=today_value)

    elif is_physio_role(role):
        # Physiotherapists see their own assignments only.
        qs = qs.filter(therapist_id=request.user.id)

    elif ceo or rehab_manager:
        # CEO and Rehab Manager can view assignments.
        # Creation and modification permissions are checked separately.
        pass

    else:
        return error("Not allowed", 403)

    # Serialize assignments.
    assignments = [
        assignment_to_dict(
            assignment,
            today_value,
            request.user,
            admin,
            role,
        )
        for assignment in qs.order_by(
            "-assignment_date",
            "-created_at",
        )
    ]

    # Reception and admin users.
    agents = [
        user
        for user in (
            User.objects.all()
            .order_by("username")
            .values("id", "username", "role")
        )
        if normalise_role_value(user.get("role"))
        in (RECEPTION_ROLES | ADMIN_ROLES)
    ]

    # Physiotherapists only.
    therapists = list(
        physiotherapists_queryset().values("id", "username")
    )

    # Previously used specialities.
    specialities = list(
        PatientAssignment.objects
        .exclude(speciality="")
        .exclude(speciality__isnull=True)
        .values_list("speciality", flat=True)
        .distinct()
        .order_by("speciality")
    )

    return JsonResponse({
        "assignments": assignments,
        "agents": agents,
        "therapists": therapists,
        "physicians": PHYSICIAN_NAMES,
        "specialities": specialities,
        "start_date": str(start_date) if start_date else "",
        "end_date": str(end_date) if end_date else "",
    })

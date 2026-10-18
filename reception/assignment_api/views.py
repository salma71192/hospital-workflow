
from django.db import transaction
from django.db.models import Q
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model

from patients.models import Patient
from reception.models import PatientAssignment

from .constants import (
    ADMIN_ROLES,
    PHYSIO_ROLES,
    RECEPTION_ROLES,
    PHYSICIAN_NAMES,
)
from .permissions import (
    normalised_role,
    is_admin_user,
    is_reception_role,
    is_physio_role,
    is_allowed_viewer,
    can_manage_assignment,
    normalise_role_value,
)
from .helpers import (
    error,
    read_json,
    get_request_date,
    validate_fields,
)
from .serializers import assignment_to_dict
from .services import (
    physiotherapists_queryset,
    get_physio,
    get_assignment,
    mark_today_appointment_attended,
)

User = get_user_model()


def therapists_api(request):
    if not request.user.is_authenticated:
        return error("Not authenticated", 401)

    if not is_allowed_viewer(request.user):
        return error("Not allowed", 403)

    return JsonResponse({
        "therapists": list(
            physiotherapists_queryset().values(
                "id",
                "username",
            )
        )
    })


def physicians_api(request):
    if not request.user.is_authenticated:
        return error("Not authenticated", 401)

    if not is_allowed_viewer(request.user):
        return error("Not allowed", 403)

    return JsonResponse({
        "physicians": PHYSICIAN_NAMES,
    })


def staff_filters_api(request):
    if not request.user.is_authenticated:
        return error("Not authenticated", 401)

    if not is_admin_user(request.user):
        return error("Not allowed", 403)

    users = (
        User.objects
        .exclude(role="visitor")
        .order_by("username")
        .values("id", "username", "role")
    )

    return JsonResponse({
        "users": list(users),
    })


@csrf_exempt
def assignments_api(request, assignment_id=None):
    if not request.user.is_authenticated:
        return error("Not authenticated", 401)

    role = normalised_role(request.user)
    admin = is_admin_user(request.user)
    today_value = timezone.localdate()

    # ---------------------------------------------------------
    # GET: List and filter registrations.
    # ---------------------------------------------------------
    if request.method == "GET":
        if not is_allowed_viewer(request.user):
            return error("Not allowed", 403)

        start_date, date_error = get_request_date(
            request, "start_date"
        )
        if date_error:
            return date_error

        end_date, date_error = get_request_date(
            request, "end_date"
        )
        if date_error:
            return date_error

        if (
            start_date
            and end_date
            and start_date > end_date
        ):
            return error(
                "Start date cannot be after end date"
            )

        qs = PatientAssignment.objects.select_related(
            "patient",
            "therapist",
            "created_by",
        )

        # Apply the requested date filters.
        if start_date:
            qs = qs.filter(
                assignment_date__gte=start_date
            )

        if end_date:
            qs = qs.filter(
                assignment_date__lte=end_date
            )

        patient_search = (
            request.GET.get("patient") or ""
        ).strip()

        if patient_search:
            qs = qs.filter(
                Q(patient__name__icontains=patient_search)
                | Q(
                    patient__patient_id__icontains=patient_search
                )
            )

        therapist_id = (
            request.GET.get("therapist_id") or ""
        ).strip()

        if therapist_id and therapist_id.lower() != "all":
            try:
                qs = qs.filter(
                    therapist_id=int(therapist_id)
                )
            except (ValueError, TypeError):
                return error("Invalid therapist filter")

        user_id = (
            request.GET.get("user_id") or ""
        ).strip()

        viewed_user_id = (
            request.GET.get("viewed_user_id") or ""
        ).strip()

        viewed_user_role = normalise_role_value(
            request.GET.get("viewed_user_role") or ""
        )

        # ADMIN: May view registrations across all dates.
        if admin:
            selected_user_id = (
                user_id
                if user_id and user_id.lower() != "all"
                else ""
            )

            if (
                viewed_user_id
                and viewed_user_id.lower() != "all"
            ):
                if (
                    viewed_user_role in RECEPTION_ROLES
                    or viewed_user_role in ADMIN_ROLES
                ):
                    selected_user_id = viewed_user_id

                elif viewed_user_role in PHYSIO_ROLES:
                    try:
                        qs = qs.filter(
                            therapist_id=int(viewed_user_id)
                        )
                    except (ValueError, TypeError):
                        return error(
                            "Invalid viewed user filter"
                        )

            if selected_user_id:
                try:
                    qs = qs.filter(
                        created_by_id=int(selected_user_id)
                    )
                except (ValueError, TypeError):
                    return error("Invalid user filter")

        # RECEPTION: Respect the selected date range.
        # If no date filters are supplied, default to today.
        elif is_reception_role(role):
            if not start_date and not end_date:
                qs = qs.filter(
                    assignment_date=today_value
                )

        # PHYSIOTHERAPIST: Only registrations assigned to them.
        elif is_physio_role(role):
            qs = qs.filter(
                therapist_id=request.user.id
            )

        else:
            return error("Not allowed", 403)

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

        agents = list(
            User.objects.filter(
                role__in=list(
                    RECEPTION_ROLES | ADMIN_ROLES
                )
            )
            .order_by("username")
            .values("id", "username", "role")
        )

        therapists = list(
            physiotherapists_queryset().values(
                "id",
                "username",
            )
        )

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
            "start_date": (
                str(start_date) if start_date else ""
            ),
            "end_date": (
                str(end_date) if end_date else ""
            ),
        })

    # ---------------------------------------------------------
    # POST: Create a registration.
    # ---------------------------------------------------------
    if request.method == "POST":
        if not (
            admin or is_reception_role(role)
        ):
            return error("Not allowed", 403)

        data, body_error = read_json(request)
        if body_error:
            return body_error

        patient_id = data.get("patient_id")
        therapist_id = data.get("therapist_id")

        if not patient_id or not therapist_id:
            return error(
                "Missing patient or therapist"
            )

        fields, validation_error = validate_fields(data)
        if validation_error:
            return validation_error

        # Only admins may choose a registration date.
        if admin:
            submitted_date = data.get(
                "assignment_date"
            )

            if submitted_date:
                from reception.api_helpers import parse_date

                assignment_date = parse_date(
                    submitted_date
                )

                if not assignment_date:
                    return error(
                        "Invalid assignment date"
                    )
            else:
                assignment_date = today_value
        else:
            assignment_date = today_value

        try:
            patient = Patient.objects.get(
                id=patient_id
            )
            therapist = get_physio(
                therapist_id
            )
        except (
            Patient.DoesNotExist,
            User.DoesNotExist,
            ValueError,
            TypeError,
        ):
            return error(
                "Invalid patient or therapist"
            )

        with transaction.atomic():
            locked_patient = (
                Patient.objects
                .select_for_update()
                .get(id=patient.id)
            )

            already_assigned = (
                PatientAssignment.objects.filter(
                    patient=locked_patient,
                    assignment_date=assignment_date,
                ).exists()
            )

            if already_assigned:
                return error(
                    "This patient is already assigned "
                    "on the selected date"
                )

            assignment = PatientAssignment.objects.create(
                patient=locked_patient,
                therapist=therapist,
                assignment_date=assignment_date,
                category=fields["category"],
                visit_number=fields["visit_number"],
                referring_physician=fields[
                    "referring_physician"
                ],
                speciality=fields["speciality"],
                notes=fields["notes"],
                created_by=request.user,
            )

            if assignment_date == today_value:
                mark_today_appointment_attended(
                    patient=locked_patient,
                    therapist=therapist,
                    marked_by=request.user,
                )

        return JsonResponse({
            "success": True,
            "message": "Patient assigned successfully",
            "id": assignment.id,
            "assignment_date": str(
                assignment.assignment_date
            ),
            "therapist_id": therapist.id,
            "therapist_name": therapist.username,
            "category": assignment.category,
            "visit_number": assignment.visit_number,
            "referring_physician": (
                assignment.referring_physician
            ),
            "speciality": assignment.speciality,
            "specialty": assignment.speciality,
        })

    # ---------------------------------------------------------
    # PUT: Update a registration.
    # ---------------------------------------------------------
    if request.method == "PUT":
        if not assignment_id:
            return error(
                "Assignment ID is required"
            )

        assignment, lookup_error = get_assignment(
            assignment_id
        )
        if lookup_error:
            return lookup_error

        # Preserve existing edit permissions.
        if not can_manage_assignment(
            request.user,
            assignment,
            admin,
            role,
            today_value,
        ):
            return error(
                "You do not have permission to edit this "
                "registration. Reception can edit only its "
                "own registrations dated today.",
                403,
            )

        data, body_error = read_json(request)
        if body_error:
            return body_error

        fields, validation_error = validate_fields(
            data,
            assignment=assignment,
        )
        if validation_error:
            return validation_error

        new_assignment_date = assignment.assignment_date

        # Only admins may change the date.
        if admin and "assignment_date" in data:
            from reception.api_helpers import parse_date

            parsed_date = parse_date(
                data.get("assignment_date")
            )

            if not parsed_date:
                return error(
                    "Invalid assignment date"
                )

            new_assignment_date = parsed_date

        new_therapist = assignment.therapist
        therapist_id = data.get("therapist_id")

        if therapist_id:
            try:
                new_therapist = get_physio(
                    therapist_id
                )
            except (
                User.DoesNotExist,
                ValueError,
                TypeError,
            ):
                return error(
                    "Invalid therapist"
                )

        duplicate_exists = (
            PatientAssignment.objects.filter(
                patient_id=assignment.patient_id,
                assignment_date=new_assignment_date,
            )
            .exclude(id=assignment.id)
            .exists()
        )

        if duplicate_exists:
            return error(
                "This patient is already assigned "
                "on the selected date"
            )

        with transaction.atomic():
            assignment.therapist = new_therapist
            assignment.category = fields["category"]
            assignment.visit_number = fields[
                "visit_number"
            ]
            assignment.referring_physician = fields[
                "referring_physician"
            ]
            assignment.speciality = fields["speciality"]
            assignment.notes = fields["notes"]
            assignment.assignment_date = new_assignment_date
            assignment.save()

            if new_assignment_date == today_value:
                mark_today_appointment_attended(
                    patient=assignment.patient,
                    therapist=new_therapist,
                    marked_by=request.user,
                )

        return JsonResponse({
            "success": True,
            "message": "Assignment updated successfully",
            "id": assignment.id,
            "assignment_date": str(
                assignment.assignment_date
            ),
            "therapist_id": new_therapist.id,
            "therapist_name": new_therapist.username,
            "category": assignment.category,
            "visit_number": assignment.visit_number,
            "referring_physician": (
                assignment.referring_physician
            ),
            "speciality": assignment.speciality,
            "specialty": assignment.speciality,
        })

    # ---------------------------------------------------------
    # DELETE: Delete a registration.
    # ---------------------------------------------------------
    if request.method == "DELETE":
        if not assignment_id:
            return error(
                "Assignment ID is required"
            )

        assignment, lookup_error = get_assignment(
            assignment_id
        )
        if lookup_error:
            return lookup_error

        # Preserve existing delete permissions.
        if not can_manage_assignment(
            request.user,
            assignment,
            admin,
            role,
            today_value,
        ):
            return error(
                "You do not have permission to delete this "
                "registration. Reception can delete only its "
                "own registrations dated today.",
                403,
            )

        assignment.delete()

        return JsonResponse({
            "success": True,
            "message": "Assignment deleted successfully",
        })

    return error("Method not allowed", 405)

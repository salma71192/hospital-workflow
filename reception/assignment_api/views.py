
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from .assignment_create import create_assignment
from .assignment_delete import delete_assignment
from .assignment_list import list_assignments
from .assignment_update import update_assignment
from .helpers import error
from .permissions import is_admin_user, normalised_role
from .staff_views import (
    physicians_api,
    staff_filters_api,
    therapists_api,
)


@csrf_exempt
def assignments_api(request, assignment_id=None):
    if not request.user.is_authenticated:
        return error("Not authenticated", 401)

    role = normalised_role(request.user)
    admin = is_admin_user(request.user)
    today_value = timezone.localdate()

    if request.method == "GET":
        return list_assignments(
            request=request,
            role=role,
            admin=admin,
            today_value=today_value,
        )

    if request.method == "POST":
        return create_assignment(
            request=request,
            role=role,
            admin=admin,
            today_value=today_value,
        )

    if request.method == "PUT":
        return update_assignment(
            request=request,
            assignment_id=assignment_id,
            role=role,
            admin=admin,
            today_value=today_value,
        )

    if request.method == "DELETE":
        return delete_assignment(
            request=request,
            assignment_id=assignment_id,
            role=role,
            admin=admin,
            today_value=today_value,
        )

    return error("Method not allowed", 405)

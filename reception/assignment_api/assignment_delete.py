
from django.http import JsonResponse

from .helpers import error
from .permissions import can_manage_assignment
from .services import get_assignment


def delete_assignment(
    request,
    assignment_id,
    role,
    admin,
    today_value,
):
    if not assignment_id:
        return error("Assignment ID is required")

    assignment, lookup_error = get_assignment(assignment_id)
    if lookup_error:
        return lookup_error

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

    deleted_id = assignment.id
    assignment.delete()

    return JsonResponse({
        "success": True,
        "message": "Assignment permanently deleted",
        "id": deleted_id,
    })

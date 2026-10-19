
from django.contrib.auth import get_user_model
from django.http import JsonResponse

from .constants import (
    ADMIN_ROLES,
    PHYSICIAN_NAMES,
)
from .permissions import (
    is_admin_user,
    is_allowed_viewer,
)
from .helpers import error
from .services import physiotherapists_queryset

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

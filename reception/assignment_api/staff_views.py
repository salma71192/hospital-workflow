
from django.contrib.auth import get_user_model
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
import json

from reception.models import Physician

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


@require_http_methods(["GET", "POST"])
def physicians_api(request):
    if not request.user.is_authenticated:
        return error("Not authenticated", 401)

    if not is_allowed_viewer(request.user):
        return error("Not allowed", 403)

    if request.method == "GET":
        # Include the original configured physicians and all
        # physicians saved in the shared database.
        database_names = list(
            Physician.objects.order_by("name").values_list(
                "name",
                flat=True,
            )
        )

        names_by_key = {}

        for name in list(PHYSICIAN_NAMES) + database_names:
            cleaned_name = str(name or "").strip()
            if cleaned_name:
                names_by_key.setdefault(
                    cleaned_name.casefold(),
                    cleaned_name,
                )

        return JsonResponse({
            "physicians": sorted(
                names_by_key.values(),
                key=str.casefold,
            ),
        })

    # Only administrators can add physicians.
    if not is_admin_user(request.user):
        return error("Only administrators can add physicians", 403)

    try:
        data = json.loads(request.body or b"{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return error("Invalid JSON")

    if not isinstance(data, dict):
        return error("Request body must be a JSON object")

    name = str(data.get("name") or "").strip()

    if not name:
        return error("Physician name is required")

    if len(name) > 255:
        return error("Physician name cannot exceed 255 characters")

    # Check configured and database names without case sensitivity.
    existing_name = next(
        (
            str(existing).strip()
            for existing in PHYSICIAN_NAMES
            if str(existing).strip().casefold() == name.casefold()
        ),
        None,
    )

    existing_record = Physician.objects.filter(
        name__iexact=name
    ).first()

    if existing_name or existing_record:
        return JsonResponse({
            "physician": (
                existing_record.name
                if existing_record
                else existing_name
            ),
            "message": "Physician already exists",
        }, status=200)

    try:
        physician = Physician.objects.create(name=name)
    except Exception:
        # Handle a possible duplicate created by another request.
        existing_record = Physician.objects.filter(
            name__iexact=name
        ).first()

        if existing_record:
            return JsonResponse({
                "physician": existing_record.name,
                "message": "Physician already exists",
            }, status=200)

        return error("Unable to save physician. Please try again.", 500)

    return JsonResponse({
        "physician": physician.name,
        "message": "Physician added successfully",
    }, status=201)


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

import json

from django.contrib.auth import get_user_model
from django.db import transaction
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from reception.models import Physician


User = get_user_model()


def normalize_physician_name(name):
    """Normalize whitespace and capitalization for comparison."""
    return " ".join(str(name or "").split()).casefold()


def get_user_physician_name(user):
    """Get the best available display name for a physician account."""
    return (
        getattr(user, "display_name", "")
        or getattr(user, "full_name", "")
        or user.get_full_name()
        or getattr(user, "username", "")
    ).strip()


def list_physicians_api(request):
    """Return physician user accounts mapped to Physician model IDs."""
    if request.method != "GET":
        return JsonResponse(
            {"error": "Method not allowed"},
            status=405,
        )

    if not hasattr(User, "role"):
        return JsonResponse(
            {"error": "The user model does not have a role field."},
            status=500,
        )

    with transaction.atomic():
        physician_users = User.objects.filter(
            role__in=["doctor", "physician"]
        ).order_by("id")

        existing_physicians = {}

        for physician in Physician.objects.all().order_by("id"):
            key = normalize_physician_name(physician.name)

            if key and key not in existing_physicians:
                existing_physicians[key] = physician

        results = []
        seen_users = set()

        for user in physician_users:
            name = " ".join(get_user_physician_name(user).split())

            if not name:
                continue

            name_key = normalize_physician_name(name)

            # Reuse a matching record or create a missing one.
            physician = existing_physicians.get(name_key)

            if physician is None:
                physician = Physician.objects.create(name=name)
                existing_physicians[name_key] = physician

            if user.pk in seen_users:
                continue

            seen_users.add(user.pk)

            results.append({
                "id": physician.id,
                "physician_id": physician.id,
                "user_id": user.id,
                "name": name,
                "display_name": name,
                "full_name": name,
            })

    results.sort(key=lambda item: item["name"].casefold())

    return JsonResponse({"physicians": results})


@csrf_exempt
def create_physician_api(request):
    if request.method != "POST":
        return JsonResponse(
            {"error": "Method not allowed"},
            status=405,
        )

    try:
        data = json.loads(request.body or b"{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    if not isinstance(data, dict):
        return JsonResponse(
            {"error": "JSON body must be an object"},
            status=400,
        )

    name = data.get("name")

    if not isinstance(name, str) or not name.strip():
        return JsonResponse(
            {"error": "Physician name is required"},
            status=400,
        )

    name = " ".join(name.split())

    if len(name) > 255:
        return JsonResponse(
            {"error": "Physician name cannot exceed 255 characters"},
            status=400,
        )

    normalized_name = normalize_physician_name(name)

    for existing in Physician.objects.all().only("id", "name"):
        if normalize_physician_name(existing.name) == normalized_name:
            return JsonResponse({
                "success": True,
                "id": existing.id,
                "name": existing.name,
                "message": "Physician already exists",
            })

    physician = Physician.objects.create(name=name)

    return JsonResponse({
        "success": True,
        "id": physician.id,
        "name": physician.name,
        "message": "Physician created successfully",
    }, status=201)

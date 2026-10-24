
import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from reception.models import Physician


def normalize_physician_name(name):
    """Normalize whitespace and capitalization for comparison."""
    return " ".join(str(name or "").split()).casefold()


def list_physicians_api(request):
    if request.method != "GET":
        return JsonResponse(
            {"error": "Method not allowed"},
            status=405,
        )

    physicians = Physician.objects.all().order_by("name")

    return JsonResponse({
        "physicians": [
            {
                "id": physician.id,
                "name": physician.name,
            }
            for physician in physicians
        ]
    })


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
        return JsonResponse(
            {"error": "Invalid JSON"},
            status=400,
        )

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

    # Reuse an existing physician regardless of capitalization
    # or repeated whitespace.
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

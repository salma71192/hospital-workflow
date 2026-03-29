from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json


@csrf_exempt
def login_api(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return JsonResponse(
            {"error": "Username and password are required"},
            status=400
        )

    user = authenticate(request, username=username, password=password)

    if user is None:
        return JsonResponse({"error": "Invalid username or password"}, status=401)

    login(request, user)

    return JsonResponse({
        "success": True,
        "id": user.id,
        "username": user.username,
        "role": getattr(user, "role", ""),
        "is_superuser": user.is_superuser,
    })


@csrf_exempt
def logout_api(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    logout(request)
    return JsonResponse({"success": True})


def current_user_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    return JsonResponse({
        "id": request.user.id,
        "username": request.user.username,
        "role": getattr(request.user, "role", ""),
        "is_superuser": request.user.is_superuser,
    })
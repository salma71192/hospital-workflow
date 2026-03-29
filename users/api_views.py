from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

from .models import User


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


@csrf_exempt
def create_user_api(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    if not (request.user.is_superuser or request.user.role == "admin"):
        return JsonResponse({"error": "Only admin can create users"}, status=403)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    username = data.get("username")
    password = data.get("password")
    role = data.get("role")
    is_superuser = data.get("is_superuser", False)

    allowed_roles = [
        "admin",
        "physio",
        "reception",
        "visitor",
        "doctor",
        "rcm",
        "callcenter",
    ]

    if not username or not password:
        return JsonResponse({"error": "Username and password are required"}, status=400)

    if role not in allowed_roles:
        return JsonResponse({"error": "Invalid role"}, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse({"error": "Username already exists"}, status=400)

    user = User.objects.create_user(username=username, password=password)
    user.role = role

    if role == "admin":
        user.is_staff = True

    if is_superuser:
        user.is_staff = True
        user.is_superuser = True

    user.save()

    return JsonResponse({
        "success": True,
        "message": f"User '{username}' created successfully",
    })

def list_users_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    if not (request.user.is_superuser or getattr(request.user, "role", "") == "admin"):
        return JsonResponse({"error": "Only admin can view users"}, status=403)

    users = list(
        User.objects.values("id", "username", "role", "is_superuser", "is_staff")
    )

    return JsonResponse({"users": users})
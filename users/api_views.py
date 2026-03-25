from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
import json


@csrf_exempt
def login_api(request):
    if request.method == "POST":
        data = json.loads(request.body)
        username = data.get("username")
        password = data.get("password")

        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return JsonResponse({
                "success": True,
                "username": user.username,
                "role": getattr(user, "role", ""),
                "is_superuser": user.is_superuser
            })

        return JsonResponse({"success": False}, status=401)

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def logout_api(request):
    logout(request)
    return JsonResponse({"success": True})


# ✅ THIS IS THE IMPORTANT PART
def current_user(request):
    if request.user.is_authenticated:
        return JsonResponse({
            "username": request.user.username,
            "role": getattr(request.user, "role", ""),
        })
    return JsonResponse({"error": "Not authenticated"}, status=401)
from django.contrib.auth import authenticate, login, logout
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


# 🔐 LOGIN
@api_view(["POST"])
@permission_classes([AllowAny])
def login_api(request):
    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(request, username=username, password=password)

    if user is not None:
        login(request, user)
        return Response({
            "success": True,
            "username": user.username,
            "role": getattr(user, "role", None),
            "is_superuser": user.is_superuser,
        })
    else:
        return Response({
            "success": False,
            "error": "Invalid credentials"
        }, status=401)


# 🔓 LOGOUT
@api_view(["POST"])
def logout_api(request):
    logout(request)
    return Response({"success": True})


# 👤 CURRENT USER (VERY IMPORTANT FOR REACT)
@api_view(["GET"])
def current_user_api(request):
    if request.user.is_authenticated:
        return Response({
            "username": request.user.username,
            "role": getattr(request.user, "role", None),
            "is_superuser": request.user.is_superuser,
        })
    return Response({"detail": "Not authenticated"}, status=401)
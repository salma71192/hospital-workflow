# users/api_views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import ensure_csrf_cookie

@api_view(['POST'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def login_api(request):
    """
    Log in an existing user and return role + superuser status.
    """
    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        return Response({
            "success": True,
            "username": user.username,
            "role": getattr(user, "role", None),  # your custom role field
            "is_superuser": user.is_superuser,
        })
    return Response({"success": False, "error": "Invalid credentials"}, status=400)


@api_view(['POST'])
def logout_api(request):
    """
    Logout the current user
    """
    logout(request)
    return Response({"success": True})
from django.contrib.auth import authenticate, login, logout
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(["POST"])
def login_api(request):
    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(username=username, password=password)
    if user is not None:
        login(request, user)
        return Response({
            "success": True,
            "role": user.role,
            "is_superuser": user.is_superuser,
            "username": user.username,
        })
    return Response({"success": False}, status=401)


@api_view(["POST"])
def logout_api(request):
    logout(request)
    return Response({"success": True})


@api_view(["GET"])
def current_user_api(request):
    if request.user.is_authenticated:
        return Response({
            "username": request.user.username,
            "role": request.user.role,
            "is_superuser": request.user.is_superuser,
        })
    return Response({"username": None}, status=401)

from django.shortcuts import redirect, render
from django.contrib.auth import (
    login,
    logout,
    get_user_model,
)
from django.contrib.auth.decorators import (
    login_required,
    user_passes_test,
)
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_POST
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import IsAuthenticated

from .forms import UserCreateForm


SESSION_TIMEOUT_SECONDS = 20 * 60


def is_admin(user):
    return user.is_authenticated and (
        user.is_superuser or getattr(user, "role", None) == "admin"
    )


# ----------------------------
# Dashboard redirect
# ----------------------------
@login_required
def dashboard_redirect(request):
    user = request.user

    if user.is_superuser:
        return redirect("/admin-panel/")

    role_dashboards = {
        "reception": "reception_dashboard",
        "physiotherapist": "physio_dashboard",
        "callcenter": "callcenter_dashboard",
        "approvals": "approvals_dashboard",
        "rcm": "rcm_dashboard",
        "visitors": "visitors_dashboard",
        "admin": "/admin-panel/",
    }

    return redirect(role_dashboards.get(user.role, "/"))


# ----------------------------
# Create new user
# ----------------------------
@user_passes_test(is_admin)
def create_user(request):
    if request.method == "POST":
        form = UserCreateForm(request.POST)

        if form.is_valid():
            user = form.save(commit=False)
            user.set_password(form.cleaned_data["password"])

            if user.role == "admin":
                user.is_superuser = True
                user.is_staff = True
            else:
                user.is_superuser = False
                user.is_staff = False

            user.save()
            return redirect("dashboard_redirect")
    else:
        form = UserCreateForm()

    return render(request, "users/create_user.html", {"form": form})


# ----------------------------
# API: Current authenticated user
# ----------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user_api(request):
    """
    Return the current authenticated user's basic information.
    The frontend calls this endpoint when checking authentication.
    """
    user = request.user

    # Refresh the inactivity expiry on authenticated activity.
    request.session.set_expiry(SESSION_TIMEOUT_SECONDS)

    return JsonResponse(
        {
            "id": user.id,
            "username": user.get_username(),
            "role": getattr(user, "role", None),
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
        }
    )


# ----------------------------
# API: Logout
# ----------------------------
@api_view(["POST"])
def logout_api(request):
    """
    Log out the current session.
    """
    logout(request)
    return JsonResponse({"detail": "Logged out successfully."})


# ----------------------------
# API: Refresh session expiry
# ----------------------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def refresh_session_api(request):
    """
    Extend the Django session after authenticated activity.
    """
    request.session.set_expiry(SESSION_TIMEOUT_SECONDS)

    return JsonResponse(
        {
            "detail": "Session refreshed.",
            "expires_in": SESSION_TIMEOUT_SECONDS,
        }
    )

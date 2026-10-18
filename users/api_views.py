import json
from django.contrib.auth import (
    authenticate,
    login,
    logout,
    update_session_auth_hash,
)
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.authtoken.models import Token
from .models import User
ALLOWED_ROLES = [
    "admin",
    "approvals",
    "physio",
    "reception",
    "reception_supervisor",
    "visitor",
    "visitor_ceo",
    "doctor",
    "rcm",
    "callcenter",
    "callcenter_supervisor",
]
def is_admin_user(user):
    return (
        user.is_authenticated
        and (
            user.is_superuser
            or getattr(user, "role", "") == "admin"
        )
    )
def parse_json_body(request):
    try:
        data = json.loads(request.body or b"{}")
        if not isinstance(data, dict):
            return None, JsonResponse(
                {"error": "JSON body must be an object"},
                status=400,
            )
        return data, None
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None, JsonResponse(
            {"error": "Invalid JSON"},
            status=400,
        )
def admin_error_response(request, action):
    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "Not authenticated"},
            status=401,
        )
    if not is_admin_user(request.user):
        return JsonResponse(
            {"error": f"Only admin can {action}"},
            status=403,
        )
    return None
def is_last_active_superuser(user):
    if not user.is_superuser or not user.is_active:
        return False
    return not User.objects.filter(
        is_superuser=True,
        is_active=True,
    ).exclude(id=user.id).exists()
@csrf_exempt
def login_api(request):
    if request.method != "POST":
        return JsonResponse(
            {"error": "Method not allowed"},
            status=405,
        )
    data, error = parse_json_body(request)
    if error:
        return error
    username = data.get("username")
    password = data.get("password")
    if (
        not isinstance(username, str)
        or not username.strip()
        or not isinstance(password, str)
        or not password
    ):
        return JsonResponse(
            {"error": "Username and password are required"},
            status=400,
        )
    user = authenticate(
        request,
        username=username.strip(),
        password=password,
    )
    if user is None:
        return JsonResponse(
            {"error": "Invalid username or password"},
            status=401,
        )
    if not user.is_active:
        return JsonResponse(
            {"error": "This account is inactive"},
            status=403,
        )
    # Retain Django session authentication for the Django admin panel.
    login(request, user)
    # Generate or retrieve the API token used by the React frontend.
    token, _ = Token.objects.get_or_create(user=user)
    return JsonResponse({
        "success": True,
        "token": token.key,
        "user": {
            "id": user.id,
            "username": user.username,
            "role": getattr(user, "role", ""),
            "is_superuser": user.is_superuser,
            "is_staff": user.is_staff,
            "is_active": user.is_active,
        },
        # Keep these top-level fields for compatibility with the frontend.
        "id": user.id,
        "username": user.username,
        "role": getattr(user, "role", ""),
        "is_superuser": user.is_superuser,
        "is_staff": user.is_staff,
        "is_active": user.is_active,
    })
@csrf_exempt
def logout_api(request):
    if request.method != "POST":
        return JsonResponse(
            {"error": "Method not allowed"},
            status=405,
        )
    # Log out the Django session.
    logout(request)
    # The frontend should also remove its sessionStorage authToken.
    return JsonResponse({"success": True})
def current_user_api(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "Not authenticated"},
            status=401,
        )
    return JsonResponse({
        "id": request.user.id,
        "username": request.user.username,
        "role": getattr(request.user, "role", ""),
        "is_superuser": request.user.is_superuser,
        "is_staff": request.user.is_staff,
        "is_active": request.user.is_active,
    })
@csrf_exempt
def create_user_api(request):
    if request.method != "POST":
        return JsonResponse(
            {"error": "Method not allowed"},
            status=405,
        )
    permission_error = admin_error_response(
        request,
        "create users",
    )
    if permission_error:
        return permission_error
    data, error = parse_json_body(request)
    if error:
        return error
    username = data.get("username")
    password = data.get("password")
    role = data.get("role")
    is_superuser = data.get("is_superuser", False)
    if not isinstance(username, str) or not username.strip():
        return JsonResponse(
            {"error": "Username is required"},
            status=400,
        )
    if not isinstance(password, str) or not password:
        return JsonResponse(
            {"error": "Password is required"},
            status=400,
        )
    username = username.strip()
    if role not in ALLOWED_ROLES:
        return JsonResponse(
            {"error": "Invalid role"},
            status=400,
        )
    if not isinstance(is_superuser, bool):
        return JsonResponse(
            {"error": "is_superuser must be true or false"},
            status=400,
        )
    if User.objects.filter(username=username).exists():
        return JsonResponse(
            {"error": "Username already exists"},
            status=400,
        )
    user = User.objects.create_user(
        username=username,
        password=password,
    )
    user.role = role
    user.is_superuser = is_superuser
    user.is_staff = is_superuser or role == "admin"
    user.is_active = True
    user.save()
    return JsonResponse({
        "success": True,
        "message": f"User '{username}' created successfully",
    })
def list_users_api(request):
    permission_error = admin_error_response(
        request,
        "view users",
    )
    if permission_error:
        return permission_error
    users = list(
        User.objects.values(
            "id",
            "username",
            "role",
            "is_superuser",
            "is_staff",
            "is_active",
        ).order_by("username")
    )
    return JsonResponse({"users": users})
@csrf_exempt
def update_user_api(request, user_id):
    if request.method != "PUT":
        return JsonResponse(
            {"error": "Method not allowed"},
            status=405,
        )
    permission_error = admin_error_response(
        request,
        "update users",
    )
    if permission_error:
        return permission_error
    try:
        target_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse(
            {"error": "User not found"},
            status=404,
        )
    data, error = parse_json_body(request)
    if error:
        return error
    new_username = data.get("username", target_user.username)
    if not isinstance(new_username, str) or not new_username.strip():
        return JsonResponse(
            {"error": "Username is required"},
            status=400,
        )
    new_username = new_username.strip()
    if (
        User.objects.filter(username=new_username)
        .exclude(id=target_user.id)
        .exists()
    ):
        return JsonResponse(
            {"error": "Username already exists"},
            status=400,
        )
    new_role = data.get("role", target_user.role)
    new_is_superuser = data.get(
        "is_superuser",
        target_user.is_superuser,
    )
    if new_role not in ALLOWED_ROLES:
        return JsonResponse(
            {"error": "Invalid role"},
            status=400,
        )
    if not isinstance(new_is_superuser, bool):
        return JsonResponse(
            {"error": "is_superuser must be true or false"},
            status=400,
        )
    if target_user.is_superuser and not new_is_superuser:
        if is_last_active_superuser(target_user):
            return JsonResponse(
                {
                    "error": (
                        "Cannot remove superuser status from the "
                        "last active superuser."
                    )
                },
                status=400,
            )
    target_user.username = new_username
    target_user.role = new_role
    target_user.is_superuser = new_is_superuser
    target_user.is_staff = (
        new_is_superuser or new_role == "admin"
    )
    target_user.save()
    return JsonResponse({
        "success": True,
        "message": (
            f"User '{target_user.username}' updated successfully"
        ),
        "username": target_user.username,
    })
@csrf_exempt
def delete_user_api(request, user_id):
    """
    Deactivate the account instead of deleting its database record.
    This preserves historical data linked to the user.
    """
    if request.method != "DELETE":
        return JsonResponse(
            {"error": "Method not allowed"},
            status=405,
        )
    permission_error = admin_error_response(
        request,
        "deactivate users",
    )
    if permission_error:
        return permission_error
    try:
        target_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse(
            {"error": "User not found"},
            status=404,
        )
    if target_user.id == request.user.id:
        return JsonResponse(
            {"error": "You cannot deactivate your own account"},
            status=400,
        )
    if not target_user.is_active:
        return JsonResponse({
            "success": True,
            "is_active": False,
            "message": (
                f"User '{target_user.username}' is already inactive."
            ),
        })
    if is_last_active_superuser(target_user):
        return JsonResponse(
            {
                "error": (
                    "Cannot deactivate the last active superuser."
                )
            },
            status=400,
        )
    username = target_user.username
    target_user.is_active = False
    target_user.save(update_fields=["is_active"])
    # Revoke this user's API token so the deactivated account
    # cannot continue making authenticated API requests.
    Token.objects.filter(user=target_user).delete()
    return JsonResponse({
        "success": True,
        "is_active": False,
        "message": (
            f"User '{username}' has been deactivated. "
            "Existing records have been preserved."
        ),
    })
@csrf_exempt
def set_user_active_api(request, user_id):
    """
    Activate or deactivate an account using:
    POST {"is_active": true} or POST {"is_active": false}
    """
    if request.method != "POST":
        return JsonResponse(
            {"error": "Method not allowed"},
            status=405,
        )
    permission_error = admin_error_response(
        request,
        "change account status",
    )
    if permission_error:
        return permission_error
    try:
        target_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse(
            {"error": "User not found"},
            status=404,
        )
    data, error = parse_json_body(request)
    if error:
        return error
    is_active = data.get("is_active")
    if not isinstance(is_active, bool):
        return JsonResponse(
            {"error": "is_active must be true or false"},
            status=400,
        )
    if target_user.id == request.user.id and not is_active:
        return JsonResponse(
            {"error": "You cannot deactivate your own account"},
            status=400,
        )
    if (
        target_user.is_active
        and not is_active
        and is_last_active_superuser(target_user)
    ):
        return JsonResponse(
            {
                "error": (
                    "Cannot deactivate the last active superuser."
                )
            },
            status=400,
        )
    target_user.is_active = is_active
    target_user.save(update_fields=["is_active"])
    if not is_active:
        Token.objects.filter(user=target_user).delete()
    action = "activated" if is_active else "deactivated"
    return JsonResponse({
        "success": True,
        "is_active": target_user.is_active,
        "message": (
            f"User '{target_user.username}' {action} successfully."
        ),
    })
@csrf_exempt
def change_user_password_api(request, user_id):
    """
    Admin resets another user's password without needing the old one.
    The new password is securely hashed by Django.
    """
    if request.method != "POST":
        return JsonResponse(
            {"error": "Method not allowed"},
            status=405,
        )
    permission_error = admin_error_response(
        request,
        "change user passwords",
    )
    if permission_error:
        return permission_error
    try:
        target_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse(
            {"error": "User not found"},
            status=404,
        )
    data, error = parse_json_body(request)
    if error:
        return error
    new_password = data.get("new_password")
    if not isinstance(new_password, str) or not new_password.strip():
        return JsonResponse(
            {"error": "A new password is required"},
            status=400,
        )
    try:
        validate_password(new_password, user=target_user)
    except ValidationError as exc:
        return JsonResponse(
            {"error": " ".join(exc.messages)},
            status=400,
        )
    target_user.set_password(new_password)
    target_user.save(update_fields=["password"])
    # Invalidate the user's existing API token after a password reset.
    Token.objects.filter(user=target_user).delete()
    return JsonResponse({
        "success": True,
        "message": (
            f"Password updated for '{target_user.username}'."
        ),
    })
@csrf_exempt
def change_my_password_api(request):
    """
    Allows a signed-in user to change their own password.
    Requires current_password, new_password, and confirm_password.
    Keeps the user logged in after a successful change.
    """
    if request.method != "POST":
        return JsonResponse(
            {"error": "Method not allowed"},
            status=405,
        )
    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "Not authenticated"},
            status=401,
        )
    data, error = parse_json_body(request)
    if error:
        return error
    current_password = data.get("current_password")
    new_password = data.get("new_password")
    confirm_password = data.get("confirm_password")
    if not all(
        isinstance(value, str) and value
        for value in (
            current_password,
            new_password,
            confirm_password,
        )
    ):
        return JsonResponse(
            {
                "error": (
                    "Current password, new password, and "
                    "password confirmation are required."
                )
            },
            status=400,
        )
    if not request.user.check_password(current_password):
        return JsonResponse(
            {"error": "Current password is incorrect."},
            status=400,
        )
    if new_password != confirm_password:
        return JsonResponse(
            {"error": "New password and confirmation do not match."},
            status=400,
        )
    if current_password == new_password:
        return JsonResponse(
            {
                "error": (
                    "Your new password must be different from "
                    "your current password."
                )
            },
            status=400,
        )
    try:
        validate_password(new_password, user=request.user)
    except ValidationError as exc:
        return JsonResponse(
            {"error": " ".join(exc.messages)},
            status=400,
        )
    request.user.set_password(new_password)
    request.user.save(update_fields=["password"])
    # Keep the Django session authenticated.
    update_session_auth_hash(request, request.user)
    # Invalidate the old API token and create a replacement.
    Token.objects.filter(user=request.user).delete()
    token, _ = Token.objects.get_or_create(user=request.user)
    return JsonResponse({
        "success": True,
        "message": "Your password has been changed successfully.",
        "token": token.key,
    })
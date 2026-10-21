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
    return bool(
        user
        and user.is_authenticated
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
def get_authenticated_user(request):
    """
    Return the user authenticated by the existing Django session
    or by a valid DRF Token in the Authorization header.
    """
    request_user = getattr(request, "user", None)
    if request_user and request_user.is_authenticated:
        return request_user
    authorization = request.headers.get("Authorization", "")
    parts = authorization.split()
    if len(parts) == 2 and parts[0].lower() == "token":
        try:
            token = Token.objects.select_related("user").get(
                key=parts[1]
            )
        except Token.DoesNotExist:
            return None
        if token.user.is_active:
            return token.user
    return None
def admin_error_response(request, action):
    user = get_authenticated_user(request)
    if user is None:
        return JsonResponse(
            {"error": "Not authenticated"},
            status=401,
        )
    if not user.is_active:
        return JsonResponse(
            {"error": "This account is inactive"},
            status=403,
        )
    if not is_admin_user(user):
        return JsonResponse(
            {"error": f"Only admin can {action}"},
            status=403,
        )
    request.user = user
    return None
def is_last_active_superuser(user):
    if not user.is_superuser or not user.is_active:
        return False
    return not User.objects.filter(
        is_superuser=True,
        is_active=True,
    ).exclude(id=user.id).exists()
def get_user_data(user):
    """
    Return a consistent user representation for the frontend.
    """
    display_name = (
        getattr(user, "display_name", "") or
        getattr(user, "name", "") or
        getattr(user, "full_name", "") or
        user.username
    )
    return {
        "id": user.id,
        "username": user.username,
        "display_name": display_name,
        "role": getattr(user, "role", ""),
        "is_superuser": user.is_superuser,
        "is_staff": user.is_staff,
        "is_active": user.is_active,
    }
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
    login(request, user)
    token, _ = Token.objects.get_or_create(user=user)
    user_data = get_user_data(user)
    return JsonResponse({
        "success": True,
        "token": token.key,
        "user": user_data,
        **user_data,
    })
@csrf_exempt
def logout_api(request):
    if request.method != "POST":
        return JsonResponse(
            {"error": "Method not allowed"},
            status=405,
        )
    logout(request)
    return JsonResponse({"success": True})
def current_user_api(request):
    user = get_authenticated_user(request)
    if user is None:
        return JsonResponse(
            {"error": "Not authenticated"},
            status=401,
        )
    if not user.is_active:
        return JsonResponse(
            {"error": "This account is inactive"},
            status=403,
        )
    return JsonResponse(get_user_data(user))
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
    display_name = data.get("display_name", "")
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
    if not isinstance(display_name, str):
        return JsonResponse(
            {"error": "Display name must be text"},
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
    # Save a separate display name when supported by the model.
    if hasattr(user, "display_name"):
        user.display_name = display_name.strip() or username
    elif hasattr(user, "name"):
        user.name = display_name.strip() or username
    user.save()
    return JsonResponse({
        "success": True,
        "message": f"User '{username}' created successfully",
        "user": get_user_data(user),
    }, status=201)
def list_users_api(request):
    permission_error = admin_error_response(
        request,
        "view users",
    )
    if permission_error:
        return permission_error
    users = User.objects.all().order_by("username")
    return JsonResponse({
        "users": [
            get_user_data(user)
            for user in users
        ]
    })
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
    # Username is optional in partial updates.
    new_username = data.get(
        "username",
        target_user.username,
    )
    if (
        not isinstance(new_username, str)
        or not new_username.strip()
    ):
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
    new_is_active = data.get(
        "is_active",
        target_user.is_active,
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
    if not isinstance(new_is_active, bool):
        return JsonResponse(
            {"error": "is_active must be true or false"},
            status=400,
        )
    if (
        target_user.is_superuser
        and not new_is_superuser
        and is_last_active_superuser(target_user)
    ):
        return JsonResponse(
            {
                "error": (
                    "Cannot remove superuser status from the "
                    "last active superuser."
                )
            },
            status=400,
        )
    if (
        target_user.is_active
        and not new_is_active
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
    display_name = data.get("display_name", None)
    if display_name is not None and not isinstance(
        display_name,
        str,
    ):
        return JsonResponse(
            {"error": "Display name must be text"},
            status=400,
        )
    target_user.username = new_username
    target_user.role = new_role
    target_user.is_superuser = new_is_superuser
    target_user.is_staff = (
        new_is_superuser or new_role == "admin"
    )
    target_user.is_active = new_is_active
    if display_name is not None:
        cleaned_name = display_name.strip() or new_username
        if hasattr(target_user, "display_name"):
            target_user.display_name = cleaned_name
        elif hasattr(target_user, "name"):
            target_user.name = cleaned_name
    target_user.save()
    # Invalidate API tokens when an account is deactivated.
    if not target_user.is_active:
        Token.objects.filter(user=target_user).delete()
    return JsonResponse({
        "success": True,
        "message": (
            f"User '{target_user.username}' updated successfully"
        ),
        "user": get_user_data(target_user),
        **get_user_data(target_user),
    })
@csrf_exempt
def delete_user_api(request, user_id):
    """
    Deactivate the account rather than deleting the database record.
    Historical records linked to the user are preserved.
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
    # Revoke API access without deleting the user's records.
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
    if (
        not isinstance(new_password, str)
        or not new_password.strip()
    ):
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
    Authentication accepts the existing middleware or a DRF Token.
    """
    if request.method != "POST":
        return JsonResponse(
            {"error": "Method not allowed"},
            status=405,
        )
    user = get_authenticated_user(request)
    if user is None:
        return JsonResponse(
            {"error": "Not authenticated"},
            status=401,
        )
    if not user.is_active:
        return JsonResponse(
            {"error": "This account is inactive"},
            status=403,
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
    if not user.check_password(current_password):
        return JsonResponse(
            {"error": "Current password is incorrect."},
            status=400,
        )
    if new_password != confirm_password:
        return JsonResponse(
            {
                "error": (
                    "New password and confirmation do not match."
                )
            },
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
        validate_password(new_password, user=user)
    except ValidationError as exc:
        return JsonResponse(
            {"error": " ".join(exc.messages)},
            status=400,
        )
    user.set_password(new_password)
    user.save(update_fields=["password"])
    # Keep the Django session authenticated.
    update_session_auth_hash(request, user)
    # Replace the API token. The frontend must save this new token.
    Token.objects.filter(user=user).delete()
    token = Token.objects.create(user=user)
    return JsonResponse({
        "success": True,
        "message": "Your password has been changed successfully.",
        "token": token.key,
    })
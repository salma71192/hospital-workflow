
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

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
        return json.loads(request.body), None
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

    if not username or not password:
        return JsonResponse(
            {"error": "Username and password are required"},
            status=400,
        )

    user = authenticate(
        request,
        username=username,
        password=password,
    )

    if user is None:
        return JsonResponse(
            {"error": "Invalid username or password"},
            status=401,
        )

    login(request, user)

    return JsonResponse({
        "success": True,
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

    logout(request)
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

    permission_error = admin_error_response(request, "create users")
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
        return JsonResponse({"error": "Invalid role"}, status=400)

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
    permission_error = admin_error_response(request, "view users")
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

    permission_error = admin_error_response(request, "update users")
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
        return JsonResponse({"error": "Invalid role"}, status=400)

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
    Legacy endpoint: deactivate the account instead of deleting
    the database record, to help preserve linked historical data.
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
    Admin sets a new password without needing the old password.
    Django stores the password using its configured password hasher.
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

    if not isinstance(new_password, str) or not new_password:
        return JsonResponse(
            {"error": "A new password is required"},
            status=400,
        )

    try:
        validate_password(new_password, user=target_user)
    except ValidationError as error:
        return JsonResponse(
            {"error": " ".join(error.messages)},
            status=400,
        )

    target_user.set_password(new_password)
    target_user.save(update_fields=["password"])

    return JsonResponse({
        "success": True,
        "message": (
            f"Password updated for '{target_user.username}'."
        ),
    })

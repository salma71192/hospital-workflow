
from django.urls import path

from .api_views import (
    login_api,
    logout_api,
    current_user_api,
    create_user_api,
    list_users_api,
    update_user_api,
    delete_user_api,
    set_user_active_api,
    change_user_password_api,
)


urlpatterns = [
    path("login/", login_api, name="login_api"),
    path("logout/", logout_api, name="logout_api"),
    path("me/", current_user_api, name="current_user_api"),

    # User management
    path("create-user/", create_user_api, name="create_user_api"),
    path("list-users/", list_users_api, name="list_users_api"),
    path(
        "update-user/<int:user_id>/",
        update_user_api,
        name="update_user_api",
    ),
    path(
        "delete-user/<int:user_id>/",
        delete_user_api,
        name="delete_user_api",
    ),

    # Activate or deactivate user accounts
    path(
        "set-active/<int:user_id>/",
        set_user_active_api,
        name="set_user_active_api",
    ),

    # Reset a user's password
    path(
        "change-password/<int:user_id>/",
        change_user_password_api,
        name="change_user_password_api",
    ),
]

from django.urls import path
from .api_views import (
    login_api,
    logout_api,
    current_user_api,
    create_user_api,
    list_users_api,
)

urlpatterns = [
    path("login/", login_api, name="login_api"),
    path("logout/", logout_api, name="logout_api"),
    path("me/", current_user_api, name="current_user_api"),
    path("create-user/", create_user_api, name="create_user_api"),
    path("list-users/", list_users_api, name="list_users_api"),
]
from django.urls import path
from . import api_views

urlpatterns = [
    path("login/", api_views.login_api),
    path("logout/", api_views.logout_api),
    path("me/", api_views.current_user_api),
]
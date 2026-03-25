# users/api_urls.py
from django.urls import path
from . import api_views

urlpatterns = [
    path("login/", api_views.login_api, name="login_api"),
    path("logout/", api_views.logout_api, name="logout_api"),
]
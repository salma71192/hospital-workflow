# users/api_urls.py
from django.urls import path
from .api_views import login_api, logout_api

urlpatterns = [
    path("login/", login_api),
    path("logout/", logout_api),
]
from django.urls import path
from .api_views import therapists_api, assignments_api

urlpatterns = [
    path("therapists/", therapists_api, name="therapists_api"),
    path("assignments/", assignments_api, name="assignments_api"),
]
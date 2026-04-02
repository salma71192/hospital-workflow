from django.urls import path
from .api_views import therapists_api, assignments_api, staff_filters_api

urlpatterns = [
    path("therapists/", therapists_api, name="therapists_api"),
    path("assignments/", assignments_api, name="assignments_api"),
    path("assignments/<int:assignment_id>/", assignments_api, name="assignment_detail_api"),
    path("staff-filters/", staff_filters_api, name="staff_filters_api"),
]
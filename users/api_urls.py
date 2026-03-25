from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Admin panel
    path("admin/", admin.site.urls),

    # API endpoints
    path("api/users/", include("users.api_urls")),       # User login/logout etc.
    path("api/patients/", include("patients.api_urls")), # Patient-related API
]
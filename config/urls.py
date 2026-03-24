from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.shortcuts import redirect

urlpatterns = [
    # Admin panel
    path("admin-panel/", admin.site.urls),

    # API endpoints
    path("api/users/", include("users.api_urls")),       # login/logout API
    path("api/patients/", include("patients.api_urls")),
    # Add other API urls here if needed

    # Redirect old Django dashboard URL to React login
    path("dashboard/", lambda request: redirect("/")),

    # React frontend routes (serve index.html for all React pages)
    path("", TemplateView.as_view(template_name="index.html")),  # Root -> React login
    re_path(
        r"^(reception|physio|callcenter|approvals|rcm|visitors)/.*$",
        TemplateView.as_view(template_name="index.html"),
    ),
]
# config/urls.py
from django.contrib import admin
from django.urls import path, re_path, include
from django.views.generic import TemplateView

urlpatterns = [
    # Admin
    path("admin-panel/", admin.site.urls),

    # API endpoints
    path("api/users/", include("users.api_urls")),
    path("api/patients/", include("patients.api_urls")),

    # React frontend catch-all routes
    path("", TemplateView.as_view(template_name="index.html")),  # root
    re_path(r"^(reception|physio|callcenter|approvals|rcm|visitors)/.*$", 
            TemplateView.as_view(template_name="index.html")),  # all React routes
]
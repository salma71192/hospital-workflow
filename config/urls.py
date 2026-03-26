from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView

urlpatterns = [
    # Admin
    path("admin-panel/", admin.site.urls),

    # API
    path("api/users/", include("users.api_urls")),
    path("api/patients/", include("patients.api_urls")),

    # React
    path("", TemplateView.as_view(template_name="index.html")),
    re_path(
        r"^(reception|physio|callcenter|approvals|rcm|visitors)/.*$",
        TemplateView.as_view(template_name="index.html"),
    ),
]
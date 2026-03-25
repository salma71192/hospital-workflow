from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView

urlpatterns = [
    # -----------------------
    # Admin panel
    # -----------------------
    path("admin/", admin.site.urls),

    # -----------------------
    # API routes
    # -----------------------
    path("api/users/", include("users.api_urls")),       # login/logout, user APIs
    path("api/patients/", include("patients.api_urls")), # patient APIs
    # Add more apps here if needed
    # path("api/other_app/", include("other_app.api_urls")),

    # -----------------------
    # React frontend SPA
    # -----------------------
    # Serve React index.html at root
    path("", TemplateView.as_view(template_name="index.html"), name="react-index"),

    # Catch-all React routes for SPA paths
    re_path(
        r"^(reception|physio|callcenter|approvals|rcm|visitors)/.*$",
        TemplateView.as_view(template_name="index.html"),
        name="react-spa"
    ),
]
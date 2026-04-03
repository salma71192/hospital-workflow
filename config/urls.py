from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def home(request):
    return JsonResponse({"message": "API running"})


urlpatterns = [
    path("admin-panel/", admin.site.urls),
    path("api/users/", include("users.api_urls")),
    path("api/patients/", include("patients.api_urls")),
    path("api/reception/", include("reception.api_urls")),
    path("api/approvals/", include("approvals.api_urls")),
    path("", home),
]
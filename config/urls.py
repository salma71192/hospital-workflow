
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

from reception.api_views import physio_leaderboard_monthly_api


def home(request):
    return JsonResponse({"message": "API running"})


urlpatterns = [
    # Django admin panel
    path("admin-panel/", admin.site.urls),

    # Application APIs
    path("api/users/", include("users.api_urls")),
    path("api/patients/", include("patients.api_urls")),
    path("api/reception/", include("reception.api_urls")),
    path("api/approvals/", include("approvals.api_urls")),
    path("api/callcenter/", include("callcenter.urls")),

    # Monthly physiotherapy leaderboard
    path(
        "api/physio/leaderboard/monthly/",
        physio_leaderboard_monthly_api,
        name="physio_leaderboard_monthly",
    ),

    # API root
    path("", home),
]

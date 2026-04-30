from django.urls import path
from . import views

urlpatterns = [
    path("dashboard/", views.dashboard),
    path("my-stats/", views.my_registration_stats_api),
    path("leaderboard/", views.leaderboard_api),
]
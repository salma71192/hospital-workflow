from django.urls import path
from .api_views import patients_api

urlpatterns = [
    path("", patients_api, name="patients_api"),
]
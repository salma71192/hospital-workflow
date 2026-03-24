from django.urls import path
from .api_views import create_patient_api

urlpatterns = [
    path('create/', create_patient_api),
]
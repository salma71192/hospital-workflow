from django.urls import path
from .api_views import (
    patients_api,
    patient_detail_api,
    patient_tracker_api,
)

urlpatterns = [
    path("", patients_api, name="patients_api"),
    path("tracker/", patient_tracker_api, name="patient_tracker_api"),
    path("<int:patient_id>/", patient_detail_api, name="patient_detail_api"),
]
from django.urls import path
from .api_views import update_visit_speciality_api
from .api_views import (
    patients_api,
    patient_detail_api,
    patient_tracker_api,
    update_visit_speciality_api,
)


urlpatterns = [
    # Patient list and creation
    path(
        "",
        patients_api,
        name="patients_api",
    ),

    # Patient tracker
    path(
        "tracker/",
        patient_tracker_api,
        name="patient_tracker_api",
    ),

    # Add, update, or remove specialty for an individual visit
    path(
        "<int:patient_id>/visits/<int:assignment_id>/speciality/",
        update_visit_speciality_api,
        name="update_visit_speciality_api",
    ),

    # Patient details
    path(
        "<int:patient_id>/",
        patient_detail_api,
        name="patient_detail_api",
    ),
]
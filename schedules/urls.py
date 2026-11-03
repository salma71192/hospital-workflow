
from django.urls import path

from . import views


urlpatterns = [
    path(
        "my/",
        views.my_schedule_api,
        name="my_schedule",
    ),
    path(
        "therapists/",
        views.schedule_therapists_api,
        name="schedule_therapists",
    ),
    path(
        "patients/",
        views.schedule_patient_search_api,
        name="schedule_patient_search",
    ),
    path(
        "extract/",
        views.extract_schedule_api,
        name="extract_schedule",
    ),
    path(
        "save/",
        views.save_schedule_api,
        name="save_schedule",
    ),
    path(
        "",
        views.schedule_list_api,
        name="schedule_list",
    ),
]

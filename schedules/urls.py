
from django.urls import path
from . import views

app_name = "schedules"

urlpatterns = [
    path("therapists/", views.schedule_therapists_api, name="therapists"),
    path("list/", views.schedule_list_api, name="schedule-list"),
    path("my/", views.my_schedule_api, name="my-schedule"),
    path("patients/", views.schedule_patient_search_api, name="patient-search"),
    path("save/", views.save_schedule_api, name="save-schedule"),
    path("extract/", views.extract_schedule_api, name="extract-schedule"),
    path("appointments/", views.schedule_appointment_create_api, name="appointment-create"),
    path("appointments/<int:appointment_id>/", views.schedule_appointment_detail_api, name="appointment-detail"),
    path("appointments/<int:appointment_id>/history/", views.schedule_appointment_history_api, name="appointment-history"),
    path("alerts/", views.schedule_alerts_api, name="schedule-alerts"),
    path("alerts/<int:appointment_id>/call-attempt/", views.schedule_call_attempt_api, name="schedule-call-attempt"),
]

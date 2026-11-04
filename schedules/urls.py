
from django.urls import path

from . import views


app_name = "schedules"


urlpatterns = [
    # =====================================================
    # THERAPIST DIRECTORY
    # =====================================================

    path(
        "therapists/",
        views.schedule_therapists_api,
        name="therapists",
    ),

    # =====================================================
    # CALL CENTER DAILY SCHEDULE
    # =====================================================

    path(
        "list/",
        views.schedule_list_api,
        name="schedule-list",
    ),

    # =====================================================
    # PHYSIOTHERAPIST'S OWN SCHEDULE
    # =====================================================

    path(
        "my/",
        views.my_schedule_api,
        name="my-schedule",
    ),

    # =====================================================
    # PATIENT SEARCH
    # =====================================================

    path(
        "patients/",
        views.schedule_patient_search_api,
        name="patient-search",
    ),

    # =====================================================
    # LEGACY DAILY SCHEDULE PUBLISHING
    # =====================================================

    path(
        "save/",
        views.save_schedule_api,
        name="save-schedule",
    ),

    # =====================================================
    # EXCEL SCHEDULE IMPORT
    # =====================================================

    path(
        "extract/",
        views.extract_schedule_api,
        name="extract-schedule",
    ),

    # =====================================================
    # CREATE AN INDIVIDUAL APPOINTMENT
    # =====================================================

    path(
        "appointments/",
        views.schedule_appointment_create_api,
        name="appointment-create",
    ),

    # =====================================================
    # VIEW OR EDIT AN APPOINTMENT
    # =====================================================

    path(
        "appointments/<int:appointment_id>/",
        views.schedule_appointment_detail_api,
        name="appointment-detail",
    ),

    # =====================================================
    # PERMANENT APPOINTMENT CHANGE HISTORY
    # =====================================================

    path(
        "appointments/<int:appointment_id>/history/",
        views.schedule_appointment_history_api,
        name="appointment-history",
    ),

    # =====================================================
    # INTERNAL CALL CENTER ALERTS
    # =====================================================

    path(
        "alerts/",
        views.schedule_alerts_api,
        name="schedule-alerts",
    ),

    # =====================================================
    # RECORD A FOLLOW-UP CALL ATTEMPT
    # =====================================================

    path(
        "alerts/<int:appointment_id>/call-attempt/",
        views.schedule_call_attempt_api,
        name="schedule-call-attempt",
    ),
]

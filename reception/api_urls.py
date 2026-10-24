
from django.urls import path

from .api_views import (
    last_therapist_api,
    therapists_api,
    assignments_api,
    staff_filters_api,
    physio_tracker_api,
    follow_up_required_api,
    leaderboard_api,
    evaluation_tracker_api,
)

from .physician_api import (
    list_physicians_api,
    create_physician_api,
)


urlpatterns = [
    # Therapists
    path(
        "therapists/",
        therapists_api,
        name="therapists_api",
    ),

    # Patient assignments
    path(
        "assignments/",
        assignments_api,
        name="assignments_api",
    ),
    path(
        "assignments/<int:assignment_id>/",
        assignments_api,
        name="assignment_detail_api",
    ),

    # Staff filters
    path(
        "staff-filters/",
        staff_filters_api,
        name="staff_filters_api",
    ),

    # Physiotherapy tracker
    path(
        "physio-tracker/",
        physio_tracker_api,
        name="physio_tracker_api",
    ),

    # Follow-up required
    path(
        "follow-up-required/",
        follow_up_required_api,
        name="follow_up_required_api",
    ),

    # Last therapist
    path(
        "last-therapist/<int:patient_id>/",
        last_therapist_api,
        name="last_therapist_api",
    ),

    # Leaderboard
    path(
        "leaderboard/",
        leaderboard_api,
        name="leaderboard_api",
    ),

    # Evaluation tracker
    path(
        "evaluation-tracker/",
        evaluation_tracker_api,
        name="evaluation_tracker_api",
    ),

    # Referring physicians
    path(
        "physicians/",
        list_physicians_api,
        name="list_physicians_api",
    ),
    path(
        "physicians/create/",
        create_physician_api,
        name="create_physician_api",
    ),
]

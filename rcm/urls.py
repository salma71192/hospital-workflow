
from django.urls import path
from . import views

urlpatterns = [
    # RCM Claims
    path(
        "claims/",
        views.claims_list_create,
        name="rcm-claims",
    ),
    path(
        "claims/<int:claim_pk>/",
        views.claim_detail,
        name="rcm-claim-detail",
    ),

    # Renewal Alerts
    path(
        "renewal-alerts/",
        views.renewal_alerts_list_create,
        name="rcm-renewal-alerts",
    ),
]

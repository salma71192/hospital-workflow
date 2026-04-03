from django.urls import path
from .api_views import (
    patient_approval_api,
    billing_codes_api,
    approvals_alerts_api,
    physio_alerts_api,
    approval_history_api,
)

urlpatterns = [
    path("patient-approval/<int:patient_id>/", patient_approval_api),
    path("billing-codes/", billing_codes_api),
    path("alerts/", approvals_alerts_api),
    path("physio-alerts/", physio_alerts_api),
    path("history/", approval_history_api),
]
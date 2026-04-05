from django.urls import path
from .api import (
    patient_approval_api,
    approvals_alerts_api,
    physio_alerts_api,
    billing_codes_api,
    approval_history_api,
    patient_approval_timeline_api,
    approval_alerts_list_api,
    create_approval_alert_api,
    resolve_approval_alert_api,
)

urlpatterns = [
    path("patient-approval/<int:patient_id>/", patient_approval_api),
    path("patient-approval-timeline/<int:patient_id>/", patient_approval_timeline_api),
    path("alerts/", approvals_alerts_api),
    path("physio-alerts/", physio_alerts_api),
    path("billing-codes/", billing_codes_api),
    path("history/", approval_history_api),
    path("alerts-list/", approval_alerts_list_api),
    path("alerts/create/<int:patient_id>/", create_approval_alert_api),
    path("alerts/<int:alert_id>/resolve/", resolve_approval_alert_api),
]
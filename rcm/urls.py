
from django.urls import path
from . import views


urlpatterns = [
    # -----------------------------------------------------
    # RCM Claims
    # GET: list claims
    # POST: create a claim
    # -----------------------------------------------------
    path(
        "claims/",
        views.claims_list_create,
        name="rcm-claims",
    ),

    # -----------------------------------------------------
    # Bulk Import Claims from Excel
    # POST: import multiple claims and approval details
    # -----------------------------------------------------
    path(
        "claims/bulk-import/",
        views.claims_bulk_import,
        name="rcm-claims-bulk-import",
    ),

    # -----------------------------------------------------
    # Claim Details
    # GET: retrieve one claim
    # PUT / PATCH: update a claim
    # DELETE: delete a claim if permitted
    # -----------------------------------------------------
    path(
        "claims/<int:claim_pk>/",
        views.claim_detail,
        name="rcm-claim-detail",
    ),

    # -----------------------------------------------------
    # History for a Specific Claim
    # GET: retrieve history for one claim
    # Example: /api/rcm/claims/28/history/
    # -----------------------------------------------------
    path(
        "claims/<int:claim_pk>/history/",
        views.claim_history_list,
        name="rcm-claim-history-detail",
    ),

    # -----------------------------------------------------
    # General Claim History
    # GET: retrieve claim history
    # -----------------------------------------------------
    path(
        "claim-history/",
        views.claim_history_list,
        name="rcm-claim-history",
    ),

    # -----------------------------------------------------
    # Renewal Alerts
    # GET: list alerts
    # POST: create an alert
    # -----------------------------------------------------
    path(
        "renewal-alerts/",
        views.renewal_alerts_list_create,
        name="rcm-renewal-alerts",
    ),

    # -----------------------------------------------------
    # Approve Renewal Alert
    # POST: approve the linked claim and record claim history
    # Example: /api/rcm/renewal-alerts/12/approve/
    # -----------------------------------------------------
    path(
        "renewal-alerts/<int:alert_pk>/approve/",
        views.approve_renewal_alert,
        name="rcm-renewal-alert-approve",
    ),

    # -----------------------------------------------------
    # Renewal Alert Details
    # GET: retrieve one alert
    # PUT / PATCH: edit an eligible alert
    # DELETE: delete an eligible alert
    # -----------------------------------------------------
    path(
        "renewal-alerts/<int:alert_pk>/",
        views.renewal_alert_detail,
        name="rcm-renewal-alert-detail",
    ),
]

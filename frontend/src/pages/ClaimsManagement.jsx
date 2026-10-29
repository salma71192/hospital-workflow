import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/api";

import CreateClaim from "../components/rcm/CreateClaim";
import ClaimHistory from "../components/rcm/ClaimHistory";
import RenewalAlerts from "../components/rcm/RenewalAlerts";

const styles = `
.claim-management{min-height:100%;padding:28px;background:#f3f6fc;color:#172b4d;font-family:Arial,Helvetica,sans-serif;box-sizing:border-box;font-size:15px}
.claim-management *{box-sizing:border-box}
.claim-management-header{position:relative;overflow:hidden;padding:30px 32px;margin-bottom:24px;border-radius:19px;color:#fff;background:linear-gradient(120deg,#142b4c 0%,#234b83 58%,#405ed0 100%);box-shadow:0 10px 28px rgba(28,52,100,.16)}
.claim-management-header:after{content:"";position:absolute;width:260px;height:260px;right:-75px;top:-135px;border:35px solid rgba(255,255,255,.07);border-radius:50%;pointer-events:none}
.claim-management-header:before{content:"";position:absolute;width:180px;height:180px;right:95px;bottom:-135px;background:rgba(255,255,255,.055);border-radius:50%;pointer-events:none}
.claim-management-header-content{position:relative;z-index:1}
.claim-management-topline{display:flex;align-items:center;gap:9px;margin-bottom:15px;color:#dbeafe;font-size:13px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase}
.claim-management-topline-dot{width:9px;height:9px;border-radius:50%;background:#8cf0c1;box-shadow:0 0 0 4px rgba(140,240,193,.15)}
.claim-management-header h1{margin:0;color:#fff;font-size:34px;line-height:1.2;font-weight:800;letter-spacing:-.8px}
.claim-management-header p{max-width:700px;margin:12px 0 0;color:#e0eaff;font-size:16px;font-weight:500;line-height:1.65}
.claim-management-header-bottom{display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap;margin-top:25px;padding-top:20px;border-top:1px solid rgba(255,255,255,.19)}
.claim-management-header-note{color:#e0eaff;font-size:14px;font-weight:600}
.claim-back-button{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:46px;padding:11px 18px;border:1px solid rgba(255,255,255,.45);border-radius:11px;color:#fff;background:rgba(255,255,255,.12);font-size:14px;font-weight:800;cursor:pointer}
.claim-back-button:hover{background:rgba(255,255,255,.22)}
.claim-management-tabs-card{padding:8px;margin-bottom:20px;background:#fff;border:1px solid #e1e8f2;border-radius:15px;box-shadow:0 5px 18px rgba(25,42,70,.04)}
.claim-tab-bar{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.claim-tab{display:flex;align-items:center;justify-content:center;gap:12px;min-height:70px;padding:13px 18px;border:1px solid transparent;border-radius:11px;background:transparent;color:#53647b;font-size:16px;font-weight:800;cursor:pointer}
.claim-tab:hover{background:#f4f7ff;color:#2e4eb8}
.claim-tab.active{color:#2547bd;background:#edf2ff;border-color:#dbe4ff}
.claim-tab-icon{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;flex-shrink:0;border-radius:10px;background:#f0f3f8;color:#53647b;font-size:21px;font-weight:800}
.claim-tab.active .claim-tab-icon{color:#fff;background:#4057cf}
.claim-tab-label{display:flex;flex-direction:column;align-items:flex-start;gap:4px;text-align:left}
.claim-tab-label small{color:#7a8aa1;font-size:13px;font-weight:600}
.claim-tab.active .claim-tab-label small{color:#5368b4}
.claim-management-content{min-width:0;padding:25px;background:#fff;border:1px solid #e1e8f2;border-radius:17px;box-shadow:0 7px 24px rgba(25,42,70,.045)}
.claim-management-content-heading{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:23px;padding-bottom:19px;border-bottom:1px solid #e9eef5}
.claim-management-content-heading h2{margin:0;color:#172b4d;font-size:24px;font-weight:800;letter-spacing:-.3px}
.claim-management-content-heading p{margin:7px 0 0;color:#64748b;font-size:15px;font-weight:500;line-height:1.6}
.claim-management-section-tag{display:inline-flex;align-items:center;gap:7px;padding:9px 13px;border-radius:9px;color:#344db5;background:#eef2ff;font-size:13px;font-weight:800;white-space:nowrap}
.claim-management-content .create-claim-page{padding:0}
.claim-management-content .create-claim-header{display:none}
.claim-management-content .create-claim-card{box-shadow:none;border-color:#e3e9f2}
.claim-management-content .create-claim-section-title{font-size:20px;font-weight:800}
.claim-management-content .create-claim-label{font-size:15px;font-weight:800}
.claim-management-content .create-claim-input,.claim-management-content .create-claim-select,.claim-management-content .create-claim-textarea{font-size:15px}
.claim-management-content .create-claim-button{font-size:14px;font-weight:800}
.claim-management-content .create-claim-patient-name{font-size:16px;font-weight:800}
.claim-management-content .create-claim-result{gap:15px}
.claim-management-content .create-claim-results{position:relative;z-index:1}
.claim-management-content .claim-page{padding:0;background:transparent}
.claim-management-content .claim-container{max-width:none}
.claim-management-content .claim-title,.claim-management-content .claim-subtitle{display:none}
.claim-management-alert-error{margin:0 0 18px;padding:14px 16px;border:1px solid #fecaca;border-radius:11px;background:#fef2f2;color:#b91c1c;font-size:14px;line-height:1.6}
.claim-management-loading{padding:35px;text-align:center;color:#64748b}
@media(min-width:1200px){.claim-management{padding:32px}.claim-management-content{padding:30px}}
@media(max-width:900px){.claim-tab{gap:8px;padding:12px 9px;font-size:14px}.claim-tab-label small{font-size:12px}}
@media(max-width:750px){.claim-management{padding:15px}.claim-management-header{padding:24px 21px;border-radius:15px}.claim-management-header h1{font-size:28px}.claim-management-header p{font-size:15px}.claim-management-header-bottom{align-items:flex-start;flex-direction:column}.claim-back-button{width:100%}.claim-tab{min-height:65px;gap:8px;padding:11px 8px;font-size:14px}.claim-tab-icon{width:32px;height:32px;font-size:18px}.claim-tab-label small{font-size:12px}.claim-management-content{padding:17px;border-radius:14px}.claim-management-content-heading h2{font-size:22px}}
@media(max-width:520px){.claim-tab-bar{grid-template-columns:minmax(0,1fr)}.claim-tab{justify-content:flex-start;padding:12px 15px}.claim-management-content{padding:13px}.claim-management-content-heading{align-items:flex-start;flex-direction:column}}
`;

function getApiError(error) {
  const data = error?.response?.data;

  if (typeof data === "string") return data;
  if (data?.detail) return String(data.detail);
  if (data?.message) return String(data.message);

  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([key, value]) => {
        const message = Array.isArray(value)
          ? value.map(String).join(", ")
          : typeof value === "object"
            ? JSON.stringify(value)
            : String(value);

        return `${key}: ${message}`;
      })
      .join(" · ");
  }

  if (error?.message === "Network Error") {
    return "Network error: the server could not be reached. Check the backend and CORS settings.";
  }

  return error?.message || "Unable to complete the request.";
}

function getClaimDatabaseId(claim) {
  const id =
    claim?.id ??
    claim?.pk ??
    claim?.claim_pk ??
    claim?.claimPk ??
    claim?.database_id ??
    claim?.databaseId;

  return id === undefined || id === null || id === "" ? null : id;
}

function getClaimReference(details) {
  return String(
    details?.claimId ??
      details?.claim_id_value ??
      details?.claim?.claimId ??
      details?.claim?.claim_id_value ??
      details?.claim?.claim_id ??
      details?.claim?.claim_number ??
      details?.claim_id ??
      ""
  );
}

function getPatientId(details) {
  return (
    details?.patient?.id ??
    details?.patientId ??
    details?.patient_id ??
    details?.claim?.patientId ??
    details?.claim?.patient_id ??
    details?.claim?.patient?.id ??
    null
  );
}

export default function ClaimsManagement() {
  const navigate = useNavigate();
  const location = useLocation();

  // Keep the edit navigation state available until CreateClaim reads it.
  const routeState = location.state;

  const editClaim =
    routeState?.mode === "edit" &&
    routeState?.editClaim &&
    typeof routeState.editClaim === "object"
      ? routeState.editClaim
      : null;

  const editClaimId =
    routeState?.claimId ?? getClaimDatabaseId(editClaim);

  const isEditMode = Boolean(editClaim && editClaimId);

  const [activeTab, setActiveTab] = useState(
    isEditMode ? "create" : "create"
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [alertError, setAlertError] = useState("");
  const [selectedRenewalAlert, setSelectedRenewalAlert] = useState(null);

  // If Claim History navigates here for editing, show the form immediately.
  useEffect(() => {
    if (isEditMode) {
      setSelectedRenewalAlert(null);
      setActiveTab("create");
      setAlertError("");
    }
  }, [isEditMode, editClaimId]);

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/rcm");
    }
  }

  const refreshData = useCallback(() => {
    setRefreshKey((previous) => previous + 1);
  }, []);

  const handleClaimCreated = useCallback(() => {
    refreshData();
    setSelectedRenewalAlert(null);
    setActiveTab("history");
    setAlertError("");
  }, [refreshData]);

  const handleCreateAlert = useCallback(
    async (alertDetails) => {
      setAlertError("");

      const patientId = getPatientId(alertDetails);
      const alertType = String(
        alertDetails?.alertType || alertDetails?.alert_type || ""
      ).toLowerCase();

      if (!patientId) {
        throw new Error(
          "Cannot create an alert because the patient ID is missing."
        );
      }

      const claimPk =
        alertDetails?.claimPk ??
        alertDetails?.claim_pk ??
        getClaimDatabaseId(alertDetails?.claim);

      const claimId = getClaimReference(alertDetails);

      if (!claimPk) {
        throw new Error(
          "Cannot create an alert because the saved claim database ID is missing."
        );
      }

      if (!claimId) {
        throw new Error(
          "Cannot create an alert because the claim reference is missing."
        );
      }

      let payload;

      if (alertType === "renewal") {
        const renewalDate = String(
          alertDetails?.renewalDate || alertDetails?.renewal_date || ""
        ).slice(0, 10);

        if (!renewalDate) {
          throw new Error(
            "Choose a renewal date before creating a renewal reminder."
          );
        }

        payload = {
          patientId,
          claimPk,
          claimId,
          alertType: "renewal",
          renewalDate,
          status: "Rejected",
          renewalStatus: "Rejected",
          renewal_status: "Rejected",
          message: `Claim ${claimId} renewal reminder`,
        };
      } else if (alertType === "rejection") {
        payload = {
          patientId,
          claimPk,
          claimId,
          alertType: "rejection",
          rejectionReason:
            alertDetails?.rejectionReason ??
            alertDetails?.rejection_reason ??
            "",
          message: `Claim ${claimId} was rejected`,
        };
      } else {
        throw new Error("Unsupported claim alert type.");
      }

      Object.keys(payload).forEach((key) => {
        if (
          payload[key] === null ||
          payload[key] === undefined ||
          payload[key] === ""
        ) {
          delete payload[key];
        }
      });

      try {
        const response = await api.post(
          "rcm/renewal-alerts/",
          payload,
          { withCredentials: true }
        );

        refreshData();
        return response?.data;
      } catch (error) {
        const message = getApiError(error);
        setAlertError(message);
        throw new Error(message);
      }
    },
    [refreshData]
  );

  const handleRenewal = useCallback((alert) => {
    setAlertError("");
    setSelectedRenewalAlert(alert);
    setActiveTab("create");
  }, []);

  const handleRenewalUpdated = useCallback(() => {
    refreshData();
    setSelectedRenewalAlert(null);
    setAlertError("");
    setActiveTab("history");
  }, [refreshData]);

  const getPageHeading = () => {
    if (activeTab === "create") {
      if (isEditMode) return "Edit Claim";
      return selectedRenewalAlert
        ? "Renew Existing Claim"
        : "New Claim Registration";
    }

    if (activeTab === "history") return "Claim History";

    return "Renewal Alerts";
  };

  const getPageDescription = () => {
    if (activeTab === "create") {
      if (isEditMode) {
        return "Update the selected claim record and save your changes.";
      }

      return selectedRenewalAlert
        ? "Review the existing claim details before submitting its renewal."
        : "Select a patient and complete the claim information.";
    }

    if (activeTab === "history") {
      return "Search and review existing claim records.";
    }

    return "Review scheduled renewals and search claims by Claim ID.";
  };

  return (
    <main className="claim-management">
      <style>{styles}</style>

      <header className="claim-management-header">
        <div className="claim-management-header-content">
          <div className="claim-management-topline">
            <span className="claim-management-topline-dot" />
            Revenue Cycle Management
          </div>

          <h1>Claims Management</h1>

          <p>
            Manage patient claims, register new claim records, and review claim
            history and scheduled renewals from one organized workspace.
          </p>

          <div className="claim-management-header-bottom">
            <div className="claim-management-header-note">
              Patient claims · Submission tracking · Renewal reminders
            </div>

            <button
              type="button"
              className="claim-back-button"
              onClick={handleBack}
            >
              <span aria-hidden="true">←</span>
              Back to Previous Page
            </button>
          </div>
        </div>
      </header>

      <nav className="claim-management-tabs-card">
        <div
          className="claim-tab-bar"
          role="tablist"
          aria-label="Claim sections"
        >
          <button
            type="button"
            role="tab"
            id="create-claim-tab"
            aria-controls="claim-management-panel"
            aria-selected={activeTab === "create"}
            className={`claim-tab ${activeTab === "create" ? "active" : ""}`}
            onClick={() => {
              setSelectedRenewalAlert(null);
              setActiveTab("create");
              setAlertError("");
            }}
          >
            <span className="claim-tab-icon" aria-hidden="true">
              +
            </span>
            <span className="claim-tab-label">
              <span>Create New Claim</span>
              <small>Register a patient claim</small>
            </span>
          </button>

          <button
            type="button"
            role="tab"
            id="claim-history-tab"
            aria-controls="claim-management-panel"
            aria-selected={activeTab === "history"}
            className={`claim-tab ${activeTab === "history" ? "active" : ""}`}
            onClick={() => {
              setSelectedRenewalAlert(null);
              setActiveTab("history");
              setAlertError("");
            }}
          >
            <span className="claim-tab-icon" aria-hidden="true">
              ☷
            </span>
            <span className="claim-tab-label">
              <span>Claim History</span>
              <small>Review and track claims</small>
            </span>
          </button>

          <button
            type="button"
            role="tab"
            id="renewal-alerts-tab"
            aria-controls="claim-management-panel"
            aria-selected={activeTab === "alerts"}
            className={`claim-tab ${activeTab === "alerts" ? "active" : ""}`}
            onClick={() => {
              setSelectedRenewalAlert(null);
              setActiveTab("alerts");
              setAlertError("");
            }}
          >
            <span className="claim-tab-icon" aria-hidden="true">
              ◷
            </span>
            <span className="claim-tab-label">
              <span>Renewal Alerts</span>
              <small>Track scheduled renewals</small>
            </span>
          </button>
        </div>
      </nav>

      <section
        className="claim-management-content"
        id="claim-management-panel"
        role="tabpanel"
        aria-labelledby={
          activeTab === "create"
            ? "create-claim-tab"
            : activeTab === "history"
              ? "claim-history-tab"
              : "renewal-alerts-tab"
        }
      >
        <div className="claim-management-content-heading">
          <div>
            <h2>{getPageHeading()}</h2>
            <p>{getPageDescription()}</p>
          </div>

          <span className="claim-management-section-tag">
            {activeTab === "create"
              ? isEditMode
                ? "✎ EDIT CLAIM"
                : selectedRenewalAlert
                  ? "↻ RENEW CLAIM"
                  : "＋ CREATE CLAIM"
              : activeTab === "history"
                ? "☷ CLAIM RECORDS"
                : "◷ RENEWAL ALERTS"}
          </span>
        </div>

        {alertError && (
          <div className="claim-management-alert-error" role="alert">
            {alertError}
          </div>
        )}

        {activeTab === "create" ? (
          <CreateClaim
            key={
              isEditMode
                ? `edit-${editClaimId}`
                : selectedRenewalAlert
                  ? `renewal-${selectedRenewalAlert.id}`
                  : "new-claim"
            }
            editClaim={editClaim}
            editClaimId={editClaimId}
            renewalAlert={selectedRenewalAlert}
            onClaimCreated={handleClaimCreated}
            onRenewalUpdated={handleRenewalUpdated}
            onCreateAlert={handleCreateAlert}
          />
        ) : activeTab === "history" ? (
          <ClaimHistory refreshKey={refreshKey} />
        ) : (
          <RenewalAlerts
            key={refreshKey}
            onRenewal={handleRenewal}
          />
        )}
      </section>
    </main>
  );
}
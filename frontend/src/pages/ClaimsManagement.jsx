
import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import api from "../api/api";

/* =========================================================
   EXISTING RCM COMPONENTS
========================================================= */

import CreateClaim from "../components/rcm/CreateClaim";
import ClaimHistory from "../components/rcm/ClaimHistory";
import RenewalAlerts from "../components/rcm/RenewalAlerts";

/* =========================================================
   NEW SMALLER COMPONENTS
========================================================= */

import ClaimsHeader from "../components/rcm/claims/ClaimsHeader";
import ClaimsTabs from "../components/rcm/claims/ClaimsTabs";
import ClaimsContentHeading from "../components/rcm/claims/ClaimsContentHeading";
import EditClaimBar from "../components/rcm/claims/EditClaimBar";

/*
 * UploadClaims.jsx already exists in your rcm folder.
 * Reuse that file instead of creating a duplicate.
 */
import UploadClaims from "../components/rcm/UploadClaims";

/* =========================================================
   SHARED HELPERS
========================================================= */

import {
  getApiError,
  getClaimDatabaseId,
  getClaimReference,
  getPatientId,
} from "../components/rcm/claims/claimExcelUtils";

/* =========================================================
   STYLES
========================================================= */

import "../components/rcm/claims/claimsManagement.css";

/* =========================================================
   GENERAL HELPERS
========================================================= */

function hasValidId(value) {
  return (
    value !== null &&
    value !== undefined &&
    value !== ""
  );
}

function getEditSession(routeState) {
  if (routeState?.mode !== "edit") {
    return null;
  }

  const claim = routeState?.editClaim;

  if (
    !claim ||
    typeof claim !== "object" ||
    Array.isArray(claim)
  ) {
    return null;
  }

  const claimId =
    routeState?.claimId ??
    getClaimDatabaseId(claim);

  if (!hasValidId(claimId)) {
    return null;
  }

  return {
    claim,
    id: claimId,
  };
}

/* =========================================================
   CLAIMS MANAGEMENT MAIN PAGE
========================================================= */

export default function ClaimsManagement() {
  const navigate = useNavigate();
  const location = useLocation();

  /* =========================================================
     ROUTE INFORMATION
  ========================================================= */

  const routeState = location.state;

  /* =========================================================
     COMPONENT STATE
  ========================================================= */

  const [activeTab, setActiveTab] = useState("create");

  const [refreshKey, setRefreshKey] = useState(0);

  const [alertError, setAlertError] = useState("");

  const [
    selectedRenewalAlert,
    setSelectedRenewalAlert,
  ] = useState(null);

  const [editSession, setEditSession] = useState(
    () => getEditSession(routeState)
  );

  /* =========================================================
     EDIT MODE VALUES
  ========================================================= */

  const editClaim = editSession?.claim ?? null;

  const editClaimId = editSession?.id ?? null;

  const isEditMode =
    Boolean(editClaim) &&
    hasValidId(editClaimId);

  const isRenewalMode =
    !isEditMode &&
    Boolean(selectedRenewalAlert);

  /* =========================================================
     SYNCHRONIZE EDIT MODE FROM ROUTER
  ========================================================= */

  useEffect(() => {
    const incomingEdit = getEditSession(
      location.state
    );

    if (!incomingEdit) {
      return;
    }

    setEditSession(incomingEdit);

    setSelectedRenewalAlert(null);

    setActiveTab("create");

    setAlertError("");
  }, [
    location.key,
    location.state,
  ]);

  /* =========================================================
     CLEAR EDIT MODE
  ========================================================= */

  const clearEditMode = useCallback(() => {
    setEditSession(null);

    if (location.state?.mode === "edit") {
      navigate(
        {
          pathname: location.pathname,
          search: location.search,
          hash: location.hash,
        },
        {
          replace: true,
          state: null,
        }
      );
    }
  }, [
    location.state,
    location.pathname,
    location.search,
    location.hash,
    navigate,
  ]);

  /* =========================================================
     REFRESH CLAIM DATA
  ========================================================= */

  const refreshData = useCallback(() => {
    setRefreshKey((previous) => previous + 1);
  }, []);

  /* =========================================================
     CLAIM CREATED OR UPDATED
  ========================================================= */

  const handleClaimSaved = useCallback(() => {
    refreshData();

    clearEditMode();

    setSelectedRenewalAlert(null);

    setAlertError("");

    setActiveTab("history");
  }, [
    refreshData,
    clearEditMode,
  ]);

  /* =========================================================
     CANCEL EDITING
  ========================================================= */

  const handleCancelEdit = useCallback(() => {
    clearEditMode();

    setSelectedRenewalAlert(null);

    setAlertError("");

    setActiveTab("history");
  }, [clearEditMode]);

  /* =========================================================
     BACK BUTTON
  ========================================================= */

  const handleBack = useCallback(() => {
    if (isEditMode) {
      handleCancelEdit();
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/rcm");
    }
  }, [
    isEditMode,
    handleCancelEdit,
    navigate,
  ]);

  /* =========================================================
     TAB NAVIGATION
  ========================================================= */

  const handleSelectTab = useCallback(
    (tab) => {
      const validTabs = [
        "create",
        "upload",
        "history",
        "alerts",
      ];

      if (!validTabs.includes(tab)) {
        return;
      }

      if (isEditMode) {
        clearEditMode();
      }

      setSelectedRenewalAlert(null);

      setAlertError("");

      setActiveTab(tab);
    },
    [
      isEditMode,
      clearEditMode,
    ]
  );

  /* =========================================================
     EXCEL IMPORT COMPLETED
  ========================================================= */

  const handleImportComplete = useCallback(() => {
    refreshData();
  }, [refreshData]);

  /* =========================================================
     CREATE RENEWAL OR REJECTION ALERT
  ========================================================= */

  const handleCreateAlert = useCallback(
    async (alertDetails) => {
      setAlertError("");

      /* -----------------------------------------
         GET PATIENT
      ----------------------------------------- */

      const patientId = getPatientId(
        alertDetails
      );

      if (!hasValidId(patientId)) {
        throw new Error(
          "Cannot create an alert because the patient ID is missing."
        );
      }

      /* -----------------------------------------
         GET ALERT TYPE
      ----------------------------------------- */

      const alertType = String(
        alertDetails?.alertType ??
        alertDetails?.alert_type ??
        ""
      ).toLowerCase();

      /* -----------------------------------------
         GET CLAIM DATABASE ID
      ----------------------------------------- */

      const claimPk =
        alertDetails?.claimPk ??
        alertDetails?.claim_pk ??
        getClaimDatabaseId(
          alertDetails?.claim
        );

      if (!hasValidId(claimPk)) {
        throw new Error(
          "Cannot create an alert because the saved claim database ID is missing."
        );
      }

      /* -----------------------------------------
         GET CLAIM REFERENCE
      ----------------------------------------- */

      const claimId = getClaimReference(
        alertDetails
      );

      if (!claimId) {
        throw new Error(
          "Cannot create an alert because the claim reference is missing."
        );
      }

      /* -----------------------------------------
         PREPARE PAYLOAD
      ----------------------------------------- */

      let payload;

      /* -----------------------------------------
         RENEWAL ALERT
      ----------------------------------------- */

      if (alertType === "renewal") {
        const renewalDate = String(
          alertDetails?.renewalDate ??
          alertDetails?.renewal_date ??
          ""
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
      }

      /* -----------------------------------------
         REJECTION ALERT
      ----------------------------------------- */

      else if (alertType === "rejection") {
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
      }

      /* -----------------------------------------
         INVALID ALERT TYPE
      ----------------------------------------- */

      else {
        throw new Error(
          "Unsupported claim alert type."
        );
      }

      /* -----------------------------------------
         REMOVE EMPTY VALUES
      ----------------------------------------- */

      Object.keys(payload).forEach((key) => {
        if (
          payload[key] === null ||
          payload[key] === undefined ||
          payload[key] === ""
        ) {
          delete payload[key];
        }
      });

      /* -----------------------------------------
         SAVE ALERT TO BACKEND
      ----------------------------------------- */

      try {
        const response = await api.post(
          "rcm/renewal-alerts/",
          payload,
          {
            withCredentials: true,
          }
        );

        refreshData();

        return response?.data;
      } catch (error) {
        const message = getApiError(
          error
        );

        setAlertError(message);

        throw new Error(message);
      }
    },
    [refreshData]
  );

  /* =========================================================
     RENEWAL ALERT SELECTED
  ========================================================= */

  const handleRenewal = useCallback(
    (alert) => {
      clearEditMode();

      setSelectedRenewalAlert(alert);

      setAlertError("");

      setActiveTab("create");
    },
    [clearEditMode]
  );

  /* =========================================================
     RENEWAL UPDATED
  ========================================================= */

  const handleRenewalUpdated = useCallback(() => {
    refreshData();

    clearEditMode();

    setSelectedRenewalAlert(null);

    setAlertError("");

    setActiveTab("history");
  }, [
    refreshData,
    clearEditMode,
  ]);

  /* =========================================================
     ACTIVE TAB INFORMATION
  ========================================================= */

  const tabIds = {
    create: "create-claim-tab",
    upload: "upload-claims-tab",
    history: "claim-history-tab",
    alerts: "renewal-alerts-tab",
  };

  const activeTabId =
    tabIds[activeTab] ||
    "create-claim-tab";

  /* =========================================================
     CREATE CLAIM COMPONENT KEY
  ========================================================= */

  const claimFormKey = isEditMode
    ? `edit-${editClaimId}`
    : isRenewalMode
      ? `renewal-${
          selectedRenewalAlert?.id ??
          selectedRenewalAlert?.claimPk ??
          "selected"
        }`
      : "new-claim";

  /* =========================================================
     MAIN RENDER
  ========================================================= */

  return (
    <main className="claim-management">

      {/* ==========================================
          PAGE HEADER
      ========================================== */}

      <ClaimsHeader
        isEditMode={isEditMode}
        onBack={handleBack}
      />

      {/* ==========================================
          NAVIGATION TABS
      ========================================== */}

      <ClaimsTabs
        activeTab={activeTab}
        isEditMode={isEditMode}
        onSelectTab={handleSelectTab}
      />

      {/* ==========================================
          MAIN CONTENT PANEL
      ========================================== */}

      <section
        className="claim-management-content"
        id="claim-management-panel"
        role="tabpanel"
        aria-labelledby={activeTabId}
      >

        {/* ========================================
            DYNAMIC SECTION HEADING
        ======================================== */}

        <ClaimsContentHeading
          activeTab={activeTab}
          isEditMode={isEditMode}
          isRenewalMode={isRenewalMode}
        />

        {/* ========================================
            ALERT ERROR
        ======================================== */}

        {alertError && (
          <div
            className="claim-management-alert-error"
            role="alert"
          >
            {alertError}
          </div>
        )}

        {/* ========================================
            CREATE / EDIT / RENEW CLAIM
        ======================================== */}

        {activeTab === "create" && (
          <>
            {/* EDIT MODE INFORMATION */}

            {isEditMode && (
              <EditClaimBar
                claim={editClaim}
                claimId={editClaimId}
                onCancel={handleCancelEdit}
              />
            )}

            {/* EXISTING CLAIM FORM */}

            <CreateClaim
              key={claimFormKey}
              editClaim={
                isEditMode
                  ? editClaim
                  : null
              }
              editClaimId={
                isEditMode
                  ? editClaimId
                  : null
              }
              isEditMode={isEditMode}
              renewalAlert={
                isEditMode
                  ? null
                  : selectedRenewalAlert
              }
              onClaimCreated={
                handleClaimSaved
              }
              onClaimUpdated={
                handleClaimSaved
              }
              onCancelEdit={
                handleCancelEdit
              }
              onRenewalUpdated={
                handleRenewalUpdated
              }
              onCreateAlert={
                handleCreateAlert
              }
            />
          </>
        )}

        {/* ========================================
            UPLOAD CLAIMS FROM EXCEL
        ======================================== */}

        {activeTab === "upload" && (
          <UploadClaims
            onImportComplete={
              handleImportComplete
            }
          />
        )}

        {/* ========================================
            CLAIM HISTORY
        ======================================== */}

        {activeTab === "history" && (
          <ClaimHistory
            refreshKey={refreshKey}
          />
        )}

        {/* ========================================
            RENEWAL ALERTS
        ======================================== */}

        {activeTab === "alerts" && (
          <RenewalAlerts
            key={refreshKey}
            onRenewal={handleRenewal}
          />
        )}

      </section>
    </main>
  );
}

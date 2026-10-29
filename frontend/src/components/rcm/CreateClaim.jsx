import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/api";

const styles = `
.create-claim-page{max-width:1500px;margin:auto;padding:12px 4px 28px;color:#183451;font-family:inherit}
.create-claim-header{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:24px}
.create-claim-title{margin:0;font-size:clamp(27px,2.5vw,36px);font-weight:800;color:#17365d}
.create-claim-subtitle{margin:9px 0 0;color:#647b98;line-height:1.7}
.create-claim-card{padding:clamp(18px,2.2vw,30px);margin-bottom:22px;border:1px solid #dce7f5;border-radius:18px;background:#fff;box-shadow:0 8px 28px rgba(35,65,110,.05)}
.create-claim-section-heading{display:flex;align-items:center;gap:14px;margin-bottom:22px;padding-bottom:16px;border-bottom:1px solid #edf1f7}
.create-claim-section-number{width:44px;height:44px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border-radius:13px;background:#eef2ff;color:#4057cf;font-size:17px;font-weight:800}
.create-claim-section-title{margin:0;font-size:20px;font-weight:800;color:#183451}
.create-claim-section-description{margin:5px 0 0;color:#71829a;font-size:14px;line-height:1.6}
.create-claim-label{display:block;margin-bottom:9px;color:#334b68;font-size:14px;font-weight:800}
.create-claim-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px 24px}
.create-claim-field{min-width:0}
.create-claim-field-full{grid-column:1/-1}
.create-claim-input,.create-claim-select,.create-claim-textarea,.create-claim-search-input{box-sizing:border-box;width:100%;min-height:51px;padding:12px 14px;border:1px solid #d4deeb;border-radius:11px;background:#fff;color:#203b5c;font:inherit;font-size:15px;outline:none}
.create-claim-input:focus,.create-claim-select:focus,.create-claim-textarea:focus,.create-claim-search-input:focus{border-color:#536cda;box-shadow:0 0 0 3px rgba(83,108,218,.12)}
.create-claim-input:read-only{background:#f4f7fb;color:#526780}
.create-claim-textarea{min-height:110px;resize:vertical}
.create-claim-form-note{margin-top:7px;color:#7a8ba2;font-size:12px;line-height:1.6}
.create-claim-search-box{display:flex;align-items:center;gap:10px;padding:6px 10px;border:1px solid #d4deeb;border-radius:12px;background:#f8faff}
.create-claim-search-box .create-claim-search-input{border:0;background:transparent;box-shadow:none}
.create-claim-search-icon{font-size:23px;color:#647ca3}
.create-claim-search-meta{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-top:10px;color:#7a8ba2;font-size:12px}
.create-claim-results{display:flex;flex-direction:column;gap:10px;margin-top:15px;padding:14px;border:1px solid #e0e8f3;border-radius:14px;background:#f7f9fd}
.create-claim-results-heading{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:5px;color:#526985;font-size:12px;font-weight:800}
.create-claim-result{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;padding:15px;border:1px solid #e0e7f1;border-radius:12px;background:#fff}
.create-claim-result.selected{border-color:#7d8ee7;background:#f4f6ff}
.create-claim-patient-info{display:flex;align-items:center;gap:12px;flex:1 1 230px;min-width:0}
.create-claim-avatar{width:48px;height:48px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border-radius:14px;background:#e9edff;color:#3655c8;font-weight:800}
.create-claim-patient-details{min-width:0}
.create-claim-patient-name{margin:0;font-weight:800;overflow-wrap:anywhere}
.create-claim-patient-meta{display:flex;flex-wrap:wrap;gap:7px 12px;margin-top:7px;color:#71829a;font-size:12px}
.create-claim-result-actions,.create-claim-selected-actions,.create-claim-footer-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.create-claim-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:43px;padding:10px 15px;border:1px solid transparent;border-radius:10px;font-size:13px;font-weight:800;cursor:pointer}
.create-claim-button:disabled{opacity:.55;cursor:not-allowed}
.create-claim-button-primary{background:#4057cf;color:#fff}
.create-claim-button-primary:hover:not(:disabled){background:#3349bd}
.create-claim-button-secondary{background:#fff;color:#3e536e;border-color:#d5dfeb}
.create-claim-button-secondary:hover:not(:disabled){background:#f5f8fc}
.create-claim-button-light{background:#eef2ff;color:#4057cf;border-color:#dce4ff}
.create-claim-selected{display:flex;align-items:flex-start;justify-content:space-between;gap:15px;flex-wrap:wrap;padding:17px;margin-top:17px;border:1px solid #b8e8ca;border-radius:14px;background:#f0fdf5}
.create-claim-selected-label{margin-bottom:6px;color:#15803d;font-size:12px;font-weight:800}
.create-claim-selected-name{color:#166534;font-size:17px;font-weight:800}
.create-claim-selected-meta{margin-top:6px;color:#4b7c5b;font-size:12px}
.create-claim-empty{text-align:center;padding:24px 14px;border:1px dashed #cbd5e1;border-radius:12px;background:#fff;color:#64748b;font-size:14px}
.create-claim-alert-option{display:flex;align-items:flex-start;gap:12px;padding:16px;border:1px solid #d7e0ff;border-radius:13px;background:#f5f7ff;cursor:pointer}
.create-claim-alert-option input{width:18px;height:18px;margin-top:3px;accent-color:#4057cf}
.create-claim-alert-title{font-weight:800;color:#2f469e}
.create-claim-alert-description{margin-top:5px;color:#687991;font-size:13px;line-height:1.6}
.create-claim-message{padding:14px 16px;margin-bottom:17px;border-radius:11px;font-size:14px;line-height:1.6;overflow-wrap:anywhere}
.create-claim-error{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c}
.create-claim-success{background:#f0fdf4;border:1px solid #bbf7d0;color:#166534}
.create-claim-info{background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8}
.create-claim-form-footer{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;padding-top:22px;margin-top:23px;border-top:1px solid #e8edf5}
.create-claim-footer-note{color:#7a8ba2;font-size:12px;line-height:1.6}
.create-claim-creator{margin-top:8px;color:#4f6b5a}
@media(max-width:700px){
 .create-claim-form-grid{grid-template-columns:minmax(0,1fr);gap:17px}
 .create-claim-field-full{grid-column:auto}
 .create-claim-card{padding:17px}
 .create-claim-result-actions,.create-claim-selected-actions,.create-claim-footer-actions{width:100%}
 .create-claim-result-actions .create-claim-button,.create-claim-selected-actions .create-claim-button,.create-claim-footer-actions .create-claim-button{flex:1 1 auto}
 .create-claim-form-footer{align-items:stretch;flex-direction:column}
}
`;

function getPatientName(patient) {
  if (!patient) return "Unknown Patient";

  const fullName =
    patient.full_name ||
    patient.fullName ||
    patient.patient_name ||
    patient.patientName ||
    patient.name;

  if (fullName) return String(fullName);

  return [
    patient.first_name || patient.firstName,
    patient.middle_name || patient.middleName,
    patient.last_name || patient.lastName,
  ].filter(Boolean).join(" ") || "Unknown Patient";
}

function getPatientNumber(patient) {
  return (
    patient?.file_number ||
    patient?.fileNumber ||
    patient?.patient_number ||
    patient?.patientNumber ||
    patient?.mrn ||
    patient?.medical_record_number ||
    patient?.medicalRecordNumber ||
    patient?.id ||
    "N/A"
  );
}

function getPatientPhone(patient) {
  return (
    patient?.phone ||
    patient?.phone_number ||
    patient?.phoneNumber ||
    patient?.mobile ||
    patient?.mobile_number ||
    patient?.mobileNumber ||
    ""
  );
}

function getPatientList(response) {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.patients)) return data.patients;
  return [];
}

function getInitials(name) {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();
}

function getCreatorName(claim) {
  if (!claim) return "";

  const creator =
    claim.created_by_name ||
    claim.createdByName ||
    claim.creator_name ||
    claim.creatorName ||
    claim.created_by_display_name ||
    claim.createdByDisplayName ||
    claim.created_by_username ||
    claim.createdByUsername;

  if (creator && typeof creator !== "object") return String(creator);

  const user =
    claim.created_by ||
    claim.createdBy ||
    claim.creator ||
    claim.user;

  if (user && typeof user === "object") {
    return (
      user.display_name ||
      user.displayName ||
      user.full_name ||
      user.fullName ||
      user.name ||
      user.username ||
      user.email ||
      ""
    );
  }

  return "";
}

function getUserName(user) {
  return (
    user?.display_name ||
    user?.displayName ||
    user?.full_name ||
    user?.fullName ||
    user?.name ||
    user?.username ||
    user?.email ||
    ""
  );
}

function getApiError(err) {
  const data = err?.response?.data;

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

  if (err?.message === "Network Error") {
    return "Network error: the server could not be reached. Check the backend and CORS settings.";
  }

  return err?.message || "The request failed. Please check the information and try again.";
}

function getAlertClaimId(alert) {
  return (
    alert?.claimId ||
    alert?.claim_id_value ||
    alert?.claim_id ||
    alert?.claim?.claim_id ||
    ""
  );
}

function getAlertPatientId(alert) {
  return (
    alert?.patientId ||
    alert?.patient_id ||
    alert?.patient?.id ||
    alert?.claim?.patientId ||
    alert?.claim?.patient_id ||
    null
  );
}

function getAlertDate(alert) {
  return String(alert?.renewalDate || alert?.renewal_date || "").slice(0, 10);
}

function getLocalToday() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function getInitialForm(renewalAlert) {
  return {
    claimId: renewalAlert ? getAlertClaimId(renewalAlert) : "",
    status: renewalAlert ? "Submitted" : "Pending",
    rejectionReason:
      renewalAlert?.rejectionReason ||
      renewalAlert?.rejection_reason ||
      renewalAlert?.claim?.rejection_reason ||
      "",
    renewalDate: renewalAlert ? getAlertDate(renewalAlert) : "",
  };
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

function getClaimForm(claim) {
  const rawStatus = String(claim?.status || "Pending").trim().toLowerCase();

  const statusMap = {
    pending: "Pending",
    submitted: "Submitted",
    approved: "Approved",
    rejected: "Rejected",
    denied: "Rejected",
  };

  return {
    claimId: String(
      claim?.claimId ??
      claim?.claim_id ??
      claim?.claim_id_value ??
      claim?.claim_number ??
      claim?.claimNumber ??
      ""
    ),
    status: statusMap[rawStatus] || "Pending",
    rejectionReason: String(
      claim?.rejectionReason ?? claim?.rejection_reason ?? ""
    ),
    renewalDate: String(
      claim?.renewalDate ?? claim?.renewal_date ?? ""
    ).slice(0, 10),
  };
}

export default function CreateClaim({
  patient: initialPatient,
  renewalAlert = null,
  onClose,
  onClaimCreated,
  onRenewalUpdated,
  onCreateAlert,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  // IMPORTANT: CreateClaim only enters edit mode when mode is explicitly "edit".
  // A stale claimId alone must never make Create New Claim show Edit Claim.
  const routeState = location.state;
  const isRenewalMode = Boolean(renewalAlert);
  const isEditing = !isRenewalMode && routeState?.mode === "edit";
  const editClaim = isEditing ? routeState?.editClaim || null : null;
  const editClaimId = isEditing
    ? routeState?.claimId ?? getClaimDatabaseId(editClaim)
    : null;

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(initialPatient || null);
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdClaim, setCreatedClaim] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [createRejectionAlert, setCreateRejectionAlert] = useState(false);
  const [createRenewalAlert, setCreateRenewalAlert] = useState(false);

  const [form, setForm] = useState(() =>
    isEditing && editClaim
      ? getClaimForm(editClaim)
      : getInitialForm(renewalAlert)
  );

  useEffect(() => {
    let active = true;

    async function loadPatients() {
      setLoadingPatients(true);

      try {
        const response = await api.get("patients/", {
          withCredentials: true,
        });

        if (!active) return;

        const patientList = getPatientList(response);
        setPatients(patientList);

        if (renewalAlert) {
          const patientId = getAlertPatientId(renewalAlert);
          const matchedPatient = patientList.find(
            (item) => String(item.id) === String(patientId)
          );

          if (matchedPatient) {
            setSelectedPatient(matchedPatient);
          } else if (
            renewalAlert.patient &&
            typeof renewalAlert.patient === "object"
          ) {
            setSelectedPatient(renewalAlert.patient);
          }
        } else if (isEditing && editClaim) {
          const claimPatient =
            editClaim.patient && typeof editClaim.patient === "object"
              ? editClaim.patient
              : null;

          const patientId =
            editClaim.patientId ??
            editClaim.patient_id ??
            editClaim.patient?.id;

          const matchedPatient = patientList.find(
            (item) => String(item.id) === String(patientId)
          );

          setSelectedPatient(matchedPatient || claimPatient || null);
        } else if (initialPatient) {
          const matchedPatient = patientList.find(
            (item) => String(item.id) === String(initialPatient.id)
          );
          setSelectedPatient(matchedPatient || initialPatient);
        } else {
          setSelectedPatient(null);
        }
      } catch (err) {
        if (active) setError(getApiError(err));
      } finally {
        if (active) setLoadingPatients(false);
      }
    }

    async function loadCurrentUser() {
      try {
        const response = await api.get("users/me/", {
          withCredentials: true,
        });
        if (active) setCurrentUser(response?.data || null);
      } catch {
        if (active) setCurrentUser(null);
      }
    }

    loadPatients();
    loadCurrentUser();

    return () => {
      active = false;
    };
  }, [initialPatient, renewalAlert, isEditing, editClaim]);

  // Reset the form whenever navigation changes between create and edit.
  useEffect(() => {
    setError("");
    setSuccess("");
    setCreatedClaim(null);
    setSearch("");
    setShowResults(false);
    setCreateRejectionAlert(false);
    setCreateRenewalAlert(false);

    if (isEditing && editClaim) {
      setForm(getClaimForm(editClaim));

      const claimPatient =
        editClaim.patient && typeof editClaim.patient === "object"
          ? editClaim.patient
          : null;

      if (claimPatient) setSelectedPatient(claimPatient);
      return;
    }

    setForm(getInitialForm(renewalAlert));

    if (!renewalAlert) {
      setSelectedPatient(initialPatient || null);
    }
  }, [location.key, renewalAlert, initialPatient, isEditing, editClaim]);

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];

    return patients
      .filter((patient) => {
        const values = [
          getPatientName(patient),
          getPatientNumber(patient),
          getPatientPhone(patient),
          patient?.national_id,
          patient?.nationalId,
          patient?.emirates_id,
          patient?.emiratesId,
          patient?.id,
        ];

        return values.some((value) =>
          String(value ?? "").toLowerCase().includes(term)
        );
      })
      .slice(0, 10);
  }, [patients, search]);

  const isRejected = form.status.toLowerCase() === "rejected";
  const renewalDate = getAlertDate(renewalAlert);
  const isRenewalDateToday =
    !isRenewalMode || renewalDate === getLocalToday();

  const isAlreadySubmitted =
    String(renewalAlert?.status || "").toLowerCase() === "submitted";

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function selectPatient(patient) {
    if (isRenewalMode || isEditing) return;

    setSelectedPatient(patient);
    setSearch("");
    setShowResults(false);
    setError("");
    setSuccess("");
    setCreatedClaim(null);
  }

  function openPatientFile(patient) {
    if (!patient?.id) {
      setError("This patient does not have a valid ID to open the patient file.");
      return;
    }

    navigate(`/patients/${patient.id}`);
  }

  function resetForm() {
    setError("");
    setSuccess("");
    setCreatedClaim(null);

    if (isRenewalMode) {
      setForm(getInitialForm(renewalAlert));
      return;
    }

    if (isEditing && editClaim) {
      setForm(getClaimForm(editClaim));
      return;
    }

    setForm(getInitialForm(null));
    setCreateRejectionAlert(false);
    setCreateRenewalAlert(false);
  }

  async function submitClaim(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setCreatedClaim(null);

    if (!selectedPatient?.id) {
      setError("Please select a valid patient before continuing.");
      return;
    }

    if (!form.claimId.trim()) {
      setError("Please enter the claim number or reference.");
      return;
    }

    if (isEditing && (editClaimId === null || editClaimId === "")) {
      setError(
        "The database ID for this claim is missing. Reopen the claim from Claim History and try again."
      );
      return;
    }

    if (isRenewalMode) {
      if (!renewalAlert?.id) {
        setError("The renewal alert ID is missing. Reopen the alert and try again.");
        return;
      }

      const linkedClaimId =
        renewalAlert.claimPk ??
        renewalAlert.claim_pk ??
        renewalAlert.claim?.id;

      if (!linkedClaimId) {
        setError(
          "This renewal alert is not linked to an existing claim. Link it to its claim before resubmitting."
        );
        return;
      }

      if (!isRenewalDateToday) {
        setError("This claim can only be renewed on its scheduled renewal date.");
        return;
      }

      if (isAlreadySubmitted) {
        setError("This renewal has already been submitted.");
        return;
      }
    } else {
      if (isRejected && !form.rejectionReason.trim()) {
        setError("Please enter the rejection reason.");
        return;
      }

      if (createRenewalAlert && !form.renewalDate) {
        setError("Please choose a renewal date before creating a renewal alert.");
        return;
      }

      if (
        !isEditing &&
        (createRejectionAlert || createRenewalAlert) &&
        typeof onCreateAlert !== "function"
      ) {
        setError("Alert creation is not connected. Check the parent alert handler.");
        return;
      }
    }

    setSaving(true);

    try {
      if (isRenewalMode) {
        const claimPk =
          renewalAlert.claimPk ??
          renewalAlert.claim_pk ??
          renewalAlert.claim?.id;

        const response = await api.patch(
          `rcm/claims/${claimPk}/`,
          {
            status: "Submitted",
            alertId: renewalAlert.id,
          },
          { withCredentials: true }
        );

        const claim = response?.data || null;
        setCreatedClaim(claim);
        setSuccess(
          `Claim ${form.claimId.trim()} has been updated and marked as Submitted. The original Claim ID has been preserved.`
        );

        if (typeof onRenewalUpdated === "function") {
          onRenewalUpdated(claim);
        }

        return;
      }

      const payload = {
        patientId: selectedPatient.id,
        claimId: form.claimId.trim(),
        status: form.status,
        rejectionReason: form.rejectionReason.trim(),
        renewalDate: form.renewalDate || null,
      };

      const response = isEditing
        ? await api.patch(
            `rcm/claims/${editClaimId}/`,
            payload,
            { withCredentials: true }
          )
        : await api.post(
            "rcm/claims/",
            payload,
            { withCredentials: true }
          );

      const claim = response?.data || null;
      setCreatedClaim(claim);

      if (!isEditing && createRejectionAlert) {
        await onCreateAlert({
          alertType: "rejection",
          patient: selectedPatient,
          claim,
          claimId: form.claimId.trim(),
          rejectionReason: form.rejectionReason.trim(),
          renewalDate: null,
        });
      }

      if (!isEditing && createRenewalAlert) {
        await onCreateAlert({
          alertType: "renewal",
          patient: selectedPatient,
          claim,
          claimId: form.claimId.trim(),
          renewalDate: form.renewalDate,
          rejectionReason: "",
        });
      }

      if (isEditing) {
        setSuccess("Claim updated successfully.");
        if (typeof onClaimCreated === "function") {
          onClaimCreated(claim);
        }

        // Clear the edit state so a later Create New Claim opens a blank form.
        navigate("/rcm/claims", {
          replace: true,
          state: null,
        });
      } else {
        setSuccess("Claim created successfully.");
        setForm(getInitialForm(null));
        setCreateRejectionAlert(false);
        setCreateRenewalAlert(false);

        if (typeof onClaimCreated === "function") {
          onClaimCreated(claim);
        }
      }
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  const creatorName =
    getCreatorName(createdClaim) || getUserName(currentUser);

  return (
    <div className="create-claim-page">
      <style>{styles}</style>

      <div className="create-claim-header">
        <div>
          <h1 className="create-claim-title">
            {isRenewalMode
              ? "Renew Existing Claim"
              : isEditing
                ? "Edit Claim"
                : "Create New Claim"}
          </h1>

          <p className="create-claim-subtitle">
            {isRenewalMode
              ? "Review the existing claim details and submit the renewal on its scheduled date."
              : isEditing
                ? "Update the selected claim and save your changes."
                : "Search for a patient, enter claim details, and optionally schedule a renewal reminder."}
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            className="create-claim-button create-claim-button-secondary"
            onClick={onClose}
          >
            ← Back
          </button>
        )}
      </div>

      {isRenewalMode && (
        <div className="create-claim-message create-claim-info" role="status">
          <strong>Renewal mode</strong>
          <br />
          Existing Claim ID: <strong>{form.claimId || "—"}</strong>
          <br />
          Scheduled renewal date: <strong>{renewalDate || "—"}</strong>
          <br />
          The existing claim record will be updated. A new claim will not be created.
        </div>
      )}

      {isEditing && (
        <div className="create-claim-message create-claim-info" role="status">
          You are editing an existing claim. Saving changes will update this claim
          rather than create a new record.
        </div>
      )}

      {error && (
        <div className="create-claim-message create-claim-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="create-claim-message create-claim-success" role="status">
          {success}
          {creatorName && (
            <div className="create-claim-creator">
              Processed by: <strong>{creatorName}</strong>
            </div>
          )}
        </div>
      )}

      <section className="create-claim-card">
        <div className="create-claim-section-heading">
          <div className="create-claim-section-number">1</div>
          <div>
            <h2 className="create-claim-section-title">Select Patient</h2>
            <p className="create-claim-section-description">
              {isRenewalMode
                ? "The patient is taken from the existing claim and cannot be changed during renewal."
                : isEditing
                  ? "The patient linked to this claim is shown below."
                  : "Search by patient name, file number, phone number, or patient ID."}
            </p>
          </div>
        </div>

        {!isRenewalMode && !isEditing && (
          <>
            <label
              className="create-claim-label"
              htmlFor="claim-patient-search"
            >
              Search patients
            </label>

            <div className="create-claim-search-box">
              <span className="create-claim-search-icon" aria-hidden="true">
                ⌕
              </span>

              <input
                id="claim-patient-search"
                className="create-claim-search-input"
                type="search"
                value={search}
                placeholder="Type a name, file number, phone, or patient ID..."
                autoComplete="off"
                onFocus={() => {
                  if (search.trim()) setShowResults(true);
                }}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setShowResults(true);
                  setError("");
                }}
              />

              {search && (
                <button
                  type="button"
                  className="create-claim-button create-claim-button-secondary"
                  onClick={() => {
                    setSearch("");
                    setShowResults(false);
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            <div className="create-claim-search-meta">
              <span>
                {loadingPatients
                  ? "Loading patient records..."
                  : `${patients.length} patient record${patients.length === 1 ? "" : "s"} available`}
              </span>
              <span>Enter a search term to filter results.</span>
            </div>

            {showResults && search.trim() && (
              <div className="create-claim-results">
                <div className="create-claim-results-heading">
                  <span>Matching patients</span>
                  {!loadingPatients && (
                    <span>
                      {filteredPatients.length} result
                      {filteredPatients.length === 1 ? "" : "s"}
                      {filteredPatients.length === 10 ? " · Showing first 10" : ""}
                    </span>
                  )}
                </div>

                {loadingPatients ? (
                  <div className="create-claim-empty">
                    Loading patient records...
                  </div>
                ) : filteredPatients.length === 0 ? (
                  <div className="create-claim-empty">
                    No matching patients found. Try a different search term.
                  </div>
                ) : (
                  filteredPatients.map((patient) => {
                    const name = getPatientName(patient);
                    const isSelected =
                      String(selectedPatient?.id) === String(patient.id);

                    return (
                      <div
                        className={`create-claim-result${isSelected ? " selected" : ""}`}
                        key={patient.id}
                      >
                        <div className="create-claim-patient-info">
                          <div className="create-claim-avatar">
                            {getInitials(name)}
                          </div>

                          <div className="create-claim-patient-details">
                            <p className="create-claim-patient-name">{name}</p>

                            <div className="create-claim-patient-meta">
                              <span>File No: {getPatientNumber(patient)}</span>
                              {getPatientPhone(patient) && (
                                <span>Phone: {getPatientPhone(patient)}</span>
                              )}
                              {patient?.gender && (
                                <span>Gender: {patient.gender}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="create-claim-result-actions">
                          <button
                            type="button"
                            className="create-claim-button create-claim-button-primary"
                            onClick={() => selectPatient(patient)}
                          >
                            {isSelected ? "✓ Selected" : "Select Patient"}
                          </button>

                          <button
                            type="button"
                            className="create-claim-button create-claim-button-secondary"
                            onClick={() => openPatientFile(patient)}
                          >
                            Open Patient File ↗
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}

        {selectedPatient && (
          <div className="create-claim-selected">
            <div>
              <div className="create-claim-selected-label">
                ✓ Patient selected
              </div>

              <div className="create-claim-selected-name">
                {getPatientName(selectedPatient)}
              </div>

              <div className="create-claim-selected-meta">
                File No: {getPatientNumber(selectedPatient)}
                {getPatientPhone(selectedPatient)
                  ? ` · Phone: ${getPatientPhone(selectedPatient)}`
                  : ""}
              </div>
            </div>

            <div className="create-claim-selected-actions">
              <button
                type="button"
                className="create-claim-button create-claim-button-secondary"
                onClick={() => openPatientFile(selectedPatient)}
              >
                Open Patient File ↗
              </button>

              {!isRenewalMode && !isEditing && (
                <button
                  type="button"
                  className="create-claim-button create-claim-button-light"
                  onClick={() => {
                    setSelectedPatient(null);
                    setSearch("");
                    setShowResults(false);
                    setError("");
                    setSuccess("");
                    setCreatedClaim(null);
                  }}
                >
                  Change Patient
                </button>
              )}
            </div>
          </div>
        )}

        {!selectedPatient && !loadingPatients && isRenewalMode && (
          <div className="create-claim-empty">
            The patient associated with this alert could not be loaded. Please
            verify the alert's patient ID and try again.
          </div>
        )}
      </section>

      <section className="create-claim-card">
        <div className="create-claim-section-heading">
          <div className="create-claim-section-number">2</div>
          <div>
            <h2 className="create-claim-section-title">Claim Details</h2>
            <p className="create-claim-section-description">
              {isRenewalMode
                ? "The existing Claim ID and scheduled renewal date are preserved."
                : isEditing
                  ? "Review and update the existing claim details."
                  : "Enter the claim reference, status, and renewal information."}
            </p>
          </div>
        </div>

        <form onSubmit={submitClaim}>
          <div className="create-claim-form-grid">
            <div className="create-claim-field">
              <label className="create-claim-label" htmlFor="claim-reference">
                Claim Number / Reference *
              </label>

              <input
                id="claim-reference"
                className="create-claim-input"
                type="text"
                value={form.claimId}
                onChange={(event) => {
                  if (!isRenewalMode) {
                    updateForm("claimId", event.target.value);
                  }
                }}
                placeholder="Enter claim number or reference"
                readOnly={isRenewalMode}
                required
              />

              <div className="create-claim-form-note">
                {isRenewalMode
                  ? "The original Claim ID cannot be changed during renewal."
                  : "Enter the reference used by your RCM team."}
              </div>
            </div>

            <div className="create-claim-field">
              <label className="create-claim-label" htmlFor="claim-status">
                Claim Status *
              </label>

              <select
                id="claim-status"
                className="create-claim-select"
                value={form.status}
                disabled={isRenewalMode}
                onChange={(event) => {
                  const status = event.target.value;

                  setForm((current) => ({
                    ...current,
                    status,
                    rejectionReason:
                      status === "Rejected" ? current.rejectionReason : "",
                  }));

                  if (status !== "Rejected") {
                    setCreateRejectionAlert(false);
                  }
                }}
                required
              >
                <option value="Pending">Pending</option>
                <option value="Submitted">Submitted</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>

              <div className="create-claim-form-note">
                {isRenewalMode
                  ? "Submitting the renewal will set the existing claim status to Submitted."
                  : "Choose the current status of the claim."}
              </div>
            </div>

            <div className="create-claim-field">
              <label
                className="create-claim-label"
                htmlFor="claim-renewal-date"
              >
                Renewal Date
              </label>

              <input
                id="claim-renewal-date"
                className="create-claim-input"
                type="date"
                value={form.renewalDate}
                min={isRenewalMode ? undefined : getLocalToday()}
                readOnly={isRenewalMode}
                onChange={(event) =>
                  updateForm("renewalDate", event.target.value)
                }
              />

              <div className="create-claim-form-note">
                {isRenewalMode
                  ? "The scheduled renewal date is read-only."
                  : "Choose the date when this claim or authorization needs renewal."}
              </div>
            </div>

            {(isRejected || (isRenewalMode && form.rejectionReason)) && (
              <div className="create-claim-field create-claim-field-full">
                <label
                  className="create-claim-label"
                  htmlFor="claim-rejection-reason"
                >
                  Rejection Reason
                  {isRejected && !isRenewalMode ? " *" : ""}
                </label>

                <textarea
                  id="claim-rejection-reason"
                  className="create-claim-textarea"
                  value={form.rejectionReason}
                  readOnly={isRenewalMode}
                  onChange={(event) =>
                    updateForm("rejectionReason", event.target.value)
                  }
                  placeholder="Explain why the claim was rejected..."
                  required={isRejected && !isRenewalMode}
                />
              </div>
            )}

            {!isRenewalMode && !isEditing && isRejected && (
              <div className="create-claim-field create-claim-field-full">
                <label className="create-claim-alert-option">
                  <input
                    type="checkbox"
                    checked={createRejectionAlert}
                    onChange={(event) =>
                      setCreateRejectionAlert(event.target.checked)
                    }
                  />
                  <span>
                    <span className="create-claim-alert-title">
                      Create rejection alert
                    </span>
                    <div className="create-claim-alert-description">
                      Create an alert for the rejected claim after it is saved.
                    </div>
                  </span>
                </label>
              </div>
            )}

            {!isRenewalMode && !isEditing && (
              <div className="create-claim-field create-claim-field-full">
                <label className="create-claim-alert-option">
                  <input
                    type="checkbox"
                    checked={createRenewalAlert}
                    onChange={(event) =>
                      setCreateRenewalAlert(event.target.checked)
                    }
                  />
                  <span>
                    <span className="create-claim-alert-title">
                      Create renewal alert
                    </span>
                    <div className="create-claim-alert-description">
                      Schedule a reminder for the renewal date entered above.
                    </div>
                  </span>
                </label>
              </div>
            )}
          </div>

          <div className="create-claim-form-footer">
            <div className="create-claim-footer-note">
              {isRenewalMode
                ? "This action updates the linked claim record."
                : isEditing
                  ? "Your changes will be saved to the existing claim."
                  : "Check the claim information before submitting."}
            </div>

            <div className="create-claim-footer-actions">
              <button
                type="button"
                className="create-claim-button create-claim-button-secondary"
                onClick={resetForm}
                disabled={saving}
              >
                {isRenewalMode
                  ? "Reset Details"
                  : isEditing
                    ? "Reset Changes"
                    : "Reset Form"}
              </button>

              <button
                type="submit"
                className="create-claim-button create-claim-button-primary"
                disabled={saving || loadingPatients}
              >
                {saving
                  ? "Saving..."
                  : isRenewalMode
                    ? "Submit Renewal"
                    : isEditing
                      ? "Save Changes"
                      : "Create Claim"}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
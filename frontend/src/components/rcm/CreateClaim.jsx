
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

const styles = `
.create-claim-page{width:100%;min-width:0;color:#172b4d;font-family:inherit;font-size:15px}
.create-claim-header{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;margin-bottom:24px}
.create-claim-title{margin:0;font-size:29px;font-weight:800;letter-spacing:-.5px;color:#172b4d}
.create-claim-subtitle{margin:8px 0 0;color:#64748b;font-size:15px;line-height:1.6}
.create-claim-card{background:#fff;border:1px solid #dce4ef;border-radius:17px;padding:26px;margin-bottom:22px;box-shadow:0 5px 20px rgba(25,42,70,.05);min-width:0}
.create-claim-section-heading{display:flex;align-items:center;gap:13px;margin-bottom:22px}
.create-claim-section-number{width:42px;height:42px;border-radius:12px;background:#eef2ff;color:#4057cf;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:800;flex-shrink:0}
.create-claim-section-title{margin:0;font-size:20px;font-weight:800}
.create-claim-section-description{margin:5px 0 0;font-size:14px;color:#64748b;line-height:1.5}
.create-claim-label{display:block;margin-bottom:9px;font-size:15px;font-weight:750;color:#334155}
.create-claim-search-box{display:flex;align-items:center;gap:12px;width:100%;min-height:54px;padding:0 15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:12px;box-sizing:border-box}
.create-claim-search-box:focus-within{background:#fff;border-color:#5368d7;box-shadow:0 0 0 3px rgba(83,104,215,.12)}
.create-claim-search-icon{font-size:22px;color:#64748b;flex-shrink:0}
.create-claim-search-input{border:0!important;outline:0!important;box-shadow:none!important;background:transparent!important;width:100%;min-width:0;padding:13px 0!important;color:#172b4d;font-size:16px}
.create-claim-search-input::placeholder,.create-claim-input::placeholder,.create-claim-textarea::placeholder{color:#94a3b8}
.create-claim-search-meta{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;color:#64748b;font-size:13px;margin-top:10px}
.create-claim-results{display:flex;flex-direction:column;gap:11px;width:100%;margin-top:15px;padding:14px;box-sizing:border-box;border:1px solid #dce4ef;border-radius:14px;background:#f7f9fd}
.create-claim-results-heading{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;padding:3px 3px 9px;color:#475569;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.4px}
.create-claim-result{display:flex;align-items:center;justify-content:space-between;gap:15px;flex-wrap:wrap;padding:17px;background:#fff;border:1px solid #dbe3ee;border-radius:12px}
.create-claim-result:hover{border-color:#a8b6ed;background:#fcfcff}
.create-claim-result.selected{border-color:#6678db;background:#f2f4ff}
.create-claim-patient-info{display:flex;align-items:center;gap:13px;flex:1 1 240px;min-width:0}
.create-claim-avatar{width:48px;height:48px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border-radius:13px;background:#e9edff;color:#4057cf;font-weight:800;font-size:16px}
.create-claim-patient-details{min-width:0}
.create-claim-patient-name{margin:0;color:#172b4d;font-size:16px;font-weight:800;overflow-wrap:anywhere}
.create-claim-patient-meta{display:flex;flex-wrap:wrap;gap:7px 14px;margin-top:7px;color:#64748b;font-size:13px}
.create-claim-patient-meta span{overflow-wrap:anywhere}
.create-claim-result-actions{display:flex;flex-wrap:wrap;align-items:center;gap:9px}
.create-claim-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:43px;padding:10px 15px;border:1px solid transparent;border-radius:10px;font-size:14px;font-weight:750;cursor:pointer;white-space:nowrap}
.create-claim-button:disabled{opacity:.55;cursor:not-allowed}
.create-claim-button-primary{background:#4057cf;color:#fff}
.create-claim-button-primary:hover:not(:disabled){background:#3349bd}
.create-claim-button-secondary{color:#334155;background:#fff;border-color:#cbd5e1}
.create-claim-button-secondary:hover:not(:disabled){background:#f1f5f9}
.create-claim-button-light{color:#4057cf;background:#eef2ff;border-color:#dce3ff}
.create-claim-selected{display:flex;align-items:flex-start;justify-content:space-between;gap:15px;flex-wrap:wrap;padding:17px;margin-top:17px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:13px}
.create-claim-selected-label{color:#15803d;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
.create-claim-selected-name{color:#166534;font-size:17px;font-weight:800;overflow-wrap:anywhere}
.create-claim-selected-meta{color:#4b7c5b;font-size:13px;margin-top:6px}
.create-claim-selected-actions{display:flex;gap:9px;flex-wrap:wrap}
.create-claim-empty{text-align:center;padding:28px 14px;border:1px dashed #cbd5e1;border-radius:12px;background:#fff;color:#64748b;font-size:14px}
.create-claim-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:21px}
.create-claim-field{min-width:0}
.create-claim-field-full{grid-column:1/-1}
.create-claim-input,.create-claim-select,.create-claim-textarea{display:block;box-sizing:border-box;width:100%;min-height:50px;padding:12px 14px;border:1px solid #cbd5e1;border-radius:11px;background:#fff;color:#172b4d;outline:none;font:inherit;font-size:15px}
.create-claim-input:focus,.create-claim-select:focus,.create-claim-textarea:focus{border-color:#5368d7;box-shadow:0 0 0 3px rgba(83,104,215,.11)}
.create-claim-textarea{min-height:105px;resize:vertical}
.create-claim-form-note{margin-top:8px;color:#64748b;font-size:13px;line-height:1.5}
.create-claim-alert-option{display:flex;align-items:flex-start;gap:13px;padding:17px;border:1px solid #c7d2fe;background:#f5f7ff;border-radius:13px;cursor:pointer}
.create-claim-alert-option input{margin-top:4px;accent-color:#4057cf;width:19px;height:19px;flex-shrink:0}
.create-claim-alert-title{font-size:15px;font-weight:800;color:#273c9b}
.create-claim-alert-description{margin-top:5px;font-size:13px;color:#475569;line-height:1.6}
.create-claim-message{padding:14px 16px;margin-bottom:17px;border-radius:11px;font-size:14px;line-height:1.6;overflow-wrap:anywhere}
.create-claim-error{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c}
.create-claim-success{background:#f0fdf4;border:1px solid #bbf7d0;color:#166534}
.create-claim-form-footer{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;padding-top:22px;margin-top:22px;border-top:1px solid #e9eef5}
.create-claim-footer-note{font-size:13px;color:#64748b;line-height:1.6}
.create-claim-footer-actions{display:flex;gap:10px;flex-wrap:wrap}
.create-claim-creator{margin-top:8px;color:#475569}
@media(max-width:700px){
.create-claim-card{padding:17px;border-radius:14px}
.create-claim-title{font-size:25px}
.create-claim-form-grid{grid-template-columns:minmax(0,1fr);gap:17px}
.create-claim-field-full{grid-column:auto}
.create-claim-result{align-items:stretch}
.create-claim-result-actions{width:100%}
.create-claim-result-actions .create-claim-button{flex:1 1 auto}
.create-claim-selected-actions{width:100%}
.create-claim-selected-actions .create-claim-button{flex:1 1 auto}
.create-claim-form-footer{align-items:stretch;flex-direction:column}
.create-claim-footer-actions{width:100%}
.create-claim-footer-actions .create-claim-button{flex:1 1 auto}
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
  if (!user) return "";

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
    return "Network error: the server could not be reached. Check the backend and CORS settings, then try again.";
  }

  return err?.message || "The request failed. Please check the information and try again.";
}

export default function CreateClaim({
  patient: initialPatient,
  onClose,
  onClaimCreated,
  onCreateAlert,
}) {
  const navigate = useNavigate();

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

  const [form, setForm] = useState({
    claimId: "",
    status: "Pending",
    rejectionReason: "",
    renewalDate: "",
  });

  useEffect(() => {
    let active = true;

    async function loadPatients() {
      setLoadingPatients(true);

      try {
        const response = await api.get("patients/");
        if (active) setPatients(getPatientList(response));
      } catch (err) {
        if (active) setError(getApiError(err));
      } finally {
        if (active) setLoadingPatients(false);
      }
    }

    loadPatients();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      try {
        const response = await api.get("users/me/");
        if (active) setCurrentUser(response?.data || null);
      } catch (err) {
        console.error("Could not load the logged-in user:", err);
      }
    }

    loadCurrentUser();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setSelectedPatient(initialPatient || null);
  }, [initialPatient]);

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];

    return patients.filter((patient) => {
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
    }).slice(0, 10);
  }, [patients, search]);

  const isRejected = form.status.toLowerCase() === "rejected";

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function selectPatient(patient) {
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
    setForm({
      claimId: "",
      status: "Pending",
      rejectionReason: "",
      renewalDate: "",
    });
    setCreateRejectionAlert(false);
    setCreateRenewalAlert(false);
    setError("");
    setSuccess("");
    setCreatedClaim(null);
  }

  async function submitClaim(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setCreatedClaim(null);

    if (!selectedPatient) {
      setError("Please select a patient before creating the claim.");
      return;
    }

    if (!form.claimId.trim()) {
      setError("Please enter the claim number or reference.");
      return;
    }

    if (isRejected && !form.rejectionReason.trim()) {
      setError("Please enter the rejection reason.");
      return;
    }

    if (createRenewalAlert && !form.renewalDate) {
      setError("Please choose a renewal date before creating a renewal alert.");
      return;
    }

    if ((createRejectionAlert || createRenewalAlert) &&
        typeof onCreateAlert !== "function") {
      setError(
        "Alert creation is not connected to the parent component yet. The claim can still be created, but alerts cannot be saved until the alert handler is connected."
      );
      return;
    }

    setSaving(true);

    try {
      const response = await api.post(
        "rcm/claims/",
        {
          patientId: selectedPatient.id,
          claimId: form.claimId.trim(),
          status: form.status,
          rejectionReason: form.rejectionReason.trim(),
          renewalDate: form.renewalDate || null,
        },
        { withCredentials: true }
      );

      const claim = response?.data || null;
      setCreatedClaim(claim);

      if (createRejectionAlert) {
        await onCreateAlert({
          alertType: "rejection",
          patient: selectedPatient,
          claim,
          claimId: form.claimId.trim(),
          rejectionReason: form.rejectionReason.trim(),
          renewalDate: null,
        });
      }

      if (createRenewalAlert) {
        await onCreateAlert({
          alertType: "renewal",
          patient: selectedPatient,
          claim,
          claimId: form.claimId.trim(),
          renewalDate: form.renewalDate,
          rejectionReason: "",
        });
      }

      setSuccess("Claim created successfully.");

      setForm({
        claimId: "",
        status: "Pending",
        rejectionReason: "",
        renewalDate: "",
      });

      setCreateRejectionAlert(false);
      setCreateRenewalAlert(false);

      if (typeof onClaimCreated === "function") {
        onClaimCreated(claim);
      }
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  const creatorName = getCreatorName(createdClaim) || getUserName(currentUser);

  return (
    <div className="create-claim-page">
      <style>{styles}</style>

      <div className="create-claim-header">
        <div>
          <h1 className="create-claim-title">Create New Claim</h1>
          <p className="create-claim-subtitle">
            Search for a patient, enter claim details, and optionally schedule a renewal reminder.
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
              Created by: <strong>{creatorName}</strong>
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
              Search by patient name, file number, phone number, or patient ID.
            </p>
          </div>
        </div>

        <label className="create-claim-label" htmlFor="claim-patient-search">
          Search patients
        </label>

        <div className="create-claim-search-box">
          <span className="create-claim-search-icon" aria-hidden="true">⌕</span>
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
                  {filteredPatients.length} result{filteredPatients.length === 1 ? "" : "s"}
                  {filteredPatients.length === 10 ? " · Showing first 10" : ""}
                </span>
              )}
            </div>

            {loadingPatients ? (
              <div className="create-claim-empty">Loading patient records...</div>
            ) : filteredPatients.length === 0 ? (
              <div className="create-claim-empty">
                No matching patients found. Try a different search term.
              </div>
            ) : (
              filteredPatients.map((patient) => {
                const name = getPatientName(patient);
                const isSelected = selectedPatient?.id === patient.id;

                return (
                  <div
                    className={`create-claim-result${isSelected ? " selected" : ""}`}
                    key={patient.id}
                  >
                    <div className="create-claim-patient-info">
                      <div className="create-claim-avatar">{getInitials(name)}</div>
                      <div className="create-claim-patient-details">
                        <p className="create-claim-patient-name">{name}</p>
                        <div className="create-claim-patient-meta">
                          <span>File No: {getPatientNumber(patient)}</span>
                          {getPatientPhone(patient) && (
                            <span>Phone: {getPatientPhone(patient)}</span>
                          )}
                          {patient?.gender && <span>Gender: {patient.gender}</span>}
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

        {selectedPatient && (
          <div className="create-claim-selected">
            <div>
              <div className="create-claim-selected-label">✓ Patient selected</div>
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
            </div>
          </div>
        )}
      </section>

      <section className="create-claim-card">
        <div className="create-claim-section-heading">
          <div className="create-claim-section-number">2</div>
          <div>
            <h2 className="create-claim-section-title">Claim Details</h2>
            <p className="create-claim-section-description">
              Enter the claim reference, status, and renewal information.
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
                onChange={(event) => updateForm("claimId", event.target.value)}
                placeholder="Enter claim number or reference"
                required
              />
              <div className="create-claim-form-note">
                Enter the reference used by your RCM team.
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
                onChange={(event) => {
                  const status = event.target.value;
                  setForm((current) => ({
                    ...current,
                    status,
                    rejectionReason: status === "Rejected" ? current.rejectionReason : "",
                  }));
                  if (status !== "Rejected") setCreateRejectionAlert(false);
                }}
                required
              >
                <option value="Pending">Pending</option>
                <option value="Submitted">Submitted</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
              <div className="create-claim-form-note">
                Choose the current status of the claim.
              </div>
            </div>

            <div className="create-claim-field">
              <label className="create-claim-label" htmlFor="claim-renewal-date">
                Renewal Date
              </label>
              <input
                id="claim-renewal-date"
                className="create-claim-input"
                type="date"
                value={form.renewalDate}
                min={new Date().toLocaleDateString("en-CA")}
                onChange={(event) => updateForm("renewalDate", event.target.value)}
              />
              <div className="create-claim-form-note">
                Choose the date when this claim or authorization needs renewal.
              </div>
            </div>

            {isRejected && (
              <div className="create-claim-field create-claim-field-full">
                <label className="create-claim-label" htmlFor="claim-rejection-reason">
                  Rejection Reason *
                </label>
                <textarea
                  id="claim-rejection-reason"
                  className="create-claim-textarea"
                  value={form.rejectionReason}
                  onChange={(event) => updateForm("rejectionReason", event.target.value)}
                  placeholder="Explain why the claim was rejected..."
                  required
                />
              </div>
            )}

            {isRejected && (
              <div className="create-claim-field create-claim-field-full">
                <label className="create-claim-alert-option">
                  <input
                    type="checkbox"
                    checked={createRejectionAlert}
                    onChange={(event) => setCreateRejectionAlert(event.target.checked)}
                  />
                  <span>
                    <span className="create-claim-alert-title">Create rejection alert</span>
                    <span className="create-claim-alert-description" style={{ display: "block" }}>
                      Request an alert for this rejected claim through the connected alert handler.
                    </span>
                  </span>
                </label>
              </div>
            )}

            <div className="create-claim-field create-claim-field-full">
              <label className="create-claim-alert-option">
                <input
                  type="checkbox"
                  checked={createRenewalAlert}
                  onChange={(event) => setCreateRenewalAlert(event.target.checked)}
                />
                <span>
                  <span className="create-claim-alert-title">Create renewal reminder</span>
                  <span className="create-claim-alert-description" style={{ display: "block" }}>
                    Request a reminder for the selected renewal date. Choose a renewal date above before submitting.
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div className="create-claim-form-footer">
            <div className="create-claim-footer-note">
              * Required fields
              {!selectedPatient && <span> · Select a patient before submitting.</span>}
            </div>
            <div className="create-claim-footer-actions">
              <button
                type="button"
                className="create-claim-button create-claim-button-secondary"
                onClick={resetForm}
                disabled={saving}
              >
                Reset Form
              </button>
              <button
                type="submit"
                className="create-claim-button create-claim-button-primary"
                disabled={saving || !selectedPatient}
              >
                {saving ? "Creating Claim..." : "＋ Create Claim"}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}


import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

const styles = `
.create-claim-page {
  width: 100%;
  min-width: 0;
  color: #172b4d;
  font-family: inherit;
}

.create-claim-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 22px;
}

.create-claim-title {
  margin: 0;
  font-size: 25px;
  font-weight: 750;
  letter-spacing: -0.5px;
  color: #172b4d;
}

.create-claim-subtitle {
  margin: 7px 0 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.5;
}

.create-claim-card {
  background: #fff;
  border: 1px solid #e3e9f2;
  border-radius: 16px;
  padding: 23px;
  margin-bottom: 20px;
  box-shadow: 0 5px 18px rgba(25, 42, 70, 0.045);
  min-width: 0;
  overflow: visible;
}

.create-claim-section-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.create-claim-section-number {
  width: 36px;
  height: 36px;
  border-radius: 11px;
  background: #eef2ff;
  color: #4057cf;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 800;
  flex-shrink: 0;
}

.create-claim-section-title {
  margin: 0;
  font-size: 17px;
  font-weight: 750;
}

.create-claim-section-description {
  margin: 4px 0 0;
  font-size: 13px;
  color: #64748b;
}

.create-claim-search-wrap {
  width: 100%;
  min-width: 0;
}

.create-claim-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.create-claim-search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 49px;
  padding: 0 14px;
  background: #f8fafc;
  border: 1px solid #dbe3ee;
  border-radius: 11px;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.create-claim-search-box:focus-within {
  background: #fff;
  border-color: #5368d7;
  box-shadow: 0 0 0 3px rgba(83, 104, 215, 0.12);
}

.create-claim-search-icon {
  font-size: 18px;
  color: #64748b;
  flex-shrink: 0;
}

.create-claim-search-input {
  border: 0 !important;
  outline: 0 !important;
  box-shadow: none !important;
  background: transparent !important;
  width: 100%;
  min-width: 0;
  padding: 12px 0 !important;
  color: #172b4d;
  font-size: 14px;
}

.create-claim-search-input::placeholder {
  color: #94a3b8;
}

.create-claim-search-meta {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  color: #64748b;
  font-size: 12px;
  margin-top: 9px;
}

.create-claim-results {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  margin-top: 13px;
  padding: 12px;
  box-sizing: border-box;
  border: 1px solid #dce4ef;
  border-radius: 13px;
  background: #f8faff;
}

.create-claim-results-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 2px 2px 7px;
  color: #475569;
  font-size: 12px;
  font-weight: 750;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.create-claim-result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  padding: 15px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 11px;
  transition: border-color 0.2s, background 0.2s;
}

.create-claim-result:hover {
  border-color: #a8b6ed;
  background: #fcfcff;
}

.create-claim-result.selected {
  border-color: #6678db;
  background: #f2f4ff;
}

.create-claim-patient-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1 1 220px;
  min-width: 0;
}

.create-claim-avatar {
  width: 43px;
  height: 43px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 12px;
  background: #e9edff;
  color: #4057cf;
  font-weight: 800;
  font-size: 15px;
}

.create-claim-patient-details {
  min-width: 0;
}

.create-claim-patient-name {
  margin: 0;
  color: #172b4d;
  font-size: 14px;
  font-weight: 750;
  overflow-wrap: anywhere;
}

.create-claim-patient-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  margin-top: 6px;
  color: #64748b;
  font-size: 12px;
}

.create-claim-patient-meta span {
  overflow-wrap: anywhere;
}

.create-claim-result-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  flex: 0 1 auto;
}

.create-claim-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 39px;
  padding: 9px 13px;
  border: 1px solid transparent;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 750;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s, border-color 0.2s, transform 0.1s;
}

.create-claim-button:active {
  transform: translateY(1px);
}

.create-claim-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.create-claim-button-primary {
  background: #4057cf;
  color: #fff;
}

.create-claim-button-primary:hover:not(:disabled) {
  background: #3349bd;
}

.create-claim-button-secondary {
  color: #334155;
  background: #fff;
  border-color: #d7dfeb;
}

.create-claim-button-secondary:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #aebbd0;
}

.create-claim-button-light {
  color: #4057cf;
  background: #eef2ff;
  border-color: #dce3ff;
}

.create-claim-selected {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  padding: 15px;
  margin-top: 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
}

.create-claim-selected-label {
  color: #15803d;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 5px;
}

.create-claim-selected-name {
  color: #166534;
  font-size: 15px;
  font-weight: 750;
  overflow-wrap: anywhere;
}

.create-claim-selected-meta {
  color: #4b7c5b;
  font-size: 12px;
  margin-top: 5px;
}

.create-claim-selected-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.create-claim-empty {
  text-align: center;
  padding: 25px 14px;
  border: 1px dashed #cbd5e1;
  border-radius: 11px;
  background: #fff;
  color: #64748b;
  font-size: 13px;
}

.create-claim-empty-icon {
  font-size: 23px;
  margin-bottom: 7px;
}

.create-claim-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.create-claim-field {
  min-width: 0;
}

.create-claim-field-full {
  grid-column: 1 / -1;
}

.create-claim-input,
.create-claim-select,
.create-claim-textarea {
  display: block;
  box-sizing: border-box;
  width: 100%;
  min-height: 45px;
  padding: 11px 13px;
  border: 1px solid #dbe3ee;
  border-radius: 10px;
  background: #fff;
  color: #172b4d;
  outline: none;
  font: inherit;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.create-claim-input:focus,
.create-claim-select:focus,
.create-claim-textarea:focus {
  border-color: #5368d7;
  box-shadow: 0 0 0 3px rgba(83, 104, 215, 0.11);
}

.create-claim-input::placeholder,
.create-claim-textarea::placeholder {
  color: #94a3b8;
}

.create-claim-textarea {
  min-height: 90px;
  resize: vertical;
}

.create-claim-form-note {
  margin-top: 7px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.5;
}

.create-claim-alert-option {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 15px;
  border: 1px solid #f5d7a1;
  background: #fffbeb;
  border-radius: 11px;
}

.create-claim-alert-option input {
  margin-top: 3px;
  accent-color: #b7791f;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.create-claim-alert-title {
  font-size: 13px;
  font-weight: 750;
  color: #854d0e;
}

.create-claim-alert-description {
  margin-top: 4px;
  font-size: 12px;
  color: #92400e;
  line-height: 1.5;
}

.create-claim-message {
  padding: 12px 14px;
  margin-bottom: 16px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.create-claim-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}

.create-claim-success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.create-claim-form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 20px;
  margin-top: 20px;
  border-top: 1px solid #e9eef5;
}

.create-claim-footer-note {
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
}

.create-claim-footer-actions {
  display: flex;
  gap: 9px;
  flex-wrap: wrap;
}

@media (max-width: 700px) {
  .create-claim-card {
    padding: 16px;
    border-radius: 13px;
  }

  .create-claim-title {
    font-size: 22px;
  }

  .create-claim-form-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 15px;
  }

  .create-claim-field-full {
    grid-column: auto;
  }

  .create-claim-result {
    align-items: stretch;
  }

  .create-claim-result-actions {
    width: 100%;
  }

  .create-claim-result-actions .create-claim-button {
    flex: 1 1 auto;
  }

  .create-claim-selected-actions {
    width: 100%;
  }

  .create-claim-selected-actions .create-claim-button {
    flex: 1 1 auto;
  }

  .create-claim-form-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .create-claim-footer-actions {
    width: 100%;
  }

  .create-claim-footer-actions .create-claim-button {
    flex: 1 1 auto;
  }
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

  const parts = [
    patient.first_name || patient.firstName,
    patient.middle_name || patient.middleName,
    patient.last_name || patient.lastName,
  ].filter(Boolean);

  return parts.join(" ") || "Unknown Patient";
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

export default function CreateClaim({
  patient: initialPatient,
  onClose,
  onClaimCreated,
  onCreateAlert,
}) {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(
    initialPatient || null
  );
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createRejectionAlert, setCreateRejectionAlert] = useState(false);

  const [form, setForm] = useState({
    claimId: "",
    status: "Pending",
    rejectionReason: "",
  });

  useEffect(() => {
    let active = true;

    async function loadPatients() {
      setLoadingPatients(true);

      try {
        const response = await api.get("patients/");

        if (active) {
          setPatients(getPatientList(response));
        }
      } catch (err) {
        if (active) {
          setError(
            err?.response?.data?.detail ||
              err?.response?.data?.message ||
              "Unable to load patients. Please try again."
          );
        }
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
    setSelectedPatient(initialPatient || null);
  }, [initialPatient]);

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return [];

    return patients
      .filter((patient) => {
        const searchableValues = [
          getPatientName(patient),
          getPatientNumber(patient),
          getPatientPhone(patient),
          patient?.national_id,
          patient?.nationalId,
          patient?.emirates_id,
          patient?.emiratesId,
          patient?.id,
        ];

        return searchableValues.some((value) =>
          String(value ?? "").toLowerCase().includes(term)
        );
      })
      .slice(0, 10);
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
    });
    setCreateRejectionAlert(false);
    setError("");
    setSuccess("");
  }

  async function submitClaim(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

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

    if (createRejectionAlert && typeof onCreateAlert !== "function") {
      setError(
        "The rejection alert option is selected, but alert creation is not connected yet. Please uncheck it or connect the existing alert handler."
      );
      return;
    }

    setSaving(true);

    try {
      const response = await api.post("rcm/claims/", {
        patientId: selectedPatient.id,
        claimId: form.claimId.trim(),
        status: form.status,
        rejectionReason: form.rejectionReason.trim(),
      });

      if (createRejectionAlert && typeof onCreateAlert === "function") {
        await onCreateAlert({
          patient: selectedPatient,
          claim: response?.data,
          claimId: form.claimId.trim(),
          rejectionReason: form.rejectionReason.trim(),
        });
      }

      setSuccess("Claim created successfully.");
      setForm({
        claimId: "",
        status: "Pending",
        rejectionReason: "",
      });
      setCreateRejectionAlert(false);

      if (typeof onClaimCreated === "function") {
        onClaimCreated(response?.data);
      }
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          (typeof err?.response?.data === "string"
            ? err.response.data
            : null) ||
          "Could not create the claim. Please check the information and try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="create-claim-page">
      <style>{styles}</style>

      <div className="create-claim-header">
        <div>
          <h1 className="create-claim-title">Create New Claim</h1>
          <p className="create-claim-subtitle">
            Find a patient, select their record, and complete the claim details
            below.
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
        <div
          className="create-claim-message create-claim-success"
          role="status"
        >
          {success}
        </div>
      )}

      <section className="create-claim-card">
        <div className="create-claim-section-heading">
          <div className="create-claim-section-number">1</div>
          <div>
            <h2 className="create-claim-section-title">Select Patient</h2>
            <p className="create-claim-section-description">
              Search by patient name, file number, phone number, or ID.
            </p>
          </div>
        </div>

        <div className="create-claim-search-wrap">
          <label className="create-claim-label" htmlFor="claim-patient-search">
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
            <span>Search results appear below the search field.</span>
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
                  <div className="create-claim-empty-icon">⌕</div>
                  <strong>No matching patients found</strong>
                  <div style={{ marginTop: 6 }}>
                    Try another name, phone number, file number, or ID.
                  </div>
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
                        <div className="create-claim-avatar">
                          {getInitials(name)}
                        </div>

                        <div className="create-claim-patient-details">
                          <p className="create-claim-patient-name">{name}</p>
                          <div className="create-claim-patient-meta">
                            <span>
                              File No: {getPatientNumber(patient)}
                            </span>
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
                <button
                  type="button"
                  className="create-claim-button create-claim-button-light"
                  onClick={() => {
                    setSelectedPatient(null);
                    setSearch("");
                    setShowResults(false);
                    setError("");
                    setSuccess("");
                  }}
                >
                  Change Patient
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="create-claim-card">
        <div className="create-claim-section-heading">
          <div className="create-claim-section-number">2</div>
          <div>
            <h2 className="create-claim-section-title">Claim Details</h2>
            <p className="create-claim-section-description">
              Enter the claim information. This form stays visible whether or
              not a patient has been selected.
            </p>
          </div>
        </div>

        {!selectedPatient && (
          <div
            className="create-claim-message"
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              color: "#64748b",
            }}
          >
            Select a patient above to enable claim creation. You can complete
            the claim fields while the form remains visible.
          </div>
        )}

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
                onChange={(event) =>
                  updateForm("claimId", event.target.value)
                }
                placeholder="Enter claim number or reference"
                required
              />
              <div className="create-claim-form-note">
                Enter the claim reference used by your RCM team.
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
                  updateForm("status", event.target.value);
                  if (event.target.value !== "Rejected") {
                    updateForm("rejectionReason", "");
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
                Choose the current status of the claim.
              </div>
            </div>

            {isRejected && (
              <>
                <div className="create-claim-field create-claim-field-full">
                  <label
                    className="create-claim-label"
                    htmlFor="claim-rejection-reason"
                  >
                    Rejection Reason *
                  </label>
                  <textarea
                    id="claim-rejection-reason"
                    className="create-claim-textarea"
                    value={form.rejectionReason}
                    onChange={(event) =>
                      updateForm("rejectionReason", event.target.value)
                    }
                    placeholder="Explain why the claim was rejected..."
                    required
                  />
                </div>

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
                      <span className="create-claim-alert-description" style={{ display: "block" }}>
                        Request an alert through the existing alert handler
                        when the claim is created. This option requires
                        <code> onCreateAlert </code> to be connected by the
                        parent component.
                      </span>
                    </span>
                  </label>
                </div>
              </>
            )}
          </div>

          <div className="create-claim-form-footer">
            <div className="create-claim-footer-note">
              * Required fields
              {!selectedPatient && (
                <span> · Select a patient before submitting.</span>
              )}
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

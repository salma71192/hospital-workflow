
import React, { useState } from "react";
import api from "../../api/api";

export default function ClaimsManagement() {
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [openedPatient, setOpenedPatient] = useState(null);

  const [claims, setClaims] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [claimId, setClaimId] = useState("");
  const [claimStatus, setClaimStatus] = useState("Approved");
  const [rejectionReason, setRejectionReason] = useState("");
  const [renewalDate, setRenewalDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const searchPatients = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSelectedPatient(null);
    setOpenedPatient(null);

    if (!search.trim()) {
      setError("Enter a patient name or file number.");
      setPatients([]);
      return;
    }

    setLoading(true);

    try {
      const response = await api.get(
        `patients/?search=${encodeURIComponent(search.trim())}`
      );

      const results = response.data.patients || [];
      setPatients(results);

      if (!results.length) {
        setMessage("No patients found. Check the name or file number.");
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to search patients. Please try again."
      );
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearch("");
    setPatients([]);
    setSelectedPatient(null);
    setOpenedPatient(null);
    setError("");
    setMessage("");
  };

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setOpenedPatient(null);
    setError("");
    setMessage("");
  };

  const openPatientFile = () => {
    if (!selectedPatient) {
      setError("Please select a patient first.");
      return;
    }

    setOpenedPatient(selectedPatient);
    setClaimId("");
    setClaimStatus("Approved");
    setRejectionReason("");
    setRenewalDate("");
    setError("");
    setMessage("");
  };

  const addClaim = (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!openedPatient) {
      setError("Open a patient file first.");
      return;
    }

    if (!claimId.trim()) {
      setError("Please enter the Claim ID.");
      return;
    }

    if (claimStatus === "Rejected" && !rejectionReason.trim()) {
      setError("Please enter the reason for rejection.");
      return;
    }

    const duplicate = claims.some(
      (claim) =>
        String(claim.patientId) === String(openedPatient.id) &&
        claim.claimId.trim().toLowerCase() ===
          claimId.trim().toLowerCase()
    );

    if (duplicate) {
      setError("This Claim ID has already been added for this patient.");
      return;
    }

    const newClaim = {
      id: `${Date.now()}-${Math.random()}`,
      patientId: openedPatient.id,
      claimId: claimId.trim(),
      status: claimStatus,
      rejectionReason:
        claimStatus === "Rejected" ? rejectionReason.trim() : "",
      createdAt: new Date().toISOString(),
    };

    setClaims((previous) => [newClaim, ...previous]);
    setClaimId("");
    setClaimStatus("Approved");
    setRejectionReason("");
    setMessage("Claim added to the current workspace.");
  };

  const addRenewalAlert = (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!openedPatient) {
      setError("Open a patient file first.");
      return;
    }

    if (!renewalDate) {
      setError("Please select a renewal date.");
      return;
    }

    const newAlert = {
      id: `${Date.now()}-${Math.random()}`,
      patientId: openedPatient.id,
      patientName: openedPatient.name,
      patientFileNumber: openedPatient.patient_id || "",
      renewalDate,
      createdAt: new Date().toISOString(),
    };

    setAlerts((previous) => [newAlert, ...previous]);
    setRenewalDate("");
    setMessage("Renewal alert added to the current workspace.");
  };

  const patientClaims = openedPatient
    ? claims.filter(
        (claim) =>
          String(claim.patientId) === String(openedPatient.id)
      )
    : [];

  const patientAlerts = openedPatient
    ? alerts.filter(
        (alert) =>
          String(alert.patientId) === String(openedPatient.id)
      )
    : [];

  const formatDate = (value) => {
    if (!value) return "-";

    return new Date(`${value}T00:00:00`).toLocaleDateString();
  };

  return (
    <div className="rcm-claims">
      <style>{`
        .rcm-claims {
          --navy: #172c46;
          --blue: #3478f6;
          --text: #233750;
          --muted: #7a8ba0;
          --border: #e5ebf3;
          color: var(--text);
          font-family: Inter, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
        }

        .rcm-claims * {
          box-sizing: border-box;
        }

        .rcm-claims button,
        .rcm-claims input,
        .rcm-claims select,
        .rcm-claims textarea {
          font: inherit;
        }

        .rcm-claims-header {
          margin-bottom: 24px;
        }

        .rcm-claims-eyebrow {
          margin-bottom: 9px;
          color: var(--blue);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.4px;
        }

        .rcm-claims-header h2 {
          margin: 0;
          color: var(--navy);
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.7px;
        }

        .rcm-claims-header p {
          margin: 9px 0 0;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.7;
        }

        .rcm-claims-panel {
          margin-bottom: 22px;
          padding: 25px;
          border: 1px solid var(--border);
          border-radius: 19px;
          background: #fff;
          box-shadow: 0 4px 14px rgba(28, 49, 77, 0.025);
        }

        .rcm-claims-panel-title {
          margin: 0 0 7px;
          color: var(--navy);
          font-size: 19px;
          font-weight: 800;
        }

        .rcm-claims-panel-description {
          margin: 0 0 20px;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.6;
        }

        .rcm-claims-search-form {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto auto;
          gap: 10px;
        }

        .rcm-claims-input,
        .rcm-claims-select,
        .rcm-claims-textarea {
          width: 100%;
          min-width: 0;
          padding: 12px 13px;
          border: 1px solid #d8e1ed;
          border-radius: 10px;
          outline: none;
          background: #fff;
          color: var(--text);
          font-size: 14px;
        }

        .rcm-claims-input:focus,
        .rcm-claims-select:focus,
        .rcm-claims-textarea:focus {
          border-color: var(--blue);
          box-shadow: 0 0 0 3px rgba(52, 120, 246, 0.1);
        }

        .rcm-claims-textarea {
          min-height: 95px;
          resize: vertical;
        }

        .rcm-claims-primary,
        .rcm-claims-secondary,
        .rcm-claims-open {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 43px;
          padding: 0 17px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 750;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }

        .rcm-claims-primary,
        .rcm-claims-open {
          border: 1px solid var(--blue);
          background: var(--blue);
          color: white;
        }

        .rcm-claims-primary:hover,
        .rcm-claims-open:hover {
          background: #2563d9;
        }

        .rcm-claims-secondary {
          border: 1px solid var(--border);
          background: #fff;
          color: var(--navy);
        }

        .rcm-claims-secondary:hover {
          background: #f2f6fc;
        }

        .rcm-claims-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .rcm-claims-results {
          display: grid;
          gap: 12px;
          margin-top: 20px;
        }

        .rcm-claims-patient {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 17px;
          border: 1px solid var(--border);
          border-radius: 13px;
          background: white;
          transition: border-color 0.2s, background 0.2s;
        }

        .rcm-claims-patient.selected {
          border-color: var(--blue);
          background: #f4f8ff;
        }

        .rcm-claims-patient-info {
          display: flex;
          align-items: flex-start;
          gap: 13px;
          min-width: 0;
        }

        .rcm-claims-patient-radio {
          width: 18px;
          height: 18px;
          margin-top: 3px;
          flex-shrink: 0;
          accent-color: var(--blue);
          cursor: pointer;
        }

        .rcm-claims-patient-name {
          margin-bottom: 7px;
          color: var(--navy);
          font-size: 15px;
          font-weight: 800;
        }

        .rcm-claims-patient-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 7px 16px;
          color: var(--muted);
          font-size: 12px;
          line-height: 1.6;
        }

        .rcm-claims-selected-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 18px;
        }

        .rcm-claims-notice {
          margin-top: 15px;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 13px;
          line-height: 1.6;
        }

        .rcm-claims-notice.error {
          border: 1px solid #fecaca;
          background: #fff1f2;
          color: #b91c1c;
        }

        .rcm-claims-notice.success {
          border: 1px solid #bbf7d0;
          background: #f0fdf4;
          color: #166534;
        }

        .rcm-claims-empty {
          padding: 20px;
          border: 1px dashed #d8e1ed;
          border-radius: 12px;
          background: #f8fafc;
          color: var(--muted);
          font-size: 13px;
          text-align: center;
        }

        .rcm-claims-patient-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 22px;
          padding: 20px;
          border: 1px solid #d9e6fb;
          border-radius: 15px;
          background: linear-gradient(110deg, #f3f7ff, #fff);
        }

        .rcm-claims-patient-banner h3 {
          margin: 0 0 6px;
          color: var(--navy);
          font-size: 19px;
          font-weight: 800;
        }

        .rcm-claims-patient-banner p {
          margin: 0;
          color: var(--muted);
          font-size: 12px;
          line-height: 1.7;
        }

        .rcm-claims-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 17px;
        }

        .rcm-claims-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .rcm-claims-field.full {
          grid-column: 1 / -1;
        }

        .rcm-claims-field label {
          color: var(--text);
          font-size: 12px;
          font-weight: 750;
        }

        .rcm-claims-field label span {
          color: #dc2626;
        }

        .rcm-claims-form-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .rcm-claims-status {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          padding: 5px 10px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 800;
        }

        .rcm-claims-status.approved {
          background: #dcfce7;
          color: #166534;
        }

        .rcm-claims-status.rejected {
          background: #fee2e2;
          color: #b91c1c;
        }

        .rcm-claims-table-wrap {
          overflow-x: auto;
          margin-top: 16px;
        }

        .rcm-claims-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          text-align: left;
        }

        .rcm-claims-table th {
          padding: 12px;
          border-bottom: 1px solid var(--border);
          background: #f8fafc;
          color: var(--muted);
          font-size: 10px;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .rcm-claims-table td {
          padding: 14px 12px;
          border-bottom: 1px solid #edf1f6;
          color: var(--text);
          vertical-align: top;
        }

        .rcm-claims-table tr:last-child td {
          border-bottom: none;
        }

        .rcm-claims-renewal-date {
          color: var(--navy);
          font-weight: 750;
          white-space: nowrap;
        }

        @media (max-width: 650px) {
          .rcm-claims-panel {
            padding: 18px;
          }

          .rcm-claims-search-form {
            grid-template-columns: 1fr 1fr;
          }

          .rcm-claims-search-form input {
            grid-column: 1 / -1;
          }

          .rcm-claims-patient {
            align-items: flex-start;
            flex-direction: column;
          }

          .rcm-claims-selected-actions {
            width: 100%;
          }

          .rcm-claims-selected-actions button {
            flex: 1;
          }

          .rcm-claims-patient-banner {
            align-items: flex-start;
            flex-direction: column;
          }

          .rcm-claims-form-grid {
            grid-template-columns: 1fr;
          }

          .rcm-claims-field.full {
            grid-column: auto;
          }
        }
      `}</style>

      <div className="rcm-claims-header">
        <div className="rcm-claims-eyebrow">
          REVENUE CYCLE MANAGEMENT
        </div>
        <h2>Claims Management</h2>
        <p>
          Search patient files, record claim decisions, and schedule renewal
          reminders.
        </p>
      </div>

      {/* STEP 1: SEARCH AND SELECT A PATIENT */}
      <section className="rcm-claims-panel">
        <h3 className="rcm-claims-panel-title">Find a Patient</h3>
        <p className="rcm-claims-panel-description">
          Search using the patient's name or file number, then select the
          correct patient.
        </p>

        <form
          className="rcm-claims-search-form"
          onSubmit={searchPatients}
        >
          <input
            className="rcm-claims-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Enter patient name or file number..."
            aria-label="Search by patient name or file number"
          />

          <button
            className="rcm-claims-primary"
            type="submit"
            disabled={loading}
          >
            {loading ? "Searching..." : "Search"}
          </button>

          <button
            className="rcm-claims-secondary"
            type="button"
            onClick={clearSearch}
          >
            Clear
          </button>
        </form>

        {patients.length > 0 && (
          <>
            <div className="rcm-claims-results">
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  className={`rcm-claims-patient ${
                    String(selectedPatient?.id) === String(patient.id)
                      ? "selected"
                      : ""
                  }`}
                >
                  <div className="rcm-claims-patient-info">
                    <input
                      className="rcm-claims-patient-radio"
                      type="radio"
                      name="selectedPatient"
                      checked={
                        String(selectedPatient?.id) === String(patient.id)
                      }
                      onChange={() => selectPatient(patient)}
                      aria-label={`Select ${patient.name}`}
                    />

                    <div>
                      <div className="rcm-claims-patient-name">
                        {patient.name || "Unnamed patient"}
                      </div>

                      <div className="rcm-claims-patient-meta">
                        <span>
                          File number: {patient.patient_id || "-"}
                        </span>
                        <span>
                          Approval number:{" "}
                          {patient.current_approval_number || "-"}
                        </span>
                        <span>
                          Approved sessions: {patient.approved_sessions ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rcm-claims-selected-actions">
              <button
                type="button"
                className="rcm-claims-secondary"
                onClick={() => {
                  if (!selectedPatient) {
                    setError("Select a patient from the list first.");
                    setMessage("");
                    return;
                  }
                  setError("");
                  setMessage(`Selected ${selectedPatient.name}.`);
                }}
              >
                Select Patient
              </button>

              <button
                type="button"
                className="rcm-claims-primary"
                onClick={openPatientFile}
              >
                Open Patient File →
              </button>
            </div>
          </>
        )}

        {error && (
          <div className="rcm-claims-notice error" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div className="rcm-claims-notice success" role="status">
            {message}
          </div>
        )}
      </section>

      {/* STEP 2: CLAIM AND RENEWAL WORKSPACE */}
      {openedPatient && (
        <>
          <section className="rcm-claims-patient-banner">
            <div>
              <div className="rcm-claims-eyebrow">PATIENT FILE OPENED</div>
              <h3>{openedPatient.name}</h3>
              <p>
                File number: {openedPatient.patient_id || "-"}
                {" · "}
                Approval number: {openedPatient.current_approval_number || "-"}
              </p>
            </div>

            <button
              type="button"
              className="rcm-claims-secondary"
              onClick={() => {
                setOpenedPatient(null);
                setError("");
                setMessage("");
              }}
            >
              Close File
            </button>
          </section>

          <section className="rcm-claims-panel">
            <h3 className="rcm-claims-panel-title">Add Claim Record</h3>
            <p className="rcm-claims-panel-description">
              Record the claim ID and its approval status.
            </p>

            <form onSubmit={addClaim}>
              <div className="rcm-claims-form-grid">
                <div className="rcm-claims-field">
                  <label htmlFor="rcm-claim-id">
                    Claim ID <span>*</span>
                  </label>
                  <input
                    id="rcm-claim-id"
                    className="rcm-claims-input"
                    value={claimId}
                    onChange={(e) => setClaimId(e.target.value)}
                    placeholder="Enter claim ID"
                    required
                  />
                </div>

                <div className="rcm-claims-field">
                  <label htmlFor="rcm-claim-status">
                    Claim Status <span>*</span>
                  </label>
                  <select
                    id="rcm-claim-status"
                    className="rcm-claims-select"
                    value={claimStatus}
                    onChange={(e) => setClaimStatus(e.target.value)}
                  >
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                {claimStatus === "Rejected" && (
                  <div className="rcm-claims-field full">
                    <label htmlFor="rcm-rejection-reason">
                      Reason for Rejection <span>*</span>
                    </label>
                    <textarea
                      id="rcm-rejection-reason"
                      className="rcm-claims-textarea"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter the reason stated for rejecting the claim"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="rcm-claims-form-actions">
                <button type="submit" className="rcm-claims-primary">
                  + Add Claim
                </button>
              </div>
            </form>
          </section>

          <section className="rcm-claims-panel">
            <h3 className="rcm-claims-panel-title">
              Claims History ({patientClaims.length})
            </h3>
            <p className="rcm-claims-panel-description">
              Claim records added for this patient in the current workspace.
            </p>

            {patientClaims.length === 0 ? (
              <div className="rcm-claims-empty">
                No claim records have been added in this session.
              </div>
            ) : (
              <div className="rcm-claims-table-wrap">
                <table className="rcm-claims-table">
                  <thead>
                    <tr>
                      <th>Claim ID</th>
                      <th>Status</th>
                      <th>Rejection Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientClaims.map((claim) => (
                      <tr key={claim.id}>
                        <td>{claim.claimId}</td>
                        <td>
                          <span
                            className={`rcm-claims-status ${
                              claim.status.toLowerCase()
                            }`}
                          >
                            {claim.status}
                          </span>
                        </td>
                        <td>{claim.rejectionReason || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rcm-claims-panel">
            <h3 className="rcm-claims-panel-title">
              Add Renewal Alert
            </h3>
            <p className="rcm-claims-panel-description">
              Add a renewal date for this patient. We will connect these alerts
              to the Alerts &amp; Renewals component later.
            </p>

            <form onSubmit={addRenewalAlert}>
              <div className="rcm-claims-form-grid">
                <div className="rcm-claims-field">
                  <label htmlFor="rcm-renewal-date">
                    Renewal Date <span>*</span>
                  </label>
                  <input
                    id="rcm-renewal-date"
                    className="rcm-claims-input"
                    type="date"
                    value={renewalDate}
                    onChange={(e) => setRenewalDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="rcm-claims-form-actions">
                <button type="submit" className="rcm-claims-primary">
                  + Add Renewal Alert
                </button>
              </div>
            </form>
          </section>

          <section className="rcm-claims-panel">
            <h3 className="rcm-claims-panel-title">
              Renewal Alerts ({patientAlerts.length})
            </h3>

            {patientAlerts.length === 0 ? (
              <div className="rcm-claims-empty">
                No renewal alerts have been added in this session.
              </div>
            ) : (
              <div className="rcm-claims-table-wrap">
                <table className="rcm-claims-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>File Number</th>
                      <th>Renewal Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientAlerts.map((alert) => (
                      <tr key={alert.id}>
                        <td>{alert.patientName}</td>
                        <td>{alert.patientFileNumber || "-"}</td>
                        <td className="rcm-claims-renewal-date">
                          {formatDate(alert.renewalDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

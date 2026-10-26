
import React, { useState } from "react";

export default function CreateClaim({ patient, onClose }) {
  const [claims, setClaims] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [claimId, setClaimId] = useState("");
  const [claimStatus, setClaimStatus] = useState("Approved");
  const [rejectionReason, setRejectionReason] = useState("");
  const [renewalDate, setRenewalDate] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const patientName =
    patient?.name ||
    patient?.full_name ||
    patient?.patient_name ||
    "Unnamed patient";

  const patientId = patient?.id;
  const fileNumber = patient?.patient_id || "-";

  const patientClaims = claims.filter(
    (claim) => String(claim.patientId) === String(patientId)
  );

  const patientAlerts = alerts.filter(
    (alert) => String(alert.patientId) === String(patientId)
  );

  const addClaim = (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

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
        String(claim.patientId) === String(patientId) &&
        claim.claimId.toLowerCase() === claimId.trim().toLowerCase()
    );

    if (duplicate) {
      setError("This Claim ID has already been added for this patient.");
      return;
    }

    setClaims((previous) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        patientId,
        claimId: claimId.trim(),
        status: claimStatus,
        rejectionReason:
          claimStatus === "Rejected" ? rejectionReason.trim() : "",
        createdAt: new Date().toISOString(),
      },
      ...previous,
    ]);

    setClaimId("");
    setClaimStatus("Approved");
    setRejectionReason("");
    setMessage("Claim added to the current workspace.");
  };

  const addRenewalAlert = (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!renewalDate) {
      setError("Please select a renewal date.");
      return;
    }

    setAlerts((previous) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        patientId,
        patientName,
        patientFileNumber: fileNumber,
        renewalDate,
      },
      ...previous,
    ]);

    setRenewalDate("");
    setMessage("Renewal alert added to the current workspace.");
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString();
  };

  return (
    <section className="create-claim">
      <style>{`
        .create-claim {
          --cc-navy:#172c46;
          --cc-blue:#3478f6;
          --cc-text:#233750;
          --cc-muted:#75869b;
          --cc-border:#e3eaf3;
          width:100%;
          margin:22px 0;
          color:var(--cc-text);
          font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
        }
        .create-claim * { box-sizing:border-box; }
        .create-claim button,.create-claim input,.create-claim select,
        .create-claim textarea { font:inherit; }
        .cc-panel {
          margin-bottom:18px;padding:23px;
          border:1px solid var(--cc-border);border-radius:17px;
          background:#fff;box-shadow:0 5px 18px rgba(28,49,77,.035);
        }
        .cc-header {
          display:flex;justify-content:space-between;align-items:flex-start;
          gap:16px;margin-bottom:20px;padding:23px;
          border:1px solid #dce7fa;border-radius:17px;
          background:linear-gradient(115deg,#f0f5ff,#fff);
        }
        .cc-eyebrow {
          margin-bottom:7px;color:var(--cc-blue);font-size:10px;
          font-weight:850;letter-spacing:1.3px;text-transform:uppercase;
        }
        .cc-title {
          margin:0;color:var(--cc-navy);font-size:23px;
          font-weight:850;overflow-wrap:anywhere;
        }
        .cc-subtitle {
          margin:7px 0 0;color:var(--cc-muted);font-size:12px;line-height:1.7;
        }
        .cc-close,.cc-button {
          display:inline-flex;align-items:center;justify-content:center;
          gap:7px;min-height:39px;padding:0 14px;border-radius:10px;
          font-size:12px;font-weight:800;white-space:nowrap;cursor:pointer;
        }
        .cc-close {
          border:1px solid var(--cc-border);background:white;color:var(--cc-navy);
        }
        .cc-close:hover { background:#f3f7fc; }
        .cc-heading {
          margin:0 0 7px;color:var(--cc-navy);font-size:17px;font-weight:850;
        }
        .cc-description {
          margin:0 0 19px;color:var(--cc-muted);font-size:12px;line-height:1.7;
        }
        .cc-grid {
          display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;
        }
        .cc-field { display:flex;flex-direction:column;gap:8px;min-width:0; }
        .cc-field-full { grid-column:1/-1; }
        .cc-field label { color:var(--cc-text);font-size:12px;font-weight:800; }
        .cc-required { color:#dc2626; }
        .cc-field input,.cc-field select,.cc-field textarea {
          width:100%;min-width:0;min-height:45px;padding:11px 12px;
          border:1px solid #d7e1ed;border-radius:10px;
          background:white;color:var(--cc-text);font-size:13px;outline:none;
        }
        .cc-field textarea { min-height:90px;resize:vertical; }
        .cc-field input:focus,.cc-field select:focus,.cc-field textarea:focus {
          border-color:var(--cc-blue);box-shadow:0 0 0 3px rgba(52,120,246,.09);
        }
        .cc-actions {
          display:flex;justify-content:flex-end;gap:9px;margin-top:20px;
        }
        .cc-button-primary { border:1px solid var(--cc-blue);background:var(--cc-blue);color:white; }
        .cc-button-primary:hover { background:#245ed1; }
        .cc-button-green { border:1px solid #07996c;background:#07996c;color:white; }
        .cc-button-green:hover { background:#087c5c; }
        .cc-notice {
          margin:0 0 16px;padding:12px 14px;border-radius:10px;
          font-size:12px;line-height:1.6;overflow-wrap:anywhere;
        }
        .cc-error { border:1px solid #fecaca;background:#fff1f2;color:#b91c1c; }
        .cc-success { border:1px solid #bbf7d0;background:#f0fdf4;color:#166534; }
        .cc-empty {
          padding:21px 15px;border:1px dashed #d6e0ed;border-radius:12px;
          background:#f8fafc;color:var(--cc-muted);font-size:12px;
          line-height:1.7;text-align:center;
        }
        .cc-table-wrap {
          width:100%;overflow-x:auto;border:1px solid var(--cc-border);
          border-radius:11px;
        }
        .cc-table { width:100%;border-collapse:collapse;text-align:left;font-size:12px; }
        .cc-table th {
          padding:12px;border-bottom:1px solid var(--cc-border);
          background:#f6f8fc;color:var(--cc-muted);font-size:10px;
          font-weight:850;letter-spacing:.5px;text-transform:uppercase;
        }
        .cc-table td {
          padding:13px 12px;border-bottom:1px solid #edf1f6;
          color:var(--cc-text);vertical-align:top;overflow-wrap:anywhere;
        }
        .cc-table tr:last-child td { border-bottom:0; }
        .cc-status {
          display:inline-flex;padding:5px 9px;border-radius:30px;
          font-size:10px;font-weight:850;
        }
        .cc-approved { background:#dcfce7;color:#166534; }
        .cc-rejected { background:#fee2e2;color:#b91c1c; }
        .cc-patient-badge {
          display:inline-block;margin-top:12px;padding:7px 10px;
          border-radius:9px;background:#eaf1ff;color:#245ed1;
          font-size:11px;font-weight:800;
        }
        @media(max-width:600px) {
          .cc-panel,.cc-header { padding:16px; }
          .cc-grid { grid-template-columns:1fr; }
          .cc-field-full { grid-column:auto; }
          .cc-header { flex-direction:column; }
          .cc-actions { flex-direction:column-reverse; }
          .cc-actions button { width:100%; }
        }
      `}</style>

      <header className="cc-header">
        <div>
          <div className="cc-eyebrow">New Claim</div>
          <h2 className="cc-title">Create Claim</h2>
          <p className="cc-subtitle">
            Create and review claim records for the selected patient.
          </p>
          <div className="cc-patient-badge">
            Patient: {patientName} · File: {fileNumber}
          </div>
        </div>

        {onClose && (
          <button type="button" className="cc-close" onClick={onClose}>
            Close
          </button>
        )}
      </header>

      {error && <div className="cc-notice cc-error" role="alert">{error}</div>}
      {message && <div className="cc-notice cc-success" role="status">{message}</div>}

      <section className="cc-panel">
        <h3 className="cc-heading">Claim Details</h3>
        <p className="cc-description">
          Enter the claim reference and select the claim decision.
        </p>

        <form onSubmit={addClaim}>
          <div className="cc-grid">
            <div className="cc-field">
              <label htmlFor="cc-claim-id">
                Claim ID <span className="cc-required">*</span>
              </label>
              <input
                id="cc-claim-id"
                value={claimId}
                onChange={(event) => setClaimId(event.target.value)}
                placeholder="Enter claim ID"
                required
              />
            </div>

            <div className="cc-field">
              <label htmlFor="cc-claim-status">
                Claim Status <span className="cc-required">*</span>
              </label>
              <select
                id="cc-claim-status"
                value={claimStatus}
                onChange={(event) => setClaimStatus(event.target.value)}
              >
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {claimStatus === "Rejected" && (
              <div className="cc-field cc-field-full">
                <label htmlFor="cc-rejection-reason">
                  Reason for Rejection <span className="cc-required">*</span>
                </label>
                <textarea
                  id="cc-rejection-reason"
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  placeholder="Explain why the claim was rejected"
                  required
                />
              </div>
            )}
          </div>

          <div className="cc-actions">
            <button type="submit" className="cc-button cc-button-primary">
              + Add Claim
            </button>
          </div>
        </form>
      </section>

      <section className="cc-panel">
        <h3 className="cc-heading">Claims History ({patientClaims.length})</h3>
        <p className="cc-description">
          Claims added for this patient in the current workspace.
        </p>

        {patientClaims.length === 0 ? (
          <div className="cc-empty">No claims have been added in this session.</div>
        ) : (
          <div className="cc-table-wrap">
            <table className="cc-table">
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
                      <span className={`cc-status cc-${claim.status.toLowerCase()}`}>
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

      <section className="cc-panel">
        <h3 className="cc-heading">Add Renewal Alert</h3>
        <p className="cc-description">
          Set a reminder date for the patient's upcoming approval renewal.
        </p>

        <form onSubmit={addRenewalAlert}>
          <div className="cc-grid">
            <div className="cc-field">
              <label htmlFor="cc-renewal-date">
                Renewal Date <span className="cc-required">*</span>
              </label>
              <input
                id="cc-renewal-date"
                type="date"
                value={renewalDate}
                onChange={(event) => setRenewalDate(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="cc-actions">
            <button type="submit" className="cc-button cc-button-green">
              + Add Renewal Alert
            </button>
          </div>
        </form>
      </section>

      <section className="cc-panel">
        <h3 className="cc-heading">Renewal Alerts ({patientAlerts.length})</h3>

        {patientAlerts.length === 0 ? (
          <div className="cc-empty">No renewal alerts have been added in this session.</div>
        ) : (
          <div className="cc-table-wrap">
            <table className="cc-table">
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
                    <td>{alert.patientFileNumber}</td>
                    <td>{formatDate(alert.renewalDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

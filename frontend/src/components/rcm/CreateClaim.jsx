
import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../api/api";

const EMPTY_CLAIM = {
  claimId: "",
  status: "Pending",
  rejectionReason: "",
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.error ||
  error?.response?.data?.detail ||
  error?.response?.data?.message ||
  fallback;

const getPatientName = (patient) =>
  patient?.name ||
  patient?.full_name ||
  patient?.patient_name ||
  "Unnamed patient";

const getFileNumber = (patient) =>
  patient?.patient_id || patient?.file_number || "-";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const normalizeClaim = (item) => ({
  ...item,
  claimId: item.claimId ?? item.claim_id ?? "",
  rejectionReason: item.rejectionReason ?? item.rejection_reason ?? "",
  createdAt: item.createdAt ?? item.created_at ?? "",
});

const normalizeAlert = (item) => ({
  ...item,
  renewalDate: item.renewalDate ?? item.renewal_date ?? "",
  createdAt: item.createdAt ?? item.created_at ?? "",
  patientName: item.patientName ?? item.patient_name ?? "",
  patientFileNumber:
    item.patientFileNumber ?? item.patient_file_number ?? "",
});

export default function CreateClaim({ patient, onClose }) {
  const patientId = patient?.id;
  const patientName = getPatientName(patient);
  const fileNumber = getFileNumber(patient);

  const [claims, setClaims] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [claimForm, setClaimForm] = useState(EMPTY_CLAIM);
  const [renewalDate, setRenewalDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingClaim, setSavingClaim] = useState(false);
  const [savingAlert, setSavingAlert] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("claims");

  const loadRecords = useCallback(
    async (signal) => {
      if (!patientId) {
        setError("No patient was selected.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [claimsResponse, alertsResponse] = await Promise.all([
          api.get("rcm/claims/", {
            params: { patient_id: patientId },
            signal,
          }),
          api.get("rcm/renewal-alerts/", {
            params: { patient_id: patientId },
            signal,
          }),
        ]);

        const claimsData = claimsResponse.data;
        const alertsData = alertsResponse.data;

        const claimResults = Array.isArray(claimsData)
          ? claimsData
          : claimsData?.results || claimsData?.claims || [];

        const alertResults = Array.isArray(alertsData)
          ? alertsData
          : alertsData?.results || alertsData?.alerts || [];

        setClaims(claimResults.map(normalizeClaim));
        setAlerts(alertResults.map(normalizeAlert));
      } catch (err) {
        if (
          err.code !== "ERR_CANCELED" &&
          err.name !== "CanceledError"
        ) {
          setError(
            getErrorMessage(
              err,
              "Could not load this patient's claims and renewal alerts."
            )
          );
        }
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [patientId]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadRecords(controller.signal);
    return () => controller.abort();
  }, [loadRecords]);

  const stats = useMemo(
    () => ({
      total: claims.length,
      approved: claims.filter(
        (item) => item.status?.toLowerCase() === "approved"
      ).length,
      rejected: claims.filter(
        (item) => item.status?.toLowerCase() === "rejected"
      ).length,
      pending: claims.filter(
        (item) => item.status?.toLowerCase() === "pending"
      ).length,
    }),
    [claims]
  );

  const updateClaimField = (field, value) => {
    setClaimForm((current) => ({ ...current, [field]: value }));
    setError("");
    setMessage("");
  };

  const addClaim = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!patientId) {
      setError("Please select a patient first.");
      return;
    }

    const claimId = claimForm.claimId.trim();
    const rejectionReason = claimForm.rejectionReason.trim();

    if (!claimId) {
      setError("Please enter the Claim ID.");
      return;
    }

    if (claimForm.status === "Rejected" && !rejectionReason) {
      setError("Please enter the reason for rejection.");
      return;
    }

    setSavingClaim(true);

    try {
      const response = await api.post("rcm/claims/", {
        patientId,
        claimId,
        status: claimForm.status,
        rejectionReason,
      });

      const rawClaim = response.data?.claim;

      if (rawClaim) {
        const savedClaim = normalizeClaim(rawClaim);

        setClaims((current) => [
          savedClaim,
          ...current.filter((item) => item.id !== savedClaim.id),
        ]);
      } else {
        await loadRecords();
      }

      setClaimForm(EMPTY_CLAIM);
      setMessage("Claim saved successfully.");
      setActiveTab("claims");
    } catch (err) {
      setError(
        getErrorMessage(err, "Could not save the claim. Please try again.")
      );
    } finally {
      setSavingClaim(false);
    }
  };

  const addRenewalAlert = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!patientId) {
      setError("Please select a patient first.");
      return;
    }

    if (!renewalDate) {
      setError("Please select a renewal date.");
      return;
    }

    setSavingAlert(true);

    try {
      const response = await api.post("rcm/renewal-alerts/", {
        patientId,
        renewalDate,
      });

      const rawAlert = response.data?.alert;

      if (rawAlert) {
        const savedAlert = normalizeAlert(rawAlert);

        setAlerts((current) => [
          savedAlert,
          ...current.filter((item) => item.id !== savedAlert.id),
        ]);
      } else {
        await loadRecords();
      }

      setRenewalDate("");
      setMessage("Renewal alert saved successfully.");
      setActiveTab("renewals");
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Could not save the renewal alert. Please try again."
        )
      );
    } finally {
      setSavingAlert(false);
    }
  };

  const statusClass = (status) => {
    const value = String(status || "Pending").toLowerCase();
    if (value === "approved") return "approved";
    if (value === "rejected") return "rejected";
    return "pending";
  };

  return (
    <main className="rcm-modern">
      <style>{`
        .rcm-modern {
          --ink: #172b4d;
          --muted: #708097;
          --line: #e4eaf2;
          --blue: #4361ee;
          --teal: #0d9488;
          --surface: #ffffff;
          color: var(--ink);
          width: 100%;
          margin: 20px 0;
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .rcm-modern * { box-sizing: border-box; }
        .rcm-modern button, .rcm-modern input,
        .rcm-modern select, .rcm-modern textarea { font: inherit; }

        .rcm-modern .hero {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          padding: 30px;
          border-radius: 22px;
          color: white;
          background: linear-gradient(120deg, #122541 0%, #244b9b 58%, #4361ee 100%);
          box-shadow: 0 14px 35px rgba(34, 67, 139, .19);
        }

        .rcm-modern .hero::before,
        .rcm-modern .hero::after {
          content: "";
          position: absolute;
          z-index: -1;
          border-radius: 50%;
          pointer-events: none;
        }

        .rcm-modern .hero::before {
          width: 260px;
          height: 260px;
          right: -70px;
          top: -145px;
          border: 40px solid rgba(255,255,255,.07);
        }

        .rcm-modern .hero::after {
          width: 150px;
          height: 150px;
          right: 130px;
          bottom: -110px;
          background: rgba(58, 213, 198, .12);
        }

        .rcm-modern .eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #b9d4ff;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 1.7px;
          text-transform: uppercase;
        }

        .rcm-modern .eyebrow-dot {
          width: 7px;
          height: 7px;
          background: #4de0c1;
          border-radius: 50%;
          box-shadow: 0 0 0 4px rgba(77,224,193,.12);
        }

        .rcm-modern .hero h1 {
          margin: 13px 0 0;
          color: white;
          font-size: clamp(23px, 3vw, 30px);
          line-height: 1.25;
          font-weight: 850;
          letter-spacing: -.7px;
        }

        .rcm-modern .hero-description {
          margin: 9px 0 0;
          color: #dbe7ff;
          font-size: 13px;
          line-height: 1.7;
          max-width: 500px;
        }

        .rcm-modern .patient-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          margin-top: 23px;
        }

        .rcm-modern .patient-chip {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 12px;
          border: 1px solid rgba(255,255,255,.19);
          border-radius: 11px;
          background: rgba(255,255,255,.10);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          backdrop-filter: blur(8px);
        }

        .rcm-modern .chip-label {
          color: #bcd0fa;
          font-weight: 500;
        }

        .rcm-modern .back-button {
          flex-shrink: 0;
          padding: 10px 13px;
          border: 1px solid rgba(255,255,255,.3);
          border-radius: 10px;
          background: rgba(255,255,255,.12);
          color: white;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
        }

        .rcm-modern .back-button:hover {
          background: rgba(255,255,255,.2);
        }

        .rcm-modern .stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin: 19px 0;
        }

        .rcm-modern .stat {
          position: relative;
          overflow: hidden;
          padding: 19px;
          border: 1px solid var(--line);
          border-radius: 17px;
          background: white;
          box-shadow: 0 5px 18px rgba(30, 52, 84, .035);
        }

        .rcm-modern .stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .rcm-modern .stat-icon {
          display: grid;
          place-items: center;
          width: 37px;
          height: 37px;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 800;
        }

        .rcm-modern .stat-label {
          margin-top: 13px;
          color: var(--muted);
          font-size: 11px;
          font-weight: 750;
        }

        .rcm-modern .stat-value {
          margin-top: 5px;
          font-size: 30px;
          line-height: 1.2;
          font-weight: 850;
          letter-spacing: -.7px;
        }

        .rcm-modern .stat-note {
          margin-top: 5px;
          color: #8a97aa;
          font-size: 10px;
        }

        .rcm-modern .stat-blue .stat-icon { color: #4361ee; background: #eaf0ff; }
        .rcm-modern .stat-blue .stat-value { color: #3455d1; }
        .rcm-modern .stat-teal .stat-icon { color: #0d9488; background: #dff8f3; }
        .rcm-modern .stat-teal .stat-value { color: #0d9488; }
        .rcm-modern .stat-red .stat-icon { color: #dc4848; background: #fff0f0; }
        .rcm-modern .stat-red .stat-value { color: #d14343; }
        .rcm-modern .stat-amber .stat-icon { color: #b7791f; background: #fff5dc; }
        .rcm-modern .stat-amber .stat-value { color: #b7791f; }

        .rcm-modern .panel {
          margin-bottom: 18px;
          padding: 24px;
          border: 1px solid var(--line);
          border-radius: 19px;
          background: var(--surface);
          box-shadow: 0 5px 20px rgba(30, 52, 84, .035);
        }

        .rcm-modern .panel-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 21px;
        }

        .rcm-modern .section-title {
          margin: 0;
          font-size: 17px;
          font-weight: 850;
          letter-spacing: -.2px;
        }

        .rcm-modern .section-description {
          margin: 6px 0 0;
          color: var(--muted);
          font-size: 12px;
          line-height: 1.65;
        }

        .rcm-modern .refresh {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 12px;
          border: 1px solid var(--line);
          border-radius: 10px;
          background: white;
          color: #43536a;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
        }

        .rcm-modern .refresh:hover:not(:disabled) {
          border-color: #a8b9ff;
          color: var(--blue);
          background: #f8faff;
        }

        .rcm-modern .refresh:disabled { opacity: .6; cursor: wait; }

        .rcm-modern .tabs {
          display: flex;
          gap: 5px;
          width: fit-content;
          max-width: 100%;
          margin-bottom: 23px;
          padding: 5px;
          border: 1px solid #e8edf5;
          border-radius: 13px;
          background: #f5f7fb;
        }

        .rcm-modern .tab {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          padding: 11px 16px;
          border: 0;
          border-radius: 9px;
          background: transparent;
          color: #718096;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: background .15s ease, color .15s ease;
        }

        .rcm-modern .tab.active {
          background: white;
          color: #3455d1;
          box-shadow: 0 2px 8px rgba(29, 48, 79, .09);
        }

        .rcm-modern .tab-symbol {
          display: grid;
          place-items: center;
          width: 22px;
          height: 22px;
          border-radius: 7px;
          background: #e9efff;
          color: #4361ee;
          font-size: 15px;
        }

        .rcm-modern .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 19px;
        }

        .rcm-modern .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .rcm-modern .field.full { grid-column: 1 / -1; }

        .rcm-modern .field label {
          color: #34445b;
          font-size: 12px;
          font-weight: 800;
        }

        .rcm-modern .required {
          color: #e05252;
          margin-left: 3px;
        }

        .rcm-modern .field input,
        .rcm-modern .field select,
        .rcm-modern .field textarea {
          display: block;
          width: 100%;
          min-width: 0;
          border: 1px solid #dce4ef;
          border-radius: 11px;
          padding: 12px 14px;
          outline: none;
          background: #fbfcfe;
          color: #172b4d;
          font-size: 13px;
          transition: border-color .15s, box-shadow .15s, background .15s;
        }

        .rcm-modern .field input,
        .rcm-modern .field select { min-height: 47px; }

        .rcm-modern .field textarea {
          min-height: 104px;
          resize: vertical;
          line-height: 1.6;
        }

        .rcm-modern .field input::placeholder,
        .rcm-modern .field textarea::placeholder {
          color: #a1adbd;
        }

        .rcm-modern .field input:focus,
        .rcm-modern .field select:focus,
        .rcm-modern .field textarea:focus {
          border-color: #6985f4;
          background: white;
          box-shadow: 0 0 0 4px rgba(67,97,238,.10);
        }

        .rcm-modern .field-hint {
          color: #8491a4;
          font-size: 10px;
          line-height: 1.5;
        }

        .rcm-modern .rejection-note {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          border: 1px solid #fecaca;
          border-radius: 11px;
          background: #fff7f7;
          color: #a52b35;
          font-size: 11px;
          line-height: 1.6;
        }

        .rcm-modern .actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 24px;
          padding-top: 19px;
          border-top: 1px solid #edf1f6;
        }

        .rcm-modern .button {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          min-height: 43px;
          padding: 0 17px;
          border: 1px solid transparent;
          border-radius: 11px;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
          transition: transform .15s, box-shadow .15s, background .15s;
        }

        .rcm-modern .button:active:not(:disabled) { transform: translateY(1px); }
        .rcm-modern .button:disabled { opacity: .58; cursor: wait; }

        .rcm-modern .button-primary {
          color: white;
          background: linear-gradient(110deg, #4361ee, #3154d8);
          box-shadow: 0 5px 12px rgba(67,97,238,.17);
        }

        .rcm-modern .button-primary:hover:not(:disabled) {
          background: linear-gradient(110deg, #3455e4, #2748c4);
          box-shadow: 0 7px 17px rgba(67,97,238,.24);
        }

        .rcm-modern .button-secondary {
          color: #43536a;
          border-color: #dce4ef;
          background: white;
        }

        .rcm-modern .button-secondary:hover:not(:disabled) {
          background: #f7f9fc;
          border-color: #b8c5d8;
        }

        .rcm-modern .notice {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 15px;
          padding: 13px 15px;
          border-radius: 12px;
          font-size: 12px;
          line-height: 1.6;
        }

        .rcm-modern .notice-error {
          color: #a52230;
          border: 1px solid #fecdd3;
          background: #fff1f2;
        }

        .rcm-modern .notice-success {
          color: #166534;
          border: 1px solid #bbf7d0;
          background: #f0fdf4;
        }

        .rcm-modern .records-count {
          padding: 7px 10px;
          border-radius: 9px;
          color: #3155d4;
          background: #edf2ff;
          font-size: 10px;
          font-weight: 850;
          white-space: nowrap;
        }

        .rcm-modern .table-wrap {
          overflow-x: auto;
          border: 1px solid #e7edf5;
          border-radius: 12px;
        }

        .rcm-modern .table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 12px;
        }

        .rcm-modern .table th {
          padding: 13px 15px;
          background: #f7f9fd;
          color: #78869b;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: .5px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .rcm-modern .table td {
          padding: 15px;
          border-top: 1px solid #edf1f6;
          color: #44546b;
          vertical-align: middle;
          line-height: 1.55;
        }

        .rcm-modern .table tbody tr:hover { background: #fafcff; }
        .rcm-modern .table-primary { color: #172b4d !important; font-weight: 800; }
        .rcm-modern .muted { color: #96a1b1 !important; }

        .rcm-modern .status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 30px;
          font-size: 10px;
          font-weight: 850;
          white-space: nowrap;
        }

        .rcm-modern .status::before {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .rcm-modern .status.approved { color: #13825b; background: #e2f8ec; }
        .rcm-modern .status.rejected { color: #c63843; background: #ffeaec; }
        .rcm-modern .status.pending { color: #a66c0b; background: #fff3d5; }

        .rcm-modern .empty {
          padding: 35px 18px;
          border: 1px dashed #d7e0ed;
          border-radius: 13px;
          background: #fafcff;
          text-align: center;
          color: #718096;
          font-size: 12px;
          line-height: 1.8;
        }

        .rcm-modern .empty-icon {
          display: grid;
          place-items: center;
          width: 46px;
          height: 46px;
          margin: 0 auto 12px;
          border-radius: 14px;
          background: #eaf0ff;
          color: #4361ee;
          font-size: 22px;
        }

        .rcm-modern .empty strong {
          display: block;
          margin-bottom: 3px;
          color: #34445b;
          font-size: 13px;
        }

        .rcm-modern .loading {
          padding: 28px;
          color: #718096;
          text-align: center;
          font-size: 12px;
        }

        @media (max-width: 760px) {
          .rcm-modern .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .rcm-modern .hero { padding: 23px; }
          .rcm-modern .panel { padding: 18px; }
        }

        @media (max-width: 480px) {
          .rcm-modern .hero { flex-direction: column; }
          .rcm-modern .back-button { align-self: flex-start; }
          .rcm-modern .form-grid { grid-template-columns: 1fr; }
          .rcm-modern .field.full { grid-column: auto; }
          .rcm-modern .actions { flex-direction: column-reverse; }
          .rcm-modern .actions .button { width: 100%; }
          .rcm-modern .tabs { width: 100%; }
          .rcm-modern .tab { flex: 1; padding: 10px 8px; }
          .rcm-modern .panel-heading { align-items: flex-start; }
        }
      `}</style>

      <header className="hero">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            Revenue Cycle Management
          </div>

          <h1>Claims &amp; Approvals</h1>

          <p className="hero-description">
            Manage patient claims, review decisions, and keep approval
            renewals organized in one place.
          </p>

          <div className="patient-chips">
            <span className="patient-chip">
              <span>♙</span>
              <span className="chip-label">Patient</span>
              {patientName}
            </span>
            <span className="patient-chip">
              <span>▤</span>
              <span className="chip-label">File No.</span>
              {fileNumber}
            </span>
            <span className="patient-chip">
              <span>◉</span>
              <span className="chip-label">ID</span>
              {patientId ?? "-"}
            </span>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            className="back-button"
            onClick={onClose}
          >
            ← Back to Search
          </button>
        )}
      </header>

      <section className="stats" aria-label="Claim summary">
        <div className="stat stat-blue">
          <div className="stat-top">
            <div className="stat-label">TOTAL CLAIMS</div>
            <div className="stat-icon">▤</div>
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-note">All patient claims</div>
        </div>

        <div className="stat stat-teal">
          <div className="stat-top">
            <div className="stat-label">APPROVED</div>
            <div className="stat-icon">✓</div>
          </div>
          <div className="stat-value">{stats.approved}</div>
          <div className="stat-note">Successfully approved</div>
        </div>

        <div className="stat stat-red">
          <div className="stat-top">
            <div className="stat-label">REJECTED</div>
            <div className="stat-icon">!</div>
          </div>
          <div className="stat-value">{stats.rejected}</div>
          <div className="stat-note">Require review</div>
        </div>

        <div className="stat stat-amber">
          <div className="stat-top">
            <div className="stat-label">PENDING</div>
            <div className="stat-icon">◷</div>
          </div>
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-note">Awaiting decision</div>
        </div>
      </section>

      {error && (
        <div className="notice notice-error" role="alert">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="notice notice-success" role="status">
          <span>✓</span>
          <span>{message}</span>
        </div>
      )}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2 className="section-title">Manage Patient Records</h2>
            <p className="section-description">
              Create a claim or schedule an approval renewal reminder.
            </p>
          </div>

          <button
            type="button"
            className="refresh"
            onClick={() => loadRecords()}
            disabled={loading}
          >
            <span>↻</span>
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>

        <div className="tabs" role="tablist" aria-label="Record type">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "claims"}
            className={`tab ${activeTab === "claims" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("claims");
              setError("");
              setMessage("");
            }}
          >
            <span className="tab-symbol">+</span>
            Create Claim
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "renewals"}
            className={`tab ${activeTab === "renewals" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("renewals");
              setError("");
              setMessage("");
            }}
          >
            <span className="tab-symbol">◷</span>
            Renewal Alert
          </button>
        </div>

        {activeTab === "claims" ? (
          <form onSubmit={addClaim}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="rcm-claim-id">
                  Claim ID <span className="required">*</span>
                </label>
                <input
                  id="rcm-claim-id"
                  value={claimForm.claimId}
                  onChange={(event) =>
                    updateClaimField("claimId", event.target.value)
                  }
                  placeholder="e.g. CLM-2026-001"
                  maxLength={100}
                  required
                />
                <span className="field-hint">
                  Enter the unique claim reference.
                </span>
              </div>

              <div className="field">
                <label htmlFor="rcm-claim-status">
                  Claim Status <span className="required">*</span>
                </label>
                <select
                  id="rcm-claim-status"
                  value={claimForm.status}
                  onChange={(event) =>
                    updateClaimField("status", event.target.value)
                  }
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <span className="field-hint">
                  Select the latest decision for this claim.
                </span>
              </div>

              {claimForm.status === "Rejected" && (
                <div className="field full">
                  <div className="rejection-note">
                    <span>!</span>
                    <span>
                      A rejection reason is required when the claim status
                      is Rejected.
                    </span>
                  </div>

                  <label htmlFor="rcm-rejection-reason">
                    Reason for Rejection <span className="required">*</span>
                  </label>
                  <textarea
                    id="rcm-rejection-reason"
                    value={claimForm.rejectionReason}
                    onChange={(event) =>
                      updateClaimField(
                        "rejectionReason",
                        event.target.value
                      )
                    }
                    placeholder="Describe the reason provided for rejecting this claim..."
                    required
                  />
                </div>
              )}
            </div>

            <div className="actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  setClaimForm(EMPTY_CLAIM);
                  setError("");
                  setMessage("");
                }}
                disabled={savingClaim}
              >
                Clear Form
              </button>

              <button
                type="submit"
                className="button button-primary"
                disabled={savingClaim || !patientId}
              >
                {savingClaim ? "Saving Claim…" : "Save Claim  →"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={addRenewalAlert}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="rcm-renewal-date">
                  Renewal Date <span className="required">*</span>
                </label>
                <input
                  id="rcm-renewal-date"
                  type="date"
                  value={renewalDate}
                  onChange={(event) => {
                    setRenewalDate(event.target.value);
                    setError("");
                    setMessage("");
                  }}
                  required
                />
                <span className="field-hint">
                  Choose the date when the patient’s approval needs renewal.
                </span>
              </div>
            </div>

            <div className="actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  setRenewalDate("");
                  setError("");
                  setMessage("");
                }}
                disabled={savingAlert}
              >
                Clear Form
              </button>

              <button
                type="submit"
                className="button button-primary"
                disabled={savingAlert || !patientId}
              >
                {savingAlert ? "Saving Alert…" : "Save Renewal Alert  →"}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2 className="section-title">
              {activeTab === "claims" ? "Claims History" : "Renewal Alerts"}
            </h2>
            <p className="section-description">
              Saved records for {patientName}.
            </p>
          </div>

          <span className="records-count">
            {activeTab === "claims" ? claims.length : alerts.length} RECORDS
          </span>
        </div>

        {loading ? (
          <div className="loading">Loading saved records…</div>
        ) : activeTab === "claims" ? (
          claims.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">▤</div>
              <strong>No claims yet</strong>
              Create a claim above to see it listed here.
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Claim ID</th>
                    <th>Status</th>
                    <th>Rejection Reason</th>
                    <th>Date Created</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim) => (
                    <tr key={claim.id}>
                      <td className="table-primary">
                        {claim.claimId || "-"}
                      </td>
                      <td>
                        <span className={`status ${statusClass(claim.status)}`}>
                          {claim.status || "Pending"}
                        </span>
                      </td>
                      <td>
                        {claim.rejectionReason || (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>{formatDate(claim.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : alerts.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">◷</div>
            <strong>No renewal alerts yet</strong>
            Add a renewal date above to create a reminder record.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>File Number</th>
                  <th>Renewal Date</th>
                  <th>Date Created</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id}>
                    <td className="table-primary">
                      {alert.patientName || patientName}
                    </td>
                    <td>{alert.patientFileNumber || fileNumber}</td>
                    <td className="table-primary">
                      {formatDate(alert.renewalDate)}
                    </td>
                    <td>{formatDate(alert.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

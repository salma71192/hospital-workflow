import React from "react";
import { useNavigate } from "react-router-dom";

export default function PatientSummaryCard({
  patient,
  actionLabel = "",
  onAction,
}) {
  const navigate = useNavigate();

  const remainingSessions = Math.max(
    Number(patient.approved_sessions || 0) - Number(patient.sessions_taken || 0),
    0
  );

  const status = getPatientStatus(patient);

  return (
    <div style={styles.card}>
      <div style={styles.topRow}>
        <div>
          <div style={styles.name}>{patient.name}</div>
          <div style={styles.meta}>Patient ID: {patient.patient_id}</div>
        </div>

        <span
          style={{
            ...styles.statusBadge,
            ...(status === "expired"
              ? styles.statusExpired
              : status === "low"
              ? styles.statusLow
              : styles.statusOk),
          }}
        >
          {status}
        </span>
      </div>

      <div style={styles.grid}>
        <div style={styles.item}>
          <div style={styles.label}>Insurance</div>
          <div style={styles.value}>{patient.insurance_provider || "-"}</div>
        </div>

        <div style={styles.item}>
          <div style={styles.label}>Approval No.</div>
          <div style={styles.value}>
            {patient.current_approval_number || "-"}
          </div>
        </div>

        <div style={styles.item}>
          <div style={styles.label}>Approved Sessions</div>
          <div style={styles.value}>{patient.approved_sessions ?? 0}</div>
        </div>

        <div style={styles.item}>
          <div style={styles.label}>Utilized Sessions</div>
          <div style={styles.value}>{patient.sessions_taken ?? 0}</div>
        </div>

        <div style={styles.item}>
          <div style={styles.label}>Remaining</div>
          <div style={styles.value}>{remainingSessions}</div>
        </div>

        <div style={styles.item}>
          <div style={styles.label}>Appointments</div>
          <div style={styles.value}>
            {patient.current_future_appointments || "-"}
          </div>
        </div>
      </div>

      {patient.approved_cpt_codes?.length ? (
        <div style={styles.codesWrap}>
          {patient.approved_cpt_codes.map((code, index) => (
            <span key={index} style={styles.codeChip}>
              {code}
            </span>
          ))}
        </div>
      ) : null}

      <div style={styles.actions}>
        <button
          type="button"
          style={styles.openButton}
          onClick={() => navigate(`/patients/${patient.id}`)}
        >
          Open File
        </button>

        {actionLabel && onAction ? (
          <button type="button" style={styles.actionButton} onClick={() => onAction(patient)}>
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function getPatientStatus(patient) {
  const expiry = patient.approval_expiry_date;
  const approved = Number(patient.approved_sessions || 0);
  const used = Number(patient.sessions_taken || 0);
  const remaining = approved - used;

  if (expiry) {
    const today = new Date().toISOString().split("T")[0];
    if (expiry < today) return "expired";
  }

  if (remaining <= 2) return "low";
  return "ok";
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "18px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e8eef7",
    display: "grid",
    gap: "16px",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    flexWrap: "wrap",
  },
  name: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: "4px",
  },
  meta: {
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "600",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "12px",
  },
  item: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "12px",
  },
  label: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: "6px",
  },
  value: {
    fontSize: "14px",
    color: "#0f172a",
    fontWeight: "700",
    wordBreak: "break-word",
  },
  codesWrap: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  codeChip: {
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
  },
  actions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  openButton: {
    background: "#0ea5e9",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  actionButton: {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  statusBadge: {
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "capitalize",
  },
  statusOk: {
    background: "#dcfce7",
    color: "#166534",
  },
  statusLow: {
    background: "#fef3c7",
    color: "#92400e",
  },
  statusExpired: {
    background: "#fee2e2",
    color: "#b91c1c",
  },
};

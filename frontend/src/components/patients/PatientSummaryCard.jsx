import React from "react";
import { useNavigate } from "react-router-dom";

export default function PatientSummaryCard({
  patient,
  onUpdate,   // approvals
  onAction,   // generic (reception, etc.)
  actionLabel = "Update Approval",
}) {
  const navigate = useNavigate();

  const approved = Number(patient.approved_sessions || 0);
  const used = Number(patient.sessions_taken || 0);
  const remaining = approved - used;

  const today = new Date().toISOString().split("T")[0];

  const status =
    patient.approval_expiry_date &&
    patient.approval_expiry_date < today
      ? "expired"
      : remaining <= 2
      ? "low"
      : "ok";

  // 🔥 unified action handler
  const handleAction = () => {
    console.log("ACTION CLICKED", patient);

    if (onUpdate) {
      onUpdate(patient);
    } else if (onAction) {
      onAction(patient);
    }
  };

  return (
    <div style={styles.card}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <div style={styles.name}>{patient.name}</div>
          <div style={styles.id}>{patient.patient_id}</div>
        </div>

        <span
          style={{
            ...styles.badge,
            ...(status === "expired"
              ? styles.badgeRed
              : status === "low"
              ? styles.badgeYellow
              : styles.badgeGreen),
          }}
        >
          {status}
        </span>
      </div>

      {/* INFO */}
      <div style={styles.row}>
        <span>Approval:</span>
        <strong>{patient.current_approval_number || "-"}</strong>
      </div>

      <div style={styles.row}>
        <span>Sessions:</span>
        <strong>
          {used} / {approved}
        </strong>
      </div>

      <div style={styles.row}>
        <span>Remaining:</span>
        <strong>{remaining}</strong>
      </div>

      {/* ACTIONS */}
      <div style={styles.actions}>
        {/* OPEN FILE */}
        <button
          type="button"
          style={styles.openBtn}
          onClick={() => navigate(`/patients/${patient.id}`)}
        >
          Open File
        </button>

        {/* 🔥 SMART ACTION BUTTON */}
        {(onUpdate || onAction) && (
          <button
            type="button"
            style={styles.updateBtn}
            onClick={handleAction}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    padding: "16px",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  name: { fontWeight: "800" },
  id: { fontSize: "12px", color: "#64748b" },

  badge: {
    padding: "4px 8px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "capitalize",
  },
  badgeGreen: { background: "#dcfce7", color: "#166534" },
  badgeYellow: { background: "#fef3c7", color: "#92400e" },
  badgeRed: { background: "#fee2e2", color: "#991b1b" },

  row: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "6px",
    fontSize: "14px",
  },

  actions: {
    display: "flex",
    gap: "8px",
    marginTop: "12px",
  },

  openBtn: {
    background: "#0ea5e9",
    color: "#fff",
    border: "none",
    padding: "8px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },

  updateBtn: {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    padding: "8px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
};
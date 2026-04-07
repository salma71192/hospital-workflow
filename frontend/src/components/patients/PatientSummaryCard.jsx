import React from "react";
import { useNavigate } from "react-router-dom";

export default function PatientSummaryCard({
  patient,
  onUpdate,
  onAction,
  actionLabel = "Update Approval",
}) {
  const navigate = useNavigate();

  const approved = Number(patient?.approved_sessions || 0);
  const used = Number(patient?.sessions_taken || 0);
  const remaining = Math.max(approved - used, 0);

  const today = new Date().toISOString().split("T")[0];

  const status =
    patient?.approval_expiry_date && patient.approval_expiry_date < today
      ? "Expired"
      : approved > 0 && remaining <= 2
      ? "Low Sessions"
      : "Active";

  const handleAction = () => {
    if (onUpdate) {
      onUpdate(patient);
    } else if (onAction) {
      onAction(patient);
    }
  };

  const formatRole = (role) => {
    if (!role) return "-";
    return role
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const getStatusStyle = () => {
    if (status === "Expired") {
      return { ...styles.badge, ...styles.badgeRed };
    }
    if (status === "Low Sessions") {
      return { ...styles.badge, ...styles.badgeYellow };
    }
    return { ...styles.badge, ...styles.badgeGreen };
  };

  return (
    <div style={styles.card}>
      <div style={styles.topSection}>
        <div>
          <div style={styles.eyebrow}>Patient File</div>
          <div style={styles.name}>{patient?.name || "-"}</div>
          <div style={styles.idLine}>File Number: {patient?.patient_id || "-"}</div>
        </div>

        <span style={getStatusStyle()}>{status}</span>
      </div>

      <div style={styles.infoGrid}>
        <div style={styles.infoCard}>
          <div style={styles.infoLabel}>Approval Number</div>
          <div style={styles.infoValue}>
            {patient?.current_approval_number || "-"}
          </div>
        </div>

        <div style={styles.infoCard}>
          <div style={styles.infoLabel}>Insurance Provider</div>
          <div style={styles.infoValue}>
            {patient?.insurance_provider || "-"}
          </div>
        </div>

        <div style={styles.infoCard}>
          <div style={styles.infoLabel}>Sessions Used</div>
          <div style={styles.infoValue}>{used}</div>
        </div>

        <div style={styles.infoCard}>
          <div style={styles.infoLabel}>Approved Sessions</div>
          <div style={styles.infoValue}>{approved}</div>
        </div>

        <div style={styles.infoCard}>
          <div style={styles.infoLabel}>Remaining Sessions</div>
          <div style={styles.infoValue}>{remaining}</div>
        </div>

        <div style={styles.infoCard}>
          <div style={styles.infoLabel}>Approval Expiry</div>
          <div style={styles.infoValue}>
            {patient?.approval_expiry_date || "-"}
          </div>
        </div>
      </div>

      <div style={styles.metaSection}>
        <div style={styles.metaTitle}>Registration Details</div>

        <div style={styles.metaRow}>
          <span style={styles.metaKey}>Registered By</span>
          <span style={styles.metaValue}>{patient?.registered_by || "-"}</span>
        </div>

        <div style={styles.metaRow}>
          <span style={styles.metaKey}>Role</span>
          <span style={styles.metaValue}>
            {formatRole(patient?.registered_by_role)}
          </span>
        </div>

        <div style={styles.metaRow}>
          <span style={styles.metaKey}>Registered On</span>
          <span style={styles.metaValue}>
            {formatDateTime(patient?.created_at || patient?.registered_at)}
          </span>
        </div>
      </div>

      <div style={styles.actions}>
        <button
          type="button"
          style={styles.openBtn}
          onClick={() => navigate(`/patients/${patient.id}`)}
        >
          Open File
        </button>

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
    background: "#ffffff",
    borderRadius: "20px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
    padding: "20px",
    display: "grid",
    gap: "18px",
  },

  topSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
  },

  eyebrow: {
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#2563eb",
    marginBottom: "6px",
  },

  name: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: 1.2,
  },

  idLine: {
    marginTop: "6px",
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "600",
  },

  badge: {
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },

  badgeGreen: {
    background: "#dcfce7",
    color: "#166534",
  },

  badgeYellow: {
    background: "#fef3c7",
    color: "#92400e",
  },

  badgeRed: {
    background: "#fee2e2",
    color: "#991b1b",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "12px",
  },

  infoCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "14px",
    display: "grid",
    gap: "6px",
  },

  infoLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },

  infoValue: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a",
  },

  metaSection: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "16px",
    display: "grid",
    gap: "10px",
  },

  metaTitle: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: "4px",
  },

  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
    fontSize: "14px",
  },

  metaKey: {
    color: "#64748b",
    fontWeight: "700",
  },

  metaValue: {
    color: "#0f172a",
    fontWeight: "700",
  },

  actions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  openBtn: {
    background: "#0ea5e9",
    color: "#fff",
    border: "none",
    padding: "10px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
  },

  updateBtn: {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    padding: "10px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
  },
};
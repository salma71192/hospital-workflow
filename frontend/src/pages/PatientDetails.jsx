import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";

export default function PatientDetails({ user, actingAs }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadPatient = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`patients/${id}/`);
      setPatient(res.data.patient || null);
    } catch {
      setError("Failed to load patient file");
      setPatient(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatient();
  }, [id]);

  const approved = Number(patient?.approved_sessions || 0);
  const used = Number(patient?.sessions_taken || 0);
  const remaining = Math.max(approved - used, 0);

  const today = new Date().toISOString().split("T")[0];

  const status =
    patient?.approval_expiry_date &&
    patient.approval_expiry_date < today
      ? "Expired"
      : approved > 0 && remaining <= 2
      ? "Low Sessions"
      : "Active";

  const formatRole = (role) => {
    if (!role) return "-";
    return role
      .replaceAll("_", " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatDate = (value) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const formatInsurance = (value) => {
    if (!value) return "-";
    if (value.toLowerCase() === "thiqa") return "Thiqa";
    if (value.toLowerCase() === "daman") return "Daman";
    return value;
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.wrapper}>
          <div style={styles.infoBox}>Loading patient file...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.wrapper}>
          <button style={styles.backButton} onClick={() => navigate(-1)}>
            Back
          </button>
          <div style={styles.errorBox}>{error}</div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div style={styles.page}>
        <div style={styles.wrapper}>
          <button style={styles.backButton} onClick={() => navigate(-1)}>
            Back
          </button>
          <div style={styles.infoBox}>Patient not found.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrapper}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.title}>Patient File</h1>
            <p style={styles.subtitle}>Clean patient overview</p>
          </div>

          <button style={styles.backButton} onClick={() => navigate(-1)}>
            Back
          </button>
        </div>

        <div style={styles.heroCard}>
          <div>
            <div style={styles.patientName}>{patient.name}</div>
            <div style={styles.patientId}>File Number: {patient.patient_id}</div>
          </div>

          <span
            style={{
              ...styles.badge,
              ...(status === "Expired"
                ? styles.badgeRed
                : status === "Low Sessions"
                ? styles.badgeYellow
                : styles.badgeGreen),
            }}
          >
            {status}
          </span>
        </div>

        <div style={styles.summaryGrid}>
          <SummaryCard label="Approved" value={approved} />
          <SummaryCard label="Used" value={used} />
          <SummaryCard label="Remaining" value={remaining} />
        </div>

        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>Approval Details</div>
          <div style={styles.infoGrid}>
            <InfoCard label="Insurance" value={formatInsurance(patient.insurance_provider)} />
            <InfoCard label="Authorization" value={patient.current_approval_number || "-"} />
            <InfoCard label="Start Date" value={patient.approval_start_date || "-"} />
            <InfoCard label="Expiry Date" value={patient.approval_expiry_date || "-"} />
            <InfoCard label="Approved Sessions" value={patient.approved_sessions ?? 0} />
            <InfoCard label="Used Sessions" value={patient.sessions_taken ?? 0} />
          </div>

          <div style={styles.fieldBlock}>
            <div style={styles.blockLabel}>Approved CPT Codes</div>
            <div style={styles.chipsWrap}>
              {patient.approved_cpt_codes?.length ? (
                patient.approved_cpt_codes.map((code, i) => (
                  <span key={i} style={styles.chip}>
                    {code}
                  </span>
                ))
              ) : (
                <span style={styles.muted}>No approved CPT codes</span>
              )}
            </div>
          </div>
        </div>

        <div style={styles.dualGrid}>
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>Physio</div>
            <div style={styles.infoGrid}>
              <InfoCard label="Sessions Used" value={patient.sessions_taken ?? 0} />
              <InfoCard label="Therapist" value={patient.taken_with || "-"} />
            </div>
          </div>

          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>Registration</div>
            <div style={styles.infoGrid}>
              <InfoCard label="Registered By" value={patient.registered_by || "-"} />
              <InfoCard label="Role" value={formatRole(patient.registered_by_role)} />
              <InfoCard
                label="Registered At"
                value={formatDate(patient.registered_at || patient.created_at)}
              />
            </div>
          </div>
        </div>

        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>Appointments</div>
          <div style={styles.largeValue}>
            {patient.current_future_appointments || "-"}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div style={styles.summaryCard}>
      <div style={styles.summaryLabel}>{label}</div>
      <div style={styles.summaryValue}>{value}</div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div style={styles.infoCard}>
      <div style={styles.infoLabel}>{label}</div>
      <div style={styles.infoValue}>{value}</div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f3f7fb 0%, #fbfdff 100%)",
    padding: "32px 20px",
  },
  wrapper: {
    maxWidth: "1100px",
    margin: "0 auto",
    display: "grid",
    gap: "20px",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: "34px",
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    margin: "8px 0 0 0",
    color: "#64748b",
    fontSize: "15px",
  },
  backButton: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "12px 18px",
    fontWeight: "700",
    cursor: "pointer",
  },
  heroCard: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e8eef7",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  patientName: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: "8px",
  },
  patientId: {
    fontSize: "16px",
    color: "#475569",
    fontWeight: "600",
  },
  badge: {
    padding: "8px 12px",
    borderRadius: "999px",
    fontWeight: "800",
    fontSize: "12px",
  },
  badgeGreen: { background: "#dcfce7", color: "#166534" },
  badgeYellow: { background: "#fef3c7", color: "#92400e" },
  badgeRed: { background: "#fee2e2", color: "#991b1b" },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "12px",
  },
  summaryCard: {
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
    padding: "18px",
    textAlign: "center",
  },
  summaryLabel: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: "700",
  },
  summaryValue: {
    marginTop: "6px",
    fontSize: "24px",
    color: "#0f172a",
    fontWeight: "800",
  },
  dualGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
  },
  sectionCard: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e8eef7",
    display: "grid",
    gap: "16px",
  },
  sectionHeader: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#1d4ed8",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
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
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  infoValue: {
    color: "#0f172a",
    fontSize: "15px",
    fontWeight: "800",
  },
  fieldBlock: {
    display: "grid",
    gap: "10px",
  },
  blockLabel: {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "700",
  },
  largeValue: {
    color: "#0f172a",
    fontSize: "15px",
    fontWeight: "700",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "14px",
    whiteSpace: "pre-wrap",
  },
  chipsWrap: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  chip: {
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "800",
  },
  muted: {
    color: "#94a3b8",
    fontSize: "14px",
    fontWeight: "600",
  },
  infoBox: {
    background: "#f8fafc",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
    borderRadius: "12px",
    padding: "16px",
    fontWeight: "700",
  },
  errorBox: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    padding: "16px",
    fontWeight: "700",
  },
};
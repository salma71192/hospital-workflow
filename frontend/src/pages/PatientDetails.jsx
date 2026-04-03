import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";

export default function PatientDetails() {
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
            <p style={styles.subtitle}>
              Complete patient information in organized sections
            </p>
          </div>

          <button style={styles.backButton} onClick={() => navigate(-1)}>
            Back
          </button>
        </div>

        <div style={styles.heroCard}>
          <div>
            <div style={styles.patientName}>{patient.name}</div>
            <div style={styles.patientId}>Patient ID: {patient.patient_id}</div>
          </div>
        </div>

        <div style={styles.grid}>
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>Approvals</div>
            <div style={styles.fieldRow}>
              <span style={styles.label}>Insurance Provider</span>
              <span style={styles.value}>{patient.insurance_provider || "-"}</span>
            </div>
            <div style={styles.fieldRow}>
              <span style={styles.label}>Authorization Number</span>
              <span style={styles.value}>
                {patient.current_approval_number || "-"}
              </span>
            </div>
            <div style={styles.fieldRow}>
              <span style={styles.label}>Approval Start Date</span>
              <span style={styles.value}>
                {patient.approval_start_date || "-"}
              </span>
            </div>
            <div style={styles.fieldRow}>
              <span style={styles.label}>Approval Expiry Date</span>
              <span style={styles.value}>
                {patient.approval_expiry_date || "-"}
              </span>
            </div>
            <div style={styles.fieldRow}>
              <span style={styles.label}>Approved Sessions</span>
              <span style={styles.value}>{patient.approved_sessions ?? 0}</span>
            </div>
            <div style={styles.fieldBlock}>
              <span style={styles.label}>Approved CPT Codes</span>
              <div style={styles.chipsWrap}>
                {patient.approved_cpt_codes &&
                patient.approved_cpt_codes.length > 0 ? (
                  patient.approved_cpt_codes.map((code, index) => (
                    <span key={index} style={styles.chip}>
                      {code}
                    </span>
                  ))
                ) : (
                  <span style={styles.muted}>No approved CPT codes</span>
                )}
              </div>
            </div>
          </div>

          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>Physio</div>
            <div style={styles.fieldRow}>
              <span style={styles.label}>Utilized Sessions</span>
              <span style={styles.value}>{patient.sessions_taken ?? 0}</span>
            </div>
            <div style={styles.fieldRow}>
              <span style={styles.label}>Therapist Names</span>
              <span style={styles.value}>{patient.taken_with || "-"}</span>
            </div>
          </div>

          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>Call Center</div>
            <div style={styles.fieldBlock}>
              <span style={styles.label}>Appointments</span>
              <div style={styles.largeValue}>
                {patient.current_future_appointments || "-"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f3f7fb 0%, #fbfdff 100%)",
    padding: "32px 20px",
    fontFamily: "Arial, sans-serif",
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
    alignItems: "center",
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
  grid: {
    display: "grid",
    gap: "20px",
  },
  sectionCard: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e8eef7",
    display: "grid",
    gap: "14px",
  },
  sectionHeader: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#1d4ed8",
    marginBottom: "4px",
  },
  fieldRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
    paddingBottom: "10px",
    borderBottom: "1px solid #eef2f7",
  },
  fieldBlock: {
    display: "grid",
    gap: "10px",
  },
  label: {
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "700",
  },
  value: {
    color: "#0f172a",
    fontSize: "15px",
    fontWeight: "700",
    textAlign: "right",
  },
  largeValue: {
    color: "#0f172a",
    fontSize: "15px",
    fontWeight: "700",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "12px 14px",
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
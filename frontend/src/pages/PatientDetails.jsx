import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

export default function PatientDetails({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("patients/")
      .then((res) => {
        const found = (res.data.patients || []).find((p) => p.id === Number(id));
        if (!found) {
          setError("Patient not found");
          return;
        }
        setPatient(found);
      })
      .catch(() => setError("Failed to load patient"));
  }, [id]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleBackToAdmin = () => {
    if (onStopImpersonation) onStopImpersonation();
    navigate("/admin");
  };

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.errorCard}>{error}</div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.loadingCard}>Loading patient...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {actingAs && (
          <div style={styles.banner}>
            <span>Viewing as: {user?.username}</span>
            <button style={styles.bannerButton} onClick={handleBackToAdmin}>
              Back to Admin
            </button>
          </div>
        )}

        <div style={styles.topBar}>
          <div style={styles.leftActions}>
            <button onClick={handleBack} style={styles.backButton}>
              ← Back
            </button>
          </div>

          <button onClick={onLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>

        <div style={styles.heroCard}>
          <div>
            <p style={styles.kicker}>Patient File</p>
            <h1 style={styles.title}>{patient.name}</h1>
            <p style={styles.subtitle}>Patient ID: {patient.patient_id}</p>
          </div>

          <div style={styles.heroBadge}>Active File</div>
        </div>

        <div style={styles.detailsGrid}>
          <div style={styles.detailCard}>
            <span style={styles.label}>Current Approval Number</span>
            <span style={styles.value}>
              {patient.current_approval_number || "-"}
            </span>
          </div>

          <div style={styles.detailCard}>
            <span style={styles.label}>Sessions Taken</span>
            <span style={styles.value}>{patient.sessions_taken ?? 0}</span>
          </div>

          <div style={styles.detailCardWide}>
            <span style={styles.label}>Taken With</span>
            <span style={styles.value}>{patient.taken_with || "-"}</span>
          </div>

          <div style={styles.detailCardWide}>
            <span style={styles.label}>Current / Future Appointments</span>
            <span style={styles.value}>
              {patient.current_future_appointments || "-"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f3f7fb 0%, #eef4ff 100%)",
    padding: "32px 20px",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: "950px",
    margin: "0 auto",
  },
  banner: {
    background: "#fef3c7",
    border: "1px solid #fcd34d",
    color: "#92400e",
    padding: "12px 16px",
    borderRadius: "12px",
    marginBottom: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bannerButton: {
    background: "#92400e",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: "700",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
  },
  leftActions: {
    display: "flex",
    gap: "12px",
  },
  backButton: {
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid #d6deea",
    background: "#fff",
    color: "#0f172a",
    fontWeight: "700",
    cursor: "pointer",
  },
  logoutButton: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "12px 16px",
    cursor: "pointer",
    fontWeight: "700",
  },
  heroCard: {
    background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
    border: "1px solid #e8eef7",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "22px",
  },
  kicker: {
    margin: 0,
    color: "#2563eb",
    fontWeight: "700",
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  title: {
    margin: "10px 0 6px 0",
    fontSize: "34px",
    color: "#0f172a",
    fontWeight: "800",
  },
  subtitle: {
    margin: 0,
    color: "#64748b",
    fontSize: "16px",
    fontWeight: "600",
  },
  heroBadge: {
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "10px 14px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
  },
  detailCard: {
    background: "#fff",
    border: "1px solid #e6edf7",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
    display: "grid",
    gap: "8px",
  },
  detailCardWide: {
    gridColumn: "1 / -1",
    background: "#fff",
    border: "1px solid #e6edf7",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
    display: "grid",
    gap: "8px",
  },
  label: {
    fontSize: "12px",
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  value: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: 1.5,
  },
  loadingCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "24px",
    border: "1px solid #e5e7eb",
    color: "#475569",
    fontWeight: "700",
  },
  errorCard: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: "18px",
    padding: "24px",
    fontWeight: "700",
  },
};
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import PatientSearch from "../components/PatientSearch";

export default function PhysioDashboard({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];
  const [assignments, setAssignments] = useState([]);

  const handleBackToAdmin = () => {
    onStopImpersonation();
    navigate("/admin");
  };

  const loadAssignments = async () => {
    try {
      const res = await api.get(`reception/assignments/?date=${today}`);
      setAssignments(res.data.assignments || []);
    } catch (err) {
      console.error("Failed to load assignments", err);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

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
          <div>
            <h1 style={styles.title}>Physio Dashboard</h1>
            <p style={styles.subtitle}>
              Welcome, {user?.username || "Physio User"}
            </p>
          </div>

          <button style={styles.logoutButton} onClick={onLogout}>
            Logout
          </button>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Today&apos;s Assigned Patients</h2>

          {assignments.length ? (
            <div style={styles.assignmentList}>
              {assignments.map((item) => (
                <div key={item.id} style={styles.assignmentCard}>
                  <div style={styles.assignmentPatient}>{item.patient_name}</div>
                  <div style={styles.assignmentMeta}>
                    Patient ID: {item.patient_file_id}
                  </div>
                  <div style={styles.assignmentMeta}>
                    Date: {item.assignment_date}
                  </div>
                  {item.notes ? (
                    <div style={styles.assignmentMeta}>Notes: {item.notes}</div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>No assigned patients for today.</div>
          )}
        </div>

        <PatientSearch />
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #eefaf5 0%, #f8fffc 100%)",
    padding: "32px 20px",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  banner: {
    background: "#fef3c7",
    border: "1px solid #fcd34d",
    color: "#92400e",
    padding: "12px 16px",
    borderRadius: "10px",
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
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "28px",
  },
  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: "700",
    color: "#166534",
  },
  subtitle: {
    margin: "8px 0 0 0",
    color: "#475569",
    fontSize: "16px",
  },
  logoutButton: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  card: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
    marginBottom: "20px",
  },
  cardTitle: {
    margin: "0 0 12px 0",
    fontSize: "22px",
    color: "#0f172a",
  },
  assignmentList: {
    display: "grid",
    gap: "12px",
  },
  assignmentCard: {
    padding: "14px",
    border: "1px solid #dcfce7",
    background: "#f0fdf4",
    borderRadius: "12px",
  },
  assignmentPatient: {
    fontWeight: "700",
    color: "#14532d",
    marginBottom: "6px",
    fontSize: "17px",
  },
  assignmentMeta: {
    color: "#166534",
    fontSize: "14px",
    marginBottom: "4px",
  },
  emptyState: {
    padding: "18px",
    borderRadius: "12px",
    background: "#f8fafc",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
  },
};
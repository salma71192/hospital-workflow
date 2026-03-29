import React from "react";
import { useNavigate } from "react-router-dom";

export default function DoctorDashboard({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();

  const handleBackToAdmin = () => {
    onStopImpersonation();
    navigate("/admin");
  };

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
            <h1 style={styles.title}>Doctor Dashboard</h1>
            <p style={styles.subtitle}>Welcome, {user?.username || "Doctor"}</p>
          </div>

          <button style={styles.logoutButton} onClick={onLogout}>
            Logout
          </button>
        </div>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Today&apos;s Appointments</h2>
            <div style={styles.listItem}>09:00 AM — John Doe</div>
            <div style={styles.listItem}>10:30 AM — Sara Ahmed</div>
            <div style={styles.listItem}>12:00 PM — Maryam Ali</div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Quick Summary</h2>
            <div style={styles.statsWrap}>
              <div style={styles.statBox}>
                <span style={styles.statNumber}>14</span>
                <span style={styles.statLabel}>Appointments</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statNumber}>4</span>
                <span style={styles.statLabel}>Pending Reviews</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statNumber}>2</span>
                <span style={styles.statLabel}>Urgent Cases</span>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Notes</h2>
          <p style={styles.cardText}>
            This is a starter doctor dashboard. Next step is connecting real
            appointment and patient record APIs.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f9ff 0%, #fbfdff 100%)",
    padding: "32px 20px",
    fontFamily: "Arial, sans-serif",
  },
  container: { maxWidth: "1100px", margin: "0 auto" },
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
  title: { margin: 0, fontSize: "32px", fontWeight: "700", color: "#1d4ed8" },
  subtitle: { margin: "8px 0 0 0", color: "#475569", fontSize: "16px" },
  logoutButton: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    cursor: "pointer",
    fontWeight: "600",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
    marginBottom: "24px",
  },
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  },
  cardTitle: { margin: "0 0 12px 0", fontSize: "22px", color: "#0f172a" },
  cardText: { margin: 0, color: "#64748b", lineHeight: 1.6 },
  listItem: {
    padding: "12px 14px",
    border: "1px solid #dbeafe",
    background: "#eff6ff",
    borderRadius: "10px",
    marginBottom: "10px",
    color: "#1e40af",
    fontWeight: "500",
  },
  statsWrap: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
  },
  statBox: {
    background: "#eff6ff",
    borderRadius: "14px",
    padding: "18px 12px",
    textAlign: "center",
  },
  statNumber: {
    display: "block",
    fontSize: "28px",
    fontWeight: "700",
    color: "#2563eb",
    marginBottom: "6px",
  },
  statLabel: { fontSize: "13px", color: "#475569" },
};
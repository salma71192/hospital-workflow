import React from "react";
import { useNavigate } from "react-router-dom";
import PatientSearch from "../components/PatientSearch";

export default function VisitorCeoDashboard({
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
            <button style={styles.bannerButton} onClick={handleBackToAdmin}>Back to Admin</button>
          </div>
        )}

        <div style={styles.topBar}>
          <div>
            <h1 style={styles.title}>Visitor CEO Dashboard</h1>
            <p style={styles.subtitle}>Welcome, {user?.username}</p>
          </div>
          <button style={styles.logoutButton} onClick={onLogout}>Logout</button>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Executive Visitor Overview</h2>
          <div style={styles.listItem}>VIP visitors today — 3</div>
          <div style={styles.listItem}>Board guest approvals — 2</div>
          <div style={styles.listItem}>Security escorts assigned — 2</div>
        </div>

        <PatientSearch />
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg, #f3f4f6 0%, #fafafa 100%)", padding: "32px 20px", fontFamily: "Arial, sans-serif" },
  container: { maxWidth: "1100px", margin: "0 auto" },
  banner: { background: "#fef3c7", border: "1px solid #fcd34d", color: "#92400e", padding: "12px 16px", borderRadius: "10px", marginBottom: "18px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  bannerButton: { background: "#92400e", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 12px", cursor: "pointer" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "28px" },
  title: { margin: 0, fontSize: "32px", fontWeight: "700", color: "#374151" },
  subtitle: { margin: "8px 0 0 0", color: "#475569", fontSize: "16px" },
  logoutButton: { background: "#ef4444", color: "#fff", border: "none", borderRadius: "10px", padding: "12px 18px", cursor: "pointer", fontWeight: "600" },
  card: { background: "#fff", borderRadius: "18px", padding: "24px", boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)", marginBottom: "20px" },
  cardTitle: { margin: "0 0 12px 0", fontSize: "22px", color: "#0f172a" },
  listItem: { padding: "12px 14px", border: "1px solid #e5e7eb", background: "#f9fafb", borderRadius: "10px", marginBottom: "10px", color: "#374151", fontWeight: "500" },
};
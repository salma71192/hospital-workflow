import React from "react";

export default function RcmDashboard({ user, onLogout }) {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.title}>RCM Dashboard</h1>
            <p style={styles.subtitle}>Welcome, {user?.username || "RCM User"}</p>
          </div>

          <button style={styles.logoutButton} onClick={onLogout}>
            Logout
          </button>
        </div>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Claims Overview</h2>
            <div style={styles.listItem}>Pending Claims — 21</div>
            <div style={styles.listItem}>Approved Today — 13</div>
            <div style={styles.listItem}>Rejected Claims — 3</div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Revenue Status</h2>
            <div style={styles.statsWrap}>
              <div style={styles.statBox}>
                <span style={styles.statNumber}>85%</span>
                <span style={styles.statLabel}>Collection Rate</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statNumber}>9</span>
                <span style={styles.statLabel}>Follow-ups</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statNumber}>4</span>
                <span style={styles.statLabel}>Escalations</span>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Notes</h2>
          <p style={styles.cardText}>
            This starter RCM dashboard can later connect to billing, insurance,
            and claims APIs.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #fff7ed 0%, #fffbf5 100%)",
    padding: "32px 20px",
    fontFamily: "Arial, sans-serif",
  },
  container: { maxWidth: "1100px", margin: "0 auto" },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "28px",
  },
  title: { margin: 0, fontSize: "32px", fontWeight: "700", color: "#c2410c" },
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
    border: "1px solid #fed7aa",
    background: "#fff7ed",
    borderRadius: "10px",
    marginBottom: "10px",
    color: "#9a3412",
    fontWeight: "500",
  },
  statsWrap: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
  },
  statBox: {
    background: "#fff7ed",
    borderRadius: "14px",
    padding: "18px 12px",
    textAlign: "center",
  },
  statNumber: {
    display: "block",
    fontSize: "28px",
    fontWeight: "700",
    color: "#ea580c",
    marginBottom: "6px",
  },
  statLabel: { fontSize: "13px", color: "#475569" },
};
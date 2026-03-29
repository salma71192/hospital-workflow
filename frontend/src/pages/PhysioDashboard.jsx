import React from "react";

export default function PhysioDashboard({ user, onLogout }) {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
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

        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Today&apos;s Queue</h2>
            <div style={styles.listItem}>John Doe — Initial Assessment</div>
            <div style={styles.listItem}>Sara Ali — Follow-up Session</div>
            <div style={styles.listItem}>Ahmed Khan — Rehab Review</div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Quick Stats</h2>
            <div style={styles.statsWrap}>
              <div style={styles.statBox}>
                <span style={styles.statNumber}>9</span>
                <span style={styles.statLabel}>Patients Today</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statNumber}>3</span>
                <span style={styles.statLabel}>Waiting</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statNumber}>6</span>
                <span style={styles.statLabel}>Completed</span>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Notes</h2>
          <p style={styles.cardText}>
            This is a starter physio dashboard. Next step is connecting it to
            real patient data from your API.
          </p>
        </div>
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
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
    marginBottom: "24px",
  },
  card: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  },
  cardTitle: {
    margin: "0 0 12px 0",
    fontSize: "22px",
    color: "#0f172a",
  },
  cardText: {
    margin: 0,
    color: "#64748b",
    lineHeight: 1.6,
  },
  listItem: {
    padding: "12px 14px",
    border: "1px solid #dcfce7",
    background: "#f0fdf4",
    borderRadius: "10px",
    marginBottom: "10px",
    color: "#14532d",
    fontWeight: "500",
  },
  statsWrap: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
  },
  statBox: {
    background: "#ecfdf5",
    borderRadius: "14px",
    padding: "18px 12px",
    textAlign: "center",
  },
  statNumber: {
    display: "block",
    fontSize: "28px",
    fontWeight: "700",
    color: "#15803d",
    marginBottom: "6px",
  },
  statLabel: {
    fontSize: "13px",
    color: "#475569",
  },
};
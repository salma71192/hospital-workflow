import React, { useState } from "react";

export default function ReceptionDashboard({ user, onLogout }) {
  const [searchFile, setSearchFile] = useState("");
  const [assignedPatient, setAssignedPatient] = useState(null);
  const [message, setMessage] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();

    // temporary demo data
    const patient = {
      fileNumber: searchFile,
      fullName: "John Doe",
      age: 34,
      phone: "+971 50 123 4567",
      visitType: "Follow-up",
    };

    setAssignedPatient(patient);
    setMessage("");
  };

  const handleAssign = () => {
    if (!assignedPatient) return;

    setMessage(
      `${assignedPatient.fullName} has been assigned to physiotherapy successfully.`
    );
    setSearchFile("");
    setAssignedPatient(null);
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.title}>Reception Dashboard</h1>
            <p style={styles.subtitle}>
              Welcome, {user?.username || "Reception User"}
            </p>
          </div>

          <button style={styles.logoutButton} onClick={onLogout}>
            Logout
          </button>
        </div>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Search Patient</h2>
            <p style={styles.cardText}>
              Enter patient file number to find and assign to physiotherapy.
            </p>

            <form onSubmit={handleSearch} style={styles.form}>
              <input
                type="text"
                placeholder="Enter file number"
                value={searchFile}
                onChange={(e) => setSearchFile(e.target.value)}
                required
                style={styles.input}
              />
              <button type="submit" style={styles.primaryButton}>
                Search
              </button>
            </form>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Quick Stats</h2>
            <div style={styles.statsWrap}>
              <div style={styles.statBox}>
                <span style={styles.statNumber}>24</span>
                <span style={styles.statLabel}>Today's Visits</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statNumber}>8</span>
                <span style={styles.statLabel}>Pending Assignments</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statNumber}>5</span>
                <span style={styles.statLabel}>Physio Queue</span>
              </div>
            </div>
          </div>
        </div>

        {assignedPatient && (
          <div style={styles.patientCard}>
            <h2 style={styles.cardTitle}>Patient Found</h2>

            <div style={styles.patientInfo}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Full Name:</span>
                <span>{assignedPatient.fullName}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>File Number:</span>
                <span>{assignedPatient.fileNumber}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Age:</span>
                <span>{assignedPatient.age}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Phone:</span>
                <span>{assignedPatient.phone}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Visit Type:</span>
                <span>{assignedPatient.visitType}</span>
              </div>
            </div>

            <button style={styles.assignButton} onClick={handleAssign}>
              Assign to Physiotherapy
            </button>
          </div>
        )}

        {message && <div style={styles.successMessage}>{message}</div>}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #eef4ff 0%, #f8fbff 100%)",
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
    color: "#1e3a8a",
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
    margin: "0 0 18px 0",
    color: "#64748b",
    lineHeight: 1.5,
  },
  form: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  input: {
    flex: 1,
    minWidth: "220px",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    outline: "none",
  },
  primaryButton: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
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
    color: "#1d4ed8",
    marginBottom: "6px",
  },
  statLabel: {
    fontSize: "13px",
    color: "#475569",
  },
  patientCard: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  },
  patientInfo: {
    display: "grid",
    gap: "10px",
    marginTop: "12px",
    marginBottom: "20px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    padding: "10px 0",
    borderBottom: "1px solid #e2e8f0",
    color: "#334155",
  },
  infoLabel: {
    fontWeight: "700",
    color: "#0f172a",
  },
  assignButton: {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 20px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  successMessage: {
    marginTop: "20px",
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #86efac",
    borderRadius: "12px",
    padding: "14px 16px",
    fontWeight: "600",
  },
};

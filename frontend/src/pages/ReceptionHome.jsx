import React from "react";
import { useNavigate } from "react-router-dom";

export default function ReceptionHome({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();

  const displayName = actingAs?.username || user?.username || "Reception User";

  const handleBackToAdmin = () => {
    onStopImpersonation?.();
    navigate("/admin");
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {actingAs ? (
          <div style={styles.banner}>
            <div style={styles.bannerText}>
              Viewing as: <strong>{actingAs?.username}</strong>
            </div>

            <button type="button" style={styles.bannerButton} onClick={handleBackToAdmin}>
              Back to Admin
            </button>
          </div>
        ) : null}

        <div style={styles.topBar}>
          <div>
            <div style={styles.eyebrow}>Reception Workspace</div>
            <h1 style={styles.title}>Welcome, {displayName}</h1>
            <p style={styles.subtitle}>
              Choose the workflow you want to work on today.
            </p>
          </div>

          <button type="button" style={styles.logoutButton} onClick={onLogout}>
            Logout
          </button>
        </div>

        <div style={styles.heroCard}>
          <div style={styles.heroBadge}>Reception Dashboard</div>
          <div style={styles.heroTitle}>Two focused workspaces</div>
          <div style={styles.heroText}>
            Open Registration for patient files and assignments, or open Booking
            for appointments and booking trackers.
          </div>
        </div>

        <div style={styles.grid}>
          <button
            type="button"
            style={styles.workflowCard}
            onClick={() => navigate("/reception/registration")}
          >
            <div style={styles.cardEyebrow}>Block 1</div>
            <div style={styles.cardTitle}>Registration</div>
            <div style={styles.cardText}>
              Search patient, register new patient, assign to physiotherapist,
              review today’s assignments, and track monthly assignment history.
            </div>

            <div style={styles.list}>
              <span style={styles.listItem}>Search Patient</span>
              <span style={styles.listItem}>Register New Patient</span>
              <span style={styles.listItem}>Assign to Physio</span>
              <span style={styles.listItem}>Today&apos;s Assignments</span>
              <span style={styles.listItem}>Monthly Tracker</span>
            </div>

            <div style={styles.primaryAction}>Open Registration Workspace</div>
          </button>

          <button
            type="button"
            style={{ ...styles.workflowCard, ...styles.workflowCardPink }}
            onClick={() => navigate("/reception/booking")}
          >
            <div style={{ ...styles.cardEyebrow, ...styles.cardEyebrowPink }}>
              Block 2
            </div>
            <div style={styles.cardTitle}>Booking</div>
            <div style={styles.cardText}>
              Search patient for booking, book appointments, review today’s
              bookings, monthly booking tracker, and future booking tracker.
            </div>

            <div style={styles.list}>
              <span style={styles.listItem}>Search Patient</span>
              <span style={styles.listItem}>Book Appointment</span>
              <span style={styles.listItem}>Today&apos;s Bookings</span>
              <span style={styles.listItem}>Monthly Bookings</span>
              <span style={styles.listItem}>Future Bookings</span>
            </div>

            <div style={{ ...styles.primaryAction, ...styles.primaryActionPink }}>
              Open Booking Workspace
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 55%, #fdf2f8 100%)",
    padding: "32px 20px",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "grid",
    gap: "22px",
  },
  banner: {
    background: "#fef3c7",
    border: "1px solid #fcd34d",
    borderRadius: "12px",
    padding: "12px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  bannerText: {
    fontSize: "14px",
    color: "#92400e",
    fontWeight: "700",
  },
  bannerButton: {
    background: "#92400e",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  topBar: {
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
    color: "#1d4ed8",
    marginBottom: "10px",
  },
  title: {
    margin: 0,
    fontSize: "38px",
    lineHeight: 1.1,
    fontWeight: "900",
    color: "#0f172a",
  },
  subtitle: {
    margin: "10px 0 0 0",
    fontSize: "16px",
    color: "#475569",
    fontWeight: "600",
  },
  logoutButton: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "12px 18px",
    fontWeight: "800",
    cursor: "pointer",
  },
  heroCard: {
    background: "#fff",
    border: "1px solid #dbeafe",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.06)",
    display: "grid",
    gap: "10px",
  },
  heroBadge: {
    width: "fit-content",
    background: "#dbeafe",
    color: "#1d4ed8",
    borderRadius: "999px",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  heroTitle: {
    fontSize: "28px",
    fontWeight: "900",
    color: "#0f172a",
  },
  heroText: {
    fontSize: "15px",
    color: "#64748b",
    fontWeight: "600",
    maxWidth: "760px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
  },
  workflowCard: {
    background: "#fff",
    border: "1px solid #dbeafe",
    borderRadius: "24px",
    padding: "24px",
    textAlign: "left",
    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.06)",
    display: "grid",
    gap: "14px",
    cursor: "pointer",
  },
  workflowCardPink: {
    border: "1px solid #fbcfe8",
  },
  cardEyebrow: {
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#1d4ed8",
  },
  cardEyebrowPink: {
    color: "#be185d",
  },
  cardTitle: {
    fontSize: "30px",
    fontWeight: "900",
    color: "#0f172a",
  },
  cardText: {
    fontSize: "15px",
    color: "#64748b",
    fontWeight: "600",
    lineHeight: 1.5,
  },
  list: {
    display: "grid",
    gap: "8px",
  },
  listItem: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "10px 12px",
    fontSize: "14px",
    fontWeight: "700",
    color: "#334155",
  },
  primaryAction: {
    marginTop: "4px",
    background: "#1e3a8a",
    color: "#fff",
    borderRadius: "14px",
    padding: "14px 16px",
    fontWeight: "800",
    textAlign: "center",
  },
  primaryActionPink: {
    background: "#be185d",
  },
};
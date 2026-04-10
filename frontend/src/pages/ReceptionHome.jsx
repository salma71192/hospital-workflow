import React, { useMemo } from "react";
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

  const dailyMessage = useMemo(() => {
    const messages = [
      "A calm start creates a smoother day for every patient.",
      "Good coordination at reception supports better care.",
      "Each organized task helps the clinic move with confidence.",
      "A clear workflow makes every patient interaction easier.",
      "Small details handled well make a big difference.",
      "Consistency at the front desk builds trust.",
      "The best workflows feel simple, clear, and calm.",
    ];

    return messages[new Date().getDate() % messages.length];
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {actingAs ? (
          <div style={styles.banner}>
            <div style={styles.bannerText}>
              Viewing as: <strong>{actingAs?.username}</strong>
            </div>

            <button
              type="button"
              style={styles.bannerButton}
              onClick={handleBackToAdmin}
            >
              Back to Admin
            </button>
          </div>
        ) : null}

        <div style={styles.topBar}>
          <div>
            <div style={styles.eyebrow}>Reception</div>
            <h1 style={styles.title}>Welcome back, {displayName}</h1>
            <p style={styles.subtitle}>
              Choose where you want to continue your work.
            </p>
          </div>

          <button type="button" style={styles.logoutButton} onClick={onLogout}>
            Logout
          </button>
        </div>

        <div style={styles.messageCard}>
          <div style={styles.messageLabel}>Today&apos;s Message</div>
          <div style={styles.messageText}>{dailyMessage}</div>
        </div>

        <div style={styles.grid}>
          <button
            type="button"
            style={styles.card}
            onClick={() => navigate("/reception/registration")}
          >
            <div style={styles.cardHeader}>
              <div>
                <div style={styles.cardEyebrowBlue}>Workspace</div>
                <div style={styles.cardTitle}>Registration</div>
              </div>
              <div style={styles.badgeBlue}>R</div>
            </div>

            <div style={styles.cardText}>
              Search patients, open new files, and manage registration tasks.
            </div>

            <div style={styles.cardActionBlue}>Open Registration →</div>
          </button>

          <button
            type="button"
            style={styles.card}
            onClick={() => navigate("/reception/booking")}
          >
            <div style={styles.cardHeader}>
              <div>
                <div style={styles.cardEyebrowPink}>Workspace</div>
                <div style={styles.cardTitle}>Booking</div>
              </div>
              <div style={styles.badgePink}>B</div>
            </div>

            <div style={styles.cardText}>
              Book appointments, manage schedules, and review booking trackers.
            </div>

            <div style={styles.cardActionPink}>Open Booking →</div>
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "36px 20px",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    display: "grid",
    gap: "20px",
  },
  banner: {
    background: "#fff7ed",
    border: "1px solid #fdba74",
    borderRadius: "14px",
    padding: "12px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  bannerText: {
    fontSize: "14px",
    color: "#9a3412",
    fontWeight: "700",
  },
  bannerButton: {
    background: "#9a3412",
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
    color: "#475569",
    marginBottom: "8px",
  },
  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    margin: "8px 0 0 0",
    fontSize: "15px",
    color: "#64748b",
    fontWeight: "500",
  },
  logoutButton: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "12px 16px",
    fontWeight: "700",
    cursor: "pointer",
  },
  messageCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "20px",
    display: "grid",
    gap: "8px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
  },
  messageLabel: {
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#64748b",
  },
  messageText: {
    fontSize: "18px",
    lineHeight: 1.6,
    fontWeight: "600",
    color: "#0f172a",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "18px",
  },
  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    padding: "22px",
    display: "grid",
    gap: "18px",
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },
  cardEyebrowBlue: {
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#2563eb",
    marginBottom: "6px",
  },
  cardEyebrowPink: {
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#db2777",
    marginBottom: "6px",
  },
  cardTitle: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
  },
  badgeBlue: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    background: "#dbeafe",
    color: "#1d4ed8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
  },
  badgePink: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    background: "#fce7f3",
    color: "#be185d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
  },
  cardText: {
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#64748b",
    fontWeight: "500",
  },
  cardActionBlue: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#2563eb",
  },
  cardActionPink: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#db2777",
  },
};
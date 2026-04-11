import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function ApprovalsHome({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();

  const displayName = actingAs?.username || user?.username || "Approvals User";

  const handleBackToAdmin = () => {
    onStopImpersonation?.();
    navigate("/admin");
  };

  const dailyMessage = useMemo(() => {
    const messages = [
      "Clear approvals create smoother patient journeys.",
      "Accurate approval work prevents delays later.",
      "Each reviewed case supports better coordination.",
      "Consistency in approvals builds trust across teams.",
      "A simple workflow makes better decisions easier.",
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
            <button type="button" style={styles.bannerButton} onClick={handleBackToAdmin}>
              Back to Admin
            </button>
          </div>
        ) : null}

        <div style={styles.topBar}>
          <div>
            <div style={styles.eyebrow}>Approvals</div>
            <h1 style={styles.title}>Welcome back, {displayName}</h1>
            <p style={styles.subtitle}>Choose the workspace you want to continue with today.</p>
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
            onClick={() => navigate("/approvals/alerts")}
          >
            <div style={styles.cardHeader}>
              <div>
                <div style={styles.cardEyebrowBlue}>Workspace</div>
                <div style={styles.cardTitle}>Alerts</div>
              </div>
              <div style={styles.badgeBlue}>A</div>
            </div>

            <div style={styles.cardText}>
              Review alerts, urgent follow-ups, and pending approval actions.
            </div>

            <div style={styles.cardActionBlue}>Open Alerts →</div>
          </button>

          <button
            type="button"
            style={styles.card}
            onClick={() => navigate("/approvals/workspace")}
          >
            <div style={styles.cardHeader}>
              <div>
                <div style={styles.cardEyebrowPink}>Workspace</div>
                <div style={styles.cardTitle}>Approvals</div>
              </div>
              <div style={styles.badgePink}>P</div>
            </div>

            <div style={styles.cardText}>
              Add new approvals, register new patients, and review approval history.
            </div>

            <div style={styles.cardActionPink}>Open Approvals →</div>
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f8fafc", padding: "56px 24px 72px" },
  container: { maxWidth: "1080px", margin: "0 auto", display: "grid", gap: "28px" },
  banner: {
    background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "16px",
    padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap",
  },
  bannerText: { fontSize: "14px", color: "#9a3412", fontWeight: "700" },
  bannerButton: {
    background: "#9a3412", color: "#fff", border: "none", borderRadius: "10px",
    padding: "10px 14px", fontWeight: "700", cursor: "pointer",
  },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" },
  eyebrow: { fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" },
  title: { margin: 0, fontSize: "34px", lineHeight: 1.2, fontWeight: "700", color: "#0f172a" },
  subtitle: { margin: "8px 0 0 0", fontSize: "16px", color: "#64748b", fontWeight: "500", lineHeight: 1.7 },
  logoutButton: {
    background: "#ffffff", color: "#dc2626", border: "1px solid #fecaca",
    borderRadius: "14px", padding: "12px 16px", fontWeight: "700", cursor: "pointer",
  },
  messageCard: {
    background: "#fff", border: "1px solid #e2e8f0", borderRadius: "24px",
    padding: "26px 28px", display: "grid", gap: "10px", boxShadow: "0 8px 30px rgba(15, 23, 42, 0.04)",
  },
  messageLabel: {
    width: "fit-content", fontSize: "12px", fontWeight: "800", textTransform: "uppercase",
    letterSpacing: "0.08em", color: "#64748b", background: "#f1f5f9", borderRadius: "999px", padding: "6px 12px",
  },
  messageText: { fontSize: "20px", lineHeight: 1.8, color: "#0f172a", fontWeight: "600", maxWidth: "760px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "22px" },
  card: {
    background: "#fff", border: "1px solid #e2e8f0", borderRadius: "24px",
    textAlign: "left", cursor: "pointer", boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04)", padding: "28px", display: "grid", gap: "22px",
  },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "14px" },
  cardEyebrowBlue: { fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.08em", color: "#2563eb", marginBottom: "8px" },
  cardEyebrowPink: { fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.08em", color: "#db2777", marginBottom: "8px" },
  cardTitle: { fontSize: "26px", fontWeight: "700", color: "#0f172a", lineHeight: 1.25 },
  badgeBlue: {
    width: "44px", height: "44px", borderRadius: "14px", background: "#eff6ff", color: "#2563eb",
    display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "16px",
  },
  badgePink: {
    width: "44px", height: "44px", borderRadius: "14px", background: "#fdf2f8", color: "#db2777",
    display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "16px",
  },
  cardText: { fontSize: "15px", lineHeight: 1.8, color: "#64748b", fontWeight: "500" },
  cardActionBlue: { fontSize: "14px", fontWeight: "800", color: "#2563eb" },
  cardActionPink: { fontSize: "14px", fontWeight: "800", color: "#db2777" },
};
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function PhysioHome({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();

  const displayName = actingAs?.username || user?.username || "Physio User";

  const handleBackToAdmin = () => {
    onStopImpersonation?.();
    navigate("/admin");
  };

  const dailyMessage = useMemo(() => {
    const messages = [
      "A clear treatment plan creates better follow-up outcomes.",
      "Small progress notes today become better recovery decisions tomorrow.",
      "Consistency in follow-up improves patient confidence.",
      "A well-managed schedule supports better care quality.",
      "Every accurate session update helps the whole team.",
    ];

    return messages[new Date().getDate() % messages.length];
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.softGlowBlue} />
      <div style={styles.softGlowGreen} />

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
          <div style={styles.titleBlock}>
            <div style={styles.eyebrow}>Physiotherapist</div>
            <h1 style={styles.title}>Welcome back, {displayName}</h1>
            <p style={styles.subtitle}>
              Choose the workspace you want to continue with today.
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
            onClick={() => navigate("/physio/booking")}
          >
            <div style={styles.cardContent}>
              <div style={styles.cardHeader}>
                <div>
                  <div style={styles.cardEyebrowBlue}>Workspace</div>
                  <div style={styles.cardTitle}>Booking</div>
                </div>

                <div style={styles.badgeBlue}>B</div>
              </div>

              <div style={styles.cardText}>
                View your bookings, appointment schedule, and daily workload.
              </div>

              <div style={styles.cardActionBlue}>Open Booking →</div>
            </div>
          </button>

          <button
            type="button"
            style={styles.card}
            onClick={() => navigate("/physio/followup")}
          >
            <div style={styles.cardContent}>
              <div style={styles.cardHeader}>
                <div>
                  <div style={styles.cardEyebrowGreen}>Workspace</div>
                  <div style={styles.cardTitle}>Patient Follow-Up</div>
                </div>

                <div style={styles.badgeGreen}>F</div>
              </div>

              <div style={styles.cardText}>
                Track patient progress, follow-up notes, and next care actions.
              </div>

              <div style={styles.cardActionGreen}>Open Follow-Up →</div>
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
    position: "relative",
    overflow: "hidden",
    background: "#f8fafc",
    padding: "56px 24px 72px",
  },
  softGlowBlue: {
    position: "absolute",
    top: "-140px",
    left: "-120px",
    width: "360px",
    height: "360px",
    borderRadius: "999px",
    background: "rgba(59, 130, 246, 0.07)",
    filter: "blur(70px)",
    pointerEvents: "none",
  },
  softGlowGreen: {
    position: "absolute",
    bottom: "-160px",
    right: "-100px",
    width: "360px",
    height: "360px",
    borderRadius: "999px",
    background: "rgba(16, 185, 129, 0.06)",
    filter: "blur(70px)",
    pointerEvents: "none",
  },
  container: {
    position: "relative",
    zIndex: 1,
    maxWidth: "1080px",
    margin: "0 auto",
    display: "grid",
    gap: "28px",
  },
  banner: {
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    borderRadius: "16px",
    padding: "14px 18px",
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
    gap: "20px",
    flexWrap: "wrap",
  },
  titleBlock: {
    display: "grid",
    gap: "10px",
  },
  eyebrow: {
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#64748b",
  },
  title: {
    margin: 0,
    fontSize: "34px",
    lineHeight: 1.2,
    fontWeight: "700",
    color: "#0f172a",
  },
  subtitle: {
    margin: 0,
    fontSize: "16px",
    color: "#64748b",
    fontWeight: "500",
    lineHeight: 1.7,
    maxWidth: "620px",
  },
  logoutButton: {
    background: "#ffffff",
    color: "#dc2626",
    border: "1px solid #fecaca",
    borderRadius: "14px",
    padding: "12px 16px",
    fontWeight: "700",
    cursor: "pointer",
  },
  messageCard: {
    background: "rgba(255, 255, 255, 0.88)",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    padding: "26px 28px",
    display: "grid",
    gap: "10px",
    boxShadow: "0 8px 30px rgba(15, 23, 42, 0.04)",
  },
  messageLabel: {
    width: "fit-content",
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#64748b",
    background: "#f1f5f9",
    borderRadius: "999px",
    padding: "6px 12px",
  },
  messageText: {
    fontSize: "20px",
    lineHeight: 1.8,
    color: "#0f172a",
    fontWeight: "600",
    maxWidth: "760px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "22px",
    marginTop: "6px",
  },
  card: {
    background: "rgba(255, 255, 255, 0.92)",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04)",
  },
  cardContent: {
    padding: "28px",
    display: "grid",
    gap: "22px",
    minHeight: "220px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "14px",
  },
  cardEyebrowBlue: {
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#2563eb",
    marginBottom: "8px",
  },
  cardEyebrowGreen: {
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#059669",
    marginBottom: "8px",
  },
  cardTitle: {
    fontSize: "26px",
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: 1.25,
  },
  badgeBlue: {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    background: "#eff6ff",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "16px",
    flexShrink: 0,
  },
  badgeGreen: {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    background: "#ecfdf5",
    color: "#059669",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "16px",
    flexShrink: 0,
  },
  cardText: {
    fontSize: "15px",
    lineHeight: 1.8,
    color: "#64748b",
    fontWeight: "500",
    maxWidth: "420px",
  },
  cardActionBlue: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#2563eb",
    marginTop: "6px",
  },
  cardActionGreen: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#059669",
    marginTop: "6px",
  },
};
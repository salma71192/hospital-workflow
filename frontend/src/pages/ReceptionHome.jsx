import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
export default function ReceptionHome({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();
  const displayName =
    actingAs?.username || user?.username || "Reception User";
  const handleBackToAdmin = () => {
    onStopImpersonation?.();
    navigate("/admin");
  };
  const dailyMessage = useMemo(() => {
    const messages = [
      "🌅 A fresh day brings new opportunities to make every patient feel welcome and cared for.",
      "💙 Your kindness, patience, and coordination help create a smoother experience for every patient.",
      "🌷 Every small detail matters. Your dedication makes a meaningful difference in patient care.",
      "✨ Stay organized, stay positive, and remember that great teamwork makes great care possible.",
      "🤝 A warm welcome and clear communication can turn a patient's stressful day into a better one.",
      "🌟 Your work at reception is the first step toward a positive patient experience. Keep shining!",
      "🌿 Take each task one step at a time. A calm mind and an organized workflow make all the difference.",
      "💪 Every patient interaction is an opportunity to show professionalism, compassion, and care.",
      "😊 A friendly smile, a helpful response, and a little patience can brighten someone's day.",
      "🎯 Focus on progress, support your team, and celebrate the difference you make every day.",
      "💐 Great service starts with a caring attitude. Thank you for making patients feel valued.",
      "🚀 One organized day, one supportive team, and one positive interaction at a time!",
      "🩵 Your efforts keep the clinic moving smoothly. Keep up the wonderful work!",
      "🌈 Challenges are easier when we work together. Let's make today productive and positive.",
    ];
    const today = new Date();
    const dayOfYear = Math.floor(
      (today - new Date(today.getFullYear(), 0, 0)) / 86400000
    );
    return messages[dayOfYear % messages.length];
  }, []);
  return (
    <div style={styles.page}>
      <div style={styles.softGlowBlue} />
      <div style={styles.softGlowPink} />
      <div style={styles.container}>
        {actingAs ? (
          <div style={styles.banner}>
            <div style={styles.bannerText}>
              👤 Viewing as: <strong>{actingAs?.username}</strong>
            </div>
            <button
              type="button"
              style={styles.bannerButton}
              onClick={handleBackToAdmin}
            >
              ← Back to Admin
            </button>
          </div>
        ) : null}
        <div style={styles.topBar}>
          <div style={styles.titleBlock}>
            <div style={styles.eyebrow}>
              🏥 Reception Workspace
            </div>
            <h1 style={styles.title}>
              Welcome back, {displayName} 👋
            </h1>
            <p style={styles.subtitle}>
              Your day starts here. Choose the workspace you want to
              continue with and let's make today productive!
            </p>
          </div>
          <button
            type="button"
            style={styles.logoutButton}
            onClick={onLogout}
            title="Log out of your account"
          >
            <span aria-hidden="true">⏻</span>
            <span>Logout</span>
          </button>
        </div>
        <div style={styles.messageCard}>
          <div style={styles.messageHeader}>
            <div style={styles.messageIcon}>💌</div>
            <div>
              <div style={styles.messageLabel}>
                Today's Message
              </div>
              <div style={styles.messageSubLabel}>
                A little encouragement for your day
              </div>
            </div>
          </div>
          <div style={styles.messageText}>
            {dailyMessage}
          </div>
          <div style={styles.messageFooter}>
            ✨ Make today count, one patient at a time.
          </div>
        </div>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              Your Workspace 🗂️
            </h2>
            <p style={styles.sectionSubtitle}>
              Select a workspace to get started.
            </p>
          </div>
        </div>
        <div style={styles.grid}>
          <button
            type="button"
            style={styles.card}
            onClick={() => navigate("/reception/registration")}
          >
            <div style={styles.cardContent}>
              <div style={styles.cardHeader}>
                <div>
                  <div style={styles.cardEyebrowBlue}>
                    📋 Patient Management
                  </div>
                  <div style={styles.cardTitle}>
                    Registration
                  </div>
                </div>
                <div style={styles.badgeBlue}>📝</div>
              </div>
              <div style={styles.cardText}>
                Search for existing patients, assign patients,
                open new patient files, and manage registration
                tasks in one convenient workspace.
              </div>
              <div style={styles.cardActionBlue}>
                Open Registration <span aria-hidden="true">→</span>
              </div>
            </div>
          </button>
        </div>
        <div style={styles.footer}>
          💙 Thank you for being an important part of the patient
          care journey.
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
    padding: "56px 24px 40px",
    boxSizing: "border-box",
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  softGlowBlue: {
    position: "absolute",
    top: "-140px",
    left: "-120px",
    width: "360px",
    height: "360px",
    borderRadius: "999px",
    background: "rgba(59, 130, 246, 0.09)",
    filter: "blur(70px)",
    pointerEvents: "none",
  },
  softGlowPink: {
    position: "absolute",
    bottom: "-160px",
    right: "-100px",
    width: "360px",
    height: "360px",
    borderRadius: "999px",
    background: "rgba(236, 72, 153, 0.07)",
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
    boxShadow: "0 4px 14px rgba(154, 52, 18, 0.04)",
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
    flex: "1",
    minWidth: "260px",
  },
  eyebrow: {
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#2563eb",
  },
  title: {
    margin: 0,
    fontSize: "34px",
    lineHeight: 1.25,
    fontWeight: "800",
    color: "#0f172a",
    overflowWrap: "anywhere",
  },
  subtitle: {
    margin: 0,
    fontSize: "16px",
    color: "#64748b",
    fontWeight: "500",
    lineHeight: 1.8,
    maxWidth: "650px",
  },
  logoutButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    background: "#334155",
    color: "#ffffff",
    border: "1px solid #334155",
    borderRadius: "14px",
    padding: "12px 18px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 5px 14px rgba(51, 65, 85, 0.16)",
    flexShrink: 0,
  },
  messageCard: {
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(239,246,255,0.94))",
    border: "1px solid #dbeafe",
    borderRadius: "24px",
    padding: "28px",
    display: "grid",
    gap: "18px",
    boxShadow: "0 10px 32px rgba(15, 23, 42, 0.05)",
  },
  messageHeader: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  messageIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    background: "#dbeafe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "23px",
    flexShrink: 0,
  },
  messageLabel: {
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#1d4ed8",
    marginBottom: "5px",
  },
  messageSubLabel: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: "500",
  },
  messageText: {
    fontSize: "19px",
    lineHeight: 1.9,
    color: "#0f172a",
    fontWeight: "600",
    maxWidth: "850px",
  },
  messageFooter: {
    borderTop: "1px solid #dbeafe",
    paddingTop: "15px",
    fontSize: "13px",
    color: "#2563eb",
    fontWeight: "700",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "-8px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "23px",
    fontWeight: "800",
    color: "#0f172a",
  },
  sectionSubtitle: {
    margin: "7px 0 0",
    fontSize: "14px",
    lineHeight: 1.7,
    color: "#64748b",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
    gap: "22px",
    marginTop: "2px",
  },
  card: {
    width: "100%",
    background: "rgba(255, 255, 255, 0.96)",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.045)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    color: "inherit",
    padding: 0,
    font: "inherit",
  },
  cardContent: {
    padding: "28px",
    display: "grid",
    gap: "22px",
    minHeight: "220px",
    boxSizing: "border-box",
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
  cardTitle: {
    fontSize: "26px",
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: 1.25,
  },
  badgeBlue: {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    background: "#eff6ff",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "23px",
    flexShrink: 0,
  },
  cardText: {
    fontSize: "15px",
    lineHeight: 1.9,
    color: "#64748b",
    fontWeight: "500",
    maxWidth: "440px",
  },
  cardActionBlue: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: "800",
    color: "#2563eb",
    marginTop: "4px",
  },
  footer: {
    borderTop: "1px solid #e2e8f0",
    paddingTop: "20px",
    textAlign: "center",
    fontSize: "13px",
    lineHeight: 1.8,
    color: "#64748b",
    fontWeight: "600",
  },
};
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
      <div style={styles.glowOne} />
      <div style={styles.glowTwo} />

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
          <div style={styles.titleWrap}>
            <div style={styles.eyebrow}>Reception Workspace</div>
            <h1 style={styles.title}>Welcome, {displayName}</h1>
            <p style={styles.subtitle}>
              Choose the workspace you want to open.
            </p>
          </div>

          <button type="button" style={styles.logoutButton} onClick={onLogout}>
            Logout
          </button>
        </div>

        <div style={styles.heroCard}>
          <div style={styles.heroBadge}>Quick Access</div>
          <div style={styles.heroTitle}>Two clean workspaces for reception</div>
          <div style={styles.heroText}>
            Open the registration workspace for patient files and assignments,
            or open the booking workspace for appointment scheduling and
            tracking.
          </div>
        </div>

        <div style={styles.grid}>
          <button
            type="button"
            style={styles.card}
            onClick={() => navigate("/reception/registration")}
          >
            <div style={styles.cardAccentBlue} />
            <div style={styles.cardInner}>
              <div style={styles.cardTop}>
                <div>
                  <div style={styles.cardEyebrowBlue}>Workspace 1</div>
                  <div style={styles.cardTitle}>Registration</div>
                </div>

                <div style={styles.iconCircleBlue}>
                  <span style={styles.iconText}>R</span>
                </div>
              </div>

              <div style={styles.cardDescription}>
                Search patients, open new files, and manage registration tasks.
              </div>

              <div style={styles.featurePills}>
                <span style={styles.featurePillBlue}>Register</span>
                <span style={styles.featurePillBlue}>Open New File</span>
                <span style={styles.featurePillBlue}>Tracker</span>
              </div>

              <div style={styles.cardFooter}>
                <span style={styles.enterTextBlue}>Enter Registration</span>
                <span style={styles.arrow}>→</span>
              </div>
            </div>
          </button>

          <button
            type="button"
            style={styles.card}
            onClick={() => navigate("/reception/booking")}
          >
            <div style={styles.cardAccentPink} />
            <div style={styles.cardInner}>
              <div style={styles.cardTop}>
                <div>
                  <div style={styles.cardEyebrowPink}>Workspace 2</div>
                  <div style={styles.cardTitle}>Booking</div>
                </div>

                <div style={styles.iconCirclePink}>
                  <span style={styles.iconText}>B</span>
                </div>
              </div>

              <div style={styles.cardDescription}>
                Book appointments, manage slots, and review booking trackers.
              </div>

              <div style={styles.featurePills}>
                <span style={styles.featurePillPink}>Book</span>
                <span style={styles.featurePillPink}>Open New File</span>
                <span style={styles.featurePillPink}>Tracker</span>
              </div>

              <div style={styles.cardFooter}>
                <span style={styles.enterTextPink}>Enter Booking</span>
                <span style={styles.arrow}>→</span>
              </div>
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
    background:
      "linear-gradient(135deg, #f8fbff 0%, #ffffff 50%, #fff7fb 100%)",
    padding: "36px 20px",
  },
  glowOne: {
    position: "absolute",
    top: "-120px",
    left: "-80px",
    width: "320px",
    height: "320px",
    borderRadius: "999px",
    background: "rgba(59, 130, 246, 0.10)",
    filter: "blur(40px)",
    pointerEvents: "none",
  },
  glowTwo: {
    position: "absolute",
    bottom: "-120px",
    right: "-80px",
    width: "340px",
    height: "340px",
    borderRadius: "999px",
    background: "rgba(236, 72, 153, 0.10)",
    filter: "blur(44px)",
    pointerEvents: "none",
  },
  container: {
    position: "relative",
    zIndex: 1,
    maxWidth: "1180px",
    margin: "0 auto",
    display: "grid",
    gap: "24px",
  },
  banner: {
    background: "rgba(255, 247, 237, 0.95)",
    border: "1px solid #fdba74",
    borderRadius: "14px",
    padding: "14px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.04)",
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
  titleWrap: {
    display: "grid",
    gap: "10px",
  },
  eyebrow: {
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "#2563eb",
  },
  title: {
    margin: 0,
    fontSize: "46px",
    lineHeight: 1.02,
    fontWeight: "900",
    color: "#0f172a",
  },
  subtitle: {
    margin: 0,
    fontSize: "18px",
    color: "#475569",
    fontWeight: "600",
  },
  logoutButton: {
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "14px",
    padding: "13px 18px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(239, 68, 68, 0.22)",
  },
  heroCard: {
    background: "rgba(255, 255, 255, 0.82)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: "1px solid #e2e8f0",
    borderRadius: "28px",
    padding: "28px",
    boxShadow: "0 20px 50px rgba(15, 23, 42, 0.06)",
    display: "grid",
    gap: "12px",
  },
  heroBadge: {
    width: "fit-content",
    background: "#e0ecff",
    color: "#1d4ed8",
    borderRadius: "999px",
    padding: "7px 12px",
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  heroTitle: {
    fontSize: "30px",
    fontWeight: "900",
    color: "#0f172a",
  },
  heroText: {
    maxWidth: "760px",
    fontSize: "16px",
    lineHeight: 1.6,
    color: "#64748b",
    fontWeight: "600",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "22px",
  },
  card: {
    position: "relative",
    background: "rgba(255, 255, 255, 0.9)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: "1px solid #e2e8f0",
    borderRadius: "28px",
    padding: 0,
    textAlign: "left",
    cursor: "pointer",
    overflow: "hidden",
    boxShadow: "0 20px 50px rgba(15, 23, 42, 0.07)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  cardAccentBlue: {
    height: "6px",
    background: "linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)",
  },
  cardAccentPink: {
    height: "6px",
    background: "linear-gradient(90deg, #db2777 0%, #f472b6 100%)",
  },
  cardInner: {
    padding: "24px",
    display: "grid",
    gap: "18px",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
  },
  cardEyebrowBlue: {
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#2563eb",
    marginBottom: "8px",
  },
  cardEyebrowPink: {
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#db2777",
    marginBottom: "8px",
  },
  cardTitle: {
    fontSize: "34px",
    fontWeight: "900",
    color: "#0f172a",
    lineHeight: 1.05,
  },
  iconCircleBlue: {
    width: "52px",
    height: "52px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconCirclePink: {
    width: "52px",
    height: "52px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconText: {
    fontSize: "22px",
    fontWeight: "900",
    color: "#0f172a",
  },
  cardDescription: {
    fontSize: "15px",
    lineHeight: 1.6,
    color: "#64748b",
    fontWeight: "600",
  },
  featurePills: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  featurePillBlue: {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    borderRadius: "999px",
    padding: "7px 12px",
    fontSize: "12px",
    fontWeight: "800",
  },
  featurePillPink: {
    background: "#fdf2f8",
    color: "#be185d",
    border: "1px solid #fbcfe8",
    borderRadius: "999px",
    padding: "7px 12px",
    fontSize: "12px",
    fontWeight: "800",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "2px",
  },
  enterTextBlue: {
    fontSize: "15px",
    fontWeight: "900",
    color: "#1d4ed8",
  },
  enterTextPink: {
    fontSize: "15px",
    fontWeight: "900",
    color: "#be185d",
  },
  arrow: {
    fontSize: "22px",
    fontWeight: "900",
    color: "#0f172a",
  },
};
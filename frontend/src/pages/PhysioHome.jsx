import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function PhysioHome({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();

  const currentUser = actingAs || user;

  const displayName =
    currentUser?.name ||
    currentUser?.display_name ||
    currentUser?.username ||
    "Physio User";

  const dailyMessage = useMemo(() => {
    const messages = [
      {
        category: "Patient Education",
        title: "Movement Supports Recovery",
        message:
          "Appropriate movement helps maintain joint mobility, muscle strength, and independence. Individualize exercises according to each patient's condition and tolerance.",
      },
      {
        category: "Pain Management",
        title: "Understand the Patient's Pain",
        message:
          "Listen to the patient's experience and consider how movement, sleep, stress, and daily activities influence symptoms. Adapt treatment to the patient's response.",
      },
      {
        category: "Exercise Therapy",
        title: "Consistency Matters",
        message:
          "Regularly performing prescribed exercises can support strength, flexibility, balance, and functional recovery. Begin at an appropriate level and progress gradually.",
      },
      {
        category: "Fall Prevention",
        title: "Make Safety a Priority",
        message:
          "Check balance, footwear, walking aids, and the treatment environment before mobility activities. Provide suitable assistance and supervision.",
      },
      {
        category: "Patient-Centered Care",
        title: "Set Meaningful Goals",
        message:
          "Rehabilitation goals should reflect what matters to the patient, such as walking independently, climbing stairs, returning to work, or managing daily activities.",
      },
      {
        category: "Clinical Documentation",
        title: "Record Meaningful Progress",
        message:
          "Document symptoms, objective findings, interventions, patient response, and progress toward goals to support continuity of care.",
      },
      {
        category: "Clinical Assessment",
        title: "Reassess and Adapt",
        message:
          "Review pain, range of motion, strength, function, and treatment response at appropriate intervals. Use the findings to adapt the rehabilitation plan.",
      },
      {
        category: "Patient Communication",
        title: "Listen Before You Treat",
        message:
          "Understand the patient's symptoms, concerns, and functional difficulties before planning treatment. Clear communication supports shared decisions.",
      },
      {
        category: "Treatment Quality",
        title: "Individualize Every Session",
        message:
          "Base treatment on the patient's assessment, diagnosis, goals, response, and precautions. Adapt the plan to the individual.",
      },
      {
        category: "Patient Empowerment",
        title: "Celebrate Small Improvements",
        message:
          "Recognize progress such as easier transfers, improved walking distance, or better exercise tolerance. Meaningful gains can support motivation.",
      },
      {
        category: "Postoperative Rehabilitation",
        title: "Respect Surgical Precautions",
        message:
          "Follow the surgeon's protocol and progress exercises, weight-bearing, and functional activities according to the patient's recovery.",
      },
      {
        category: "Rehabilitation",
        title: "Function Is the Goal",
        message:
          "Look beyond pain scores and range of motion. Track meaningful improvements in walking, transfers, self-care, work, and everyday participation.",
      },
    ];

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor(
      (now.getTime() - startOfYear.getTime()) / 86400000
    );

    return messages[(dayOfYear - 1) % messages.length];
  }, []);

  const handleBackToAdmin = () => {
    onStopImpersonation?.();
    navigate("/admin");
  };

  const handleWorkflow = () => {
    navigate("/physio/followup");
  };

  return (
    <div style={styles.page}>
      <div style={styles.backgroundOrbOne} />
      <div style={styles.backgroundOrbTwo} />

      <main style={styles.container}>
        {actingAs && (
          <div style={styles.impersonationBanner}>
            <div style={styles.impersonationInfo}>
              <span style={styles.impersonationIcon}>↗</span>
              <div>
                <div style={styles.impersonationTitle}>
                  Administrator view
                </div>
                <div style={styles.impersonationDescription}>
                  You are viewing the workspace as {displayName}.
                </div>
              </div>
            </div>

            <button
              type="button"
              style={styles.backButton}
              onClick={handleBackToAdmin}
            >
              Back to Admin <span>→</span>
            </button>
          </div>
        )}

        <header style={styles.header}>
          <div style={styles.brandRow}>
            <div style={styles.brandMark}>
              <span style={styles.brandCross}>✚</span>
            </div>

            <div>
              <div style={styles.brandName}>REHAB<span>CARE</span></div>
              <div style={styles.brandSubtitle}>
                PHYSIOTHERAPY DEPARTMENT
              </div>
            </div>
          </div>

          <button
            type="button"
            style={styles.logoutButton}
            onClick={onLogout}
          >
            <span style={styles.logoutIcon}>↪</span>
            Logout
          </button>
        </header>

        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <div style={styles.welcomeBadge}>
              <span style={styles.statusDot} />
              YOUR CLINICAL WORKSPACE
            </div>

            <h1 style={styles.heroTitle}>
              Welcome back,
              <br />
              <span>{displayName}</span>
            </h1>

            <p style={styles.heroDescription}>
              Your space for patient follow-up, rehabilitation
              coordination, and quality clinical care.
            </p>

            <button
              type="button"
              style={styles.primaryButton}
              onClick={handleWorkflow}
            >
              <span>Open Workflow</span>
              <span style={styles.buttonArrow}>→</span>
            </button>

            <div style={styles.heroNote}>
              <span style={styles.heroNoteIcon}>✓</span>
              Keep patient care organized and consistent.
            </div>
          </div>

          <div style={styles.heroVisual} aria-hidden="true">
            <div style={styles.visualGlow} />

            <div style={styles.visualCircle}>
              <div style={styles.visualInnerCircle}>
                <span style={styles.visualCross}>✚</span>
              </div>
            </div>

            <div style={styles.floatingCardTop}>
              <span style={styles.floatingIcon}>♡</span>
              <div>
                <div style={styles.floatingTitle}>Patient first</div>
                <div style={styles.floatingSubtitle}>
                  Care with purpose
                </div>
              </div>
            </div>

            <div style={styles.floatingCardBottom}>
              <span style={styles.checkIcon}>✓</span>
              <div>
                <div style={styles.floatingTitle}>Quality care</div>
                <div style={styles.floatingSubtitle}>
                  Every session matters
                </div>
              </div>
            </div>

            <div style={styles.visualDecorOne} />
            <div style={styles.visualDecorTwo} />
          </div>
        </section>

        <section style={styles.workspaceSection}>
          <div style={styles.sectionHeading}>
            <div>
              <div style={styles.sectionEyebrow}>GET STARTED</div>
              <h2 style={styles.sectionTitle}>Your workspace</h2>
              <p style={styles.sectionDescription}>
                Everything starts with your patient workflow.
              </p>
            </div>

            <div style={styles.workspaceCount}>
              <span style={styles.workspaceCountNumber}>01</span>
              <span style={styles.workspaceCountLabel}>
                WORKSPACE
              </span>
            </div>
          </div>

          <button
            type="button"
            style={styles.workflowCard}
            onClick={handleWorkflow}
          >
            <div style={styles.workflowIconBox}>
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <path d="M8 8h8M8 12h8M8 16h5" />
                <path d="m15 16 2 2 4-4" />
              </svg>
            </div>

            <div style={styles.workflowContent}>
              <div style={styles.workflowEyebrow}>
                PATIENT MANAGEMENT
              </div>
              <h3 style={styles.workflowTitle}>Workflow</h3>
              <p style={styles.workflowDescription}>
                Access patient registrations, treatment sessions,
                follow-up information, and progress tracking.
              </p>
              <div style={styles.workflowLink}>
                Enter patient workflow <span>→</span>
              </div>
            </div>

            <div style={styles.workflowArrow}>
              <span>↗</span>
            </div>
          </button>
        </section>

        <section style={styles.tipSection}>
          <div style={styles.tipHeader}>
            <div style={styles.tipHeaderLeft}>
              <div style={styles.tipIcon}>✦</div>
              <div>
                <div style={styles.tipEyebrow}>CLINICAL INSPIRATION</div>
                <h2 style={styles.tipSectionTitle}>Today's clinical tip</h2>
              </div>
            </div>

            <div style={styles.tipDayBadge}>DAILY INSIGHT</div>
          </div>

          <div style={styles.tipBody}>
            <div style={styles.tipCategory}>{dailyMessage.category}</div>
            <h3 style={styles.tipTitle}>{dailyMessage.title}</h3>
            <p style={styles.tipMessage}>{dailyMessage.message}</p>
          </div>

          <div style={styles.tipFooter}>
            <span style={styles.tipFooterIcon}>✚</span>
            <span>
              Evidence-informed care. Individualized for every patient.
            </span>
          </div>
        </section>

        <footer style={styles.footer}>
          <div style={styles.footerBrand}>
            <span style={styles.footerCross}>✚</span>
            <span>REHABCARE</span>
          </div>

          <div style={styles.footerMessage}>
            Every patient deserves thoughtful, individualized care.
          </div>

          <div style={styles.footerCopyright}>
            PHYSIOTHERAPY WORKSPACE
          </div>
        </footer>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    background: "#f5f7fb",
    padding: "30px 28px 40px",
    boxSizing: "border-box",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: "#182c43",
  },

  backgroundOrbOne: {
    position: "absolute",
    top: "-190px",
    right: "-100px",
    width: "470px",
    height: "470px",
    borderRadius: "50%",
    background: "rgba(32, 171, 151, 0.10)",
    filter: "blur(85px)",
    pointerEvents: "none",
  },

  backgroundOrbTwo: {
    position: "absolute",
    left: "-180px",
    bottom: "5%",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "rgba(83, 119, 222, 0.08)",
    filter: "blur(85px)",
    pointerEvents: "none",
  },

  container: {
    position: "relative",
    zIndex: 1,
    maxWidth: "1180px",
    margin: "0 auto",
    display: "grid",
    gap: "30px",
  },

  impersonationBanner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    padding: "15px 20px",
    background: "#edf3ff",
    border: "1px solid #d4e1ff",
    borderRadius: "16px",
  },

  impersonationInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  impersonationIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    background: "#dce8ff",
    color: "#315ba8",
    fontSize: "20px",
    fontWeight: "800",
  },

  impersonationTitle: {
    fontSize: "13px",
    fontWeight: "800",
    color: "#24477f",
  },

  impersonationDescription: {
    fontSize: "13px",
    color: "#597093",
    marginTop: "3px",
  },

  backButton: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#ffffff",
    border: "1px solid #d4e1ff",
    borderRadius: "10px",
    padding: "10px 14px",
    color: "#24477f",
    fontWeight: "750",
    fontSize: "13px",
    cursor: "pointer",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
    flexWrap: "wrap",
  },

  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  brandMark: {
    width: "48px",
    height: "48px",
    borderRadius: "15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(145deg, #168f83, #27b9a2)",
    color: "#ffffff",
    boxShadow: "0 8px 18px rgba(22, 143, 131, 0.22)",
  },

  brandCross: {
    fontSize: "23px",
    fontWeight: "800",
  },

  brandName: {
    fontSize: "20px",
    fontWeight: "900",
    letterSpacing: "0.045em",
    color: "#18334a",
  },

  brandSubtitle: {
    marginTop: "4px",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "0.13em",
    color: "#8393a5",
  },

  logoutButton: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    background: "#ffffff",
    border: "1px solid #e0e6ee",
    borderRadius: "12px",
    padding: "11px 16px",
    color: "#526276",
    fontSize: "13px",
    fontWeight: "750",
    cursor: "pointer",
  },

  logoutIcon: {
    fontSize: "18px",
    lineHeight: 1,
  },

  hero: {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.2fr) minmax(250px, 0.8fr)",
    alignItems: "center",
    gap: "20px",
    minHeight: "350px",
    overflow: "hidden",
    borderRadius: "30px",
    padding: "44px 48px",
    boxSizing: "border-box",
    background:
      "linear-gradient(118deg, #14384a 0%, #155e63 56%, #198e83 100%)",
    boxShadow: "0 20px 48px rgba(24, 71, 83, 0.16)",
  },

  heroContent: {
    position: "relative",
    zIndex: 2,
    display: "grid",
    justifyItems: "start",
    gap: "17px",
  },

  welcomeBadge: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    color: "#b9f5e8",
    fontSize: "10px",
    fontWeight: "850",
    letterSpacing: "0.14em",
    padding: "8px 12px",
    borderRadius: "999px",
    border: "1px solid rgba(191, 250, 236, 0.25)",
    background: "rgba(255,255,255,0.07)",
  },

  statusDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#6ee7c5",
    boxShadow: "0 0 0 4px rgba(110, 231, 197, 0.12)",
  },

  heroTitle: {
    margin: 0,
    fontSize: "clamp(32px, 4vw, 46px)",
    lineHeight: 1.14,
    letterSpacing: "-0.04em",
    fontWeight: "850",
    color: "#ffffff",
    overflowWrap: "anywhere",
  },

  heroDescription: {
    maxWidth: "490px",
    margin: 0,
    fontSize: "14px",
    lineHeight: 1.85,
    color: "#d0e8e8",
  },

  primaryButton: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    marginTop: "4px",
    padding: "14px 17px 14px 21px",
    border: "none",
    borderRadius: "13px",
    background: "#ffffff",
    color: "#17675f",
    fontSize: "14px",
    fontWeight: "850",
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(4, 36, 43, 0.12)",
  },

  buttonArrow: {
    fontSize: "20px",
    lineHeight: 1,
  },

  heroNote: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    color: "#c1e6e4",
    fontSize: "12px",
    lineHeight: 1.6,
  },

  heroNoteIcon: {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "rgba(175, 245, 222, 0.15)",
    color: "#8bf0cf",
    fontWeight: "900",
    flexShrink: 0,
  },

  heroVisual: {
    position: "relative",
    minHeight: "250px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  visualGlow: {
    position: "absolute",
    width: "240px",
    height: "240px",
    borderRadius: "50%",
    background: "rgba(105, 231, 206, 0.14)",
    filter: "blur(8px)",
  },

  visualCircle: {
    position: "relative",
    width: "210px",
    height: "210px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(216, 255, 247, 0.25)",
    background: "rgba(255,255,255,0.045)",
    boxShadow:
      "0 0 0 24px rgba(255,255,255,0.025), 0 0 0 48px rgba(255,255,255,0.018)",
  },

  visualInnerCircle: {
    width: "130px",
    height: "130px",
    borderRadius: "38px",
    transform: "rotate(-8deg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(145deg, rgba(255,255,255,0.20), rgba(255,255,255,0.08))",
    border: "1px solid rgba(255,255,255,0.27)",
    boxShadow: "0 18px 40px rgba(0,0,0,0.10)",
  },

  visualCross: {
    transform: "rotate(8deg)",
    color: "#c0fff0",
    fontSize: "65px",
    fontWeight: "900",
    textShadow: "0 5px 22px rgba(131, 255, 221, 0.25)",
  },

  floatingCardTop: {
    position: "absolute",
    top: "16px",
    right: "0",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 15px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.96)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
  },

  floatingCardBottom: {
    position: "absolute",
    bottom: "15px",
    left: "0",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 15px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.96)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
  },

  floatingIcon: {
    width: "34px",
    height: "34px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "11px",
    background: "#e2f7f1",
    color: "#148b77",
    fontSize: "22px",
  },

  floatingTitle: {
    fontSize: "12px",
    fontWeight: "850",
    color: "#23384b",
  },

  floatingSubtitle: {
    marginTop: "4px",
    fontSize: "10px",
    color: "#7b8b9b",
    whiteSpace: "nowrap",
  },

  checkIcon: {
    width: "34px",
    height: "34px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "11px",
    background: "#e4f7e9",
    color: "#18834a",
    fontSize: "18px",
    fontWeight: "900",
  },

  visualDecorOne: {
    position: "absolute",
    width: "9px",
    height: "9px",
    top: "35px",
    left: "28px",
    borderRadius: "50%",
    background: "#a4f5e0",
  },

  visualDecorTwo: {
    position: "absolute",
    width: "7px",
    height: "7px",
    bottom: "42px",
    right: "28px",
    borderRadius: "50%",
    background: "#b3d9ff",
  },

  workspaceSection: {
    display: "grid",
    gap: "20px",
  },

  sectionHeading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "18px",
    flexWrap: "wrap",
  },

  sectionEyebrow: {
    fontSize: "10px",
    fontWeight: "900",
    letterSpacing: "0.16em",
    color: "#168b7b",
    marginBottom: "7px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "25px",
    lineHeight: 1.3,
    letterSpacing: "-0.035em",
    fontWeight: "850",
    color: "#1d3449",
  },

  sectionDescription: {
    margin: "6px 0 0",
    color: "#7a8a9b",
    fontSize: "13px",
    lineHeight: 1.7,
  },

  workspaceCount: {
    display: "grid",
    justifyItems: "end",
    gap: "3px",
  },

  workspaceCountNumber: {
    fontSize: "27px",
    fontWeight: "850",
    letterSpacing: "-0.04em",
    color: "#b7c5d0",
  },

  workspaceCountLabel: {
    fontSize: "9px",
    letterSpacing: "0.12em",
    fontWeight: "850",
    color: "#91a0af",
  },

  workflowCard: {
    width: "100%",
    display: "flex",
    alignItems: "flex-start",
    gap: "22px",
    padding: "27px",
    border: "1px solid #e0e9ee",
    borderRadius: "22px",
    background: "#ffffff",
    boxShadow: "0 8px 25px rgba(30, 65, 80, 0.045)",
    textAlign: "left",
    color: "inherit",
    cursor: "pointer",
    boxSizing: "border-box",
  },

  workflowIconBox: {
    width: "62px",
    height: "62px",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    background: "linear-gradient(145deg, #e1f8f1, #d3f1eb)",
    color: "#168b7b",
  },

  workflowContent: {
    flex: 1,
    minWidth: 0,
  },

  workflowEyebrow: {
    fontSize: "10px",
    fontWeight: "900",
    letterSpacing: "0.13em",
    color: "#168b7b",
    marginBottom: "7px",
  },

  workflowTitle: {
    margin: 0,
    fontSize: "21px",
    fontWeight: "850",
    letterSpacing: "-0.025em",
    color: "#20394d",
  },

  workflowDescription: {
    maxWidth: "650px",
    margin: "9px 0 15px",
    fontSize: "13px",
    lineHeight: 1.85,
    color: "#728396",
  },

  workflowLink: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    fontSize: "12px",
    fontWeight: "850",
    color: "#168b7b",
  },

  workflowArrow: {
    width: "40px",
    height: "40px",
    borderRadius: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    background: "#f0f7f6",
    color: "#168b7b",
    fontSize: "22px",
  },

  tipSection: {
    overflow: "hidden",
    border: "1px solid #e4e9f0",
    borderRadius: "22px",
    background: "#ffffff",
    boxShadow: "0 8px 25px rgba(30, 65, 80, 0.035)",
  },

  tipHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    flexWrap: "wrap",
    padding: "22px 25px",
    borderBottom: "1px solid #edf0f5",
  },

  tipHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
  },

  tipIcon: {
    width: "43px",
    height: "43px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "14px",
    background: "#fff3dc",
    color: "#b97a13",
    fontSize: "22px",
  },

  tipEyebrow: {
    fontSize: "9px",
    fontWeight: "900",
    letterSpacing: "0.13em",
    color: "#b27b25",
    marginBottom: "5px",
  },

  tipSectionTitle: {
    margin: 0,
    fontSize: "17px",
    fontWeight: "850",
    color: "#263d51",
  },

  tipDayBadge: {
    padding: "7px 10px",
    borderRadius: "999px",
    background: "#fff7e8",
    color: "#a97623",
    fontSize: "9px",
    fontWeight: "900",
    letterSpacing: "0.09em",
  },

  tipBody: {
    padding: "23px 25px 25px",
  },

  tipCategory: {
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: "8px",
    background: "#e9f7f3",
    color: "#167d70",
    fontSize: "10px",
    fontWeight: "850",
  },

  tipTitle: {
    margin: "14px 0 9px",
    fontSize: "21px",
    lineHeight: 1.4,
    fontWeight: "850",
    letterSpacing: "-0.025em",
    color: "#20394d",
  },

  tipMessage: {
    maxWidth: "900px",
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.95,
    color: "#718194",
  },

  tipFooter: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "15px 25px",
    background: "#f8fafc",
    borderTop: "1px solid #edf0f5",
    color: "#61788a",
    fontSize: "11px",
    lineHeight: 1.6,
    fontWeight: "650",
  },

  tipFooterIcon: {
    color: "#168b7b",
    fontSize: "16px",
  },

  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    flexWrap: "wrap",
    padding: "18px 0 4px",
    borderTop: "1px solid #e2e8ef",
  },

  footerBrand: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "11px",
    letterSpacing: "0.07em",
    fontWeight: "900",
    color: "#526b7d",
  },

  footerCross: {
    color: "#168b7b",
    fontSize: "16px",
  },

  footerMessage: {
    fontSize: "11px",
    lineHeight: 1.6,
    color: "#8291a0",
    textAlign: "center",
  },

  footerCopyright: {
    fontSize: "9px",
    fontWeight: "850",
    letterSpacing: "0.1em",
    color: "#a0adba",
  },
};
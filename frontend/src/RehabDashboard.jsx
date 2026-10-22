
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RehabDashboard({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Home");

  const currentUser = actingAs || user;

  const displayName =
    currentUser?.name ||
    currentUser?.display_name ||
    currentUser?.username ||
    "Rehab Manager";

  // Change these paths if your App.js uses different routes.
  const menuItems = [
    { label: "Home", icon: "⌂", path: null },
    {
      label: "Rehabilitation Statistics",
      icon: "▥",
      path: "/admin/rehab-statistics",
    },
    {
      label: "Evaluation Tracker",
      icon: "☷",
      path: "/admin/evaluation-tracker",
    },
    {
      label: "Performance",
      icon: "↗",
      path: "/admin/performance",
    },
    {
      label: "Leaves",
      icon: "▣",
      path: "/admin/leaves",
    },
  ];

  const handleBackToAdmin = () => {
    onStopImpersonation?.();
    navigate("/admin");
  };

  const handleMenuClick = (item) => {
    setActiveSection(item.label);

    if (item.path) {
      navigate(item.path);
    } else {
      setSidebarOpen(false);
    }
  };

  const dailyMessage = useMemo(() => {
    const messages = [
      {
        category: "Patient Education",
        title: "Movement Supports Recovery",
        message:
          "Appropriate movement can help maintain joint mobility, muscle strength, and independence. Exercises should match each patient's condition and tolerance.",
      },
      {
        category: "Pain Management",
        title: "Understand the Patient's Pain",
        message:
          "Pain can be influenced by movement, sleep, stress, and daily activities. Listen carefully to the patient's experience and adapt treatment accordingly.",
      },
      {
        category: "Exercise Therapy",
        title: "Consistency Matters",
        message:
          "Regularly performing prescribed exercises can support strength, flexibility, balance, and functional recovery. Start at an appropriate level and progress gradually.",
      },
      {
        category: "Fall Prevention",
        title: "Make Safety a Priority",
        message:
          "Check the patient's balance, footwear, walking aid, and surroundings before mobility activities. Provide the level of assistance needed for safe movement.",
      },
      {
        category: "Patient-Centered Care",
        title: "Set Meaningful Goals",
        message:
          "Rehabilitation goals should reflect what matters to the patient, such as walking independently, climbing stairs, returning to work, or managing daily activities.",
      },
      {
        category: "Musculoskeletal Care",
        title: "Protect Joint Mobility",
        message:
          "Appropriately prescribed range-of-motion exercises can help maintain mobility and support daily function. Respect surgical precautions and individual limitations.",
      },
      {
        category: "Postoperative Rehabilitation",
        title: "Follow Surgical Precautions",
        message:
          "After surgery, follow the surgeon's protocol and rehabilitation precautions. Progress exercises, weight-bearing, and functional activities according to the patient's recovery.",
      },
      {
        category: "Neurological Rehabilitation",
        title: "Practice Functional Movement",
        message:
          "Individualized practice of meaningful tasks, such as sit-to-stand transfers and walking, can help develop functional skills and support independence.",
      },
      {
        category: "Low Back Care",
        title: "Encourage Appropriate Activity",
        message:
          "For many types of low back pain, appropriately graded activity and exercise can support recovery. Modify activities according to symptoms and clinical findings.",
      },
      {
        category: "Patient Communication",
        title: "Listen Before You Treat",
        message:
          "Ask about the patient's symptoms, concerns, and functional difficulties. Clear communication helps guide assessment, treatment choices, and shared decisions.",
      },
      {
        category: "Documentation",
        title: "Record Meaningful Progress",
        message:
          "Document symptoms, objective findings, interventions, patient response, and progress toward goals. Accurate records support continuity of care and clinical decisions.",
      },
      {
        category: "Therapeutic Exercise",
        title: "Progress Gradually",
        message:
          "Increase exercise difficulty, resistance, repetitions, or duration according to the patient's response and clinical presentation.",
      },
      {
        category: "Shoulder Rehabilitation",
        title: "Restore Function Step by Step",
        message:
          "Shoulder rehabilitation may include mobility, strengthening, and functional training. Select exercises according to the diagnosis, symptoms, and postoperative precautions.",
      },
      {
        category: "Knee Rehabilitation",
        title: "Build Strength for Daily Activities",
        message:
          "Individualized quadriceps, hip-strengthening, balance, and functional exercises may help improve knee function. Adjust the program to pain, swelling, and mobility.",
      },
      {
        category: "Infection Prevention",
        title: "Maintain Hand Hygiene",
        message:
          "Clean your hands at the appropriate moments before and after patient contact and follow clinic procedures for equipment cleaning and infection prevention.",
      },
      {
        category: "Patient Motivation",
        title: "Recognize Small Improvements",
        message:
          "Celebrate meaningful progress, such as improved walking distance, easier transfers, or better exercise tolerance.",
      },
      {
        category: "Balance Training",
        title: "Train Balance Safely",
        message:
          "Balance exercises should match the patient's ability and fall risk. Use suitable guarding, stable supports, and appropriate supervision.",
      },
      {
        category: "Home Exercise",
        title: "Make Home Programs Practical",
        message:
          "A home exercise program is easier to follow when instructions are clear, exercises are manageable, and the patient understands their purpose.",
      },
      {
        category: "Clinical Assessment",
        title: "Reassess and Adapt",
        message:
          "Review pain, range of motion, strength, function, and treatment response at appropriate intervals. Use the findings to adjust the rehabilitation plan.",
      },
      {
        category: "Red Flags",
        title: "Recognize Warning Signs",
        message:
          "New severe symptoms, unexplained deterioration, or signs of a serious condition require appropriate clinical assessment and escalation.",
      },
      {
        category: "Older Adult Care",
        title: "Support Independence",
        message:
          "Individualized strength, balance, mobility, and functional training can help older adults maintain everyday abilities.",
      },
      {
        category: "Neck Rehabilitation",
        title: "Combine Movement and Education",
        message:
          "Tailored exercises, appropriate activity, and patient education can support function in many cases of neck pain.",
      },
      {
        category: "Chronic Pain",
        title: "Take a Whole-Person Approach",
        message:
          "For persistent pain, consider the patient's activity, sleep, stress, goals, and functional limitations alongside physical findings.",
      },
      {
        category: "Treatment Quality",
        title: "Individualize Every Session",
        message:
          "Treatment should be based on the patient's assessment, diagnosis, goals, response, and precautions.",
      },
      {
        category: "Mobility Training",
        title: "Practice Safe Transfers",
        message:
          "Assess strength, balance, understanding, and assistance needs before transfers. Use appropriate techniques and equipment.",
      },
      {
        category: "Patient Empowerment",
        title: "Help Patients Understand Their Plan",
        message:
          "Explain the purpose of each intervention in simple language and encourage patients to ask questions.",
      },
      {
        category: "Therapist Wellbeing",
        title: "Use Safe Body Mechanics",
        message:
          "Position yourself and the treatment environment carefully during manual handling. Use transfer aids and team assistance when needed.",
      },
      {
        category: "Recovery Monitoring",
        title: "Monitor the Response to Treatment",
        message:
          "Observe symptoms and function during and after treatment. Unexpected worsening should prompt reassessment.",
      },
      {
        category: "Patient Dignity",
        title: "Respect Privacy and Consent",
        message:
          "Explain procedures, obtain appropriate consent, protect patient information, and maintain dignity throughout care.",
      },
      {
        category: "Clinical Reasoning",
        title: "Treat the Person, Not Just the Diagnosis",
        message:
          "Patients with the same diagnosis may have different needs, abilities, and goals. Select care that fits each patient's presentation.",
      },
      {
        category: "Rehabilitation",
        title: "Function Is the Goal",
        message:
          "Measure success through meaningful improvements in walking, transfers, self-care, work, and everyday participation.",
      },
    ];

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor(
      (now.getTime() - startOfYear.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return messages[(dayOfYear - 1) % messages.length];
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.softGlowBlue} />
      <div style={styles.softGlowGold} />

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          style={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Administration sidebar */}
      <aside
        style={{
          ...styles.sidebar,
          transform: sidebarOpen
            ? "translateX(0)"
            : "translateX(-100%)",
        }}
        aria-hidden={!sidebarOpen}
      >
        <div style={styles.sidebarHeader}>
          <div style={styles.sidebarBrand}>
            <div style={styles.sidebarLogo}>R</div>
            <div>
              <div style={styles.sidebarBrandTitle}>RehabCare</div>
              <div style={styles.sidebarBrandSubtitle}>
                MANAGEMENT PORTAL
              </div>
            </div>
          </div>

          <button
            type="button"
            style={styles.closeButton}
            onClick={() => setSidebarOpen(false)}
            aria-label="Close administration menu"
          >
            ×
          </button>
        </div>

        <div style={styles.sidebarProfile}>
          <div style={styles.avatar}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={styles.profileName}>{displayName}</div>
            <div style={styles.profileRole}>Rehab Manager</div>
          </div>
        </div>

        <div style={styles.menuCaption}>WORKSPACE</div>

        <nav style={styles.navigation}>
          {menuItems.map((item) => (
            <button
              key={item.label}
              type="button"
              style={{
                ...styles.menuItem,
                ...(activeSection === item.label
                  ? styles.menuItemActive
                  : {}),
              }}
              onClick={() => handleMenuClick(item)}
            >
              <span style={styles.menuIcon}>{item.icon}</span>
              <span style={styles.menuLabel}>{item.label}</span>
              {activeSection === item.label && (
                <span style={styles.activeDot} />
              )}
            </button>
          ))}
        </nav>

        <div style={styles.sidebarBottom}>
          <div style={styles.sidebarNote}>
            <div style={styles.sidebarNoteIcon}>✚</div>
            <div>
              <div style={styles.sidebarNoteTitle}>Quality Care</div>
              <div style={styles.sidebarNoteText}>
                Every patient. Every session. Every day.
              </div>
            </div>
          </div>

          <button
            type="button"
            style={styles.sidebarLogout}
            onClick={onLogout}
          >
            <span>↪</span> Logout
          </button>
        </div>
      </aside>

      <div style={styles.container}>
        {actingAs && (
          <div style={styles.banner}>
            <div style={styles.bannerText}>
              Viewing as: <strong>{displayName}</strong>
            </div>

            <button
              type="button"
              style={styles.bannerButton}
              onClick={handleBackToAdmin}
            >
              Back to Admin
            </button>
          </div>
        )}

        <div style={styles.topBar}>
          <div style={styles.titleBlock}>
            <div style={styles.eyebrow}>
              Physiotherapy Department
            </div>

            <h1 style={styles.title}>
              Welcome back, {displayName}
            </h1>

            <p style={styles.subtitle}>
              Your rehabilitation management workspace for
              department administration and quality patient care.
            </p>
          </div>

          <div style={styles.topActions}>
            <button
              type="button"
              style={styles.adminTopButton}
              onClick={() => setSidebarOpen(true)}
            >
              <span style={styles.adminButtonIcon}>☰</span>
              Administration
            </button>

            <button
              type="button"
              style={styles.logoutButton}
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        </div>

        <section
          style={styles.messageCard}
          aria-label="Daily physiotherapy and patient-care tip"
        >
          <div style={styles.messageTopRow}>
            <div style={styles.messageLabel}>
              Daily Clinical Tip
            </div>

            <div style={styles.messageCategory}>
              {dailyMessage.category}
            </div>
          </div>

          <h2 style={styles.messageTitle}>
            {dailyMessage.title}
          </h2>

          <p style={styles.messageText}>
            {dailyMessage.message}
          </p>

          <div style={styles.messageFooter}>
            <span style={styles.messageIcon}>✚</span>
            Evidence-informed care. Individualized for every patient.
          </div>
        </section>

        <div style={styles.sectionHeading}>
          <div style={styles.sectionTitle}>
            Management Workspace
          </div>

          <div style={styles.sectionSubtitle}>
            Open Administration to access department statistics,
            evaluations, therapist performance, and leave management.
          </div>
        </div>

        <div style={styles.adminGrid}>
          <button
            type="button"
            style={styles.card}
            onClick={() => setSidebarOpen(true)}
          >
            <div style={styles.cardContent}>
              <div style={styles.cardHeader}>
                <div>
                  <div style={styles.cardEyebrowGold}>
                    System Management
                  </div>

                  <div style={styles.cardTitle}>
                    Administration
                  </div>
                </div>

                <div style={styles.badgeGold}>A</div>
              </div>

              <div style={styles.cardText}>
                Open the administration sidebar to access
                rehabilitation statistics, evaluation tracking,
                performance reports, and leave management.
              </div>

              <div style={styles.cardActionGold}>
                Open Administration →
              </div>
            </div>
          </button>
        </div>

        <footer style={styles.footer}>
          <div style={styles.footerTitle}>
            Every patient deserves individualized care.
          </div>

          <div style={styles.footerText}>
            Follow clinical protocols, respect patient preferences,
            and document treatment accurately.
          </div>
        </footer>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    background: "#f5f7fc",
    padding: "56px 24px 72px",
    boxSizing: "border-box",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  softGlowBlue: {
    position: "absolute",
    top: "-140px",
    left: "-120px",
    width: "360px",
    height: "360px",
    borderRadius: "999px",
    background: "rgba(37, 99, 235, 0.12)",
    filter: "blur(70px)",
    pointerEvents: "none",
  },

  softGlowGold: {
    position: "absolute",
    bottom: "-160px",
    right: "-100px",
    width: "360px",
    height: "360px",
    borderRadius: "999px",
    background: "rgba(217, 160, 45, 0.15)",
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

  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    background: "rgba(15, 23, 42, 0.45)",
    backdropFilter: "blur(2px)",
  },

  sidebar: {
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    width: "min(340px, 88vw)",
    zIndex: 1001,
    background: "#ffffff",
    boxShadow: "12px 0 40px rgba(15, 23, 42, 0.18)",
    display: "flex",
    flexDirection: "column",
    padding: "24px 18px 18px",
    boxSizing: "border-box",
    transition: "transform 0.25s ease",
    overflowY: "auto",
  },

  sidebarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    paddingBottom: "24px",
    borderBottom: "1px solid #edf0f6",
  },

  sidebarBrand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  sidebarLogo: {
    width: "44px",
    height: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "14px",
    background: "#203e78",
    color: "#ffffff",
    fontWeight: "800",
    fontSize: "20px",
  },

  sidebarBrandTitle: {
    fontWeight: "800",
    fontSize: "17px",
    color: "#172747",
  },

  sidebarBrandSubtitle: {
    marginTop: "4px",
    fontSize: "9px",
    fontWeight: "800",
    letterSpacing: "0.12em",
    color: "#8390a7",
  },

  closeButton: {
    border: "none",
    background: "#f1f5f9",
    color: "#334155",
    borderRadius: "10px",
    width: "34px",
    height: "34px",
    fontSize: "24px",
    cursor: "pointer",
  },

  sidebarProfile: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "22px 8px",
    borderBottom: "1px solid #edf0f6",
  },

  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#e8eefc",
    color: "#24478d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "17px",
    fontWeight: "800",
    flexShrink: 0,
  },

  profileName: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#172747",
    overflowWrap: "anywhere",
  },

  profileRole: {
    marginTop: "4px",
    fontSize: "12px",
    color: "#718096",
  },

  menuCaption: {
    padding: "25px 10px 12px",
    color: "#98a2b3",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "0.12em",
  },

  navigation: {
    display: "grid",
    gap: "7px",
  },

  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    width: "100%",
    minHeight: "48px",
    padding: "12px 13px",
    border: "1px solid transparent",
    borderRadius: "12px",
    background: "transparent",
    color: "#526078",
    textAlign: "left",
    fontSize: "13px",
    fontWeight: "650",
    cursor: "pointer",
    boxSizing: "border-box",
  },

  menuItemActive: {
    background: "#edf3ff",
    color: "#24478d",
    borderColor: "#dce7ff",
  },

  menuIcon: {
    width: "25px",
    height: "25px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f1f5f9",
    borderRadius: "8px",
    fontSize: "17px",
    flexShrink: 0,
  },

  menuLabel: {
    flex: 1,
    lineHeight: 1.5,
  },

  activeDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#3156a3",
    flexShrink: 0,
  },

  sidebarBottom: {
    marginTop: "auto",
    paddingTop: "24px",
  },

  sidebarNote: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "14px",
    borderRadius: "13px",
    background: "#f7f9fd",
    border: "1px solid #e8edf6",
  },

  sidebarNoteIcon: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    background: "#e8eefc",
    color: "#3156a3",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  sidebarNoteTitle: {
    fontSize: "12px",
    fontWeight: "800",
    color: "#243b70",
  },

  sidebarNoteText: {
    marginTop: "5px",
    fontSize: "11px",
    color: "#718096",
    lineHeight: 1.6,
  },

  sidebarLogout: {
    width: "100%",
    display: "flex",
    gap: "10px",
    alignItems: "center",
    marginTop: "14px",
    padding: "13px",
    border: "1px solid #f2c5cc",
    borderRadius: "12px",
    background: "#fff7f8",
    color: "#b4233b",
    fontWeight: "750",
    cursor: "pointer",
  },

  banner: {
    background: "#e8eefc",
    border: "1px solid #c7d5f7",
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
    color: "#243b70",
    fontWeight: "700",
  },

  bannerButton: {
    background: "#243b70",
    color: "#ffffff",
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

  topActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  adminTopButton: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    background: "#203e78",
    color: "#ffffff",
    border: "1px solid #203e78",
    borderRadius: "14px",
    padding: "12px 16px",
    fontWeight: "750",
    cursor: "pointer",
  },

  adminButtonIcon: {
    fontSize: "17px",
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
    color: "#3156a3",
  },

  title: {
    margin: 0,
    fontSize: "34px",
    lineHeight: 1.2,
    fontWeight: "750",
    color: "#172747",
  },

  subtitle: {
    margin: 0,
    fontSize: "16px",
    color: "#64748b",
    fontWeight: "500",
    lineHeight: 1.7,
    maxWidth: "650px",
  },

  logoutButton: {
    background: "#ffffff",
    color: "#b4233b",
    border: "1px solid #f2c5cc",
    borderRadius: "14px",
    padding: "12px 16px",
    fontWeight: "700",
    cursor: "pointer",
  },

  messageCard: {
    background:
      "linear-gradient(135deg, #ffffff 0%, #eef3ff 65%, #fff8e8 100%)",
    border: "1px solid #d8e0f2",
    borderRadius: "24px",
    padding: "28px",
    display: "grid",
    gap: "14px",
    boxShadow: "0 10px 32px rgba(31, 55, 100, 0.07)",
  },

  messageTopRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
  },

  messageLabel: {
    width: "fit-content",
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#24478d",
    background: "#e8eefc",
    borderRadius: "999px",
    padding: "7px 12px",
  },

  messageCategory: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#7a6a45",
  },

  messageTitle: {
    margin: 0,
    fontSize: "24px",
    lineHeight: 1.35,
    fontWeight: "750",
    color: "#172747",
  },

  messageText: {
    margin: 0,
    fontSize: "16px",
    lineHeight: 1.85,
    color: "#475569",
    fontWeight: "500",
    maxWidth: "850px",
  },

  messageFooter: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    paddingTop: "12px",
    borderTop: "1px solid #e0e6f2",
    color: "#3156a3",
    fontSize: "13px",
    fontWeight: "700",
    lineHeight: 1.6,
  },

  messageIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
    borderRadius: "8px",
    background: "#e8eefc",
    color: "#3156a3",
    flexShrink: 0,
  },

  sectionHeading: {
    display: "grid",
    gap: "6px",
  },

  sectionTitle: {
    fontSize: "22px",
    fontWeight: "750",
    color: "#172747",
  },

  sectionSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    lineHeight: 1.6,
  },

  adminGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(280px, 520px)",
    gap: "22px",
    marginTop: "2px",
  },

  card: {
    width: "100%",
    background: "rgba(255, 255, 255, 0.97)",
    border: "1px solid #d8e0f2",
    borderRadius: "24px",
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "0 10px 30px rgba(31, 55, 100, 0.07)",
    padding: 0,
    color: "inherit",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },

  cardContent: {
    padding: "28px",
    display: "grid",
    gap: "22px",
    minHeight: "250px",
    boxSizing: "border-box",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "14px",
  },

  cardEyebrowGold: {
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#a16b08",
    marginBottom: "8px",
  },

  cardTitle: {
    fontSize: "26px",
    fontWeight: "750",
    color: "#172747",
    lineHeight: 1.25,
  },

  badgeGold: {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    background: "#fff1c9",
    color: "#946200",
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
    color: "#526078",
    fontWeight: "500",
    maxWidth: "440px",
  },

  cardActionGold: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#a16b08",
    marginTop: "6px",
  },

  footer: {
    display: "grid",
    gap: "7px",
    padding: "22px 4px 0",
    borderTop: "1px solid #d8e0f2",
  },

  footerTitle: {
    fontSize: "15px",
    fontWeight: "750",
    color: "#243b70",
  },

  footerText: {
    fontSize: "13px",
    lineHeight: 1.7,
    color: "#64748b",
  },
};

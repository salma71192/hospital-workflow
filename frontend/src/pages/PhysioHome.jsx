
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function PhysioHome({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();

  const displayName =
    actingAs?.username || user?.username || "Physio User";

  const handleBackToAdmin = () => {
    onStopImpersonation?.();
    navigate("/admin");
  };

  // Daily physiotherapy and patient-care education.
  // The message changes according to the day of the year.
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
          "Increase exercise difficulty, resistance, repetitions, or duration according to the patient's response and clinical presentation rather than using the same progression for everyone.",
      },
      {
        category: "Shoulder Rehabilitation",
        title: "Restore Function Step by Step",
        message:
          "Shoulder rehabilitation may include mobility, strengthening, and functional training. Select exercises according to the diagnosis, irritability, and any postoperative precautions.",
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
          "Celebrate meaningful progress, such as improved walking distance, easier transfers, or better exercise tolerance. Small functional gains can support motivation.",
      },
      {
        category: "Balance Training",
        title: "Train Balance Safely",
        message:
          "Balance exercises should match the patient's ability and fall risk. Use suitable guarding, stable supports, and appropriate supervision during challenging activities.",
      },
      {
        category: "Home Exercise",
        title: "Make Home Programs Practical",
        message:
          "A home exercise program is easier to follow when instructions are clear, exercises are manageable, and the patient understands their purpose and safe technique.",
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
          "New severe symptoms, unexplained deterioration, or signs of a serious condition require appropriate clinical assessment. Escalate urgent warning signs according to clinic protocols.",
      },
      {
        category: "Older Adult Care",
        title: "Support Independence",
        message:
          "Individualized strength, balance, mobility, and functional training can help older adults maintain everyday abilities and participate more confidently in daily life.",
      },
      {
        category: "Neck Rehabilitation",
        title: "Combine Movement and Education",
        message:
          "For many cases of neck pain, tailored exercises, appropriate activity, and patient education can support function. Screen for concerning symptoms when indicated.",
      },
      {
        category: "Chronic Pain",
        title: "Take a Whole-Person Approach",
        message:
          "For persistent pain, consider the patient's activity, sleep, stress, goals, and functional limitations alongside physical findings when planning care.",
      },
      {
        category: "Treatment Quality",
        title: "Individualize Every Session",
        message:
          "Treatment should be based on the patient's assessment, diagnosis, goals, response, and precautions. A consistent plan still needs to be adapted to the individual.",
      },
      {
        category: "Mobility Training",
        title: "Practice Safe Transfers",
        message:
          "Assess the patient's strength, balance, understanding, and assistance needs before transfers. Use appropriate techniques and equipment to protect both patient and therapist.",
      },
      {
        category: "Patient Empowerment",
        title: "Help Patients Understand Their Plan",
        message:
          "Explain the purpose of each intervention in simple language and encourage patients to ask questions. Understanding the plan can support participation in rehabilitation.",
      },
      {
        category: "Therapist Wellbeing",
        title: "Use Safe Body Mechanics",
        message:
          "Position yourself and the treatment environment carefully during manual handling. Use available transfer aids and team assistance when needed.",
      },
      {
        category: "Recovery Monitoring",
        title: "Monitor the Response to Treatment",
        message:
          "Observe symptoms and function during and after treatment. Unexpected worsening or adverse responses should prompt reassessment and appropriate action.",
      },
      {
        category: "Patient Dignity",
        title: "Respect Privacy and Consent",
        message:
          "Explain procedures, obtain appropriate consent, protect patient information, and maintain dignity throughout assessment and treatment.",
      },
      {
        category: "Clinical Reasoning",
        title: "Treat the Person, Not Just the Diagnosis",
        message:
          "Patients with the same diagnosis may have different needs, abilities, and goals. Use clinical reasoning to select care that fits each patient's presentation.",
      },
      {
        category: "Rehabilitation",
        title: "Function Is the Goal",
        message:
          "Measure success not only by pain or range of motion, but also by meaningful improvements in walking, transfers, self-care, work, and everyday participation.",
      },
    ];

    const dayOfYear = Math.floor(
      (new Date() -
        new Date(new Date().getFullYear(), 0, 0)) /
        (1000 * 60 * 60 * 24)
    );

    return messages[(dayOfYear - 1) % messages.length];
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.softGlowBlue} />
      <div style={styles.softGlowGreen} />

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
            <div style={styles.eyebrow}>Physiotherapy Department</div>

            <h1 style={styles.title}>
              Welcome back, {displayName}
            </h1>

            <p style={styles.subtitle}>
              Your workspace for patient registrations, rehabilitation
              follow-up, and quality patient care.
            </p>
          </div>

          <button
            type="button"
            style={styles.logoutButton}
            onClick={onLogout}
          >
            Logout
          </button>
        </div>

        {/* DAILY PHYSIOTHERAPY EDUCATION */}
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

        {/* REGISTRATION WORKSPACE */}
        <div style={styles.sectionHeading}>
          <div style={styles.sectionTitle}>Your Workspace</div>

          <div style={styles.sectionSubtitle}>
            Select a workspace to continue.
          </div>
        </div>

        <div style={styles.grid}>
          <button
            type="button"
            style={styles.card}
            onClick={() => navigate("/physio/followup")}
          >
            <div style={styles.cardContent}>
              <div style={styles.cardHeader}>
                <div>
                  <div style={styles.cardEyebrowGreen}>
                    Patient Workspace
                  </div>

                  <div style={styles.cardTitle}>Workflow</div>
                </div>

                <div style={styles.badgeGreen}>R</div>
              </div>

              <div style={styles.cardText}>
                View patient registrations and treatment sessions,
                manage follow-up information, and track patient progress.
                Registrations should not require a linked booking.
              </div>

              <div style={styles.cardActionGreen}>
                Open Workflow →
              </div>
            </div>
          </button>

          {/*
            BOOKING WORKSPACE — DISABLED FOR NOW

            Retained for possible future use.

            <button
              type="button"
              style={styles.card}
              onClick={() => navigate("/physio/booking")}
            >
              <div style={styles.cardContent}>
                <div style={styles.cardHeader}>
                  <div>
                    <div style={styles.cardEyebrowBlue}>
                      Workspace
                    </div>
                    <div style={styles.cardTitle}>Booking</div>
                  </div>

                  <div style={styles.badgeBlue}>B</div>
                </div>

                <div style={styles.cardText}>
                  View bookings, appointment schedules, and daily workload.
                </div>

                <div style={styles.cardActionBlue}>
                  Open Booking →
                </div>
              </div>
            </button>
          */}
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
    background: "#f8fafc",
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
    color: "#059669",
  },

  title: {
    margin: 0,
    fontSize: "34px",
    lineHeight: 1.2,
    fontWeight: "750",
    color: "#0f172a",
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
    color: "#dc2626",
    border: "1px solid #fecaca",
    borderRadius: "14px",
    padding: "12px 16px",
    fontWeight: "700",
    cursor: "pointer",
  },

  messageCard: {
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(240,253,250,0.96))",
    border: "1px solid #d1fae5",
    borderRadius: "24px",
    padding: "28px",
    display: "grid",
    gap: "14px",
    boxShadow: "0 10px 32px rgba(15, 23, 42, 0.045)",
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
    color: "#047857",
    background: "#d1fae5",
    borderRadius: "999px",
    padding: "7px 12px",
  },

  messageCategory: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
  },

  messageTitle: {
    margin: 0,
    fontSize: "24px",
    lineHeight: 1.35,
    fontWeight: "750",
    color: "#0f172a",
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
    borderTop: "1px solid #d1fae5",
    color: "#047857",
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
    background: "#d1fae5",
    color: "#047857",
    flexShrink: 0,
  },

  sectionHeading: {
    display: "grid",
    gap: "6px",
  },

  sectionTitle: {
    fontSize: "22px",
    fontWeight: "750",
    color: "#0f172a",
  },

  sectionSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    lineHeight: 1.6,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "22px",
    marginTop: "2px",
  },

  card: {
    width: "100%",
    background: "rgba(255, 255, 255, 0.94)",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04)",
    padding: 0,
    color: "inherit",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
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
    fontWeight: "750",
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
    maxWidth: "440px",
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

  footer: {
    display: "grid",
    gap: "7px",
    padding: "22px 4px 0",
    borderTop: "1px solid #e2e8f0",
  },

  footerTitle: {
    fontSize: "15px",
    fontWeight: "750",
    color: "#334155",
  },

  footerText: {
    fontSize: "13px",
    lineHeight: 1.7,
    color: "#64748b",
  },
};

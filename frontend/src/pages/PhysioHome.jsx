
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
    <div className="hw-home">
      <div className="hw-background-decoration" aria-hidden="true" />

      <main className="hw-container">
        {actingAs && (
          <section className="hw-impersonation">
            <div className="hw-impersonation-info">
              <span className="hw-impersonation-icon">↗</span>
              <div>
                <strong>Administrator view</strong>
                <p>
                  You are viewing the workspace as {displayName}.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="hw-button hw-button-outline"
              onClick={handleBackToAdmin}
            >
              ← Back to Admin
            </button>
          </section>
        )}

        <header className="hw-header">
          <div className="hw-brand">
            <div className="hw-brand-icon" aria-hidden="true">
              <svg
                viewBox="0 0 48 48"
                width="35"
                height="35"
                fill="none"
              >
                <path
                  d="M20 7h8v13h13v8H28v13h-8V28H7v-8h13V7Z"
                  fill="currentColor"
                />
              </svg>
            </div>

            <div>
              <div className="hw-brand-name">
                HOSPITAL <span>WORKFLOW</span>
              </div>
              <div className="hw-brand-subtitle">
                PHYSIOTHERAPY DEPARTMENT
              </div>
            </div>
          </div>

          <div className="hw-header-actions">
            <div className="hw-user-chip">
              <span className="hw-avatar">
                {displayName.trim().charAt(0).toUpperCase()}
              </span>
              <span className="hw-user-name">{displayName}</span>
            </div>

            <button
              type="button"
              className="hw-button hw-button-logout"
              onClick={onLogout}
            >
              <svg
                viewBox="0 0 24 24"
                width="17"
                height="17"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10 17l5-5-5-5" />
                <path d="M15 12H3" />
                <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
              </svg>
              Logout
            </button>
          </div>
        </header>

        <section className="hw-hero">
          <div className="hw-hero-copy">
            <div className="hw-eyebrow hw-eyebrow-light">
              <span className="hw-live-dot" />
              YOUR CLINICAL WORKSPACE
            </div>

            <h1>
              Welcome back,
              <br />
              <span>{displayName}</span>
            </h1>

            <p className="hw-hero-description">
              Manage patient follow-ups, coordinate rehabilitation,
              and support consistent, high-quality clinical care.
            </p>

            <button
              type="button"
              className="hw-button hw-button-primary"
              onClick={handleWorkflow}
            >
              Open Patient Workflow
              <span className="hw-button-arrow">→</span>
            </button>

            <div className="hw-hero-note">
              <span className="hw-note-check">✓</span>
              Organized care. Meaningful progress. Better outcomes.
            </div>
          </div>

          <div className="hw-hero-art" aria-hidden="true">
            <div className="hw-art-ring hw-art-ring-one" />
            <div className="hw-art-ring hw-art-ring-two" />

            <div className="hw-art-center">
              <svg
                viewBox="0 0 100 100"
                width="112"
                height="112"
                fill="none"
              >
                <rect
                  x="15"
                  y="15"
                  width="70"
                  height="70"
                  rx="23"
                  fill="rgba(255,255,255,0.12)"
                  stroke="rgba(255,255,255,0.65)"
                  strokeWidth="1.5"
                />
                <path
                  d="M44 28h12v16h16v12H56v16H44V56H28V44h16V28Z"
                  fill="#FFFFFF"
                />
                <circle
                  cx="77"
                  cy="24"
                  r="5"
                  fill="#A9D2FF"
                />
              </svg>
            </div>

            <div className="hw-floating-card hw-floating-top">
              <span className="hw-floating-icon hw-blue-icon">♡</span>
              <div>
                <strong>Patient first</strong>
                <span>Care with purpose</span>
              </div>
            </div>

            <div className="hw-floating-card hw-floating-bottom">
              <span className="hw-floating-icon hw-green-icon">✓</span>
              <div>
                <strong>Quality care</strong>
                <span>Every session matters</span>
              </div>
            </div>
          </div>
        </section>

        <section className="hw-workspace">
          <div className="hw-section-heading">
            <div>
              <div className="hw-eyebrow">GET STARTED</div>
              <h2>Your workspace</h2>
              <p>
                Quick access to your patient management workflow.
              </p>
            </div>

            <div className="hw-section-counter">
              <strong>01</strong>
              <span>WORKSPACE</span>
            </div>
          </div>

          <button
            type="button"
            className="hw-workflow-card"
            onClick={handleWorkflow}
          >
            <div className="hw-workflow-icon">
              <svg
                viewBox="0 0 24 24"
                width="30"
                height="30"
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

            <div className="hw-workflow-content">
              <span className="hw-workflow-label">
                PATIENT MANAGEMENT
              </span>
              <h3>Patient Workflow</h3>
              <p>
                Access patient registrations, treatment sessions,
                follow-up information, and progress tracking.
              </p>
              <span className="hw-workflow-link">
                Enter patient workflow <span>→</span>
              </span>
            </div>

            <span className="hw-workflow-arrow" aria-hidden="true">
              ↗
            </span>
          </button>
        </section>

        <section className="hw-tip-card">
          <div className="hw-tip-header">
            <div className="hw-tip-heading">
              <div className="hw-tip-icon">✦</div>
              <div>
                <span className="hw-tip-eyebrow">
                  CLINICAL INSPIRATION
                </span>
                <h2>Today's clinical tip</h2>
              </div>
            </div>

            <span className="hw-tip-badge">DAILY INSIGHT</span>
          </div>

          <div className="hw-tip-content">
            <span className="hw-tip-category">
              {dailyMessage.category}
            </span>

            <h3>{dailyMessage.title}</h3>
            <p>{dailyMessage.message}</p>
          </div>

          <div className="hw-tip-footer">
            <span className="hw-footer-cross">✚</span>
            Evidence-informed care, individualized for every patient.
          </div>
        </section>

        <footer className="hw-footer">
          <div className="hw-footer-brand">
            <span className="hw-footer-mark">✚</span>
            HOSPITAL WORKFLOW
          </div>

          <p>
            Every patient deserves thoughtful, individualized care.
          </p>

          <span className="hw-footer-caption">
            PHYSIOTHERAPY WORKSPACE
          </span>
        </footer>
      </main>

      <style>{`
        .hw-home {
          --hw-navy: #203650;
          --hw-navy-dark: #182d48;
          --hw-blue: #2864e8;
          --hw-blue-light: #e8f0ff;
          --hw-text: #19345a;
          --hw-muted: #788aa5;
          --hw-border: #e0e8f4;
          --hw-background: #eef3fa;
          --hw-white: #ffffff;
          --hw-green: #10a77d;
          --hw-purple: #873ce8;
          --hw-amber: #e8a33b;

          position: relative;
          isolation: isolate;
          min-height: 100vh;
          overflow: hidden;
          box-sizing: border-box;
          padding: 28px;
          color: var(--hw-text);
          background:
            radial-gradient(
              ellipse at 90% 0%,
              rgba(40, 100, 232, 0.075),
              transparent 32%
            ),
            var(--hw-background);
          font-family:
            -apple-system, BlinkMacSystemFont, "Segoe UI",
            Roboto, Helvetica, Arial, sans-serif;
        }

        .hw-home *,
        .hw-home *::before,
        .hw-home *::after {
          box-sizing: border-box;
        }

        .hw-background-decoration {
          position: absolute;
          z-index: -1;
          width: 360px;
          height: 360px;
          right: -190px;
          top: 250px;
          border: 1px solid rgba(40, 100, 232, 0.08);
          border-radius: 50%;
          box-shadow:
            0 0 0 35px rgba(40, 100, 232, 0.025),
            0 0 0 70px rgba(40, 100, 232, 0.02);
          pointer-events: none;
        }

        .hw-container {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          display: grid;
          gap: 25px;
        }

        .hw-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          padding: 3px 0 6px;
        }

        .hw-brand {
          display: flex;
          align-items: center;
          gap: 13px;
          min-width: 0;
        }

        .hw-brand-icon {
          width: 51px;
          height: 51px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          color: white;
          background: var(--hw-blue);
          border-radius: 15px;
          box-shadow: 0 7px 18px rgba(40, 100, 232, 0.20);
        }

        .hw-brand-name {
          color: var(--hw-navy);
          font-size: 19px;
          font-weight: 900;
          letter-spacing: -0.035em;
        }

        .hw-brand-name span {
          color: var(--hw-blue);
        }

        .hw-brand-subtitle {
          margin-top: 5px;
          color: #788aa5;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.13em;
        }

        .hw-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .hw-user-chip {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
          padding: 7px 12px 7px 7px;
          border: 1px solid #dbe5f2;
          border-radius: 12px;
          background: rgba(255,255,255,0.82);
        }

        .hw-avatar {
          width: 33px;
          height: 33px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 10px;
          color: var(--hw-blue);
          background: var(--hw-blue-light);
          font-size: 14px;
          font-weight: 850;
        }

        .hw-user-name {
          max-width: 180px;
          overflow: hidden;
          color: #536984;
          font-size: 12px;
          font-weight: 700;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .hw-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 43px;
          padding: 11px 16px;
          border: 1px solid transparent;
          border-radius: 11px;
          font: inherit;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition:
            transform 160ms ease,
            box-shadow 160ms ease,
            background 160ms ease;
        }

        .hw-button:hover {
          transform: translateY(-1px);
        }

        .hw-button:focus-visible,
        .hw-workflow-card:focus-visible {
          outline: 3px solid rgba(40, 100, 232, 0.35);
          outline-offset: 3px;
        }

        .hw-button-logout {
          color: #d94b50;
          background: #fff;
          border-color: #f0d8dc;
        }

        .hw-button-logout:hover {
          background: #fff3f3;
        }

        .hw-hero {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(260px, 0.75fr);
          align-items: center;
          gap: 20px;
          min-height: 335px;
          overflow: hidden;
          padding: 40px 43px;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 25px;
          background:
            radial-gradient(
              circle at 85% 45%,
              rgba(75, 127, 224, 0.24),
              transparent 32%
            ),
            linear-gradient(120deg, #203650 0%, #1b3659 62%, #244b79 100%);
          box-shadow: 0 16px 38px rgba(25, 52, 90, 0.12);
        }

        .hw-hero-copy {
          position: relative;
          z-index: 2;
          display: grid;
          justify-items: start;
          gap: 17px;
          min-width: 0;
        }

        .hw-eyebrow {
          color: var(--hw-purple);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.13em;
        }

        .hw-eyebrow-light {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 9px 12px;
          border: 1px solid rgba(255,255,255,0.17);
          border-radius: 999px;
          color: #d9e7ff;
          background: rgba(255,255,255,0.07);
        }

        .hw-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #55d6a9;
          box-shadow: 0 0 0 4px rgba(85,214,169,0.12);
        }

        .hw-hero h1 {
          margin: 0;
          color: #fff;
          font-size: clamp(31px, 4vw, 46px);
          font-weight: 850;
          line-height: 1.14;
          letter-spacing: -0.045em;
          overflow-wrap: anywhere;
        }

        .hw-hero h1 span {
          color: #b9d2ff;
        }

        .hw-hero-description {
          max-width: 490px;
          margin: 0;
          color: #c8d5e7;
          font-size: 13px;
          line-height: 1.9;
        }

        .hw-button-primary {
          gap: 22px;
          min-height: 48px;
          padding: 13px 17px 13px 20px;
          color: #fff;
          background: var(--hw-blue);
          box-shadow: 0 7px 17px rgba(13, 64, 179, 0.23);
        }

        .hw-button-primary:hover {
          background: #3974f1;
          box-shadow: 0 9px 22px rgba(13, 64, 179, 0.3);
        }

        .hw-button-arrow {
          font-size: 21px;
          line-height: 1;
        }

        .hw-hero-note {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #cfdaea;
          font-size: 11px;
          line-height: 1.6;
        }

        .hw-note-check {
          width: 21px;
          height: 21px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 50%;
          color: #9af0d2;
          background: rgba(16,167,125,0.19);
          font-weight: 900;
        }

        .hw-hero-art {
          position: relative;
          min-height: 245px;
          display: grid;
          place-items: center;
        }

        .hw-art-ring {
          position: absolute;
          border: 1px solid rgba(196,218,255,0.17);
          border-radius: 50%;
        }

        .hw-art-ring-one {
          width: 205px;
          height: 205px;
          box-shadow:
            0 0 0 22px rgba(255,255,255,0.025),
            0 0 0 44px rgba(255,255,255,0.02);
        }

        .hw-art-ring-two {
          width: 145px;
          height: 145px;
          border-style: dashed;
          border-color: rgba(196,218,255,0.25);
        }

        .hw-art-center {
          position: relative;
          z-index: 1;
          width: 130px;
          height: 130px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,255,255,0.24);
          border-radius: 35px;
          background: linear-gradient(
            145deg,
            rgba(255,255,255,0.19),
            rgba(255,255,255,0.06)
          );
          box-shadow: 0 16px 35px rgba(0,0,0,0.12);
          transform: rotate(-5deg);
        }

        .hw-art-center svg {
          transform: rotate(5deg);
        }

        .hw-floating-card {
          position: absolute;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 13px;
          border: 1px solid rgba(222,232,248,0.85);
          border-radius: 13px;
          background: #fff;
          box-shadow: 0 9px 25px rgba(6,24,50,0.16);
        }

        .hw-floating-top {
          top: 14px;
          right: -2px;
        }

        .hw-floating-bottom {
          bottom: 12px;
          left: -4px;
        }

        .hw-floating-icon {
          width: 35px;
          height: 35px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 10px;
          font-size: 21px;
          font-weight: 900;
        }

        .hw-blue-icon {
          color: var(--hw-blue);
          background: #e7efff;
        }

        .hw-green-icon {
          color: #078b67;
          background: #d8f7eb;
        }

        .hw-floating-card strong,
        .hw-floating-card span:not(.hw-floating-icon) {
          display: block;
        }

        .hw-floating-card strong {
          color: var(--hw-navy);
          font-size: 11px;
          font-weight: 850;
        }

        .hw-floating-card div > span {
          margin-top: 4px;
          color: #8493a8;
          font-size: 10px;
          white-space: nowrap;
        }

        .hw-workspace {
          display: grid;
          gap: 18px;
        }

        .hw-section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .hw-section-heading h2 {
          margin: 7px 0 0;
          color: var(--hw-text);
          font-size: 24px;
          font-weight: 850;
          letter-spacing: -0.035em;
        }

        .hw-section-heading p {
          margin: 6px 0 0;
          color: var(--hw-muted);
          font-size: 12px;
          line-height: 1.7;
        }

        .hw-section-counter {
          display: grid;
          justify-items: end;
          gap: 3px;
        }

        .hw-section-counter strong {
          color: #bdcce0;
          font-size: 28px;
          font-weight: 850;
          letter-spacing: -0.04em;
        }

        .hw-section-counter span {
          color: #8192aa;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: 0.1em;
        }

        .hw-workflow-card {
          width: 100%;
          display: flex;
          align-items: flex-start;
          gap: 20px;
          padding: 25px;
          border: 1px solid var(--hw-border);
          border-radius: 19px;
          background: #fff;
          color: inherit;
          text-align: left;
          cursor: pointer;
          box-shadow: 0 5px 19px rgba(31,56,89,0.035);
          transition:
            transform 170ms ease,
            border-color 170ms ease,
            box-shadow 170ms ease;
        }

        .hw-workflow-card:hover {
          transform: translateY(-2px);
          border-color: #b9cef8;
          box-shadow: 0 12px 26px rgba(31,56,89,0.075);
        }

        .hw-workflow-icon {
          width: 59px;
          height: 59px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border: 1px solid #d4e3ff;
          border-radius: 16px;
          color: var(--hw-blue);
          background: linear-gradient(145deg, #e7efff, #f1f5ff);
        }

        .hw-workflow-content {
          flex: 1;
          min-width: 0;
        }

        .hw-workflow-label {
          color: var(--hw-blue);
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.12em;
        }

        .hw-workflow-content h3 {
          margin: 8px 0 0;
          color: var(--hw-text);
          font-size: 20px;
          font-weight: 850;
          letter-spacing: -0.025em;
        }

        .hw-workflow-content p {
          max-width: 650px;
          margin: 9px 0 15px;
          color: var(--hw-muted);
          font-size: 12px;
          line-height: 1.85;
        }

        .hw-workflow-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--hw-blue);
          font-size: 11px;
          font-weight: 850;
        }

        .hw-workflow-link span {
          font-size: 18px;
          transition: transform 160ms ease;
        }

        .hw-workflow-card:hover .hw-workflow-link span {
          transform: translateX(4px);
        }

        .hw-workflow-arrow {
          width: 39px;
          height: 39px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 12px;
          color: var(--hw-blue);
          background: #eef3ff;
          font-size: 20px;
        }

        .hw-tip-card {
          overflow: hidden;
          border: 1px solid var(--hw-border);
          border-radius: 19px;
          background: #fff;
          box-shadow: 0 5px 19px rgba(31,56,89,0.03);
        }

        .hw-tip-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          flex-wrap: wrap;
          padding: 21px 24px;
          border-bottom: 1px solid #eaf0f8;
        }

        .hw-tip-heading {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .hw-tip-icon {
          width: 43px;
          height: 43px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border: 1px solid #f8e4bf;
          border-radius: 13px;
          color: #c28624;
          background: #fff4df;
          font-size: 22px;
        }

        .hw-tip-eyebrow {
          display: block;
          margin-bottom: 5px;
          color: #a87b34;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.12em;
        }

        .hw-tip-heading h2 {
          margin: 0;
          color: var(--hw-text);
          font-size: 17px;
          font-weight: 850;
        }

        .hw-tip-badge {
          padding: 8px 11px;
          border: 1px solid #e5d5fc;
          border-radius: 999px;
          color: var(--hw-purple);
          background: #f4ebff;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.07em;
        }

        .hw-tip-content {
          padding: 23px 24px 25px;
        }

        .hw-tip-category {
          display: inline-flex;
          padding: 7px 10px;
          border: 1px solid #d1f0e4;
          border-radius: 8px;
          color: #078b67;
          background: #e8faf3;
          font-size: 10px;
          font-weight: 850;
        }

        .hw-tip-content h3 {
          margin: 13px 0 8px;
          color: var(--hw-text);
          font-size: 21px;
          font-weight: 850;
          line-height: 1.4;
          letter-spacing: -0.025em;
        }

        .hw-tip-content p {
          max-width: 920px;
          margin: 0;
          color: var(--hw-muted);
          font-size: 12px;
          line-height: 1.95;
        }

        .hw-tip-footer {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 14px 24px;
          border-top: 1px solid #eaf0f8;
          color: #657994;
          background: #f8faff;
          font-size: 11px;
          line-height: 1.7;
        }

        .hw-footer-cross {
          color: var(--hw-blue);
          font-size: 16px;
        }

        .hw-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 13px;
          flex-wrap: wrap;
          padding: 18px 0 3px;
          border-top: 1px solid #dce5f0;
        }

        .hw-footer-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #536a88;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.055em;
        }

        .hw-footer-mark {
          color: var(--hw-blue);
          font-size: 15px;
        }

        .hw-footer p {
          margin: 0;
          color: #8494aa;
          font-size: 10px;
          text-align: center;
          line-height: 1.6;
        }

        .hw-footer-caption {
          color: #92a1b5;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: 0.08em;
        }

        .hw-impersonation {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          padding: 15px 18px;
          border: 1px solid #cbdcff;
          border-radius: 14px;
          background: #eaf1ff;
        }

        .hw-impersonation-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .hw-impersonation-icon {
          width: 38px;
          height: 38px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 11px;
          color: var(--hw-blue);
          background: #d8e5ff;
          font-size: 19px;
          font-weight: 900;
        }

        .hw-impersonation-info strong {
          display: block;
          color: var(--hw-text);
          font-size: 12px;
        }

        .hw-impersonation-info p {
          margin: 4px 0 0;
          color: #637b9c;
          font-size: 11px;
          line-height: 1.6;
        }

        .hw-button-outline {
          color: var(--hw-blue);
          border-color: #cbdcff;
          background: #fff;
        }

        .hw-button-outline:hover {
          background: #f6f8ff;
        }

        @media (min-width: 1500px) {
          .hw-container {
            max-width: 1380px;
          }

          .hw-hero {
            min-height: 365px;
          }
        }

        @media (max-width: 850px) {
          .hw-home {
            padding: 22px 18px 30px;
          }

          .hw-container {
            gap: 20px;
          }

          .hw-hero {
            grid-template-columns: minmax(0, 1fr) minmax(210px, 0.75fr);
            padding: 30px 26px;
          }

          .hw-hero-art {
            min-height: 220px;
          }

          .hw-art-ring-one {
            width: 165px;
            height: 165px;
          }

          .hw-art-ring-two {
            width: 120px;
            height: 120px;
          }

          .hw-art-center {
            width: 105px;
            height: 105px;
          }

          .hw-floating-card {
            padding: 9px;
          }

          .hw-floating-top {
            right: -4px;
          }

          .hw-floating-bottom {
            left: -4px;
          }

          .hw-floating-icon {
            width: 29px;
            height: 29px;
          }

          .hw-floating-card strong {
            font-size: 10px;
          }

          .hw-floating-card div > span {
            font-size: 9px;
          }
        }

        @media (max-width: 600px) {
          .hw-home {
            padding: 17px 13px 25px;
          }

          .hw-header {
            align-items: flex-start;
          }

          .hw-brand {
            gap: 9px;
          }

          .hw-brand-icon {
            width: 43px;
            height: 43px;
            border-radius: 12px;
          }

          .hw-brand-name {
            font-size: 15px;
          }

          .hw-brand-subtitle {
            font-size: 8px;
            letter-spacing: 0.08em;
          }

          .hw-header-actions {
            width: 100%;
            justify-content: space-between;
          }

          .hw-user-chip {
            flex: 1;
            min-width: 0;
          }

          .hw-user-name {
            max-width: 200px;
          }

          .hw-button-logout {
            flex-shrink: 0;
          }

          .hw-hero {
            grid-template-columns: minmax(0, 1fr);
            gap: 5px;
            padding: 27px 21px 19px;
            border-radius: 20px;
          }

          .hw-hero h1 {
            font-size: clamp(29px, 8vw, 39px);
          }

          .hw-hero-description {
            font-size: 12px;
          }

          .hw-hero-art {
            min-height: 190px;
            margin-top: 8px;
          }

          .hw-art-ring-one {
            width: 140px;
            height: 140px;
          }

          .hw-art-ring-two {
            width: 105px;
            height: 105px;
          }

          .hw-art-center {
            width: 88px;
            height: 88px;
            border-radius: 26px;
          }

          .hw-art-center svg {
            width: 85px;
            height: 85px;
          }

          .hw-floating-top {
            top: 5px;
            right: 0;
          }

          .hw-floating-bottom {
            bottom: 4px;
            left: 0;
          }

          .hw-section-heading h2 {
            font-size: 22px;
          }

          .hw-workflow-card {
            gap: 13px;
            padding: 17px;
            border-radius: 16px;
          }

          .hw-workflow-icon {
            width: 45px;
            height: 45px;
            border-radius: 12px;
          }

          .hw-workflow-icon svg {
            width: 24px;
            height: 24px;
          }

          .hw-workflow-content h3 {
            font-size: 17px;
          }

          .hw-workflow-content p {
            font-size: 11px;
          }

          .hw-workflow-arrow {
            width: 31px;
            height: 31px;
            font-size: 17px;
          }

          .hw-tip-header {
            padding: 17px;
          }

          .hw-tip-content {
            padding: 19px 17px 21px;
          }

          .hw-tip-heading h2 {
            font-size: 15px;
          }

          .hw-tip-content h3 {
            font-size: 19px;
          }

          .hw-tip-content p {
            font-size: 12px;
          }

          .hw-tip-footer {
            padding: 13px 17px;
          }

          .hw-footer {
            justify-content: center;
            text-align: center;
          }

          .hw-footer p {
            flex-basis: 100%;
            order: 3;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hw-home *,
          .hw-home *::before,
          .hw-home *::after {
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}

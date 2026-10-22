
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
    "Rehab Manager";

  const dailyMessage = useMemo(() => {
    const messages = [
      {
        category: "Patient Education",
        title: "Movement Is Part of Recovery",
        message:
          "Appropriate movement can help maintain joint mobility, muscle strength, and independence. Adapt exercises to each patient's condition, goals, and tolerance.",
      },
      {
        category: "Pain Management",
        title: "Listen to the Patient",
        message:
          "Understand how symptoms affect sleep, movement, and daily activities. Consider the patient's concerns when adapting the treatment plan.",
      },
      {
        category: "Exercise Therapy",
        title: "Small Steps Create Progress",
        message:
          "Consistent, individualized exercise can support strength, flexibility, balance, and function. Progress gradually according to the patient's response.",
      },
      {
        category: "Fall Prevention",
        title: "Make Every Movement Safer",
        message:
          "Consider balance, footwear, walking aids, environmental hazards, and the level of assistance required before mobility activities.",
      },
      {
        category: "Patient-Centered Care",
        title: "Set Goals That Matter",
        message:
          "Collaborate with patients to set meaningful goals, whether returning to work, walking independently, or performing everyday activities.",
      },
      {
        category: "Clinical Documentation",
        title: "Document the Difference",
        message:
          "Record relevant assessment findings, interventions, patient response, and progress toward functional goals to support continuity of care.",
      },
      {
        category: "Clinical Assessment",
        title: "Reassess and Adapt",
        message:
          "Review pain, range of motion, strength, function, and treatment response at appropriate intervals. Use findings to guide clinical decisions.",
      },
      {
        category: "Treatment Quality",
        title: "Personalize Every Session",
        message:
          "Consider the patient's diagnosis, assessment, goals, precautions, and response when selecting and progressing interventions.",
      },
      {
        category: "Patient Communication",
        title: "Communication Builds Trust",
        message:
          "Invite patients to share their concerns and preferences. Clear explanations and shared decisions can support engagement in rehabilitation.",
      },
      {
        category: "Functional Recovery",
        title: "Measure What Matters",
        message:
          "Track meaningful changes in walking, transfers, self-care, work, and daily participation alongside symptoms and physical findings.",
      },
      {
        category: "Postoperative Care",
        title: "Follow Recovery Precautions",
        message:
          "Follow the relevant surgical protocol and progress exercises, loading, and functional activities according to the patient's status and restrictions.",
      },
      {
        category: "Patient Motivation",
        title: "Recognize Every Improvement",
        message:
          "Celebrate meaningful gains, such as easier transfers, improved walking distance, or better exercise tolerance. Acknowledge effort as well as outcomes.",
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

  return (
    <div className="rehab-home">
      <style>{`
        .rehab-home {
          --navy: #163449;
          --teal: #12877d;
          --teal-dark: #086d67;
          --muted: #728496;
          --border: #e3eaf0;
          min-height: 100vh;
          padding: 30px 24px 24px;
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
          background: #f5f8fb;
          color: var(--navy);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .rehab-home * {
          box-sizing: border-box;
        }

        .rehab-home button {
          font: inherit;
        }

        .rehab-container {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 1120px;
          margin: 0 auto;
        }

        .rehab-top-glow {
          position: absolute;
          top: -200px;
          right: -140px;
          width: 430px;
          height: 430px;
          border-radius: 50%;
          background: rgba(18, 135, 125, 0.09);
          filter: blur(80px);
          pointer-events: none;
        }

        .rehab-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 27px;
        }

        .rehab-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .rehab-brand-icon {
          width: 47px;
          height: 47px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 15px;
          background: var(--teal);
          color: white;
          font-size: 27px;
          box-shadow: 0 8px 20px rgba(18, 135, 125, 0.2);
        }

        .rehab-brand-name {
          font-size: 19px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .rehab-brand-name span {
          color: var(--teal);
        }

        .rehab-brand-subtitle {
          margin-top: 4px;
          color: #8494a4;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.8px;
        }

        .rehab-logout {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 11px 16px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: white;
          color: #53697b;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .rehab-logout:hover {
          border-color: #b9d8d5;
          color: var(--teal-dark);
          background: #fafffe;
        }

        .rehab-impersonation {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 22px;
          padding: 15px 18px;
          border: 1px solid #cbdcfb;
          border-radius: 15px;
          background: #edf4ff;
        }

        .rehab-impersonation-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .rehab-impersonation-icon {
          width: 39px;
          height: 39px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #dce8ff;
          color: #315da7;
          font-size: 19px;
          font-weight: 800;
        }

        .rehab-impersonation-title {
          font-size: 12px;
          font-weight: 850;
          color: #24477f;
        }

        .rehab-impersonation-text {
          margin-top: 4px;
          color: #62799a;
          font-size: 12px;
        }

        .rehab-back-button {
          padding: 10px 14px;
          border: 1px solid #d1dff8;
          border-radius: 10px;
          background: white;
          color: #31558b;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .rehab-back-button:hover {
          background: #f7faff;
        }

        .rehab-hero {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(230px, 0.6fr);
          gap: 28px;
          align-items: center;
          min-height: 285px;
          padding: 38px 42px;
          overflow: hidden;
          border-radius: 25px;
          background: linear-gradient(120deg, #142f45, #174f5a 67%, #147e77);
          box-shadow: 0 18px 40px rgba(23, 58, 76, 0.12);
        }

        .rehab-hero-content {
          position: relative;
          z-index: 2;
          min-width: 0;
        }

        .rehab-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 8px 12px;
          border: 1px solid rgba(255,255,255,0.17);
          border-radius: 999px;
          background: rgba(255,255,255,0.07);
          color: #b8eee2;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: 1.3px;
        }

        .rehab-eyebrow-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #69e2bd;
        }

        .rehab-hero-title {
          margin: 22px 0 13px;
          color: white;
          font-size: clamp(29px, 4vw, 43px);
          font-weight: 850;
          line-height: 1.18;
          letter-spacing: -1.4px;
          overflow-wrap: anywhere;
        }

        .rehab-hero-title span {
          color: #83e1cd;
        }

        .rehab-hero-description {
          max-width: 490px;
          margin: 0;
          color: #d1e2e8;
          font-size: 13px;
          line-height: 1.9;
        }

        .rehab-hero-footer {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 23px;
          color: #c8e9e5;
          font-size: 11px;
          line-height: 1.6;
        }

        .rehab-hero-check {
          display: grid;
          place-items: center;
          width: 23px;
          height: 23px;
          border-radius: 50%;
          background: rgba(150, 244, 218, 0.14);
          color: #a1f3d9;
          font-weight: 900;
        }

        .rehab-hero-art {
          position: relative;
          min-height: 205px;
          display: grid;
          place-items: center;
        }

        .rehab-orbit {
          position: absolute;
          width: 205px;
          height: 205px;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 50%;
        }

        .rehab-orbit-inner {
          position: absolute;
          width: 160px;
          height: 160px;
          border: 1px solid rgba(255,255,255,0.19);
          border-radius: 50%;
          background: rgba(255,255,255,0.025);
        }

        .rehab-medical-symbol {
          position: relative;
          z-index: 1;
          display: grid;
          place-items: center;
          width: 112px;
          height: 112px;
          border: 1px solid rgba(255,255,255,0.27);
          border-radius: 31px;
          background: linear-gradient(145deg, rgba(255,255,255,0.19), rgba(255,255,255,0.06));
          color: #c1f7e8;
          font-size: 65px;
          transform: rotate(-7deg);
          box-shadow: 0 15px 35px rgba(0,0,0,0.12);
        }

        .rehab-art-label {
          position: absolute;
          right: 0;
          bottom: 8px;
          z-index: 2;
          padding: 11px 14px;
          border: 1px solid rgba(255,255,255,0.65);
          border-radius: 13px;
          background: white;
          color: #31566a;
          box-shadow: 0 10px 25px rgba(0,0,0,0.12);
        }

        .rehab-art-label strong {
          display: block;
          font-size: 11px;
        }

        .rehab-art-label span {
          display: block;
          margin-top: 4px;
          color: #8494a4;
          font-size: 9px;
        }

        .rehab-section {
          margin-top: 31px;
        }

        .rehab-section-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 15px;
          flex-wrap: wrap;
          margin-bottom: 17px;
        }

        .rehab-section-eyebrow {
          margin-bottom: 6px;
          color: var(--teal);
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.7px;
        }

        .rehab-section-title {
          margin: 0;
          color: #203a4f;
          font-size: 25px;
          font-weight: 850;
          letter-spacing: -0.7px;
        }

        .rehab-section-description {
          margin: 7px 0 0;
          color: #7c8d9d;
          font-size: 12px;
          line-height: 1.7;
        }

        .rehab-section-tag {
          padding: 9px 12px;
          border: 1px solid #dfeae9;
          border-radius: 10px;
          background: white;
          color: #5d7a7e;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: 1px;
        }

        .rehab-admin-card {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 20px;
          width: 100%;
          padding: 25px;
          border: 1px solid #e0e9ed;
          border-radius: 20px;
          background: white;
          text-align: left;
          color: inherit;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(31, 61, 78, 0.04);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .rehab-admin-card:hover {
          transform: translateY(-3px);
          border-color: #b6dcd5;
          box-shadow: 0 14px 30px rgba(31, 91, 91, 0.09);
        }

        .rehab-admin-icon {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          width: 59px;
          height: 59px;
          border-radius: 17px;
          background: #e6f7f2;
          color: var(--teal);
        }

        .rehab-admin-icon svg {
          width: 31px;
          height: 31px;
        }

        .rehab-admin-content {
          flex: 1;
          min-width: 0;
        }

        .rehab-admin-eyebrow {
          margin-bottom: 7px;
          color: var(--teal);
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.3px;
        }

        .rehab-admin-title {
          margin: 0;
          color: #20394d;
          font-size: 19px;
          font-weight: 850;
          line-height: 1.45;
        }

        .rehab-admin-description {
          max-width: 650px;
          margin: 8px 0 15px;
          color: #77899a;
          font-size: 12px;
          line-height: 1.85;
        }

        .rehab-admin-action {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: var(--teal);
          font-size: 11px;
          font-weight: 850;
        }

        .rehab-admin-arrow {
          font-size: 18px;
          transition: transform 0.2s ease;
        }

        .rehab-admin-card:hover .rehab-admin-arrow {
          transform: translateX(4px);
        }

        .rehab-admin-corner {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: #f0f7f6;
          color: var(--teal);
          font-size: 18px;
        }

        .rehab-permission {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-top: 13px;
          color: #8392a1;
          font-size: 10px;
          line-height: 1.7;
        }

        .rehab-permission span:first-child {
          color: var(--teal);
          font-size: 14px;
        }

        .rehab-tip {
          margin-top: 30px;
          overflow: hidden;
          border: 1px solid #e3eaf0;
          border-radius: 20px;
          background: white;
          box-shadow: 0 8px 22px rgba(31, 61, 78, 0.035);
        }

        .rehab-tip-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          padding: 20px 23px;
          border-bottom: 1px solid #edf1f5;
        }

        .rehab-tip-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .rehab-tip-icon {
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          border-radius: 13px;
          background: #fff3dd;
          color: #b27b25;
          font-size: 21px;
        }

        .rehab-tip-eyebrow {
          margin-bottom: 4px;
          color: #ad792b;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.4px;
        }

        .rehab-tip-heading {
          margin: 0;
          color: #243e51;
          font-size: 16px;
          font-weight: 850;
        }

        .rehab-tip-badge {
          padding: 7px 10px;
          border-radius: 8px;
          background: #fff7e9;
          color: #a87523;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: 0.6px;
        }

        .rehab-tip-body {
          padding: 23px;
        }

        .rehab-tip-category {
          display: inline-flex;
          padding: 6px 9px;
          border-radius: 7px;
          background: #e8f7f2;
          color: #167c70;
          font-size: 10px;
          font-weight: 850;
        }

        .rehab-tip-title {
          margin: 13px 0 8px;
          color: #213a4d;
          font-size: 20px;
          font-weight: 850;
          line-height: 1.4;
          letter-spacing: -0.4px;
        }

        .rehab-tip-message {
          max-width: 880px;
          margin: 0;
          color: #728496;
          font-size: 12px;
          line-height: 1.95;
        }

        .rehab-tip-footer {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 14px 23px;
          border-top: 1px solid #edf1f5;
          background: #f9fbfc;
          color: #6e8292;
          font-size: 10px;
          line-height: 1.7;
        }

        .rehab-tip-footer span:first-child {
          color: var(--teal);
          font-size: 15px;
        }

        .rehab-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e1e8ef;
        }

        .rehab-footer-brand {
          color: #607687;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .rehab-footer-brand span {
          margin-right: 7px;
          color: var(--teal);
          font-size: 16px;
        }

        .rehab-footer-message {
          color: #8291a0;
          font-size: 10px;
          line-height: 1.7;
          text-align: center;
        }

        .rehab-footer-label {
          color: #9aa8b5;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: 1.1px;
        }

        @media (max-width: 760px) {
          .rehab-home {
            padding: 20px 15px 24px;
          }

          .rehab-hero {
            grid-template-columns: minmax(0, 1fr);
            padding: 30px 25px;
          }

          .rehab-hero-art {
            min-height: 165px;
          }

          .rehab-orbit {
            width: 160px;
            height: 160px;
          }

          .rehab-orbit-inner {
            width: 125px;
            height: 125px;
          }

          .rehab-medical-symbol {
            width: 90px;
            height: 90px;
            border-radius: 25px;
            font-size: 52px;
          }

          .rehab-art-label {
            right: 2px;
            bottom: 0;
          }

          .rehab-section-title {
            font-size: 23px;
          }

          .rehab-admin-card {
            gap: 14px;
            padding: 19px;
          }

          .rehab-admin-icon {
            width: 48px;
            height: 48px;
            border-radius: 14px;
          }

          .rehab-admin-icon svg {
            width: 26px;
            height: 26px;
          }

          .rehab-admin-title {
            font-size: 17px;
          }

          .rehab-admin-corner {
            width: 29px;
            height: 29px;
          }

          .rehab-footer {
            justify-content: center;
          }

          .rehab-footer-message {
            width: 100%;
            order: 3;
          }
        }

        @media (max-width: 440px) {
          .rehab-brand-name {
            font-size: 16px;
          }

          .rehab-brand-subtitle {
            font-size: 8px;
            letter-spacing: 1px;
          }

          .rehab-logout {
            padding: 10px 11px;
          }

          .rehab-hero {
            padding: 25px 20px;
            border-radius: 20px;
          }

          .rehab-hero-title {
            font-size: 31px;
          }

          .rehab-hero-description {
            font-size: 12px;
          }

          .rehab-admin-card {
            flex-wrap: wrap;
          }

          .rehab-admin-corner {
            margin-left: auto;
          }

          .rehab-tip-header,
          .rehab-tip-body {
            padding: 18px;
          }

          .rehab-tip-footer {
            padding: 13px 18px;
          }

          .rehab-tip-title {
            font-size: 18px;
          }
        }
      `}</style>

      <div className="rehab-top-glow" />

      <main className="rehab-container">
        {actingAs && (
          <section className="rehab-impersonation">
            <div className="rehab-impersonation-info">
              <div className="rehab-impersonation-icon">↗</div>
              <div>
                <div className="rehab-impersonation-title">
                  Administrator view
                </div>
                <div className="rehab-impersonation-text">
                  Viewing the workspace as {displayName}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="rehab-back-button"
              onClick={handleBackToAdmin}
            >
              ← Back to Admin
            </button>
          </section>
        )}

        <header className="rehab-header">
          <div className="rehab-brand">
            <div className="rehab-brand-icon">✚</div>
            <div>
              <div className="rehab-brand-name">
                REHAB<span>CARE</span>
              </div>
              <div className="rehab-brand-subtitle">
                REHABILITATION MANAGEMENT
              </div>
            </div>
          </div>

          <button
            type="button"
            className="rehab-logout"
            onClick={onLogout}
          >
            <span aria-hidden="true">↪</span>
            Logout
          </button>
        </header>

        <section className="rehab-hero">
          <div className="rehab-hero-content">
            <div className="rehab-eyebrow">
              <span className="rehab-eyebrow-dot" />
              YOUR MANAGEMENT WORKSPACE
            </div>

            <h1 className="rehab-hero-title">
              Welcome back,
              <br />
              <span>{displayName}</span>
            </h1>

            <p className="rehab-hero-description">
              A focused workspace for organized rehabilitation
              management, administrative access, and a commitment
              to patient-centered care.
            </p>

            <div className="rehab-hero-footer">
              <span className="rehab-hero-check">✓</span>
              Organized management. Better care.
            </div>
          </div>

          <div className="rehab-hero-art" aria-hidden="true">
            <div className="rehab-orbit" />
            <div className="rehab-orbit-inner" />
            <div className="rehab-medical-symbol">✚</div>
            <div className="rehab-art-label">
              <strong>Care with purpose</strong>
              <span>Every patient matters</span>
            </div>
          </div>
        </section>

        <section className="rehab-section">
          <div className="rehab-section-header">
            <div>
              <div className="rehab-section-eyebrow">
                WORKSPACE
              </div>
              <h2 className="rehab-section-title">
                Administration
              </h2>
              <p className="rehab-section-description">
                Manage users and access the administrative tools
                available to your account.
              </p>
            </div>

            <div className="rehab-section-tag">
              SYSTEM MANAGEMENT
            </div>
          </div>

          <button
            type="button"
            className="rehab-admin-card"
            onClick={() => navigate("/admin")}
          >
            <div className="rehab-admin-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="16" rx="2.5" />
                <path d="M8 8h8M8 12h5" />
                <circle cx="16.5" cy="15.5" r="2.5" />
                <path d="M16.5 14v3M15 15.5h3" />
              </svg>
            </div>

            <div className="rehab-admin-content">
              <div className="rehab-admin-eyebrow">
                ADMINISTRATION TOOLS
              </div>

              <h3 className="rehab-admin-title">
                Administration Dashboard
              </h3>

              <p className="rehab-admin-description">
                Open the administrative dashboard to manage user
                accounts and perform the system functions permitted
                by your assigned role.
              </p>

              <span className="rehab-admin-action">
                Open Administration
                <span className="rehab-admin-arrow">→</span>
              </span>
            </div>

            <div className="rehab-admin-corner" aria-hidden="true">
              ↗
            </div>
          </button>

          <div className="rehab-permission">
            <span>ⓘ</span>
            <span>
              Administrative actions depend on your assigned role
              and permissions.
            </span>
          </div>
        </section>

        <section className="rehab-tip">
          <div className="rehab-tip-header">
            <div className="rehab-tip-header-left">
              <div className="rehab-tip-icon">✦</div>
              <div>
                <div className="rehab-tip-eyebrow">
                  CLINICAL INSPIRATION
                </div>
                <h2 className="rehab-tip-heading">
                  Daily Clinical Tip
                </h2>
              </div>
            </div>

            <div className="rehab-tip-badge">
              DAILY INSIGHT
            </div>
          </div>

          <div className="rehab-tip-body">
            <div className="rehab-tip-category">
              {dailyMessage.category}
            </div>

            <h3 className="rehab-tip-title">
              {dailyMessage.title}
            </h3>

            <p className="rehab-tip-message">
              {dailyMessage.message}
            </p>
          </div>

          <div className="rehab-tip-footer">
            <span>✚</span>
            <span>
              Evidence-informed practice. Individualized patient care.
            </span>
          </div>
        </section>

        <footer className="rehab-footer">
          <div className="rehab-footer-brand">
            <span>✚</span>
            REHABCARE
          </div>

          <div className="rehab-footer-label">
            REHABILITATION MANAGEMENT
          </div>

          <div className="rehab-footer-message">
            Every patient deserves thoughtful, individualized care.
          </div>
        </footer>
      </main>
    </div>
  );
}

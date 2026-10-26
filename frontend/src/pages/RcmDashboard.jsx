
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RcmDashboard({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();
  const [view, setView] = useState("home");

  const currentUser = actingAs || user;

  const displayName =
    currentUser?.name ||
    currentUser?.display_name ||
    currentUser?.full_name ||
    currentUser?.username ||
    "RCM Team";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const impersonating = Boolean(actingAs);

  const goBackToAdmin = () => {
    if (onStopImpersonation) {
      onStopImpersonation();
    }
    navigate("/admin");
  };

  const sections = {
    claims: {
      eyebrow: "REVENUE CYCLE MANAGEMENT",
      title: "Claims Management",
      description:
        "Manage rejected claims, search for patients, and review claims history.",
      icon: "▤",
      color: "blue",
    },
    alerts: {
      eyebrow: "REVENUE CYCLE MANAGEMENT",
      title: "Alerts & Renewals",
      description:
        "Review upcoming renewals and identify claims that require follow-up.",
      icon: "◷",
      color: "orange",
    },
  };

  const openSection = (section) => {
    setView(section);
  };

  return (
    <div className="rcm-dashboard">
      <style>{`
        .rcm-dashboard {
          --navy: #172c46;
          --navy-light: #223c5c;
          --blue: #3478f6;
          --text: #233750;
          --muted: #7a8ba0;
          --border: #e5ebf3;
          min-height: 100vh;
          background: #f3f6fb;
          color: var(--text);
          font-family: Inter, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
        }

        .rcm-dashboard * {
          box-sizing: border-box;
        }

        .rcm-shell {
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
          padding: 28px 32px 20px;
        }

        .rcm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
        }

        .rcm-brand {
          display: flex;
          align-items: center;
          gap: 13px;
          min-width: 0;
        }

        .rcm-brand-mark {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: var(--navy);
          color: white;
          font-size: 28px;
          font-weight: 700;
          box-shadow: 0 5px 14px rgba(23, 44, 70, 0.16);
        }

        .rcm-brand-name {
          margin: 0;
          color: var(--navy);
          font-size: 15px;
          font-weight: 850;
          letter-spacing: 1.4px;
          line-height: 1.5;
        }

        .rcm-brand-name span {
          color: var(--blue);
        }

        .rcm-brand-subtitle {
          margin-top: 2px;
          color: var(--muted);
          font-size: 11px;
          font-weight: 650;
          letter-spacing: 1.1px;
        }

        .rcm-header-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 10px;
        }

        .rcm-user-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 14px 7px 8px;
          background: white;
          border: 1px solid var(--border);
          border-radius: 30px;
        }

        .rcm-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #e9f0ff;
          color: #285ec7;
          font-size: 12px;
          font-weight: 800;
        }

        .rcm-user-name {
          max-width: 180px;
          overflow: hidden;
          color: var(--text);
          font-size: 13px;
          font-weight: 700;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .rcm-user-role {
          margin-top: 2px;
          color: var(--muted);
          font-size: 11px;
        }

        .rcm-logout,
        .rcm-back-admin,
        .rcm-back-home {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 40px;
          padding: 0 15px;
          border-radius: 11px;
          font-size: 13px;
          font-weight: 750;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }

        .rcm-logout {
          background: white;
          border: 1px solid var(--border);
          color: var(--navy);
        }

        .rcm-logout:hover,
        .rcm-back-home:hover {
          background: #edf3fc;
        }

        .rcm-impersonation {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 22px;
          padding: 14px 18px;
          border: 1px solid #f3d59a;
          border-radius: 14px;
          background: #fff8e8;
          color: #845b10;
          font-size: 13px;
        }

        .rcm-back-admin {
          flex-shrink: 0;
          border: 0;
          background: #f1dba9;
          color: #69470b;
        }

        .rcm-back-admin:hover {
          background: #e9cc8b;
        }

        .rcm-hero {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 28px;
          min-height: 245px;
          margin-bottom: 34px;
          padding: 36px 40px;
          border-radius: 25px;
          background: linear-gradient(
            120deg,
            #172c46 0%,
            #203d60 65%,
            #28507a 100%
          );
          color: white;
          box-shadow: 0 14px 35px rgba(23, 44, 70, 0.13);
        }

        .rcm-hero-content {
          position: relative;
          z-index: 2;
          max-width: 720px;
        }

        .rcm-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 18px;
          padding: 7px 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 30px;
          background: rgba(255, 255, 255, 0.09);
          color: #d9e7ff;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.6px;
        }

        .rcm-eyebrow-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #71b5ff;
        }

        .rcm-hero h1 {
          margin: 0 0 13px;
          color: #fff;
          font-size: clamp(27px, 3vw, 39px);
          font-weight: 800;
          letter-spacing: -1.2px;
          line-height: 1.2;
        }

        .rcm-hero p {
          max-width: 650px;
          margin: 0;
          color: #d3dfed;
          font-size: 15px;
          line-height: 1.8;
        }

        .rcm-hero-symbol {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 130px;
          height: 130px;
          margin-right: 22px;
          border: 1px solid rgba(255, 255, 255, 0.17);
          border-radius: 34px;
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          font-size: 67px;
        }

        .rcm-hero-symbol::before,
        .rcm-hero-symbol::after {
          position: absolute;
          content: "";
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          pointer-events: none;
        }

        .rcm-hero-symbol::before {
          width: 175px;
          height: 175px;
        }

        .rcm-hero-symbol::after {
          width: 220px;
          height: 220px;
        }

        .rcm-section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
        }

        .rcm-section-heading h2 {
          margin: 0;
          color: var(--navy);
          font-size: 23px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .rcm-section-heading p {
          margin: 7px 0 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.6;
        }

        .rcm-section-label {
          color: #8a99ac;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.3px;
          white-space: nowrap;
        }

        .rcm-module-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 22px;
        }

        .rcm-module-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          min-width: 0;
          min-height: 260px;
          padding: 27px;
          overflow: hidden;
          border: 1px solid var(--border);
          border-radius: 20px;
          background: white;
          color: var(--text);
          text-align: left;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(28, 49, 77, 0.025);
          transition:
            transform 0.22s ease,
            box-shadow 0.22s ease,
            border-color 0.22s ease;
        }

        .rcm-module-card:hover {
          transform: translateY(-5px);
          border-color: #c9d9f3;
          box-shadow: 0 15px 32px rgba(28, 49, 77, 0.09);
        }

        .rcm-module-card:focus-visible {
          outline: 3px solid rgba(52, 120, 246, 0.45);
          outline-offset: 3px;
        }

        .rcm-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          width: 100%;
          gap: 15px;
          margin-bottom: 24px;
        }

        .rcm-module-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 57px;
          height: 57px;
          flex-shrink: 0;
          border-radius: 17px;
          font-size: 29px;
          font-weight: 700;
        }

        .rcm-module-icon.blue {
          background: #eaf1ff;
          color: #3478f6;
        }

        .rcm-module-icon.orange {
          background: #fff1e5;
          color: #e78a35;
        }

        .rcm-card-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 35px;
          height: 35px;
          border: 1px solid var(--border);
          border-radius: 11px;
          color: #8192a8;
          font-size: 19px;
          transition: all 0.2s ease;
        }

        .rcm-module-card:hover .rcm-card-arrow {
          border-color: var(--blue);
          background: var(--blue);
          color: white;
          transform: translateX(2px);
        }

        .rcm-module-card h3 {
          margin: 0 0 11px;
          color: var(--navy);
          font-size: 21px;
          font-weight: 800;
          letter-spacing: -0.4px;
        }

        .rcm-module-card > p {
          max-width: 430px;
          margin: 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.8;
        }

        .rcm-card-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          gap: 12px;
          margin-top: auto;
          padding-top: 24px;
        }

        .rcm-card-category {
          color: #8a99ac;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.1px;
        }

        .rcm-card-action {
          color: var(--blue);
          font-size: 12px;
          font-weight: 800;
          white-space: nowrap;
        }

        .rcm-placeholder {
          padding: 32px;
          border: 1px solid var(--border);
          border-radius: 20px;
          background: white;
        }

        .rcm-placeholder-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 58px;
          height: 58px;
          margin-bottom: 20px;
          border-radius: 17px;
          background: #eaf1ff;
          color: var(--blue);
          font-size: 29px;
        }

        .rcm-placeholder h2 {
          margin: 0 0 10px;
          color: var(--navy);
          font-size: 25px;
        }

        .rcm-placeholder p {
          max-width: 600px;
          margin: 0 0 22px;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.8;
        }

        .rcm-back-home {
          border: 1px solid var(--border);
          background: white;
          color: var(--navy);
        }

        .rcm-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-top: 48px;
          padding: 20px 2px 5px;
          border-top: 1px solid #e3eaf3;
        }

        .rcm-footer-brand {
          color: var(--navy);
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 1.3px;
        }

        .rcm-footer-brand span {
          color: var(--blue);
        }

        .rcm-footer-text {
          color: #96a3b4;
          font-size: 11px;
          text-align: right;
        }

        @media (max-width: 760px) {
          .rcm-shell {
            padding: 20px 18px;
          }

          .rcm-header {
            align-items: flex-start;
            flex-direction: column;
            gap: 16px;
          }

          .rcm-header-actions {
            justify-content: space-between;
            width: 100%;
          }

          .rcm-hero {
            min-height: auto;
            padding: 29px 25px;
            border-radius: 20px;
          }

          .rcm-hero-symbol {
            width: 85px;
            height: 85px;
            margin-right: 4px;
            border-radius: 24px;
            font-size: 43px;
          }

          .rcm-hero-symbol::before {
            width: 115px;
            height: 115px;
          }

          .rcm-hero-symbol::after {
            width: 145px;
            height: 145px;
          }

          .rcm-module-grid {
            grid-template-columns: 1fr;
          }

          .rcm-module-card {
            min-height: 235px;
          }
        }

        @media (max-width: 440px) {
          .rcm-shell {
            padding: 16px 13px;
          }

          .rcm-brand-mark {
            width: 40px;
            height: 40px;
            font-size: 24px;
          }

          .rcm-brand-name {
            font-size: 13px;
          }

          .rcm-brand-subtitle {
            font-size: 9px;
          }

          .rcm-user-name {
            max-width: 125px;
          }

          .rcm-hero {
            padding: 25px 21px;
          }

          .rcm-hero-symbol {
            display: none;
          }

          .rcm-hero h1 {
            font-size: 29px;
          }

          .rcm-hero p {
            font-size: 13px;
          }

          .rcm-section-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .rcm-module-card {
            padding: 22px;
          }

          .rcm-impersonation {
            align-items: flex-start;
            flex-direction: column;
          }

          .rcm-footer {
            align-items: flex-start;
            flex-direction: column;
          }

          .rcm-footer-text {
            text-align: left;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .rcm-dashboard *,
          .rcm-dashboard *::before,
          .rcm-dashboard *::after {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>

      <div className="rcm-shell">
        <header className="rcm-header">
          <div className="rcm-brand">
            <div className="rcm-brand-mark">✚</div>
            <div>
              <div className="rcm-brand-name">
                HOSPITAL <span>WORKFLOW</span>
              </div>
              <div className="rcm-brand-subtitle">
                REVENUE CYCLE MANAGEMENT
              </div>
            </div>
          </div>

          <div className="rcm-header-actions">
            <div className="rcm-user-pill">
              <div className="rcm-avatar">{initials || "RC"}</div>
              <div>
                <div className="rcm-user-name">{displayName}</div>
                <div className="rcm-user-role">RCM Team</div>
              </div>
            </div>

            <button
              type="button"
              className="rcm-logout"
              onClick={() => onLogout?.()}
            >
              ↪ Logout
            </button>
          </div>
        </header>

        {impersonating && (
          <div className="rcm-impersonation">
            <div>
              <strong>Admin impersonation active</strong>
              <div>
                You are viewing the Revenue Cycle Management dashboard as{" "}
                {displayName}.
              </div>
            </div>

            <button
              type="button"
              className="rcm-back-admin"
              onClick={goBackToAdmin}
            >
              ← Back to Admin
            </button>
          </div>
        )}

        {view === "home" ? (
          <>
            <section className="rcm-hero">
              <div className="rcm-hero-content">
                <div className="rcm-eyebrow">
                  <span className="rcm-eyebrow-dot" />
                  REVENUE CYCLE MANAGEMENT
                </div>

                <h1>Welcome back, {displayName}</h1>

                <p>
                  Manage claims, monitor renewals, and keep revenue cycle
                  activities organized from one place. Select a workspace
                  below to get started.
                </p>
              </div>

              <div className="rcm-hero-symbol" aria-hidden="true">
                $
              </div>
            </section>

            <section>
              <div className="rcm-section-heading">
                <div>
                  <h2>Your Workspace</h2>
                  <p>
                    Choose the area you want to work on.
                  </p>
                </div>

                <div className="rcm-section-label">
                  2 MANAGEMENT MODULES
                </div>
              </div>

              <div className="rcm-module-grid">
                <button
                  type="button"
                  className="rcm-module-card"
                  onClick={() => openSection("claims")}
                >
                  <div className="rcm-card-top">
                    <div className="rcm-module-icon blue">▤</div>
                    <div className="rcm-card-arrow">→</div>
                  </div>

                  <h3>Claims Management</h3>

                  <p>
                    Review rejected claims, search for patients, and access
                    claims history to support claim tracking and follow-up.
                  </p>

                  <div className="rcm-card-bottom">
                    <span className="rcm-card-category">
                      CLAIMS & PATIENT RECORDS
                    </span>
                    <span className="rcm-card-action">
                      Open workspace →
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  className="rcm-module-card"
                  onClick={() => openSection("alerts")}
                >
                  <div className="rcm-card-top">
                    <div className="rcm-module-icon orange">◷</div>
                    <div className="rcm-card-arrow">→</div>
                  </div>

                  <h3>Alerts &amp; Renewals</h3>

                  <p>
                    Monitor upcoming patient renewals and identify claims
                    requiring follow-up so important actions are not missed.
                  </p>

                  <div className="rcm-card-bottom">
                    <span className="rcm-card-category">
                      ALERTS & FOLLOW-UP
                    </span>
                    <span className="rcm-card-action">
                      Open workspace →
                    </span>
                  </div>
                </button>
              </div>
            </section>
          </>
        ) : (
          <section className="rcm-placeholder">
            <div
              className={`rcm-placeholder-icon ${
                view === "alerts" ? "orange" : "blue"
              }`}
            >
              {sections[view]?.icon}
            </div>

            <div className="rcm-eyebrow" style={{
              background: "#edf3ff",
              borderColor: "#dce7fb",
              color: "#3478f6",
            }}>
              {sections[view]?.eyebrow}
            </div>

            <h2>{sections[view]?.title}</h2>

            <p>
              {sections[view]?.description}
              {" "}This workspace is ready for its dedicated component to be
              connected in the next step.
            </p>

            <button
              type="button"
              className="rcm-back-home"
              onClick={() => setView("home")}
            >
              ← Back to Dashboard
            </button>
          </section>
        )}

        <footer className="rcm-footer">
          <div className="rcm-footer-brand">
            HOSPITAL <span>WORKFLOW</span>
          </div>
          <div className="rcm-footer-text">
            Revenue Cycle Management · Organized workflow. Better care.
          </div>
        </footer>
      </div>
    </div>
  );
}


import React from "react";
import { useNavigate } from "react-router-dom";
import ClaimsManagement from "./ClaimsManagement";

export default function RcmDashboard({
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
    onStopImpersonation?.();
    navigate("/admin");
  };

  return (
    <div className="rcm-dashboard">
      <style>{`
        .rcm-dashboard {
          --navy: #172c46;
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
          margin-bottom: 24px;
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

        .rcm-brand-name span,
        .rcm-footer-brand span {
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
        .rcm-back-admin {
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

        .rcm-logout:hover {
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

        .rcm-workspace-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
        }

        .rcm-workspace-heading h1 {
          margin: 0;
          color: var(--navy);
          font-size: clamp(24px, 3vw, 32px);
          font-weight: 800;
          letter-spacing: -0.7px;
        }

        .rcm-workspace-heading p {
          margin: 8px 0 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.7;
        }

        .rcm-workspace-label {
          padding: 8px 12px;
          border: 1px solid var(--border);
          border-radius: 20px;
          background: white;
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1px;
          white-space: nowrap;
        }

        .rcm-claims-container {
          min-width: 0;
          width: 100%;
          padding: 22px;
          border: 1px solid var(--border);
          border-radius: 18px;
          background: white;
          box-shadow: 0 4px 14px rgba(28, 49, 77, 0.035);
        }

        .rcm-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-top: 32px;
          padding: 20px 2px 5px;
          border-top: 1px solid #e3eaf3;
        }

        .rcm-footer-brand {
          color: var(--navy);
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 1.3px;
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

          .rcm-claims-container {
            padding: 15px;
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

          .rcm-workspace-heading {
            align-items: flex-start;
            flex-direction: column;
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

        <main>
          <section className="rcm-workspace-heading">
            <div>
              <h1>Claims Management</h1>
              <p>
                Review claims, search for patients, and access claims history
                to support claim tracking and follow-up.
              </p>
            </div>

            <div className="rcm-workspace-label">
              CLAIMS WORKSPACE
            </div>
          </section>

          <section className="rcm-claims-container">
            <ClaimsManagement />
          </section>
        </main>

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

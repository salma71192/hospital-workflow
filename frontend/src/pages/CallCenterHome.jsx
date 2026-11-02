
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

/* =========================================================
   CALL CENTER HOME
========================================================= */

export default function CallCenterHome({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();

  const displayName =
    actingAs?.first_name ||
    actingAs?.username ||
    user?.first_name ||
    user?.username ||
    "Call Center User";

  const today = useMemo(() => {
    return new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  const dailyMessage = useMemo(() => {
    const messages = [
      "A well-organized start makes every appointment smoother.",
      "Clear communication creates better patient experiences.",
      "Accurate scheduling supports better patient care.",
      "A coordinated team creates a better hospital experience.",
      "Every patient deserves timely and organized care.",
      "Good scheduling keeps the rehabilitation team moving forward.",
      "Effective communication is the foundation of excellent service.",
    ];

    return messages[
      new Date().getDate() % messages.length
    ];
  }, []);

  const handleBackToAdmin = () => {
    onStopImpersonation?.();
    navigate("/admin");
  };

  /* =========================================================
     WORKSPACES

     Booking is intentionally hidden from this list.
     Its existing route remains unchanged:
     /callcenter/booking
  ========================================================= */

  const workspaces = [
    {
      key: "alerts",
      title: "Alerts",
      category: "PATIENT FOLLOW-UP",
      description:
        "Review patient alerts, pending actions, important notifications, and follow-up priorities.",
      icon: "bell",
      route: "/callcenter/alerts",
      action: "Open Alerts",
      theme: "blue",
      features: [
        "Patient notifications",
        "Follow-up priorities",
        "Pending actions",
      ],
    },
    {
      key: "schedules",
      title: "Schedules",
      category: "SCHEDULE MANAGEMENT",
      description:
        "Manage therapist schedules, review appointment availability, and coordinate daily and future clinical schedules.",
      icon: "calendar",
      route: "/callcenter/schedules",
      action: "Open Schedules",
      theme: "pink",
      features: [
        "Therapist schedules",
        "Appointment availability",
        "Daily and weekly planning",
      ],
    },
    {
      key: "patients-tracker",
      title: "Patients Tracker",
      category: "PATIENT MANAGEMENT",
      description:
        "Track patient appointments, monitor follow-up requirements, and review patient scheduling progress.",
      icon: "users",
      route: "/callcenter/patients-tracker",
      action: "Open Patients Tracker",
      theme: "green",
      features: [
        "Patient appointment tracking",
        "Follow-up monitoring",
        "Patient scheduling status",
      ],
    },
  ];

  return (
    <div className="callcenter-home">
      <style>{styles}</style>

      <div className="callcenter-home-glow callcenter-home-glow-blue" />
      <div className="callcenter-home-glow callcenter-home-glow-pink" />

      <main className="callcenter-home-container">

        {/* ADMIN IMPERSONATION */}

        {actingAs && (
          <div className="callcenter-home-impersonation">
            <div>
              <span className="callcenter-home-impersonation-label">
                Administrator Preview
              </span>

              <div className="callcenter-home-impersonation-text">
                Viewing dashboard as{" "}
                <strong>{actingAs.username}</strong>
              </div>
            </div>

            <button
              type="button"
              className="callcenter-home-admin-button"
              onClick={handleBackToAdmin}
            >
              ← Back to Admin
            </button>
          </div>
        )}

        {/* HEADER */}

        <header className="callcenter-home-header">
          <div className="callcenter-home-brand">
            <div className="callcenter-home-brand-icon">
              <HomeIcon name="headset" size={25} />
            </div>

            <div>
              <div className="callcenter-home-brand-name">
                Call Center
              </div>

              <div className="callcenter-home-brand-description">
                Rehabilitation Operations
              </div>
            </div>
          </div>

          <div className="callcenter-home-header-actions">
            <div className="callcenter-home-date">
              <HomeIcon name="calendar" size={16} />
              <span>{today}</span>
            </div>

            <button
              type="button"
              className="callcenter-home-logout"
              onClick={onLogout}
            >
              <HomeIcon name="logout" size={17} />
              Logout
            </button>
          </div>
        </header>

        {/* WELCOME */}

        <section className="callcenter-home-welcome">
          <div className="callcenter-home-welcome-content">
            <div className="callcenter-home-eyebrow">
              <span className="callcenter-home-eyebrow-dot" />
              CALL CENTER WORKSPACE
            </div>

            <h1 className="callcenter-home-title">
              Welcome back,{" "}
              <span>{displayName}</span>
            </h1>

            <p className="callcenter-home-subtitle">
              Your central workspace for coordinating
              patient services, managing schedules,
              tracking patients, and monitoring alerts.
            </p>

            <div className="callcenter-home-welcome-footer">
              <HomeIcon name="check" size={17} />
              <span>
                Select a workspace below to continue.
              </span>
            </div>
          </div>

          <div className="callcenter-home-welcome-art">
            <div className="callcenter-home-art-circle callcenter-home-art-circle-one" />
            <div className="callcenter-home-art-circle callcenter-home-art-circle-two" />

            <div className="callcenter-home-art-icon">
              <HomeIcon name="headset" size={58} />
            </div>
          </div>
        </section>

        {/* DAILY MESSAGE */}

        <section className="callcenter-home-message">
          <div className="callcenter-home-message-icon">
            <HomeIcon name="sparkles" size={22} />
          </div>

          <div className="callcenter-home-message-content">
            <div className="callcenter-home-message-label">
              TODAY'S MESSAGE
            </div>

            <p className="callcenter-home-message-text">
              {dailyMessage}
            </p>
          </div>
        </section>

        {/* WORKSPACES */}

        <section className="callcenter-home-workspaces">
          <div className="callcenter-home-section-heading">
            <div>
              <h2 className="callcenter-home-section-title">
                Your Workspaces
              </h2>

              <p className="callcenter-home-section-description">
                Choose the area you want to work with.
              </p>
            </div>

            <div className="callcenter-home-workspace-count">
              {workspaces.length} Workspaces
            </div>
          </div>

          <div className="callcenter-home-grid">
            {workspaces.map((workspace) => (
              <button
                key={workspace.key}
                type="button"
                className={`callcenter-home-card callcenter-home-card-${workspace.theme}`}
                onClick={() => navigate(workspace.route)}
              >
                <div className="callcenter-home-card-top">
                  <div className="callcenter-home-card-icon">
                    <HomeIcon
                      name={workspace.icon}
                      size={27}
                    />
                  </div>

                  <span className="callcenter-home-card-arrow">
                    <HomeIcon
                      name="arrow"
                      size={21}
                    />
                  </span>
                </div>

                <div className="callcenter-home-card-category">
                  {workspace.category}
                </div>

                <h3 className="callcenter-home-card-title">
                  {workspace.title}
                </h3>

                <p className="callcenter-home-card-description">
                  {workspace.description}
                </p>

                <div className="callcenter-home-card-features">
                  {workspace.features.map((feature) => (
                    <div
                      key={feature}
                      className="callcenter-home-card-feature"
                    >
                      <HomeIcon
                        name="check"
                        size={15}
                      />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="callcenter-home-card-footer">
                  <span>{workspace.action}</span>

                  <HomeIcon
                    name="arrow"
                    size={19}
                  />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* FOOTER */}

        <footer className="callcenter-home-footer">
          <span>
            Hospital Workflow Management System
          </span>

          <span>
            Call Center Operations
          </span>
        </footer>
      </main>
    </div>
  );
}

/* =========================================================
   ICON COMPONENT
========================================================= */

function HomeIcon({ name, size = 20 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  switch (name) {
    case "headset":
      return (
        <svg {...common}>
          <path d="M3 14v-3a9 9 0 0 1 18 0v3" />
          <rect x="2" y="13" width="4" height="7" rx="2" />
          <rect x="18" y="13" width="4" height="7" rx="2" />
          <path d="M20 20a5 5 0 0 1-5 3h-3" />
        </svg>
      );

    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M7 3v4M17 3v4M3 10h18" />
          <path d="m9 16 2 2 4-4" />
        </svg>
      );

    case "bell":
      return (
        <svg {...common}>
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
      );

    case "users":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20v-2a6 6 0 0 1 12 0v2" />
          <path d="M16 5a3 3 0 0 1 0 6" />
          <path d="M18 14a5 5 0 0 1 3 5v1" />
        </svg>
      );

    case "logout":
      return (
        <svg {...common}>
          <path d="M10 17l5-5-5-5M15 12H3" />
          <path d="M12 3h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-6" />
        </svg>
      );

    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );

    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "sparkles":
      return (
        <svg {...common}>
          <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
          <path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" />
        </svg>
      );

    default:
      return null;
  }
}

/* =========================================================
   STYLES
========================================================= */

const styles = `
.callcenter-home {
  --cc-navy: #172b4d;
  --cc-pink: #be185d;
  --cc-blue: #2563eb;
  --cc-muted: #64748b;
  --cc-border: #e2e8f0;

  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: #f8fafc;
  padding: 35px 24px 45px;
  color: #334155;
  font-family: inherit;
}

.callcenter-home * {
  box-sizing: border-box;
}

.callcenter-home button {
  font-family: inherit;
}

.callcenter-home-glow {
  position: absolute;
  width: 430px;
  height: 430px;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
}

.callcenter-home-glow-blue {
  top: -190px;
  left: -150px;
  background: rgba(37, 99, 235, .09);
}

.callcenter-home-glow-pink {
  bottom: -180px;
  right: -140px;
  background: rgba(190, 24, 93, .07);
}

.callcenter-home-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

/* HEADER */

.callcenter-home-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 32px;
}

.callcenter-home-brand {
  display: flex;
  align-items: center;
  gap: 13px;
}

.callcenter-home-brand-icon {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 15px;
  background: #172b4d;
  color: #fff;
  box-shadow: 0 7px 20px rgba(23,43,77,.15);
}

.callcenter-home-brand-name {
  font-size: 19px;
  font-weight: 800;
  color: #172b4d;
}

.callcenter-home-brand-description {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
}

.callcenter-home-header-actions {
  display: flex;
  align-items: center;
  gap: 13px;
  flex-wrap: wrap;
}

.callcenter-home-date {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 12px 15px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  color: #52657d;
  font-size: 12px;
  font-weight: 700;
}

.callcenter-home-logout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 12px 17px;
  border: 1px solid #fecaca;
  border-radius: 12px;
  background: #fff;
  color: #dc2626;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.callcenter-home-logout:hover {
  background: #fef2f2;
}

/* IMPERSONATION */

.callcenter-home-impersonation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
  padding: 16px 20px;
  margin-bottom: 22px;
  border: 1px solid #fed7aa;
  border-radius: 14px;
  background: #fff7ed;
}

.callcenter-home-impersonation-label {
  display: block;
  margin-bottom: 5px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  color: #c2410c;
}

.callcenter-home-impersonation-text {
  font-size: 13px;
  color: #9a3412;
}

.callcenter-home-admin-button {
  padding: 10px 15px;
  border: 0;
  border-radius: 10px;
  background: #9a3412;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

/* WELCOME */

.callcenter-home-welcome {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 255px;
  overflow: hidden;
  padding: 35px 38px;
  border-radius: 22px;
  background: linear-gradient(
    115deg,
    #172b4d 0%,
    #243f70 65%,
    #4c3974 100%
  );
  color: #fff;
  box-shadow: 0 12px 35px rgba(23,43,77,.12);
}

.callcenter-home-welcome-content {
  position: relative;
  z-index: 2;
  max-width: 760px;
}

.callcenter-home-eyebrow {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #f9c5dd;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.4px;
}

.callcenter-home-eyebrow-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #f9a8d4;
}

.callcenter-home-title {
  margin: 17px 0 13px;
  font-size: clamp(27px, 3.3vw, 40px);
  line-height: 1.25;
  font-weight: 800;
  letter-spacing: -.8px;
  color: #fff;
}

.callcenter-home-title span {
  color: #f9a8d4;
}

.callcenter-home-subtitle {
  max-width: 630px;
  margin: 0;
  color: #d8e4f4;
  font-size: 14px;
  line-height: 1.9;
}

.callcenter-home-welcome-footer {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 24px;
  color: #d9f9e7;
  font-size: 12px;
  font-weight: 700;
}

.callcenter-home-welcome-art {
  position: relative;
  flex: 0 0 185px;
  width: 185px;
  height: 185px;
}

.callcenter-home-art-circle {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,.14);
}

.callcenter-home-art-circle-one {
  inset: 0;
}

.callcenter-home-art-circle-two {
  inset: 22px;
}

.callcenter-home-art-icon {
  position: absolute;
  inset: 47px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 22px;
  background: rgba(255,255,255,.12);
  color: #fbcfe8;
}

/* MESSAGE */

.callcenter-home-message {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 21px 24px;
  margin-top: 22px;
  border: 1px solid #e2e8f0;
  border-radius: 17px;
  background: #fff;
  box-shadow: 0 5px 20px rgba(30,50,90,.035);
}

.callcenter-home-message-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 47px;
  width: 47px;
  height: 47px;
  border-radius: 13px;
  background: #fdf2f8;
  color: #be185d;
}

.callcenter-home-message-content {
  min-width: 0;
}

.callcenter-home-message-label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.1px;
  color: #be185d;
}

.callcenter-home-message-text {
  margin: 7px 0 0;
  color: #334155;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.7;
}

/* WORKSPACES */

.callcenter-home-workspaces {
  margin-top: 35px;
}

.callcenter-home-section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 19px;
}

.callcenter-home-section-title {
  margin: 0;
  font-size: 23px;
  font-weight: 800;
  color: #172b4d;
}

.callcenter-home-section-description {
  margin: 7px 0 0;
  font-size: 13px;
  color: #64748b;
}

.callcenter-home-workspace-count {
  padding: 8px 13px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4057cf;
  font-size: 12px;
  font-weight: 800;
}

.callcenter-home-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.callcenter-home-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 375px;
  padding: 25px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 8px 28px rgba(30,50,90,.045);
  transition:
    transform .2s ease,
    border-color .2s ease,
    box-shadow .2s ease;
}

.callcenter-home-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 38px rgba(30,50,90,.1);
}

.callcenter-home-card-blue:hover {
  border-color: #93c5fd;
}

.callcenter-home-card-pink:hover {
  border-color: #f9a8d4;
}

.callcenter-home-card-green:hover {
  border-color: #86efac;
}

.callcenter-home-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}

.callcenter-home-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  border-radius: 16px;
}

.callcenter-home-card-blue .callcenter-home-card-icon {
  background: #eff6ff;
  color: #2563eb;
}

.callcenter-home-card-pink .callcenter-home-card-icon {
  background: #fdf2f8;
  color: #be185d;
}

.callcenter-home-card-green .callcenter-home-card-icon {
  background: #f0fdf4;
  color: #15803d;
}

.callcenter-home-card-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 35px;
  height: 35px;
  border: 1px solid #e2e8f0;
  border-radius: 50%;
  color: #94a3b8;
}

.callcenter-home-card-category {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.1px;
}

.callcenter-home-card-blue .callcenter-home-card-category {
  color: #2563eb;
}

.callcenter-home-card-pink .callcenter-home-card-category {
  color: #be185d;
}

.callcenter-home-card-green .callcenter-home-card-category {
  color: #15803d;
}

.callcenter-home-card-title {
  margin: 10px 0 10px;
  font-size: 27px;
  font-weight: 800;
  color: #172b4d;
}

.callcenter-home-card-description {
  margin: 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.8;
}

.callcenter-home-card-features {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 21px 0 25px;
}

.callcenter-home-card-feature {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #52657d;
  font-size: 12px;
  font-weight: 600;
}

.callcenter-home-card-feature svg {
  color: #16a34a;
}

.callcenter-home-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: auto;
  padding-top: 19px;
  border-top: 1px solid #edf1f7;
  font-size: 13px;
  font-weight: 800;
}

.callcenter-home-card-blue .callcenter-home-card-footer {
  color: #2563eb;
}

.callcenter-home-card-pink .callcenter-home-card-footer {
  color: #be185d;
}

.callcenter-home-card-green .callcenter-home-card-footer {
  color: #15803d;
}

/* FOOTER */

.callcenter-home-footer {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 35px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
  color: #94a3b8;
  font-size: 12px;
}

/* RESPONSIVE */

@media (max-width: 1000px) {
  .callcenter-home-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .callcenter-home-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .callcenter-home-welcome-art {
    display: none;
  }
}

@media (max-width: 600px) {
  .callcenter-home {
    padding: 20px 14px 30px;
  }

  .callcenter-home-header {
    align-items: flex-start;
  }

  .callcenter-home-date {
    display: none;
  }

  .callcenter-home-welcome {
    padding: 27px 23px;
    min-height: 0;
  }

  .callcenter-home-title {
    font-size: 27px;
  }

  .callcenter-home-message {
    align-items: flex-start;
    padding: 19px;
  }

  .callcenter-home-card {
    min-height: 0;
    padding: 23px;
  }

  .callcenter-home-card-title {
    font-size: 25px;
  }

  .callcenter-home-section-title {
    font-size: 21px;
  }
}
`;

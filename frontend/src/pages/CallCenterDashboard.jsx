
import React, {
  Component,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import DashboardNotice from "../components/common/DashboardNotice";

import CallCenterSearchSection from "../components/callcenter/CallCenterSearchSection";
import CallCenterRegisterSection from "../components/callcenter/CallCenterRegisterSection";
import WaitingListSection from "../components/callcenter/WaitingListSection";
import CallCenterScheduleUpload from "../components/callcenter/CallCenterScheduleUpload";

import BookingSection from "../components/booking/BookingSection";
import TodayBookingsSection from "../components/booking/TodayBookingsSection";
import MonthlyBookingsSection from "../components/booking/MonthlyBookingsSection";
import FutureBookingsSection from "../components/booking/FutureBookingsSection";
import useBookingDashboard from "../components/booking/useBookingDashboard";

/* =========================================================
   DESIGN SYSTEM
========================================================= */

const COLORS = {
  navy: "#172b4d",
  text: "#334155",
  muted: "#64748b",
  border: "#e2e8f0",
  pink: "#be185d",
  pinkLight: "#fdf2f8",
  blue: "#2563eb",
  blueLight: "#eff6ff",
  green: "#15803d",
  greenLight: "#f0fdf4",
  purple: "#7c3aed",
  purpleLight: "#f5f3ff",
  orange: "#c2410c",
  orangeLight: "#fff7ed",
};

const styles = `
.cc-dashboard {
  color: #334155;
  width: 100%;
  min-width: 0;
}

.cc-dashboard * {
  box-sizing: border-box;
}

.cc-hero {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 30px;
  margin-bottom: 24px;
  border-radius: 20px;
  background: linear-gradient(
    120deg,
    #172b4d 0%,
    #253f72 58%,
    #be185d 150%
  );
  color: white;
}

.cc-hero::after {
  content: "";
  position: absolute;
  width: 230px;
  height: 230px;
  right: -65px;
  top: -105px;
  border: 35px solid rgba(255,255,255,.055);
  border-radius: 50%;
  pointer-events: none;
}

.cc-hero-content {
  position: relative;
  z-index: 1;
}

.cc-hero-eyebrow {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1.6px;
  color: #f9c5dd;
  font-weight: 800;
}

.cc-hero-title {
  margin: 9px 0 8px;
  color: #fff;
  font-size: clamp(23px, 3vw, 32px);
  font-weight: 800;
  letter-spacing: -.7px;
}

.cc-hero-description {
  margin: 0;
  max-width: 650px;
  color: #dce5f4;
  line-height: 1.7;
  font-size: 14px;
}

.cc-hero-date {
  position: relative;
  z-index: 1;
  padding: 13px 17px;
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 13px;
  background: rgba(255,255,255,.1);
  color: #fff;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 700;
}

.cc-section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin: 0 0 16px;
}

.cc-section-title {
  margin: 0;
  font-size: 19px;
  font-weight: 800;
  color: #172b4d;
}

.cc-section-subtitle {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 13px;
}

.cc-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 28px;
}

.cc-stat-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 15px;
  min-width: 0;
  min-height: 155px;
  padding: 21px;
  border: 1px solid #e2e8f0;
  border-radius: 17px;
  background: white;
  text-align: left;
  box-shadow: 0 5px 22px rgba(30,50,90,.035);
  cursor: pointer;
  transition: transform .2s, box-shadow .2s, border-color .2s;
}

.cc-stat-card:hover {
  transform: translateY(-3px);
  border-color: #cbd5e1;
  box-shadow: 0 10px 26px rgba(30,50,90,.09);
}

.cc-stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.cc-stat-label {
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
}

.cc-stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  font-size: 21px;
}

.cc-stat-value {
  margin-top: 5px;
  font-size: 33px;
  font-weight: 850;
  line-height: 1.15;
  color: #172b4d;
  font-variant-numeric: tabular-nums;
}

.cc-stat-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: #94a3b8;
  font-size: 12px;
}

.cc-stat-link {
  color: #be185d;
  font-weight: 800;
}

.cc-content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(270px, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.cc-panel {
  min-width: 0;
  padding: 24px;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 5px 22px rgba(30,50,90,.035);
}

.cc-panel-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #172b4d;
}

.cc-panel-description {
  margin: 7px 0 20px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}

.cc-actions-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.cc-action-card {
  display: flex;
  align-items: center;
  gap: 13px;
  width: 100%;
  min-width: 0;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 13px;
  background: #fbfcff;
  text-align: left;
  cursor: pointer;
  transition: background .2s, border-color .2s, transform .2s;
}

.cc-action-card:hover {
  transform: translateY(-2px);
  background: #fdf2f8;
  border-color: #f5bfd8;
}

.cc-action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 43px;
  height: 43px;
  flex-shrink: 0;
  border-radius: 12px;
  font-size: 21px;
}

.cc-action-content {
  flex: 1;
  min-width: 0;
}

.cc-action-title {
  color: #263b53;
  font-size: 13px;
  font-weight: 800;
}

.cc-action-description {
  margin-top: 5px;
  color: #71829a;
  font-size: 12px;
  line-height: 1.5;
}

.cc-action-arrow {
  color: #94a3b8;
  font-size: 17px;
}

.cc-summary-list {
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.cc-summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 15px;
  border: 1px solid #edf1f7;
  border-radius: 12px;
  background: #f8fafc;
}

.cc-summary-label {
  font-size: 13px;
  color: #52657d;
}

.cc-summary-value {
  font-size: 15px;
  font-weight: 800;
  color: #172b4d;
}

.cc-workspace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 22px;
}

.cc-workspace-title {
  margin: 0;
  color: #172b4d;
  font-size: 24px;
  font-weight: 800;
}

.cc-workspace-description {
  margin: 7px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}

.cc-back-button,
.cc-primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 10px 16px;
  border-radius: 11px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: background .2s;
}

.cc-back-button {
  background: #fff;
  color: #40516a;
  border: 1px solid #dce5f0;
}

.cc-back-button:hover {
  background: #f8fafc;
}

.cc-primary-button {
  background: #be185d;
  color: white;
  border: 1px solid #be185d;
}

.cc-primary-button:hover {
  background: #9d174d;
}

.cc-workspace {
  min-width: 0;
}

.cc-workspace-inner {
  min-width: 0;
}

.cc-schedule-intro {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 18px 20px;
  margin-bottom: 20px;
  border: 1px solid #dbeafe;
  border-radius: 15px;
  background: linear-gradient(110deg, #eff6ff, #f8faff);
}

.cc-schedule-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  flex-shrink: 0;
  border-radius: 13px;
  background: #dbeafe;
  font-size: 25px;
}

.cc-schedule-intro-title {
  margin: 0;
  color: #1e3a8a;
  font-size: 16px;
  font-weight: 800;
}

.cc-schedule-intro-text {
  margin: 5px 0 0;
  color: #526985;
  font-size: 13px;
  line-height: 1.6;
}

.cc-workspace-error {
  padding: 20px;
  border: 1px solid #fecaca;
  border-radius: 14px;
  background: #fef2f2;
  color: #991b1b;
}

.cc-workspace-error h3 {
  margin: 0 0 10px;
  font-size: 17px;
}

.cc-workspace-error p {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.6;
}

.cc-error-details {
  padding: 12px;
  margin: 0 0 14px;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fff;
  color: #7f1d1d;
  font-size: 12px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

@media (max-width: 1100px) {
  .cc-stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cc-content-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 650px) {
  .cc-hero {
    flex-direction: column;
    align-items: flex-start;
    padding: 23px;
  }

  .cc-stats-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .cc-actions-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .cc-panel {
    padding: 18px;
  }

  .cc-workspace-title {
    font-size: 21px;
  }

  .cc-schedule-intro {
    align-items: flex-start;
  }
}
`;

/* =========================================================
   NAVIGATION
========================================================= */

const SECTION_KEYS = new Set([
  "overview",
  "search",
  "register",
  "booking",
  "schedule_upload",
  "waiting_list",
  "today",
  "monthly",
  "future",
]);

function normalizeSection(value) {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    if (typeof value.key === "string") {
      return value.key;
    }

    if (typeof value.value === "string") {
      return value.value;
    }

    if (typeof value.target?.value === "string") {
      return value.target.value;
    }

    if (
      typeof value.currentTarget?.dataset?.section ===
      "string"
    ) {
      return value.currentTarget.dataset.section;
    }
  }

  return "";
}

/* =========================================================
   ERROR BOUNDARY
========================================================= */

class WorkspaceErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(
      "Call Center workspace rendering error:",
      error,
      info
    );
  }

  render() {
    const { error } = this.state;

    if (error) {
      return (
        <div
          className="cc-workspace-error"
          role="alert"
        >
          <h3>
            Unable to display this section
          </h3>

          <p>
            The selected section opened, but its
            component encountered a rendering error.
          </p>

          <pre className="cc-error-details">
            {error.message || String(error)}
          </pre>

          <button
            type="button"
            className="cc-back-button"
            onClick={this.props.onBack}
          >
            ← Dashboard Overview
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/* =========================================================
   REUSABLE UI
========================================================= */

function StatCard({
  label,
  value,
  icon,
  color,
  background,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      className="cc-stat-card"
      onClick={onClick}
    >
      <div className="cc-stat-top">
        <span className="cc-stat-label">
          {label}
        </span>

        <span
          className="cc-stat-icon"
          style={{ color, background }}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>

      <div className="cc-stat-value">
        {value}
      </div>

      <div className="cc-stat-footer">
        <span>{description}</span>
        <span className="cc-stat-link">
          View →
        </span>
      </div>
    </button>
  );
}

function ActionCard({
  title,
  description,
  icon,
  color,
  background,
  onClick,
}) {
  return (
    <button
      type="button"
      className="cc-action-card"
      onClick={onClick}
    >
      <span
        className="cc-action-icon"
        style={{ color, background }}
        aria-hidden="true"
      >
        {icon}
      </span>

      <span className="cc-action-content">
        <div className="cc-action-title">
          {title}
        </div>

        <div className="cc-action-description">
          {description}
        </div>
      </span>

      <span className="cc-action-arrow">
        →
      </span>
    </button>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="cc-summary-row">
      <span className="cc-summary-label">
        {label}
      </span>

      <span className="cc-summary-value">
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   MAIN DASHBOARD
========================================================= */

export default function CallCenterDashboard({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();

  const [waitingList] = useState([]);
  const [currentSection, setCurrentSection] =
    useState("overview");
  const [navigationError, setNavigationError] =
    useState("");

  const {
    message,
    error,

    selectedPatient,

    patientForm,
    setPatientForm,

    bookingForm,
    setBookingForm,

    therapists,
    weekDates,
    slots,

    todayBookingsCount,
    monthlyBookingsCount,

    todayBookings,
    monthlyBookings,
    monthlyAgents,

    monthlyFilter,
    setMonthlyFilter,

    futureBookings,
    futureTherapistSummary,
    futureDaySummary,

    futureFilter,
    setFutureFilter,

    handleSelectPatient,
    handleCreatePatientFile,

    handleSelectTherapist,
    handleSelectDate,
    handleSelectSlot,
    handleConfirmBooking,

    handleApplyMonthlyFilters,
    handleApplyFutureFilters,

    handleEditBooking,
    handleDeleteBooking,
  } = useBookingDashboard();

  /* =========================================================
     NAVIGATION
  ========================================================= */

  function openSection(section) {
    const key = normalizeSection(section);

    if (!SECTION_KEYS.has(key)) {
      console.warn(
        "Unknown Call Center section:",
        section
      );

      setNavigationError(
        "Unable to open the selected section."
      );
      return;
    }

    setNavigationError("");
    setCurrentSection(key);
  }

  function openOverview() {
    openSection("overview");
  }

  function handleSidebarChange(section) {
    openSection(section);
  }

  const handleBackToAdmin = () => {
    onStopImpersonation?.();
    navigate("/admin");
  };

  /* =========================================================
     DERIVED DATA
  ========================================================= */

  const displayName =
    actingAs?.first_name ||
    actingAs?.username ||
    user?.first_name ||
    user?.username ||
    "Call Center Team";

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString(
        "en-GB",
        {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      ),
    []
  );

  const todayCount =
    Number(todayBookingsCount) || 0;

  const monthlyCount =
    Number(monthlyBookingsCount) || 0;

  const waitingCount = waitingList.length;

  const futureCount =
    Array.isArray(futureBookings)
      ? futureBookings.length
      : 0;

  const therapistCount =
    Array.isArray(therapists)
      ? therapists.length
      : 0;

  const selectedPatientName =
    selectedPatient?.full_name ||
    selectedPatient?.patient_name ||
    selectedPatient?.name ||
    [
      selectedPatient?.first_name,
      selectedPatient?.last_name,
    ]
      .filter(Boolean)
      .join(" ");

  const sectionMeta = {
    overview: {
      title: "Dashboard Overview",
      description:
        "Call Center operations overview.",
    },

    search: {
      title: "Search Patients",
      description:
        "Find existing patient records and access their information.",
    },

    register: {
      title: "Register New Patient",
      description:
        "Create a new patient file in the hospital system.",
    },

    booking: {
      title: "Appointment Booking",
      description:
        "Select a patient, therapist, date, and available appointment slot.",
    },

    schedule_upload: {
      title: "Therapist Daily Schedule",
      description:
        "Upload Concepts screenshots, review appointments, match patients, and manage confirmation status.",
    },

    waiting_list: {
      title: "Waiting List",
      description:
        "Review patients waiting for appointment availability.",
    },

    today: {
      title: "Daily Bookings",
      description:
        "Review and manage appointments scheduled for today.",
    },

    monthly: {
      title: "Monthly Tracker",
      description:
        "Monitor monthly appointments and filter by staff or therapist.",
    },

    future: {
      title: "Future Bookings",
      description:
        "Review upcoming appointments and scheduling workload.",
    },
  };

  const currentMeta =
    sectionMeta[currentSection] || {
      title: "Call Center",
      description: "",
    };

  /* =========================================================
     SIDEBAR

     Schedule now opens schedule_upload.
     Booking remains available as a separate section.
  ========================================================= */

  const sidebarItems = [
    {
      key: "overview",
      label: "Dashboard Overview",
    },
    {
      key: "search",
      label: "Search Patient",
    },
    {
      key: "register",
      label: "Register Patient",
    },
    {
      key: "schedule_upload",
      label: "Schedule",
    },
    {
      key: "booking",
      label: "Appointment Booking",
    },
    {
      key: "waiting_list",
      label: `Waiting List (${waitingCount})`,
    },
    {
      key: "today",
      label: `Daily Bookings (${todayCount})`,
    },
    {
      key: "monthly",
      label: `Monthly Tracker (${monthlyCount})`,
    },
    {
      key: "future",
      label: `Future Bookings (${futureCount})`,
    },
  ];

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <DashboardLayout
      title="Call Center Dashboard"
      subtitle={`Welcome ${displayName}`}
      sidebarTitle="Call Center Panel"
      sidebarItems={sidebarItems}
      activeSection={currentSection}
      setActiveSection={handleSidebarChange}
      onLogout={onLogout}
      actingAs={actingAs}
      actingAsName={actingAs?.username}
      onBackToAdmin={handleBackToAdmin}
      accent="#be185d"
    >
      <style>{styles}</style>

      <div className="cc-dashboard">

        {/* GLOBAL MESSAGES */}

        {message && (
          <DashboardNotice type="success">
            {message}
          </DashboardNotice>
        )}

        {error && (
          <DashboardNotice type="error">
            {error}
          </DashboardNotice>
        )}

        {navigationError && (
          <DashboardNotice type="error">
            {navigationError}
          </DashboardNotice>
        )}

        {/* DASHBOARD OVERVIEW */}

        {currentSection === "overview" ? (
          <>
            <div className="cc-hero">
              <div className="cc-hero-content">
                <div className="cc-hero-eyebrow">
                  CALL CENTER OPERATIONS
                </div>

                <h1 className="cc-hero-title">
                  Welcome back, {displayName}
                </h1>

                <p className="cc-hero-description">
                  Manage patient requests, coordinate
                  appointments, review scheduling activity,
                  and monitor the waiting list from one
                  central workspace.
                </p>
              </div>

              <div className="cc-hero-date">
                📅 {todayLabel}
              </div>
            </div>

            {/* STATISTICS */}

            <div className="cc-section-heading">
              <div>
                <h2 className="cc-section-title">
                  Operations Overview
                </h2>

                <p className="cc-section-subtitle">
                  Current appointment and patient
                  coordination summary.
                </p>
              </div>
            </div>

            <div className="cc-stats-grid">
              <StatCard
                label="Today's Bookings"
                value={todayCount}
                icon="📅"
                color={COLORS.blue}
                background={COLORS.blueLight}
                description="Appointments today"
                onClick={() => openSection("today")}
              />

              <StatCard
                label="Monthly Bookings"
                value={monthlyCount}
                icon="📊"
                color={COLORS.green}
                background={COLORS.greenLight}
                description="This month's activity"
                onClick={() => openSection("monthly")}
              />

              <StatCard
                label="Waiting List"
                value={waitingCount}
                icon="⏳"
                color={COLORS.orange}
                background={COLORS.orangeLight}
                description="Patients waiting"
                onClick={() =>
                  openSection("waiting_list")
                }
              />

              <StatCard
                label="Future Bookings"
                value={futureCount}
                icon="🗓️"
                color={COLORS.purple}
                background={COLORS.purpleLight}
                description="Upcoming appointments"
                onClick={() => openSection("future")}
              />
            </div>

            {/* MAIN DASHBOARD CONTENT */}

            <div className="cc-content-grid">

              {/* QUICK ACTIONS */}

              <section className="cc-panel">
                <h2 className="cc-panel-title">
                  Quick Actions
                </h2>

                <p className="cc-panel-description">
                  Access frequently used call center
                  functions.
                </p>

                <div className="cc-actions-grid">
                  <ActionCard
                    title="Search Patient"
                    description="Find existing patient records"
                    icon="🔎"
                    color={COLORS.blue}
                    background={COLORS.blueLight}
                    onClick={() =>
                      openSection("search")
                    }
                  />

                  <ActionCard
                    title="Register Patient"
                    description="Create a new patient file"
                    icon="👤"
                    color={COLORS.green}
                    background={COLORS.greenLight}
                    onClick={() =>
                      openSection("register")
                    }
                  />

                  {/* UPDATED SCHEDULE ACTION */}

                  <ActionCard
                    title="Schedule"
                    description="Upload Concepts screenshots and confirm therapist appointments"
                    icon="📆"
                    color={COLORS.pink}
                    background={COLORS.pinkLight}
                    onClick={() =>
                      openSection("schedule_upload")
                    }
                  />

                  <ActionCard
                    title="Appointment Booking"
                    description="Create or edit an appointment"
                    icon="📝"
                    color={COLORS.purple}
                    background={COLORS.purpleLight}
                    onClick={() =>
                      openSection("booking")
                    }
                  />

                  <ActionCard
                    title="Waiting List"
                    description="Review pending appointment requests"
                    icon="⏳"
                    color={COLORS.orange}
                    background={COLORS.orangeLight}
                    onClick={() =>
                      openSection("waiting_list")
                    }
                  />

                  <ActionCard
                    title="Daily Bookings"
                    description="Manage today's appointments"
                    icon="📋"
                    color={COLORS.purple}
                    background={COLORS.purpleLight}
                    onClick={() =>
                      openSection("today")
                    }
                  />

                  <ActionCard
                    title="Future Bookings"
                    description="View upcoming appointments"
                    icon="🗓️"
                    color={COLORS.blue}
                    background={COLORS.blueLight}
                    onClick={() =>
                      openSection("future")
                    }
                  />
                </div>
              </section>

              {/* OPERATIONAL SUMMARY */}

              <section className="cc-panel">
                <h2 className="cc-panel-title">
                  Scheduling Summary
                </h2>

                <p className="cc-panel-description">
                  A quick view of the current scheduling
                  workload.
                </p>

                <div className="cc-summary-list">
                  <SummaryRow
                    label="Bookings Today"
                    value={todayCount}
                  />

                  <SummaryRow
                    label="Monthly Bookings"
                    value={monthlyCount}
                  />

                  <SummaryRow
                    label="Upcoming Bookings"
                    value={futureCount}
                  />

                  <SummaryRow
                    label="Waiting Patients"
                    value={waitingCount}
                  />

                  <SummaryRow
                    label="Available Therapists"
                    value={therapistCount}
                  />

                  <SummaryRow
                    label="Selected Patient"
                    value={
                      selectedPatientName || "None"
                    }
                  />
                </div>
              </section>
            </div>
          </>
        ) : (

          /* =============================================
             WORKSPACE
          ============================================= */

          <div className="cc-workspace">
            <div className="cc-workspace-header">
              <div>
                <h1 className="cc-workspace-title">
                  {currentMeta.title}
                </h1>

                <p className="cc-workspace-description">
                  {currentMeta.description}
                </p>
              </div>

              <button
                type="button"
                className="cc-back-button"
                onClick={openOverview}
              >
                ← Dashboard Overview
              </button>
            </div>

            <div className="cc-workspace-inner">
              <WorkspaceErrorBoundary
                key={currentSection}
                onBack={openOverview}
              >

                {/* SEARCH PATIENT */}

                {currentSection === "search" && (
                  <CallCenterSearchSection
                    onSelectPatient={(patient) => {
                      handleSelectPatient(patient);
                      openSection("booking");
                    }}
                    onRegisterNew={() =>
                      openSection("register")
                    }
                  />
                )}

                {/* REGISTER PATIENT */}

                {currentSection === "register" && (
                  <CallCenterRegisterSection
                    patientForm={patientForm}
                    setPatientForm={setPatientForm}
                    onSubmit={handleCreatePatientFile}
                  />
                )}

                {/* APPOINTMENT BOOKING */}

                {currentSection === "booking" && (
                  <>
                    <div className="cc-schedule-intro">
                      <div className="cc-schedule-icon">
                        📝
                      </div>

                      <div>
                        <h2 className="cc-schedule-intro-title">
                          Appointment Booking
                        </h2>

                        <p className="cc-schedule-intro-text">
                          Select a patient, choose a
                          therapist, and assign an available
                          appointment date and time.
                        </p>
                      </div>
                    </div>

                    <BookingSection
                      selectedPatient={selectedPatient}
                      bookingForm={bookingForm}
                      setBookingForm={setBookingForm}
                      therapists={therapists}
                      weekDates={weekDates}
                      slots={slots}
                      onSelectTherapist={
                        handleSelectTherapist
                      }
                      onSelectDate={handleSelectDate}
                      onSelectSlot={handleSelectSlot}
                      onConfirmBooking={
                        handleConfirmBooking
                      }
                    />
                  </>
                )}

                {/* THERAPIST DAILY SCHEDULE */}

                {currentSection === "schedule_upload" && (
                  <>
                    <div className="cc-schedule-intro">
                      <div className="cc-schedule-icon">
                        📆
                      </div>

                      <div>
                        <h2 className="cc-schedule-intro-title">
                          Therapist Daily Schedule
                        </h2>

                        <p className="cc-schedule-intro-text">
                          Upload Concepts screenshots,
                          review appointments, match
                          patient records, and manage
                          appointment confirmation.
                        </p>
                      </div>
                    </div>

                    <CallCenterScheduleUpload
                      therapists={therapists}
                    />
                  </>
                )}

                {/* WAITING LIST */}

                {currentSection === "waiting_list" && (
                  <WaitingListSection
                    waitingList={waitingList}
                    onOpenWaitingList={() =>
                      openSection("waiting_list")
                    }
                  />
                )}

                {/* DAILY BOOKINGS */}

                {currentSection === "today" && (
                  <TodayBookingsSection
                    bookings={todayBookings}
                    onEditBooking={(booking) => {
                      handleEditBooking(booking);
                      openSection("booking");
                    }}
                    onDeleteBooking={
                      handleDeleteBooking
                    }
                  />
                )}

                {/* MONTHLY TRACKER */}

                {currentSection === "monthly" && (
                  <MonthlyBookingsSection
                    bookings={monthlyBookings}
                    agents={monthlyAgents}
                    therapists={therapists}
                    monthlyFilter={monthlyFilter}
                    setMonthlyFilter={
                      setMonthlyFilter
                    }
                    onApplyFilters={
                      handleApplyMonthlyFilters
                    }
                  />
                )}

                {/* FUTURE BOOKINGS */}

                {currentSection === "future" && (
                  <FutureBookingsSection
                    futureBookings={futureBookings}
                    therapistSummary={
                      futureTherapistSummary
                    }
                    daySummary={futureDaySummary}
                    therapists={therapists}
                    futureFilter={futureFilter}
                    setFutureFilter={setFutureFilter}
                    onApplyFilters={
                      handleApplyFutureFilters
                    }
                    onEditBooking={(booking) => {
                      handleEditBooking(booking);
                      openSection("booking");
                    }}
                    onDeleteBooking={
                      handleDeleteBooking
                    }
                  />
                )}

              </WorkspaceErrorBoundary>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

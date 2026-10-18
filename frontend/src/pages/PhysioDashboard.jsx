
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import AssignmentHistory from "../components/AssignmentHistory";

import PhysioTodaySection from "../components/physio/PhysioTodaySection";
import PhysioTrackerSection from "../components/physio/PhysioTrackerSection";
import PhysioAlerts from "../components/physio/PhysioAlerts";

import usePhysioDashboard from "../components/physio/usePhysioDashboard";

// Booking features are disabled but kept for future use.
// import StatisticsSection from "../components/booking/StatisticsSection";
// import TodayAppointmentsSection from "../components/booking/TodayAppointmentsSection";

export default function PhysioDashboard({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("today");

  const {
    today,
    assignments,
    alerts,
    patients,
    patientError,
    trackerMonth,
    setTrackerMonth,
    patientSearch,
    setPatientSearch,
    loadTracker,
  } = usePhysioDashboard(user, actingAs);

  const handleBackToAdmin = () => {
    if (onStopImpersonation) {
      onStopImpersonation();
    }

    navigate("/admin");
  };

  return (
    <DashboardLayout
      title="Physio Dashboard"
      subtitle={`Welcome ${
        actingAs?.username || user?.username || ""
      }`}
      sidebarTitle="Physio Panel"
      sidebarItems={[
        { key: "today", label: "Today's Registrations" },
        { key: "history", label: "Registration History" },
        { key: "tracker", label: "Monthly Tracker" },
      ]}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      onLogout={onLogout}
      actingAs={actingAs}
      onBackToAdmin={handleBackToAdmin}
    >
      <PhysioAlerts alerts={alerts} />

      {/* REGISTRATION-ONLY DASHBOARD */}
      {activeSection === "today" && (
        <PhysioTodaySection
          today={today}
          assignments={assignments || []}
        />
      )}

      {/* REGISTRATION HISTORY */}
      {activeSection === "history" && (
        <AssignmentHistory
          title="Physio Registration History"
          currentUser={user}
          actingAs={actingAs}
        />
      )}

      {/* MONTHLY PATIENT TRACKER */}
      {activeSection === "tracker" && (
        <PhysioTrackerSection
          trackerMonth={trackerMonth}
          setTrackerMonth={setTrackerMonth}
          patientSearch={patientSearch}
          setPatientSearch={setPatientSearch}
          loadTracker={loadTracker}
          patients={patients}
          patientError={patientError}
        />
      )}

      {/*
        FUTURE BOOKING FEATURES — CURRENTLY DISABLED

        <StatisticsSection stats={todayStats} />

        <TodayAppointmentsSection
          bookings={todayAppointments}
          title="Today's Appointments"
        />
      */}
    </DashboardLayout>
  );
}

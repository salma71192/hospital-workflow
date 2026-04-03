import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import AssignmentHistory from "../components/AssignmentHistory";

import PhysioTodaySection from "../components/physio/PhysioTodaySection";
import PhysioTrackerSection from "../components/physio/PhysioTrackerSection";
import PhysioAlerts from "../components/physio/PhysioAlerts";

import usePhysioDashboard from "../components/physio/usePhysioDashboard";

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
    onStopImpersonation();
    navigate("/admin");
  };

  return (
    <DashboardLayout
      title="Physio Dashboard"
      subtitle={`Welcome ${actingAs?.username || user?.username}`}
      sidebarTitle="Physio Panel"
      sidebarItems={[
        { key: "today", label: "Today's Assignments" },
        { key: "history", label: "History" },
        { key: "tracker", label: "Monthly Tracker" },
      ]}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      onLogout={onLogout}
      actingAs={actingAs}
      onBackToAdmin={handleBackToAdmin}
    >
      {/* 🔥 ALERTS */}
      <PhysioAlerts alerts={alerts} />

      {activeSection === "today" && (
        <PhysioTodaySection
          today={today}
          assignments={assignments}
        />
      )}

      {activeSection === "history" && (
        <AssignmentHistory
          title="Physio Assignment History"
          currentUser={user}
          actingAs={actingAs}
        />
      )}

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
    </DashboardLayout>
  );
}

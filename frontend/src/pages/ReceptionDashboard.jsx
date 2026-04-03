import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import DashboardNotice from "../components/common/DashboardNotice";
import ReceptionAlerts from "../components/reception/ReceptionAlerts";
import ReceptionTodaySection from "../components/reception/ReceptionTodaySection";
import ReceptionSearchAssignSection from "../components/reception/ReceptionSearchAssignSection";
import useReceptionDashboard from "../components/reception/useReceptionDashboard";

export default function ReceptionDashboard({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("today");

  const {
    search,
    setSearch,
    patients,
    assignments,
    therapists,
    selectedTherapist,
    setSelectedTherapist,
    category,
    setCategory,
    message,
    alerts,
    handleSearch,
    handleAssign,
  } = useReceptionDashboard(user, actingAs);

  const handleBackToAdmin = () => {
    onStopImpersonation();
    navigate("/admin");
  };

  return (
    <DashboardLayout
      title="Reception Dashboard"
      subtitle={`Welcome ${actingAs?.username || user?.username || ""}`}
      sidebarTitle="Reception"
      sidebarItems={[
        { key: "today", label: "Today's Assignments" },
        { key: "search", label: "Search & Assign" },
      ]}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      onLogout={onLogout}
      actingAs={actingAs}
      actingAsName={actingAs?.username}
      onBackToAdmin={handleBackToAdmin}
    >
      <ReceptionAlerts alerts={alerts} />

      {message && <DashboardNotice type="success">{message}</DashboardNotice>}

      {activeSection === "today" && (
        <ReceptionTodaySection assignments={assignments} />
      )}

      {activeSection === "search" && (
        <ReceptionSearchAssignSection
          search={search}
          setSearch={setSearch}
          handleSearch={handleSearch}
          therapists={therapists}
          selectedTherapist={selectedTherapist}
          setSelectedTherapist={setSelectedTherapist}
          category={category}
          setCategory={setCategory}
          patients={patients}
          handleAssign={handleAssign}
        />
      )}
    </DashboardLayout>
  );
}
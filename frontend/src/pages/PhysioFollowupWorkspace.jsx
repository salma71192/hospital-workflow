import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import DashboardNotice from "../components/common/DashboardNotice";
import TodayBookingsSection from "../components/booking/TodayBookingsSection";
import MonthlyBookingsSection from "../components/booking/MonthlyBookingsSection";
import useBookingDashboard from "../components/booking/useBookingDashboard";

export default function PhysioFollowupWorkspace({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("today");
  const [todayTarget, setTodayTarget] = useState(10);
  const [monthlyTarget, setMonthlyTarget] = useState(50);

  const {
    message,
    error,
    todayBookings,
    monthlyBookings,
    monthlyAgents,
    monthlyTherapists,
    monthlyFilter,
    setMonthlyFilter,
    handleApplyMonthlyFilters,
  } = useBookingDashboard();

  const handleBackToAdmin = () => {
    onStopImpersonation?.();
    navigate("/admin");
  };

  const physioTodayBookings = todayBookings.filter(
    (item) => String(item.therapist_id) === String(user?.id)
  );

  const physioMonthlyBookings = monthlyBookings.filter(
    (item) => String(item.therapist_id) === String(user?.id)
  );

  const physioMonthlyTherapists = (monthlyTherapists || []).filter(
    (item) => String(item.id) === String(user?.id)
  );

  return (
    <DashboardLayout
      title="Patient Workflow"
      subtitle={`Welcome, ${actingAs?.username || user?.username || "Physio User"}`}
      accent="#059669"
      sidebarTitle="Patient Workflow"
      sidebarItems={[
        { key: "home", label: "Home" },
        { key: "today", label: `Today's Bookings (${physioTodayBookings.length})` },
        { key: "tracker", label: "Patient Tracker" },
      ]}
      activeSection={activeSection}
      setActiveSection={(key) => {
        if (key === "home") {
          navigate("/physio");
          return;
        }
        setActiveSection(key);
      }}
      onLogout={onLogout}
      actingAs={actingAs}
      actingAsName={actingAs?.username}
      onBackToAdmin={handleBackToAdmin}
    >
      {message ? <DashboardNotice type="success">{message}</DashboardNotice> : null}
      {error ? <DashboardNotice type="error">{error}</DashboardNotice> : null}

      {activeSection === "today" && (
        <TodayBookingsSection
          bookings={physioTodayBookings}
          defaultOpen={true}
          target={todayTarget}
          onChangeTarget={setTodayTarget}
        />
      )}

      {activeSection === "tracker" && (
        <MonthlyBookingsSection
          bookings={physioMonthlyBookings}
          agents={monthlyAgents}
          therapists={physioMonthlyTherapists}
          monthlyFilter={monthlyFilter}
          setMonthlyFilter={setMonthlyFilter}
          onApplyFilters={handleApplyMonthlyFilters}
          defaultOpen={true}
          target={monthlyTarget}
          onChangeTarget={setMonthlyTarget}
        />
      )}
    </DashboardLayout>
  );
}
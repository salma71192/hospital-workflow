import React from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import DashboardNotice from "../components/common/DashboardNotice";
import DashboardStatsGrid from "../components/common/DashboardStatsGrid";

import CallCenterSearchSection from "../components/callcenter/CallCenterSearchSection";
import CallCenterRegisterSection from "../components/callcenter/CallCenterRegisterSection";
import CallCenterBookingSection from "../components/callcenter/CallCenterBookingSection";

import useCallCenterDashboard from "../components/callcenter/useCallCenterDashboard";

export default function CallCenterDashboard({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();

  const {
    activeSection,
    setActiveSection,
    message,
    error,
    selectedPatient,
    patientForm,
    setPatientForm,
    bookingForm,
    setBookingForm,
    therapists,
    todayBookingsCount,
    monthlyBookingsCount,
    handleSelectPatient,
    handleCreatePatientFile,
    handleSelectTherapist,
    handleSelectDate,
    handleSelectSlot,
    handleConfirmBooking,
  } = useCallCenterDashboard();

  const handleBackToAdmin = () => {
    onStopImpersonation?.();
    navigate("/admin");
  };

  return (
    <DashboardLayout
      title="Call Center Dashboard"
      subtitle={`Welcome ${actingAs?.username || user?.username || ""}`}
      sidebarTitle="Call Center Panel"
      sidebarItems={[
        { key: "search", label: "Search Patient" },
        { key: "register", label: "Register Patient" },
        { key: "booking", label: "Book Appointment" },
      ]}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      onLogout={onLogout}
      actingAs={actingAs}
      actingAsName={actingAs?.username}
      onBackToAdmin={handleBackToAdmin}
      accent="#be185d"
    >
      {message ? (
        <DashboardNotice type="success">{message}</DashboardNotice>
      ) : null}

      {error ? (
        <DashboardNotice type="error">{error}</DashboardNotice>
      ) : null}

      <DashboardStatsGrid
        stats={[
          { label: "Today's Bookings", value: todayBookingsCount || 0 },
          { label: "Monthly Bookings", value: monthlyBookingsCount || 0 },
          {
            label: "Selected Patient",
            value: selectedPatient?.name || "-",
          },
        ]}
      />

      {activeSection === "search" && (
        <CallCenterSearchSection
          onSelectPatient={handleSelectPatient}
          onRegisterNew={() => setActiveSection("register")}
        />
      )}

      {activeSection === "register" && (
        <CallCenterRegisterSection
          patientForm={patientForm}
          setPatientForm={setPatientForm}
          onSubmit={handleCreatePatientFile}
        />
      )}

      {activeSection === "booking" && (
        <CallCenterBookingSection
          selectedPatient={selectedPatient}
          bookingForm={bookingForm}
          setBookingForm={setBookingForm}
          therapists={therapists}
          onSelectTherapist={handleSelectTherapist}
          onSelectDate={handleSelectDate}
          onSelectSlot={handleSelectSlot}
          onConfirmBooking={handleConfirmBooking}
        />
      )}
    </DashboardLayout>
  );
}
import React from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import DashboardNotice from "../components/common/DashboardNotice";

import CallCenterSearchSection from "../components/callcenter/CallCenterSearchSection";
import CallCenterRegisterSection from "../components/callcenter/CallCenterRegisterSection";
import CallCenterBookingSection from "../components/callcenter/CallCenterBookingSection";
import TodayBookingsSection from "../components/callcenter/TodayBookingsSection";
import MonthlyBookingsSection from "../components/callcenter/MonthlyBookingsSection";

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
    weekDates,
    slots,
    todayBookingsCount,
    monthlyBookingsCount,
    todayBookings,
    monthlyBookings,
    monthlyAgents,
    monthlyFilter,
    setMonthlyFilter,
    handleSelectPatient,
    handleCreatePatientFile,
    handleSelectTherapist,
    handleSelectDate,
    handleSelectSlot,
    handleConfirmBooking,
    handleApplyMonthlyFilters,
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
        { key: "today", label: `Daily Booking (${todayBookingsCount || 0})` },
        { key: "monthly", label: `Monthly Tracker (${monthlyBookingsCount || 0})` },
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
          weekDates={weekDates}
          slots={slots}
          onSelectTherapist={handleSelectTherapist}
          onSelectDate={handleSelectDate}
          onSelectSlot={handleSelectSlot}
          onConfirmBooking={handleConfirmBooking}
        />
      )}

      {activeSection === "today" && (
        <TodayBookingsSection bookings={todayBookings} />
      )}

      {activeSection === "monthly" && (
        <MonthlyBookingsSection
          bookings={monthlyBookings}
          agents={monthlyAgents}
          therapists={therapists}
          monthlyFilter={monthlyFilter}
          setMonthlyFilter={setMonthlyFilter}
          onApplyFilters={handleApplyMonthlyFilters}
        />
      )}
    </DashboardLayout>
  );
}
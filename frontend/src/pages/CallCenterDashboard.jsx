import React from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import DashboardNotice from "../components/common/DashboardNotice";

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
    weekDates,
    slots,
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
        <div style={styles.infoCard}>
          <div style={styles.eyebrow}>Daily Booking</div>
          <div style={styles.bigNumber}>{todayBookingsCount || 0}</div>
          <div style={styles.helperText}>
            Total bookings created today by this agent.
          </div>
        </div>
      )}

      {activeSection === "monthly" && (
        <div style={styles.infoCard}>
          <div style={styles.eyebrow}>Monthly Tracker</div>
          <div style={styles.bigNumber}>{monthlyBookingsCount || 0}</div>
          <div style={styles.helperText}>
            Total bookings created this month by this agent.
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

const styles = {
  infoCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
    display: "grid",
    gap: "8px",
  },
  eyebrow: {
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#be185d",
  },
  bigNumber: {
    fontSize: "34px",
    fontWeight: "800",
    color: "#0f172a",
  },
  helperText: {
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "600",
  },
};
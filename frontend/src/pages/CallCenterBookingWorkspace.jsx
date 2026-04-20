import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import DashboardNotice from "../components/common/DashboardNotice";

import UnifiedPatientSearch from "../components/patients/UnifiedPatientSearch";
import PatientRegisterForm from "../components/patients/PatientRegisterForm";

import BookingSection from "../components/booking/BookingSection";
import BookingTrackerSection from "../components/booking/BookingTrackerSection";
import useBookingDashboard from "../components/booking/useBookingDashboard";

export default function CallCenterBookingWorkspace({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();
  const bookingRef = useRef(null);

  const {
    activeSection,
    setActiveSection,
    trackerMode,
    setTrackerMode,
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
    todayBookings,
    todayBookingsCount,
    monthlyBookings,
    monthlyAgents,
    monthlyTherapists,
    monthlyFilter,
    setMonthlyFilter,
    futureBookings,
    futureTherapistSummary,
    futureDaySummary,
    futureAgents,
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
    handleApplyTodayFilters,
    handleEditBooking,
    handleDeleteBooking,
  } = useBookingDashboard();

  useEffect(() => {
    setActiveSection("book");
  }, [setActiveSection]);

  const handleBackToAdmin = () => {
    onStopImpersonation?.();
    navigate("/admin");
  };

  const scrollToBookingSection = (delay = 200) => {
    setTimeout(() => {
      bookingRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, delay);
  };

  const handleSelectPatientForBook = async (patient) => {
    await handleSelectPatient(patient);
    setActiveSection("book");
    scrollToBookingSection(200);
  };

  const handleCreatePatientThenBook = async (e) => {
    await handleCreatePatientFile(e);
    setActiveSection("book");
    scrollToBookingSection(250);
  };

  const handleEditBookingAndOpenForm = (booking) => {
    handleEditBooking(booking);
    setActiveSection("book");
    scrollToBookingSection(200);
  };

  const trackerBookings =
    trackerMode === "future"
      ? futureBookings
      : trackerMode === "monthly"
      ? monthlyBookings
      : todayBookings;

  const trackerAgents =
    trackerMode === "future"
      ? futureAgents
      : trackerMode === "monthly"
      ? monthlyAgents
      : [];

  const trackerTherapists =
    trackerMode === "monthly"
      ? monthlyTherapists?.length
        ? monthlyTherapists
        : therapists
      : therapists;

  const trackerFilter =
    trackerMode === "future"
      ? futureFilter
      : trackerMode === "monthly"
      ? monthlyFilter
      : {
          date: "",
          therapist_id: "all",
          user_id: "all",
          patient: "",
        };

  const setTrackerFilter =
    trackerMode === "future"
      ? setFutureFilter
      : trackerMode === "monthly"
      ? setMonthlyFilter
      : () => {};

  const handleApplyTrackerFilters = async () => {
    if (trackerMode === "future") {
      await handleApplyFutureFilters();
      return;
    }

    if (trackerMode === "monthly") {
      await handleApplyMonthlyFilters();
      return;
    }

    await handleApplyTodayFilters?.();
  };

  return (
    <DashboardLayout
      title="Booking Workspace"
      subtitle={`Welcome, ${
        actingAs?.username || user?.username || "Call Center User"
      }`}
      accent="#be185d"
      sidebarTitle="Booking"
      sidebarItems={[
        { key: "home", label: "Home" },
        { key: "book", label: "Book" },
        { key: "open_file", label: "Open New File" },
        {
          key: "tracker",
          label: `Booking Tracker (${todayBookingsCount || 0})`,
        },
      ]}
      activeSection={activeSection}
      setActiveSection={(key) => {
        if (key === "home") {
          navigate("/callcenter");
          return;
        }
        setActiveSection(key);
      }}
      onLogout={onLogout}
      actingAs={actingAs}
      actingAsName={actingAs?.username}
      onBackToAdmin={handleBackToAdmin}
    >
      {message ? (
        <DashboardNotice type="success">{message}</DashboardNotice>
      ) : null}

      {error ? (
        <DashboardNotice type="error">{error}</DashboardNotice>
      ) : null}

      {activeSection === "book" && (
        <div style={styles.stack}>
          <UnifiedPatientSearch
            title="Book Appointment"
            placeholder="Search patient name or ID"
            actionLabel="Book Appointment"
            onSelectPatient={handleSelectPatientForBook}
            emptyText="Start typing to search patients."
            noResultsText="No patients found. Open a new file if needed."
            onRegisterNew={() => setActiveSection("open_file")}
            registerButtonLabel="Open New File"
          />

          <div ref={bookingRef}>
            {selectedPatient ? (
              <BookingSection
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
            ) : (
              <div style={styles.helperCard}>
                Search for a patient above, then continue to the booking
                section. If the patient is not found, use{" "}
                <strong>Open New File</strong>.
              </div>
            )}
          </div>
        </div>
      )}

      {activeSection === "open_file" && (
        <PatientRegisterForm
          patientForm={patientForm}
          setPatientForm={setPatientForm}
          onSubmit={handleCreatePatientThenBook}
        />
      )}

      {activeSection === "tracker" && (
        <BookingTrackerSection
          mode={trackerMode}
          onChangeMode={setTrackerMode}
          bookings={trackerBookings}
          therapistSummary={futureTherapistSummary}
          daySummary={futureDaySummary}
          therapists={trackerTherapists}
          agents={trackerAgents}
          filter={trackerFilter}
          setFilter={setTrackerFilter}
          onApplyFilters={handleApplyTrackerFilters}
          onEditBooking={handleEditBookingAndOpenForm}
          onDeleteBooking={handleDeleteBooking}
          isAdmin={Boolean(user?.is_superuser || user?.role === "admin")}
        />
      )}
    </DashboardLayout>
  );
}

const styles = {
  stack: {
    display: "grid",
    gap: "16px",
  },
  helperCard: {
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: "12px",
    padding: "14px",
  },
};
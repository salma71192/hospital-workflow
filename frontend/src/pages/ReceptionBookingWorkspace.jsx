import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import DashboardNotice from "../components/common/DashboardNotice";

import UnifiedPatientSearch from "../components/patients/UnifiedPatientSearch";
import PatientRegisterForm from "../components/patients/PatientRegisterForm";

import BookingSection from "../components/booking/BookingSection";
import TodayBookingsSection from "../components/booking/TodayBookingsSection";
import MonthlyBookingsSection from "../components/booking/MonthlyBookingsSection";
import FutureBookingsSection from "../components/booking/FutureBookingsSection";
import useBookingDashboard from "../components/booking/useBookingDashboard";

export default function ReceptionBookingWorkspace({
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

  const handleSelectPatientForBook = async (patient) => {
    await handleSelectPatient(patient);
    setActiveSection("book");

    setTimeout(() => {
      bookingRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 200);
  };

  const handleCreatePatientThenBook = async (e) => {
    await handleCreatePatientFile(e);
    setActiveSection("book");

    setTimeout(() => {
      bookingRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 250);
  };

  return (
    <DashboardLayout
      title="Booking Workspace"
      subtitle={`Welcome, ${
        actingAs?.username || user?.username || "Reception User"
      }`}
      accent="#be185d"
      sidebarTitle="Booking"
      sidebarItems={[
        { key: "home", label: "Home" },
        { key: "book", label: "Book" },
        { key: "open_file", label: "Open New File" },
        { key: "tracker", label: `Booking Tracker (${todayBookingsCount || 0})` },
      ]}
      activeSection={activeSection}
      setActiveSection={(key) => {
        if (key === "home") {
          navigate("/reception");
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
                Search for a patient above, then continue to the booking section.
                If the patient is not found, use <strong>Open New File</strong>.
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
        <div style={styles.stack}>
          <TodayBookingsSection
            bookings={todayBookings}
            onEditBooking={(booking) => {
              handleEditBooking(booking);
              setActiveSection("book");

              setTimeout(() => {
                bookingRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }, 200);
            }}
            onDeleteBooking={handleDeleteBooking}
            defaultOpen={true}
          />

          <FutureBookingsSection
            futureBookings={futureBookings}
            therapistSummary={futureTherapistSummary}
            daySummary={futureDaySummary}
            therapists={therapists}
            agents={futureAgents}
            futureFilter={futureFilter}
            setFutureFilter={setFutureFilter}
            onApplyFilters={handleApplyFutureFilters}
            onEditBooking={(booking) => {
              handleEditBooking(booking);
              setActiveSection("book");

              setTimeout(() => {
                bookingRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }, 200);
            }}
            onDeleteBooking={handleDeleteBooking}
            defaultOpen={true}
          />

          <MonthlyBookingsSection
            bookings={monthlyBookings}
            agents={monthlyAgents}
            therapists={
              monthlyTherapists?.length ? monthlyTherapists : therapists
            }
            monthlyFilter={monthlyFilter}
            setMonthlyFilter={setMonthlyFilter}
            onApplyFilters={handleApplyMonthlyFilters}
            defaultOpen={false}
          />
        </div>
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
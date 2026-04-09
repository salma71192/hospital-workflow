import React from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import DashboardNotice from "../components/common/DashboardNotice";

import UnifiedPatientSearch from "../components/patients/UnifiedPatientSearch";

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

  const {
    activeSection,
    setActiveSection,
    message,
    error,
    selectedPatient,
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
    handleSelectTherapist,
    handleSelectDate,
    handleSelectSlot,
    handleConfirmBooking,
    handleApplyMonthlyFilters,
    handleApplyFutureFilters,
    handleEditBooking,
    handleDeleteBooking,
  } = useBookingDashboard();

  const handleBackToAdmin = () => {
    onStopImpersonation?.();
    navigate("/admin");
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
        { key: "search", label: "Search Patient" },
        { key: "booking", label: "Book Appointment" },
        { key: "today", label: `Today's Bookings (${todayBookingsCount || 0})` },
        {
          key: "monthly",
          label: `Monthly Bookings (${monthlyBookingsCount || 0})`,
        },
        { key: "future", label: "Future Bookings" },
      ]}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
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

      {activeSection === "search" && (
        <UnifiedPatientSearch
          title="Search Patient for Booking"
          placeholder="Start typing patient name or ID"
          actionLabel="Book Appointment"
          onSelectPatient={(patient) => {
            handleSelectPatient(patient);
            setActiveSection("booking");
          }}
          emptyText="Start typing to search patients."
          noResultsText="No patients found."
        />
      )}

      {activeSection === "booking" && (
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
      )}

      {activeSection === "today" && (
        <TodayBookingsSection
          bookings={todayBookings}
          onEditBooking={(booking) => {
            handleEditBooking(booking);
            setActiveSection("booking");
          }}
          onDeleteBooking={handleDeleteBooking}
        />
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

      {activeSection === "future" && (
        <FutureBookingsSection
          futureBookings={futureBookings}
          therapistSummary={futureTherapistSummary}
          daySummary={futureDaySummary}
          therapists={therapists}
          futureFilter={futureFilter}
          setFutureFilter={setFutureFilter}
          onApplyFilters={handleApplyFutureFilters}
          onEditBooking={(booking) => {
            handleEditBooking(booking);
            setActiveSection("booking");
          }}
          onDeleteBooking={handleDeleteBooking}
        />
      )}
    </DashboardLayout>
  );
}
import React, { useEffect, useMemo, useRef, useState } from "react";
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
  isPhysio = false,
}) {
  const navigate = useNavigate();
  const bookingRef = useRef(null);

  const [todayTarget, setTodayTarget] = useState(10);
  const [futureTarget, setFutureTarget] = useState(30);
  const [monthlyTarget, setMonthlyTarget] = useState(50);

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

  useEffect(() => {
    if (!isPhysio || !user?.id) return;

    const physioId = String(user.id);

    setBookingForm((prev) => ({
      ...prev,
      therapist_id: physioId,
    }));

    setMonthlyFilter((prev) => ({
      ...prev,
      therapist_id: physioId,
      user_id: "all",
    }));

    setFutureFilter((prev) => ({
      ...prev,
      therapist_id: physioId,
      user_id: "all",
    }));
  }, [
    isPhysio,
    user,
    setBookingForm,
    setMonthlyFilter,
    setFutureFilter,
  ]);

  const handleBackToAdmin = () => {
    onStopImpersonation?.();
    navigate("/admin");
  };

  const getHomeRoute = () => {
    if (isPhysio) return "/physio";
    if (user?.role === "callcenter" || actingAs?.role === "callcenter") {
      return "/callcenter";
    }
    return "/reception";
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

    if (isPhysio && user?.id) {
      setBookingForm((prev) => ({
        ...prev,
        therapist_id: String(user.id),
      }));
    }

    setActiveSection("book");
    scrollToBookingSection(200);
  };

  const handleCreatePatientThenBook = async (e) => {
    await handleCreatePatientFile(e);

    if (isPhysio && user?.id) {
      setBookingForm((prev) => ({
        ...prev,
        therapist_id: String(user.id),
      }));
    }

    setActiveSection("book");
    scrollToBookingSection(250);
  };

  const handleEditBookingAndOpenForm = (booking) => {
    handleEditBooking(booking);

    if (isPhysio && user?.id) {
      setBookingForm((prev) => ({
        ...prev,
        therapist_id: String(user.id),
      }));
    }

    setActiveSection("book");
    scrollToBookingSection(200);
  };

  const visibleTherapists = useMemo(() => {
    if (!isPhysio) return therapists;
    return therapists.filter((t) => String(t.id) === String(user?.id));
  }, [isPhysio, therapists, user]);

  const visibleMonthlyTherapists = useMemo(() => {
    const source = monthlyTherapists?.length ? monthlyTherapists : therapists;
    if (!isPhysio) return source;
    return source.filter((t) => String(t.id) === String(user?.id));
  }, [isPhysio, monthlyTherapists, therapists, user]);

  const visibleTodayBookings = useMemo(() => {
    if (!isPhysio) return todayBookings;
    return todayBookings.filter(
      (b) => String(b.therapist_id) === String(user?.id)
    );
  }, [isPhysio, todayBookings, user]);

  const visibleFutureBookings = useMemo(() => {
    if (!isPhysio) return futureBookings;
    return futureBookings.filter(
      (b) => String(b.therapist_id) === String(user?.id)
    );
  }, [isPhysio, futureBookings, user]);

  const visibleMonthlyBookings = useMemo(() => {
    if (!isPhysio) return monthlyBookings;
    return monthlyBookings.filter(
      (b) => String(b.therapist_id) === String(user?.id)
    );
  }, [isPhysio, monthlyBookings, user]);

  const visibleFutureSummary = useMemo(() => {
    if (!isPhysio) return futureTherapistSummary;
    return futureTherapistSummary.filter(
      (row) => String(row.therapist_id) === String(user?.id)
    );
  }, [isPhysio, futureTherapistSummary, user]);

  const showOpenFile = !isPhysio;

  return (
    <DashboardLayout
      title="Booking Workspace"
      subtitle={`Welcome, ${
        actingAs?.username || user?.username || "User"
      }`}
      accent="#be185d"
      sidebarTitle="Booking"
      sidebarItems={[
        { key: "home", label: "Home" },
        { key: "book", label: "Book" },
        ...(showOpenFile ? [{ key: "open_file", label: "Open New File" }] : []),
        {
          key: "tracker",
          label: `Booking Tracker (${
            isPhysio ? visibleTodayBookings.length : todayBookingsCount || 0
          })`,
        },
      ]}
      activeSection={activeSection}
      setActiveSection={(key) => {
        if (key === "home") {
          navigate(getHomeRoute());
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
            noResultsText={
              showOpenFile
                ? "No patients found. Open a new file if needed."
                : "No patients found."
            }
            onRegisterNew={
              showOpenFile ? () => setActiveSection("open_file") : undefined
            }
            registerButtonLabel="Open New File"
          />

          <div ref={bookingRef}>
            {selectedPatient ? (
              <BookingSection
                selectedPatient={selectedPatient}
                bookingForm={bookingForm}
                setBookingForm={setBookingForm}
                therapists={visibleTherapists}
                weekDates={weekDates}
                slots={slots}
                onSelectTherapist={handleSelectTherapist}
                onSelectDate={handleSelectDate}
                onSelectSlot={handleSelectSlot}
                onConfirmBooking={handleConfirmBooking}
                isPhysio={isPhysio}
              />
            ) : (
              <div style={styles.helperCard}>
                Search for a patient above, then continue to the booking
                section.
                {showOpenFile ? (
                  <>
                    {" "}
                    If the patient is not found, use{" "}
                    <strong>Open New File</strong>.
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}

      {showOpenFile && activeSection === "open_file" && (
        <PatientRegisterForm
          patientForm={patientForm}
          setPatientForm={setPatientForm}
          onSubmit={handleCreatePatientThenBook}
        />
      )}

      {activeSection === "tracker" && (
        <div style={styles.stack}>
          <TodayBookingsSection
            bookings={visibleTodayBookings}
            onEditBooking={handleEditBookingAndOpenForm}
            onDeleteBooking={handleDeleteBooking}
            defaultOpen={true}
            target={todayTarget}
            onChangeTarget={setTodayTarget}
          />

          <FutureBookingsSection
            futureBookings={visibleFutureBookings}
            therapistSummary={visibleFutureSummary}
            daySummary={futureDaySummary}
            therapists={visibleTherapists}
            agents={futureAgents}
            futureFilter={futureFilter}
            setFutureFilter={setFutureFilter}
            onApplyFilters={handleApplyFutureFilters}
            onEditBooking={handleEditBookingAndOpenForm}
            onDeleteBooking={handleDeleteBooking}
            defaultOpen={true}
            target={futureTarget}
            onChangeTarget={setFutureTarget}
          />

          <MonthlyBookingsSection
            bookings={visibleMonthlyBookings}
            agents={monthlyAgents}
            therapists={visibleMonthlyTherapists}
            monthlyFilter={monthlyFilter}
            setMonthlyFilter={setMonthlyFilter}
            onApplyFilters={handleApplyMonthlyFilters}
            defaultOpen={false}
            target={monthlyTarget}
            onChangeTarget={setMonthlyTarget}
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
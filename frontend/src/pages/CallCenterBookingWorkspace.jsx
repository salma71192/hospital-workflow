import React, { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import DashboardNotice from "../components/common/DashboardNotice";

import UnifiedPatientSearch from "../components/patients/UnifiedPatientSearch";
import PatientRegisterForm from "../components/patients/PatientRegisterForm";

import BookingSection from "../components/booking/BookingSection";
import BookingTrackerSection from "../components/booking/BookingTrackerSection";
import useBookingDashboard from "../components/booking/useBookingDashboard";

import WaitingListSection from "../components/callcenter/WaitingListSection";
import useWaitingList from "../components/callcenter/useWaitingList";

export default function CallCenterBookingWorkspace({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();
  const bookingRef = useRef(null);
  const trackerInitRef = useRef(false);

  const {
    waitingList,
    waitingListCount,
    deleteWaitingListEntry,
  } = useWaitingList();

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
    todayAgents,
    todayTherapists,
    todayFilter,
    setTodayFilter,
    handleApplyTodayFilters,

    monthlyBookings,
    monthlyAgents,
    monthlyTherapists,
    monthlyFilter,
    setMonthlyFilter,
    handleApplyMonthlyFilters,

    futureBookings,
    futureTherapistSummary,
    futureDaySummary,
    futureAgents,
    futureTherapists,
    futureFilter,
    setFutureFilter,
    handleApplyFutureFilters,

    handleSelectPatient,
    handleCreatePatientFile,
    handleSelectTherapist,
    handleSelectDate,
    handleSelectSlot,
    handleConfirmBooking,
    handleEditBooking,
    handleDeleteBooking,
  } = useBookingDashboard();

  useEffect(() => {
    setActiveSection("book");
  }, [setActiveSection]);

  useEffect(() => {
    if (activeSection !== "tracker") return;
    if (trackerInitRef.current) return;

    trackerInitRef.current = true;
    handleApplyTodayFilters?.();
  }, [activeSection, handleApplyTodayFilters]);

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

  const trackerBookings = useMemo(() => {
    if (trackerMode === "future") return futureBookings;
    if (trackerMode === "monthly") return monthlyBookings;
    return todayBookings;
  }, [trackerMode, futureBookings, monthlyBookings, todayBookings]);

  const trackerAgents = useMemo(() => {
    if (trackerMode === "future") return futureAgents;
    if (trackerMode === "monthly") return monthlyAgents;
    return todayAgents;
  }, [trackerMode, futureAgents, monthlyAgents, todayAgents]);

  const trackerTherapists = useMemo(() => {
    if (trackerMode === "future") {
      return futureTherapists?.length ? futureTherapists : therapists;
    }

    if (trackerMode === "monthly") {
      return monthlyTherapists?.length ? monthlyTherapists : therapists;
    }

    return todayTherapists?.length ? todayTherapists : therapists;
  }, [
    trackerMode,
    futureTherapists,
    monthlyTherapists,
    todayTherapists,
    therapists,
  ]);

  const trackerFilter = useMemo(() => {
    if (trackerMode === "future") return futureFilter;
    if (trackerMode === "monthly") return monthlyFilter;
    return todayFilter;
  }, [trackerMode, futureFilter, monthlyFilter, todayFilter]);

  const setTrackerFilter = useMemo(() => {
    if (trackerMode === "future") return setFutureFilter;
    if (trackerMode === "monthly") return setMonthlyFilter;
    return setTodayFilter;
  }, [trackerMode, setFutureFilter, setMonthlyFilter, setTodayFilter]);

  const handleApplyTrackerFilters = async () => {
    if (trackerMode === "future") {
      await handleApplyFutureFilters?.();
      return;
    }

    if (trackerMode === "monthly") {
      await handleApplyMonthlyFilters?.();
      return;
    }

    await handleApplyTodayFilters?.();
  };

  const handleTrackerModeChange = (nextMode) => {
    setTrackerMode(nextMode);

    if (nextMode === "today") {
      handleApplyTodayFilters?.();
      return;
    }

    if (nextMode === "monthly") {
      handleApplyMonthlyFilters?.();
      return;
    }

    if (nextMode === "future") {
      handleApplyFutureFilters?.();
    }
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
          label: `Tracker (${trackerBookings.length || 0})`,
        },
        {
          key: "waiting_list",
          label: `Waiting List (${waitingListCount || 0})`,
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
                Search for a patient above, then continue to booking. If not
                found, use <strong>Open New File</strong>.
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
          onChangeMode={handleTrackerModeChange}
          bookings={trackerBookings}
          therapistSummary={trackerMode === "future" ? futureTherapistSummary : []}
          daySummary={trackerMode === "future" ? futureDaySummary : []}
          therapists={trackerTherapists}
          agents={trackerAgents}
          filter={trackerFilter}
          setFilter={setTrackerFilter}
          onApplyFilters={handleApplyTrackerFilters}
          onEditBooking={handleEditBookingAndOpenForm}
          onDeleteBooking={handleDeleteBooking}
          isAdmin={Boolean(user?.is_superuser || user?.role === "admin")}
          isPhysio={false}
          currentUserId={user?.id}
        />
      )}

      {activeSection === "waiting_list" && (
        <WaitingListSection
          waitingList={waitingList}
          onDeleteEntry={deleteWaitingListEntry}
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
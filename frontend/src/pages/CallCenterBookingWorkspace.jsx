import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import DashboardNotice from "../components/common/DashboardNotice";
import WaitingListModal from "../components/common/WaitingListModal";

import UnifiedPatientSearch from "../components/patients/UnifiedPatientSearch";
import PatientRegisterForm from "../components/patients/PatientRegisterForm";

import BookingSection from "../components/booking/BookingSection";
import BookingTrackerSection from "../components/booking/BookingTrackerSection";
import MyStatsSection from "../components/booking/MyStatsSection";
import useMyStats from "../components/booking/useMyStats";
import useBookingDashboard from "../components/booking/useBookingDashboard";

import WaitingListSection from "../components/callcenter/WaitingListSection";
import useWaitingList from "../components/callcenter/useWaitingList";

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function getTomorrowString() {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  return next.toISOString().split("T")[0];
}

function getTwoWeeksForwardString() {
  const next = new Date();
  next.setDate(next.getDate() + 14);
  return next.toISOString().split("T")[0];
}

function getCurrentMonthString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function CallCenterBookingWorkspace({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();
  const bookingRef = useRef(null);

  const [waitingModalOpen, setWaitingModalOpen] = useState(false);
  const [waitingModalData, setWaitingModalData] = useState(null);
  const [slotFreedAlerts, setSlotFreedAlerts] = useState([]);

  const stats = useMyStats();

  const {
    waitingList,
    waitingListCount,
    addToWaitingList,
    deleteWaitingListEntry,
  } = useWaitingList();

  const handleBookingFailed = ({
    message: failedMessage,
    bookingForm,
    selectedPatient,
  }) => {
    if (!selectedPatient?.id && !bookingForm?.patient_id) return;

    setWaitingModalData({
      failedMessage,
      patient: selectedPatient,
      bookingForm,
    });

    setWaitingModalOpen(true);
  };

  const handleSlotFreed = (alerts = []) => {
    setSlotFreedAlerts(alerts || []);
  };

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
  } = useBookingDashboard({
    onBookingFailed: handleBookingFailed,
    onSlotFreed: handleSlotFreed,
  });

  useEffect(() => {
    setActiveSection("tracker");
  }, [setActiveSection]);

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

  const handleApplyTrackerFilters = useCallback(async () => {
    if (trackerMode === "future") {
      await handleApplyFutureFilters?.();
      return;
    }

    if (trackerMode === "monthly") {
      await handleApplyMonthlyFilters?.();
      return;
    }

    await handleApplyTodayFilters?.();
  }, [
    trackerMode,
    handleApplyFutureFilters,
    handleApplyMonthlyFilters,
    handleApplyTodayFilters,
  ]);

  useEffect(() => {
    if (activeSection !== "schedule") return;
    handleApplyTrackerFilters();
  }, [activeSection, trackerMode, trackerFilter, handleApplyTrackerFilters]);

  const handleTrackerModeChange = (nextMode) => {
    if (nextMode === "today") {
      setTodayFilter((prev) => ({
        ...prev,
        date: prev.date || getTodayString(),
      }));
    }

    if (nextMode === "future") {
      setFutureFilter((prev) => ({
        ...prev,
        from_date: prev.from_date || getTomorrowString(),
        to_date: prev.to_date || getTwoWeeksForwardString(),
      }));
    }

    if (nextMode === "monthly") {
      setMonthlyFilter((prev) => ({
        ...prev,
        month: prev.month || getCurrentMonthString(),
        user_id: prev.user_id || "all",
        patient: prev.patient || "",
        therapist_id: prev.therapist_id || "all",
      }));
    }

    setTrackerMode(nextMode);
  };

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

  const handleEditBookingAndOpenForm = async (booking) => {
    await handleEditBooking(booking);
    setActiveSection("book");
    scrollToBookingSection(200);
  };

  const handleWaitingListBookEntry = async (entry) => {
    await handleSelectPatient({
      id: entry.patient_db_id,
      name: entry.patient_name,
      patient_id: entry.patient_id,
    });

    setBookingForm((prev) => ({
      ...prev,
      patient_id: entry.patient_db_id,
      therapist_id: entry.preferred_therapist_id || prev.therapist_id || "",
      appointment_date:
        entry.preferred_date || prev.appointment_date || getTodayString(),
      appointment_time: "",
      notes: entry.notes || "",
      booking_id: null,
    }));

    setActiveSection("book");
    scrollToBookingSection(200);
  };

  const handleAddWaitingListFromModal = async ({
    preferred_time_period,
    notes,
  }) => {
    const patient = waitingModalData?.patient;
    const form = waitingModalData?.bookingForm;

    if (!patient?.id && !form?.patient_id) return;

    await addToWaitingList({
      patient_id: patient?.id || form.patient_id,
      preferred_therapist_id: form.therapist_id || null,
      preferred_date: form.appointment_date || null,
      preferred_time_period: preferred_time_period || "",
      notes: notes || form.notes || "",
    });

    setWaitingModalOpen(false);
    setWaitingModalData(null);
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
        { key: "tracker", label: "My Stats" },
        { key: "book", label: "Book" },
        { key: "open_file", label: "Open New File" },
        {
          key: "schedule",
          label: `Schedule (${trackerBookings.length || 0})`,
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
      {message ? <DashboardNotice type="success">{message}</DashboardNotice> : null}
      {error ? <DashboardNotice type="error">{error}</DashboardNotice> : null}

      {slotFreedAlerts.length > 0 ? (
        <DashboardNotice type="success">
          Slot freed. {slotFreedAlerts.length} waiting-list patient(s) matched.
        </DashboardNotice>
      ) : null}

      {activeSection === "tracker" && <MyStatsSection stats={stats} />}

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

      {activeSection === "schedule" && (
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
          therapists={therapists}
          onAddToWaitingList={addToWaitingList}
          onDeleteEntry={deleteWaitingListEntry}
          onBookEntry={handleWaitingListBookEntry}
        />
      )}

      <WaitingListModal
        isOpen={waitingModalOpen}
        failedMessage={waitingModalData?.failedMessage}
        patient={waitingModalData?.patient}
        bookingForm={waitingModalData?.bookingForm}
        onClose={() => {
          setWaitingModalOpen(false);
          setWaitingModalData(null);
        }}
        onSubmit={handleAddWaitingListFromModal}
      />
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
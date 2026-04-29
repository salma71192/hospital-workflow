import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
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

export default function ReceptionBookingWorkspace({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
  isPhysio = false,
}) {
  const navigate = useNavigate();
  const bookingRef = useRef(null);

  const [trackerMode, setTrackerMode] = useState("today");
  const [waitingModalOpen, setWaitingModalOpen] = useState(false);
  const [waitingModalData, setWaitingModalData] = useState(null);

  const stats = useMyStats();

  const {
    waitingList,
    waitingListCount,
    addToWaitingList,
    deleteWaitingListEntry,
  } = useWaitingList();

  const handleBookingFailed = ({ message, bookingForm, selectedPatient }) => {
    if (!selectedPatient?.id && !bookingForm?.patient_id) return;

    setWaitingModalData({
      failedMessage: message,
      bookingForm,
      patient: selectedPatient,
    });

    setWaitingModalOpen(true);
  };

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
    todayAgents,
    todayTherapists,
    loadTodayBookings,

    monthlyBookings,
    monthlyAgents,
    monthlyTherapists,
    loadMonthlyBookings,

    futureBookings,
    futureTherapistSummary,
    futureDaySummary,
    futureAgents,
    futureTherapists,
    loadFutureBookings,

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
  });

  const [trackerFilter, setTrackerFilter] = useState({
    date: getTodayString(),
    from_date: getTomorrowString(),
    to_date: getTwoWeeksForwardString(),
    month: getCurrentMonthString(),
    therapist_id: "all",
    user_id: "all",
    patient: "",
  });

  const showOpenFile = !isPhysio;

  useEffect(() => {
    setActiveSection("stats");
  }, [setActiveSection]);

  useEffect(() => {
    if (!isPhysio || !user?.id) return;

    const physioId = String(user.id);

    setBookingForm((prev) => ({
      ...prev,
      therapist_id: physioId,
    }));

    setTrackerFilter((prev) => ({
      ...prev,
      therapist_id: physioId,
      user_id: "all",
    }));
  }, [isPhysio, user, setBookingForm]);

  const visibleTherapists = useMemo(() => {
    if (!isPhysio) return therapists;
    return therapists.filter((t) => String(t.id) === String(user?.id));
  }, [isPhysio, therapists, user]);

  const visibleTodayTherapists = useMemo(() => {
    const source = todayTherapists?.length ? todayTherapists : therapists;
    if (!isPhysio) return source;
    return source.filter((t) => String(t.id) === String(user?.id));
  }, [isPhysio, todayTherapists, therapists, user]);

  const visibleMonthlyTherapists = useMemo(() => {
    const source = monthlyTherapists?.length ? monthlyTherapists : therapists;
    if (!isPhysio) return source;
    return source.filter((t) => String(t.id) === String(user?.id));
  }, [isPhysio, monthlyTherapists, therapists, user]);

  const visibleFutureTherapists = useMemo(() => {
    const source = futureTherapists?.length ? futureTherapists : therapists;
    if (!isPhysio) return source;
    return source.filter((t) => String(t.id) === String(user?.id));
  }, [isPhysio, futureTherapists, therapists, user]);

  const visibleTodayBookings = useMemo(() => {
    if (!isPhysio) return todayBookings;
    return todayBookings.filter(
      (booking) => String(booking.therapist_id) === String(user?.id)
    );
  }, [isPhysio, todayBookings, user]);

  const visibleMonthlyBookings = useMemo(() => {
    if (!isPhysio) return monthlyBookings;
    return monthlyBookings.filter(
      (booking) => String(booking.therapist_id) === String(user?.id)
    );
  }, [isPhysio, monthlyBookings, user]);

  const visibleFutureBookings = useMemo(() => {
    if (!isPhysio) return futureBookings;
    return futureBookings.filter(
      (booking) => String(booking.therapist_id) === String(user?.id)
    );
  }, [isPhysio, futureBookings, user]);

  const trackerBookings = useMemo(() => {
    if (trackerMode === "future") return visibleFutureBookings;
    if (trackerMode === "monthly") return visibleMonthlyBookings;
    return visibleTodayBookings;
  }, [
    trackerMode,
    visibleFutureBookings,
    visibleMonthlyBookings,
    visibleTodayBookings,
  ]);

  const trackerAgents = useMemo(() => {
    if (trackerMode === "future") return futureAgents;
    if (trackerMode === "monthly") return monthlyAgents;
    return todayAgents;
  }, [trackerMode, futureAgents, monthlyAgents, todayAgents]);

  const trackerTherapists = useMemo(() => {
    if (trackerMode === "future") return visibleFutureTherapists;
    if (trackerMode === "monthly") return visibleMonthlyTherapists;
    return visibleTodayTherapists;
  }, [
    trackerMode,
    visibleFutureTherapists,
    visibleMonthlyTherapists,
    visibleTodayTherapists,
  ]);

  const handleApplyTrackerFilters = useCallback(async () => {
    if (trackerMode === "future") {
      await loadFutureBookings(
        trackerFilter.from_date,
        trackerFilter.to_date,
        trackerFilter.therapist_id,
        trackerFilter.user_id,
        trackerFilter.patient
      );
      return;
    }

    if (trackerMode === "monthly") {
      await loadMonthlyBookings(
        trackerFilter.month,
        trackerFilter.user_id,
        trackerFilter.patient,
        trackerFilter.therapist_id
      );
      return;
    }

    await loadTodayBookings(
      trackerFilter.date,
      trackerFilter.therapist_id,
      trackerFilter.user_id,
      trackerFilter.patient
    );
  }, [
    trackerMode,
    trackerFilter,
    loadFutureBookings,
    loadMonthlyBookings,
    loadTodayBookings,
  ]);

  useEffect(() => {
    if (activeSection === "schedule") {
      handleApplyTrackerFilters();
    }
  }, [activeSection, handleApplyTrackerFilters]);

  const handleTrackerModeChange = (nextMode) => {
    setTrackerMode(nextMode);

    setTrackerFilter((prev) => {
      if (nextMode === "today") {
        return {
          ...prev,
          date: prev.date || getTodayString(),
        };
      }

      if (nextMode === "future") {
        return {
          ...prev,
          from_date: prev.from_date || getTomorrowString(),
          to_date: prev.to_date || getTwoWeeksForwardString(),
        };
      }

      return {
        ...prev,
        month: prev.month || getCurrentMonthString(),
      };
    });
  };

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

  return (
    <DashboardLayout
      title="Booking Workspace"
      subtitle={`Welcome, ${actingAs?.username || user?.username || "User"}`}
      accent="#be185d"
      sidebarTitle="Booking"
      sidebarItems={[
        { key: "home", label: "Home" },
        { key: "stats", label: "My Stats" },
        { key: "book", label: "Book" },
        ...(showOpenFile ? [{ key: "open_file", label: "Open New File" }] : []),
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

      {activeSection === "stats" && <MyStatsSection stats={stats} />}

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

      {activeSection === "schedule" && (
        <BookingTrackerSection
          mode={trackerMode}
          onChangeMode={handleTrackerModeChange}
          bookings={trackerBookings}
          therapistSummary={
            trackerMode === "future" ? futureTherapistSummary : []
          }
          daySummary={trackerMode === "future" ? futureDaySummary : []}
          therapists={trackerTherapists}
          agents={trackerAgents}
          filter={trackerFilter}
          setFilter={setTrackerFilter}
          onApplyFilters={handleApplyTrackerFilters}
          onEditBooking={handleEditBookingAndOpenForm}
          onDeleteBooking={handleDeleteBooking}
          isAdmin={user?.is_superuser || user?.role === "admin"}
          isPhysio={isPhysio}
          currentUserId={user?.id}
        />
      )}

      {activeSection === "waiting_list" && (
        <WaitingListSection
          waitingList={waitingList}
          therapists={visibleTherapists}
          onAddToWaitingList={addToWaitingList}
          onDeleteEntry={deleteWaitingListEntry}
          onBookEntry={handleWaitingListBookEntry}
          onRegisterNew={
            showOpenFile ? () => setActiveSection("open_file") : undefined
          }
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
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: "12px",
    padding: "14px",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
  },
};
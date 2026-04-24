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

import UnifiedPatientSearch from "../components/patients/UnifiedPatientSearch";
import PatientRegisterForm from "../components/patients/PatientRegisterForm";

import BookingSection from "../components/booking/BookingSection";
import BookingTrackerSection from "../components/booking/BookingTrackerSection";
import useBookingDashboard from "../components/booking/useBookingDashboard";

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

function getFirstDayOfMonthString() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
}

function getLastDayOfMonthString() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
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
  const firstTrackerLoadRef = useRef(true);

  const [trackerMode, setTrackerMode] = useState("today");

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
    loadFutureBookings,

    handleSelectPatient,
    handleCreatePatientFile,
    handleSelectTherapist,
    handleSelectDate,
    handleSelectSlot,
    handleConfirmBooking,
    handleEditBooking,
    handleDeleteBooking,
  } = useBookingDashboard();

  const [trackerFilter, setTrackerFilter] = useState({
    date: getTodayString(),
    from_date: getTomorrowString(),
    to_date: getTwoWeeksForwardString(),
    user_id: "all",
    therapist_id: "all",
    patient: "",
  });

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

    setTrackerFilter((prev) => ({
      ...prev,
      therapist_id: physioId,
      user_id: "all",
    }));
  }, [isPhysio, user, setBookingForm]);

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
    if (!isPhysio) return therapists;
    return therapists.filter((t) => String(t.id) === String(user?.id));
  }, [isPhysio, therapists, user]);

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

  const visibleFutureDaySummary = useMemo(() => {
    return futureDaySummary || [];
  }, [futureDaySummary]);

  const showOpenFile = !isPhysio;

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
        trackerFilter.from_date,
        trackerFilter.to_date,
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
    if (activeSection !== "tracker") return;

    if (firstTrackerLoadRef.current) {
      firstTrackerLoadRef.current = false;
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
          from_date: getTomorrowString(),
          to_date: getTwoWeeksForwardString(),
        };
      }

      return {
        ...prev,
        from_date: getFirstDayOfMonthString(),
        to_date: getLastDayOfMonthString(),
      };
    });
  };

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
          label: `Tracker (${trackerBookings.length})`,
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
          <BookingTrackerSection
            mode={trackerMode}
            onChangeMode={handleTrackerModeChange}
            bookings={trackerBookings}
            therapistSummary={visibleFutureSummary}
            daySummary={visibleFutureDaySummary}
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
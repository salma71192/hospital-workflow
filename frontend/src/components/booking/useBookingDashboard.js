import { useState } from "react";
import useBookingCore from "./useBookingCore";
import useMonthlyBookings from "./useMonthlyBookings";
import useFutureBookings from "./useFutureBookings";

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

export default function useBookingDashboard({
  onBookingFailed,
  onSlotFreed,
} = {}) {
  const [activeSection, setActiveSection] = useState("book");
  const [trackerMode, setTrackerMode] = useState("today");

  const monthly = useMonthlyBookings();
  const future = useFutureBookings();

  const core = useBookingCore({
    onReloadMonthlyBookings: monthly.loadMonthlyBookings,
    onReloadFutureBookings: future.loadFutureBookings,
    onBookingFailed,
    onSlotFreed,
  });

  const [todayFilter, setTodayFilter] = useState({
    date: getTodayString(),
    therapist_id: "all",
    user_id: "all",
    patient: "",
  });

  const handleApplyTodayFilters = async () => {
    await core.loadTodayBookings(
      todayFilter.date,
      todayFilter.therapist_id,
      todayFilter.user_id,
      todayFilter.patient
    );
  };

  const handleApplyMonthlyFilters = async () => {
    await monthly.loadMonthlyBookings(
      monthly.monthlyFilter.from_date,
      monthly.monthlyFilter.to_date,
      monthly.monthlyFilter.user_id,
      monthly.monthlyFilter.patient,
      monthly.monthlyFilter.therapist_id
    );
  };

  const handleApplyFutureFilters = async () => {
    await future.loadFutureBookings(
      future.futureFilter.from_date,
      future.futureFilter.to_date,
      future.futureFilter.therapist_id,
      future.futureFilter.user_id,
      future.futureFilter.patient
    );
  };

  const handleApplyTrackerFilters = async () => {
    if (trackerMode === "future") {
      await handleApplyFutureFilters();
      return;
    }

    if (trackerMode === "monthly") {
      await handleApplyMonthlyFilters();
      return;
    }

    await handleApplyTodayFilters();
  };

  const handleChangeTrackerMode = async (nextMode) => {
    setTrackerMode(nextMode);

    if (nextMode === "future") {
      await handleApplyFutureFilters();
      return;
    }

    if (nextMode === "monthly") {
      await handleApplyMonthlyFilters();
      return;
    }

    await handleApplyTodayFilters();
  };

  return {
    activeSection,
    setActiveSection,

    trackerMode,
    setTrackerMode: handleChangeTrackerMode,
    handleApplyTrackerFilters,

    message: core.message,
    setMessage: core.setMessage,
    error: core.error,
    setError: core.setError,

    selectedPatient: core.selectedPatient,
    setSelectedPatient: core.setSelectedPatient,

    patientForm: core.patientForm,
    setPatientForm: core.setPatientForm,

    bookingForm: core.bookingForm,
    setBookingForm: core.setBookingForm,

    therapists: core.therapists,
    selectedTherapist: core.selectedTherapist,
    weekDates: core.weekDates,
    setWeekDates: core.setWeekDates,
    slots: core.slots,
    setSlots: core.setSlots,

    todayBookingsCount: core.todayBookingsCount,
    todayBookings: core.todayBookings,
    todayAgents: core.todayAgents || [],
    todayTherapists: core.todayTherapists || [],
    todayFilter,
    setTodayFilter,
    loadTodayBookings: core.loadTodayBookings,
    handleApplyTodayFilters,

    monthlyBookingsCount: monthly.monthlyBookingsCount,
    monthlyBookings: monthly.monthlyBookings,
    monthlyAgents: monthly.monthlyAgents || [],
    monthlyTherapists: monthly.monthlyTherapists || [],
    monthlyFilter: monthly.monthlyFilter,
    setMonthlyFilter: monthly.setMonthlyFilter,
    loadMonthlyBookings: monthly.loadMonthlyBookings,
    handleApplyMonthlyFilters,

    futureBookings: future.futureBookings,
    futureTherapistSummary: future.futureTherapistSummary,
    futureDaySummary: future.futureDaySummary,
    futureAgents: future.futureAgents || [],
    futureTherapists: future.futureTherapists || [],
    futureFilter: future.futureFilter,
    setFutureFilter: future.setFutureFilter,
    loadFutureBookings: future.loadFutureBookings,
    handleApplyFutureFilters,

    handleSelectPatient: core.handleSelectPatient,
    handleCreatePatientFile: core.handleCreatePatientFile,
    handleSelectTherapist: core.handleSelectTherapist,
    handleSelectDate: core.handleSelectDate,
    handleSelectSlot: core.handleSelectSlot,
    handleConfirmBooking: core.handleConfirmBooking,
    handleEditBooking: core.handleEditBooking,
    handleDeleteBooking: core.handleDeleteBooking,
  };
}
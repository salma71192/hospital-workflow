import { useState } from "react";
import useBookingCore from "./useBookingCore";
import useMonthlyBookings from "./useMonthlyBookings";
import useFutureBookings from "./useFutureBookings";

export default function useBookingDashboard() {
  const [activeSection, setActiveSection] = useState("book");

  const monthly = useMonthlyBookings();
  const future = useFutureBookings();

  const core = useBookingCore({
    onReloadMonthlyBookings: monthly.loadMonthlyBookings,
    onReloadFutureBookings: future.loadFutureBookings,
  });

  return {
    activeSection,
    setActiveSection,

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

    monthlyBookingsCount: monthly.monthlyBookingsCount,
    monthlyBookings: monthly.monthlyBookings,
    monthlyAgents: monthly.monthlyAgents,
    monthlyTherapists: monthly.monthlyTherapists,
    monthlyFilter: monthly.monthlyFilter,
    setMonthlyFilter: monthly.setMonthlyFilter,

    futureBookings: future.futureBookings,
    futureTherapistSummary: future.futureTherapistSummary,
    futureDaySummary: future.futureDaySummary,
    futureAgents: future.futureAgents,
    futureFilter: future.futureFilter,
    setFutureFilter: future.setFutureFilter,

    handleSelectPatient: core.handleSelectPatient,
    handleCreatePatientFile: core.handleCreatePatientFile,
    handleSelectTherapist: core.handleSelectTherapist,
    handleSelectDate: core.handleSelectDate,
    handleSelectSlot: core.handleSelectSlot,
    handleConfirmBooking: core.handleConfirmBooking,
    handleEditBooking: core.handleEditBooking,
    handleDeleteBooking: core.handleDeleteBooking,

    handleApplyMonthlyFilters: monthly.handleApplyMonthlyFilters,
    handleApplyFutureFilters: future.handleApplyFutureFilters,
  };
}
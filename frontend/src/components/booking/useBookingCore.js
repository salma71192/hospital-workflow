import { useEffect, useState, useCallback } from "react";
import api from "../../api/api";
function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function getTodayString() {
  return formatLocalDate(new Date());
}
function getTwoWeekDates() {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 14; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(formatLocalDate(date));
  }
  return dates;
}
function getNextDateString(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const next = new Date(year, month - 1, day);
  next.setDate(next.getDate() + 1);
  return formatLocalDate(next);
}
export default function useBookingCore({
  onReloadMonthlyBookings,
  onReloadFutureBookings,
  onBookingFailed,
  onSlotFreed,
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientForm, setPatientForm] = useState({
    name: "",
    patient_id: "",
  });
  const [bookingForm, setBookingForm] = useState({
    patient_id: "",
    therapist_id: "",
    appointment_date: getTodayString(),
    appointment_time: "",
    notes: "",
    booking_id: null,
  });
  const [therapists, setTherapists] = useState([]);
  const [selectedTherapist, setSelectedTherapist] = useState("");
  const [weekDates, setWeekDates] = useState(getTwoWeekDates());
  const [slots, setSlots] = useState([]);
  const [todayBookingsCount, setTodayBookingsCount] = useState(0);
  const [todayBookings, setTodayBookings] = useState([]);
  const [todayAgents, setTodayAgents] = useState([]);
  const [todayTherapists, setTodayTherapists] = useState([]);
  const [lastFilters, setLastFilters] = useState({
    date: getTodayString(),
    therapist_id: "all",
    user_id: "all",
    patient: "",
  });
  const loadTherapists = async () => {
    try {
      const response = await api.get("callcenter/therapists/");
      setTherapists(response.data.therapists || []);
    } catch (err) {
      console.error("Failed to load therapists", err);
      setTherapists([]);
    }
  };
  const loadTodayBookings = useCallback(
    async (
      dateValue = getTodayString(),
      therapistIdValue = "all",
      userIdValue = "all",
      patientValue = ""
    ) => {
      try {
        const params = new URLSearchParams();
        params.append("mode", "today");
        if (dateValue) {
          params.append("date", dateValue);
        }
        if (therapistIdValue && therapistIdValue !== "all") {
          params.append("therapist_id", therapistIdValue);
        }
        if (userIdValue && userIdValue !== "all") {
          params.append("user_id", userIdValue);
        }
        if (patientValue?.trim()) {
          params.append("patient", patientValue.trim());
        }
        const response = await api.get(
          `callcenter/bookings/tracker/?${params.toString()}`
        );
        setTodayBookingsCount(response.data.count || 0);
        setTodayBookings(response.data.bookings || []);
        setTodayAgents(response.data.agents || []);
        setTodayTherapists(response.data.therapists || []);
        setLastFilters({
          date: dateValue || getTodayString(),
          therapist_id: therapistIdValue || "all",
          user_id: userIdValue || "all",
          patient: patientValue?.trim() || "",
        });
      } catch (err) {
        console.error("Failed to load today bookings", err);
        setTodayBookingsCount(0);
        setTodayBookings([]);
        setTodayAgents([]);
        setTodayTherapists([]);
      }
    },
    []
  );
  const reloadTodayBookingsWithLastFilters = useCallback(async () => {
    await loadTodayBookings(
      lastFilters.date,
      lastFilters.therapist_id,
      lastFilters.user_id,
      lastFilters.patient
    );
  }, [loadTodayBookings, lastFilters]);
  const reloadAll = useCallback(async () => {
    await Promise.all([
      reloadTodayBookingsWithLastFilters(),
      Promise.resolve(onReloadMonthlyBookings?.()),
      Promise.resolve(onReloadFutureBookings?.()),
    ]);
  }, [
    reloadTodayBookingsWithLastFilters,
    onReloadMonthlyBookings,
    onReloadFutureBookings,
  ]);
  useEffect(() => {
    loadTherapists();
    loadTodayBookings(getTodayString(), "all", "all", "");
  }, [loadTodayBookings]);
  useEffect(() => {
    const interval = setInterval(() => {
      reloadAll();
    }, 10000);
    return () => clearInterval(interval);
  }, [reloadAll]);
  const loadSlots = async (
    therapistId,
    appointmentDate,
    options = { autoShiftIfFullDay: true }
  ) => {
    if (!therapistId || !appointmentDate) {
      setSlots([]);
      return { slots: [], shifted: false };
    }
    try {
      const response = await api.get(
        `callcenter/slots/?therapist_id=${encodeURIComponent(
          therapistId
        )}&date=${encodeURIComponent(appointmentDate)}`
      );
      const fetchedSlots = response.data.slots || [];
      const hasSelectableSlot = fetchedSlots.some(
        (slot) => slot.status !== "past" && slot.status !== "blocked"
      );
      if (options.autoShiftIfFullDay && !hasSelectableSlot) {
        const lastVisibleDate =
          weekDates[weekDates.length - 1] || appointmentDate;
        if (appointmentDate < lastVisibleDate) {
          const nextDate = getNextDateString(appointmentDate);
          setBookingForm((previous) => ({
            ...previous,
            appointment_date: nextDate,
            appointment_time: "",
          }));
          const shiftedResult = await loadSlots(therapistId, nextDate, {
            autoShiftIfFullDay: false,
          });
          setMessage(
            "No more available slots for this day. Moved to the next available day."
          );
          return {
            slots: shiftedResult.slots || [],
            shifted: true,
            shiftedTo: nextDate,
          };
        }
      }
      setSlots(fetchedSlots);
      return {
        slots: fetchedSlots,
        shifted: false,
      };
    } catch (err) {
      console.error("Failed to load slots", err);
      setSlots([]);
      return {
        slots: [],
        shifted: false,
      };
    }
  };
  const handleSelectPatient = async (patient) => {
    setMessage("");
    setError("");
    setSelectedPatient(patient);
    const currentDate = bookingForm.appointment_date || getTodayString();
    setBookingForm((previous) => ({
      ...previous,
      patient_id: patient.id,
      appointment_time: "",
      notes: previous.booking_id ? previous.notes : "",
      booking_id: null,
    }));
    try {
      const response = await api.get(
        `reception/last-therapist/${patient.id}/`
      );
      const therapist = response.data?.therapist;
      if (therapist?.id) {
        const therapistId = String(therapist.id);
        setSelectedTherapist(therapistId);
        setBookingForm((previous) => ({
          ...previous,
          patient_id: patient.id,
          therapist_id: therapistId,
          appointment_date: currentDate,
          appointment_time: "",
          booking_id: null,
        }));
        await loadSlots(therapistId, currentDate, {
          autoShiftIfFullDay: true,
        });
        setMessage(
          `Selected ${patient.name} (Previously with ${therapist.name})`
        );
      } else {
        setSelectedTherapist("");
        setBookingForm((previous) => ({
          ...previous,
          patient_id: patient.id,
          therapist_id: "",
          appointment_date: currentDate,
          appointment_time: "",
          booking_id: null,
        }));
        setSlots([]);
        setMessage(`Selected ${patient.name} for booking.`);
      }
    } catch (err) {
      console.error("Failed to load last therapist", err);
      setSelectedTherapist("");
      setBookingForm((previous) => ({
        ...previous,
        patient_id: patient.id,
        therapist_id: "",
        appointment_date: currentDate,
        appointment_time: "",
        booking_id: null,
      }));
      setSlots([]);
      setMessage(`Selected ${patient.name} for booking.`);
    }
  };
  const handleCreatePatientFile = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const response = await api.post("patients/", {
        name: patientForm.name,
        patient_id: patientForm.patient_id,
      });
      const patient = response.data.patient;
      setPatientForm({
        name: "",
        patient_id: "",
      });
      if (patient) {
        await handleSelectPatient(patient);
        setMessage("Patient created successfully");
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || "Create failed");
    }
  };
  const handleSelectTherapist = async (therapistId) => {
    const safeTherapistId = therapistId ? String(therapistId) : "";
    setMessage("");
    setError("");
    setSelectedTherapist(safeTherapistId);
    setBookingForm((previous) => ({
      ...previous,
      therapist_id: safeTherapistId,
      appointment_time: "",
    }));
    await loadSlots(safeTherapistId, bookingForm.appointment_date, {
      autoShiftIfFullDay: true,
    });
  };
  const handleSelectDate = async (appointmentDate) => {
    setMessage("");
    setError("");
    setBookingForm((previous) => ({
      ...previous,
      appointment_date: appointmentDate,
      appointment_time: "",
    }));
    await loadSlots(
      bookingForm.therapist_id || selectedTherapist,
      appointmentDate,
      { autoShiftIfFullDay: true }
    );
  };
  const handleSelectSlot = (time) => {
    const safeTime = typeof time === "string" ? time : time?.time || "";
    if (!safeTime) {
      return;
    }
    setBookingForm((previous) => ({
      ...previous,
      appointment_time: safeTime,
    }));
  };
  const handleConfirmBooking = async () => {
    setMessage("");
    setError("");
    if (
      !bookingForm.patient_id ||
      !bookingForm.therapist_id ||
      !bookingForm.appointment_date ||
      !bookingForm.appointment_time
    ) {
      setError("Please select a patient, therapist, date, and available time.");
      return;
    }
    try {
      if (bookingForm.booking_id) {
        const response = await api.put(
          `callcenter/bookings/${bookingForm.booking_id}/`,
          {
            therapist_id: bookingForm.therapist_id,
            appointment_date: bookingForm.appointment_date,
            appointment_time: bookingForm.appointment_time,
            notes: bookingForm.notes,
          }
        );
        setMessage(response.data.message || "Booking updated successfully");
      } else {
        const response = await api.post("callcenter/bookings/", {
          patient_id: bookingForm.patient_id,
          therapist_id: bookingForm.therapist_id,
          appointment_date: bookingForm.appointment_date,
          appointment_time: bookingForm.appointment_time,
          notes: bookingForm.notes,
        });
        setMessage(
          response.data.message || "Appointment booked successfully"
        );
      }
      await reloadAll();
      await loadSlots(
        bookingForm.therapist_id,
        bookingForm.appointment_date,
        { autoShiftIfFullDay: false }
      );
      setBookingForm((previous) => ({
        ...previous,
        appointment_time: "",
        notes: "",
        booking_id: null,
      }));
    } catch (err) {
      console.error("Failed to save booking", err);
      const responseData = err?.response?.data || {};
      const errorMessage =
        responseData.error ||
        "Could not complete booking. Please choose another available slot.";
      setError(errorMessage);
      onBookingFailed?.({
        message: errorMessage,
        errorData: responseData,
        bookingForm,
        selectedPatient,
      });
    }
  };
  // Load an existing appointment into the form for editing/rescheduling.
  const handleEditBooking = async (booking) => {
    if (!booking?.id) {
      setError("Unable to open this appointment. Booking ID is missing.");
      return;
    }
    const patientDatabaseId =
      booking.patient_db_id ?? booking.patient?.id ?? booking.patient_id;
    if (!patientDatabaseId) {
      setError("Unable to identify the patient for this appointment.");
      return;
    }
    setMessage("");
    setError("");
    const therapistId = String(booking.therapist_id || "");
    const appointmentDate = booking.appointment_date || getTodayString();
    const patient = {
      id: patientDatabaseId,
      name: booking.patient_name || booking.patient?.name || "",
      patient_id: booking.patient_id || "",
    };
    setSelectedPatient(patient);
    setSelectedTherapist(therapistId);
    setBookingForm({
      patient_id: patientDatabaseId,
      therapist_id: therapistId,
      appointment_date: appointmentDate,
      appointment_time: booking.appointment_time || "",
      notes: booking.notes || "",
      booking_id: booking.id,
    });
    await loadSlots(therapistId, appointmentDate, {
      autoShiftIfFullDay: false,
    });
    setMessage(
      `Editing appointment for ${patient.name || "selected patient"}. Choose the new date, therapist, or time, then save.`
    );
  };
  // Use the same existing update flow for rescheduling.
  const handleRescheduleBooking = async (booking) => {
    await handleEditBooking(booking);
  };
  const handleDeleteBooking = async (bookingOrId) => {
    const booking =
      bookingOrId && typeof bookingOrId === "object"
        ? bookingOrId
        : null;
    const bookingId = booking ? booking.id : bookingOrId;
    if (!bookingId) {
      setError("Unable to delete appointment. Booking ID is missing.");
      return;
    }
    setMessage("");
    setError("");
    try {
      const response = await api.delete(
        `callcenter/bookings/${bookingId}/`
      );
      setMessage(response.data.message || "Booking deleted successfully");
      if (response.data?.alerts?.length) {
        onSlotFreed?.(response.data.alerts);
      }
      // Refresh the appointment tracker and related booking lists.
      await reloadAll();
      // Refresh availability for the deleted appointment's slot.
      const therapistId = booking?.therapist_id
        ? String(booking.therapist_id)
        : bookingForm.therapist_id || selectedTherapist;
      const appointmentDate =
        booking?.appointment_date ||
        bookingForm.appointment_date ||
        getTodayString();
      if (therapistId) {
        await loadSlots(therapistId, appointmentDate, {
          autoShiftIfFullDay: false,
        });
      }
      // If the deleted appointment was open in the booking form, clear edit mode.
      if (String(bookingForm.booking_id) === String(bookingId)) {
        setBookingForm((previous) => ({
          ...previous,
          appointment_time: "",
          notes: "",
          booking_id: null,
        }));
      }
    } catch (err) {
      console.error("Failed to delete booking", err);
      setError(err?.response?.data?.error || "Delete failed");
      setMessage("");
    }
  };
  return {
    message,
    setMessage,
    error,
    setError,
    selectedPatient,
    setSelectedPatient,
    patientForm,
    setPatientForm,
    bookingForm,
    setBookingForm,
    therapists,
    selectedTherapist,
    weekDates,
    setWeekDates,
    slots,
    setSlots,
    todayBookingsCount,
    todayBookings,
    todayAgents,
    todayTherapists,
    loadTodayBookings,
    handleSelectPatient,
    handleCreatePatientFile,
    handleSelectTherapist,
    handleSelectDate,
    handleSelectSlot,
    handleConfirmBooking,
    handleEditBooking,
    handleRescheduleBooking,
    handleDeleteBooking,
    loadSlots,
    reloadAll,
  };
}
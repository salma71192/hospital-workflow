import { useEffect, useState } from "react";
import api from "../../api/api";

function formatLocalDate(date) {
  return date.toLocaleDateString("en-CA");
}

function getTodayString() {
  return formatLocalDate(new Date());
}

function getTwoWeekDates() {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < 14; i += 1) {
    const next = new Date(today);
    next.setDate(today.getDate() + i);
    dates.push(formatLocalDate(next));
  }

  return dates;
}

function getNextDateString(dateString) {
  const next = new Date(dateString);
  next.setDate(next.getDate() + 1);
  return formatLocalDate(next);
}

export default function useBookingCore({
  onReloadMonthlyBookings,
  onReloadFutureBookings,
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

  const [lastTodayFilters, setLastTodayFilters] = useState({
    date: getTodayString(),
    therapist_id: "all",
    user_id: "all",
    patient: "",
  });

  useEffect(() => {
    loadTherapists();
    loadTodayBookings(getTodayString(), "all", "all", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTherapists = async () => {
    try {
      const res = await api.get("callcenter/therapists/");
      setTherapists(res.data.therapists || []);
    } catch (err) {
      console.error("Failed to load therapists", err);
      setTherapists([]);
    }
  };

  const loadTodayBookings = async (
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

      const res = await api.get(
        `callcenter/bookings/tracker/?${params.toString()}`
      );

      setTodayBookingsCount(res.data.count || 0);
      setTodayBookings(res.data.bookings || []);
      setTodayAgents(res.data.agents || []);
      setTodayTherapists(res.data.therapists || []);

      setLastTodayFilters({
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
  };

  const reloadTodayBookingsWithLastFilters = async () => {
    await loadTodayBookings(
      lastTodayFilters.date,
      lastTodayFilters.therapist_id,
      lastTodayFilters.user_id,
      lastTodayFilters.patient
    );
  };

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
      const res = await api.get(
        `callcenter/slots/?therapist_id=${encodeURIComponent(
          therapistId
        )}&date=${encodeURIComponent(appointmentDate)}`
      );

      const fetchedSlots = res.data.slots || [];
      const hasSelectableSlot = fetchedSlots.some(
        (slot) => slot.status !== "past" && slot.status !== "blocked"
      );

      if (options.autoShiftIfFullDay && !hasSelectableSlot) {
        const lastVisibleDate =
          weekDates[weekDates.length - 1] || appointmentDate;

        if (appointmentDate < lastVisibleDate) {
          const nextDate = getNextDateString(appointmentDate);

          setBookingForm((prev) => ({
            ...prev,
            appointment_date: nextDate,
            appointment_time: "",
          }));

          const nextRes = await api.get(
            `callcenter/slots/?therapist_id=${encodeURIComponent(
              therapistId
            )}&date=${encodeURIComponent(nextDate)}`
          );

          const nextSlots = nextRes.data.slots || [];
          setSlots(nextSlots);

          setMessage(
            "No more available slots for this day. Moved to the next available day."
          );

          return { slots: nextSlots, shifted: true, shiftedTo: nextDate };
        }
      }

      setSlots(fetchedSlots);
      return { slots: fetchedSlots, shifted: false };
    } catch (err) {
      console.error("Failed to load slots", err);
      setSlots([]);
      return { slots: [], shifted: false };
    }
  };

  const handleSelectPatient = async (patient) => {
    setMessage("");
    setError("");
    setSelectedPatient(patient);

    const currentDate = bookingForm.appointment_date || getTodayString();

    setBookingForm((prev) => ({
      ...prev,
      patient_id: patient.id,
      appointment_time: "",
      notes: prev.booking_id ? prev.notes : "",
      booking_id: null,
    }));

    try {
      const res = await api.get(`reception/last-therapist/${patient.id}/`);
      const therapist = res.data?.therapist;

      if (therapist?.id) {
        const therapistId = String(therapist.id);

        setSelectedTherapist(therapistId);
        setBookingForm((prev) => ({
          ...prev,
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
        setBookingForm((prev) => ({
          ...prev,
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
      setBookingForm((prev) => ({
        ...prev,
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

  const handleCreatePatientFile = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await api.post("patients/", {
        name: patientForm.name,
        patient_id: patientForm.patient_id,
      });

      const patient = res.data.patient;

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
    setSelectedTherapist(safeTherapistId);
    setBookingForm((prev) => ({
      ...prev,
      therapist_id: safeTherapistId,
      appointment_time: "",
    }));

    await loadSlots(safeTherapistId, bookingForm.appointment_date, {
      autoShiftIfFullDay: true,
    });
  };

  const handleSelectDate = async (appointmentDate) => {
    setMessage("");
    setBookingForm((prev) => ({
      ...prev,
      appointment_date: appointmentDate,
      appointment_time: "",
    }));

    await loadSlots(
      bookingForm.therapist_id || selectedTherapist,
      appointmentDate,
      {
        autoShiftIfFullDay: true,
      }
    );
  };

  const handleSelectSlot = (time) => {
    const safeTime = typeof time === "string" ? time : time?.time || "";
    if (!safeTime) return;

    setBookingForm((prev) => ({
      ...prev,
      appointment_time: safeTime,
    }));
  };

  const handleConfirmBooking = async () => {
    setMessage("");
    setError("");

    try {
      if (bookingForm.booking_id) {
        const res = await api.put(
          `callcenter/bookings/${bookingForm.booking_id}/`,
          {
            therapist_id: bookingForm.therapist_id,
            appointment_date: bookingForm.appointment_date,
            appointment_time: bookingForm.appointment_time,
            notes: bookingForm.notes,
          }
        );

        setMessage(res.data.message || "Booking updated successfully");
      } else {
        const res = await api.post("callcenter/bookings/", {
          patient_id: bookingForm.patient_id,
          therapist_id: bookingForm.therapist_id,
          appointment_date: bookingForm.appointment_date,
          appointment_time: bookingForm.appointment_time,
          notes: bookingForm.notes,
        });

        setMessage(res.data.message || "Appointment booked successfully");
      }

      await Promise.all([
        reloadTodayBookingsWithLastFilters(),
        onReloadMonthlyBookings?.(),
        onReloadFutureBookings?.(),
      ]);

      await loadSlots(bookingForm.therapist_id, bookingForm.appointment_date, {
        autoShiftIfFullDay: true,
      });

      setBookingForm((prev) => ({
        ...prev,
        appointment_time: "",
        notes: "",
        booking_id: null,
      }));
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.error ||
          "Could not complete booking. Please choose another available slot."
      );
    }
  };

  const handleEditBooking = async (booking) => {
    setMessage("");
    setError("");

    const therapistId = String(booking.therapist_id || "");
    const appointmentDate = booking.appointment_date || getTodayString();

    setBookingForm({
      patient_id: booking.patient_db_id,
      therapist_id: therapistId,
      appointment_date: appointmentDate,
      appointment_time: booking.appointment_time || "",
      notes: booking.notes || "",
      booking_id: booking.id,
    });

    setSelectedTherapist(therapistId);
    setSelectedPatient({
      id: booking.patient_db_id,
      name: booking.patient_name,
      patient_id: booking.patient_id,
    });

    await loadSlots(therapistId, appointmentDate, {
      autoShiftIfFullDay: false,
    });

    setMessage(`Editing booking for ${booking.patient_name}`);
  };

  const handleDeleteBooking = async (bookingId) => {
    try {
      const res = await api.delete(`callcenter/bookings/${bookingId}/`);
      setMessage(res.data.message || "Booking deleted successfully");
      setError("");

      await Promise.all([
        reloadTodayBookingsWithLastFilters(),
        onReloadMonthlyBookings?.(),
        onReloadFutureBookings?.(),
      ]);
    } catch (err) {
      console.error(err);
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
    handleDeleteBooking,
  };
}
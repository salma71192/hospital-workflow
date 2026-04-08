import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function getMonthString() {
  return new Date().toISOString().slice(0, 7);
}

function getWeekDates(startDate = new Date()) {
  const days = [];
  const base = new Date(startDate);

  for (let i = 0; i < 7; i += 1) {
    const next = new Date(base);
    next.setDate(base.getDate() + i);
    days.push(next.toISOString().split("T")[0]);
  }

  return days;
}

function generateTimeSlots() {
  const slots = [];

  for (let hour = 8; hour < 22; hour += 1) {
    slots.push(`${String(hour).padStart(2, "0")}:00`);
    slots.push(`${String(hour).padStart(2, "0")}:30`);
  }

  slots.push("22:00");
  return slots;
}

export default function useCallCenterDashboard() {
  const [activeSection, setActiveSection] = useState("search");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [selectedPatient, setSelectedPatient] = useState(null);

  const [patientForm, setPatientForm] = useState({
    name: "",
    patient_id: "",
  });

  const [bookingForm, setBookingForm] = useState({
    booking_id: "",
    therapist_id: "",
    appointment_date: getTodayString(),
    appointment_time: "",
    notes: "",
  });

  const [therapists, setTherapists] = useState([]);
  const [weekDates, setWeekDates] = useState(getWeekDates());
  const [slots, setSlots] = useState([]);

  const [todayBookingsCount, setTodayBookingsCount] = useState(0);
  const [monthlyBookingsCount, setMonthlyBookingsCount] = useState(0);

  const [todayBookings, setTodayBookings] = useState([]);
  const [monthlyBookings, setMonthlyBookings] = useState([]);
  const [monthlyAgents, setMonthlyAgents] = useState([]);

  const [monthlyFilter, setMonthlyFilter] = useState({
    month: getMonthString(),
    user_id: "all",
    patient: "",
    therapist_id: "all",
  });

  const [futureBookings, setFutureBookings] = useState([]);
  const [futureTherapistSummary, setFutureTherapistSummary] = useState([]);
  const [futureDaySummary, setFutureDaySummary] = useState([]);
  const [futureFilter, setFutureFilter] = useState({
    from_date: getTodayString(),
    to_date: "",
    therapist_id: "all",
    day: "",
  });

  const selectedTherapist = useMemo(() => {
    return therapists.find(
      (item) => String(item.id) === String(bookingForm.therapist_id)
    );
  }, [therapists, bookingForm.therapist_id]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (bookingForm.therapist_id && bookingForm.appointment_date) {
      loadSlots(bookingForm.therapist_id, bookingForm.appointment_date);
    } else {
      setSlots([]);
    }
  }, [bookingForm.therapist_id, bookingForm.appointment_date]);

  const loadInitialData = async () => {
    await Promise.all([
      loadTherapists(),
      loadTodayBookings(),
      loadMonthlyBookings(),
      loadFutureBookings(),
    ]);
  };

  const loadTherapists = async () => {
    try {
      const res = await api.get("callcenter/therapists/");
      setTherapists(res.data.therapists || []);
    } catch (err) {
      console.error("Failed to load therapists", err);
      setTherapists([]);
    }
  };

  const loadTodayBookings = async () => {
    try {
      const today = getTodayString();
      const res = await api.get(`callcenter/bookings/today/?date=${today}`);

      setTodayBookingsCount(res.data.count || 0);
      setTodayBookings(res.data.bookings || []);
    } catch (err) {
      console.error("Failed to load today bookings", err);
      setTodayBookingsCount(0);
      setTodayBookings([]);
    }
  };

  const loadMonthlyBookings = async (
    monthValue = monthlyFilter.month,
    userIdValue = monthlyFilter.user_id,
    patientValue = monthlyFilter.patient,
    therapistIdValue = monthlyFilter.therapist_id
  ) => {
    try {
      const params = new URLSearchParams();

      if (monthValue) params.append("month", monthValue);
      if (userIdValue && userIdValue !== "all") {
        params.append("user_id", userIdValue);
      }
      if (patientValue?.trim()) {
        params.append("patient", patientValue.trim());
      }
      if (therapistIdValue && therapistIdValue !== "all") {
        params.append("therapist_id", therapistIdValue);
      }

      const query = params.toString();
      const url = query
        ? `callcenter/bookings/monthly/?${query}`
        : "callcenter/bookings/monthly/";

      const res = await api.get(url);

      setMonthlyBookingsCount(res.data.count || 0);
      setMonthlyBookings(res.data.bookings || []);
      setMonthlyAgents(res.data.agents || []);
    } catch (err) {
      console.error("Failed to load monthly bookings", err);
      setMonthlyBookingsCount(0);
      setMonthlyBookings([]);
      setMonthlyAgents([]);
    }
  };

  const loadFutureBookings = async (
    fromDateValue = futureFilter.from_date,
    toDateValue = futureFilter.to_date,
    therapistIdValue = futureFilter.therapist_id,
    dayValue = futureFilter.day
  ) => {
    try {
      const params = new URLSearchParams();

      if (fromDateValue) params.append("from_date", fromDateValue);
      if (toDateValue) params.append("to_date", toDateValue);
      if (therapistIdValue && therapistIdValue !== "all") {
        params.append("therapist_id", therapistIdValue);
      }
      if (dayValue) params.append("day", dayValue);

      const query = params.toString();
      const url = query
        ? `callcenter/bookings/future/?${query}`
        : "callcenter/bookings/future/";

      const res = await api.get(url);

      setFutureBookings(res.data.bookings || []);
      setFutureTherapistSummary(res.data.therapist_summary || []);
      setFutureDaySummary(res.data.day_summary || []);
    } catch (err) {
      console.error("Failed to load future bookings", err);
      setFutureBookings([]);
      setFutureTherapistSummary([]);
      setFutureDaySummary([]);
    }
  };

  const loadSlots = async (therapistId, appointmentDate) => {
    try {
      setError("");

      const res = await api.get(
        `callcenter/slots/?therapist_id=${therapistId}&date=${appointmentDate}`
      );

      const backendSlots = res.data.slots || [];
      const allTimes = generateTimeSlots();

      const mergedSlots = allTimes.map((time) => {
        const existing = backendSlots.find((slot) => slot.time === time);

        if (existing) return existing;

        return {
          time,
          bookings_count: 0,
          status: "available",
        };
      });

      setSlots(mergedSlots);
    } catch (err) {
      console.error("Failed to load slots", err);

      setSlots(
        generateTimeSlots().map((time) => ({
          time,
          bookings_count: 0,
          status: "available",
        }))
      );
    }
  };

  const handleSelectPatient = async (patient) => {
    setMessage("");
    setError("");
    setSelectedPatient(patient);
    setActiveSection("booking");

    setBookingForm((prev) => ({
      ...prev,
      booking_id: "",
      appointment_time: "",
      notes: "",
    }));
  };

  const handleCreatePatientFile = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const payload = {
        name: patientForm.name,
        patient_id: patientForm.patient_id,
      };

      const res = await api.post("patients/", payload);
      const patient = res.data.patient;

      setPatientForm({
        name: "",
        patient_id: "",
      });

      if (patient) {
        await handleSelectPatient(patient);
      }

      setMessage("Patient created successfully");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to create patient");
    }
  };

  const handleSelectTherapist = (therapistId) => {
    setMessage("");
    setError("");

    setBookingForm((prev) => ({
      ...prev,
      therapist_id: String(therapistId || ""),
      appointment_time: "",
    }));
  };

  const handleSelectDate = (date) => {
    setMessage("");
    setError("");

    setBookingForm((prev) => ({
      ...prev,
      appointment_date: date,
      appointment_time: "",
    }));
  };

  const handleSelectSlot = (slot) => {
    const status = slot?.status || "available";
    const bookingsCount = Number(slot?.bookings_count || 0);

    if (status === "blocked" || bookingsCount >= 2) {
      return;
    }

    setBookingForm((prev) => ({
      ...prev,
      appointment_time: slot.time,
    }));

    setMessage("");
    setError("");
  };

  const handleConfirmBooking = async () => {
    setMessage("");
    setError("");

    if (!selectedPatient) {
      setError("Select a patient first");
      return;
    }

    if (!bookingForm.therapist_id) {
      setError("Select a therapist");
      return;
    }

    if (!bookingForm.appointment_date) {
      setError("Select a date");
      return;
    }

    if (!bookingForm.appointment_time) {
      setError("Select a time slot");
      return;
    }

    try {
      const payload = {
        patient_id: selectedPatient.id,
        therapist_id: bookingForm.therapist_id,
        appointment_date: bookingForm.appointment_date,
        appointment_time: bookingForm.appointment_time,
        notes: bookingForm.notes || "",
      };

      if (bookingForm.booking_id) {
        await api.put(`callcenter/bookings/${bookingForm.booking_id}/`, payload);
        setMessage("Appointment updated successfully");
      } else {
        await api.post("callcenter/bookings/", payload);
        setMessage("Appointment booked successfully");
      }

      await Promise.all([
        loadSlots(bookingForm.therapist_id, bookingForm.appointment_date),
        loadTodayBookings(),
        loadMonthlyBookings(),
        loadFutureBookings(),
      ]);

      setBookingForm((prev) => ({
        ...prev,
        booking_id: "",
        appointment_time: "",
        notes: "",
      }));
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to save appointment");
    }
  };

  const handleApplyMonthlyFilters = async () => {
    await loadMonthlyBookings(
      monthlyFilter.month,
      monthlyFilter.user_id,
      monthlyFilter.patient,
      monthlyFilter.therapist_id
    );
  };

  const handleApplyFutureFilters = async () => {
    await loadFutureBookings(
      futureFilter.from_date,
      futureFilter.to_date,
      futureFilter.therapist_id,
      futureFilter.day
    );
  };

  const handleEditBooking = async (booking) => {
    setMessage("");
    setError("");

    setSelectedPatient({
      id: booking.patient_db_id,
      name: booking.patient_name,
      patient_id: booking.patient_id,
    });

    setBookingForm({
      booking_id: booking.id,
      therapist_id: String(booking.therapist_id || ""),
      appointment_date: booking.appointment_date || getTodayString(),
      appointment_time: booking.appointment_time || "",
      notes: booking.notes || "",
    });

    setActiveSection("booking");
  };

  const handleDeleteBooking = async (bookingId) => {
    const confirmed = window.confirm("Delete this booking?");
    if (!confirmed) return;

    try {
      setMessage("");
      setError("");

      await api.delete(`callcenter/bookings/${bookingId}/`);

      setMessage("Booking deleted successfully");

      await Promise.all([
        loadTodayBookings(),
        loadMonthlyBookings(),
        loadFutureBookings(),
      ]);

      if (bookingForm.therapist_id && bookingForm.appointment_date) {
        await loadSlots(bookingForm.therapist_id, bookingForm.appointment_date);
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to delete booking");
    }
  };

  return {
    activeSection,
    setActiveSection,
    message,
    error,

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
    handleCreatePatientFile,
    handleSelectTherapist,
    handleSelectDate,
    handleSelectSlot,
    handleConfirmBooking,
    handleApplyMonthlyFilters,
    handleApplyFutureFilters,
    handleEditBooking,
    handleDeleteBooking,
  };
}
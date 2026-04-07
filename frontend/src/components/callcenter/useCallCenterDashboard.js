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

  const selectedTherapist = useMemo(() => {
    return therapists.find(
      (item) => String(item.id) === String(bookingForm.therapist_id)
    );
  }, [therapists, bookingForm.therapist_id]);

  useEffect(() => {
    loadTherapists();
    loadBookingCounts();
  }, []);

  useEffect(() => {
    if (bookingForm.therapist_id && bookingForm.appointment_date) {
      loadSlots(bookingForm.therapist_id, bookingForm.appointment_date);
    } else {
      setSlots([]);
    }
  }, [bookingForm.therapist_id, bookingForm.appointment_date]);

  const loadTherapists = async () => {
    try {
      const res = await api.get("callcenter/therapists/");
      setTherapists(res.data.therapists || []);
    } catch (err) {
      console.error("Failed to load therapists", err);
      setTherapists([]);
    }
  };

  const loadBookingCounts = async () => {
    try {
      const today = getTodayString();
      const month = getMonthString();

      const [todayRes, monthRes] = await Promise.all([
        api.get(`callcenter/bookings/today/?date=${today}`),
        api.get(`callcenter/bookings/monthly/?month=${month}`),
      ]);

      setTodayBookingsCount(todayRes.data.count || 0);
      setMonthlyBookingsCount(monthRes.data.count || 0);
    } catch (err) {
      console.error("Failed to load booking counts", err);
      setTodayBookingsCount(0);
      setMonthlyBookingsCount(0);
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
      appointment_time: "",
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

  const handleSelectTherapist = async (therapistId) => {
    setMessage("");
    setError("");

    setBookingForm((prev) => ({
      ...prev,
      therapist_id: String(therapistId),
      appointment_time: "",
    }));

    if (therapistId && bookingForm.appointment_date) {
      await loadSlots(therapistId, bookingForm.appointment_date);
    }
  };

  const handleSelectDate = async (date) => {
    setMessage("");
    setError("");

    setBookingForm((prev) => ({
      ...prev,
      appointment_date: date,
      appointment_time: "",
    }));

    if (bookingForm.therapist_id) {
      await loadSlots(bookingForm.therapist_id, date);
    }
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

      await api.post("callcenter/bookings/", payload);

      setMessage("Appointment booked successfully");

      await loadSlots(
        bookingForm.therapist_id,
        bookingForm.appointment_date
      );
      await loadBookingCounts();

      setBookingForm((prev) => ({
        ...prev,
        appointment_time: "",
        notes: "",
      }));
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to book appointment");
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

    handleSelectPatient,
    handleCreatePatientFile,
    handleSelectTherapist,
    handleSelectDate,
    handleSelectSlot,
    handleConfirmBooking,
  };
}
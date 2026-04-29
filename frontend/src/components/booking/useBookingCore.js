import { useEffect, useState, useCallback } from "react";
import api from "../../api/api";

/* ================= DATE HELPERS ================= */

function formatLocalDate(date) {
  return date.toLocaleDateString("en-CA");
}

function getTodayString() {
  return formatLocalDate(new Date());
}

function getTwoWeekDates() {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(formatLocalDate(d));
  }

  return dates;
}

function getNextDateString(dateString) {
  const next = new Date(dateString);
  next.setDate(next.getDate() + 1);
  return formatLocalDate(next);
}

/* ================= HOOK ================= */

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

  const [weekDates] = useState(getTwoWeekDates());
  const [slots, setSlots] = useState([]);

  const [todayBookings, setTodayBookings] = useState([]);
  const [todayAgents, setTodayAgents] = useState([]);
  const [todayTherapists, setTodayTherapists] = useState([]);

  const [lastFilters, setLastFilters] = useState({
    date: getTodayString(),
    therapist_id: "all",
    user_id: "all",
    patient: "",
  });

  /* ================= INIT ================= */

  useEffect(() => {
    
    loadTherapists();
    loadTodayBookings(getTodayString(), "all", "all", "");
  }, []);

  useEffect(() => {
  const interval = setInterval(() => {
    reloadTodayBookingsWithLastFilters();
  }, 10000);

  return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [lastTodayFilters]);

  /* ================= LOADERS ================= */

  const loadTherapists = async () => {
    try {
      const res = await api.get("callcenter/therapists/");
      setTherapists(res.data.therapists || []);
    } catch (err) {
      console.error(err);
      setTherapists([]);
    }
  };

  const loadTodayBookings = useCallback(
    async (
      dateValue = getTodayString(),
      therapistId = "all",
      userId = "all",
      patient = ""
    ) => {
      try {
        const params = new URLSearchParams();

        params.append("mode", "today");
        params.append("date", dateValue);

        if (therapistId !== "all") params.append("therapist_id", therapistId);
        if (userId !== "all") params.append("user_id", userId);
        if (patient) params.append("patient", patient);

        const res = await api.get(
          `callcenter/bookings/tracker/?${params}`
        );

        setTodayBookings(res.data.bookings || []);
        setTodayAgents(res.data.agents || []);
        setTodayTherapists(res.data.therapists || []);

        setLastFilters({
          date: dateValue,
          therapist_id: therapistId,
          user_id: userId,
          patient,
        });
      } catch (err) {
        console.error("Tracker load failed", err);
        setTodayBookings([]);
      }
    },
    []
  );

  const reloadAll = async () => {
    await loadTodayBookings(
      lastFilters.date,
      lastFilters.therapist_id,
      lastFilters.user_id,
      lastFilters.patient
    );

    await onReloadMonthlyBookings?.();
    await onReloadFutureBookings?.();
  };

  /* ================= SLOTS ================= */

  const loadSlots = async (therapistId, date) => {
    if (!therapistId || !date) return;

    try {
      const res = await api.get(
        `callcenter/slots/?therapist_id=${therapistId}&date=${date}`
      );

      const fetched = res.data.slots || [];

      const hasSlot = fetched.some(
        (s) => s.status !== "blocked" && s.status !== "past"
      );

      if (!hasSlot) {
        const nextDate = getNextDateString(date);

        setBookingForm((prev) => ({
          ...prev,
          appointment_date: nextDate,
          appointment_time: "",
        }));

        return loadSlots(therapistId, nextDate);
      }

      setSlots(fetched);
    } catch (err) {
      console.error(err);
      setSlots([]);
    }
  };

  /* ================= PATIENT ================= */

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);

    setBookingForm((prev) => ({
      ...prev,
      patient_id: patient.id,
      booking_id: null,
    }));

    try {
      const res = await api.get(`reception/last-therapist/${patient.id}/`);

      const therapist = res.data?.therapist;

      if (therapist) {
        setSelectedTherapist(String(therapist.id));

        setBookingForm((prev) => ({
          ...prev,
          therapist_id: String(therapist.id),
        }));

        await loadSlots(therapist.id, bookingForm.appointment_date);
      }
    } catch {
      setSlots([]);
    }
  };

  /* ================= BOOK ================= */

  const handleConfirmBooking = async () => {
    setError("");
    setMessage("");

    try {
      if (bookingForm.booking_id) {
        await api.put(
          `callcenter/bookings/${bookingForm.booking_id}/`,
          bookingForm
        );
        setMessage("Updated");
      } else {
        await api.post("callcenter/bookings/", bookingForm);
        setMessage("Booked");
      }

      await reloadAll();

      await loadSlots(
        bookingForm.therapist_id,
        bookingForm.appointment_date
      );

      setBookingForm((prev) => ({
        ...prev,
        appointment_time: "",
        notes: "",
        booking_id: null,
      }));
    } catch (err) {
      const msg = err?.response?.data?.error || "Booking failed";
      setError(msg);

      onBookingFailed?.({
        message: msg,
        bookingForm,
        selectedPatient,
      });
    }
  };

  /* ================= EDIT ================= */

  const handleEditBooking = async (booking) => {
    setSelectedPatient({
      id: booking.patient_db_id,
      name: booking.patient_name,
    });

    setSelectedTherapist(String(booking.therapist_id));

    setBookingForm({
      patient_id: booking.patient_db_id,
      therapist_id: String(booking.therapist_id),
      appointment_date: booking.appointment_date,
      appointment_time: booking.appointment_time,
      notes: booking.notes,
      booking_id: booking.id,
    });

    await loadSlots(booking.therapist_id, booking.appointment_date);
  };

  /* ================= DELETE ================= */

  const handleDeleteBooking = async (id) => {
    try {
      const res = await api.delete(`callcenter/bookings/${id}/`);

      if (res.data.alerts?.length) {
        onSlotFreed?.(res.data.alerts);
      }

      await reloadAll();
    } catch (err) {
      setError("Delete failed");
    }
  };

  /* ================= RETURN ================= */

  return {
    message,
    error,

    selectedPatient,
    patientForm,
    setPatientForm,

    bookingForm,
    setBookingForm,

    therapists,
    selectedTherapist,

    weekDates,
    slots,

    todayBookings,
    todayAgents,
    todayTherapists,
    loadTodayBookings,

    handleSelectPatient,
    handleConfirmBooking,
    handleEditBooking,
    handleDeleteBooking,
    loadSlots,
  };
}
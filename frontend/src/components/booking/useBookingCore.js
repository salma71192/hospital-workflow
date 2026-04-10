import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import {
  generateTimeSlots,
  getTodayString,
  getWeekDates,
} from "./bookingUtils";

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
  const [todayBookings, setTodayBookings] = useState([]);

  const selectedTherapist = useMemo(() => {
    return therapists.find(
      (item) => String(item.id) === String(bookingForm.therapist_id)
    );
  }, [therapists, bookingForm.therapist_id]);

  useEffect(() => {
    loadTherapists();
    loadTodayBookings();
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

  const loadTodayBookings = async () => {
    try {
      const res = await api.get("callcenter/bookings/today/");
      setTodayBookingsCount(res.data.count || 0);
      setTodayBookings(res.data.bookings || []);
    } catch (err) {
      console.error("Failed to load today bookings", err);
      setTodayBookingsCount(0);
      setTodayBookings([]);
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

        return (
          existing || {
            time,
            bookings_count: 0,
            status: "available",
          }
        );
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

    setBookingForm((prev) => ({
      ...prev,
      booking_id: "",
      therapist_id: "",
      appointment_date: getTodayString(),
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

  const handleEditBooking = (booking) => {
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
        onReloadMonthlyBookings?.(),
        onReloadFutureBookings?.(),
      ]);

      if (bookingForm.therapist_id && bookingForm.appointment_date) {
        await loadSlots(bookingForm.therapist_id, bookingForm.appointment_date);
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to delete booking");
    }
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
        onReloadMonthlyBookings?.(),
        onReloadFutureBookings?.(),
      ]);

      setBookingForm((prev) => ({
        ...prev,
        booking_id: "",
        appointment_time: "",
        notes: "",
      }));
    } catch (err) {
      const apiError = err?.response?.data;
      const existingBooking = apiError?.existing_booking;

      if (existingBooking) {
        const openBooking = window.confirm(
          `Patient already has a booking on this day.\n\n` +
            `Physio: ${existingBooking.therapist_name}\n` +
            `Date: ${existingBooking.appointment_date}\n` +
            `Time: ${existingBooking.appointment_time}\n\n` +
            `Press OK to open this booking.`
        );

        if (openBooking) {
          handleEditBooking(existingBooking);
          return;
        }

        setError(apiError?.error || "Patient already has a booking on this day");
        return;
      }

      setError(apiError?.error || "Failed to save appointment");
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
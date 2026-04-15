import { useState } from "react";
import api from "../../api/api";

function formatLocalDate(date) {
  return date.toLocaleDateString("en-CA");
}

function getTomorrowString() {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  return formatLocalDate(next);
}

function getTwoWeeksForwardString() {
  const next = new Date();
  next.setDate(next.getDate() + 14);
  return formatLocalDate(next);
}

export default function useFutureBookings() {
  const [futureBookings, setFutureBookings] = useState([]);
  const [futureTherapistSummary, setFutureTherapistSummary] = useState([]);
  const [futureDaySummary, setFutureDaySummary] = useState([]);
  const [futureAgents, setFutureAgents] = useState([]);
  const [futureTherapists, setFutureTherapists] = useState([]);

  const [futureFilter, setFutureFilter] = useState({
    from_date: getTomorrowString(),
    to_date: getTwoWeeksForwardString(),
    therapist_id: "all",
    user_id: "all",
    patient: "",
  });

  const resetFutureState = () => {
    setFutureBookings([]);
    setFutureTherapistSummary([]);
    setFutureDaySummary([]);
    setFutureAgents([]);
    setFutureTherapists([]);
  };

  const loadFutureBookings = async (
    fromDateValue = futureFilter.from_date,
    toDateValue = futureFilter.to_date,
    therapistIdValue = futureFilter.therapist_id,
    userIdValue = futureFilter.user_id,
    patientValue = futureFilter.patient
  ) => {
    try {
      const minDate = getTomorrowString();
      const maxDate = getTwoWeeksForwardString();

      let safeFromDate = fromDateValue || minDate;
      let safeToDate = toDateValue || maxDate;

      if (safeFromDate < minDate) safeFromDate = minDate;
      if (safeFromDate > maxDate) safeFromDate = maxDate;

      if (safeToDate < minDate) safeToDate = minDate;
      if (safeToDate > maxDate) safeToDate = maxDate;

      if (safeFromDate > safeToDate) {
        safeToDate = safeFromDate;
      }

      const params = new URLSearchParams();
      params.append("from_date", safeFromDate);
      params.append("to_date", safeToDate);

      if (therapistIdValue && therapistIdValue !== "all") {
        params.append("therapist_id", therapistIdValue);
      }

      if (userIdValue && userIdValue !== "all") {
        params.append("user_id", userIdValue);
      }

      if (patientValue?.trim()) {
        params.append("patient", patientValue.trim());
      }

      const res = await api.get(`callcenter/bookings/future/?${params.toString()}`);

      setFutureBookings(res.data.bookings || []);
      setFutureTherapistSummary(res.data.therapist_summary || []);
      setFutureDaySummary(res.data.day_summary || []);
      setFutureAgents(res.data.agents || []);
      setFutureTherapists(res.data.therapists || []);

      setFutureFilter((prev) => ({
        ...prev,
        from_date: res.data.from_date || safeFromDate,
        to_date: res.data.to_date || safeToDate,
        therapist_id: therapistIdValue || "all",
        user_id: userIdValue || "all",
        patient: patientValue || "",
      }));
    } catch (err) {
      console.error("Failed to load future bookings", err);
      resetFutureState();
    }
  };

  const handleApplyFutureFilters = async () => {
    await loadFutureBookings(
      futureFilter.from_date,
      futureFilter.to_date,
      futureFilter.therapist_id,
      futureFilter.user_id,
      futureFilter.patient
    );
  };

  return {
    futureBookings,
    futureTherapistSummary,
    futureDaySummary,
    futureAgents,
    futureTherapists,
    futureFilter,
    setFutureFilter,
    loadFutureBookings,
    handleApplyFutureFilters,
  };
}
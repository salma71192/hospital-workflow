import { useState } from "react";
import api from "../../api/api";

function getTomorrowString() {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  return next.toISOString().split("T")[0];
}

export default function useFutureBookings() {
  const [futureBookings, setFutureBookings] = useState([]);
  const [futureTherapistSummary, setFutureTherapistSummary] = useState([]);
  const [futureDaySummary, setFutureDaySummary] = useState([]);
  const [futureAgents, setFutureAgents] = useState([]);

  const [futureFilter, setFutureFilter] = useState({
    from_date: getTomorrowString(),
    to_date: "",
    therapist_id: "all",
    user_id: "all",
  });

  const loadFutureBookings = async (
    fromDateValue = futureFilter.from_date,
    toDateValue = futureFilter.to_date,
    therapistIdValue = futureFilter.therapist_id,
    userIdValue = futureFilter.user_id
  ) => {
    try {
      const tomorrow = getTomorrowString();
      const safeFromDate =
        !fromDateValue || fromDateValue < tomorrow ? tomorrow : fromDateValue;

      const params = new URLSearchParams();
      params.append("from_date", safeFromDate);

      if (toDateValue && toDateValue >= tomorrow) {
        params.append("to_date", toDateValue);
      }
      if (therapistIdValue && therapistIdValue !== "all") {
        params.append("therapist_id", therapistIdValue);
      }
      if (userIdValue && userIdValue !== "all") {
        params.append("user_id", userIdValue);
      }

      const query = params.toString();
      const url = query
        ? `callcenter/bookings/future/?${query}`
        : "callcenter/bookings/future/";

      const res = await api.get(url);

      setFutureBookings(res.data.bookings || []);
      setFutureTherapistSummary(res.data.therapist_summary || []);
      setFutureDaySummary(res.data.day_summary || []);
      setFutureAgents(res.data.agents || []);
      setFutureFilter((prev) => ({
        ...prev,
        from_date: safeFromDate,
      }));
    } catch (err) {
      console.error("Failed to load future bookings", err);
      setFutureBookings([]);
      setFutureTherapistSummary([]);
      setFutureDaySummary([]);
      setFutureAgents([]);
    }
  };

  const handleApplyFutureFilters = async () => {
    await loadFutureBookings(
      futureFilter.from_date,
      futureFilter.to_date,
      futureFilter.therapist_id,
      futureFilter.user_id
    );
  };

  return {
    futureBookings,
    futureTherapistSummary,
    futureDaySummary,
    futureAgents,
    futureFilter,
    setFutureFilter,
    loadFutureBookings,
    handleApplyFutureFilters,
  };
}
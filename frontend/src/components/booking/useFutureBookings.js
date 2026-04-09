import { useState } from "react";
import api from "../../api/api";
import { getTodayString } from "./bookingUtils";

export default function useFutureBookings() {
  const [futureBookings, setFutureBookings] = useState([]);
  const [futureTherapistSummary, setFutureTherapistSummary] = useState([]);
  const [futureDaySummary, setFutureDaySummary] = useState([]);

  const [futureFilter, setFutureFilter] = useState({
    from_date: getTodayString(),
    to_date: "",
    therapist_id: "all",
    day: "",
  });

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

  const handleApplyFutureFilters = async () => {
    await loadFutureBookings(
      futureFilter.from_date,
      futureFilter.to_date,
      futureFilter.therapist_id,
      futureFilter.day
    );
  };

  return {
    futureBookings,
    futureTherapistSummary,
    futureDaySummary,
    futureFilter,
    setFutureFilter,
    loadFutureBookings,
    handleApplyFutureFilters,
  };
}
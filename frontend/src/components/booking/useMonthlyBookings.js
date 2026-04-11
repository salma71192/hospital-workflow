import { useState } from "react";
import api from "../../api/api";

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function getFirstDayOfMonthString() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
}

export default function useMonthlyBookings() {
  const [monthlyBookingsCount, setMonthlyBookingsCount] = useState(0);
  const [monthlyBookings, setMonthlyBookings] = useState([]);
  const [monthlyAgents, setMonthlyAgents] = useState([]);
  const [monthlyTherapists, setMonthlyTherapists] = useState([]);

  const [monthlyFilter, setMonthlyFilter] = useState({
    from_date: getFirstDayOfMonthString(),
    to_date: getTodayString(),
    user_id: "all",
    patient: "",
    therapist_id: "all",
  });

  const resetMonthlyState = () => {
    setMonthlyBookingsCount(0);
    setMonthlyBookings([]);
    setMonthlyAgents([]);
    setMonthlyTherapists([]);
  };

  const loadMonthlyBookings = async (
    fromDateValue = monthlyFilter.from_date,
    toDateValue = monthlyFilter.to_date,
    userIdValue = monthlyFilter.user_id,
    patientValue = monthlyFilter.patient,
    therapistIdValue = monthlyFilter.therapist_id
  ) => {
    try {
      const params = new URLSearchParams();

      if (fromDateValue) {
        params.append("from_date", fromDateValue);
      }

      if (toDateValue) {
        params.append("to_date", toDateValue);
      }

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
      setMonthlyTherapists(res.data.therapists || []);

      setMonthlyFilter((prev) => ({
        ...prev,
        from_date: res.data.from_date || fromDateValue,
        to_date: res.data.to_date || toDateValue,
      }));
    } catch (err) {
      console.error("Failed to load monthly bookings", err);
      resetMonthlyState();
    }
  };

  const handleApplyMonthlyFilters = async () => {
    await loadMonthlyBookings(
      monthlyFilter.from_date,
      monthlyFilter.to_date,
      monthlyFilter.user_id,
      monthlyFilter.patient,
      monthlyFilter.therapist_id
    );
  };

  return {
    monthlyBookingsCount,
    monthlyBookings,
    monthlyAgents,
    monthlyTherapists,
    monthlyFilter,
    setMonthlyFilter,
    loadMonthlyBookings,
    handleApplyMonthlyFilters,
  };
}
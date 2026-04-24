import { useState } from "react";
import api from "../../api/api";

function getFirstDayOfMonthString() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
}

function getLastDayOfMonthString() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0)
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
    to_date: getLastDayOfMonthString(),
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
      let safeFromDate = fromDateValue || getFirstDayOfMonthString();
      let safeToDate = toDateValue || getLastDayOfMonthString();

      if (safeFromDate > safeToDate) {
        safeToDate = safeFromDate;
      }

      const params = new URLSearchParams();
      params.append("mode", "monthly");
      params.append("from_date", safeFromDate);
      params.append("to_date", safeToDate);

      if (userIdValue && userIdValue !== "all") {
        params.append("user_id", userIdValue);
      }

      if (patientValue?.trim()) {
        params.append("patient", patientValue.trim());
      }

      if (therapistIdValue && therapistIdValue !== "all") {
        params.append("therapist_id", therapistIdValue);
      }

      const res = await api.get(
        `callcenter/bookings/tracker/?${params.toString()}`
      );

      setMonthlyBookingsCount(res.data.count || 0);
      setMonthlyBookings(res.data.bookings || []);
      setMonthlyAgents(res.data.agents || []);
      setMonthlyTherapists(res.data.therapists || []);

      setMonthlyFilter((prev) => ({
        ...prev,
        from_date: res.data.from_date || safeFromDate,
        to_date: res.data.to_date || safeToDate,
        user_id: userIdValue || "all",
        patient: patientValue?.trim() || "",
        therapist_id: therapistIdValue || "all",
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
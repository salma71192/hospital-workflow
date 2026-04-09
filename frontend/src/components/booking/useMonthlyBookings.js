import { useState } from "react";
import api from "../../api/api";
import { getMonthString } from "./bookingUtils";

export default function useMonthlyBookings() {
  const [monthlyBookingsCount, setMonthlyBookingsCount] = useState(0);
  const [monthlyBookings, setMonthlyBookings] = useState([]);
  const [monthlyAgents, setMonthlyAgents] = useState([]);

  const [monthlyFilter, setMonthlyFilter] = useState({
    month: getMonthString(),
    user_id: "all",
    patient: "",
    therapist_id: "all",
  });

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

  const handleApplyMonthlyFilters = async () => {
    await loadMonthlyBookings(
      monthlyFilter.month,
      monthlyFilter.user_id,
      monthlyFilter.patient,
      monthlyFilter.therapist_id
    );
  };

  return {
    monthlyBookingsCount,
    monthlyBookings,
    monthlyAgents,
    monthlyFilter,
    setMonthlyFilter,
    loadMonthlyBookings,
    handleApplyMonthlyFilters,
  };
}
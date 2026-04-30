import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../api/api";

function getCurrentMonthString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function useMonthlyBookings() {
  const latestFilterRef = useRef(null);

  const [monthlyBookingsCount, setMonthlyBookingsCount] = useState(0);
  const [monthlyBookings, setMonthlyBookings] = useState([]);
  const [monthlyAgents, setMonthlyAgents] = useState([]);
  const [monthlyTherapists, setMonthlyTherapists] = useState([]);

  const [monthlyFilter, setMonthlyFilter] = useState({
    month: getCurrentMonthString(),
    user_id: "all",
    patient: "",
    therapist_id: "all",
  });

  useEffect(() => {
    latestFilterRef.current = monthlyFilter;
  }, [monthlyFilter]);

  const resetMonthlyState = () => {
    setMonthlyBookingsCount(0);
    setMonthlyBookings([]);
  };

  const loadMonthlyBookings = useCallback(
    async (
      monthValue,
      userIdValue = "all",
      patientValue = "",
      therapistIdValue = "all"
    ) => {
      const safeMonth = monthValue || getCurrentMonthString();
      const safeUserId = userIdValue || "all";
      const safePatient = patientValue || "";
      const safeTherapistId = therapistIdValue || "all";

      try {
        const params = new URLSearchParams();

        params.append("mode", "monthly");
        params.append("month", safeMonth);

        if (safeUserId !== "all") {
          params.append("user_id", safeUserId);
        }

        if (safePatient.trim()) {
          params.append("patient", safePatient.trim());
        }

        if (safeTherapistId !== "all") {
          params.append("therapist_id", safeTherapistId);
        }

        const res = await api.get(
          `callcenter/bookings/tracker/?${params.toString()}`
        );

        setMonthlyBookingsCount(res.data.count || 0);
        setMonthlyBookings(res.data.bookings || []);

        // keep users loaded even if one response is missing agents
        if (res.data.agents) {
          setMonthlyAgents(res.data.agents || []);
        }

        if (res.data.therapists) {
          setMonthlyTherapists(res.data.therapists || []);
        }

        setMonthlyFilter({
          month: res.data.month || safeMonth,
          user_id: safeUserId,
          patient: safePatient.trim(),
          therapist_id: safeTherapistId,
        });
      } catch (err) {
        console.error("Failed to load monthly bookings", err);
        resetMonthlyState();
      }
    },
    []
  );

  const handleApplyMonthlyFilters = useCallback(async () => {
    const current = latestFilterRef.current || monthlyFilter;

    await loadMonthlyBookings(
      current.month,
      current.user_id,
      current.patient,
      current.therapist_id
    );
  }, [loadMonthlyBookings, monthlyFilter]);

  useEffect(() => {
    loadMonthlyBookings(
      monthlyFilter.month,
      monthlyFilter.user_id,
      monthlyFilter.patient,
      monthlyFilter.therapist_id
    );
  }, []);

  // realtime refresh without stale filter bugs
  useEffect(() => {
    const interval = setInterval(() => {
      const current = latestFilterRef.current;

      if (!current) return;

      loadMonthlyBookings(
        current.month,
        current.user_id,
        current.patient,
        current.therapist_id
      );
    }, 30000);

    return () => clearInterval(interval);
  }, [loadMonthlyBookings]);

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
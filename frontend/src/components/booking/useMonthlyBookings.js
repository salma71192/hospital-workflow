import { useCallback, useEffect, useState } from "react";
import api from "../../api/api";

/* ================= HELPERS ================= */

function getCurrentMonthString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/* ================= HOOK ================= */

export default function useMonthlyBookings() {
  const [monthlyBookingsCount, setMonthlyBookingsCount] = useState(0);
  const [monthlyBookings, setMonthlyBookings] = useState([]);
  const [monthlyAgents, setMonthlyAgents] = useState([]);
  const [monthlyTherapists, setMonthlyTherapists] = useState([]);

  const [monthlyFilter, setMonthlyFilter] = useState({
    month: getCurrentMonthString(), // ✅ NEW (YYYY-MM)
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

  /* ================= LOAD ================= */

  const loadMonthlyBookings = useCallback(
    async (
      monthValue = monthlyFilter.month,
      userIdValue = monthlyFilter.user_id,
      patientValue = monthlyFilter.patient,
      therapistIdValue = monthlyFilter.therapist_id
    ) => {
      try {
        const params = new URLSearchParams();

        params.append("mode", "monthly");
        params.append("month", monthValue); // ✅ IMPORTANT FIX

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

        // ✅ do NOT overwrite filter aggressively
        setMonthlyFilter((prev) => ({
          ...prev,
          month: res.data.month || monthValue,
          user_id: userIdValue || "all",
          patient: patientValue?.trim() || "",
          therapist_id: therapistIdValue || "all",
        }));
      } catch (err) {
        console.error("Failed to load monthly bookings", err);
        resetMonthlyState();
      }
    },
    [
      monthlyFilter.month,
      monthlyFilter.user_id,
      monthlyFilter.patient,
      monthlyFilter.therapist_id,
    ]
  );

  /* ================= APPLY ================= */

  const handleApplyMonthlyFilters = async () => {
    await loadMonthlyBookings(
      monthlyFilter.month,
      monthlyFilter.user_id,
      monthlyFilter.patient,
      monthlyFilter.therapist_id
    );
  };

  /* ================= INIT ================= */

  useEffect(() => {
    loadMonthlyBookings();
    // eslint-disable-next-line
  }, []);

  /* ================= REALTIME ================= */

  useEffect(() => {
    const interval = setInterval(() => {
      loadMonthlyBookings(
        monthlyFilter.month,
        monthlyFilter.user_id,
        monthlyFilter.patient,
        monthlyFilter.therapist_id
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [
    monthlyFilter.month,
    monthlyFilter.user_id,
    monthlyFilter.patient,
    monthlyFilter.therapist_id,
    loadMonthlyBookings,
  ]);

  /* ================= RETURN ================= */

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
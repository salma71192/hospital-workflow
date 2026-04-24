import { useState } from "react";
import api from "../../api/api";

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function getMonthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1)
    .toISOString()
    .split("T")[0];
}

function getMonthEnd() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
}

export default function useBookingManager() {
  const [mode, setMode] = useState("today");

  const [filter, setFilter] = useState({
    date: getToday(),
    from_date: getTomorrow(),
    to_date: "",
    therapist_id: "all",
    user_id: "all",
    patient: "",
  });

  const [data, setData] = useState({
    bookings: [],
    count: 0,
    agents: [],
    therapists: [],
    therapistSummary: [],
    daySummary: [],
  });

  const applyFilters = async () => {
    try {
      let url = "";
      const params = new URLSearchParams();

      if (mode === "today") {
        url = "callcenter/bookings/today/";
        params.append("date", filter.date);
      }

      if (mode === "future") {
        url = "callcenter/bookings/future/";
        params.append("from_date", filter.from_date);
        params.append("to_date", filter.to_date);
      }

      if (mode === "monthly") {
        url = "callcenter/bookings/monthly/";
        params.append("from_date", filter.from_date);
        params.append("to_date", filter.to_date);
      }

      if (filter.therapist_id !== "all") {
        params.append("therapist_id", filter.therapist_id);
      }

      if (filter.user_id !== "all") {
        params.append("user_id", filter.user_id);
      }

      if (filter.patient?.trim()) {
        params.append("patient", filter.patient.trim());
      }

      const res = await api.get(`${url}?${params.toString()}`);

      setData({
        bookings: res.data.bookings || [],
        count: res.data.count || 0,
        agents: res.data.agents || [],
        therapists: res.data.therapists || [],
        therapistSummary: res.data.therapist_summary || [],
        daySummary: res.data.day_summary || [],
      });
    } catch (err) {
      console.error("Booking load failed", err);
      setData({
        bookings: [],
        count: 0,
        agents: [],
        therapists: [],
        therapistSummary: [],
        daySummary: [],
      });
    }
  };

  return {
    mode,
    setMode,
    filter,
    setFilter,
    applyFilters,
    ...data,
  };
}
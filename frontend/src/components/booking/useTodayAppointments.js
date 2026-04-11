import { useState } from "react";
import api from "../../api/api";

export default function useTodayAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [count, setCount] = useState(0);

  const loadTodayAppointments = async () => {
    try {
      const res = await api.get("callcenter/bookings/today-appointments/");
      setAppointments(res.data.appointments || []);
      setCount(res.data.count || 0);
    } catch (err) {
      console.error("Failed to load today appointments", err);
      setAppointments([]);
      setCount(0);
    }
  };

  return {
    appointments,
    count,
    loadTodayAppointments,
  };
}
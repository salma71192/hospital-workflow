import { useEffect, useState } from "react";
import api from "../../api/api";

export default function useMyStats() {
  const [stats, setStats] = useState({ today: 0, monthly: 0 });

  const loadStats = async () => {
    try {
      const res = await api.get("callcenter/bookings/my-stats/");
      setStats(res.data);
    } catch {
      setStats({ today: 0, monthly: 0 });
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return stats;
}
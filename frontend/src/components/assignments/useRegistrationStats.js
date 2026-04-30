import { useEffect, useState } from "react";
import api from "../../api/api";

export default function useRegistrationStats() {
  const [stats, setStats] = useState({
    today: 0,
    monthly: 0,
    daily: [],
    therapists: [],
    categories: [],
    conversion: {
      appointment: 0,
      walk_in: 0,
      initial_eval: 0,
      total: 0,
    },
  });

  const loadStats = async () => {
    try {
      const res = await api.get("reception/my-stats/");

      setStats({
        today: res.data.today || 0,
        monthly: res.data.monthly || 0,
        daily: res.data.daily || [],
        therapists: res.data.therapists || [],
        categories: res.data.categories || [],
        conversion: res.data.conversion || {
          appointment: 0,
          walk_in: 0,
          initial_eval: 0,
          total: 0,
        },
      });
    } catch (err) {
      console.error("Failed to load registration stats", err);
    }
  };

  useEffect(() => {
    loadStats();

    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return stats;
}
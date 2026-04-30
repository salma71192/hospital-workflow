import { useEffect, useState } from "react";
import api from "../../api/api";

export default function useLeaderboard(scope = "reception") {
  const [leaderboard, setLeaderboard] = useState([]);

  const loadLeaderboard = async () => {
    try {
      const res = await api.get(`reception/leaderboard/?scope=${scope}`);
      setLeaderboard(res.data.leaderboard || []);
    } catch (err) {
      console.error("Failed to load leaderboard", err);
      setLeaderboard([]);
    }
  };

  useEffect(() => {
    loadLeaderboard();

    const interval = setInterval(loadLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [scope]);

  return leaderboard;
}
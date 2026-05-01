import { useEffect, useState, useCallback } from "react";
import api from "../../api/api";

export default function useLeaderboard(scope = "reception") {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get(
        `reception/leaderboard/?scope=${scope}`
      );

      setLeaderboard(res.data?.leaderboard || []);
    } catch (err) {
      console.error("Failed to load leaderboard", err);
      setLeaderboard([]);
      setError("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    loadLeaderboard();

    const interval = setInterval(() => {
      loadLeaderboard();
    }, 30000); // refresh every 30s

    return () => clearInterval(interval);
  }, [loadLeaderboard]);

  return {
    leaderboard,
    loading,
    error,
    reload: loadLeaderboard,
  };
}
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
        `/reception/leaderboard/?scope=${scope}`
      );

      // DEBUG LOG
      console.log("Leaderboard response:", res.data);

      setLeaderboard(res.data?.leaderboard || []);
    } catch (err) {
      console.error("❌ Leaderboard failed:", err);

      const status = err?.response?.status;
      const data = err?.response?.data;

      console.log("Status:", status);
      console.log("Error data:", data);

      setLeaderboard([]);

      setError(
        data?.error ||
        data?.detail ||
        `Failed to load leaderboard${status ? ` (${status})` : ""}`
      );
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    loadLeaderboard();

    const interval = setInterval(() => {
      loadLeaderboard();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadLeaderboard]);

  return {
    leaderboard,
    loading,
    error,
    reload: loadLeaderboard,
  };
}
import React, { useCallback, useEffect, useState } from "react";
import api from "../../api/api";
import PhysioStatisticsTable from "../booking/PhysioStatisticsTable";

export default function AdminStatisticsSection() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadStats = useCallback(async (filters = {}) => {
    try {
      setLoading(true);

      const mode = filters.mode || "day";
      const params = new URLSearchParams();

      if (mode === "month") {
        if (filters.month) {
          params.append("month", filters.month);
        }
        if (filters.therapist_id && filters.therapist_id !== "all") {
          params.append("therapist_id", filters.therapist_id);
        }

        const res = await api.get(
          `callcenter/bookings/monthly-statistics/?${params.toString()}`
        );

        setStats({
          rows: res.data.rows || [],
          totals: res.data.totals || null,
          date: res.data.date || "",
        });
      } else {
        if (filters.date) {
          params.append("date", filters.date);
        }
        if (filters.therapist_id && filters.therapist_id !== "all") {
          params.append("therapist_id", filters.therapist_id);
        }

        const res = await api.get(
          `callcenter/bookings/today-statistics/?${params.toString()}`
        );

        setStats({
          rows: res.data.rows || [],
          totals: res.data.totals || null,
          date: res.data.date || "",
        });
      }
    } catch (err) {
      console.error("Failed to load statistics", err);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats({
      mode: "day",
      date: new Date().toISOString().split("T")[0],
      therapist_id: "all",
    });
  }, [loadStats]);

  if (loading && !stats) {
    return (
      <div style={styles.loadingCard}>
        <div style={styles.loadingTitle}>Loading statistics...</div>
      </div>
    );
  }

  return (
    <PhysioStatisticsTable
      stats={stats}
      title="Physio Statistics"
      onChangeFilters={loadStats}
      isLoading={loading}
    />
  );
}

const styles = {
  loadingCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "18px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.04)",
  },
  loadingTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#475569",
  },
};
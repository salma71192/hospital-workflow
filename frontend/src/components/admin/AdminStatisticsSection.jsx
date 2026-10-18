
import React, { useCallback, useEffect, useState } from "react";
import api from "../../api/api";
import PhysioStatisticsTable from "../booking/PhysioStatisticsTable";

export default function AdminStatisticsSection() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async (filters = {}) => {
    try {
      setLoading(true);

      const mode = filters.mode || "day";
      const params = new URLSearchParams();

      if (mode === "month") {
        if (filters.month) {
          params.append("month", filters.month);
        }
      } else if (filters.date) {
        params.append("date", filters.date);
      }

      if (
        filters.therapist_id &&
        filters.therapist_id !== "all"
      ) {
        params.append("therapist_id", filters.therapist_id);
      }

      const endpoint =
        mode === "month"
          ? "callcenter/bookings/monthly-statistics/"
          : "callcenter/bookings/today-statistics/";

      const query = params.toString();
      const url = query ? `${endpoint}?${query}` : endpoint;

      const response = await api.get(url);

      setStats({
        rows: response.data.rows || [],
        totals: response.data.totals || null,
        date: response.data.date || "",
      });
    } catch (error) {
      console.error("Failed to load statistics:", error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const today = new Date().toLocaleDateString("en-CA");

    loadStats({
      mode: "day",
      date: today,
      month: today.slice(0, 7),
      therapist_id: "all",
    });
  }, [loadStats]);

  const totals = stats?.totals || {};
  const rows = stats?.rows || [];

  const summaryCards = [
    {
      label: "Physiotherapists",
      value: rows.length,
      description: "Included in this report",
      icon: "👥",
      color: "#047857",
      background: "#ecfdf5",
    },
    {
      label: "Available Slots",
      value: totals.available_slots ?? 0,
      description: "Total available capacity",
      icon: "📅",
      color: "#2563eb",
      background: "#eff6ff",
    },
    {
      label: "Booked Appointments",
      value: totals.booked ?? 0,
      description: "Total booked slots",
      icon: "✓",
      color: "#7c3aed",
      background: "#f5f3ff",
    },
    {
      label: "Walk-ins",
      value: totals.walk_in ?? 0,
      description: "Walk-in patients",
      icon: "↗",
      color: "#c2410c",
      background: "#fff7ed",
    },
  ];

  if (loading && !stats) {
    return (
      <div style={styles.loadingCard}>
        <div style={styles.loadingSpinner}>⟳</div>
        <div style={styles.loadingTitle}>
          Loading physiotherapy statistics...
        </div>
        <div style={styles.loadingSubtitle}>
          Please wait while the report is prepared.
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerIcon}>▥</div>

        <div style={styles.headerText}>
          <h2 style={styles.heading}>
            Physiotherapy Statistics
          </h2>
          <p style={styles.subtitle}>
            Overview of physiotherapy booking activity across the team
          </p>
        </div>

        <div style={styles.statusBadge}>
          <span style={styles.statusDot} />
          Admin Overview
        </div>
      </div>

      {loading && (
        <div style={styles.updatingMessage}>
          <span style={styles.statusDot} />
          Updating statistics...
        </div>
      )}

      {stats ? (
        <>
          <div style={styles.summaryGrid}>
            {summaryCards.map((card) => (
              <div
                key={card.label}
                style={styles.summaryCard}
              >
                <div style={styles.cardTop}>
                  <div
                    style={{
                      ...styles.cardIcon,
                      background: card.background,
                      color: card.color,
                    }}
                  >
                    {card.icon}
                  </div>

                  <span style={styles.cardAccent} />
                </div>

                <div style={styles.cardValue}>
                  {Number(card.value).toLocaleString()}
                </div>

                <div style={styles.cardLabel}>
                  {card.label}
                </div>

                <div style={styles.cardDescription}>
                  {card.description}
                </div>
              </div>
            ))}
          </div>

          <div style={styles.tableCard}>
            <div style={styles.tableHeader}>
              <div>
                <h3 style={styles.tableTitle}>
                  Team Statistics
                </h3>
                <p style={styles.tableSubtitle}>
                  Detailed performance for each physiotherapist
                </p>
              </div>

              <div style={styles.teamCount}>
                {rows.length}{" "}
                {rows.length === 1 ? "therapist" : "therapists"}
              </div>
            </div>

            <div style={styles.tableContent}>
              <PhysioStatisticsTable
                stats={stats}
                title="All Physiotherapists Statistics"
              />
            </div>
          </div>
        </>
      ) : (
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>!</div>
          <h3 style={styles.errorTitle}>
            Statistics unavailable
          </h3>
          <p style={styles.errorText}>
            The statistics could not be loaded. Please try again.
          </p>
          <button
            type="button"
            style={styles.retryButton}
            onClick={() => {
              const today = new Date().toLocaleDateString("en-CA");
              loadStats({
                mode: "day",
                date: today,
                month: today.slice(0, 7),
                therapist_id: "all",
              });
            }}
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    color: "#0f172a",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
    padding: "22px",
    background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
    border: "1px solid #d1fae5",
    borderRadius: "20px",
    boxShadow: "0 5px 18px rgba(15, 23, 42, 0.04)",
  },

  headerIcon: {
    width: "50px",
    height: "50px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "15px",
    background: "#047857",
    color: "#ffffff",
    fontSize: "27px",
    fontWeight: "700",
  },

  headerText: {
    flex: "1 1 220px",
    minWidth: 0,
  },

  heading: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "800",
    letterSpacing: "-0.5px",
    color: "#064e3b",
  },

  subtitle: {
    margin: "6px 0 0",
    fontSize: "13px",
    lineHeight: 1.6,
    color: "#64748b",
  },

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "9px 12px",
    borderRadius: "999px",
    background: "#dcfce7",
    color: "#166534",
    fontSize: "12px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  statusDot: {
    width: "8px",
    height: "8px",
    display: "inline-block",
    borderRadius: "50%",
    background: "#16a34a",
    flexShrink: 0,
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "16px",
  },

  summaryCard: {
    minWidth: 0,
    padding: "20px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    boxShadow: "0 5px 18px rgba(15, 23, 42, 0.04)",
  },

  cardTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "18px",
  },

  cardIcon: {
    width: "43px",
    height: "43px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "13px",
    fontSize: "22px",
    fontWeight: "800",
  },

  cardAccent: {
    width: "30px",
    height: "4px",
    borderRadius: "10px",
    background: "#d1fae5",
  },

  cardValue: {
    fontSize: "30px",
    lineHeight: 1.2,
    fontWeight: "800",
    letterSpacing: "-0.7px",
    color: "#0f172a",
    overflowWrap: "anywhere",
  },

  cardLabel: {
    marginTop: "8px",
    fontSize: "14px",
    fontWeight: "700",
    color: "#334155",
  },

  cardDescription: {
    marginTop: "5px",
    fontSize: "12px",
    color: "#94a3b8",
    lineHeight: 1.5,
  },

  updatingMessage: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "8px",
    fontSize: "12px",
    color: "#64748b",
  },

  tableCard: {
    minWidth: 0,
    overflow: "hidden",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    boxShadow: "0 5px 18px rgba(15, 23, 42, 0.04)",
  },

  tableHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
    padding: "22px",
    borderBottom: "1px solid #e2e8f0",
    background: "#ffffff",
  },

  tableTitle: {
    margin: 0,
    fontSize: "17px",
    fontWeight: "800",
    color: "#0f172a",
  },

  tableSubtitle: {
    margin: "6px 0 0",
    fontSize: "12px",
    lineHeight: 1.5,
    color: "#64748b",
  },

  teamCount: {
    padding: "8px 12px",
    borderRadius: "10px",
    background: "#f0fdf4",
    color: "#047857",
    fontSize: "12px",
    fontWeight: "700",
  },

  tableContent: {
    width: "100%",
    minWidth: 0,
    padding: "8px",
    overflowX: "auto",
  },

  loadingCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    minHeight: "180px",
    padding: "28px",
    background: "#ffffff",
    border: "1px solid #d1fae5",
    borderRadius: "20px",
    boxShadow: "0 5px 18px rgba(15, 23, 42, 0.04)",
  },

  loadingSpinner: {
    fontSize: "32px",
    color: "#047857",
  },

  loadingTitle: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#047857",
  },

  loadingSubtitle: {
    fontSize: "12px",
    color: "#64748b",
    textAlign: "center",
  },

  errorCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    padding: "30px 20px",
    background: "#ffffff",
    border: "1px solid #fee2e2",
    borderRadius: "18px",
    textAlign: "center",
  },

  errorIcon: {
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "#fee2e2",
    color: "#b91c1c",
    fontSize: "22px",
    fontWeight: "800",
  },

  errorTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "800",
    color: "#991b1b",
  },

  errorText: {
    margin: 0,
    fontSize: "13px",
    color: "#64748b",
  },

  retryButton: {
    marginTop: "6px",
    padding: "10px 16px",
    border: "none",
    borderRadius: "10px",
    background: "#047857",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },
};

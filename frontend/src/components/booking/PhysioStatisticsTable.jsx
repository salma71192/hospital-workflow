import React, { useEffect, useMemo, useState } from "react";

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function getCurrentMonthString() {
  const now = new Date();
  return `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, "0")}`;
}

function getProgressColor(percent) {
  if (percent >= 75) return "#16a34a";
  if (percent >= 50) return "#3b82f6";
  if (percent >= 25) return "#f59e0b";
  return "#ef4444";
}

function getPillStyle(percent) {
  if (percent >= 75) {
    return {
      background: "#ecfdf5",
      color: "#166534",
      border: "1px solid #bbf7d0",
    };
  }

  if (percent >= 50) {
    return {
      background: "#eff6ff",
      color: "#1d4ed8",
      border: "1px solid #dbeafe",
    };
  }

  if (percent >= 25) {
    return {
      background: "#fffbeb",
      color: "#b45309",
      border: "1px solid #fde68a",
    };
  }

  return {
    background: "#fef2f2",
    color: "#991b1b",
    border: "1px solid #fecaca",
  };
}

function getTrendInfo(value) {
  const safeValue = Number(value || 0);

  if (safeValue > 0) {
    return {
      arrow: "▲",
      label: `+${safeValue}`,
      color: "#166534",
      background: "#ecfdf5",
      border: "#bbf7d0",
    };
  }

  if (safeValue < 0) {
    return {
      arrow: "▼",
      label: `${safeValue}`,
      color: "#b91c1c",
      background: "#fef2f2",
      border: "#fecaca",
    };
  }

  return {
    arrow: "■",
    label: "0",
    color: "#475569",
    background: "#f8fafc",
    border: "#e2e8f0",
  };
}

export default function PhysioStatisticsTable({
  stats,
  title = "Physio Statistics",
  onChangeFilters,
  isLoading = false,
}) {
  const rows = Array.isArray(stats?.rows) ? stats.rows : [];
  const totals = stats?.totals || null;
  const dateLabel = stats?.date || "";

  const [viewMode, setViewMode] = useState("day");
  const [selectedDay, setSelectedDay] = useState(getTodayString());
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString());
  const [selectedPhysio, setSelectedPhysio] = useState("all");
  const [collapsedRows, setCollapsedRows] = useState({});

  useEffect(() => {
    const next = {};
    rows.forEach((row) => {
      const key = String(row?.therapist_id || row?.therapist_name || "");
      next[key] = true;
    });
    setCollapsedRows(next);
  }, [rows]);

  useEffect(() => {
    if (typeof onChangeFilters === "function") {
      onChangeFilters({
        mode: viewMode,
        date: selectedDay,
        month: selectedMonth,
        therapist_id: selectedPhysio,
      });
    }
  }, [viewMode, selectedDay, selectedMonth, selectedPhysio, onChangeFilters]);

  const physioOptions = useMemo(() => {
    const map = new Map();

    rows.forEach((row) => {
      const id = String(row?.therapist_id || "");
      const name = row?.therapist_name || "-";
      if (id && !map.has(id)) {
        map.set(id, { id, name });
      }
    });

    return Array.from(map.values());
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (selectedPhysio === "all") return rows;

    return rows.filter(
      (row) => String(row?.therapist_id) === String(selectedPhysio)
    );
  }, [rows, selectedPhysio]);

  const filteredTotals = useMemo(() => {
    if (!filteredRows.length) return totals;

    return filteredRows.reduce(
      (acc, row) => {
        acc.available_slots += Number(row?.available_slots || 0);
        acc.booked += Number(row?.booked || 0);
        acc.walk_in += Number(row?.walk_in || 0);
        acc.seen += Number(row?.seen || 0);
        acc.initial_eval += Number(row?.initial_eval || 0);
        acc.no_show += Number(row?.no_show || 0);
        return acc;
      },
      {
        available_slots: 0,
        booked: 0,
        walk_in: 0,
        seen: 0,
        initial_eval: 0,
        no_show: 0,
      }
    );
  }, [filteredRows, totals]);

  const toggleRow = (rowKey) => {
    setCollapsedRows((prev) => ({
      ...prev,
      [rowKey]: !prev[rowKey],
    }));
  };

  const handleExpandAll = () => {
    const next = {};
    filteredRows.forEach((row) => {
      const key = String(row?.therapist_id || row?.therapist_name || "");
      next[key] = false;
    });
    setCollapsedRows((prev) => ({ ...prev, ...next }));
  };

  const handleCollapseAll = () => {
    const next = {};
    filteredRows.forEach((row) => {
      const key = String(row?.therapist_id || row?.therapist_name || "");
      next[key] = true;
    });
    setCollapsedRows((prev) => ({ ...prev, ...next }));
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>{title}</div>
          {dateLabel ? <div style={styles.subtext}>{dateLabel}</div> : null}
        </div>

        <div style={styles.headerRight}>
          {isLoading ? <div style={styles.loadingBadge}>Refreshing...</div> : null}
          <div style={styles.badge}>{filteredRows.length} Physio</div>
        </div>
      </div>

      <div style={styles.filterBar}>
        <div style={styles.modeButtons}>
          <button
            type="button"
            style={{
              ...styles.modeBtn,
              ...(viewMode === "day" ? styles.modeBtnActive : {}),
            }}
            onClick={() => setViewMode("day")}
          >
            Day
          </button>

          <button
            type="button"
            style={{
              ...styles.modeBtn,
              ...(viewMode === "month" ? styles.modeBtnActive : {}),
            }}
            onClick={() => setViewMode("month")}
          >
            Month
          </button>
        </div>

        {viewMode === "day" ? (
          <input
            type="date"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            style={styles.input}
          />
        ) : (
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={styles.input}
          />
        )}

        <select
          value={selectedPhysio}
          onChange={(e) => setSelectedPhysio(e.target.value)}
          style={styles.input}
        >
          <option value="all">All Physio</option>
          {physioOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <div style={styles.actionBtns}>
          <button
            type="button"
            style={styles.secondaryBtn}
            onClick={handleExpandAll}
          >
            Expand All
          </button>

          <button
            type="button"
            style={styles.secondaryBtn}
            onClick={handleCollapseAll}
          >
            Collapse All
          </button>
        </div>
      </div>

      {filteredTotals ? (
        <div style={styles.totalCard}>
          <div style={styles.totalTop}>
            <div>
              <div style={styles.totalTitle}>Total</div>
              <div style={styles.totalSubtitle}>
                Summary for current filters
              </div>
            </div>
          </div>

          <div style={styles.statsGrid}>
            <MiniStat label="Available" value={filteredTotals.available_slots} />
            <MiniStat label="Booked" value={filteredTotals.booked} />
            <MiniStat label="Walk In" value={filteredTotals.walk_in} />
            <MiniStat label="Seen" value={filteredTotals.seen} />
            <MiniStat label="Initial Eval" value={filteredTotals.initial_eval} />
            <MiniStat label="No Show" value={filteredTotals.no_show} />
          </div>
        </div>
      ) : null}

      {!filteredRows.length ? (
        <div style={styles.emptyState}>No statistics available.</div>
      ) : (
        <div style={styles.rowsWrap}>
          {filteredRows.map((row) => {
            const available = Number(row?.available_slots || 0);
            const booked = Number(row?.booked || 0);
            const walkIn = Number(row?.walk_in || 0);
            const seen = Number(row?.seen || 0);
            const initialEval = Number(row?.initial_eval || 0);
            const noShow = Number(row?.no_show || 0);
            const trendBooked = Number(row?.trend_booked || 0);
            const capacityWarning = Boolean(row?.capacity_warning);

            const bookedPercent =
              available > 0
                ? Math.min(100, Math.round((booked / available) * 100))
                : 0;

            const rowKey = String(
              row?.therapist_id || row?.therapist_name || ""
            );
            const isCollapsed = collapsedRows[rowKey] ?? true;
            const trend = getTrendInfo(trendBooked);

            return (
              <div key={rowKey} style={styles.rowCard}>
                <button
                  type="button"
                  onClick={() => toggleRow(rowKey)}
                  style={styles.rowToggle}
                >
                  <div style={styles.rowLeft}>
                    <div style={styles.rowTitleLine}>
                      <div style={styles.name}>{row?.therapist_name || "-"}</div>

                      {capacityWarning ? (
                        <div style={styles.warningBadge}>Near Full</div>
                      ) : null}
                    </div>

                    <div style={styles.metaRow}>
                      <div style={styles.meta}>
                        {booked} booked out of {available} slots
                      </div>

                      <div
                        style={{
                          ...styles.trendBadge,
                          color: trend.color,
                          background: trend.background,
                          borderColor: trend.border,
                        }}
                      >
                        <span style={styles.trendArrow}>{trend.arrow}</span>
                        <span>{trend.label} vs previous</span>
                      </div>
                    </div>
                  </div>

                  <div style={styles.rowTopRight}>
                    <div
                      style={{
                        ...styles.percentPill,
                        ...getPillStyle(bookedPercent),
                      }}
                    >
                      {bookedPercent}%
                    </div>

                    <div
                      style={{
                        ...styles.chevronWrap,
                        ...(isCollapsed ? {} : styles.chevronWrapOpen),
                      }}
                    >
                      <div style={styles.chevron}>❯</div>
                    </div>
                  </div>
                </button>

                {!isCollapsed ? (
                  <>
                    <div style={styles.progressTrack}>
                      <div
                        style={{
                          ...styles.progressFill,
                          width: `${bookedPercent}%`,
                          background: getProgressColor(bookedPercent),
                        }}
                      />
                    </div>

                    <div style={styles.statsGrid}>
                      <MiniStat label="Available" value={available} />
                      <MiniStat label="Booked" value={booked} />
                      <MiniStat label="Walk In" value={walkIn} />
                      <MiniStat label="Seen" value={seen} />
                      <MiniStat label="Initial Eval" value={initialEval} />
                      <MiniStat label="No Show" value={noShow} />
                    </div>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "18px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.04)",
    display: "grid",
    gap: "16px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    flexWrap: "wrap",
  },
  headerRight: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  title: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f172a",
  },
  subtext: {
    marginTop: "4px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#64748b",
  },
  badge: {
    background: "#f8fafc",
    color: "#334155",
    border: "1px solid #e2e8f0",
    borderRadius: "999px",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },
  loadingBadge: {
    background: "#fffbeb",
    color: "#b45309",
    border: "1px solid #fde68a",
    borderRadius: "999px",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },
  filterBar: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  modeButtons: {
    display: "flex",
    gap: "8px",
  },
  modeBtn: {
    background: "#fff",
    color: "#475569",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  modeBtnActive: {
    background: "#f8fafc",
    color: "#0f172a",
    borderColor: "#94a3b8",
  },
  input: {
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    background: "#fff",
    outline: "none",
    minWidth: "150px",
  },
  actionBtns: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  secondaryBtn: {
    background: "#f8fafc",
    color: "#0f172a",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  rowsWrap: {
    display: "grid",
    gap: "12px",
  },
  rowCard: {
    background: "#fcfcfd",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "14px",
    display: "grid",
    gap: "12px",
  },
  rowToggle: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    background: "transparent",
    border: "none",
    padding: 0,
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
  },
  rowLeft: {
    display: "grid",
    gap: "8px",
    flex: 1,
    minWidth: "240px",
  },
  rowTitleLine: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  rowTopRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  name: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a",
  },
  metaRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  meta: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: "600",
  },
  trendBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "5px 10px",
    borderRadius: "999px",
    border: "1px solid",
    fontSize: "12px",
    fontWeight: "800",
  },
  trendArrow: {
    fontSize: "12px",
    lineHeight: 1,
  },
  warningBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 10px",
    borderRadius: "999px",
    background: "#fff7ed",
    color: "#c2410c",
    border: "1px solid #fdba74",
    fontSize: "12px",
    fontWeight: "800",
  },
  percentPill: {
    minWidth: "60px",
    height: "32px",
    padding: "0 12px",
    borderRadius: "999px",
    fontSize: "14px",
    fontWeight: "800",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  chevronWrap: {
    width: "42px",
    height: "42px",
    borderRadius: "999px",
    background: "#e2e8f0",
    border: "1px solid #cbd5e1",
    boxShadow: "0 2px 6px rgba(15, 23, 42, 0.08)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.2s ease, background 0.2s ease",
    flexShrink: 0,
  },
  chevronWrapOpen: {
    transform: "rotate(90deg)",
    background: "#cbd5e1",
  },
  chevron: {
    color: "#0f172a",
    fontSize: "20px",
    fontWeight: "900",
    lineHeight: 1,
    marginLeft: "2px",
  },
  progressTrack: {
    width: "100%",
    height: "12px",
    borderRadius: "999px",
    background: "#e2e8f0",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: "999px",
    transition: "width 0.25s ease",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "10px",
  },
  statCard: {
    background: "#ffffff",
    border: "1px solid #eef2f7",
    borderRadius: "12px",
    padding: "10px 12px",
    display: "grid",
    gap: "4px",
  },
  statLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: 1.1,
  },
  totalCard: {
    background: "#fafafa",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "14px",
    display: "grid",
    gap: "12px",
  },
  totalTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  totalTitle: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a",
  },
  totalSubtitle: {
    marginTop: "4px",
    fontSize: "13px",
    color: "#64748b",
    fontWeight: "600",
  },
  emptyState: {
    padding: "18px",
    borderRadius: "12px",
    background: "#fafafa",
    color: "#64748b",
    border: "1px dashed #d1d5db",
    fontWeight: "600",
  },
};
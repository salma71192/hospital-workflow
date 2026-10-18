
import React, { useEffect, useMemo, useState } from "react";

function getTodayString() {
  const now = new Date();
  const localDate = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  );
  return localDate.toISOString().split("T")[0];
}

function getCurrentMonthString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
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
  const [selectedMonth, setSelectedMonth] = useState(
    getCurrentMonthString()
  );
  const [selectedPhysio, setSelectedPhysio] = useState("all");

  useEffect(() => {
    if (typeof onChangeFilters === "function") {
      onChangeFilters({
        mode: viewMode,
        date: selectedDay,
        month: selectedMonth,
        therapist_id: selectedPhysio,
      });
    }
  }, [
    viewMode,
    selectedDay,
    selectedMonth,
    selectedPhysio,
    onChangeFilters,
  ]);

  const physioOptions = useMemo(() => {
    const map = new Map();

    rows.forEach((row) => {
      const id = String(row?.therapist_id || "");

      if (id && !map.has(id)) {
        map.set(id, {
          id,
          name: row?.therapist_name || "-",
        });
      }
    });

    return Array.from(map.values());
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (selectedPhysio === "all") return rows;

    return rows.filter(
      (row) =>
        String(row?.therapist_id) === String(selectedPhysio)
    );
  }, [rows, selectedPhysio]);

  const calculatedTotals = useMemo(() => {
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

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>{title}</h2>
          <p style={styles.subtitle}>
            All physiotherapists and their statistics
            {dateLabel ? ` · ${dateLabel}` : ""}
          </p>
        </div>

        <div style={styles.headerRight}>
          {isLoading && (
            <span style={styles.loadingBadge}>Updating...</span>
          )}

          <span style={styles.countBadge}>
            {filteredRows.length}{" "}
            {filteredRows.length === 1 ? "Therapist" : "Therapists"}
          </span>
        </div>
      </div>

      <div style={styles.filters}>
        <div style={styles.modeButtons}>
          <button
            type="button"
            onClick={() => setViewMode("day")}
            style={{
              ...styles.modeButton,
              ...(viewMode === "day" ? styles.activeMode : {}),
            }}
          >
            Daily
          </button>

          <button
            type="button"
            onClick={() => setViewMode("month")}
            style={{
              ...styles.modeButton,
              ...(viewMode === "month" ? styles.activeMode : {}),
            }}
          >
            Monthly
          </button>
        </div>

        <label style={styles.field}>
          <span style={styles.fieldLabel}>
            {viewMode === "day" ? "Date" : "Month"}
          </span>

          <input
            type={viewMode === "day" ? "date" : "month"}
            value={viewMode === "day" ? selectedDay : selectedMonth}
            onChange={(event) =>
              viewMode === "day"
                ? setSelectedDay(event.target.value)
                : setSelectedMonth(event.target.value)
            }
            style={styles.input}
          />
        </label>

        <label style={styles.field}>
          <span style={styles.fieldLabel}>Physiotherapist</span>

          <select
            value={selectedPhysio}
            onChange={(event) =>
              setSelectedPhysio(event.target.value)
            }
            style={styles.input}
          >
            <option value="all">All physiotherapists</option>

            {physioOptions.map((physio) => (
              <option key={physio.id} value={physio.id}>
                {physio.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {calculatedTotals && (
        <div style={styles.summary}>
          <div style={styles.summaryTitle}>Team totals</div>

          <div style={styles.summaryGrid}>
            <SummaryItem
              label="Available"
              value={calculatedTotals.available_slots}
            />
            <SummaryItem
              label="Booked"
              value={calculatedTotals.booked}
            />
            <SummaryItem
              label="Walk-ins"
              value={calculatedTotals.walk_in}
            />
            <SummaryItem
              label="Seen"
              value={calculatedTotals.seen}
            />
            <SummaryItem
              label="Initial evaluations"
              value={calculatedTotals.initial_eval}
            />
            <SummaryItem
              label="No-shows"
              value={calculatedTotals.no_show}
            />
          </div>
        </div>
      )}

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, ...styles.nameColumn }}>
                Physiotherapist
              </th>
              <th style={styles.th}>Available</th>
              <th style={styles.th}>Booked</th>
              <th style={styles.th}>Walk-ins</th>
              <th style={styles.th}>Initial Eval</th>
              <th style={styles.th}>No-shows</th>
              <th style={styles.th}>Seen</th>
            </tr>
          </thead>

          <tbody>
            {filteredRows.map((row, index) => {
              const available = Number(row?.available_slots || 0);
              const booked = Number(row?.booked || 0);

              return (
                <tr
                  key={
                    row?.therapist_id ||
                    `${row?.therapist_name || "therapist"}-${index}`
                  }
                  style={
                    index % 2 === 0
                      ? styles.evenRow
                      : styles.oddRow
                  }
                >
                  <td style={{ ...styles.td, ...styles.nameColumn }}>
                    <div style={styles.therapistName}>
                      <span style={styles.avatar}>
                        {(row?.therapist_name || "-")
                          .trim()
                          .charAt(0)
                          .toUpperCase()}
                      </span>

                      <span>{row?.therapist_name || "-"}</span>
                    </div>
                  </td>

                  <td style={styles.td}>{available}</td>

                  <td style={styles.td}>
                    <strong>{booked}</strong>
                  </td>

                  <td style={styles.td}>
                    {Number(row?.walk_in || 0)}
                  </td>

                  <td style={styles.td}>
                    {Number(row?.initial_eval || 0)}
                  </td>

                  <td style={styles.td}>
                    {Number(row?.no_show || 0)}
                  </td>

                  <td style={styles.td}>
                    {Number(row?.seen || 0)}
                  </td>
                </tr>
              );
            })}

            {!filteredRows.length && (
              <tr>
                <td colSpan={7} style={styles.emptyCell}>
                  {isLoading
                    ? "Loading statistics..."
                    : "No statistics available for the selected filters."}
                </td>
              </tr>
            )}
          </tbody>

          {calculatedTotals && filteredRows.length > 0 && (
            <tfoot>
              <tr style={styles.totalRow}>
                <td style={{ ...styles.td, ...styles.nameColumn }}>
                  Team total
                </td>

                <td style={styles.td}>
                  {calculatedTotals.available_slots}
                </td>

                <td style={styles.td}>
                  {calculatedTotals.booked}
                </td>

                <td style={styles.td}>
                  {calculatedTotals.walk_in}
                </td>

                <td style={styles.td}>
                  {calculatedTotals.initial_eval}
                </td>

                <td style={styles.td}>
                  {calculatedTotals.no_show}
                </td>

                <td style={styles.td}>
                  {calculatedTotals.seen}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div style={styles.summaryItem}>
      <span style={styles.summaryLabel}>{label}</span>
      <strong style={styles.summaryValue}>
        {Number(value || 0).toLocaleString()}
      </strong>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    padding: "20px",
    borderRadius: "18px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    boxShadow: "0 5px 18px rgba(15, 23, 42, 0.05)",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    fontSize: "21px",
    fontWeight: 800,
    color: "#1e293b",
  },

  subtitle: {
    margin: "6px 0 0",
    fontSize: "12px",
    color: "#64748b",
    lineHeight: 1.6,
  },

  headerRight: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap",
  },

  countBadge: {
    padding: "8px 12px",
    borderRadius: "9px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: 800,
  },

  loadingBadge: {
    padding: "8px 12px",
    borderRadius: "9px",
    background: "#fffbeb",
    color: "#92400e",
    fontSize: "12px",
    fontWeight: 700,
  },

  filters: {
    display: "flex",
    alignItems: "end",
    gap: "12px",
    flexWrap: "wrap",
    padding: "15px",
    borderRadius: "13px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },

  modeButtons: {
    display: "flex",
    gap: "5px",
    padding: "4px",
    background: "#e2e8f0",
    borderRadius: "10px",
  },

  modeButton: {
    padding: "9px 15px",
    border: "none",
    borderRadius: "7px",
    background: "transparent",
    color: "#475569",
    fontWeight: 700,
    fontSize: "12px",
    cursor: "pointer",
  },

  activeMode: {
    background: "#2563eb",
    color: "#ffffff",
  },

  field: {
    display: "grid",
    gap: "6px",
    minWidth: "170px",
    flex: "1 1 170px",
  },

  fieldLabel: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#475569",
  },

  input: {
    boxSizing: "border-box",
    width: "100%",
    minWidth: 0,
    height: "40px",
    padding: "0 10px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: "12px",
  },

  summary: {
    display: "grid",
    gap: "12px",
    padding: "16px",
    borderRadius: "13px",
    border: "1px solid #dbeafe",
    background: "#f8fafc",
  },

  summaryTitle: {
    fontSize: "14px",
    fontWeight: 800,
    color: "#1e293b",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
    gap: "10px",
  },

  summaryItem: {
    display: "grid",
    gap: "7px",
    padding: "12px",
    borderRadius: "10px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
  },

  summaryLabel: {
    fontSize: "11px",
    color: "#64748b",
    fontWeight: 600,
  },

  summaryValue: {
    fontSize: "22px",
    color: "#2563eb",
    fontWeight: 800,
  },

  tableContainer: {
    width: "100%",
    overflowX: "auto",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },

  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    fontSize: "12px",
    textAlign: "left",
    whiteSpace: "nowrap",
  },

  th: {
    padding: "14px 13px",
    background: "#f1f5f9",
    color: "#334155",
    fontSize: "10px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.4px",
    borderBottom: "1px solid #e2e8f0",
  },

  nameColumn: {
    position: "sticky",
    left: 0,
    zIndex: 1,
    minWidth: "200px",
  },

  td: {
    padding: "13px",
    color: "#334155",
    borderBottom: "1px solid #eef2f7",
    verticalAlign: "middle",
  },

  evenRow: {
    background: "#ffffff",
  },

  oddRow: {
    background: "#f8fafc",
  },

  therapistName: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    fontWeight: 700,
    color: "#1e293b",
  },

  avatar: {
    width: "30px",
    height: "30px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderRadius: "9px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontWeight: 800,
    fontSize: "12px",
  },

  totalRow: {
    background: "#eff6ff",
    fontWeight: 800,
  },

  emptyCell: {
    padding: "28px 16px",
    textAlign: "center",
    color: "#64748b",
  },
};

import React, { useCallback, useEffect, useState } from "react";
import api from "../../api/api";
const MONTHLY_EVALUATION_TARGET = 30;
const DAILY_EVALUATION_TARGET = 4;
function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function getTodayString() {
  return formatLocalDate(new Date());
}
function getFirstDayOfMonthString() {
  const now = new Date();
  return formatLocalDate(
    new Date(now.getFullYear(), now.getMonth(), 1)
  );
}
function getDateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}
function getDisplayName(row) {
  return (
    row?.therapist_name ||
    row?.name ||
    row?.username ||
    "Unknown Therapist"
  );
}
function getEvaluationTarget(period) {
  return period === "today"
    ? DAILY_EVALUATION_TARGET
    : MONTHLY_EVALUATION_TARGET;
}
function getEvaluationColor(count, period) {
  const target = getEvaluationTarget(period);
  if (period === "today") {
    if (count > target) return "#dc2626";
    if (count === target) return "#059669";
    return "#d97706";
  }
  if (count < 15) return "#d97706";
  if (count <= 20) return "#2563eb";
  if (count <= target) return "#059669";
  return "#7c3aed";
}
function getEvaluationStatus(count, period) {
  const target = getEvaluationTarget(period);
  if (period === "today") {
    if (count > target) return "Above daily target";
    if (count === target) return "Daily target reached";
    return "Below daily target";
  }
  if (count < 15) return "Needs attention";
  if (count <= 20) return "Progressing";
  if (count <= target) return "On track";
  return "Target exceeded";
}
function getEvaluationPercentage(count, period) {
  const target = getEvaluationTarget(period);
  return Math.round((count / target) * 100);
}
function formatDateLabel(value) {
  if (!value) return "Not selected";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
export default function EvaluationTrackerSection({
  user,
  actingAs = null,
}) {
  const [fromDate, setFromDate] = useState(
    getFirstDayOfMonthString()
  );
  const [toDate, setToDate] = useState(getTodayString());
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("month");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("count-desc");
  const loadTracker = useCallback(async () => {
    if (fromDate && toDate && fromDate > toDate) {
      setError("The From Date cannot be later than the To Date.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append("start_date", fromDate);
      if (toDate) params.append("end_date", toDate);
      if (
        actingAs &&
        (user?.is_superuser || user?.role === "admin")
      ) {
        params.append("viewed_user_id", String(actingAs.id));
        params.append(
          "viewed_user_role",
          String(actingAs.role || "")
        );
      }
      const response = await api.get(
        `reception/evaluation-tracker/?${params.toString()}`
      );
      setRows(response.data.therapists || []);
      setTotal(Number(response.data.total || 0));
    } catch (err) {
      console.error("Failed to load Evaluation Tracker", err);
      setRows([]);
      setTotal(0);
      setError(
        err?.response?.data?.error ||
          "Could not load evaluation data. Please check that the Evaluation Tracker API is connected."
      );
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, actingAs, user]);
  useEffect(() => {
    loadTracker();
  }, [loadTracker]);
  const handlePreset = (preset) => {
    const currentDate = getTodayString();
    setPeriod(preset);
    if (preset === "today") {
      setFromDate(currentDate);
      setToDate(currentDate);
    } else if (preset === "week") {
      setFromDate(getDateOffset(-6));
      setToDate(currentDate);
    } else if (preset === "month") {
      setFromDate(getFirstDayOfMonthString());
      setToDate(currentDate);
    }
  };
  const handleDateChange = (which, value) => {
    setPeriod("custom");
    if (which === "from") {
      setFromDate(value);
    } else {
      setToDate(value);
    }
  };
  const filteredRows = rows
    .filter((row) =>
      getDisplayName(row)
        .toLowerCase()
        .includes(search.trim().toLowerCase())
    )
    .sort((a, b) => {
      const countA = Number(a.count ?? a.total ?? 0);
      const countB = Number(b.count ?? b.total ?? 0);
      if (sort === "count-asc") return countA - countB;
      if (sort === "name-asc") {
        return getDisplayName(a).localeCompare(getDisplayName(b));
      }
      if (sort === "name-desc") {
        return getDisplayName(b).localeCompare(getDisplayName(a));
      }
      return countB - countA;
    });
  const target = getEvaluationTarget(period);
  return (
    <section style={styles.page}>
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.eyebrow}>
            WORKSPACE / REPORTS
          </div>
          <h2 style={styles.heroTitle}>Evaluation Tracker</h2>
          <p style={styles.heroDescription}>
            Monitor initial evaluations across your physiotherapy team.
            View each physiotherapist's evaluation count and progress
            against the applicable target.
          </p>
          <div style={styles.periodSummary}>
            <span style={styles.periodDot} />
            <span>
              {formatDateLabel(fromDate)} – {formatDateLabel(toDate)}
            </span>
          </div>
        </div>
        <button
          type="button"
          style={{
            ...styles.refreshButton,
            ...(loading ? styles.disabledButton : {}),
          }}
          onClick={loadTracker}
          disabled={loading}
        >
          <span style={styles.refreshIcon}>↻</span>
          {loading ? "Refreshing…" : "Refresh data"}
        </button>
      </div>
      <div style={styles.filterCard}>
        <div style={styles.filterCardHeading}>
          <div>
            <h3 style={styles.filterTitle}>Reporting period</h3>
            <p style={styles.filterSubtitle}>
              Choose a preset or select your own dates.
            </p>
          </div>
          <span style={styles.filterIcon}>▦</span>
        </div>
        <div style={styles.presets}>
          {[
            { key: "today", label: "Today" },
            { key: "week", label: "Last 7 days" },
            { key: "month", label: "This month" },
          ].map((preset) => (
            <button
              key={preset.key}
              type="button"
              aria-pressed={period === preset.key}
              style={{
                ...styles.presetButton,
                ...(period === preset.key
                  ? styles.activePresetButton
                  : {}),
              }}
              onClick={() => handlePreset(preset.key)}
            >
              {period === preset.key && (
                <span style={styles.presetCheck}>✓</span>
              )}
              {preset.label}
            </button>
          ))}
        </div>
        <div style={styles.dateFilters}>
          <div style={styles.dateField}>
            <label htmlFor="evaluation-from" style={styles.dateLabel}>
              FROM DATE
            </label>
            <input
              id="evaluation-from"
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event) =>
                handleDateChange("from", event.target.value)
              }
              style={styles.dateInput}
            />
          </div>
          <div style={styles.dateField}>
            <label htmlFor="evaluation-to" style={styles.dateLabel}>
              TO DATE
            </label>
            <input
              id="evaluation-to"
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) =>
                handleDateChange("to", event.target.value)
              }
              style={styles.dateInput}
            />
          </div>
          <button
            type="button"
            style={{
              ...styles.applyButton,
              ...(loading ? styles.disabledButton : {}),
            }}
            onClick={loadTracker}
            disabled={loading}
          >
            Apply date range
            <span style={styles.buttonArrow}>→</span>
          </button>
        </div>
      </div>
      {error && (
        <div style={styles.errorBox} role="alert">
          <span style={styles.errorIcon}>!</span>
          <div>
            <strong style={styles.errorTitle}>
              Unable to display evaluation data
            </strong>
            <div>{error}</div>
          </div>
        </div>
      )}
      <div style={styles.tableCard}>
        <div style={styles.tableHeading}>
          <div>
            <h3 style={styles.tableTitle}>
              Evaluations by physiotherapist
            </h3>
            <p style={styles.tableSubtitle}>
              {period === "today"
                ? "Daily target: 4 evaluations per physiotherapist"
                : "Monthly target reference: 30 evaluations per physiotherapist"}
            </p>
          </div>
          <span style={styles.countBadge}>
            {filteredRows.length}{" "}
            {filteredRows.length === 1 ? "therapist" : "therapists"}
          </span>
        </div>
        <div style={styles.toolbar}>
          <div style={styles.searchWrapper}>
            <span style={styles.searchIcon}>⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search physiotherapist…"
              aria-label="Search physiotherapist"
              style={styles.searchInput}
            />
          </div>
          <div style={styles.sortWrapper}>
            <label htmlFor="evaluation-sort" style={styles.sortLabel}>
              Sort by
            </label>
            <select
              id="evaluation-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              style={styles.sortSelect}
            >
              <option value="count-desc">Highest evaluations</option>
              <option value="count-asc">Lowest evaluations</option>
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
            </select>
          </div>
        </div>
        {loading ? (
          <div style={styles.tableMessage}>
            <span style={styles.loadingSpinner} />
            Loading evaluation data…
          </div>
        ) : error ? (
          <div style={styles.tableMessage}>
            Evaluation data is unavailable. Check the backend endpoint
            and try refreshing.
          </div>
        ) : filteredRows.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyStateIcon}>▤</div>
            <h4 style={styles.emptyStateTitle}>
              {rows.length === 0
                ? "No evaluation records found"
                : "No matching physiotherapists"}
            </h4>
            <p style={styles.emptyStateText}>
              {rows.length === 0
                ? "Try a different date range or check whether initial evaluations have been recorded."
                : "Try another name or clear your search."}
            </p>
            {search && (
              <button
                type="button"
                style={styles.clearSearchButton}
                onClick={() => setSearch("")}
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div style={styles.tableScroll}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeaderCell}>#</th>
                  <th style={styles.tableHeaderCell}>
                    Physiotherapist
                  </th>
                  <th style={styles.tableHeaderCell}>
                    Initial evaluations
                  </th>
                  <th style={styles.tableHeaderCell}>
                    {period === "today"
                      ? "Daily target progress"
                      : "Monthly target progress"}
                  </th>
                  <th style={styles.tableHeaderCell}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, index) => {
                  const count = Number(row.count ?? row.total ?? 0);
                  const percentage = getEvaluationPercentage(
                    count,
                    period
                  );
                  const color = getEvaluationColor(count, period);
                  const status = getEvaluationStatus(count, period);
                  return (
                    <tr
                      key={row.therapist_id ?? row.id ?? index}
                      style={styles.tableRow}
                    >
                      <td style={styles.rankCell}>
                        <span style={styles.rankBadge}>
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        <div style={styles.therapistIdentity}>
                          <div
                            style={{
                              ...styles.therapistAvatar,
                              background: `${color}18`,
                              color,
                            }}
                          >
                            {getDisplayName(row)
                              .trim()
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div style={styles.therapistNameBlock}>
                            <span style={styles.therapistName}>
                              {getDisplayName(row)}
                            </span>
                            <span style={styles.therapistSubtext}>
                              Physiotherapy team
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={styles.countCell}>
                        <span style={styles.countPill}>{count}</span>
                      </td>
                      <td style={styles.progressCell}>
                        <div style={styles.progressCellContent}>
                          <div
                            style={styles.progressTrack}
                            role="progressbar"
                            aria-label={`${getDisplayName(
                              row
                            )} evaluation target progress`}
                            aria-valuemin={0}
                            aria-valuenow={count}
                            aria-valuemax={target}
                          >
                            <div
                              style={{
                                ...styles.progressFill,
                                width: `${Math.min(percentage, 100)}%`,
                                background: color,
                              }}
                            />
                          </div>
                          <span
                            style={{
                              ...styles.progressLabel,
                              color,
                            }}
                          >
                            {percentage}%
                          </span>
                        </div>
                        <div style={styles.progressTargetText}>
                          {count} / {target} evaluations
                        </div>
                      </td>
                      <td style={styles.statusCell}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            color,
                            background: `${color}12`,
                            borderColor: `${color}30`,
                          }}
                        >
                          <span
                            style={{
                              ...styles.statusDot,
                              background: color,
                            }}
                          />
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} style={styles.totalFooterCell}>
                    Total initial evaluations
                  </td>
                  <td style={styles.totalFooterCount}>{total}</td>
                  <td colSpan={2} style={styles.totalFooterNote}>
                    {formatDateLabel(fromDate)} – {formatDateLabel(toDate)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <div style={styles.tableFooter}>
          <span>
            Showing {filteredRows.length} of {rows.length} physiotherapists
          </span>
          <span>
            {period === "today"
              ? "Daily target: 4 evaluations"
              : "Monthly target reference: 30 evaluations"}
          </span>
        </div>
      </div>
    </section>
  );
}
const styles = {
  page: {
    display: "grid",
    gap: "20px",
    minWidth: 0,
    color: "#0f172a",
  },
  hero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "20px",
    padding: "28px",
    background:
      "linear-gradient(125deg, #0f2747 0%, #173e62 62%, #116b75 100%)",
    border: "1px solid #1d4867",
    borderRadius: "20px",
    boxShadow: "0 12px 30px rgba(15, 39, 71, 0.14)",
    color: "#ffffff",
  },
  heroContent: {
    minWidth: 0,
    flex: "1 1 360px",
  },
  eyebrow: {
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "0.15em",
    color: "#9dd9df",
  },
  heroTitle: {
    margin: "10px 0 9px",
    color: "#ffffff",
    fontSize: "clamp(24px, 3vw, 32px)",
    lineHeight: 1.2,
    fontWeight: "800",
    letterSpacing: "-0.035em",
  },
  heroDescription: {
    maxWidth: "650px",
    margin: 0,
    color: "#d4e3ee",
    fontSize: "14px",
    lineHeight: 1.8,
  },
  periodSummary: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "18px",
    padding: "8px 12px",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: "9px",
    background: "rgba(255,255,255,0.08)",
    color: "#f0f9ff",
    fontSize: "12px",
    fontWeight: "600",
  },
  periodDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#5eead4",
  },
  refreshButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    background: "#ffffff",
    border: "1px solid rgba(255,255,255,0.65)",
    borderRadius: "10px",
    padding: "11px 15px",
    color: "#153653",
    fontWeight: "800",
    fontSize: "13px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  refreshIcon: {
    fontSize: "19px",
    lineHeight: 1,
  },
  disabledButton: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  filterCard: {
    display: "grid",
    gap: "17px",
    padding: "22px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "17px",
    boxShadow: "0 4px 16px rgba(15, 23, 42, 0.025)",
  },
  filterCardHeading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  filterTitle: {
    margin: 0,
    color: "#142b45",
    fontSize: "16px",
    fontWeight: "800",
  },
  filterSubtitle: {
    margin: "5px 0 0",
    color: "#718096",
    fontSize: "12px",
    lineHeight: 1.5,
  },
  filterIcon: {
    display: "grid",
    placeItems: "center",
    width: "38px",
    height: "38px",
    borderRadius: "11px",
    background: "#eaf5f6",
    color: "#11727b",
    fontSize: "21px",
  },
  presets: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  presetButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    background: "#ffffff",
    border: "1px solid #dbe3ec",
    borderRadius: "9px",
    padding: "9px 13px",
    color: "#475569",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
  },
  activePresetButton: {
    background: "#e9f6f7",
    borderColor: "#83c7cc",
    color: "#116b75",
  },
  presetCheck: {
    fontSize: "13px",
    fontWeight: "900",
  },
  dateFilters: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
    gap: "13px",
    alignItems: "end",
  },
  dateField: {
    display: "grid",
    gap: "7px",
    minWidth: 0,
  },
  dateLabel: {
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "0.08em",
    color: "#64748b",
  },
  dateInput: {
    boxSizing: "border-box",
    width: "100%",
    minWidth: 0,
    padding: "11px 12px",
    border: "1px solid #d5dfe9",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#243b53",
    fontSize: "13px",
    outlineColor: "#0d9488",
  },
  applyButton: {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "13px",
    minHeight: "41px",
    background: "#153653",
    color: "#ffffff",
    border: "1px solid #153653",
    borderRadius: "9px",
    padding: "11px 16px",
    fontSize: "12px",
    fontWeight: "800",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  buttonArrow: {
    fontSize: "17px",
    lineHeight: 1,
  },
  errorBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "15px",
    border: "1px solid #fecaca",
    background: "#fff7f7",
    color: "#991b1b",
    borderRadius: "12px",
    fontSize: "13px",
    lineHeight: 1.6,
  },
  errorIcon: {
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "#fee2e2",
    color: "#b91c1c",
    fontWeight: "900",
  },
  errorTitle: {
    display: "block",
    marginBottom: "3px",
  },
  tableCard: {
    minWidth: 0,
    overflow: "hidden",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    boxShadow: "0 4px 16px rgba(15, 23, 42, 0.025)",
  },
  tableHeading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    padding: "21px 22px",
    borderBottom: "1px solid #edf1f6",
  },
  tableTitle: {
    margin: 0,
    color: "#142b45",
    fontSize: "16px",
    fontWeight: "800",
  },
  tableSubtitle: {
    margin: "5px 0 0",
    color: "#718096",
    fontSize: "11px",
    lineHeight: 1.6,
  },
  countBadge: {
    padding: "7px 10px",
    border: "1px solid #dce7ef",
    borderRadius: "8px",
    background: "#f5f9fc",
    color: "#456078",
    fontSize: "11px",
    fontWeight: "800",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    padding: "14px 22px",
    borderBottom: "1px solid #edf1f6",
    background: "#fbfcfe",
  },
  searchWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    flex: "1 1 230px",
    maxWidth: "390px",
    minWidth: 0,
    padding: "0 11px",
    border: "1px solid #dce5ed",
    borderRadius: "9px",
    background: "#ffffff",
  },
  searchIcon: {
    color: "#8090a3",
    fontSize: "22px",
    lineHeight: 1,
  },
  searchInput: {
    width: "100%",
    minWidth: 0,
    padding: "10px 0",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#334155",
    fontSize: "12px",
  },
  sortWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
  },
  sortLabel: {
    color: "#718096",
    fontSize: "11px",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },
  sortSelect: {
    maxWidth: "100%",
    padding: "9px 10px",
    border: "1px solid #dce5ed",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#334155",
    fontSize: "11px",
    fontWeight: "600",
  },
  tableScroll: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  tableHeaderCell: {
    padding: "13px 17px",
    background: "#f6f9fc",
    color: "#718096",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "0.055em",
    borderBottom: "1px solid #e7edf3",
    whiteSpace: "nowrap",
  },
  tableRow: {
    transition: "background 150ms ease",
  },
  rankCell: {
    padding: "14px 17px",
    borderBottom: "1px solid #edf1f6",
  },
  rankBadge: {
    color: "#8b99a9",
    fontSize: "11px",
    fontWeight: "800",
    fontVariantNumeric: "tabular-nums",
  },
  tableCell: {
    padding: "14px 17px",
    color: "#334155",
    fontSize: "12px",
    borderBottom: "1px solid #edf1f6",
    minWidth: "200px",
  },
  therapistIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    minWidth: "190px",
  },
  therapistAvatar: {
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    width: "37px",
    height: "37px",
    borderRadius: "11px",
    fontSize: "14px",
    fontWeight: "800",
  },
  therapistNameBlock: {
    display: "grid",
    gap: "4px",
    minWidth: 0,
  },
  therapistName: {
    color: "#243b53",
    fontSize: "12px",
    fontWeight: "800",
    overflowWrap: "anywhere",
  },
  therapistSubtext: {
    color: "#94a3b8",
    fontSize: "10px",
  },
  countCell: {
    padding: "14px 17px",
    borderBottom: "1px solid #edf1f6",
  },
  countPill: {
    display: "inline-grid",
    placeItems: "center",
    minWidth: "37px",
    padding: "7px 10px",
    borderRadius: "8px",
    background: "#edf4ff",
    color: "#2457a7",
    fontSize: "13px",
    fontWeight: "800",
    fontVariantNumeric: "tabular-nums",
  },
  progressCell: {
    padding: "14px 17px",
    borderBottom: "1px solid #edf1f6",
    minWidth: "170px",
  },
  progressCellContent: {
    display: "grid",
    gridTemplateColumns: "minmax(70px, 1fr) auto",
    alignItems: "center",
    gap: "10px",
  },
  progressTrack: {
    height: "7px",
    overflow: "hidden",
    background: "#e8edf3",
    borderRadius: "999px",
  },
  progressFill: {
    height: "100%",
    borderRadius: "999px",
    transition: "width 180ms ease",
  },
  progressLabel: {
    fontSize: "11px",
    fontWeight: "800",
    whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums",
  },
  progressTargetText: {
    marginTop: "7px",
    color: "#718096",
    fontSize: "10px",
  },
  statusCell: {
    padding: "14px 17px",
    borderBottom: "1px solid #edf1f6",
    whiteSpace: "nowrap",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 9px",
    border: "1px solid",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: "800",
  },
  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
  },
  totalFooterCell: {
    padding: "15px 17px",
    background: "#f6f9fc",
    color: "#243b53",
    fontSize: "12px",
    fontWeight: "800",
    borderTop: "1px solid #e2e8f0",
  },
  totalFooterCount: {
    padding: "15px 17px",
    background: "#f6f9fc",
    color: "#2457a7",
    fontSize: "15px",
    fontWeight: "900",
    borderTop: "1px solid #e2e8f0",
    fontVariantNumeric: "tabular-nums",
  },
  totalFooterNote: {
    padding: "15px 17px",
    background: "#f6f9fc",
    color: "#718096",
    fontSize: "10px",
    borderTop: "1px solid #e2e8f0",
  },
  tableFooter: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "8px",
    padding: "13px 22px",
    background: "#fbfcfe",
    borderTop: "1px solid #edf1f6",
    color: "#8793a3",
    fontSize: "10px",
  },
  tableMessage: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    padding: "35px 20px",
    color: "#718096",
    fontSize: "12px",
    textAlign: "center",
    lineHeight: 1.6,
  },
  loadingSpinner: {
    display: "inline-block",
    width: "14px",
    height: "14px",
    border: "2px solid #dbeafe",
    borderTopColor: "#2563eb",
    borderRadius: "50%",
  },
  emptyState: {
    display: "grid",
    justifyItems: "center",
    gap: "9px",
    padding: "40px 20px",
    textAlign: "center",
  },
  emptyStateIcon: {
    display: "grid",
    placeItems: "center",
    width: "52px",
    height: "52px",
    borderRadius: "15px",
    background: "#f0f5fa",
    color: "#8a9bb0",
    fontSize: "26px",
  },
  emptyStateTitle: {
    margin: "4px 0 0",
    color: "#334155",
    fontSize: "14px",
    fontWeight: "800",
  },
  emptyStateText: {
    maxWidth: "380px",
    margin: 0,
    color: "#8190a3",
    fontSize: "12px",
    lineHeight: 1.7,
  },
  clearSearchButton: {
    marginTop: "5px",
    padding: "8px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#334155",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
  },
};
import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../api/api";

const MONTHLY_EVALUATION_TARGET = 30;
const DAILY_EVALUATION_TARGET = 4;
const REHAB_MANAGER_NAME = "Mohammed Mahmoud - Rehab Manager";

const COLORS = {
  navy: "#172554",
  navyLight: "#273b80",
  text: "#263554",
  muted: "#71809b",
  subtle: "#9ba8bf",
  border: "#e5eaf5",
  borderStrong: "#d4dcef",
  surface: "#ffffff",
  surfaceSoft: "#f7f9ff",
  background: "#f2f5fc",
  blue: "#4361ee",
  blueSoft: "#edf0ff",
  sky: "#0891b2",
  skySoft: "#e5f9ff",
  green: "#059669",
  greenSoft: "#e8fbf3",
  teal: "#0d9488",
  tealSoft: "#e5faf7",
  purple: "#8b5cf6",
  purpleSoft: "#f2ebff",
  amber: "#d97706",
  amberSoft: "#fff5df",
  red: "#e05268",
  redSoft: "#fff0f2",
  indigo: "#4f46e5",
};

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayString() {
  return formatLocalDate(new Date());
}

function getFirstDayOfMonthString() {
  const now = new Date();
  return formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1));
}

function getMonthValue(dateString = getTodayString()) {
  return dateString.slice(0, 7);
}

function getMonthStart(month) {
  return `${month}-01`;
}

function getMonthEnd(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  return formatLocalDate(new Date(year, monthNumber, 0));
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
    row?.display_name ||
    row?.full_name ||
    row?.username ||
    "Unknown Therapist"
  );
}

function getEvaluationRecords(row) {
  const records =
    row?.evaluations ??
    row?.evaluation_details ??
    row?.evaluation_records ??
    row?.records ??
    [];

  return Array.isArray(records) ? records : [];
}

function getField(record, fields) {
  for (const field of fields) {
    const value = record?.[field];

    if (value === undefined || value === null || value === "") continue;

    if (typeof value === "object") {
      const nested =
        value.name ??
        value.full_name ??
        value.username ??
        value.display_name ??
        value.number ??
        value.visit_number ??
        value.visit_no ??
        value.value ??
        value.id;

      if (nested !== undefined && nested !== null && nested !== "") {
        return nested;
      }

      continue;
    }

    return value;
  }

  return "";
}

function getEvaluationCount(row) {
  const value =
    row?.evaluation_count ??
    row?.count ??
    row?.total ??
    getEvaluationRecords(row).length;

  return Number(value) || 0;
}

function getEvaluationTarget(period) {
  return period === "today"
    ? DAILY_EVALUATION_TARGET
    : MONTHLY_EVALUATION_TARGET;
}

function getEvaluationPercentage(count, period) {
  const target = getEvaluationTarget(period);
  return target ? Math.round((count / target) * 100) : 0;
}

function getEvaluationStatus(count, period) {
  const target = getEvaluationTarget(period);

  if (count > target) {
    return {
      label: "Target exceeded",
      color: COLORS.purple,
      background: COLORS.purpleSoft,
    };
  }

  if (count === target) {
    return {
      label: "Target reached",
      color: COLORS.green,
      background: COLORS.greenSoft,
    };
  }

  if (period === "today") {
    return {
      label: "Below daily target",
      color: COLORS.amber,
      background: COLORS.amberSoft,
    };
  }

  if (count < 15) {
    return {
      label: "Needs attention",
      color: COLORS.amber,
      background: COLORS.amberSoft,
    };
  }

  if (count <= 20) {
    return {
      label: "Progressing",
      color: COLORS.blue,
      background: COLORS.blueSoft,
    };
  }

  return {
    label: "On track",
    color: COLORS.green,
    background: COLORS.greenSoft,
  };
}

function formatDateLabel(value) {
  if (!value) return "—";

  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRecordDate(value) {
  if (!value) return "—";

  const stringValue = String(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    return formatDateLabel(stringValue);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return stringValue;

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMonthLabel(value) {
  if (!value) return "";

  const [year, month] = value.split("-").map(Number);
  const date = new Date(year, month - 1, 1);

  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function getVisitNumber(record) {
  return getField(record, [
    "visit_number",
    "visit_no",
    "visit_num",
    "visit_number_display",
    "visit_number_label",
    "visit_sequence",
    "visit_sequence_number",
    "visit_id",
    "visit",
    "appointment_visit_number",
    "appointment_number",
    "appointment_no",
    "appointment_id",
    "encounter_number",
    "encounter_id",
    "session_number",
    "registration_number",
  ]);
}

function includeRehabManager(therapists) {
  const result = Array.isArray(therapists) ? [...therapists] : [];

  const managerExists = result.some((row) => {
    const name = getDisplayName(row).trim().toLowerCase();
    const role = String(row?.role || row?.user_role || "")
      .trim()
      .toLowerCase();

    return (
      name === REHAB_MANAGER_NAME.toLowerCase() ||
      name === "mohammed mahmoud" ||
      name === "rehab manager" ||
      role === "rehab_manager" ||
      role === "rehab manager"
    );
  });

  if (!managerExists) {
    result.push({
      id: "static-rehab-manager",
      therapist_id: "static-rehab-manager",
      name: REHAB_MANAGER_NAME,
      therapist_name: REHAB_MANAGER_NAME,
      role: "rehab_manager",
      count: 0,
      total: 0,
      evaluation_count: 0,
      evaluations: [],
      is_static_placeholder: true,
    });
  }

  return result;
}

function makeMonthOptions() {
  const options = [];
  const now = new Date();

  for (let offset = 0; offset < 24; offset += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);

    options.push({
      value: formatLocalDate(date).slice(0, 7),
      label: date.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
    });
  }

  return options;
}

function SummaryCard({ label, value, note, color, background, icon, index }) {
  return (
    <article
      className={`et-summary-card et-summary-card-${index}`}
      style={{
        ...styles.summaryCard,
        "--card-accent": color,
        "--card-tint": background,
      }}
    >
      <div style={styles.summaryTop}>
        <span style={styles.summaryLabel}>{label}</span>

        <span
          aria-hidden="true"
          style={{
            ...styles.summaryIcon,
            color,
            background,
          }}
        >
          {icon}
        </span>
      </div>

      <div style={{ ...styles.summaryValue, color }}>{value}</div>
      <div style={styles.summaryNote}>{note}</div>
      <div style={{ ...styles.summaryAccent, background: color }} />
    </article>
  );
}

export default function EvaluationTrackerSection({
  user,
  actingAs = null,
}) {
  const [fromDate, setFromDate] = useState(getFirstDayOfMonthString());
  const [toDate, setToDate] = useState(getTodayString());
  const [selectedMonth, setSelectedMonth] = useState(getMonthValue());
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("month");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("count-desc");
  const [expandedTherapist, setExpandedTherapist] = useState(null);

  const monthOptions = useMemo(() => makeMonthOptions(), []);

  const loadTracker = useCallback(async () => {
    if (fromDate && toDate && fromDate > toDate) {
      setError("The start date cannot be later than the end date.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (fromDate) params.set("start_date", fromDate);
      if (toDate) params.set("end_date", toDate);

      if (
        actingAs &&
        (user?.is_superuser ||
          String(user?.role || "").trim().toLowerCase() === "admin")
      ) {
        params.set("viewed_user_id", String(actingAs.id));
        params.set("viewed_user_role", String(actingAs.role || ""));
      }

      const response = await api.get(
        `reception/evaluation-tracker/?${params.toString()}`
      );

      const apiRows = Array.isArray(response.data?.therapists)
        ? response.data.therapists
        : [];

      setRows(includeRehabManager(apiRows));
      setTotal(Number(response.data?.total || 0));
      setExpandedTherapist(null);
    } catch (err) {
      console.error(
        "Failed to load Evaluation Tracker",
        err?.response?.data || err
      );

      setRows([]);
      setTotal(0);

      setError(
        err?.response?.data?.error ||
          "Could not load evaluation data. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, actingAs, user]);

  useEffect(() => {
    loadTracker();
  }, [loadTracker]);

  const handlePreset = (preset) => {
    const today = getTodayString();

    setPeriod(preset);
    setExpandedTherapist(null);

    if (preset === "today") {
      setFromDate(today);
      setToDate(today);
    } else if (preset === "week") {
      setFromDate(getDateOffset(-6));
      setToDate(today);
    } else if (preset === "month") {
      const month = getMonthValue(today);
      setSelectedMonth(month);
      setFromDate(getMonthStart(month));
      setToDate(today);
    }
  };

  const handleMonthChange = (month) => {
    if (!month) return;

    setSelectedMonth(month);
    setPeriod("month");
    setFromDate(getMonthStart(month));

    const today = getTodayString();

    setToDate(
      month === getMonthValue(today) ? today : getMonthEnd(month)
    );

    setExpandedTherapist(null);
  };

  const handleDateChange = (which, value) => {
    setPeriod("custom");
    setExpandedTherapist(null);

    if (which === "from") {
      setFromDate(value);

      if (value && value.slice(0, 7) !== selectedMonth) {
        setSelectedMonth(value.slice(0, 7));
      }
    } else {
      setToDate(value);

      if (value && value.slice(0, 7) !== selectedMonth) {
        setSelectedMonth(value.slice(0, 7));
      }
    }
  };

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return rows
      .filter((row) => {
        if (!normalizedSearch) return true;

        const name = getDisplayName(row).toLowerCase();
        const username = String(row?.username || "").toLowerCase();

        return (
          name.includes(normalizedSearch) ||
          username.includes(normalizedSearch)
        );
      })
      .sort((a, b) => {
        const countA = getEvaluationCount(a);
        const countB = getEvaluationCount(b);

        if (sort === "count-asc") return countA - countB;

        if (sort === "name-asc") {
          return getDisplayName(a).localeCompare(getDisplayName(b));
        }

        if (sort === "name-desc") {
          return getDisplayName(b).localeCompare(getDisplayName(a));
        }

        return countB - countA;
      });
  }, [rows, search, sort]);

  const summary = useMemo(() => {
    const actualRows = rows.filter(
      (row) => !row.is_static_placeholder
    );

    return {
      therapists: actualRows.length,
      evaluations: total,
      target: actualRows.length * getEvaluationTarget(period),
      withoutEvaluations: actualRows.filter(
        (row) => getEvaluationCount(row) === 0
      ).length,
      withEvaluations: actualRows.filter(
        (row) => getEvaluationCount(row) > 0
      ).length,
    };
  }, [rows, total, period]);

  const clearSearch = () => {
    setSearch("");
    setSort("count-desc");
  };

  const target = getEvaluationTarget(period);

  return (
    <section style={styles.page}>
      <style>{`
        @keyframes et-spin {
          to { transform: rotate(360deg); }
        }

        @keyframes et-rise {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes et-shimmer {
          from { background-position: 150% 0; }
          to { background-position: -150% 0; }
        }

        .evaluation-tracker-root {
          color: ${COLORS.text};
        }

        .evaluation-tracker-root * {
          box-sizing: border-box;
        }

        .evaluation-tracker-root button,
        .evaluation-tracker-root input,
        .evaluation-tracker-root select {
          font: inherit;
        }

        .evaluation-tracker-hero {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          background:
            radial-gradient(ellipse at 85% 5%, rgba(56,189,248,.27), transparent 35%),
            radial-gradient(ellipse at 70% 115%, rgba(129,140,248,.30), transparent 42%),
            linear-gradient(125deg, #172554 0%, #273b80 48%, #4338ca 100%);
          color: #fff;
          border-radius: 23px;
          box-shadow: 0 15px 35px rgba(45,55,140,.17);
          animation: et-rise .35s ease both;
        }

        .evaluation-tracker-hero::after {
          content: "";
          position: absolute;
          z-index: -1;
          right: -55px;
          top: -95px;
          width: 250px;
          height: 250px;
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 50%;
          box-shadow:
            0 0 0 25px rgba(255,255,255,.035),
            0 0 0 55px rgba(255,255,255,.025);
          pointer-events: none;
        }

        .evaluation-tracker-hero h1,
        .evaluation-tracker-hero p {
          color: #fff !important;
        }

        .evaluation-tracker-button,
        .evaluation-tracker-preset,
        .evaluation-tracker-details-button {
          transition:
            transform 160ms ease,
            background 160ms ease,
            border-color 160ms ease,
            box-shadow 160ms ease;
        }

        .evaluation-tracker-button:hover:not(:disabled),
        .evaluation-tracker-details-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 5px 14px rgba(35,45,100,.12);
        }

        .evaluation-tracker-preset:hover {
          border-color: #a5b4fc !important;
          background: #f1f2ff !important;
        }

        .evaluation-tracker-button:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .evaluation-tracker-button:focus-visible,
        .evaluation-tracker-preset:focus-visible,
        .evaluation-tracker-details-button:focus-visible {
          outline: 3px solid rgba(67,97,238,.28);
          outline-offset: 2px;
        }

        .evaluation-tracker-input:focus {
          outline: 3px solid rgba(67,97,238,.12);
          border-color: #6577f5 !important;
        }

        .evaluation-tracker-table tbody tr:hover {
          background: #f5f7ff;
        }

        .evaluation-tracker-table tbody tr,
        .evaluation-tracker-details tbody tr {
          transition: background 150ms ease;
        }

        .evaluation-tracker-details tbody tr:hover {
          background: #f4f7ff;
        }

        .evaluation-tracker-table tbody tr:last-child td {
          border-bottom-color: #edf0f8;
        }

        .et-summary-card {
          position: relative;
          overflow: hidden;
          animation: et-rise .4s ease both;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .et-summary-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 25px rgba(40,55,100,.09) !important;
        }

        .et-summary-card-1 { animation-delay: 35ms; }
        .et-summary-card-2 { animation-delay: 70ms; }
        .et-summary-card-3 { animation-delay: 105ms; }
        .et-summary-card-4 { animation-delay: 140ms; }

        .evaluation-tracker-details-button {
          white-space: nowrap;
        }

        .evaluation-tracker-search:focus-within {
          border-color: #818cf8 !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,.09);
        }

        .evaluation-tracker-date-actions > button {
          min-height: 42px;
        }

        @media (max-width: 760px) {
          .evaluation-tracker-hero {
            padding: 21px !important;
            border-radius: 18px !important;
          }

          .evaluation-tracker-month-row {
            grid-template-columns: 1fr !important;
          }

          .evaluation-tracker-toolbar {
            align-items: stretch !important;
          }

          .evaluation-tracker-search {
            flex-basis: 100% !important;
          }

          .evaluation-tracker-sort {
            flex: 1 1 100% !important;
          }

          .evaluation-tracker-date-actions > button {
            flex: 1 1 auto;
          }

          .evaluation-tracker-root .et-mobile-hide {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .evaluation-tracker-root *,
          .evaluation-tracker-root *::before,
          .evaluation-tracker-root *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      <div className="evaluation-tracker-root" style={styles.root}>
        <header
          className="evaluation-tracker-hero"
          style={styles.hero}
        >
          <div style={styles.heroContent}>
            <div style={styles.eyebrow}>
              <span style={styles.eyebrowDot} />
              REHABILITATION MANAGEMENT
            </div>

            <h1 style={styles.heroTitle}>Evaluation Tracker</h1>

            <p style={styles.heroDescription}>
              Your live overview of initial evaluations, therapist activity,
              target progress, and patient-level records.
            </p>

            <div style={styles.heroMetaRow}>
              <div style={styles.heroDate}>
                <span style={styles.liveDot} />
                {formatDateLabel(fromDate)} — {formatDateLabel(toDate)}
              </div>

              <span style={styles.heroTag}>
                {period === "today"
                  ? "DAILY VIEW"
                  : period === "week"
                    ? "7-DAY VIEW"
                    : period === "custom"
                      ? "CUSTOM RANGE"
                      : "MONTHLY VIEW"}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="evaluation-tracker-button"
            style={styles.refreshButton}
            onClick={loadTracker}
            disabled={loading}
          >
            <span
              style={{
                ...styles.refreshSymbol,
                animation: loading ? "et-spin .9s linear infinite" : "none",
              }}
              aria-hidden="true"
            >
              ↻
            </span>
            {loading ? "Refreshing…" : "Refresh data"}
          </button>
        </header>

        <section style={styles.filterCard}>
          <div style={styles.sectionHeading}>
            <div style={styles.headingLeft}>
              <span style={styles.sectionIcon}>⌁</span>
              <div>
                <h2 style={styles.sectionTitle}>Report controls</h2>
                <p style={styles.sectionSubtitle}>
                  Select a period or customize your reporting dates.
                </p>
              </div>
            </div>
            <span style={styles.filterTag}>FILTERS</span>
          </div>

          <div
            className="evaluation-tracker-month-row"
            style={styles.monthRow}
          >
            <div style={styles.field}>
              <label htmlFor="evaluation-month" style={styles.label}>
                REPORT MONTH
              </label>

              <select
                id="evaluation-month"
                className="evaluation-tracker-input"
                value={selectedMonth}
                onChange={(event) => handleMonthChange(event.target.value)}
                style={styles.input}
              >
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.presetGroup}>
              {[
                { key: "today", label: "Today", icon: "◷" },
                { key: "week", label: "Last 7 days", icon: "▦" },
                { key: "month", label: "Selected month", icon: "▣" },
              ].map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  className="evaluation-tracker-preset"
                  aria-pressed={period === preset.key}
                  onClick={() => handlePreset(preset.key)}
                  style={{
                    ...styles.presetButton,
                    ...(period === preset.key
                      ? styles.presetButtonActive
                      : {}),
                  }}
                >
                  <span aria-hidden="true">{preset.icon}</span>
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.dateGrid}>
            <div style={styles.field}>
              <label htmlFor="evaluation-from" style={styles.label}>
                FROM DATE
              </label>

              <input
                id="evaluation-from"
                className="evaluation-tracker-input"
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(event) =>
                  handleDateChange("from", event.target.value)
                }
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label htmlFor="evaluation-to" style={styles.label}>
                TO DATE
              </label>

              <input
                id="evaluation-to"
                className="evaluation-tracker-input"
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(event) =>
                  handleDateChange("to", event.target.value)
                }
                style={styles.input}
              />
            </div>

            <div
              className="evaluation-tracker-date-actions"
              style={styles.dateActions}
            >
              <button
                type="button"
                className="evaluation-tracker-button"
                style={styles.primaryButton}
                onClick={loadTracker}
                disabled={loading}
              >
                {loading ? "Loading…" : "Apply dates"}
                <span aria-hidden="true" style={{ marginLeft: 8 }}>
                  →
                </span>
              </button>

              <button
                type="button"
                className="evaluation-tracker-button"
                style={styles.secondaryButton}
                onClick={() => handlePreset("month")}
              >
                Reset
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div style={styles.errorBox} role="alert">
            <div style={styles.errorIcon}>!</div>

            <div style={styles.errorContent}>
              <strong>Unable to display evaluation data</strong>
              <span>{error}</span>

              <button
                type="button"
                onClick={loadTracker}
                style={styles.errorRetry}
                disabled={loading}
              >
                Try again →
              </button>
            </div>
          </div>
        )}

        <section style={styles.summarySection}>
          <div style={styles.summarySectionHeading}>
            <div>
              <h2 style={styles.sectionTitle}>Performance overview</h2>
              <p style={styles.sectionSubtitle}>
                Key figures for the selected reporting period.
              </p>
            </div>

            <span style={styles.liveLabel}>
              <span style={styles.liveDotSmall} />
              REPORT SUMMARY
            </span>
          </div>

          <div style={styles.summaryGrid}>
            <SummaryCard
              index={1}
              label="Total evaluations"
              value={summary.evaluations.toLocaleString()}
              note={`${formatMonthLabel(selectedMonth)} reporting`}
              color={COLORS.blue}
              background={COLORS.blueSoft}
              icon="↗"
            />

            <SummaryCard
              index={2}
              label="Active therapists"
              value={summary.withEvaluations}
              note={`Out of ${summary.therapists} therapists`}
              color={COLORS.teal}
              background={COLORS.tealSoft}
              icon="◎"
            />

            <SummaryCard
              index={3}
              label="No evaluations"
              value={summary.withoutEvaluations}
              note="For the selected period"
              color={COLORS.red}
              background={COLORS.redSoft}
              icon="!"
            />

            <SummaryCard
              index={4}
              label="Team target"
              value={summary.target.toLocaleString()}
              note={`${target} per therapist for this view`}
              color={COLORS.purple}
              background={COLORS.purpleSoft}
              icon="✦"
            />
          </div>
        </section>

        <section style={styles.tableCard}>
          <div style={styles.tableHeading}>
            <div>
              <div style={styles.tableTitleRow}>
                <span style={styles.titleAccent} />
                <div>
                  <h2 style={styles.sectionTitle}>
                    Evaluations by physiotherapist
                  </h2>
                  <p style={styles.sectionSubtitle}>
                    {period === "today"
                      ? "Daily reference target: 4 evaluations per therapist."
                      : "Monthly reference target: 30 evaluations per therapist."}
                  </p>
                </div>
              </div>
            </div>

            <span style={styles.resultBadge}>
              <span style={styles.resultBadgeDot} />
              {filteredRows.length} therapists
            </span>
          </div>

          <div
            className="evaluation-tracker-toolbar"
            style={styles.toolbar}
          >
            <div
              className="evaluation-tracker-search"
              style={styles.searchBox}
            >
              <span style={styles.searchSymbol} aria-hidden="true">
                ⌕
              </span>

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search therapist name or username..."
                aria-label="Search therapist"
                style={styles.searchInput}
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search text"
                  style={styles.searchClear}
                >
                  ×
                </button>
              )}
            </div>

            <div
              className="evaluation-tracker-sort"
              style={styles.fieldCompact}
            >
              <label htmlFor="evaluation-sort" style={styles.label}>
                SORT BY
              </label>

              <select
                id="evaluation-sort"
                className="evaluation-tracker-input"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                style={styles.compactInput}
              >
                <option value="count-desc">Most evaluations</option>
                <option value="count-asc">Fewest evaluations</option>
                <option value="name-asc">Name A–Z</option>
                <option value="name-desc">Name Z–A</option>
              </select>
            </div>

            {(search || sort !== "count-desc") && (
              <button
                type="button"
                onClick={clearSearch}
                style={styles.clearButton}
              >
                Reset filters
              </button>
            )}
          </div>

          {loading ? (
            <div style={styles.message}>
              <div style={styles.loadingSpinner} />
              <strong style={{ color: COLORS.navy }}>
                Loading evaluation data
              </strong>
              <span>Getting the latest therapist statistics…</span>
            </div>
          ) : error ? (
            <div style={styles.message}>
              <span style={styles.messageIcon}>!</span>
              The report could not be loaded. Please check your connection.
            </div>
          ) : filteredRows.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>⌕</div>
              <h3 style={styles.emptyTitle}>No matching therapists</h3>
              <p style={styles.emptyText}>
                Try another search term or reporting period.
              </p>

              <button
                type="button"
                className="evaluation-tracker-button"
                style={styles.secondaryButton}
                onClick={clearSearch}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div style={styles.tableScroll}>
              <table
                className="evaluation-tracker-table"
                style={styles.table}
              >
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>PHYSIOTHERAPIST</th>
                    <th style={styles.th}>EVALUATIONS</th>
                    <th style={styles.th}>TARGET PROGRESS</th>
                    <th style={styles.th}>STATUS</th>
                    <th style={styles.thRight}>DETAILS</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.map((row, index) => {
                    const count = getEvaluationCount(row);
                    const percentage = getEvaluationPercentage(count, period);
                    const status = getEvaluationStatus(count, period);
                    const records = getEvaluationRecords(row);

                    const key =
                      row.therapist_id ??
                      row.id ??
                      row.username ??
                      getDisplayName(row);

                    const expanded = expandedTherapist === key;

                    return (
                      <React.Fragment key={key}>
                        <tr>
                          <td style={styles.tdMuted}>
                            {String(index + 1).padStart(2, "0")}
                          </td>

                          <td style={styles.td}>
                            <div style={styles.person}>
                              <div
                                style={{
                                  ...styles.avatar,
                                  background: status.background,
                                  color: status.color,
                                }}
                              >
                                {getDisplayName(row)
                                  .trim()
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div style={styles.personInfo}>
                                <div style={styles.personName}>
                                  {getDisplayName(row)}
                                </div>
                                <div style={styles.personMeta}>
                                  {row.username || "Physiotherapy team"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td style={styles.td}>
                            <span style={styles.countBadge}>{count}</span>
                          </td>

                          <td style={styles.td}>
                            <div style={styles.progressLine}>
                              <div
                                style={styles.progressTrack}
                                role="progressbar"
                                aria-label={`${getDisplayName(
                                  row
                                )} target progress`}
                                aria-valuemin={0}
                                aria-valuemax={target}
                                aria-valuenow={Math.min(count, target)}
                              >
                                <div
                                  style={{
                                    ...styles.progressFill,
                                    width: `${Math.min(percentage, 100)}%`,
                                    background:
                                      count > target
                                        ? `linear-gradient(90deg, ${COLORS.purple}, #c084fc)`
                                        : `linear-gradient(90deg, ${status.color}, ${status.color}bb)`,
                                  }}
                                />
                              </div>

                              <strong
                                style={{
                                  ...styles.progressPercent,
                                  color: status.color,
                                }}
                              >
                                {percentage}%
                              </strong>
                            </div>

                            <div style={styles.progressMeta}>
                              {count} of {target} evaluations
                            </div>
                          </td>

                          <td style={styles.td}>
                            <span
                              style={{
                                ...styles.statusBadge,
                                color: status.color,
                                background: status.background,
                              }}
                            >
                              <span style={styles.statusDot} />
                              {status.label}
                            </span>
                          </td>

                          <td style={styles.tdRight}>
                            <button
                              type="button"
                              className="evaluation-tracker-details-button"
                              style={{
                                ...styles.detailsButton,
                                ...(expanded
                                  ? styles.detailsButtonActive
                                  : {}),
                              }}
                              onClick={() =>
                                setExpandedTherapist(expanded ? null : key)
                              }
                              aria-expanded={expanded}
                            >
                              {expanded ? "Hide details" : "View details"}
                              <span aria-hidden="true">
                                {expanded ? "−" : "+"}
                              </span>
                            </button>
                          </td>
                        </tr>

                        {expanded && (
                          <tr>
                            <td colSpan={6} style={styles.expandedCell}>
                              <div style={styles.detailsPanel}>
                                <div style={styles.detailsHeading}>
                                  <div>
                                    <h3 style={styles.detailsTitle}>
                                      Individual evaluation records
                                    </h3>
                                    <p style={styles.detailsSubtitle}>
                                      {getDisplayName(row)} ·{" "}
                                      {formatDateLabel(fromDate)} —{" "}
                                      {formatDateLabel(toDate)}
                                    </p>
                                  </div>

                                  <span style={styles.resultBadge}>
                                    {records.length} records
                                  </span>
                                </div>

                                {records.length === 0 ? (
                                  <div style={styles.noRecords}>
                                    <strong>
                                      No individual records are available.
                                    </strong>
                                    <p>
                                      {count > 0
                                        ? "The API returned an evaluation count without its individual record details."
                                        : "No initial evaluations were recorded for this therapist during the selected period."}
                                    </p>
                                  </div>
                                ) : (
                                  <div style={styles.detailsScroll}>
                                    <table
                                      className="evaluation-tracker-details"
                                      style={styles.detailsTable}
                                    >
                                      <thead>
                                        <tr>
                                          {[
                                            "Patient",
                                            "File number",
                                            "Visit number",
                                            "Registered by",
                                            "Evaluation date",
                                            "Referring physician",
                                            "Specialty",
                                          ].map((heading) => (
                                            <th
                                              key={heading}
                                              style={styles.detailsTh}
                                            >
                                              {heading}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>

                                      <tbody>
                                        {records.map((record, recordIndex) => {
                                          const visitNumber =
                                            getVisitNumber(record);

                                          return (
                                            <tr
                                              key={
                                                record.id ??
                                                record.evaluation_id ??
                                                recordIndex
                                              }
                                            >
                                              <td style={styles.detailsTd}>
                                                {getField(record, [
                                                  "patient_name",
                                                  "full_name",
                                                  "name",
                                                  "patient",
                                                ]) || "—"}
                                              </td>

                                              <td style={styles.detailsTd}>
                                                {getField(record, [
                                                  "file_number",
                                                  "patient_file_number",
                                                  "medical_record_number",
                                                  "mrn",
                                                  "patient_file_id",
                                                ]) || "—"}
                                              </td>

                                              <td style={styles.detailsTd}>
                                                {visitNumber !== ""
                                                  ? String(visitNumber)
                                                  : "—"}
                                              </td>

                                              <td style={styles.detailsTd}>
                                                {getField(record, [
                                                  "receptionist_name",
                                                  "registered_by_name",
                                                  "registered_by",
                                                  "created_by_name",
                                                  "created_by",
                                                ]) || "—"}
                                              </td>

                                              <td style={styles.detailsTd}>
                                                {formatRecordDate(
                                                  getField(record, [
                                                    "evaluation_date",
                                                    "date",
                                                    "created_at",
                                                    "registration_date",
                                                  ])
                                                )}
                                              </td>

                                              <td style={styles.detailsTd}>
                                                {getField(record, [
                                                  "referring_physician_name",
                                                  "referring_doctor_name",
                                                  "referring_physician",
                                                  "referring_doctor",
                                                  "physician_name",
                                                  "doctor_name",
                                                ]) || "—"}
                                              </td>

                                              <td style={styles.detailsTd}>
                                                {getField(record, [
                                                  "physician_specialty",
                                                  "referring_physician_specialty",
                                                  "doctor_specialty",
                                                  "specialty",
                                                ]) || "—"}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                )}

                                {records.length > 0 &&
                                  records.every(
                                    (record) => getVisitNumber(record) === ""
                                  ) && (
                                    <div style={styles.visitNumberNotice}>
                                      Visit numbers are not included in the
                                      records returned by the API. The backend
                                      evaluation-tracker response must include
                                      the saved assignment visit number.
                                    </div>
                                  )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>

                <tfoot>
                  <tr>
                    <td colSpan={2} style={styles.footerLabel}>
                      Total evaluations in selected period
                    </td>
                    <td style={styles.footerCount}>{total}</td>
                    <td colSpan={3} style={styles.footerDate}>
                      {formatDateLabel(fromDate)} — {formatDateLabel(toDate)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <div style={styles.tableFooter}>
            <span>
              Showing {filteredRows.length} of {rows.length} displayed
              therapists
            </span>
            <span>
              {period === "today"
                ? "Daily target: 4"
                : "Monthly target: 30"}
            </span>
          </div>
        </section>
      </div>
    </section>
  );
}

const styles = {
  page: {
    display: "grid",
    gap: 22,
    minWidth: 0,
    paddingBottom: 18,
    color: COLORS.text,
    fontFamily:
      "Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  root: {
    display: "grid",
    gap: 22,
    minWidth: 0,
  },

  hero: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 22,
    padding: "30px 30px 27px",
    border: "1px solid rgba(255,255,255,.12)",
  },

  heroContent: {
    flex: "1 1 300px",
    minWidth: 0,
  },

  eyebrow: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    color: "#a5f3fc",
    fontSize: 10,
    fontWeight: 850,
    letterSpacing: ".15em",
  },

  eyebrowDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#5eead4",
    boxShadow: "0 0 0 4px rgba(94,234,212,.13)",
  },

  heroTitle: {
    margin: "14px 0 9px",
    fontSize: "clamp(27px, 3.2vw, 38px)",
    lineHeight: 1.15,
    fontWeight: 850,
    letterSpacing: "-.045em",
  },

  heroDescription: {
    maxWidth: 610,
    margin: 0,
    color: "#dbeafe",
    fontSize: 12,
    lineHeight: 1.9,
  },

  heroMetaRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 19,
  },

  heroDate: {
    display: "inline-flex",
    alignItems: "center",
    gap: 9,
    padding: "9px 12px",
    border: "1px solid rgba(255,255,255,.17)",
    borderRadius: 10,
    background: "rgba(255,255,255,.09)",
    color: "#ffffff",
    fontSize: 11,
    fontWeight: 700,
    backdropFilter: "blur(8px)",
  },

  liveDot: {
    width: 7,
    height: 7,
    flexShrink: 0,
    borderRadius: "50%",
    background: "#5eead4",
    boxShadow: "0 0 0 3px rgba(94,234,212,.12)",
  },

  heroTag: {
    padding: "8px 10px",
    border: "1px solid rgba(165,180,252,.28)",
    borderRadius: 8,
    background: "rgba(129,140,248,.15)",
    color: "#e0e7ff",
    fontSize: 9,
    fontWeight: 850,
    letterSpacing: ".09em",
  },

  refreshButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    minHeight: 42,
    padding: "11px 15px",
    border: "1px solid rgba(255,255,255,.24)",
    borderRadius: 11,
    background: "rgba(255,255,255,.13)",
    color: "#ffffff",
    fontSize: 11,
    fontWeight: 800,
    cursor: "pointer",
    backdropFilter: "blur(8px)",
  },

  refreshSymbol: {
    display: "inline-block",
    fontSize: 19,
    lineHeight: 1,
  },

  filterCard: {
    display: "grid",
    gap: 20,
    padding: 23,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 19,
    background: COLORS.surface,
    boxShadow: "0 5px 20px rgba(39,59,128,.045)",
  },

  sectionHeading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
  },

  headingLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  sectionIcon: {
    display: "grid",
    placeItems: "center",
    width: 39,
    height: 39,
    flexShrink: 0,
    borderRadius: 12,
    background: COLORS.blueSoft,
    color: COLORS.blue,
    fontSize: 24,
    fontWeight: 700,
  },

  sectionTitle: {
    margin: 0,
    color: COLORS.navy,
    fontSize: 15,
    fontWeight: 850,
    letterSpacing: "-.025em",
  },

  sectionSubtitle: {
    margin: "6px 0 0",
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 1.7,
  },

  filterTag: {
    padding: "7px 10px",
    border: "1px solid #dfe5ff",
    borderRadius: 8,
    background: "#f5f6ff",
    color: COLORS.indigo,
    fontSize: 9,
    fontWeight: 850,
    letterSpacing: ".1em",
  },

  monthRow: {
    display: "grid",
    gridTemplateColumns: "minmax(190px, 1fr) minmax(220px, 2fr)",
    gap: 16,
    alignItems: "end",
  },

  presetGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },

  presetButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    minHeight: 41,
    padding: "10px 13px",
    border: `1px solid ${COLORS.borderStrong}`,
    borderRadius: 10,
    background: "#ffffff",
    color: COLORS.text,
    fontSize: 11,
    fontWeight: 750,
    cursor: "pointer",
  },

  presetButtonActive: {
    borderColor: "#b8c3ff",
    background: "linear-gradient(135deg, #eef0ff, #f5f3ff)",
    color: COLORS.indigo,
    boxShadow: "0 2px 6px rgba(79,70,229,.07)",
  },

  dateGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 175px), 1fr))",
    alignItems: "end",
    gap: 14,
  },

  field: {
    display: "grid",
    gap: 8,
    minWidth: 0,
  },

  label: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: 850,
    letterSpacing: ".09em",
  },

  input: {
    boxSizing: "border-box",
    width: "100%",
    minWidth: 0,
    minHeight: 43,
    padding: "10px 12px",
    border: `1px solid ${COLORS.borderStrong}`,
    borderRadius: 10,
    background: "#fbfcff",
    color: COLORS.text,
    fontFamily: "inherit",
    fontSize: 12,
    outline: "none",
    colorScheme: "light",
  },

  dateActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 9,
    alignItems: "center",
  },

  primaryButton: {
    padding: "11px 15px",
    border: "1px solid #4f46e5",
    borderRadius: 10,
    background: "linear-gradient(135deg, #4f46e5, #4361ee)",
    color: "#ffffff",
    fontSize: 11,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(79,70,229,.15)",
  },

  secondaryButton: {
    padding: "10px 13px",
    border: `1px solid ${COLORS.borderStrong}`,
    borderRadius: 10,
    background: COLORS.surface,
    color: COLORS.navy,
    fontSize: 11,
    fontWeight: 750,
    cursor: "pointer",
  },

  errorBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    border: "1px solid #fecdd3",
    borderRadius: 13,
    background: "linear-gradient(135deg, #fff1f2, #fff8fa)",
    color: COLORS.red,
    fontSize: 12,
    lineHeight: 1.7,
  },

  errorIcon: {
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    width: 30,
    height: 30,
    borderRadius: 10,
    background: "#ffe4e8",
    color: COLORS.red,
    fontWeight: 900,
  },

  errorContent: {
    display: "grid",
    gap: 5,
  },

  errorRetry: {
    justifySelf: "start",
    marginTop: 5,
    padding: "8px 11px",
    border: "1px solid #f5b9c3",
    borderRadius: 9,
    background: "#ffffff",
    color: COLORS.red,
    fontWeight: 800,
    cursor: "pointer",
  },

  summarySection: {
    display: "grid",
    gap: 14,
  },

  summarySectionHeading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },

  liveLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "7px 10px",
    border: "1px solid #d6f5e8",
    borderRadius: 8,
    background: "#f0fdf7",
    color: COLORS.green,
    fontSize: 9,
    fontWeight: 850,
    letterSpacing: ".07em",
  },

  liveDotSmall: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: COLORS.green,
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 185px), 1fr))",
    gap: 14,
  },

  summaryCard: {
    position: "relative",
    display: "grid",
    gap: 12,
    minWidth: 0,
    overflow: "hidden",
    padding: 19,
    border: `1px solid ${COLORS.border}`,
    borderTop: "3px solid var(--card-accent)",
    borderRadius: 16,
    background: "linear-gradient(155deg, #ffffff 55%, var(--card-tint) 150%)",
    boxShadow: "0 5px 18px rgba(39,59,128,.045)",
  },

  summaryTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },

  summaryLabel: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: 800,
    lineHeight: 1.5,
  },

  summaryIcon: {
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    width: 39,
    height: 39,
    borderRadius: 13,
    fontSize: 19,
    fontWeight: 850,
  },

  summaryValue: {
    fontSize: 31,
    lineHeight: 1.1,
    fontWeight: 900,
    letterSpacing: "-.045em",
    fontVariantNumeric: "tabular-nums",
  },

  summaryNote: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 1.6,
  },

  summaryAccent: {
    width: 35,
    height: 4,
    marginTop: 1,
    borderRadius: 99,
    opacity: 0.8,
  },

  tableCard: {
    minWidth: 0,
    overflow: "hidden",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 19,
    background: COLORS.surface,
    boxShadow: "0 6px 22px rgba(39,59,128,.05)",
  },

  tableHeading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 14,
    padding: "22px 23px",
    borderBottom: `1px solid ${COLORS.border}`,
    background: "linear-gradient(120deg, #ffffff, #fafbff)",
  },

  tableTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  titleAccent: {
    width: 5,
    height: 38,
    flexShrink: 0,
    borderRadius: 99,
    background: "linear-gradient(180deg, #4361ee, #06b6d4)",
    boxShadow: "0 3px 8px rgba(67,97,238,.18)",
  },

  resultBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "8px 11px",
    border: "1px solid #dfe5ff",
    borderRadius: 9,
    background: "#f4f5ff",
    color: COLORS.indigo,
    fontSize: 10,
    fontWeight: 850,
    whiteSpace: "nowrap",
  },

  resultBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: COLORS.blue,
  },

  toolbar: {
    display: "flex",
    alignItems: "end",
    flexWrap: "wrap",
    gap: 12,
    padding: "16px 21px",
    borderBottom: `1px solid ${COLORS.border}`,
    background: "#fafbff",
  },

  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    flex: "1 1 250px",
    minWidth: 170,
    padding: "0 12px",
    border: `1px solid ${COLORS.borderStrong}`,
    borderRadius: 10,
    background: "#ffffff",
  },

  searchSymbol: {
    color: COLORS.indigo,
    fontSize: 24,
    lineHeight: 1,
  },

  searchInput: {
    boxSizing: "border-box",
    width: "100%",
    minWidth: 0,
    padding: "12px 0",
    border: 0,
    outline: 0,
    background: "transparent",
    color: COLORS.text,
    fontFamily: "inherit",
    fontSize: 11,
  },

  searchClear: {
    display: "grid",
    placeItems: "center",
    width: 25,
    height: 25,
    flexShrink: 0,
    border: 0,
    borderRadius: 7,
    background: "#eef0ff",
    color: COLORS.indigo,
    fontSize: 18,
    cursor: "pointer",
  },

  fieldCompact: {
    display: "grid",
    gap: 7,
    flex: "0 1 195px",
    minWidth: 140,
  },

  compactInput: {
    boxSizing: "border-box",
    width: "100%",
    minWidth: 0,
    minHeight: 42,
    padding: "10px 11px",
    border: `1px solid ${COLORS.borderStrong}`,
    borderRadius: 10,
    background: "#ffffff",
    color: COLORS.text,
    fontFamily: "inherit",
    fontSize: 10,
    outline: "none",
  },

  clearButton: {
    minHeight: 42,
    padding: "10px 12px",
    border: "1px solid #e0e5f5",
    borderRadius: 10,
    background: "#ffffff",
    color: COLORS.indigo,
    fontSize: 10,
    fontWeight: 800,
    cursor: "pointer",
  },

  tableScroll: {
    width: "100%",
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
  },

  table: {
    width: "100%",
    minWidth: 790,
    borderCollapse: "separate",
    borderSpacing: 0,
    textAlign: "left",
  },

  th: {
    padding: "14px 16px",
    background: "#f1f4ff",
    borderBottom: "1px solid #e1e7fa",
    color: "#52618a",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: ".075em",
    whiteSpace: "nowrap",
  },

  thRight: {
    padding: "14px 20px 14px 12px",
    background: "#f1f4ff",
    borderBottom: "1px solid #e1e7fa",
    color: "#52618a",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: ".075em",
    textAlign: "right",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "15px 16px",
    borderBottom: "1px solid #edf0f8",
    color: COLORS.text,
    fontSize: 11,
    verticalAlign: "middle",
  },

  tdMuted: {
    padding: "15px 16px",
    borderBottom: "1px solid #edf0f8",
    color: "#9ba7bd",
    fontSize: 10,
    fontWeight: 850,
    fontVariantNumeric: "tabular-nums",
  },

  tdRight: {
    padding: "15px 20px 15px 12px",
    borderBottom: "1px solid #edf0f8",
    textAlign: "right",
    whiteSpace: "nowrap",
  },

  person: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    minWidth: 190,
  },

  personInfo: {
    minWidth: 0,
  },

  avatar: {
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    width: 40,
    height: 40,
    border: "1px solid rgba(99,102,241,.12)",
    borderRadius: 13,
    fontSize: 14,
    fontWeight: 900,
  },

  personName: {
    color: COLORS.navy,
    fontSize: 11,
    fontWeight: 850,
    overflowWrap: "anywhere",
  },

  personMeta: {
    marginTop: 5,
    color: COLORS.muted,
    fontSize: 9,
  },

  countBadge: {
    display: "inline-grid",
    placeItems: "center",
    minWidth: 43,
    padding: "9px 12px",
    border: "1px solid #d9e2ff",
    borderRadius: 10,
    background: "linear-gradient(135deg, #eef0ff, #f2f6ff)",
    color: COLORS.indigo,
    fontSize: 14,
    fontWeight: 900,
    fontVariantNumeric: "tabular-nums",
  },

  progressLine: {
    display: "grid",
    gridTemplateColumns: "minmax(65px, 1fr) auto",
    alignItems: "center",
    gap: 10,
    minWidth: 135,
  },

  progressTrack: {
    height: 9,
    overflow: "hidden",
    borderRadius: 999,
    background: "#e9edf8",
    boxShadow: "inset 0 1px 2px rgba(35,50,90,.05)",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 400ms cubic-bezier(.2,.8,.2,1)",
  },

  progressPercent: {
    fontSize: 10,
    fontWeight: 900,
    fontVariantNumeric: "tabular-nums",
  },

  progressMeta: {
    marginTop: 7,
    color: COLORS.muted,
    fontSize: 9,
  },

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "8px 10px",
    border: "1px solid rgba(35,66,104,.05)",
    borderRadius: 9,
    fontSize: 9,
    fontWeight: 850,
    whiteSpace: "nowrap",
  },

  statusDot: {
    width: 6,
    height: 6,
    flexShrink: 0,
    borderRadius: "50%",
    background: "currentColor",
  },

  detailsButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 9,
    padding: "9px 11px",
    border: "1px solid #dfe4f5",
    borderRadius: 9,
    background: "#ffffff",
    color: COLORS.navy,
    fontSize: 10,
    fontWeight: 800,
    cursor: "pointer",
  },

  detailsButtonActive: {
    borderColor: "#c7d2fe",
    background: "#eef0ff",
    color: COLORS.indigo,
  },

  expandedCell: {
    padding: 0,
    borderBottom: `1px solid ${COLORS.border}`,
    background: "#f7f8ff",
  },

  detailsPanel: {
    display: "grid",
    gap: 15,
    padding: 21,
  },

  detailsHeading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },

  detailsTitle: {
    margin: 0,
    color: COLORS.navy,
    fontSize: 13,
    fontWeight: 900,
  },

  detailsSubtitle: {
    margin: "6px 0 0",
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 1.6,
  },

  detailsScroll: {
    width: "100%",
    overflowX: "auto",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    background: COLORS.surface,
  },

  detailsTable: {
    width: "100%",
    minWidth: 1050,
    borderCollapse: "separate",
    borderSpacing: 0,
    textAlign: "left",
  },

  detailsTh: {
    padding: 13,
    background: "#eef1ff",
    borderBottom: "1px solid #dfe5fa",
    color: "#52618a",
    fontSize: 9,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  detailsTd: {
    padding: 13,
    borderBottom: "1px solid #edf0f8",
    color: COLORS.text,
    fontSize: 10,
    lineHeight: 1.6,
    verticalAlign: "top",
  },

  noRecords: {
    padding: 18,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    background: "#ffffff",
    color: COLORS.text,
    fontSize: 11,
    lineHeight: 1.8,
  },

  visitNumberNotice: {
    padding: 13,
    border: "1px solid #cbdcff",
    borderRadius: 10,
    background: "#eff4ff",
    color: COLORS.navy,
    fontSize: 10,
    lineHeight: 1.7,
  },

  emptyState: {
    display: "grid",
    justifyItems: "center",
    gap: 11,
    padding: "48px 20px",
    textAlign: "center",
  },

  emptyIcon: {
    display: "grid",
    placeItems: "center",
    width: 58,
    height: 58,
    border: "1px solid #dfe4ff",
    borderRadius: 17,
    background: "linear-gradient(135deg, #eef0ff, #f5f3ff)",
    color: COLORS.indigo,
    fontSize: 29,
    fontWeight: 700,
  },

  emptyTitle: {
    margin: 0,
    color: COLORS.navy,
    fontSize: 15,
    fontWeight: 900,
  },

  emptyText: {
    maxWidth: 350,
    margin: 0,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 1.8,
  },

  message: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    padding: 42,
    color: COLORS.muted,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 1.8,
  },

  messageIcon: {
    display: "grid",
    placeItems: "center",
    width: 38,
    height: 38,
    borderRadius: 12,
    background: COLORS.redSoft,
    color: COLORS.red,
    fontSize: 20,
    fontWeight: 900,
  },

  loadingSpinner: {
    width: 29,
    height: 29,
    border: "3px solid #e4e8fb",
    borderTopColor: COLORS.indigo,
    borderRightColor: COLORS.blue,
    borderRadius: "50%",
    animation: "et-spin .8s linear infinite",
  },

  footerLabel: {
    padding: 16,
    background: "#f1f4ff",
    borderTop: "1px solid #e1e7fa",
    color: COLORS.navy,
    fontSize: 11,
    fontWeight: 850,
  },

  footerCount: {
    padding: 16,
    background: "#f1f4ff",
    borderTop: "1px solid #e1e7fa",
    color: COLORS.teal,
    fontSize: 15,
    fontWeight: 900,
    fontVariantNumeric: "tabular-nums",
  },

  footerDate: {
    padding: 16,
    background: "#f1f4ff",
    borderTop: "1px solid #e1e7fa",
    color: COLORS.muted,
    fontSize: 10,
  },

  tableFooter: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 9,
    padding: "14px 21px",
    borderTop: `1px solid ${COLORS.border}`,
    background: "#fafbff",
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 1.6,
  },
};
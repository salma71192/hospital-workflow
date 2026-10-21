import React, { useCallback, useEffect, useState } from "react";
import api from "../../api/api";
const REHAB_MANAGER_NAME = "Mohammed Mahmoud - Rehab Manager";
const DAILY_TARGET = 24;
const EXCLUDED_CATEGORIES = new Set([
  "task_without_eligibility",
  "without_eligibility",
  "no_eligibility",
  "missing_eligibility",
  "eligibility_missing",
  "not_eligible",
]);
function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[\s-]+/g, "_");
}
function getArray(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.results)) return data.results;
  return [];
}
function getTherapistId(row) {
  return (
    row?.therapist_id ??
    row?.therapist?.id ??
    row?.assigned_therapist_id ??
    row?.physio_id ??
    null
  );
}
function getTherapistName(row) {
  return String(
    row?.therapist_name ??
      row?.physio_name ??
      row?.physiotherapist_name ??
      row?.therapist?.display_name ??
      row?.therapist?.full_name ??
      row?.therapist?.name ??
      row?.therapist?.username ??
      row?.display_name ??
      row?.full_name ??
      row?.name ??
      row?.username ??
      ""
  ).trim();
}
function getCategory(row) {
  return normalize(
    row?.category ??
      row?.category_label ??
      row?.category_display ??
      row?.registration_type ??
      row?.visit_type ??
      row?.task_type ??
      row?.type
  );
}
function isExcludedRegistration(row) {
  const category = getCategory(row);
  return (
    row?.without_eligibility === true ||
    row?.no_eligibility === true ||
    row?.has_eligibility === false ||
    row?.eligibility === false ||
    row?.is_eligible === false ||
    EXCLUDED_CATEGORIES.has(category)
  );
}
function getRegistrationType(row) {
  const category = getCategory(row);
  if (
    [
      "walk_in",
      "walkin",
      "walk_in_patient",
      "walk_in_registration",
    ].includes(category)
  ) {
    return "walk_in";
  }
  if (
    [
      "initial_evaluation",
      "initial_eval",
      "evaluation",
      "evaluations",
      "eval",
    ].includes(category)
  ) {
    return "initial_eval";
  }
  if (
    [
      "cash",
      "cash_patient",
      "cash_visit",
      "cash_registration",
      "cash_payment",
    ].includes(category)
  ) {
    return "cash";
  }
  if (
    [
      "appointment",
      "appointments",
      "regular_session",
      "treatment_session",
      "follow_up",
      "followup",
      "follow_up_session",
      "appointment_follow_up",
      "appointment_and_follow_up",
    ].includes(category)
  ) {
    return "appointment";
  }
  return "other";
}
function getTherapistKey(row) {
  const id = row?.id ?? row?.therapist_id ?? row?.user_id;
  if (id !== null && id !== undefined && id !== "") {
    return String(id);
  }
  return normalize(getTherapistName(row));
}
function isRehabManager(row) {
  const name = normalize(getTherapistName(row));
  const role = normalize(row?.role ?? row?.user_role);
  return (
    name === normalize(REHAB_MANAGER_NAME) ||
    name.includes("mohammed_mahmoud") ||
    name === "rehab_manager" ||
    role === "rehab_manager"
  );
}
function createEmptyRow(therapist) {
  const name = isRehabManager(therapist)
    ? REHAB_MANAGER_NAME
    : getTherapistName(therapist);
  return {
    id: therapist?.id ?? therapist?.therapist_id ?? null,
    therapist_id: therapist?.id ?? therapist?.therapist_id ?? null,
    user_id: therapist?.id ?? therapist?.user_id ?? null,
    therapist_name: name || "Unnamed therapist",
    role: therapist?.role ?? "",
    booked: 0,
    appointments: 0,
    walk_in: 0,
    cash: 0,
    initial_eval: 0,
    no_show: 0,
    seen: 0,
    available_slots: DAILY_TARGET,
  };
}
function incrementRegistration(row, assignment) {
  if (isExcludedRegistration(assignment)) return;
  const type = getRegistrationType(assignment);
  if (type === "appointment") row.appointments += 1;
  if (type === "cash") row.cash += 1;
  if (type === "walk_in") row.walk_in += 1;
  if (type === "initial_eval") row.initial_eval += 1;
  // Booked and No Show are intentionally fixed at zero for now.
  row.booked = 0;
  row.no_show = 0;
  row.seen =
    row.appointments +
    row.cash +
    row.walk_in +
    row.initial_eval;
}
function buildStatistics(assignments, therapistList, selectedTherapistId) {
  const map = new Map();
  therapistList.forEach((therapist) => {
    const key = getTherapistKey(therapist);
    if (key) map.set(key, createEmptyRow(therapist));
  });
  const managerExists = Array.from(map.values()).some(isRehabManager);
  if (!managerExists) {
    const manager = createEmptyRow({
      id: "rehab-manager-placeholder",
      role: "rehab_manager",
      therapist_name: REHAB_MANAGER_NAME,
    });
    manager.is_static_placeholder = true;
    map.set("rehab-manager-placeholder", manager);
  }
  assignments.forEach((assignment) => {
    if (isExcludedRegistration(assignment)) return;
    const therapistId = getTherapistId(assignment);
    const therapistName = getTherapistName(assignment);
    const key =
      therapistId !== null && therapistId !== undefined
        ? String(therapistId)
        : normalize(therapistName);
    if (!key) return;
    if (!map.has(key)) {
      map.set(
        key,
        createEmptyRow({
          id: therapistId ?? key,
          therapist_name: therapistName || "Unnamed therapist",
        })
      );
    }
    incrementRegistration(map.get(key), assignment);
  });
  let rows = Array.from(map.values());
  if (selectedTherapistId !== "all") {
    rows = rows.filter(
      (row) =>
        String(row.therapist_id) === String(selectedTherapistId) ||
        String(row.id) === String(selectedTherapistId) ||
        String(row.user_id) === String(selectedTherapistId)
    );
  }
  rows.sort((a, b) => {
    const aManager = isRehabManager(a);
    const bManager = isRehabManager(b);
    if (aManager && !bManager) return -1;
    if (!aManager && bManager) return 1;
    return a.therapist_name.localeCompare(b.therapist_name);
  });
  const totals = rows.reduce(
    (result, row) => {
      result.available_slots += DAILY_TARGET;
      result.booked += 0;
      result.appointments += row.appointments;
      result.walk_in += row.walk_in;
      result.cash += row.cash;
      result.initial_eval += row.initial_eval;
      result.no_show += 0;
      result.seen += row.seen;
      return result;
    },
    {
      available_slots: 0,
      booked: 0,
      appointments: 0,
      walk_in: 0,
      cash: 0,
      initial_eval: 0,
      no_show: 0,
      seen: 0,
    }
  );
  return { rows, totals };
}
function getLocalDateString() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}
function getMonthRange(month) {
  const [year, monthNumber] = String(month).split("-").map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  const formattedMonth = String(monthNumber).padStart(2, "0");
  return {
    start_date: `${year}-${formattedMonth}-01`,
    end_date: `${year}-${formattedMonth}-${String(lastDay).padStart(
      2,
      "0"
    )}`,
  };
}
export default function AdminStatisticsSection() {
  const today = getLocalDateString();
  const [mode, setMode] = useState("day");
  const [statisticsDate, setStatisticsDate] = useState(today);
  const [statisticsMonth, setStatisticsMonth] = useState(today.slice(0, 7));
  const [therapistFilter, setTherapistFilter] = useState("all");
  const [stats, setStats] = useState(null);
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const loadStats = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const range =
        mode === "month"
          ? getMonthRange(statisticsMonth)
          : {
              start_date: statisticsDate,
              end_date: statisticsDate,
            };
      const params = new URLSearchParams(range);
      const response = await api.get(
        `reception/assignments/?${params.toString()}`
      );
      const data = response?.data ?? {};
      const assignments = getArray(data, "assignments");
      const apiTherapists = getArray(data, "therapists");
      setTherapists(apiTherapists);
      const calculated = buildStatistics(
        assignments,
        apiTherapists,
        therapistFilter
      );
      setStats({
        ...calculated,
        assignments,
      });
    } catch (error) {
      console.error("Failed to load registration statistics:", error);
      console.error("Statistics API response:", error?.response?.data);
      setStats(null);
      setErrorMessage(
        error?.response?.data?.error ||
          "Unable to load statistics. Check the reception assignments API and your admin permissions."
      );
    } finally {
      setLoading(false);
    }
  }, [mode, statisticsDate, statisticsMonth, therapistFilter]);
  useEffect(() => {
    loadStats();
  }, [loadStats]);
  const rows = stats?.rows ?? [];
  const totals = stats?.totals ?? {};
  const cards = [
    {
      label: "Appointments",
      value: totals.appointments ?? 0,
      color: "#2563eb",
      background: "#dbeafe",
    },
    {
      label: "Cash",
      value: totals.cash ?? 0,
      color: "#059669",
      background: "#d1fae5",
    },
    {
      label: "Walk-ins",
      value: totals.walk_in ?? 0,
      color: "#d97706",
      background: "#fef3c7",
    },
    {
      label: "Initial Evaluations",
      value: totals.initial_eval ?? 0,
      color: "#7c3aed",
      background: "#f3e8ff",
    },
    {
      label: "Total Seen",
      value: totals.seen ?? 0,
      color: "#0f766e",
      background: "#ccfbf1",
    },
  ];
  return (
    <div style={styles.page}>
      <section style={styles.container}>
        <header style={styles.header}>
          <div>
            <h2 style={styles.heading}>Physiotherapy Statistics</h2>
            <p style={styles.subtitle}>
              Monitor appointments, evaluations, walk-ins and therapist
              activity.
            </p>
          </div>
          <div style={styles.dateField}>
            <label style={styles.fieldLabel}>
              {mode === "day" ? "Select Date" : "Select Month"}
            </label>
            {mode === "day" ? (
              <input
                type="date"
                value={statisticsDate}
                onChange={(event) => setStatisticsDate(event.target.value)}
                style={styles.input}
              />
            ) : (
              <input
                type="month"
                value={statisticsMonth}
                onChange={(event) => setStatisticsMonth(event.target.value)}
                style={styles.input}
              />
            )}
          </div>
        </header>
        <section style={styles.filters}>
          <label style={styles.filterField}>
            <span style={styles.fieldLabel}>Statistics Period</span>
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value)}
              style={styles.input}
            >
              <option value="day">Daily</option>
              <option value="month">Monthly</option>
            </select>
          </label>
          <label style={styles.filterField}>
            <span style={styles.fieldLabel}>Physiotherapist</span>
            <select
              value={therapistFilter}
              onChange={(event) => setTherapistFilter(event.target.value)}
              style={styles.input}
            >
              <option value="all">All Physiotherapists</option>
              {therapists.map((therapist, index) => (
                <option
                  key={
                    therapist.id ??
                    therapist.therapist_id ??
                    `${getTherapistName(therapist)}-${index}`
                  }
                  value={String(
                    therapist.id ?? therapist.therapist_id ?? ""
                  )}
                >
                  {isRehabManager(therapist)
                    ? REHAB_MANAGER_NAME
                    : getTherapistName(therapist) ||
                      therapist.username ||
                      `Therapist ${therapist.id ?? index + 1}`}
                </option>
              ))}
            </select>
          </label>
          <div style={styles.targetInfo}>
            <span style={styles.targetLabel}>DAILY TARGET</span>
            <strong style={styles.targetValue}>{DAILY_TARGET}</strong>
            <span style={styles.targetHint}>Patients per therapist</span>
          </div>
          <button
            type="button"
            style={{
              ...styles.refreshButton,
              ...(loading ? styles.refreshButtonDisabled : {}),
            }}
            onClick={loadStats}
            disabled={loading}
          >
            {loading ? "Loading..." : "↻ Refresh Statistics"}
          </button>
        </section>
        {errorMessage && (
          <div style={styles.errorCard}>
            <strong style={styles.errorTitle}>
              Statistics Unavailable
            </strong>
            <p style={styles.errorText}>{errorMessage}</p>
            <button
              type="button"
              style={styles.retryButton}
              onClick={loadStats}
            >
              Try Again
            </button>
          </div>
        )}
        <section style={styles.summaryGrid}>
          {cards.map((card) => (
            <article key={card.label} style={styles.summaryCard}>
              <div
                style={{
                  ...styles.cardIcon,
                  background: card.background,
                  color: card.color,
                }}
              >
                {card.label === "Appointments"
                  ? "A"
                  : card.label === "Cash"
                    ? "$"
                    : card.label === "Walk-ins"
                      ? "W"
                      : card.label === "Initial Evaluations"
                        ? "E"
                        : "✓"}
              </div>
              <div style={styles.cardContent}>
                <span style={styles.cardLabel}>{card.label}</span>
                <strong style={{ ...styles.cardValue, color: card.color }}>
                  {Number(card.value).toLocaleString()}
                </strong>
              </div>
            </article>
          ))}
        </section>
        <section style={styles.tableCard}>
          <header style={styles.tableHeader}>
            <div>
              <h3 style={styles.tableTitle}>Team Statistics</h3>
              <p style={styles.tableSubtitle}>
                Appointment and patient registration breakdown
              </p>
            </div>
            <span style={styles.memberCount}>
              {rows.length} {rows.length === 1 ? "Team Member" : "Team Members"}
            </span>
          </header>
          {loading && !stats ? (
            <div style={styles.message}>Loading statistics...</div>
          ) : stats ? (
            <div style={styles.tableScroll}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Physio</th>
                    <th style={styles.th}>Available Slots</th>
                    <th style={styles.th}>Booked</th>
                    <th style={styles.th}>Appointments</th>
                    <th style={styles.th}>Walk In</th>
                    <th style={styles.th}>Cash</th>
                    <th style={styles.th}>Initial Eval</th>
                    <th style={styles.th}>No Show</th>
                    <th style={styles.th}>Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr
                      key={
                        row.id ??
                        row.therapist_id ??
                        `${row.therapist_name}-${index}`
                      }
                    >
                      <td style={styles.tdName}>
                        <span style={styles.therapistName}>
                          {row.therapist_name}
                        </span>
                        {isRehabManager(row) && (
                          <span style={styles.managerBadge}>
                            Rehab Manager
                          </span>
                        )}
                      </td>
                      <td style={styles.td}>{DAILY_TARGET}</td>
                      <td style={styles.td}>
                        <span style={styles.zeroBadge}>0</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.appointmentValue}>
                          {row.appointments}
                        </span>
                      </td>
                      <td style={styles.td}>{row.walk_in}</td>
                      <td style={styles.td}>{row.cash}</td>
                      <td style={styles.td}>{row.initial_eval}</td>
                      <td style={styles.td}>
                        <span style={styles.zeroBadge}>0</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.seenValue}>{row.seen}</span>
                      </td>
                    </tr>
                  ))}
                  <tr style={styles.totalRow}>
                    <td style={styles.totalName}>TOTAL</td>
                    <td style={styles.totalCell}>
                      {totals.available_slots ?? 0}
                    </td>
                    <td style={styles.totalCell}>0</td>
                    <td style={styles.totalCell}>
                      {totals.appointments ?? 0}
                    </td>
                    <td style={styles.totalCell}>{totals.walk_in ?? 0}</td>
                    <td style={styles.totalCell}>{totals.cash ?? 0}</td>
                    <td style={styles.totalCell}>
                      {totals.initial_eval ?? 0}
                    </td>
                    <td style={styles.totalCell}>0</td>
                    <td style={styles.totalCell}>{totals.seen ?? 0}</td>
                  </tr>
                </tbody>
              </table>
              {rows.length === 0 && (
                <div style={styles.message}>
                  No therapist records found for this selection.
                </div>
              )}
            </div>
          ) : (
            !errorMessage && (
              <div style={styles.message}>
                No statistics are available.
              </div>
            )
          )}
        </section>
        <p style={styles.note}>
          Total Seen includes appointments, cash registrations, walk-ins and
          initial evaluations. Tasks without eligibility are excluded.
        </p>
      </section>
    </div>
  );
}
const styles = {
  page: {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    padding: "clamp(14px, 2vw, 26px)",
    background: "#f1f5fb",
    color: "#19345a",
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  container: {
    width: "100%",
    maxWidth: 1800,
    margin: "0 auto",
    padding: "clamp(16px, 2vw, 26px)",
    boxSizing: "border-box",
    background: "#f8faff",
    border: "1px solid #e1e9f5",
    borderRadius: 20,
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  header: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 18,
  },
  heading: {
    margin: 0,
    color: "#18345d",
    fontSize: "clamp(25px, 2.6vw, 31px)",
    fontWeight: 800,
    letterSpacing: "-0.5px",
    lineHeight: 1.25,
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#667b99",
    fontSize: 14,
    lineHeight: 1.6,
  },
  dateField: {
    flex: "0 1 230px",
    minWidth: 200,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  fieldLabel: {
    color: "#344c6c",
    fontSize: 14,
    fontWeight: 800,
  },
  filters: {
    display: "flex",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: 15,
    padding: 18,
    borderRadius: 15,
    background: "#fff",
    border: "1px solid #dce6f4",
    boxShadow: "0 4px 14px rgba(29, 57, 91, 0.04)",
  },
  filterField: {
    flex: "1 1 210px",
    minWidth: 180,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  input: {
    width: "100%",
    minHeight: 46,
    boxSizing: "border-box",
    padding: "10px 13px",
    border: "1px solid #d2deed",
    borderRadius: 10,
    background: "#fff",
    color: "#263f60",
    fontSize: 14,
    fontWeight: 600,
    outlineColor: "#3b82f6",
  },
  targetInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 150,
    padding: "10px 14px",
    borderRadius: 11,
    background: "#eff6ff",
    border: "1px solid #d5e6ff",
  },
  targetLabel: {
    color: "#52709b",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.7px",
  },
  targetValue: {
    color: "#2563eb",
    fontSize: 26,
    lineHeight: 1.2,
    fontWeight: 800,
  },
  targetHint: {
    color: "#647b9d",
    fontSize: 12,
  },
  refreshButton: {
    minHeight: 46,
    padding: "11px 17px",
    border: "none",
    borderRadius: 10,
    background: "#087f5b",
    color: "#fff",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(8, 127, 91, 0.15)",
  },
  refreshButtonDisabled: {
    opacity: 0.7,
    cursor: "wait",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 195px), 1fr))",
    gap: 13,
  },
  summaryCard: {
    display: "flex",
    alignItems: "center",
    gap: 13,
    minWidth: 0,
    padding: "18px 17px",
    background: "#fff",
    border: "1px solid #dfe8f5",
    borderRadius: 15,
    boxShadow: "0 5px 16px rgba(24, 52, 93, 0.04)",
  },
  cardIcon: {
    flex: "0 0 46px",
    width: 46,
    height: 46,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    fontSize: 21,
    fontWeight: 900,
  },
  cardContent: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  cardLabel: {
    color: "#536985",
    fontSize: 13,
    lineHeight: 1.4,
    fontWeight: 700,
  },
  cardValue: {
    fontSize: 29,
    lineHeight: 1.1,
    fontWeight: 900,
    overflowWrap: "anywhere",
  },
  tableCard: {
    minWidth: 0,
    overflow: "hidden",
    background: "#fff",
    border: "1px solid #dce6f3",
    borderRadius: 16,
    boxShadow: "0 5px 18px rgba(24, 52, 93, 0.04)",
  },
  tableHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 13,
    padding: "19px 21px",
    borderBottom: "1px solid #e2eaf5",
  },
  tableTitle: {
    margin: 0,
    color: "#19365f",
    fontSize: 20,
    fontWeight: 900,
  },
  tableSubtitle: {
    margin: "6px 0 0",
    color: "#6d819d",
    fontSize: 13,
    lineHeight: 1.5,
  },
  memberCount: {
    padding: "8px 12px",
    borderRadius: 999,
    background: "#e8f1ff",
    color: "#2f5fae",
    fontSize: 12,
    fontWeight: 800,
  },
  tableScroll: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    minWidth: 1150,
    borderCollapse: "collapse",
    textAlign: "left",
    fontSize: 14,
  },
  th: {
    padding: "15px 16px",
    background: "#edf3fb",
    color: "#344e70",
    fontSize: 13,
    fontWeight: 900,
    borderBottom: "1px solid #dce6f3",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "15px 16px",
    color: "#415873",
    fontSize: 14,
    fontWeight: 600,
    borderBottom: "1px solid #edf1f7",
    whiteSpace: "nowrap",
    textAlign: "center",
  },
  tdName: {
    padding: "15px 16px",
    color: "#19365f",
    fontSize: 14,
    fontWeight: 800,
    borderBottom: "1px solid #edf1f7",
    whiteSpace: "nowrap",
  },
  therapistName: {
    display: "inline-block",
    verticalAlign: "middle",
  },
  managerBadge: {
    display: "inline-block",
    verticalAlign: "middle",
    marginLeft: 8,
    padding: "4px 7px",
    borderRadius: 6,
    background: "#ede9fe",
    color: "#6d28d9",
    fontSize: 10,
    fontWeight: 900,
  },
  appointmentValue: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 31,
    padding: "5px 9px",
    borderRadius: 8,
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: 14,
    fontWeight: 900,
  },
  seenValue: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 31,
    padding: "5px 9px",
    borderRadius: 8,
    background: "#d1fae5",
    color: "#047857",
    fontSize: 14,
    fontWeight: 900,
  },
  zeroBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 27,
    padding: "4px 8px",
    borderRadius: 7,
    background: "#f1f5f9",
    color: "#64748b",
    fontSize: 13,
    fontWeight: 800,
  },
  totalRow: {
    background: "#eaf2fc",
  },
  totalName: {
    padding: "16px",
    color: "#19365f",
    fontSize: 14,
    fontWeight: 900,
    borderTop: "2px solid #d3dfef",
    whiteSpace: "nowrap",
  },
  totalCell: {
    padding: "16px",
    color: "#19365f",
    fontSize: 14,
    fontWeight: 900,
    borderTop: "2px solid #d3dfef",
    textAlign: "center",
    whiteSpace: "nowrap",
  },
  message: {
    padding: 28,
    color: "#5f7491",
    fontSize: 14,
    fontWeight: 600,
    textAlign: "center",
  },
  note: {
    margin: 0,
    color: "#667b98",
    fontSize: 13,
    lineHeight: 1.7,
  },
  errorCard: {
    padding: 18,
    background: "#fff",
    border: "1px solid #fecaca",
    borderRadius: 13,
    color: "#991b1b",
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 900,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 1.6,
  },
  retryButton: {
    marginTop: 7,
    padding: "10px 14px",
    border: "none",
    borderRadius: 8,
    background: "#087f5b",
    color: "#fff",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  },
};
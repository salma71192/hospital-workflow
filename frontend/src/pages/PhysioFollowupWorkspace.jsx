import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import DashboardLayout from "../components/DashboardLayout";
import DashboardNotice from "../components/common/DashboardNotice";
import PatientTrackerTable from "../components/patients/PatientTrackerTable";
import PhysioTodayRegistrationsSection from "../components/physio/PhysioTodayRegistrationsSection";
const styles = {
  stack: {
    display: "grid",
    gap: 16,
  },
};
function getLocalDateString() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}
function getArray(data, key) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.[key]) ? data[key] : [];
}
function getTherapistId(item) {
  return (
    item?.therapist_id ??
    item?.therapist?.id ??
    item?.assigned_therapist_id ??
    item?.physio_id ??
    item?.physiotherapist_id ??
    null
  );
}
function belongsToTherapist(item, therapistId) {
  if (therapistId == null) return false;
  const id = getTherapistId(item);
  return id != null && String(id) === String(therapistId);
}
function getCategory(item) {
  return String(item?.category ?? item?.category_label ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}
const CATEGORIES = {
  walkIn: ["walk_in", "walkin", "walk_in_patient"],
  appointment: [
    "appointment",
    "regular_session",
    "treatment_session",
    "follow_up",
    "followup",
  ],
  evaluation: [
    "initial_evaluation",
    "initial_eval",
    "evaluation",
    "eval",
  ],
  cash: [
    "cash",
    "cash_patient",
    "cash_visit",
    "cash_registration",
    "cash_payment",
  ],
  noShow: ["no_show", "noshow", "did_not_attend"],
};
function matchesCategory(item, categories) {
  return categories.includes(getCategory(item));
}
function isSeen(item) {
  const status = String(
    item?.status ??
      item?.appointment_status ??
      item?.visit_status ??
      item?.registration_status ??
      ""
  )
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return (
    item?.seen === true ||
    item?.is_seen === true ||
    item?.attended === true ||
    item?.is_completed === true ||
    item?.completed === true ||
    ["seen", "completed", "attended", "treated"].includes(status)
  );
}
function isNoShow(item) {
  const status = String(
    item?.status ??
      item?.appointment_status ??
      item?.visit_status ??
      item?.registration_status ??
      ""
  )
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return (
    item?.no_show === true ||
    item?.is_no_show === true ||
    CATEGORIES.noShow.includes(status)
  );
}
/*
 * Booked remains 0 until appointment-based booked counts
 * are connected later.
 *
 * Seen is the sum of qualifying appointments, evaluations,
 * cash registrations, and walk-ins.
 *
 * No-show registrations are excluded from Seen.
 */
function buildPhysioStatistics(assignments) {
  const grouped = new Map();
  assignments.forEach((item) => {
    const therapistId = getTherapistId(item);
    const therapist = item?.therapist ?? {};
    const therapistName =
      item?.therapist_name ??
      item?.physio_name ??
      item?.physiotherapist_name ??
      item?.display_name ??
      therapist?.name ??
      therapist?.username ??
      item?.therapist_username ??
      "Unnamed therapist";
    const key =
      therapistId != null ? String(therapistId) : therapistName;
    if (!grouped.has(key)) {
      grouped.set(key, {
        therapist_id: therapistId ?? key,
        therapist_name: therapistName,
        available_slots: 24,
        booked: 0,
        walk_in: 0,
        initial_eval: 0,
        cash: 0,
        no_show: 0,
        seen: 0,
      });
    }
    const row = grouped.get(key);
    const category = getCategory(item);
    const walkIn = CATEGORIES.walkIn.includes(category);
    const appointment = CATEGORIES.appointment.includes(category);
    const evaluation = CATEGORIES.evaluation.includes(category);
    const cash = CATEGORIES.cash.includes(category);
    const noShow = isNoShow(item);
    if (walkIn) row.walk_in += 1;
    if (evaluation) row.initial_eval += 1;
    if (cash) row.cash += 1;
    if (noShow) row.no_show += 1;
    // Booked is intentionally zero for now.
    row.booked = 0;
    // Count each qualifying registration once.
    // A no-show must not be counted as seen.
    const qualifyingRegistration =
      appointment || evaluation || cash || walkIn;
    if (qualifyingRegistration && !noShow) {
      row.seen += 1;
    }
  });
  const rows = Array.from(grouped.values()).sort((a, b) =>
    a.therapist_name.localeCompare(b.therapist_name)
  );
  return { rows };
}
function PhysioStatisticsTable({
  stats,
  title = "Physio Statistics",
}) {
  const rows = stats?.rows ?? [];
  const s = {
    card: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: 18,
      padding: 22,
      boxShadow: "0 8px 26px rgba(15, 23, 42, 0.05)",
      display: "grid",
      gap: 18,
      minWidth: 0,
      fontFamily: "Inter, Arial, sans-serif",
    },
    heading: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 12,
    },
    title: {
      margin: 0,
      fontSize: 23,
      fontWeight: 800,
      color: "#10243e",
      letterSpacing: "-0.4px",
    },
    subtitle: {
      marginTop: 6,
      fontSize: 13,
      color: "#718096",
      lineHeight: 1.5,
    },
    badge: {
      background: "#e9f9f1",
      color: "#08784f",
      padding: "8px 12px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 800,
      whiteSpace: "nowrap",
    },
    tableWrap: {
      width: "100%",
      overflowX: "auto",
      border: "1px solid #e3eaf2",
      borderRadius: 13,
    },
    table: {
      width: "100%",
      minWidth: 760,
      borderCollapse: "separate",
      borderSpacing: 0,
      background: "#ffffff",
    },
    th: {
      textAlign: "left",
      padding: "14px 15px",
      background: "#f4f7fb",
      color: "#52647a",
      fontSize: 11,
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "0.45px",
      whiteSpace: "nowrap",
      borderBottom: "1px solid #e1e8f0",
    },
    td: {
      padding: "15px",
      color: "#465970",
      fontSize: 13,
      borderBottom: "1px solid #edf1f6",
      whiteSpace: "nowrap",
    },
    therapist: {
      color: "#16334f",
      fontWeight: 750,
    },
    numberBadge: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: 30,
      padding: "6px 9px",
      borderRadius: 8,
      background: "#edf3fa",
      color: "#254866",
      fontWeight: 800,
    },
    seenBadge: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: 38,
      padding: "7px 11px",
      borderRadius: 9,
      background: "#dff7e9",
      color: "#08784f",
      fontSize: 14,
      fontWeight: 850,
    },
    empty: {
      padding: 28,
      borderRadius: 12,
      border: "1px dashed #cbd5e1",
      background: "#f8fafc",
      color: "#64748b",
      textAlign: "center",
      lineHeight: 1.6,
    },
  };
  return (
    <section style={s.card}>
      <div style={s.heading}>
        <div>
          <h2 style={s.title}>{title}</h2>
          <div style={s.subtitle}>
            Today's physiotherapy registrations
          </div>
        </div>
        <span style={s.badge}>
          {rows.length} {rows.length === 1 ? "therapist" : "therapists"}
        </span>
      </div>
      {!rows.length ? (
        <div style={s.empty}>
          No registration statistics are available for today.
        </div>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Therapist</th>
                <th style={s.th}>Available Slots</th>
                <th style={s.th}>Booked</th>
                <th style={s.th}>Walk In</th>
                <th style={s.th}>Initial Eval</th>
                <th style={s.th}>Cash</th>
                <th style={s.th}>No Show</th>
                <th style={s.th}>Seen</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.therapist_id}>
                  <td style={{ ...s.td, ...s.therapist }}>
                    {row.therapist_name}
                  </td>
                  <td style={s.td}>
                    <span style={s.numberBadge}>
                      {row.available_slots}
                    </span>
                  </td>
                  <td style={s.td}>{row.booked}</td>
                  <td style={s.td}>{row.walk_in}</td>
                  <td style={s.td}>{row.initial_eval}</td>
                  <td style={s.td}>{row.cash}</td>
                  <td style={s.td}>{row.no_show}</td>
                  <td style={s.td}>
                    <span style={s.seenBadge}>{row.seen}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
function getMonthLabel() {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date());
}
function getLeaderboardName(item) {
  return (
    item?.therapist_name ??
    item?.physio_name ??
    item?.physiotherapist_name ??
    item?.display_name ??
    item?.name ??
    item?.username ??
    item?.therapist?.name ??
    item?.therapist?.username ??
    "Unnamed therapist"
  );
}
function getMonthlyPatientCount(item) {
  const value =
    item?.monthly_patients_seen ??
    item?.patients_seen ??
    item?.monthly_count ??
    item?.monthly ??
    item?.count ??
    0;
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? count : 0;
}
function getLeaderboardId(item, index) {
  return (
    item?.therapist_id ??
    item?.physio_id ??
    item?.physiotherapist_id ??
    item?.user_id ??
    item?.therapist?.id ??
    item?.id ??
    `${getLeaderboardName(item)}-${index}`
  );
}
function getTarget(item) {
  const value = Number(item?.target ?? item?.monthly_target ?? 100);
  return Number.isFinite(value) && value > 0 ? value : 100;
}
function MonthlyPhysioLeaderboard({
  rows = [],
  loading = false,
  error = "",
  onReload,
}) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("count");
  const rankedRows = useMemo(
    () =>
      [...rows].sort((a, b) =>
        sortBy === "name"
          ? getLeaderboardName(a).localeCompare(getLeaderboardName(b))
          : getMonthlyPatientCount(b) - getMonthlyPatientCount(a)
      ),
    [rows, sortBy]
  );
  const filteredRows = useMemo(
    () =>
      rankedRows.filter((row) =>
        getLeaderboardName(row)
          .toLowerCase()
          .includes(search.trim().toLowerCase())
      ),
    [rankedRows, search]
  );
  const totalPatients = rows.reduce(
    (sum, row) => sum + getMonthlyPatientCount(row),
    0
  );
  const therapistCount = rows.length;
  const averagePatients = therapistCount
    ? Math.round(totalPatients / therapistCount)
    : 0;
  const completedTargets = rows.filter(
    (row) => getMonthlyPatientCount(row) >= getTarget(row)
  ).length;
  const topTherapist = [...rows].sort(
    (a, b) => getMonthlyPatientCount(b) - getMonthlyPatientCount(a)
  )[0];
  const s = {
    container: {
      background: "#f4f7fb",
      border: "1px solid #e8edf4",
      borderRadius: 18,
      padding: 22,
      color: "#172033",
      fontFamily: "Inter, Arial, sans-serif",
      width: "100%",
      boxSizing: "border-box",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 14,
      flexWrap: "wrap",
      marginBottom: 22,
    },
    title: {
      margin: 0,
      fontSize: 24,
      fontWeight: 800,
      color: "#172b4d",
    },
    subtitle: {
      color: "#7b879a",
      fontSize: 13,
      lineHeight: 1.6,
      marginTop: 6,
    },
    button: {
      border: "1px solid #dbe4ee",
      borderRadius: 10,
      padding: "10px 15px",
      background: "#ffffff",
      color: "#243b53",
      fontSize: 13,
      fontWeight: 700,
      cursor: loading ? "wait" : "pointer",
      opacity: loading ? 0.65 : 1,
    },
    cards: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
      gap: 14,
      marginBottom: 20,
    },
    card: {
      background: "#ffffff",
      border: "1px solid #e6ecf3",
      borderRadius: 15,
      padding: 17,
      minWidth: 0,
    },
    label: {
      color: "#77859a",
      fontSize: 11,
      fontWeight: 750,
      letterSpacing: "0.5px",
      marginBottom: 13,
      textTransform: "uppercase",
    },
    value: {
      color: "#1d3150",
      fontSize: 28,
      fontWeight: 800,
      overflowWrap: "anywhere",
    },
    panel: {
      background: "#ffffff",
      border: "1px solid #e4eaf2",
      borderRadius: 15,
      overflow: "hidden",
    },
    toolbar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 14,
      flexWrap: "wrap",
      padding: 18,
      borderBottom: "1px solid #edf1f6",
    },
    controls: {
      display: "flex",
      gap: 9,
      flexWrap: "wrap",
      alignItems: "center",
    },
    input: {
      border: "1px solid #dce4ee",
      borderRadius: 9,
      padding: "10px 12px",
      background: "#ffffff",
      color: "#243b53",
      fontSize: 13,
      minWidth: 170,
      maxWidth: "100%",
      boxSizing: "border-box",
    },
    tableWrapper: {
      width: "100%",
      overflowX: "auto",
    },
    table: {
      width: "100%",
      minWidth: 680,
      borderCollapse: "collapse",
      textAlign: "left",
    },
    th: {
      padding: "13px 16px",
      background: "#f8fafd",
      color: "#77859a",
      fontSize: 10,
      fontWeight: 800,
      textTransform: "uppercase",
      whiteSpace: "nowrap",
      borderBottom: "1px solid #e9eef5",
    },
    td: {
      padding: "15px 16px",
      borderBottom: "1px solid #f0f3f7",
      color: "#34445c",
      fontSize: 13,
      verticalAlign: "middle",
    },
    message: {
      textAlign: "center",
      padding: 30,
      color: "#7b879a",
      fontSize: 13,
      lineHeight: 1.6,
    },
    error: {
      margin: 16,
      padding: 13,
      borderRadius: 10,
      border: "1px solid #fecaca",
      background: "#fff1f2",
      color: "#b42318",
      fontSize: 13,
    },
  };
  return (
    <section style={s.container}>
      <div style={s.header}>
        <div>
          <h2 style={s.title}>Physiotherapy Leaderboard</h2>
          <div style={s.subtitle}>
            Monthly performance overview · {getMonthLabel()}
          </div>
        </div>
        <button
          type="button"
          onClick={onReload}
          disabled={loading}
          style={s.button}
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>
      <div style={s.cards}>
        <div style={s.card}>
          <div style={s.label}>Total patients</div>
          <div style={s.value}>{totalPatients.toLocaleString()}</div>
        </div>
        <div style={s.card}>
          <div style={s.label}>Therapists</div>
          <div style={s.value}>{therapistCount}</div>
        </div>
        <div style={s.card}>
          <div style={s.label}>Average per therapist</div>
          <div style={s.value}>{averagePatients}</div>
        </div>
        <div style={s.card}>
          <div style={s.label}>Target achieved</div>
          <div style={s.value}>
            {completedTargets}/{therapistCount}
          </div>
        </div>
        <div style={{ ...s.card, background: "#eaf7f1" }}>
          <div style={{ ...s.label, color: "#378267" }}>
            Current leader
          </div>
          <div
            style={{
              ...s.value,
              fontSize: 17,
              color: "#146c50",
            }}
          >
            {topTherapist
              ? getLeaderboardName(topTherapist)
              : "No data yet"}
          </div>
          <div style={{ ...s.subtitle, color: "#378267" }}>
            {topTherapist
              ? `${getMonthlyPatientCount(topTherapist)} patients`
              : "Monthly ranking"}
          </div>
        </div>
      </div>
      <div style={s.panel}>
        <div style={s.toolbar}>
          <div>
            <strong>Therapist performance</strong>
            <div style={s.subtitle}>
              Search and compare monthly totals
            </div>
          </div>
          <div style={s.controls}>
            <input
              type="search"
              aria-label="Search physiotherapists"
              placeholder="Search therapist..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={s.input}
            />
            <select
              aria-label="Sort leaderboard"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              style={s.input}
            >
              <option value="count">Highest count</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>
        {error ? (
          <div role="alert" style={s.error}>
            {error}
          </div>
        ) : null}
        {loading && rows.length === 0 ? (
          <div style={s.message}>Loading leaderboard...</div>
        ) : null}
        {!loading && !error && filteredRows.length === 0 ? (
          <div style={s.message}>
            {search
              ? "No therapists match your search."
              : "No leaderboard data is available for this month."}
          </div>
        ) : null}
        {filteredRows.length > 0 && (
          <div style={s.tableWrapper}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Rank</th>
                  <th style={s.th}>Physiotherapist</th>
                  <th style={s.th}>Monthly patients</th>
                  <th style={s.th}>Target progress</th>
                  <th style={s.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((item, index) => {
                  const count = getMonthlyPatientCount(item);
                  const target = getTarget(item);
                  const progress = Math.round((count / target) * 100);
                  const rank =
                    rankedRows.findIndex((row) => row === item) + 1;
                  return (
                    <tr key={getLeaderboardId(item, index)}>
                      <td style={s.td}>
                        <strong>{rank}</strong>
                      </td>
                      <td style={s.td}>
                        <strong>{getLeaderboardName(item)}</strong>
                        {item.username ? (
                          <div
                            style={{
                              color: "#929daf",
                              fontSize: 11,
                              marginTop: 3,
                            }}
                          >
                            @{item.username}
                          </div>
                        ) : null}
                      </td>
                      <td style={s.td}>
                        <strong>{count.toLocaleString()}</strong>
                      </td>
                      <td style={s.td}>
                        {progress}% of {target}
                        <div
                          style={{
                            height: 7,
                            width: 125,
                            maxWidth: "100%",
                            borderRadius: 20,
                            background: "#e9eef5",
                            overflow: "hidden",
                            marginTop: 7,
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${Math.min(progress, 100)}%`,
                              background:
                                progress >= 100
                                  ? "#15966a"
                                  : progress >= 70
                                    ? "#3978e5"
                                    : "#e5a23b",
                              borderRadius: 20,
                            }}
                          />
                        </div>
                      </td>
                      <td style={s.td}>
                        {progress >= 100
                          ? "Target reached"
                          : `${Math.max(target - count, 0)} to target`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
export default function PhysioFollowupWorkspace({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("statistics");
  const [error, setError] = useState("");
  const [patientTrackerRows, setPatientTrackerRows] = useState([]);
  const [todayAssignments, setTodayAssignments] = useState([]);
  const [leaderboardRows, setLeaderboardRows] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState("");
  const today = getLocalDateString();
  const selectedTherapistId = actingAs?.id ?? user?.id ?? null;
  const loadPatientTracker = useCallback(async () => {
    try {
      const res = await api.get("patients/tracker/");
      setPatientTrackerRows(getArray(res.data, "patients"));
    } catch (err) {
      console.error("Failed to load patient tracker:", err);
      setPatientTrackerRows([]);
      setError("Failed to load patient tracker.");
    }
  }, []);
  const loadTodayAssignments = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        start_date: today,
        end_date: today,
      });
      const res = await api.get(
        `reception/assignments/?${params.toString()}`
      );
      setTodayAssignments(getArray(res.data, "assignments"));
      setError("");
    } catch (err) {
      console.error("Failed to load today's registrations:", err);
      console.error("Registration API error:", err?.response?.data);
      setTodayAssignments([]);
      setError("Failed to load today's registrations.");
    }
  }, [today]);
  const loadPhysioLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    setLeaderboardError("");
    try {
      const res = await api.get("physio/leaderboard/monthly/");
      const results = getArray(res.data, "results");
      const rows = results.length
        ? results
        : getArray(res.data, "rows").length
          ? getArray(res.data, "rows")
          : getArray(res.data, "leaderboard");
      setLeaderboardRows(rows);
    } catch (err) {
      console.error("Failed to load physiotherapy leaderboard:", err);
      console.error("Leaderboard API error:", err?.response?.data);
      setLeaderboardRows([]);
      setLeaderboardError(
        err?.response?.status === 404
          ? "The monthly physiotherapy leaderboard API is not configured yet."
          : "Failed to load the physiotherapy leaderboard. Please try refreshing."
      );
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);
  useEffect(() => {
    loadPatientTracker();
    loadTodayAssignments();
  }, [loadPatientTracker, loadTodayAssignments]);
  useEffect(() => {
    if (activeSection === "leaderboard") {
      loadPhysioLeaderboard();
    }
  }, [activeSection, loadPhysioLeaderboard]);
  const handleBackToAdmin = useCallback(() => {
    onStopImpersonation?.();
    navigate("/admin");
  }, [onStopImpersonation, navigate]);
  const physioPatientTrackerRows = useMemo(
    () =>
      patientTrackerRows.filter((item) =>
        belongsToTherapist(item, selectedTherapistId)
      ),
    [patientTrackerRows, selectedTherapistId]
  );
  const physioAssignments = useMemo(
    () =>
      todayAssignments.filter((item) =>
        belongsToTherapist(item, selectedTherapistId)
      ),
    [todayAssignments, selectedTherapistId]
  );
  const physioStatistics = useMemo(
    () => buildPhysioStatistics(physioAssignments),
    [physioAssignments]
  );
  const walkInAssignments = useMemo(
    () =>
      physioAssignments.filter((item) =>
        matchesCategory(item, CATEGORIES.walkIn)
      ),
    [physioAssignments]
  );
  const appointmentAssignments = useMemo(
    () =>
      physioAssignments.filter((item) =>
        matchesCategory(item, CATEGORIES.appointment)
      ),
    [physioAssignments]
  );
  const initialEvalAssignments = useMemo(
    () =>
      physioAssignments.filter((item) =>
        matchesCategory(item, CATEGORIES.evaluation)
      ),
    [physioAssignments]
  );
  const taskWithoutEligibilityAssignments = useMemo(
    () =>
      physioAssignments.filter((item) =>
        [
          "task_without_eligibility",
          "no_eligibility",
          "without_eligibility",
        ].includes(getCategory(item))
      ),
    [physioAssignments]
  );
  const statisticsCount = physioStatistics.rows.length;
  return (
    <DashboardLayout
      title="Patient Workflow"
      subtitle={`Welcome, ${
        actingAs?.username || user?.username || "Physio User"
      }`}
      accent="#059669"
      sidebarTitle="Patient Workflow"
      sidebarItems={[
        { key: "home", label: "Home" },
        { key: "statistics", label: `Statistics (${statisticsCount})` },
        { key: "tracker", label: "Patient Tracker" },
        { key: "leaderboard", label: "Physiotherapy Leaderboard" },
      ]}
      activeSection={activeSection}
      setActiveSection={(key) => {
        if (key === "home") {
          navigate("/physio");
          return;
        }
        setActiveSection(key);
      }}
      onLogout={onLogout}
      actingAs={actingAs}
      actingAsName={actingAs?.username}
      onBackToAdmin={handleBackToAdmin}
    >
      {error ? (
        <DashboardNotice type="error">{error}</DashboardNotice>
      ) : null}
      {activeSection === "statistics" && (
        <div style={styles.stack}>
          <PhysioStatisticsTable
            stats={physioStatistics}
            title="Physio Statistics"
          />
          <PhysioTodayRegistrationsSection
            walkInAssignments={walkInAssignments}
            appointmentAssignments={appointmentAssignments}
            initialEvalAssignments={initialEvalAssignments}
            taskWithoutEligibilityAssignments={
              taskWithoutEligibilityAssignments
            }
          />
        </div>
      )}
      {activeSection === "tracker" && (
        <PatientTrackerTable
          patients={physioPatientTrackerRows}
          title="Patient Tracker"
        />
      )}
      {activeSection === "leaderboard" && (
        <MonthlyPhysioLeaderboard
          rows={leaderboardRows}
          loading={leaderboardLoading}
          error={leaderboardError}
          onReload={loadPhysioLeaderboard}
        />
      )}
    </DashboardLayout>
  );
}
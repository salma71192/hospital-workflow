
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
import StatisticsSection from "../components/booking/StatisticsSection";
import TodayAppointmentsSection from "../components/booking/TodayAppointmentsSection";
import PatientTrackerTable from "../components/patients/PatientTrackerTable";
import PhysioTodayRegistrationsSection from "../components/physio/PhysioTodayRegistrationsSection";

// Styles used by PhysioFollowupWorkspace.
const styles = {
  stack: {
    display: "grid",
    gap: "16px",
  },
};

// Use local date to avoid UTC date shifts.
function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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
  if (therapistId === null || therapistId === undefined) {
    return false;
  }

  const itemTherapistId = getTherapistId(item);

  return (
    itemTherapistId !== null &&
    itemTherapistId !== undefined &&
    String(itemTherapistId) === String(therapistId)
  );
}

function getCategory(item) {
  return String(item?.category ?? item?.category_label ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
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
      [...rows].sort((a, b) => {
        if (sortBy === "name") {
          return getLeaderboardName(a).localeCompare(
            getLeaderboardName(b)
          );
        }

        return getMonthlyPatientCount(b) - getMonthlyPatientCount(a);
      }),
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

  const overallTarget = rows.reduce(
    (sum, row) => sum + getTarget(row),
    0
  );

  const overallProgress = overallTarget
    ? Math.round((totalPatients / overallTarget) * 100)
    : 0;

  const topTherapist = [...rows].sort(
    (a, b) => getMonthlyPatientCount(b) - getMonthlyPatientCount(a)
  )[0];

  const leaderboardStyles = {
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
      lineHeight: 1.3,
      fontWeight: 750,
      letterSpacing: "-0.6px",
      color: "#172b4d",
    },
    subtitle: {
      color: "#7b879a",
      fontSize: 13,
      lineHeight: 1.6,
      marginTop: 6,
    },
    refreshButton: {
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
      gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))",
      gap: 14,
      marginBottom: 20,
    },
    summaryCard: {
      background: "#ffffff",
      border: "1px solid #e6ecf3",
      borderRadius: 15,
      padding: 17,
      minWidth: 0,
      boxShadow: "0 3px 12px rgba(31, 51, 79, 0.035)",
    },
    summaryLabel: {
      color: "#77859a",
      fontSize: 11,
      fontWeight: 750,
      letterSpacing: "0.6px",
      lineHeight: 1.5,
      textTransform: "uppercase",
      marginBottom: 13,
    },
    summaryValue: {
      color: "#1d3150",
      fontSize: 29,
      fontWeight: 800,
      letterSpacing: "-0.8px",
      lineHeight: 1.2,
      overflowWrap: "anywhere",
    },
    summaryNote: {
      color: "#8995a7",
      fontSize: 12,
      lineHeight: 1.5,
      marginTop: 8,
    },
    topCard: {
      background: "#eaf7f1",
      border: "1px solid #d5eee3",
      borderRadius: 15,
      padding: 17,
      minWidth: 0,
    },
    topName: {
      color: "#146c50",
      fontSize: 17,
      fontWeight: 750,
      lineHeight: 1.4,
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
    panelTitle: {
      margin: 0,
      fontSize: 16,
      fontWeight: 750,
      color: "#203451",
    },
    panelSubtitle: {
      marginTop: 5,
      color: "#8591a4",
      fontSize: 12,
      lineHeight: 1.5,
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
      outlineColor: "#14966b",
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
      letterSpacing: "0.65px",
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
    rankBadge: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 32,
      height: 32,
      borderRadius: 10,
      fontWeight: 800,
      fontSize: 12,
    },
    therapistName: {
      fontWeight: 750,
      color: "#263a57",
      lineHeight: 1.5,
    },
    username: {
      color: "#929daf",
      fontSize: 11,
      marginTop: 3,
    },
    count: {
      color: "#203451",
      fontWeight: 800,
      fontSize: 18,
    },
    progressTrack: {
      height: 7,
      width: 125,
      maxWidth: "100%",
      borderRadius: 20,
      background: "#e9eef5",
      overflow: "hidden",
      marginTop: 7,
    },
    statusBadge: {
      display: "inline-block",
      borderRadius: 20,
      padding: "6px 9px",
      fontSize: 10,
      fontWeight: 800,
      whiteSpace: "nowrap",
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
      lineHeight: 1.6,
    },
    footer: {
      padding: "13px 17px",
      color: "#8995a7",
      fontSize: 11,
      lineHeight: 1.6,
      background: "#fbfcfe",
    },
  };

  return (
    <section style={leaderboardStyles.container}>
      <div style={leaderboardStyles.header}>
        <div>
          <h2 style={leaderboardStyles.title}>
            Physiotherapy Leaderboard
          </h2>
          <div style={leaderboardStyles.subtitle}>
            Monthly performance overview · {getMonthLabel()}
          </div>
        </div>

        <button
          type="button"
          onClick={onReload}
          disabled={loading}
          style={leaderboardStyles.refreshButton}
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      <div style={leaderboardStyles.cards}>
        <div style={leaderboardStyles.summaryCard}>
          <div style={leaderboardStyles.summaryLabel}>
            Total patients
          </div>
          <div style={leaderboardStyles.summaryValue}>
            {totalPatients.toLocaleString()}
          </div>
          <div style={leaderboardStyles.summaryNote}>
            Combined monthly count
          </div>
        </div>

        <div style={leaderboardStyles.summaryCard}>
          <div style={leaderboardStyles.summaryLabel}>Therapists</div>
          <div style={leaderboardStyles.summaryValue}>
            {therapistCount}
          </div>
          <div style={leaderboardStyles.summaryNote}>
            Listed in the leaderboard
          </div>
        </div>

        <div style={leaderboardStyles.summaryCard}>
          <div style={leaderboardStyles.summaryLabel}>
            Average per therapist
          </div>
          <div style={leaderboardStyles.summaryValue}>
            {averagePatients}
          </div>
          <div style={leaderboardStyles.summaryNote}>
            Average monthly count
          </div>
        </div>

        <div style={leaderboardStyles.summaryCard}>
          <div style={leaderboardStyles.summaryLabel}>
            Target achieved
          </div>
          <div style={leaderboardStyles.summaryValue}>
            {completedTargets}/{therapistCount}
          </div>
          <div style={leaderboardStyles.summaryNote}>
            Therapists meeting their target
          </div>
        </div>

        <div style={leaderboardStyles.topCard}>
          <div
            style={{
              ...leaderboardStyles.summaryLabel,
              color: "#378267",
            }}
          >
            Current leader
          </div>

          <div style={leaderboardStyles.topName}>
            {topTherapist
              ? getLeaderboardName(topTherapist)
              : "No data yet"}
          </div>

          <div
            style={{
              color: "#378267",
              fontSize: 12,
              marginTop: 9,
            }}
          >
            {topTherapist
              ? `${getMonthlyPatientCount(topTherapist)} patients`
              : "Monthly ranking"}
          </div>
        </div>
      </div>

      <div style={leaderboardStyles.panel}>
        <div style={leaderboardStyles.toolbar}>
          <div>
            <h3 style={leaderboardStyles.panelTitle}>
              Therapist performance
            </h3>
            <div style={leaderboardStyles.panelSubtitle}>
              Search, rank, and compare monthly totals
            </div>
          </div>

          <div style={leaderboardStyles.controls}>
            <input
              type="search"
              aria-label="Search physiotherapists"
              placeholder="Search therapist..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={leaderboardStyles.input}
            />

            <select
              aria-label="Sort leaderboard"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              style={leaderboardStyles.input}
            >
              <option value="count">Highest count</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>

        {error ? (
          <div role="alert" style={leaderboardStyles.error}>
            {error}
          </div>
        ) : null}

        {loading && rows.length === 0 ? (
          <div style={leaderboardStyles.message}>
            Loading leaderboard...
          </div>
        ) : null}

        {!loading && !error && filteredRows.length === 0 ? (
          <div style={leaderboardStyles.message}>
            {search
              ? "No therapists match your search."
              : "No leaderboard data is available for this month."}
          </div>
        ) : null}

        {filteredRows.length > 0 ? (
          <div style={leaderboardStyles.tableWrapper}>
            <table style={leaderboardStyles.table}>
              <thead>
                <tr>
                  <th style={leaderboardStyles.th}>Rank</th>
                  <th style={leaderboardStyles.th}>Physiotherapist</th>
                  <th style={leaderboardStyles.th}>Monthly patients</th>
                  <th style={leaderboardStyles.th}>Target progress</th>
                  <th style={leaderboardStyles.th}>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.map((item, index) => {
                  const count = getMonthlyPatientCount(item);
                  const target = getTarget(item);
                  const progress = Math.round((count / target) * 100);

                  // Rank based on the sorted rows, not the search-result index.
                  const rank = rankedRows.findIndex(
                    (row) => row === item
                  ) + 1;

                  const barColor =
                    progress >= 100
                      ? "#15966a"
                      : progress >= 70
                        ? "#3978e5"
                        : "#e5a23b";

                  const badgeStyle =
                    rank === 1
                      ? {
                          background: "#fff1c7",
                          color: "#986500",
                        }
                      : rank === 2
                        ? {
                            background: "#e9edf3",
                            color: "#566579",
                          }
                        : rank === 3
                          ? {
                              background: "#f8e6d8",
                              color: "#9b5a2b",
                            }
                          : {
                              background: "#f0f4f8",
                              color: "#58677d",
                            };

                  const statusStyle =
                    progress >= 100
                      ? {
                          background: "#e4f7ed",
                          color: "#13784e",
                        }
                      : {
                          background: "#edf3ff",
                          color: "#315fc0",
                        };

                  return (
                    <tr key={getLeaderboardId(item, index)}>
                      <td style={leaderboardStyles.td}>
                        <span
                          style={{
                            ...leaderboardStyles.rankBadge,
                            ...badgeStyle,
                          }}
                        >
                          {rank}
                        </span>
                      </td>

                      <td style={leaderboardStyles.td}>
                        <div style={leaderboardStyles.therapistName}>
                          {getLeaderboardName(item)}
                        </div>

                        {item.username ? (
                          <div style={leaderboardStyles.username}>
                            @{item.username}
                          </div>
                        ) : null}
                      </td>

                      <td style={leaderboardStyles.td}>
                        <span style={leaderboardStyles.count}>
                          {count.toLocaleString()}
                        </span>
                      </td>

                      <td style={leaderboardStyles.td}>
                        <div
                          style={{
                            fontWeight: 750,
                            color: "#34445c",
                          }}
                        >
                          {progress}%
                          <span
                            style={{
                              color: "#909bad",
                              fontWeight: 400,
                              marginLeft: 5,
                            }}
                          >
                            of {target}
                          </span>
                        </div>

                        <div style={leaderboardStyles.progressTrack}>
                          <div
                            style={{
                              height: "100%",
                              width: `${Math.min(progress, 100)}%`,
                              background: barColor,
                              borderRadius: 20,
                              transition: "width 0.25s ease",
                            }}
                          />
                        </div>
                      </td>

                      <td style={leaderboardStyles.td}>
                        <span
                          style={{
                            ...leaderboardStyles.statusBadge,
                            ...statusStyle,
                          }}
                        >
                          {progress >= 100
                            ? "Target reached"
                            : `${Math.max(target - count, 0)} to target`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        <div style={leaderboardStyles.footer}>
          Displayed totals use the existing monthly leaderboard API
          response. This design does not change visit-counting logic or
          the monthly target.
        </div>
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
  const [message] = useState("");
  const [error, setError] = useState("");

  const [todayAppointments, setTodayAppointments] = useState([]);
  const [todayStats, setTodayStats] = useState(null);
  const [patientTrackerRows, setPatientTrackerRows] = useState([]);
  const [todayAssignments, setTodayAssignments] = useState([]);

  const [leaderboardRows, setLeaderboardRows] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState("");

  const today = getLocalDateString();

  // When an administrator views a physio account, use that account's ID.
  const selectedTherapistId = actingAs?.id ?? user?.id ?? null;

  // ---------------- Load today's bookings ----------------
  const loadTodayAppointments = useCallback(async () => {
    try {
      const res = await api.get("callcenter/bookings/today-appointments/");
      setTodayAppointments(getArray(res.data, "bookings"));
    } catch (err) {
      console.error("Failed to load today's appointments:", err);
      setTodayAppointments([]);
      setError("Failed to load today's appointments.");
    }
  }, []);

  // ---------------- Load statistics ----------------
  const loadTodayStatistics = useCallback(async () => {
    try {
      const res = await api.get("callcenter/bookings/today-statistics/");

      setTodayStats({
        rows: getArray(res.data, "rows"),
        totals: res.data?.totals ?? null,
        date: res.data?.date ?? "",
      });
    } catch (err) {
      console.error("Failed to load today's statistics:", err);
      setTodayStats(null);
      setError("Failed to load today's statistics.");
    }
  }, []);

  // ---------------- Load patient tracker ----------------
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

  // ---------------- Load today's registrations ----------------
  const loadTodayAssignments = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        start_date: today,
        end_date: today,
      });

      const res = await api.get(
        `reception/assignments/?${params.toString()}`
      );

      const assignments = getArray(res.data, "assignments");

      console.info("[Physio Workspace] Registration API response", {
        date: today,
        selectedTherapistId,
        responseCount: assignments.length,
        registrations: assignments.map((item) => ({
          id: item.id,
          patient: item.patient_name,
          therapist_id: getTherapistId(item),
          assignment_date: item.assignment_date,
          category: item.category,
          category_label: item.category_label,
        })),
      });

      setTodayAssignments(assignments);
    } catch (err) {
      console.error("Failed to load today's registrations:", err);
      console.error("Registration API error response:", err?.response?.data);

      setTodayAssignments([]);
      setError("Failed to load today's registrations.");
    }
  }, [today, selectedTherapistId]);

  // ---------------- Load monthly physiotherapy leaderboard ----------------
  const loadPhysioLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    setLeaderboardError("");

    try {
      const res = await api.get("physio/leaderboard/monthly/");

      const rows = getArray(res.data, "results").length
        ? getArray(res.data, "results")
        : getArray(res.data, "rows").length
          ? getArray(res.data, "rows")
          : getArray(res.data, "leaderboard");

      setLeaderboardRows(rows);
    } catch (err) {
      console.error("Failed to load physiotherapy leaderboard:", err);
      console.error("Leaderboard API error response:", err?.response?.data);

      setLeaderboardRows([]);
      setLeaderboardError(
        err?.response?.status === 404
          ? "The monthly physiotherapy leaderboard API is not configured yet. Add the Django endpoint physio/leaderboard/monthly/ that returns completed patient-visit counts."
          : "Failed to load the physiotherapy leaderboard. Please try refreshing."
      );
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  // ---------------- Initial load ----------------
  useEffect(() => {
    loadTodayAppointments();
    loadTodayStatistics();
    loadPatientTracker();
    loadTodayAssignments();
  }, [
    loadTodayAppointments,
    loadTodayStatistics,
    loadPatientTracker,
    loadTodayAssignments,
  ]);

  // Load leaderboard only when the section is opened.
  useEffect(() => {
    if (activeSection === "leaderboard") {
      loadPhysioLeaderboard();
    }
  }, [activeSection, loadPhysioLeaderboard]);

  const handleBackToAdmin = useCallback(() => {
    onStopImpersonation?.();
    navigate("/admin");
  }, [onStopImpersonation, navigate]);

  // ---------------- Filter bookings ----------------
  const physioTodayAppointments = useMemo(
    () =>
      todayAppointments.filter((item) =>
        belongsToTherapist(item, selectedTherapistId)
      ),
    [todayAppointments, selectedTherapistId]
  );

  // ---------------- Filter patient tracker ----------------
  const physioPatientTrackerRows = useMemo(
    () =>
      patientTrackerRows.filter((item) =>
        belongsToTherapist(item, selectedTherapistId)
      ),
    [patientTrackerRows, selectedTherapistId]
  );

  // ---------------- Filter registrations ----------------
  const physioAssignments = useMemo(
    () =>
      todayAssignments.filter((item) =>
        belongsToTherapist(item, selectedTherapistId)
      ),
    [todayAssignments, selectedTherapistId]
  );

  const walkInAssignments = useMemo(
    () =>
      physioAssignments.filter((item) =>
        ["walk_in", "walkin"].includes(getCategory(item))
      ),
    [physioAssignments]
  );

  const appointmentAssignments = useMemo(
    () =>
      physioAssignments.filter((item) =>
        ["appointment", "regular_session", "treatment_session"].includes(
          getCategory(item)
        )
      ),
    [physioAssignments]
  );

  const initialEvalAssignments = useMemo(
    () =>
      physioAssignments.filter((item) =>
        ["initial_evaluation", "initial_eval", "evaluation"].includes(
          getCategory(item)
        )
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

  const statisticsCount = todayStats?.rows?.length ?? 0;

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
        {
          key: "statistics",
          label: `Statistics (${statisticsCount})`,
        },
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
      {message ? (
        <DashboardNotice type="success">{message}</DashboardNotice>
      ) : null}

      {error ? (
        <DashboardNotice type="error">{error}</DashboardNotice>
      ) : null}

      {activeSection === "statistics" && (
        <div style={styles.stack}>
          <StatisticsSection stats={todayStats} />

          <TodayAppointmentsSection
            bookings={physioTodayAppointments}
            title="Today's Appointments"
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

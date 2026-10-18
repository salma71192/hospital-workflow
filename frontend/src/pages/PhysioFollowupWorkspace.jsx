
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import DashboardLayout from "../components/DashboardLayout";
import DashboardNotice from "../components/common/DashboardNotice";
import StatisticsSection from "../components/booking/StatisticsSection";
import TodayAppointmentsSection from "../components/booking/TodayAppointmentsSection";
import PatientTrackerTable from "../components/patients/PatientTrackerTable";
import PhysioTodayRegistrationsSection from "../components/physio/PhysioTodayRegistrationsSection";

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

function MonthlyPhysioLeaderboard({
  rows,
  loading,
  error,
  onReload,
}) {
  const rankedRows = useMemo(
    () =>
      [...rows].sort(
        (a, b) => getMonthlyPatientCount(b) - getMonthlyPatientCount(a)
      ),
    [rows]
  );

  return (
    <section style={styles.card}>
      <div style={styles.leaderboardHeader}>
        <div>
          <h2 style={styles.sectionTitle}>Physiotherapy Leaderboard</h2>
          <p style={styles.mutedText}>
            Patients seen during {getMonthLabel()}
          </p>
        </div>

        <button
          type="button"
          onClick={onReload}
          disabled={loading}
          style={{
            ...styles.reloadButton,
            ...(loading ? styles.disabledButton : {}),
          }}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <p style={styles.leaderboardDescription}>
        Therapists are ranked by their monthly patient count. Counts should
        represent completed patient visits, not reception registrations.
      </p>

      {error ? (
        <div style={styles.inlineError}>
          {error}
        </div>
      ) : null}

      {loading && rows.length === 0 ? (
        <p style={styles.emptyText}>Loading leaderboard...</p>
      ) : null}

      {!loading && !error && rankedRows.length === 0 ? (
        <p style={styles.emptyText}>
          No leaderboard data is available for this month.
        </p>
      ) : null}

      {rankedRows.length > 0 ? (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.headerCell}>Rank</th>
                <th style={styles.headerCell}>Physiotherapist</th>
                <th style={{ ...styles.headerCell, textAlign: "right" }}>
                  Patients Seen
                </th>
              </tr>
            </thead>

            <tbody>
              {rankedRows.map((item, index) => (
                <tr key={getLeaderboardId(item, index)}>
                  <td style={styles.cell}>
                    <span style={styles.rankBadge}>
                      {index + 1}
                    </span>
                  </td>

                  <td style={styles.cell}>
                    <span style={styles.therapistName}>
                      {getLeaderboardName(item)}
                    </span>
                  </td>

                  <td
                    style={{
                      ...styles.cell,
                      textAlign: "right",
                      fontWeight: 700,
                    }}
                  >
                    {getMonthlyPatientCount(item).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <p style={styles.footerText}>
        Monthly totals depend on the completed-visit records returned by the
        backend.
      </p>
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
  const [message, setMessage] = useState("");
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
      /*
       * This endpoint must return monthly completed-visit counts per
       * physiotherapist. It is not the reception registration leaderboard.
       *
       * Expected response:
       * {
       *   "results": [
       *     {
       *       "therapist_id": 1,
       *       "therapist_name": "Physiotherapist Name",
       *       "monthly_patients_seen": 125
       *     }
       *   ]
       * }
       */
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

const styles = {
  stack: {
    display: "grid",
    gap: "16px",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
    minWidth: 0,
  },
  leaderboardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    flexWrap: "wrap",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 700,
    color: "#111827",
  },
  mutedText: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: "14px",
  },
  leaderboardDescription: {
    margin: "16px 0",
    color: "#4b5563",
    fontSize: "14px",
    lineHeight: 1.5,
  },
  reloadButton: {
    background: "#059669",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "9px 14px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  disabledButton: {
    opacity: 0.6,
    cursor: "wait",
  },
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  headerCell: {
    padding: "12px 10px",
    borderBottom: "1px solid #e5e7eb",
    background: "#f9fafb",
    color: "#4b5563",
    fontSize: "13px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  cell: {
    padding: "13px 10px",
    borderBottom: "1px solid #f3f4f6",
    color: "#111827",
    fontSize: "14px",
  },
  rankBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "#d1fae5",
    color: "#065f46",
    fontWeight: 700,
  },
  therapistName: {
    fontWeight: 600,
  },
  emptyText: {
    padding: "20px 0",
    textAlign: "center",
    color: "#6b7280",
    fontSize: "14px",
  },
  inlineError: {
    background: "#fef2f2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    padding: "12px",
    fontSize: "14px",
    lineHeight: 1.5,
  },
  footerText: {
    margin: "14px 0 0",
    color: "#6b7280",
    fontSize: "12px",
    lineHeight: 1.5,
  },
};

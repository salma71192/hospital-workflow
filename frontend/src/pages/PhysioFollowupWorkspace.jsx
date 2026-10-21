
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
import PhysioStatisticsSection from "../components/physio/PhysioStatisticsSection";
import EvaluationTrackerSection from "../components/physio/EvaluationTrackerSection";
import LeaderboardSection from "../components/common/LeaderboardSection";
import PerformanceDashboard from "../components/physio/PerformanceDashboard";

const styles = {
  stack: {
    display: "grid",
    gap: 20,
    minWidth: 0,
  },
  filter: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    alignItems: "end",
    gap: 16,
    padding: 22,
    background: "#ffffff",
    border: "1px solid #e5eaf1",
    borderRadius: 18,
    boxShadow: "0 5px 20px rgba(15, 23, 42, 0.035)",
  },
  filterHeading: {
    gridColumn: "1 / -1",
    display: "flex",
    alignItems: "center",
    gap: 10,
    margin: 0,
    color: "#142d4e",
    fontSize: 18,
    fontWeight: 800,
  },
  filterLabel: {
    display: "grid",
    gap: 8,
    minWidth: 0,
  },
  filterCaption: {
    fontSize: 12,
    fontWeight: 750,
    color: "#53657b",
  },
  filterInput: {
    boxSizing: "border-box",
    width: "100%",
    minHeight: 43,
    padding: "10px 12px",
    border: "1px solid #d6deea",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    color: "#203650",
    background: "#ffffff",
    outlineColor: "#059669",
  },
};

function getLocalDateString(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getLocalMonthString(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
  ].join("-");
}

function getMonthDateRange(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();

  return {
    start_date: `${month}-01`,
    end_date: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
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

    // Preserve existing behavior until the API provides booked counts.
    row.booked = 0;

    if (
      (appointment || evaluation || cash || walkIn) &&
      !noShow
    ) {
      row.seen += 1;
    }
  });

  return {
    rows: Array.from(grouped.values()).sort((a, b) =>
      a.therapist_name.localeCompare(b.therapist_name)
    ),
  };
}

function getMonthLabel(month) {
  if (!month) return "";

  const [year, monthNumber] = month.split("-").map(Number);

  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthNumber - 1, 1));
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

function getLeaderboardPatientCount(item) {
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

function getLeaderboardId(item) {
  return (
    item?.therapist_id ??
    item?.physio_id ??
    item?.physiotherapist_id ??
    item?.user_id ??
    item?.therapist?.id ??
    item?.id ??
    getLeaderboardName(item)
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
  const [trackerMonth, setTrackerMonth] = useState(
    getLocalMonthString()
  );

  const [statisticsDate, setStatisticsDate] = useState(
    getLocalDateString()
  );
  const [statisticsMonth, setStatisticsMonth] = useState(
    getLocalMonthString()
  );

  const [dailyAssignments, setDailyAssignments] = useState([]);
  const [monthlyAssignments, setMonthlyAssignments] = useState([]);

  const [dailyStatisticsLoading, setDailyStatisticsLoading] =
    useState(false);
  const [monthlyStatisticsLoading, setMonthlyStatisticsLoading] =
    useState(false);

  const [leaderboardMonth, setLeaderboardMonth] = useState(
    getLocalMonthString()
  );
  const [monthlyLeaderboardRows, setMonthlyLeaderboardRows] = useState([]);
  const [monthlyLeaderboardLoading, setMonthlyLeaderboardLoading] =
    useState(false);
  const [monthlyLeaderboardError, setMonthlyLeaderboardError] =
    useState("");

  const [evaluationMonth, setEvaluationMonth] = useState(
    getLocalMonthString()
  );
  const [evaluationAssignments, setEvaluationAssignments] = useState([]);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [evaluationError, setEvaluationError] = useState("");

  const selectedTherapistId = actingAs?.id ?? user?.id ?? null;

  // Independent monthly tracker: this endpoint does not use appointments.
  const loadPatientTracker = useCallback(async () => {
    if (!trackerMonth) return;

    try {
      const params = new URLSearchParams({
        month: trackerMonth,
      });

      const res = await api.get(
        `patients/tracker/?${params.toString()}`
      );

      setPatientTrackerRows(getArray(res.data, "patients"));
      setError("");
    } catch (err) {
      console.error("Failed to load patient tracker:", err);
      console.error("Patient tracker API error:", err?.response?.data);

      setPatientTrackerRows([]);
      setError("Failed to load patient tracker.");
    }
  }, [trackerMonth]);

  const loadDailyStatistics = useCallback(async () => {
    if (!statisticsDate) return;

    setDailyStatisticsLoading(true);

    try {
      const params = new URLSearchParams({
        start_date: statisticsDate,
        end_date: statisticsDate,
      });

      const res = await api.get(
        `reception/assignments/?${params.toString()}`
      );

      setDailyAssignments(getArray(res.data, "assignments"));
      setError("");
    } catch (err) {
      console.error("Failed to load daily registrations:", err);
      console.error("Daily statistics API error:", err?.response?.data);

      setDailyAssignments([]);
      setError("Failed to load daily registrations for the selected date.");
    } finally {
      setDailyStatisticsLoading(false);
    }
  }, [statisticsDate]);

  const loadMonthlyStatistics = useCallback(async () => {
    if (!statisticsMonth) return;

    setMonthlyStatisticsLoading(true);

    try {
      const range = getMonthDateRange(statisticsMonth);
      const params = new URLSearchParams(range);

      const res = await api.get(
        `reception/assignments/?${params.toString()}`
      );

      setMonthlyAssignments(getArray(res.data, "assignments"));
    } catch (err) {
      console.error("Failed to load monthly registrations:", err);
      console.error("Monthly statistics API error:", err?.response?.data);

      setMonthlyAssignments([]);
      setError("Failed to load monthly registrations for the selected month.");
    } finally {
      setMonthlyStatisticsLoading(false);
    }
  }, [statisticsMonth]);

  const loadEvaluationTracker = useCallback(async () => {
    if (!evaluationMonth) return;

    setEvaluationLoading(true);
    setEvaluationError("");

    try {
      const range = getMonthDateRange(evaluationMonth);
      const params = new URLSearchParams(range);

      const res = await api.get(
        `reception/assignments/?${params.toString()}`
      );

      setEvaluationAssignments(getArray(res.data, "assignments"));
    } catch (err) {
      console.error("Failed to load evaluation tracker:", err);
      console.error("Evaluation tracker API error:", err?.response?.data);

      setEvaluationAssignments([]);
      setEvaluationError(
        "Failed to load evaluations for the selected month."
      );
    } finally {
      setEvaluationLoading(false);
    }
  }, [evaluationMonth]);

  const loadMonthlyLeaderboard = useCallback(async () => {
    if (!leaderboardMonth) return;

    setMonthlyLeaderboardLoading(true);
    setMonthlyLeaderboardError("");

    try {
      const params = new URLSearchParams({
        month: leaderboardMonth,
      });

      const res = await api.get(
        `physio/leaderboard/monthly/?${params.toString()}`
      );

      const results = getArray(res.data, "results");
      const rows = results.length
        ? results
        : getArray(res.data, "rows").length
          ? getArray(res.data, "rows")
          : getArray(res.data, "leaderboard");

      setMonthlyLeaderboardRows(rows);
    } catch (err) {
      console.error("Failed to load monthly leaderboard:", err);
      console.error("Monthly leaderboard API error:", err?.response?.data);

      setMonthlyLeaderboardRows([]);

      setMonthlyLeaderboardError(
        err?.response?.status === 404
          ? "The monthly physiotherapy leaderboard API is not configured yet."
          : "Failed to load the monthly leaderboard. Please try refreshing."
      );
    } finally {
      setMonthlyLeaderboardLoading(false);
    }
  }, [leaderboardMonth]);

  useEffect(() => {
    loadPatientTracker();
  }, [loadPatientTracker]);

  useEffect(() => {
    loadDailyStatistics();
  }, [loadDailyStatistics]);

  useEffect(() => {
    loadMonthlyStatistics();
  }, [loadMonthlyStatistics]);

  useEffect(() => {
    if (activeSection === "leaderboard") {
      loadMonthlyLeaderboard();
    }
  }, [activeSection, loadMonthlyLeaderboard]);

  useEffect(() => {
    if (activeSection === "evaluation-tracker") {
      loadEvaluationTracker();
    }
  }, [activeSection, loadEvaluationTracker]);

  const handleBackToAdmin = useCallback(() => {
    onStopImpersonation?.();
    navigate("/admin");
  }, [onStopImpersonation, navigate]);

  // Assignments remain filtered by therapist for statistics and evaluations.
  const physioDailyAssignments = useMemo(
    () =>
      dailyAssignments.filter((item) =>
        belongsToTherapist(item, selectedTherapistId)
      ),
    [dailyAssignments, selectedTherapistId]
  );

  const physioMonthlyAssignments = useMemo(
    () =>
      monthlyAssignments.filter((item) =>
        belongsToTherapist(item, selectedTherapistId)
      ),
    [monthlyAssignments, selectedTherapistId]
  );

  const physioEvaluationAssignments = useMemo(
    () =>
      evaluationAssignments.filter((item) =>
        belongsToTherapist(item, selectedTherapistId)
      ),
    [evaluationAssignments, selectedTherapistId]
  );

  const dailyStatistics = useMemo(
    () => buildPhysioStatistics(physioDailyAssignments),
    [physioDailyAssignments]
  );

  const monthlyStatistics = useMemo(
    () => buildPhysioStatistics(physioMonthlyAssignments),
    [physioMonthlyAssignments]
  );

  const walkInAssignments = useMemo(
    () =>
      physioDailyAssignments.filter((item) =>
        matchesCategory(item, CATEGORIES.walkIn)
      ),
    [physioDailyAssignments]
  );

  const appointmentAssignments = useMemo(
    () =>
      physioDailyAssignments.filter((item) =>
        matchesCategory(item, CATEGORIES.appointment)
      ),
    [physioDailyAssignments]
  );

  const initialEvalAssignments = useMemo(
    () =>
      physioDailyAssignments.filter((item) =>
        matchesCategory(item, CATEGORIES.evaluation)
      ),
    [physioDailyAssignments]
  );

  const taskWithoutEligibilityAssignments = useMemo(
    () =>
      physioDailyAssignments.filter((item) =>
        [
          "task_without_eligibility",
          "no_eligibility",
          "without_eligibility",
        ].includes(getCategory(item))
      ),
    [physioDailyAssignments]
  );

  const statisticsCount = dailyStatistics.rows.length;

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
        { key: "evaluation-tracker", label: "Evaluation Tracker" },
        { key: "performance", label: "Performance" },
        { key: "leaderboard", label: "Leaderboard" },
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
        <PhysioStatisticsSection
          statisticsDate={statisticsDate}
          setStatisticsDate={setStatisticsDate}
          statisticsMonth={statisticsMonth}
          setStatisticsMonth={setStatisticsMonth}
          dailyStatistics={dailyStatistics}
          monthlyStatistics={monthlyStatistics}
          dailyStatisticsLoading={dailyStatisticsLoading}
          monthlyStatisticsLoading={monthlyStatisticsLoading}
          monthlyLabel={getMonthLabel(statisticsMonth)}
          walkInAssignments={walkInAssignments}
          appointmentAssignments={appointmentAssignments}
          initialEvalAssignments={initialEvalAssignments}
          taskWithoutEligibilityAssignments={
            taskWithoutEligibilityAssignments
          }
          dailyAssignments={physioDailyAssignments}
          monthlyAssignments={physioMonthlyAssignments}
        />
      )}

      {activeSection === "tracker" && (
        <PatientTrackerTable
          patients={patientTrackerRows}
          title="Patient Tracker"
          selectedMonth={trackerMonth}
          onMonthChange={setTrackerMonth}
          monthLabel={getMonthLabel(trackerMonth)}
          onRefresh={loadPatientTracker}
        />
      )}

      {activeSection === "performance" && (
        <PerformanceDashboard
          user={user}
          actingAs={actingAs}
        />
      )}

      {activeSection === "evaluation-tracker" && (
        <div style={styles.stack}>
          <EvaluationTrackerSection
            assignments={physioEvaluationAssignments}
            month={evaluationMonth}
            onMonthChange={setEvaluationMonth}
            loading={evaluationLoading}
            error={evaluationError}
            onReload={loadEvaluationTracker}
          />
        </div>
      )}

      {activeSection === "leaderboard" && (
        <div style={styles.stack}>
          <section style={styles.filter}>
            <h3 style={styles.filterHeading}>
              <span
                aria-hidden="true"
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: 35,
                  height: 35,
                  borderRadius: 10,
                  background: "#ecfdf5",
                  color: "#059669",
                  fontSize: 18,
                }}
              >
                ◷
              </span>

              Leaderboard Filters
            </h3>

            <label style={styles.filterLabel}>
              <span style={styles.filterCaption}>
                Leaderboard month
              </span>

              <input
                type="month"
                value={leaderboardMonth}
                onChange={(event) =>
                  setLeaderboardMonth(event.target.value)
                }
                style={styles.filterInput}
              />
            </label>
          </section>

          <LeaderboardSection
            title="Leaderboard"
            department={`Physiotherapy · ${getMonthLabel(leaderboardMonth)}`}
            rows={monthlyLeaderboardRows}
            loading={monthlyLeaderboardLoading}
            error={monthlyLeaderboardError}
            onReload={loadMonthlyLeaderboard}
            target={400}
            showTarget
            todayLabel="TODAY"
            monthlyLabel="THIS MONTH"
            countLabel="patients"
            emptyMessage={`No leaderboard data is available for ${getMonthLabel(
              leaderboardMonth
            )}.`}
            getName={getLeaderboardName}
            getMonthly={getLeaderboardPatientCount}
            getId={getLeaderboardId}
          />
        </div>
      )}
    </DashboardLayout>
  );
}

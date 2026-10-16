import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import DashboardLayout from "../components/DashboardLayout";
import DashboardNotice from "../components/common/DashboardNotice";
import LeaderboardSection from "../components/common/LeaderboardSection";
import useLeaderboard from "../components/common/useLeaderboard";
import PatientRegisterForm from "../components/patients/PatientRegisterForm";
import PatientAssignmentForm from "../components/patients/PatientAssignmentForm";
import UnifiedPatientSearch from "../components/patients/UnifiedPatientSearch";
import RegistrationTrackerSection from "../components/assignments/RegistrationTrackerSection";
import RegistrationStatsSection from "../components/assignments/RegistrationStatsSection";
import useRegistrationStats from "../components/assignments/useRegistrationStats";
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
function getLastDayOfMonthString() {
  const now = new Date();
  return formatLocalDate(
    new Date(now.getFullYear(), now.getMonth() + 1, 0)
  );
}
function getDateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}
function getDisplayName(item) {
  return (
    item?.therapist_name ||
    item?.name ||
    item?.username ||
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
export default function ReceptionRegistrationWorkspace({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();
  const assignmentRef = useRef(null);
  const stats = useRegistrationStats();
  const {
    leaderboard,
    loading: leaderboardLoading,
    error: leaderboardError,
    reload: reloadLeaderboard,
  } = useLeaderboard("reception");
  const [activeSection, setActiveSection] = useState("register");
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [trackerMode, setTrackerMode] = useState("today");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientForm, setPatientForm] = useState({
    name: "",
    patient_id: "",
  });
  const [assignmentForm, setAssignmentForm] = useState({
    patient_id: "",
    therapist_id: "",
    category: "appointment",
    visit_number: "",
    referring_physician: "",
    notes: "",
  });
  const [trackerFilter, setTrackerFilter] = useState({
    date: getTodayString(),
    from_date: getFirstDayOfMonthString(),
    to_date: getLastDayOfMonthString(),
    user_id: "all",
    patient: "",
    therapist_id: "all",
  });
  const [therapists, setTherapists] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [trackerAssignments, setTrackerAssignments] = useState([]);
  const [trackerAgents, setTrackerAgents] = useState([]);
  const [trackerTarget, setTrackerTarget] = useState(50);
  // Evaluation Tracker state
  const [evaluationFromDate, setEvaluationFromDate] = useState(
    getFirstDayOfMonthString
  );
  const [evaluationToDate, setEvaluationToDate] = useState(getTodayString);
  const [evaluationRows, setEvaluationRows] = useState([]);
  const [evaluationTotal, setEvaluationTotal] = useState(0);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [evaluationError, setEvaluationError] = useState("");
  const [evaluationPeriod, setEvaluationPeriod] = useState("month");
  const [evaluationSearch, setEvaluationSearch] = useState("");
  const [evaluationSort, setEvaluationSort] = useState("count-desc");
  useEffect(() => {
    loadTherapists();
  }, [actingAs, user]);
  useEffect(() => {
    handleApplyTrackerFilters();
  }, [trackerMode]);
  const loadTherapists = async () => {
    try {
      const res = await api.get("reception/therapists/");
      setTherapists(res.data.therapists || []);
    } catch (err) {
      console.error("Failed to load therapists", err);
      setTherapists([]);
    }
  };
  const loadAssignments = async ({
    start_date = "",
    end_date = "",
    user_id = "all",
    patient = "",
    therapist_id = "all",
  }) => {
    try {
      const params = new URLSearchParams();
      if (start_date) params.append("start_date", start_date);
      if (end_date) params.append("end_date", end_date);
      if (user_id && user_id !== "all") {
        params.append("user_id", user_id);
      }
      if (patient?.trim()) {
        params.append("patient", patient.trim());
      }
      if (therapist_id && therapist_id !== "all") {
        params.append("therapist_id", therapist_id);
      }
      if (actingAs && (user?.is_superuser || user?.role === "admin")) {
        params.append("viewed_user_id", String(actingAs.id));
        params.append("viewed_user_role", String(actingAs.role || ""));
      }
      const res = await api.get(
        `reception/assignments/?${params.toString()}`
      );
      setTrackerAssignments(res.data.assignments || []);
      setTrackerAgents(res.data.agents || []);
    } catch (err) {
      console.error("Failed to load assignments", err);
      setTrackerAssignments([]);
      setTrackerAgents([]);
    }
  };
  const handleApplyTrackerFilters = useCallback(
    async (filters = trackerFilter) => {
      if (trackerMode === "today") {
        const safeDate = filters.date || getTodayString();
        await loadAssignments({
          start_date: safeDate,
          end_date: safeDate,
          user_id: filters.user_id,
          patient: filters.patient,
          therapist_id: filters.therapist_id,
        });
        return;
      }
      await loadAssignments({
        start_date: filters.from_date,
        end_date: filters.to_date,
        user_id: filters.user_id,
        patient: filters.patient,
        therapist_id: filters.therapist_id,
      });
    },
    [trackerMode, trackerFilter, actingAs, user]
  );
  const loadEvaluationTracker = useCallback(async () => {
    setEvaluationLoading(true);
    setEvaluationError("");
    try {
      const params = new URLSearchParams();
      if (evaluationFromDate) {
        params.append("start_date", evaluationFromDate);
      }
      if (evaluationToDate) {
        params.append("end_date", evaluationToDate);
      }
      if (actingAs && (user?.is_superuser || user?.role === "admin")) {
        params.append("viewed_user_id", String(actingAs.id));
        params.append("viewed_user_role", String(actingAs.role || ""));
      }
      const res = await api.get(
        `reception/evaluation-tracker/?${params.toString()}`
      );
      setEvaluationRows(res.data.therapists || []);
      setEvaluationTotal(Number(res.data.total || 0));
    } catch (err) {
      console.error("Failed to load Evaluation Tracker", err);
      setEvaluationRows([]);
      setEvaluationTotal(0);
      setEvaluationError(
        err?.response?.data?.error ||
          "Could not load evaluation data. Please check that the Evaluation Tracker API is connected."
      );
    } finally {
      setEvaluationLoading(false);
    }
  }, [evaluationFromDate, evaluationToDate, actingAs, user]);
  useEffect(() => {
    if (activeSection === "evaluation_tracker") {
      loadEvaluationTracker();
    }
  }, [activeSection, loadEvaluationTracker]);
  const handleBackToAdmin = () => {
    onStopImpersonation?.();
    navigate("/admin");
  };
  const resetAssignmentForm = () => {
    setAssignmentForm({
      patient_id: "",
      therapist_id: "",
      category: "appointment",
      visit_number: "",
      referring_physician: "",
      notes: "",
    });
    setSelectedPatient(null);
    setEditingAssignmentId(null);
  };
  const handleSelectPatient = async (patient) => {
    setMessage("");
    setError("");
    setSelectedPatient(patient);
    setAssignmentForm((prev) => ({
      ...prev,
      patient_id: patient.id,
      therapist_id: "",
    }));
    setEditingAssignmentId(null);
    setActiveSection("register");
    try {
      const res = await api.get(
        `reception/last-therapist/${patient.id}/`
      );
      const therapist = res.data.therapist;
      if (therapist) {
        setAssignmentForm((prev) => ({
          ...prev,
          therapist_id: String(therapist.id),
        }));
        setMessage(
          `Selected ${patient.name} (Previously with ${therapist.name})`
        );
      } else {
        setMessage(`Selected ${patient.name} for assignment.`);
      }
    } catch (err) {
      console.error("Failed to load last therapist", err);
      setMessage(`Selected ${patient.name} for assignment.`);
    }
    setTimeout(() => {
      assignmentRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 200);
  };
  const handleCreatePatientFile = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const res = await api.post("patients/", {
        name: patientForm.name,
        patient_id: patientForm.patient_id,
      });
      const patient = res.data.patient;
      setPatientForm({
        name: "",
        patient_id: "",
      });
      if (patient) {
        await handleSelectPatient(patient);
        setMessage("Patient created successfully");
        reloadLeaderboard?.();
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || "Create failed");
    }
  };
  const handleCreateOrUpdateAssignment = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      if (editingAssignmentId) {
        const res = await api.put(
          `reception/assignments/${editingAssignmentId}/`,
          {
            therapist_id: assignmentForm.therapist_id,
            category: assignmentForm.category,
            visit_number: assignmentForm.visit_number,
            referring_physician:
              assignmentForm.category === "initial_evaluation"
                ? assignmentForm.referring_physician
                : "",
            notes: assignmentForm.notes,
          }
        );
        setMessage(
          res.data.message || "Assignment updated successfully"
        );
      } else {
        const res = await api.post(
          "reception/assignments/",
          assignmentForm
        );
        setMessage(res.data.message || "Assigned successfully");
      }
      resetAssignmentForm();
      await handleApplyTrackerFilters();
      reloadLeaderboard?.();
      setActiveSection("tracker");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || "Assignment failed");
    }
  };
  const handleEditAssignment = (assignment) => {
    setMessage("");
    setError("");
    setEditingAssignmentId(assignment.id);
    setSelectedPatient({
      id: assignment.patient_id,
      name: assignment.patient_name,
      patient_id: assignment.patient_file_id,
    });
    setAssignmentForm({
      patient_id: assignment.patient_id,
      therapist_id: String(assignment.therapist_id || ""),
      category: assignment.category || "appointment",
      visit_number: assignment.visit_number ?? "",
      referring_physician: assignment.referring_physician || "",
      notes: assignment.notes || "",
    });
    setActiveSection("register");
    setMessage(`Editing assignment for ${assignment.patient_name}`);
    setTimeout(() => {
      assignmentRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 200);
  };
  const handleCancelAssignment = async (assignment) => {
    const confirmed = window.confirm(
      `Cancel today's assignment for ${assignment.patient_name}?`
    );
    if (!confirmed) return;
    try {
      const res = await api.delete(
        `reception/assignments/${assignment.id}/`
      );
      setMessage(
        res.data.message || "Assignment cancelled successfully"
      );
      setError("");
      await handleApplyTrackerFilters();
      reloadLeaderboard?.();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.error || "Failed to cancel assignment"
      );
      setMessage("");
    }
  };
  const handleEvaluationPreset = (preset) => {
    const today = getTodayString();
    setEvaluationPeriod(preset);
    if (preset === "today") {
      setEvaluationFromDate(today);
      setEvaluationToDate(today);
    } else if (preset === "week") {
      setEvaluationFromDate(getDateOffset(-6));
      setEvaluationToDate(today);
    } else if (preset === "month") {
      setEvaluationFromDate(getFirstDayOfMonthString());
      setEvaluationToDate(today);
    }
  };
  const handleEvaluationDateChange = (which, value) => {
    setEvaluationPeriod("custom");
    if (which === "from") {
      setEvaluationFromDate(value);
    } else {
      setEvaluationToDate(value);
    }
  };
  const handleEvaluationApplyDates = () => {
    if (
      evaluationFromDate &&
      evaluationToDate &&
      evaluationFromDate > evaluationToDate
    ) {
      setEvaluationError(
        "The From Date cannot be later than the To Date."
      );
      return;
    }
    loadEvaluationTracker();
  };
  const sidebarItems = [
    { key: "home", label: "Home" },
    { key: "register", label: "Assign a Patient" },
    { key: "open_file", label: "Register New Patient" },
    {
      key: "tracker",
      label: `Registration Tracker (${trackerAssignments.length})`,
    },
    {
      key: "evaluation_tracker",
      label: "Evaluation Tracker",
    },
    { key: "stats", label: "My Stats" },
    { key: "leaderboard", label: "Leaderboard" },
  ];
  const filteredEvaluationRows = evaluationRows
    .filter((row) =>
      getDisplayName(row)
        .toLowerCase()
        .includes(evaluationSearch.trim().toLowerCase())
    )
    .sort((a, b) => {
      const countA = Number(a.count ?? a.total ?? 0);
      const countB = Number(b.count ?? b.total ?? 0);
      if (evaluationSort === "count-asc") {
        return countA - countB;
      }
      if (evaluationSort === "name-asc") {
        return getDisplayName(a).localeCompare(getDisplayName(b));
      }
      if (evaluationSort === "name-desc") {
        return getDisplayName(b).localeCompare(getDisplayName(a));
      }
      return countB - countA;
    });
  const evaluationTarget = getEvaluationTarget(evaluationPeriod);
  return (
    <DashboardLayout
      title="Registration Workspace"
      subtitle={`Welcome, ${
        actingAs?.username || user?.username || "Reception User"
      }`}
      accent="#1e3a8a"
      sidebarTitle="Registration"
      sidebarItems={sidebarItems}
      activeSection={activeSection}
      setActiveSection={(key) => {
        if (key === "home") {
          navigate("/reception");
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
      {activeSection === "stats" && (
        <RegistrationStatsSection stats={stats} />
      )}
      {activeSection === "leaderboard" && (
        <LeaderboardSection
          title="Reception Leaderboard"
          rows={leaderboard}
          loading={leaderboardLoading}
          error={leaderboardError}
          onReload={reloadLeaderboard}
        />
      )}
      {activeSection === "register" && (
        <div style={styles.stack}>
          <UnifiedPatientSearch
            title="Assign a Patient"
            placeholder="Search patient name or ID"
            actionLabel="Assign to Physio"
            onSelectPatient={handleSelectPatient}
            emptyText="Start typing to search patients."
            noResultsText="No patients found. Register a new patient if needed."
            onRegisterNew={() => setActiveSection("open_file")}
            registerButtonLabel="Register New Patient"
          />
          {selectedPatient ? (
            <PatientAssignmentForm
              ref={assignmentRef}
              selectedPatient={selectedPatient}
              assignmentForm={assignmentForm}
              setAssignmentForm={setAssignmentForm}
              therapists={therapists}
              onSubmit={handleCreateOrUpdateAssignment}
            />
          ) : (
            <div style={styles.helperCard}>
              Search for a patient above, then assign the patient to a
              physiotherapist. If the patient is not found, use the{" "}
              <strong>Register New Patient</strong> button.
            </div>
          )}
        </div>
      )}
      {activeSection === "open_file" && (
        <PatientRegisterForm
          patientForm={patientForm}
          setPatientForm={setPatientForm}
          onSubmit={handleCreatePatientFile}
        />
      )}
      {activeSection === "tracker" && (
        <RegistrationTrackerSection
          mode={trackerMode}
          onChangeMode={setTrackerMode}
          assignments={trackerAssignments}
          agents={trackerAgents}
          therapists={therapists}
          filter={trackerFilter}
          setFilter={setTrackerFilter}
          onApplyFilters={handleApplyTrackerFilters}
          target={trackerTarget}
          onChangeTarget={setTrackerTarget}
          onEditAssignment={handleEditAssignment}
          onCancelAssignment={handleCancelAssignment}
        />
      )}
      {activeSection === "evaluation_tracker" && (
        <section style={styles.evaluationPage}>
          <div style={styles.evaluationHero}>
            <div style={styles.heroContent}>
              <div style={styles.evaluationEyebrow}>
                RECEPTION WORKSPACE / REPORTS
              </div>
              <h2 style={styles.evaluationTitle}>
                Evaluation Tracker
              </h2>
              <p style={styles.evaluationDescription}>
                Monitor initial evaluations across your physiotherapy
                team. View each physiotherapist's evaluation count and
                progress against the applicable target.
              </p>
              <div style={styles.periodSummary}>
                <span style={styles.periodDot} />
                <span>
                  {formatDateLabel(evaluationFromDate)} –{" "}
                  {formatDateLabel(evaluationToDate)}
                </span>
              </div>
            </div>
            <button
              type="button"
              style={{
                ...styles.refreshButton,
                ...(evaluationLoading ? styles.disabledButton : {}),
              }}
              onClick={loadEvaluationTracker}
              disabled={evaluationLoading}
            >
              <span style={styles.refreshIcon}>↻</span>
              {evaluationLoading ? "Refreshing…" : "Refresh data"}
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
            <div style={styles.evaluationPresets}>
              {[
                { key: "today", label: "Today" },
                { key: "week", label: "Last 7 days" },
                { key: "month", label: "This month" },
              ].map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  aria-pressed={evaluationPeriod === preset.key}
                  style={{
                    ...styles.presetButton,
                    ...(evaluationPeriod === preset.key
                      ? styles.activePresetButton
                      : {}),
                  }}
                  onClick={() => handleEvaluationPreset(preset.key)}
                >
                  {evaluationPeriod === preset.key && (
                    <span style={styles.presetCheck}>✓</span>
                  )}
                  {preset.label}
                </button>
              ))}
            </div>
            <div style={styles.evaluationFilters}>
              <div style={styles.evaluationField}>
                <label
                  style={styles.evaluationLabel}
                  htmlFor="evaluation-from"
                >
                  FROM DATE
                </label>
                <input
                  id="evaluation-from"
                  type="date"
                  value={evaluationFromDate}
                  max={evaluationToDate || undefined}
                  onChange={(e) =>
                    handleEvaluationDateChange("from", e.target.value)
                  }
                  style={styles.evaluationInput}
                />
              </div>
              <div style={styles.evaluationField}>
                <label
                  style={styles.evaluationLabel}
                  htmlFor="evaluation-to"
                >
                  TO DATE
                </label>
                <input
                  id="evaluation-to"
                  type="date"
                  value={evaluationToDate}
                  min={evaluationFromDate || undefined}
                  onChange={(e) =>
                    handleEvaluationDateChange("to", e.target.value)
                  }
                  style={styles.evaluationInput}
                />
              </div>
              <button
                type="button"
                style={{
                  ...styles.applyEvaluationButton,
                  ...(evaluationLoading ? styles.disabledButton : {}),
                }}
                onClick={handleEvaluationApplyDates}
                disabled={evaluationLoading}
              >
                Apply date range
                <span style={styles.buttonArrow}>→</span>
              </button>
            </div>
          </div>
          {evaluationError ? (
            <div style={styles.evaluationError} role="alert">
              <span style={styles.errorIcon}>!</span>
              <div>
                <strong style={styles.errorTitle}>
                  Unable to display evaluation data
                </strong>
                <div>{evaluationError}</div>
              </div>
            </div>
          ) : null}
          <div style={styles.tableCard}>
            <div style={styles.tableHeading}>
              <div>
                <h3 style={styles.tableTitle}>
                  Evaluations by physiotherapist
                </h3>
                <p style={styles.tableSubtitle}>
                  {evaluationPeriod === "today"
                    ? "Daily target: 4 evaluations per physiotherapist"
                    : "Monthly target reference: 30 evaluations per physiotherapist"}
                </p>
              </div>
              <span style={styles.tableCountBadge}>
                {filteredEvaluationRows.length}{" "}
                {filteredEvaluationRows.length === 1
                  ? "therapist"
                  : "therapists"}
              </span>
            </div>
            <div style={styles.tableToolbar}>
              <div style={styles.searchWrapper}>
                <span style={styles.searchIcon}>⌕</span>
                <input
                  type="search"
                  value={evaluationSearch}
                  onChange={(e) => setEvaluationSearch(e.target.value)}
                  placeholder="Search physiotherapist…"
                  aria-label="Search physiotherapist"
                  style={styles.searchInput}
                />
              </div>
              <div style={styles.sortWrapper}>
                <label
                  htmlFor="evaluation-sort"
                  style={styles.sortLabel}
                >
                  Sort by
                </label>
                <select
                  id="evaluation-sort"
                  value={evaluationSort}
                  onChange={(e) => setEvaluationSort(e.target.value)}
                  style={styles.sortSelect}
                >
                  <option value="count-desc">Highest evaluations</option>
                  <option value="count-asc">Lowest evaluations</option>
                  <option value="name-asc">Name A–Z</option>
                  <option value="name-desc">Name Z–A</option>
                </select>
              </div>
            </div>
            {evaluationLoading ? (
              <div style={styles.tableMessage}>
                <span style={styles.loadingSpinner} />
                Loading evaluation data…
              </div>
            ) : evaluationError ? (
              <div style={styles.tableMessage}>
                Evaluation data is unavailable. Check that the backend
                endpoint is connected and try refreshing.
              </div>
            ) : filteredEvaluationRows.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyStateIcon}>▤</div>
                <h4 style={styles.emptyStateTitle}>
                  {evaluationRows.length === 0
                    ? "No evaluation records found"
                    : "No matching physiotherapists"}
                </h4>
                <p style={styles.emptyStateText}>
                  {evaluationRows.length === 0
                    ? "Try a different date range or check whether initial evaluations have been recorded."
                    : "Try another name or clear your search."}
                </p>
                {evaluationSearch && (
                  <button
                    type="button"
                    style={styles.clearSearchButton}
                    onClick={() => setEvaluationSearch("")}
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
                        {evaluationPeriod === "today"
                          ? "Daily target progress"
                          : "Monthly target progress"}
                      </th>
                      <th style={styles.tableHeaderCell}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvaluationRows.map((row, index) => {
                      const count = Number(row.count ?? row.total ?? 0);
                      const percentage = getEvaluationPercentage(
                        count,
                        evaluationPeriod
                      );
                      const color = getEvaluationColor(
                        count,
                        evaluationPeriod
                      );
                      const status = getEvaluationStatus(
                        count,
                        evaluationPeriod
                      );
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
                            <span style={styles.countPill}>
                              {count}
                            </span>
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
                                aria-valuemax={evaluationTarget}
                              >
                                <div
                                  style={{
                                    ...styles.progressFill,
                                    width: `${Math.min(
                                      percentage,
                                      100
                                    )}%`,
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
                              {count} / {evaluationTarget} evaluations
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
                      <td style={styles.totalFooterCount}>
                        {evaluationTotal}
                      </td>
                      <td colSpan={2} style={styles.totalFooterNote}>
                        {formatDateLabel(evaluationFromDate)} –{" "}
                        {formatDateLabel(evaluationToDate)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
            <div style={styles.tableFooter}>
              <span>
                Showing {filteredEvaluationRows.length} of{" "}
                {evaluationRows.length} physiotherapists
              </span>
              <span>
                {evaluationPeriod === "today"
                  ? "Daily target: 4 evaluations"
                  : "Monthly target reference: 30 evaluations"}
              </span>
            </div>
          </div>
        </section>
      )}
    </DashboardLayout>
  );
}
const styles = {
  stack: {
    display: "grid",
    gap: "16px",
  },
  helperCard: {
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: "12px",
    padding: "14px",
  },
  evaluationPage: {
    display: "grid",
    gap: "20px",
    minWidth: 0,
    color: "#0f172a",
  },
  evaluationHero: {
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
  evaluationEyebrow: {
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "0.15em",
    color: "#9dd9df",
  },
  evaluationTitle: {
    margin: "10px 0 9px",
    color: "#ffffff",
    fontSize: "clamp(24px, 3vw, 32px)",
    lineHeight: 1.2,
    fontWeight: "800",
    letterSpacing: "-0.035em",
  },
  evaluationDescription: {
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
  evaluationPresets: {
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
  evaluationFilters: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
    gap: "13px",
    alignItems: "end",
  },
  evaluationField: {
    display: "grid",
    gap: "7px",
    minWidth: 0,
  },
  evaluationLabel: {
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "0.08em",
    color: "#64748b",
  },
  evaluationInput: {
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
  applyEvaluationButton: {
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
  evaluationError: {
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
  tableCountBadge: {
    padding: "7px 10px",
    border: "1px solid #dce7ef",
    borderRadius: "8px",
    background: "#f5f9fc",
    color: "#456078",
    fontSize: "11px",
    fontWeight: "800",
  },
  tableToolbar: {
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
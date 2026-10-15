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
  return formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1));
}
function getLastDayOfMonthString() {
  const now = new Date();
  return formatLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
}
function getDateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}
function getDisplayName(item) {
  return item?.therapist_name || item?.name || item?.username || "Unknown";
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
  const [activeSection, setActiveSection] = useState("stats");
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
  // Accept an optional filter object so quick presets can apply the
  // newly selected dates without relying on a timer or stale React state.
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
      if (
        actingAs &&
        (user?.is_superuser || user?.role === "admin")
      ) {
        params.append("viewed_user_id", String(actingAs.id));
        params.append("viewed_user_role", String(actingAs.role || ""));
      }
      // This endpoint must count only category="initial_evaluation".
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
  const sidebarItems = [
    { key: "home", label: "Home" },
    { key: "stats", label: "My Stats" },
    { key: "leaderboard", label: "Leaderboard" },
    { key: "register", label: "Register" },
    { key: "open_file", label: "Open New File" },
    {
      key: "tracker",
      label: `Registration Tracker (${trackerAssignments.length})`,
    },
    {
      key: "evaluation_tracker",
      label: "Evaluation Tracker",
    },
  ];
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
        <DashboardNotice type="success">
          {message}
        </DashboardNotice>
      ) : null}
      {error ? (
        <DashboardNotice type="error">
          {error}
        </DashboardNotice>
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
            title="Register"
            placeholder="Search patient name or ID"
            actionLabel="Assign to Physio"
            onSelectPatient={handleSelectPatient}
            emptyText="Start typing to search patients."
            noResultsText="No patients found. Open a new file if needed."
            onRegisterNew={() => setActiveSection("open_file")}
            registerButtonLabel="Open New File"
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
              Search for a patient above, then assign to
              physiotherapist below. If the patient is not found,
              use the <strong>Open New File</strong> button.
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
          <div style={styles.evaluationHeader}>
            <div>
              <div style={styles.evaluationEyebrow}>
                RECEPTION REPORT
              </div>
              <h2 style={styles.evaluationTitle}>
                Evaluation Tracker
              </h2>
              <p style={styles.evaluationDescription}>
                Track initial evaluations assigned to each physiotherapist.
                Only assignments categorized as Initial Evaluation are counted.
              </p>
            </div>
            <button
              type="button"
              style={styles.refreshButton}
              onClick={loadEvaluationTracker}
              disabled={evaluationLoading}
            >
              {evaluationLoading ? "Loading..." : "Refresh"}
            </button>
          </div>
          <div style={styles.evaluationPresets}>
            <button
              type="button"
              style={styles.presetButton}
              onClick={() => handleEvaluationPreset("today")}
            >
              Today
            </button>
            <button
              type="button"
              style={styles.presetButton}
              onClick={() => handleEvaluationPreset("week")}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              style={styles.presetButton}
              onClick={() => handleEvaluationPreset("month")}
            >
              This Month
            </button>
          </div>
          <div style={styles.evaluationFilters}>
            <div style={styles.evaluationField}>
              <label style={styles.evaluationLabel} htmlFor="evaluation-from">
                From Date
              </label>
              <input
                id="evaluation-from"
                type="date"
                value={evaluationFromDate}
                max={evaluationToDate || undefined}
                onChange={(e) => setEvaluationFromDate(e.target.value)}
                style={styles.evaluationInput}
              />
            </div>
            <div style={styles.evaluationField}>
              <label style={styles.evaluationLabel} htmlFor="evaluation-to">
                To Date
              </label>
              <input
                id="evaluation-to"
                type="date"
                value={evaluationToDate}
                min={evaluationFromDate || undefined}
                onChange={(e) => setEvaluationToDate(e.target.value)}
                style={styles.evaluationInput}
              />
            </div>
            <button
              type="button"
              style={styles.applyEvaluationButton}
              onClick={loadEvaluationTracker}
              disabled={evaluationLoading}
            >
              Apply Dates
            </button>
          </div>
          {evaluationError ? (
            <div style={styles.evaluationError}>
              {evaluationError}
            </div>
          ) : null}
          <div style={styles.evaluationSummary}>
            <div style={styles.totalCard}>
              <span style={styles.totalLabel}>
                Total Initial Evaluations
              </span>
              <strong style={styles.totalNumber}>
                {evaluationLoading ? "…" : evaluationTotal}
              </strong>
              <span style={styles.totalHint}>
                For the selected date range
              </span>
            </div>
          </div>
          <div style={styles.tableCard}>
            <div style={styles.tableHeading}>
              <h3 style={styles.tableTitle}>
                Evaluations by Physiotherapist
              </h3>
              <span style={styles.tableCaption}>
                {evaluationRows.length} physiotherapists
              </span>
            </div>
            {evaluationLoading ? (
              <div style={styles.tableMessage}>
                Loading evaluation data…
              </div>
            ) : evaluationError ? (
              <div style={styles.tableMessage}>
                Evaluation data is unavailable until the backend endpoint is connected.
              </div>
            ) : evaluationRows.length === 0 ? (
              <div style={styles.tableMessage}>
                No evaluation records were found for these dates.
              </div>
            ) : (
              <div style={styles.tableScroll}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.tableHeaderCell}>Physiotherapist</th>
                      <th style={styles.tableHeaderCell}>Initial Evaluations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluationRows.map((row, index) => (
                      <tr key={row.therapist_id ?? row.id ?? index}>
                        <td style={styles.tableCell}>
                          {getDisplayName(row)}
                        </td>
                        <td style={styles.countCell}>
                          {Number(row.count ?? row.total ?? 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td style={styles.totalFooterCell}>Total</td>
                      <td style={styles.totalFooterCount}>
                        {evaluationTotal}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
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
    gap: "18px",
    minWidth: 0,
  },
  evaluationHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "16px",
    padding: "24px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
  },
  evaluationEyebrow: {
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "0.09em",
    color: "#64748b",
  },
  evaluationTitle: {
    margin: "7px 0 8px",
    color: "#0f172a",
    fontSize: "25px",
    fontWeight: "800",
  },
  evaluationDescription: {
    maxWidth: "700px",
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.7,
  },
  refreshButton: {
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "10px 15px",
    color: "#334155",
    fontWeight: "700",
    cursor: "pointer",
  },
  evaluationPresets: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  presetButton: {
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "9px",
    padding: "9px 13px",
    color: "#334155",
    fontWeight: "700",
    cursor: "pointer",
  },
  evaluationFilters: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    alignItems: "end",
    padding: "18px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
  },
  evaluationField: {
    display: "grid",
    gap: "7px",
    minWidth: 0,
  },
  evaluationLabel: {
    fontSize: "12px",
    fontWeight: "800",
    color: "#475569",
  },
  evaluationInput: {
    boxSizing: "border-box",
    width: "100%",
    minWidth: 0,
    padding: "11px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    background: "#ffffff",
    fontSize: "14px",
  },
  applyEvaluationButton: {
    background: "#0f172a",
    color: "#ffffff",
    border: "1px solid #0f172a",
    borderRadius: "10px",
    padding: "12px 16px",
    fontWeight: "800",
    cursor: "pointer",
  },
  evaluationError: {
    padding: "12px 14px",
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#991b1b",
    borderRadius: "10px",
    fontSize: "13px",
  },
  evaluationSummary: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },
  totalCard: {
    display: "grid",
    gap: "8px",
    padding: "22px",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "16px",
  },
  totalLabel: {
    color: "#1e40af",
    fontSize: "13px",
    fontWeight: "800",
  },
  totalNumber: {
    color: "#1e3a8a",
    fontSize: "36px",
    lineHeight: 1.1,
    fontWeight: "800",
  },
  totalHint: {
    color: "#475569",
    fontSize: "12px",
  },
  tableCard: {
    minWidth: 0,
    overflow: "hidden",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
  },
  tableHeading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
    padding: "18px 20px",
    borderBottom: "1px solid #e2e8f0",
  },
  tableTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "16px",
    fontWeight: "800",
  },
  tableCaption: {
    color: "#64748b",
    fontSize: "12px",
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
    padding: "13px 20px",
    background: "#f8fafc",
    color: "#475569",
    fontSize: "12px",
    fontWeight: "800",
    borderBottom: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
  },
  tableCell: {
    padding: "14px 20px",
    color: "#334155",
    fontSize: "14px",
    borderBottom: "1px solid #f1f5f9",
  },
  countCell: {
    padding: "14px 20px",
    color: "#1d4ed8",
    fontSize: "15px",
    fontWeight: "800",
    borderBottom: "1px solid #f1f5f9",
  },
  totalFooterCell: {
    padding: "15px 20px",
    background: "#f8fafc",
    color: "#0f172a",
    fontSize: "13px",
    fontWeight: "800",
  },
  totalFooterCount: {
    padding: "15px 20px",
    background: "#f8fafc",
    color: "#1d4ed8",
    fontSize: "15px",
    fontWeight: "800",
  },
  tableMessage: {
    padding: "28px 20px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "14px",
  },
};
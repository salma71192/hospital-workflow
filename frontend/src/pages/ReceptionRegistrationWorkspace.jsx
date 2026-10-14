import React, { useEffect, useRef, useState } from "react";
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
  useEffect(() => {
    loadTherapists();
  }, [actingAs, user]);
  useEffect(() => {
    handleApplyTrackerFilters();
  }, [trackerMode]);
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
      if (start_date) {
        params.append("start_date", start_date);
      }
      if (end_date) {
        params.append("end_date", end_date);
      }
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
  const handleApplyTrackerFilters = async () => {
    if (trackerMode === "today") {
      const safeDate = trackerFilter.date || getTodayString();
      await loadAssignments({
        start_date: safeDate,
        end_date: safeDate,
        user_id: trackerFilter.user_id,
        patient: trackerFilter.patient,
        therapist_id: trackerFilter.therapist_id,
      });
      return;
    }
    await loadAssignments({
      start_date: trackerFilter.from_date,
      end_date: trackerFilter.to_date,
      user_id: trackerFilter.user_id,
      patient: trackerFilter.patient,
      therapist_id: trackerFilter.therapist_id,
    });
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
        <section style={styles.evaluationCard}>
          <div style={styles.evaluationIcon}>ET</div>
          <h2 style={styles.evaluationTitle}>
            Evaluation Tracker
          </h2>
          <p style={styles.evaluationText}>
            The Evaluation Tracker has been added to the Reception
            sidebar. Its tracking table and data connection have not
            been connected yet.
          </p>
          <p style={styles.evaluationHint}>
            Existing registration and assignment features remain
            unchanged. No evaluation records or booking data have
            been modified.
          </p>
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
  evaluationCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "28px",
    maxWidth: "800px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
  },
  evaluationIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "#eff6ff",
    color: "#1d4ed8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "14px",
    marginBottom: "18px",
  },
  evaluationTitle: {
    margin: "0 0 12px",
    color: "#0f172a",
    fontSize: "24px",
    fontWeight: "700",
  },
  evaluationText: {
    color: "#475569",
    fontSize: "15px",
    lineHeight: 1.8,
    margin: "0 0 12px",
  },
  evaluationHint: {
    color: "#64748b",
    fontSize: "13px",
    lineHeight: 1.7,
    margin: 0,
  },
};
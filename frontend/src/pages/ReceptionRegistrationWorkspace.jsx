
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
import EvaluationTrackerSection from "../components/assignments/EvaluationTrackerSection";
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
  return formatLocalDate(
    new Date(now.getFullYear(), now.getMonth() + 1, 0)
  );
}

function getApiError(err, fallback) {
  const data = err?.response?.data;

  if (typeof data?.error === "string") return data.error;
  if (typeof data?.detail === "string") return data.detail;
  if (typeof data === "string") return data;

  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([field, value]) => {
        const detail = Array.isArray(value)
          ? value.join(", ")
          : typeof value === "string"
          ? value
          : JSON.stringify(value);

        return `${field}: ${detail}`;
      })
      .join(" | ") || fallback;
  }

  if (err?.message) return `${fallback}: ${err.message}`;
  return fallback;
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
  const [creatingPatient, setCreatingPatient] = useState(false);
  const [trackerAssignments, setTrackerAssignments] = useState([]);
  const [trackerAgents, setTrackerAgents] = useState([]);
  const [trackerTarget, setTrackerTarget] = useState(50);

  const loadTherapists = useCallback(async () => {
    try {
      const res = await api.get("reception/therapists/");
      setTherapists(res.data?.therapists || []);
    } catch (err) {
      console.error("Failed to load therapists", err);
      setTherapists([]);
    }
  }, []);

  useEffect(() => {
    loadTherapists();
  }, [loadTherapists, actingAs, user]);

  const loadAssignments = useCallback(async ({
    start_date = "",
    end_date = "",
    user_id = "all",
    patient = "",
    therapist_id = "all",
  } = {}) => {
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

      setTrackerAssignments(res.data?.assignments || []);
      setTrackerAgents(res.data?.agents || []);
    } catch (err) {
      console.error("Failed to load assignments", err);
      setTrackerAssignments([]);
      setTrackerAgents([]);
    }
  }, [actingAs, user]);

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
    [trackerMode, trackerFilter, loadAssignments]
  );

  useEffect(() => {
    handleApplyTrackerFilters();
  }, [trackerMode]); // eslint-disable-line react-hooks/exhaustive-deps

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

      const therapist = res.data?.therapist;

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

    if (creatingPatient) return;

    const name = String(patientForm.name || "").trim();
    const patientId = String(patientForm.patient_id || "").trim();

    if (!name || !patientId) {
      setError("Please enter both the patient name and patient ID.");
      setMessage("");
      return;
    }

    setCreatingPatient(true);
    setMessage("");
    setError("");

    try {
      const res = await api.post("patients/", {
        name,
        patient_id: patientId,
      });

      const data = res.data || {};
      const patient = data.patient || data;

      setPatientForm({
        name: "",
        patient_id: "",
      });

      setMessage(
        data.message || "Patient file created successfully."
      );

      reloadLeaderboard?.();

      if (patient?.id) {
        await handleSelectPatient(patient);
        setMessage(
          data.message || `Patient file created successfully for ${patient.name || name}.`
        );
      } else {
        setSelectedPatient(null);
      }
    } catch (err) {
      console.error(
        "Failed to create patient file:",
        err?.response?.status,
        err?.response?.data || err
      );

      setError(
        getApiError(err, "Failed to create patient file. Please try again.")
      );
      setMessage("");
    } finally {
      setCreatingPatient(false);
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
          res.data?.message || "Assignment updated successfully."
        );
      } else {
        const res = await api.post(
          "reception/assignments/",
          assignmentForm
        );

        setMessage(res.data?.message || "Assigned successfully.");
      }

      resetAssignmentForm();
      await handleApplyTrackerFilters();
      reloadLeaderboard?.();
      setActiveSection("tracker");
    } catch (err) {
      console.error("Assignment failed", err);
      setError(getApiError(err, "Assignment failed."));
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
        res.data?.message || "Assignment cancelled successfully."
      );
      setError("");
      await handleApplyTrackerFilters();
      reloadLeaderboard?.();
    } catch (err) {
      console.error("Failed to cancel assignment", err);
      setError(getApiError(err, "Failed to cancel assignment."));
      setMessage("");
    }
  };

  const sidebarItems = [
    { key: "home", label: "Home" },
    { key: "register", label: "Assign a Patient" },
    { key: "open_file", label: "Register New Patient" },
    {
      key: "tracker",
      label: `Registration Tracker (${trackerAssignments.length})`,
    },
    { key: "evaluation_tracker", label: "Evaluation Tracker" },
    { key: "stats", label: "My Stats" },
    { key: "leaderboard", label: "Leaderboard" },
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
        setMessage("");
        setError("");

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
      {message && (
        <DashboardNotice type="success">{message}</DashboardNotice>
      )}

      {error && (
        <DashboardNotice type="error">{error}</DashboardNotice>
      )}

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
            onRegisterNew={() => {
              setMessage("");
              setError("");
              setPatientForm({ name: "", patient_id: "" });
              setActiveSection("open_file");
            }}
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
        <div style={styles.stack}>
          <h2 style={styles.heading}>Register New Patient</h2>

          <PatientRegisterForm
            patientForm={patientForm}
            setPatientForm={setPatientForm}
            onSubmit={handleCreatePatientFile}
          />

          {creatingPatient && (
            <DashboardNotice type="success">
              Creating patient file...
            </DashboardNotice>
          )}
        </div>
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
        <EvaluationTrackerSection
          user={user}
          actingAs={actingAs}
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
  heading: {
    margin: 0,
    color: "#0f172a",
    fontSize: "22px",
    fontWeight: 700,
  },
  helperCard: {
    color: "#64748b",
    fontSize: "14px",
    fontWeight: 600,
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: "12px",
    padding: "14px",
  },
};

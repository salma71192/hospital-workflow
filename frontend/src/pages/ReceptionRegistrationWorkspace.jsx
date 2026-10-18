
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/api";
import DashboardLayout from "../components/DashboardLayout";
import DashboardNotice from "../components/common/DashboardNotice";
import useLeaderboard from "../components/common/useLeaderboard";
import useRegistrationStats from "../components/assignments/useRegistrationStats";

import ReceptionRegistrationTracker from "../components/reception/ReceptionRegistrationTracker";
import ReceptionPatientRegistration from "../components/reception/ReceptionPatientRegistration";
import ReceptionReports from "../components/reception/ReceptionReports";

import {
  getTodayString,
  getFirstDayOfMonthString,
  getLastDayOfMonthString,
  normalizeRole,
  isAdminUser,
  isReceptionUser,
  getApiError,
} from "../components/reception/receptionUtils";

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

  // Only the authenticated account determines admin privileges.
  const isAdmin = isAdminUser(user);
  const effectiveUser = actingAs || user;
  const effectiveRole = normalizeRole(effectiveUser?.role);
  const isReception = isReceptionUser(effectiveUser);

  const welcomeName =
    effectiveUser?.display_name ||
    effectiveUser?.full_name ||
    effectiveUser?.username ||
    "Reception User";

  const [activeSection, setActiveSection] = useState("register");
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [trackerMode, setTrackerMode] = useState("today");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientForm, setPatientForm] = useState({ name: "", patient_id: "" });
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
      if (user_id && user_id !== "all") params.append("user_id", user_id);
      if (patient?.trim()) params.append("patient", patient.trim());
      if (therapist_id && therapist_id !== "all") {
        params.append("therapist_id", therapist_id);
      }

      // Send impersonation context only for the real administrator.
      if (actingAs && isAdmin && actingAs.id != null) {
        params.append("viewed_user_id", String(actingAs.id));
        params.append("viewed_user_role", String(actingAs.role || ""));
      }

      const query = params.toString();
      const url = query
        ? `reception/assignments/?${query}`
        : "reception/assignments/";

      const res = await api.get(url);
      setTrackerAssignments(
        Array.isArray(res.data?.assignments) ? res.data.assignments : []
      );
      setTrackerAgents(
        Array.isArray(res.data?.agents) ? res.data.agents : []
      );
      setError("");
    } catch (err) {
      console.error("Failed to load assignments", err?.response?.data || err);
      setTrackerAssignments([]);
      setTrackerAgents([]);
      setError(getApiError(err, "Failed to load registrations."));
    }
  }, [actingAs, isAdmin]);

  const handleApplyTrackerFilters = useCallback(async (filters = trackerFilter) => {
    if (trackerMode === "today") {
      const date = filters.date || getTodayString();
      await loadAssignments({
        start_date: date,
        end_date: date,
        user_id: filters.user_id,
        patient: filters.patient,
        therapist_id: filters.therapist_id,
      });
    } else {
      await loadAssignments({
        start_date: filters.from_date,
        end_date: filters.to_date,
        user_id: filters.user_id,
        patient: filters.patient,
        therapist_id: filters.therapist_id,
      });
    }
  }, [trackerMode, trackerFilter, loadAssignments]);

  useEffect(() => {
    handleApplyTrackerFilters();
  }, [handleApplyTrackerFilters]);

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
    setAssignmentForm(prev => ({
      ...prev,
      patient_id: patient.id,
      therapist_id: "",
    }));
    setEditingAssignmentId(null);
    setActiveSection("register");

    try {
      const res = await api.get(`reception/last-therapist/${patient.id}/`);
      const therapist = res.data?.therapist;

      if (therapist) {
        setAssignmentForm(prev => ({
          ...prev,
          therapist_id: String(therapist.id),
        }));
        setMessage(`Selected ${patient.name} (Previously with ${therapist.name})`);
      } else {
        setMessage(`Selected ${patient.name} for assignment.`);
      }
    } catch {
      setMessage(`Selected ${patient.name} for assignment.`);
    }

    setTimeout(() => {
      assignmentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  };

  const handleCreatePatientFile = async (e) => {
    e.preventDefault();
    if (creatingPatient) return;

    const name = String(patientForm.name || "").trim();
    const patient_id = String(patientForm.patient_id || "").trim();

    if (!name || !patient_id) {
      setError("Please enter both the patient name and patient ID.");
      setMessage("");
      return;
    }

    setCreatingPatient(true);
    setMessage("");
    setError("");

    try {
      const res = await api.post("patients/", { name, patient_id });
      const data = res.data || {};
      const patient = data.patient || data;

      setPatientForm({ name: "", patient_id: "" });
      setMessage(data.message || "Patient file created successfully.");
      reloadLeaderboard?.();

      if (patient?.id) {
        await handleSelectPatient(patient);
        setMessage(data.message || `Patient file created successfully for ${patient.name || name}.`);
      } else {
        setSelectedPatient(null);
      }
    } catch (err) {
      console.error("Failed to create patient file:", err?.response?.data || err);
      setError(getApiError(err, "Failed to create patient file. Please try again."));
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
        const res = await api.put(`reception/assignments/${editingAssignmentId}/`, {
          therapist_id: assignmentForm.therapist_id,
          category: assignmentForm.category,
          visit_number: assignmentForm.visit_number,
          referring_physician: assignmentForm.category === "initial_evaluation"
            ? assignmentForm.referring_physician
            : "",
          notes: assignmentForm.notes,
        });
        setMessage(res.data?.message || "Assignment updated successfully.");
      } else {
        const res = await api.post("reception/assignments/", assignmentForm);
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
    if (!isAdmin && !assignment.can_edit && !assignment.can_edit_today) {
      setError("You do not have permission to edit this registration.");
      setMessage("");
      return;
    }

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
      assignmentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  };

  const handleCancelAssignment = async (assignment) => {
    if (!isAdmin && !assignment.can_delete && !assignment.can_cancel_today) {
      setError("You do not have permission to delete this registration.");
      setMessage("");
      return;
    }

    const dateLabel = assignment.assignment_date
      ? `dated ${assignment.assignment_date}`
      : "selected";

    if (!window.confirm(
      `Delete the registration for ${assignment.patient_name} (${dateLabel})?`
    )) return;

    try {
      const res = await api.delete(`reception/assignments/${assignment.id}/`);
      setMessage(res.data?.message || "Registration deleted successfully.");
      setError("");
      await handleApplyTrackerFilters();
      reloadLeaderboard?.();
    } catch (err) {
      console.error("Failed to delete registration", err?.response?.data || err);
      setError(getApiError(err, "Failed to delete registration."));
      setMessage("");
    }
  };

  const sidebarItems = [
    { key: "home", label: "Home" },
    { key: "register", label: "Assign a Patient" },
    { key: "open_file", label: "Register New Patient" },
    { key: "tracker", label: `Registration Tracker (${trackerAssignments.length})` },
    { key: "evaluation_tracker", label: "Evaluation Tracker" },
    { key: "stats", label: "My Stats" },
    { key: "leaderboard", label: "Leaderboard" },
  ];

  return (
    <DashboardLayout
      title="Registration Workspace"
      subtitle={`Welcome, ${welcomeName}`}
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
      actingAsName={welcomeName}
      onBackToAdmin={handleBackToAdmin}
    >
      {message && <DashboardNotice type="success">{message}</DashboardNotice>}
      {error && <DashboardNotice type="error">{error}</DashboardNotice>}

      <ReceptionPatientRegistration
        activeSection={activeSection}
        selectedPatient={selectedPatient}
        patientForm={patientForm}
        setPatientForm={setPatientForm}
        assignmentForm={assignmentForm}
        setAssignmentForm={setAssignmentForm}
        therapists={therapists}
        assignmentRef={assignmentRef}
        creatingPatient={creatingPatient}
        onSelectPatient={handleSelectPatient}
        onCreatePatient={handleCreatePatientFile}
        onSubmitAssignment={handleCreateOrUpdateAssignment}
        setMessage={setMessage}
        setError={setError}
        setActiveSection={setActiveSection}
      />

      <ReceptionRegistrationTracker
        activeSection={activeSection}
        mode={trackerMode}
        onChangeMode={setTrackerMode}
        assignments={trackerAssignments}
        agents={trackerAgents}
        therapists={therapists}
        filter={trackerFilter}
        setFilter={setTrackerFilter}
        onApplyFilters={handleApplyTrackerFilters}
        onEditAssignment={handleEditAssignment}
        onCancelAssignment={handleCancelAssignment}
        userRole={effectiveRole}
        isAdmin={isAdmin}
        isReception={isReception}
        currentUserId={effectiveUser?.id}
      />

      <ReceptionReports
        activeSection={activeSection}
        stats={stats}
        leaderboard={leaderboard}
        leaderboardLoading={leaderboardLoading}
        leaderboardError={leaderboardError}
        onReloadLeaderboard={reloadLeaderboard}
        user={effectiveUser}
        actingAs={actingAs}
      />
    </DashboardLayout>
  );
}

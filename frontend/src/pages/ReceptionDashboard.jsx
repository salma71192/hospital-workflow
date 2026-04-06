import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

import AssignmentHistory from "../components/AssignmentHistory";
import AssignmentProgressCard from "../components/AssignmentProgressCard";
import DashboardLayout from "../components/DashboardLayout";
import TodayAssignmentsList from "../components/assignments/TodayAssignmentsList";

import PatientRegisterForm from "../components/patients/PatientRegisterForm";
import PatientAssignmentForm from "../components/patients/PatientAssignmentForm";
import UnifiedPatientSearch from "../components/patients/UnifiedPatientSearch";

import DashboardNotice from "../components/common/DashboardNotice";
import DashboardMetricInput from "../components/common/DashboardMetricInput";
import DashboardStatsGrid from "../components/common/DashboardStatsGrid";

export default function ReceptionDashboard({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();
  const assignmentRef = useRef(null);

  const [activeSection, setActiveSection] = useState("search");
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);

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

  const [therapists, setTherapists] = useState([]);
  const [todayAssignments, setTodayAssignments] = useState([]);
  const [dailyTarget, setDailyTarget] = useState(10);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    loadTherapists();
    loadTodayAssignments();
  }, [today, actingAs, user]);

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

  const loadTodayAssignments = async () => {
    try {
      const params = new URLSearchParams({
        start_date: today,
        end_date: today,
      });

      if (actingAs && (user?.is_superuser || user?.role === "admin")) {
        params.append("viewed_user_id", String(actingAs.id));
        params.append("viewed_user_role", String(actingAs.role || ""));
      }

      const res = await api.get(`reception/assignments/?${params.toString()}`);
      setTodayAssignments(res.data.assignments || []);
    } catch (err) {
      console.error("Failed to load today's assignments", err);
      setTodayAssignments([]);
    }
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
    setActiveSection("assign");

    try {
      const res = await api.get(`reception/last-therapist/${patient.id}/`);
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
      }

      setMessage("Patient created");
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
        setMessage(res.data.message || "Assignment updated successfully");
      } else {
        const res = await api.post("reception/assignments/", assignmentForm);
        setMessage(res.data.message || "Assigned successfully");
      }

      resetAssignmentForm();
      await loadTodayAssignments();
      setActiveSection("today");
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

    setActiveSection("assign");
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
      const res = await api.delete(`reception/assignments/${assignment.id}/`);
      setMessage(res.data.message || "Assignment cancelled successfully");
      setError("");
      await loadTodayAssignments();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || "Failed to cancel assignment");
      setMessage("");
    }
  };

  return (
    <DashboardLayout
      title="Reception Dashboard"
      subtitle={`Welcome, ${
        actingAs?.username || user?.username || "Reception User"
      }`}
      accent="#1e3a8a"
      sidebarTitle="Workflow"
      sidebarItems={[
        { key: "search", label: "Search Patient" },
        { key: "register", label: "Register New Patient" },
        {
          key: "assign",
          label: editingAssignmentId ? "Edit Assignment" : "Assign Patient",
        },
        { key: "today", label: "Today's Assignments" },
        { key: "history", label: "History" },
      ]}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      onLogout={onLogout}
      actingAs={actingAs}
      actingAsName={actingAs?.username}
      onBackToAdmin={handleBackToAdmin}
    >
      {message && <DashboardNotice type="success">{message}</DashboardNotice>}
      {error && <DashboardNotice type="error">{error}</DashboardNotice>}

      {activeSection === "search" && (
        <UnifiedPatientSearch
          title="Search Patient"
          placeholder="Start typing patient name or ID"
          actionLabel="Assign"
          onSelectPatient={handleSelectPatient}
          emptyText="Start typing to search patients."
          noResultsText="No patients found. Register a new patient if needed."
        />
      )}

      {activeSection === "register" && (
        <PatientRegisterForm
          patientForm={patientForm}
          setPatientForm={setPatientForm}
          onSubmit={handleCreatePatientFile}
        />
      )}

      {activeSection === "assign" && (
        <PatientAssignmentForm
          ref={assignmentRef}
          selectedPatient={selectedPatient}
          assignmentForm={assignmentForm}
          setAssignmentForm={setAssignmentForm}
          therapists={therapists}
          onSubmit={handleCreateOrUpdateAssignment}
        />
      )}

      {activeSection === "today" && (
        <>
          <DashboardMetricInput
            label="Daily Target"
            value={dailyTarget}
            onChange={setDailyTarget}
            placeholder="Daily target"
          />

          <DashboardStatsGrid
            stats={[
              { label: "Today's Assignments", value: todayAssignments.length },
              { label: "Daily Target", value: dailyTarget },
              {
                label: "Remaining",
                value: Math.max(Number(dailyTarget) - todayAssignments.length, 0),
              },
            ]}
          />

          <AssignmentProgressCard
            title="Today's Assignments"
            count={todayAssignments.length}
            target={dailyTarget}
            subtitle={today}
          />

          <TodayAssignmentsList
            assignments={todayAssignments}
            onEditAssignment={handleEditAssignment}
            onCancelAssignment={handleCancelAssignment}
          />
        </>
      )}

      {activeSection === "history" && (
        <AssignmentHistory
          title="Reception Assignment History"
          currentUser={user}
          actingAs={actingAs}
          onEditAssignment={handleEditAssignment}
          onCancelAssignment={handleCancelAssignment}
        />
      )}
    </DashboardLayout>
  );
}
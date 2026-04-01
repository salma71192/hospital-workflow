import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import AssignmentHistory from "../components/AssignmentHistory";
import AssignmentProgressCard from "../components/AssignmentProgressCard";
import DashboardLayout from "../components/DashboardLayout";
import TodayAssignmentsList from "../components/assignments/TodayAssignmentsList";
import PatientSearchPanel from "../components/patients/PatientSearchPanel";
import PatientRegisterForm from "../components/patients/PatientRegisterForm";
import PatientAssignmentForm from "../components/patients/PatientAssignmentForm";
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
  const today = new Date().toISOString().split("T")[0];

  const [activeSection, setActiveSection] = useState("search");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [patientForm, setPatientForm] = useState({
    name: "",
    patient_id: "",
    current_approval_number: "",
    sessions_taken: "",
    taken_with: "",
    current_future_appointments: "",
  });

  const [assignmentForm, setAssignmentForm] = useState({
    patient_id: "",
    therapist_id: "",
    assignment_date: today,
    notes: "",
  });

  const [therapists, setTherapists] = useState([]);
  const [todayAssignments, setTodayAssignments] = useState([]);
  const [dailyTarget, setDailyTarget] = useState(10);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleBackToAdmin = () => {
    onStopImpersonation();
    navigate("/admin");
  };

  const loadTherapists = async () => {
    try {
      const res = await api.get("reception/therapists/");
      setTherapists(res.data.therapists || []);
    } catch (err) {
      console.error("Failed to load therapists", err);
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
    }
  };

  useEffect(() => {
    loadTherapists();
    loadTodayAssignments();
  }, [today, actingAs, user]);

  const handleSearchPatient = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setSelectedPatient(null);

    try {
      const url = searchTerm
        ? `patients/?search=${encodeURIComponent(searchTerm)}`
        : "patients/";
      const res = await api.get(url);
      const patients = res.data.patients || [];
      setSearchResults(patients);

      if (patients.length > 0) {
        setMessage("Patient found. You can open file or assign to therapist.");
      } else {
        setMessage("Patient not found. Please register new patient.");
      }
    } catch (err) {
      setError("Failed to search patient");
    }
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setAssignmentForm((prev) => ({
      ...prev,
      patient_id: patient.id,
    }));
    setActiveSection("assign");
    setMessage(`Selected ${patient.name} for assignment.`);
    setError("");
  };

  const handleCreatePatientFile = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await api.post("patients/", patientForm);
      const createdPatient = res.data.patient;

      setMessage(res.data.message || "Patient file created successfully");
      setError("");

      setPatientForm({
        name: "",
        patient_id: "",
        current_approval_number: "",
        sessions_taken: "",
        taken_with: "",
        current_future_appointments: "",
      });

      if (createdPatient) {
        setSelectedPatient(createdPatient);
        setAssignmentForm((prev) => ({
          ...prev,
          patient_id: createdPatient.id,
        }));
        setActiveSection("assign");
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to create patient file");
      setMessage("");
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await api.post("reception/assignments/", assignmentForm);
      setMessage(res.data.message || "Patient assigned successfully");
      setError("");

      setAssignmentForm({
        patient_id: "",
        therapist_id: "",
        assignment_date: today,
        notes: "",
      });

      setSelectedPatient(null);
      setSearchResults([]);
      setSearchTerm("");

      await loadTodayAssignments();
      setActiveSection("today");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to assign patient");
      setMessage("");
    }
  };

  return (
    <DashboardLayout
      title="Reception Dashboard"
      subtitle={`Welcome, ${actingAs?.username || user?.username || "Reception User"}`}
      accent="#1e3a8a"
      sidebarTitle="Workflow"
      sidebarItems={[
        { key: "search", label: "Search Patient" },
        { key: "register", label: "Register New Patient" },
        { key: "assign", label: "Assign Patient" },
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
        <PatientSearchPanel
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onSearch={handleSearchPatient}
          searchResults={searchResults}
          onSelectPatient={handleSelectPatient}
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
          selectedPatient={selectedPatient}
          assignmentForm={assignmentForm}
          setAssignmentForm={setAssignmentForm}
          therapists={therapists}
          onSubmit={handleCreateAssignment}
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
              {
                label: "Today's Assignments",
                value: todayAssignments.length,
              },
              {
                label: "Daily Target",
                value: dailyTarget,
              },
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

          <TodayAssignmentsList assignments={todayAssignments} />
        </>
      )}

      {activeSection === "history" && (
        <AssignmentHistory
          title="Reception Assignment History"
          currentUser={user}
          actingAs={actingAs}
        />
      )}
    </DashboardLayout>
  );
}
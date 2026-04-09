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

import BookingSection from "../components/booking/BookingSection";
import TodayBookingsSection from "../components/booking/TodayBookingsSection";
import MonthlyBookingsSection from "../components/booking/MonthlyBookingsSection";
import useBookingDashboard from "../components/booking/useBookingDashboard";

export default function ReceptionDashboard({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();
  const assignmentRef = useRef(null);

  const [activeSection, setActiveSection] = useState("home");
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

  const {
    selectedPatient: bookingSelectedPatient,
    setSelectedPatient: setBookingSelectedPatient,
    bookingForm,
    setBookingForm,
    therapists: bookingTherapists,
    weekDates,
    slots,
    todayBookings,
    todayBookingsCount,
    monthlyBookings,
    monthlyBookingsCount,
    monthlyAgents,
    monthlyFilter,
    setMonthlyFilter,
    handleSelectTherapist,
    handleSelectDate,
    handleSelectSlot,
    handleConfirmBooking,
    handleEditBooking,
    handleDeleteBooking,
    handleApplyMonthlyFilters,
  } = useBookingDashboard();

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

  const handleSelectPatientForAssign = async (patient) => {
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

  const handleSelectPatientForBooking = (patient) => {
    setMessage("");
    setError("");

    setBookingSelectedPatient({
      id: patient.id,
      name: patient.name,
      patient_id: patient.patient_id,
    });

    setBookingForm((prev) => ({
      ...prev,
      booking_id: "",
      therapist_id: "",
      appointment_date: new Date().toISOString().split("T")[0],
      appointment_time: "",
      notes: "",
    }));

    setActiveSection("booking");
    setMessage(`Selected ${patient.name} for booking.`);
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
        await handleSelectPatientForAssign(patient);
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
      setActiveSection("today_assignments");
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
      sidebarTitle="Reception Panel"
      sidebarItems={[
        { key: "home", label: "Home" },
        { key: "registration_workflow", label: "Registration Workflow" },
        { key: "booking_workflow", label: "Booking Workflow" },
        { key: "today_assignments", label: "Today's Assignments" },
        { key: "today_bookings", label: `Today's Bookings (${todayBookingsCount || 0})` },
        { key: "history", label: "Assignment Tracker Monthly" },
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

      {activeSection === "home" && (
        <div style={styles.homeGrid}>
          <div style={styles.welcomeCard}>
            <div style={styles.welcomeEyebrow}>Reception Workspace</div>
            <h1 style={styles.welcomeTitle}>
              Welcome, {actingAs?.username || user?.username || "Reception User"}
            </h1>
            <div style={styles.welcomeText}>
              Manage patient registration, assignments, and appointment booking from one place.
            </div>
          </div>

          <div style={styles.workflowGrid}>
            <div style={styles.blockCard}>
              <div style={styles.blockHeader}>
                <div style={styles.blockEyebrow}>Block 1</div>
                <h2 style={styles.blockTitle}>Registration Workflow</h2>
                <div style={styles.blockText}>
                  Search patients, register new files, assign to physiotherapists, and monitor assignment activity.
                </div>
              </div>

              <div style={styles.actionGrid}>
                <button style={styles.actionButton} onClick={() => setActiveSection("registration_workflow")}>
                  Search Patient
                </button>
                <button style={styles.actionButton} onClick={() => setActiveSection("register")}>
                  Register New Patient
                </button>
                <button style={styles.actionButton} onClick={() => setActiveSection("assign")}>
                  Assign to Physio
                </button>
                <button style={styles.actionButtonSoft} onClick={() => setActiveSection("today_assignments")}>
                  Today's Assignments
                </button>
                <button style={styles.actionButtonSoft} onClick={() => setActiveSection("history")}>
                  Monthly Tracker
                </button>
              </div>
            </div>

            <div style={styles.blockCard}>
              <div style={styles.blockHeader}>
                <div style={styles.blockEyebrow}>Block 2</div>
                <h2 style={styles.blockTitle}>Booking Workflow</h2>
                <div style={styles.blockText}>
                  Search patients for appointments, book slots, and review daily and monthly booking activity.
                </div>
              </div>

              <div style={styles.actionGrid}>
                <button style={styles.actionButton} onClick={() => setActiveSection("booking_workflow")}>
                  Search for Booking
                </button>
                <button style={styles.actionButton} onClick={() => setActiveSection("booking")}>
                  Book Appointment
                </button>
                <button style={styles.actionButtonSoft} onClick={() => setActiveSection("today_bookings")}>
                  Today's Bookings
                </button>
                <button style={styles.actionButtonSoft} onClick={() => setActiveSection("monthly_bookings")}>
                  Monthly Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === "registration_workflow" && (
        <UnifiedPatientSearch
          title="Search Patient for Assignment"
          placeholder="Start typing patient name or ID"
          actionLabel="Assign to Physio"
          onSelectPatient={handleSelectPatientForAssign}
          emptyText="Start typing to search patients."
          noResultsText="No patients found. Register a new patient if needed."
        />
      )}

      {activeSection === "booking_workflow" && (
        <UnifiedPatientSearch
          title="Search Patient for Booking"
          placeholder="Start typing patient name or ID"
          actionLabel="Book Appointment"
          onSelectPatient={handleSelectPatientForBooking}
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

      {activeSection === "booking" && (
        <BookingSection
          selectedPatient={bookingSelectedPatient}
          bookingForm={bookingForm}
          setBookingForm={setBookingForm}
          therapists={bookingTherapists}
          weekDates={weekDates}
          slots={slots}
          onSelectTherapist={handleSelectTherapist}
          onSelectDate={handleSelectDate}
          onSelectSlot={handleSelectSlot}
          onConfirmBooking={handleConfirmBooking}
        />
      )}

      {activeSection === "today_assignments" && (
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

      {activeSection === "today_bookings" && (
        <TodayBookingsSection
          bookings={todayBookings}
          onEditBooking={(booking) => {
            handleEditBooking(booking);
            setActiveSection("booking");
          }}
          onDeleteBooking={handleDeleteBooking}
        />
      )}

      {activeSection === "monthly_bookings" && (
        <MonthlyBookingsSection
          bookings={monthlyBookings}
          agents={monthlyAgents}
          therapists={bookingTherapists}
          monthlyFilter={monthlyFilter}
          setMonthlyFilter={setMonthlyFilter}
          onApplyFilters={handleApplyMonthlyFilters}
        />
      )}

      {activeSection === "history" && (
        <AssignmentHistory
          title="Reception Assignment Tracker Monthly"
          currentUser={user}
          actingAs={actingAs}
          onEditAssignment={handleEditAssignment}
          onCancelAssignment={handleCancelAssignment}
        />
      )}
    </DashboardLayout>
  );
}

const styles = {
  homeGrid: {
    display: "grid",
    gap: "18px",
  },
  welcomeCard: {
    background: "linear-gradient(135deg, #dbeafe 0%, #ffffff 100%)",
    border: "1px solid #bfdbfe",
    borderRadius: "20px",
    padding: "28px",
    display: "grid",
    gap: "10px",
  },
  welcomeEyebrow: {
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#1d4ed8",
  },
  welcomeTitle: {
    margin: 0,
    fontSize: "34px",
    fontWeight: "900",
    color: "#0f172a",
  },
  welcomeText: {
    fontSize: "15px",
    color: "#475569",
    fontWeight: "600",
  },
  workflowGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "18px",
  },
  blockCard: {
    background: "#fff",
    borderRadius: "20px",
    padding: "24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
    display: "grid",
    gap: "18px",
  },
  blockHeader: {
    display: "grid",
    gap: "8px",
  },
  blockEyebrow: {
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#1e3a8a",
  },
  blockTitle: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
  },
  blockText: {
    fontSize: "14px",
    color: "#64748b",
  },
  actionGrid: {
    display: "grid",
    gap: "10px",
  },
  actionButton: {
    background: "#1e3a8a",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "12px 16px",
    fontWeight: "800",
    cursor: "pointer",
    textAlign: "left",
  },
  actionButtonSoft: {
    background: "#eff6ff",
    color: "#1e3a8a",
    border: "1px solid #bfdbfe",
    borderRadius: "12px",
    padding: "12px 16px",
    fontWeight: "800",
    cursor: "pointer",
    textAlign: "left",
  },
};
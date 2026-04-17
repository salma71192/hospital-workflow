import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

import DashboardLayout from "../components/DashboardLayout";
import DashboardNotice from "../components/common/DashboardNotice";
import StatisticsSection from "../components/booking/StatisticsSection";
import TodayAppointmentsSection from "../components/booking/TodayAppointmentsSection";
import PatientTrackerTable from "../components/patients/PatientTrackerTable";
import PhysioTodayRegistrationsSection from "../components/physio/PhysioTodayRegistrationsSection";

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

  useEffect(() => {
    loadTodayAppointments();
    loadTodayStatistics();
    loadPatientTracker();
    loadTodayAssignments();
  }, []);

  const handleBackToAdmin = () => {
    onStopImpersonation?.();
    navigate("/admin");
  };

  const loadTodayAppointments = async () => {
    try {
      setError("");
      const res = await api.get("callcenter/bookings/today-appointments/");
      setTodayAppointments(res.data.bookings || []);
    } catch (err) {
      console.error("Failed to load today appointments", err);
      setTodayAppointments([]);
      setError("Failed to load today's appointments");
    }
  };

  const loadTodayStatistics = async () => {
    try {
      setError("");
      const res = await api.get("callcenter/bookings/today-statistics/");
      setTodayStats({
        rows: res.data.rows || [],
        totals: res.data.totals || null,
        date: res.data.date || "",
      });
    } catch (err) {
      console.error("Failed to load today statistics", err);
      setTodayStats(null);
      setError("Failed to load today's statistics");
    }
  };

  const loadPatientTracker = async () => {
    try {
      setError("");
      const res = await api.get("patients/tracker/");
      setPatientTrackerRows(res.data.patients || []);
    } catch (err) {
      console.error("Failed to load patient tracker", err);
      setPatientTrackerRows([]);
      setError("Failed to load patient tracker");
    }
  };

  const loadTodayAssignments = async () => {
    try {
      setError("");
      const today = new Date().toLocaleDateString("en-CA");
      const res = await api.get(
        `reception/assignments/?start_date=${today}&end_date=${today}`
      );
      setTodayAssignments(res.data.assignments || []);
    } catch (err) {
      console.error("Failed to load today assignments", err);
      setTodayAssignments([]);
      setError("Failed to load today's assignments");
    }
  };

  const physioTodayAppointments = useMemo(() => {
    return (todayAppointments || []).filter(
      (item) => String(item.therapist_id) === String(user?.id)
    );
  }, [todayAppointments, user]);

  const physioPatientTrackerRows = useMemo(() => {
    return (patientTrackerRows || []).filter(
      (item) => String(item.therapist_id) === String(user?.id)
    );
  }, [patientTrackerRows, user]);

  const physioAssignments = useMemo(() => {
    return (todayAssignments || []).filter(
      (item) => String(item.therapist_id) === String(user?.id)
    );
  }, [todayAssignments, user]);

  const walkInAssignments = useMemo(() => {
    return physioAssignments.filter((item) => item.category === "walk_in");
  }, [physioAssignments]);

  const initialEvalAssignments = useMemo(() => {
    return physioAssignments.filter(
      (item) =>
        item.category === "initial_evaluation" ||
        item.category === "initial_eval"
    );
  }, [physioAssignments]);

  const taskWithoutEligibilityAssignments = useMemo(() => {
    return physioAssignments.filter(
      (item) =>
        item.category === "task_without_eligibility" ||
        item.category === "no_eligibility"
    );
  }, [physioAssignments]);

  const statisticsCount = todayStats?.rows?.length || 0;

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
            initialEvalAssignments={initialEvalAssignments}
            taskWithoutEligibilityAssignments={taskWithoutEligibilityAssignments}
            appointmentCount={physioTodayAppointments.length}
          />
        </div>
      )}

      {activeSection === "tracker" && (
        <PatientTrackerTable
          patients={physioPatientTrackerRows}
          title="Patient Tracker"
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
};
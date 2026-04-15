import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

import DashboardLayout from "../components/DashboardLayout";
import DashboardNotice from "../components/common/DashboardNotice";
import StatisticsSection from "../components/booking/StatisticsSection";
import TodayAppointmentsSection from "../components/booking/TodayAppointmentsSection";
import PatientTrackerTable from "../components/patients/PatientTrackerTable";

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
      setTodayStats(res.data.stats || null);
    } catch (err) {
      console.error("Failed to load today appointments", err);
      setTodayAppointments([]);
      setTodayStats(null);
      setError("Failed to load today's appointments");
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

  return (
    <DashboardLayout
      title="Patient Workflow"
      subtitle={`Welcome, ${
        actingAs?.username || user?.username || "Physio User"
      }`}
      accent="#059669"
      sidebarTitle="Patient Workflow"
      sidebarItems={[
        {
          key: "home",
          label: "Home",
        },
        {
          key: "statistics",
          label: `Statistics (${physioTodayAppointments.length})`,
        },
        {
          key: "tracker",
          label: "Patient Tracker",
        },
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
          <StatisticsSection
            stats={todayStats}
            walkInCount={walkInAssignments.length}
            initialEvalCount={initialEvalAssignments.length}
            taskWithoutEligibilityCount={taskWithoutEligibilityAssignments.length}
          />

          <TodayAppointmentsSection
            bookings={physioTodayAppointments}
            title="Today's Appointments"
          />

          <AssignmentListSection
            title="Walk In"
            assignments={walkInAssignments}
          />

          <AssignmentListSection
            title="Initial Eval"
            assignments={initialEvalAssignments}
          />

          <AssignmentListSection
            title="Task Without Eligibility"
            assignments={taskWithoutEligibilityAssignments}
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

function AssignmentListSection({ title, assignments = [] }) {
  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>{title}</h2>

      {assignments.length === 0 ? (
        <div style={styles.emptyState}>No records found for today.</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Patient</th>
                <th style={styles.th}>File Number</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Assigned Date</th>
                <th style={styles.th}>Created By</th>
                <th style={styles.th}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((item) => (
                <tr key={item.id}>
                  <td style={styles.tdBold}>{item.patient_name}</td>
                  <td style={styles.td}>{item.patient_file_id}</td>
                  <td style={styles.td}>
                    {item.category_label || item.category || "-"}
                  </td>
                  <td style={styles.td}>{item.assignment_date || "-"}</td>
                  <td style={styles.td}>{item.created_by_name || "-"}</td>
                  <td style={styles.td}>{item.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  stack: {
    display: "grid",
    gap: "16px",
  },
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e8eef7",
  },
  cardTitle: {
    margin: "0 0 18px 0",
    fontSize: "22px",
    color: "#0f172a",
    fontWeight: "800",
  },
  tableWrap: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "900px",
    background: "#fff",
  },
  th: {
    textAlign: "left",
    padding: "14px 16px",
    background: "#f8fafc",
    color: "#334155",
    fontSize: "14px",
    fontWeight: "800",
    borderBottom: "1px solid #e2e8f0",
  },
  td: {
    padding: "14px 16px",
    color: "#475569",
    fontSize: "14px",
    borderBottom: "1px solid #eef2f7",
  },
  tdBold: {
    padding: "14px 16px",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: "700",
    borderBottom: "1px solid #eef2f7",
  },
  emptyState: {
    padding: "18px",
    borderRadius: "12px",
    background: "#f8fafc",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
  },
};
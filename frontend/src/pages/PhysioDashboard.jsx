import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import AssignmentHistory from "../components/AssignmentHistory";
import AssignmentProgressCard from "../components/AssignmentProgressCard";
import DashboardLayout from "../components/DashboardLayout";
import PatientTrackerTable from "../components/patients/PatientTrackerTable";
import PatientSearchBar from "../components/patients/PatientSearchBar";
import DashboardNotice from "../components/common/DashboardNotice";
import DashboardMetricInput from "../components/common/DashboardMetricInput";
import DashboardStatsGrid from "../components/common/DashboardStatsGrid";
import TodayAssignmentsList from "../components/assignments/TodayAssignmentsList";

export default function PhysioDashboard({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];
  const defaultMonth = new Date().toISOString().slice(0, 7);

  const [activeSection, setActiveSection] = useState("today");
  const [assignments, setAssignments] = useState([]);
  const [dailyTarget, setDailyTarget] = useState(8);

  const [patientSearch, setPatientSearch] = useState("");
  const [trackerMonth, setTrackerMonth] = useState(defaultMonth);
  const [patients, setPatients] = useState([]);
  const [patientError, setPatientError] = useState("");

  const handleBackToAdmin = () => {
    onStopImpersonation();
    navigate("/admin");
  };

  const loadAssignments = async () => {
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
      setAssignments(res.data.assignments || []);
    } catch (err) {
      console.error("Failed to load assignments", err);
    }
  };

  const loadTracker = async (monthValue = trackerMonth, searchValue = patientSearch) => {
    try {
      setPatientError("");

      const params = new URLSearchParams({
        month: monthValue,
      });

      if (searchValue) {
        params.append("search", searchValue);
      }

      if (actingAs && (user?.is_superuser || user?.role === "admin")) {
        params.append("viewed_user_id", String(actingAs.id));
        params.append("viewed_user_role", String(actingAs.role || ""));
      }

      const res = await api.get(`reception/physio-tracker/?${params.toString()}`);
      setPatients(res.data.patients || []);
    } catch (err) {
      setPatientError("Failed to load monthly tracker");
      setPatients([]);
    }
  };

  useEffect(() => {
    loadAssignments();
    loadTracker(defaultMonth, "");
  }, [today, actingAs, user]);

  return (
    <DashboardLayout
      title="Physio Dashboard"
      subtitle={`Welcome, ${actingAs?.username || user?.username || "Physio User"}`}
      accent="#166534"
      sidebarTitle="Physio Panel"
      sidebarItems={[
        { key: "today", label: "Today's Assignments" },
        { key: "history", label: "History" },
        { key: "tracker", label: "Monthly Tracker" },
      ]}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      onLogout={onLogout}
      actingAs={actingAs}
      actingAsName={actingAs?.username}
      onBackToAdmin={handleBackToAdmin}
    >
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
                value: assignments.length,
              },
              {
                label: "Daily Target",
                value: dailyTarget,
              },
              {
                label: "Remaining",
                value: Math.max(Number(dailyTarget) - assignments.length, 0),
              },
            ]}
          />

          <AssignmentProgressCard
            title="Today's Assignments"
            count={assignments.length}
            target={dailyTarget}
            subtitle={today}
          />

          <TodayAssignmentsList
            assignments={assignments}
            title="Today's Assigned Patients"
          />
        </>
      )}

      {activeSection === "history" && (
        <AssignmentHistory
          title="Physio Assignment History"
          currentUser={user}
          actingAs={actingAs}
        />
      )}

      {activeSection === "tracker" && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Monthly Follow-up Tracker</h2>

          <div style={styles.filtersRow}>
            <div style={styles.monthField}>
              <label style={styles.label}>Month</label>
              <input
                type="month"
                value={trackerMonth}
                onChange={(e) => {
                  setTrackerMonth(e.target.value);
                  loadTracker(e.target.value, patientSearch);
                }}
                style={styles.input}
              />
            </div>

            <div style={styles.searchWrap}>
              <PatientSearchBar
                value={patientSearch}
                onChange={setPatientSearch}
                onSubmit={(e) => {
                  e.preventDefault();
                  loadTracker(trackerMonth, patientSearch);
                }}
                onClear={() => {
                  setPatientSearch("");
                  loadTracker(trackerMonth, "");
                }}
              />
            </div>
          </div>

          {patientError ? (
            <DashboardNotice type="error">{patientError}</DashboardNotice>
          ) : (
            <PatientTrackerTable
              patients={patients}
              title="Therapist Monthly Tracker"
              monthLabel={trackerMonth}
            />
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
    border: "1px solid #d9f1e5",
    display: "grid",
    gap: "18px",
  },
  cardTitle: {
    margin: "0",
    fontSize: "22px",
    color: "#0f172a",
    fontWeight: "800",
  },
  filtersRow: {
    display: "grid",
    gap: "16px",
  },
  monthField: {
    maxWidth: "220px",
    display: "grid",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  input: {
    padding: "13px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box",
  },
  searchWrap: {
    minWidth: 0,
  },
};
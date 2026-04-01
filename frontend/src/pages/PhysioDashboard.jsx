import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import AssignmentHistory from "../components/AssignmentHistory";
import AssignmentProgressCard from "../components/AssignmentProgressCard";
import DashboardLayout from "../components/DashboardLayout";
import PatientTrackerTable from "../components/patients/PatientTrackerTable";
import PatientSearchBar from "../components/patients/PatientSearchBar";

export default function PhysioDashboard({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const [activeSection, setActiveSection] = useState("today");
  const [assignments, setAssignments] = useState([]);
  const [dailyTarget, setDailyTarget] = useState(8);

  const [patientSearch, setPatientSearch] = useState("");
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

  const loadPatients = async (searchValue = "") => {
    try {
      setPatientError("");
      const url = searchValue
        ? `patients/?search=${encodeURIComponent(searchValue)}`
        : "patients/";
      const res = await api.get(url);
      setPatients(res.data.patients || []);
    } catch (err) {
      setPatientError("Failed to load patients");
      setPatients([]);
    }
  };

  useEffect(() => {
    loadAssignments();
    loadPatients();
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
        { key: "tracker", label: "Patient Tracker" },
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
          <div style={styles.targetRow}>
            <input
              type="number"
              min="1"
              value={dailyTarget}
              onChange={(e) => setDailyTarget(e.target.value)}
              style={styles.targetInput}
              placeholder="Daily target"
            />
          </div>

          <AssignmentProgressCard
            title="Today's Assignments"
            count={assignments.length}
            target={dailyTarget}
            subtitle={today}
          />

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Today's Assigned Patients</h2>

            {assignments.length ? (
              <div style={styles.assignmentList}>
                {assignments.map((item) => (
                  <div key={item.id} style={styles.assignmentCard}>
                    <div style={styles.assignmentPatient}>{item.patient_name}</div>
                    <div style={styles.assignmentMeta}>
                      Patient ID: {item.patient_file_id}
                    </div>
                    <div style={styles.assignmentMeta}>
                      Date: {item.assignment_date}
                    </div>
                    {item.notes ? (
                      <div style={styles.assignmentMeta}>Notes: {item.notes}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.emptyState}>No assigned patients for today.</div>
            )}
          </div>
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
          <h2 style={styles.cardTitle}>Patient Tracker</h2>

          <PatientSearchBar
            value={patientSearch}
            onChange={setPatientSearch}
            onSubmit={(e) => {
              e.preventDefault();
              loadPatients(patientSearch);
            }}
            onClear={() => {
              setPatientSearch("");
              loadPatients("");
            }}
          />

          {patientError ? (
            <div style={styles.errorBox}>{patientError}</div>
          ) : (
            <PatientTrackerTable patients={patients} title="Patient Tracker" />
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

const styles = {
  targetRow: {
    maxWidth: "240px",
  },
  targetInput: {
    padding: "13px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box",
  },
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
    border: "1px solid #d9f1e5",
  },
  cardTitle: {
    margin: "0 0 18px 0",
    fontSize: "22px",
    color: "#0f172a",
    fontWeight: "800",
  },
  errorBox: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    padding: "14px 16px",
    marginBottom: "16px",
    fontWeight: "700",
  },
  assignmentList: {
    display: "grid",
    gap: "12px",
  },
  assignmentCard: {
    padding: "14px",
    border: "1px solid #dcfce7",
    background: "#f0fdf4",
    borderRadius: "12px",
  },
  assignmentPatient: {
    fontWeight: "700",
    color: "#14532d",
    marginBottom: "6px",
    fontSize: "17px",
  },
  assignmentMeta: {
    color: "#166534",
    fontSize: "14px",
    marginBottom: "4px",
  },
  emptyState: {
    padding: "18px",
    borderRadius: "12px",
    background: "#f8fafc",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
  },
};
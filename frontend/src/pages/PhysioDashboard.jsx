import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import AssignmentHistory from "../components/AssignmentHistory";
import DashboardLayout from "../components/DashboardLayout";
import PhysioTodaySection from "../components/physio/PhysioTodaySection";
import PhysioTrackerSection from "../components/physio/PhysioTrackerSection";

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
        <PhysioTodaySection
          today={today}
          assignments={assignments}
          dailyTarget={dailyTarget}
          setDailyTarget={setDailyTarget}
        />
      )}

      {activeSection === "history" && (
        <AssignmentHistory
          title="Physio Assignment History"
          currentUser={user}
          actingAs={actingAs}
        />
      )}

      {activeSection === "tracker" && (
        <PhysioTrackerSection
          trackerMonth={trackerMonth}
          setTrackerMonth={setTrackerMonth}
          patientSearch={patientSearch}
          setPatientSearch={setPatientSearch}
          loadTracker={loadTracker}
          patients={patients}
          patientError={patientError}
        />
      )}
    </DashboardLayout>
  );
}
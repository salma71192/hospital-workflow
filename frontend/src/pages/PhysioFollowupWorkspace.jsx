
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import DashboardLayout from "../components/DashboardLayout";
import DashboardNotice from "../components/common/DashboardNotice";
import StatisticsSection from "../components/booking/StatisticsSection";
import TodayAppointmentsSection from "../components/booking/TodayAppointmentsSection";
import PatientTrackerTable from "../components/patients/PatientTrackerTable";
import PhysioTodayRegistrationsSection from "../components/physio/PhysioTodayRegistrationsSection";

// Use local date to avoid UTC date shifts.
function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getArray(data, key) {
  return Array.isArray(data?.[key]) ? data[key] : [];
}

function getTherapistId(item) {
  return (
    item?.therapist_id ??
    item?.therapist?.id ??
    item?.assigned_therapist_id ??
    item?.physio_id ??
    item?.physiotherapist_id ??
    null
  );
}

function belongsToTherapist(item, therapistId) {
  if (therapistId === null || therapistId === undefined) {
    return false;
  }

  const itemTherapistId = getTherapistId(item);

  return (
    itemTherapistId !== null &&
    itemTherapistId !== undefined &&
    String(itemTherapistId) === String(therapistId)
  );
}

function getCategory(item) {
  return String(item?.category ?? item?.category_label ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

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

  const today = getLocalDateString();

  // When an administrator views a physio account, use that account's ID.
  const selectedTherapistId = actingAs?.id ?? user?.id ?? null;

  // ---------------- Load today's bookings ----------------
  const loadTodayAppointments = useCallback(async () => {
    try {
      const res = await api.get("callcenter/bookings/today-appointments/");
      setTodayAppointments(getArray(res.data, "bookings"));
    } catch (err) {
      console.error("Failed to load today's appointments:", err);
      setTodayAppointments([]);
      setError("Failed to load today's appointments.");
    }
  }, []);

  // ---------------- Load statistics ----------------
  const loadTodayStatistics = useCallback(async () => {
    try {
      const res = await api.get("callcenter/bookings/today-statistics/");

      setTodayStats({
        rows: getArray(res.data, "rows"),
        totals: res.data?.totals ?? null,
        date: res.data?.date ?? "",
      });
    } catch (err) {
      console.error("Failed to load today's statistics:", err);
      setTodayStats(null);
      setError("Failed to load today's statistics.");
    }
  }, []);

  // ---------------- Load patient tracker ----------------
  const loadPatientTracker = useCallback(async () => {
    try {
      const res = await api.get("patients/tracker/");
      setPatientTrackerRows(getArray(res.data, "patients"));
    } catch (err) {
      console.error("Failed to load patient tracker:", err);
      setPatientTrackerRows([]);
      setError("Failed to load patient tracker.");
    }
  }, []);

  // ---------------- Load today's registrations ----------------
  const loadTodayAssignments = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        start_date: today,
        end_date: today,
      });

      const res = await api.get(
        `reception/assignments/?${params.toString()}`
      );

      const assignments = getArray(res.data, "assignments");

      console.info("[Physio Workspace] Registration API response", {
        date: today,
        selectedTherapistId,
        responseCount: assignments.length,
        registrations: assignments.map((item) => ({
          id: item.id,
          patient: item.patient_name,
          therapist_id: getTherapistId(item),
          assignment_date: item.assignment_date,
          category: item.category,
          category_label: item.category_label,
        })),
      });

      setTodayAssignments(assignments);
    } catch (err) {
      console.error("Failed to load today's registrations:", err);
      console.error("Registration API error response:", err?.response?.data);

      setTodayAssignments([]);
      setError("Failed to load today's registrations.");
    }
  }, [today, selectedTherapistId]);

  // ---------------- Initial load ----------------
  useEffect(() => {
    loadTodayAppointments();
    loadTodayStatistics();
    loadPatientTracker();
    loadTodayAssignments();
  }, [
    loadTodayAppointments,
    loadTodayStatistics,
    loadPatientTracker,
    loadTodayAssignments,
  ]);

  const handleBackToAdmin = useCallback(() => {
    onStopImpersonation?.();
    navigate("/admin");
  }, [onStopImpersonation, navigate]);

  // ---------------- Filter bookings ----------------
  const physioTodayAppointments = useMemo(
    () =>
      todayAppointments.filter((item) =>
        belongsToTherapist(item, selectedTherapistId)
      ),
    [todayAppointments, selectedTherapistId]
  );

  // ---------------- Filter patient tracker ----------------
  const physioPatientTrackerRows = useMemo(
    () =>
      patientTrackerRows.filter((item) =>
        belongsToTherapist(item, selectedTherapistId)
      ),
    [patientTrackerRows, selectedTherapistId]
  );

  // ---------------- Filter registrations ----------------
  const physioAssignments = useMemo(
    () =>
      todayAssignments.filter((item) =>
        belongsToTherapist(item, selectedTherapistId)
      ),
    [todayAssignments, selectedTherapistId]
  );

  const walkInAssignments = useMemo(
    () =>
      physioAssignments.filter((item) =>
        ["walk_in", "walkin"].includes(getCategory(item))
      ),
    [physioAssignments]
  );

  // Regular treatment registrations do not require a linked booking.
  const appointmentAssignments = useMemo(
    () =>
      physioAssignments.filter((item) =>
        ["appointment", "regular_session", "treatment_session"].includes(
          getCategory(item)
        )
      ),
    [physioAssignments]
  );

  const initialEvalAssignments = useMemo(
    () =>
      physioAssignments.filter((item) =>
        ["initial_evaluation", "initial_eval", "evaluation"].includes(
          getCategory(item)
        )
      ),
    [physioAssignments]
  );

  const taskWithoutEligibilityAssignments = useMemo(
    () =>
      physioAssignments.filter((item) =>
        [
          "task_without_eligibility",
          "no_eligibility",
          "without_eligibility",
        ].includes(getCategory(item))
      ),
    [physioAssignments]
  );

  const statisticsCount = todayStats?.rows?.length ?? 0;

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
            appointmentAssignments={appointmentAssignments}
            initialEvalAssignments={initialEvalAssignments}
            taskWithoutEligibilityAssignments={
              taskWithoutEligibilityAssignments
            }
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

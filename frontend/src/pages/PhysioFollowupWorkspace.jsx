import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

import DashboardLayout from "../components/DashboardLayout";
import DashboardNotice from "../components/common/DashboardNotice";
import TodayBookingsSection from "../components/booking/TodayBookingsSection";
import TodayAppointmentsSection from "../components/booking/TodayAppointmentsSection";
import PatientTrackerTable from "../components/patients/PatientTrackerTable";

export default function PhysioFollowupWorkspace({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("today_bookings");
  const [todayBookingTarget, setTodayBookingTarget] = useState(10);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [todayBookings, setTodayBookings] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [patientTrackerRows, setPatientTrackerRows] = useState([]);

  useEffect(() => {
    loadTodayBookings();
    loadTodayAppointments();
    loadPatientTracker();
  }, []);

  const handleBackToAdmin = () => {
    onStopImpersonation?.();
    navigate("/admin");
  };

  const loadTodayBookings = async () => {
    try {
      setError("");
      const res = await api.get("callcenter/bookings/today/");
      setTodayBookings(res.data.bookings || []);
    } catch (err) {
      console.error("Failed to load today bookings", err);
      setTodayBookings([]);
      setError("Failed to load today's bookings");
    }
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

  const physioTodayBookings = useMemo(() => {
    return (todayBookings || []).filter(
      (item) => String(item.created_by_id) === String(user?.id)
    );
  }, [todayBookings, user]);

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
          key: "today_bookings",
          label: `Today's Bookings (${physioTodayBookings.length})`,
        },
        {
          key: "today_appointments",
          label: `Today's Appointments (${physioTodayAppointments.length})`,
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

      {activeSection === "today_bookings" && (
        <TodayBookingsSection
          bookings={physioTodayBookings}
          defaultOpen={true}
          target={todayBookingTarget}
          onChangeTarget={setTodayBookingTarget}
        />
      )}

      {activeSection === "today_appointments" && (
        <TodayAppointmentsSection
          bookings={physioTodayAppointments}
          title="Today's Appointments"
        />
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
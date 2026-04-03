import { useEffect, useState } from "react";
import api from "../../api/api";

export default function usePhysioDashboard(user, actingAs) {
  const today = new Date().toISOString().split("T")[0];
  const defaultMonth = new Date().toISOString().slice(0, 7);

  const [assignments, setAssignments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [patients, setPatients] = useState([]);
  const [patientError, setPatientError] = useState("");

  const [trackerMonth, setTrackerMonth] = useState(defaultMonth);
  const [patientSearch, setPatientSearch] = useState("");

  // ================= LOAD ASSIGNMENTS =================
  const loadAssignments = async () => {
    try {
      const params = new URLSearchParams({
        start_date: today,
        end_date: today,
      });

      if (actingAs && (user?.is_superuser || user?.role === "admin")) {
        params.append("viewed_user_id", actingAs.id);
        params.append("viewed_user_role", actingAs.role || "");
      }

      const res = await api.get(`reception/assignments/?${params}`);
      setAssignments(res.data.assignments || []);
    } catch (err) {
      console.error(err);
    }
  };

  // ================= LOAD ALERTS =================
  const loadAlerts = async () => {
    try {
      const params = new URLSearchParams();

      if (actingAs && (user?.is_superuser || user?.role === "admin")) {
        params.append("viewed_user_id", actingAs.id);
      }

      const res = await api.get(`approvals/physio-alerts/?${params}`);
      setAlerts(res.data.alerts || []);
    } catch (err) {
      console.error(err);
      setAlerts([]);
    }
  };

  // ================= LOAD TRACKER =================
  const loadTracker = async () => {
    try {
      setPatientError("");

      const params = new URLSearchParams({
        month: trackerMonth,
      });

      if (patientSearch) params.append("search", patientSearch);

      const res = await api.get(`reception/physio-tracker/?${params}`);
      setPatients(res.data.patients || []);
    } catch {
      setPatientError("Failed to load tracker");
    }
  };

  // ================= INIT =================
  useEffect(() => {
    loadAssignments();
    loadAlerts();
    loadTracker();
  }, [actingAs]);

  return {
    today,
    assignments,
    alerts,
    patients,
    patientError,
    trackerMonth,
    setTrackerMonth,
    patientSearch,
    setPatientSearch,
    loadTracker,
  };
}
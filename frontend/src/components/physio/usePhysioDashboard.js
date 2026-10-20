
import { useCallback, useEffect, useState } from "react";
import api from "../../api/api";

export default function usePhysioDashboard(user, actingAs) {
  const today = new Date().toLocaleDateString("en-CA");
  const defaultMonth = today.slice(0, 7);

  const [assignments, setAssignments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [patients, setPatients] = useState([]);
  const [patientError, setPatientError] = useState("");
  const [trackerLoading, setTrackerLoading] = useState(false);

  const [trackerMonth, setTrackerMonth] = useState(defaultMonth);
  const [patientSearch, setPatientSearch] = useState("");

  // ================= VIEWED USER PARAMETERS =================
  const getViewedUserParams = useCallback(() => {
    const params = new URLSearchParams();

    if (
      actingAs &&
      (user?.is_superuser || user?.role === "admin")
    ) {
      params.append("viewed_user_id", actingAs.id);

      if (actingAs.role) {
        params.append("viewed_user_role", actingAs.role);
      }
    }

    return params;
  }, [actingAs, user?.is_superuser, user?.role]);

  // ================= LOAD ASSIGNMENTS =================
  const loadAssignments = useCallback(async () => {
    try {
      const params = getViewedUserParams();

      params.set("start_date", today);
      params.set("end_date", today);

      const query = params.toString();
      const url = query
        ? `reception/assignments/?${query}`
        : "reception/assignments/";

      const res = await api.get(url);

      setAssignments(
        Array.isArray(res.data?.assignments)
          ? res.data.assignments
          : []
      );
    } catch (err) {
      console.error("Failed to load assignments:", err);
      setAssignments([]);
    }
  }, [getViewedUserParams, today]);

  // ================= LOAD ALERTS =================
  const loadAlerts = useCallback(async () => {
    try {
      const params = getViewedUserParams();
      const query = params.toString();

      const url = query
        ? `approvals/physio-alerts/?${query}`
        : "approvals/physio-alerts/";

      const res = await api.get(url);

      setAlerts(
        Array.isArray(res.data?.alerts)
          ? res.data.alerts
          : []
      );
    } catch (err) {
      console.error("Failed to load physio alerts:", err);
      setAlerts([]);
    }
  }, [getViewedUserParams]);

  // ================= LOAD MONTHLY TRACKER =================
  const loadTracker = useCallback(
    async (
      month = trackerMonth,
      search = patientSearch
    ) => {
      setTrackerLoading(true);
      setPatientError("");

      try {
        const params = getViewedUserParams();

        if (month) {
          params.set("month", month);
        }

        const searchValue = String(search ?? "").trim();

        if (searchValue) {
          params.set("search", searchValue);
        } else {
          params.delete("search");
        }

        const query = params.toString();
        const url = query
          ? `reception/physio-tracker/?${query}`
          : "reception/physio-tracker/";

        const res = await api.get(url);
        const data = res.data;

        // Support the expected response and common paginated/API formats.
        let trackerRecords = [];

        if (Array.isArray(data)) {
          trackerRecords = data;
        } else if (Array.isArray(data?.patients)) {
          trackerRecords = data.patients;
        } else if (Array.isArray(data?.assignments)) {
          trackerRecords = data.assignments;
        } else if (Array.isArray(data?.results)) {
          trackerRecords = data.results;
        } else if (Array.isArray(data?.registrations)) {
          trackerRecords = data.registrations;
        } else {
          console.error(
            "Unexpected physio tracker response format:",
            data
          );

          throw new Error(
            "The tracker API did not return a recognized records list."
          );
        }

        setPatients(trackerRecords);
      } catch (err) {
        console.error("Failed to load physio tracker:", err);

        setPatients([]);

        const status = err?.response?.status;
        const serverMessage =
          err?.response?.data?.detail ||
          err?.response?.data?.error ||
          err?.response?.data?.message;

        if (status === 404) {
          setPatientError(
            "The physio tracker endpoint was not found. Check the backend route for reception/physio-tracker/."
          );
        } else if (status === 401 || status === 403) {
          setPatientError(
            "You do not have permission to load the patient tracker. Please check your login and access role."
          );
        } else {
          setPatientError(
            serverMessage ||
              err?.message ||
              "Failed to load the patient tracker. Check the backend endpoint and try again."
          );
        }
      } finally {
        setTrackerLoading(false);
      }
    },
    [getViewedUserParams, trackerMonth, patientSearch]
  );

  // ================= INITIAL LOAD / USER CONTEXT CHANGE =================
  useEffect(() => {
    loadAssignments();
    loadAlerts();
    loadTracker(trackerMonth, patientSearch);
  }, [
    loadAssignments,
    loadAlerts,
    loadTracker,
    trackerMonth,
    patientSearch,
  ]);

  return {
    today,
    assignments,
    alerts,
    patients,
    patientError,
    trackerLoading,
    trackerMonth,
    setTrackerMonth,
    patientSearch,
    setPatientSearch,
    loadAssignments,
    loadAlerts,
    loadTracker,
  };
}
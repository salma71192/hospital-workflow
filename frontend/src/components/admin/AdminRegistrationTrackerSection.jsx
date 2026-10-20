
import React, { useCallback, useEffect, useState } from "react";
import api from "../../api/api";
import RegistrationTrackerSection from "../assignments/RegistrationTrackerSection";

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayString() {
  return formatLocalDate(new Date());
}

function getFirstDayOfMonthString() {
  const now = new Date();

  return formatLocalDate(
    new Date(now.getFullYear(), now.getMonth(), 1)
  );
}

function getLastDayOfMonthString() {
  const now = new Date();

  return formatLocalDate(
    new Date(now.getFullYear(), now.getMonth() + 1, 0)
  );
}

export default function AdminRegistrationTrackerSection({
  user,
  currentUser,
  currentUserId,
  onEditAssignment,
  onEditRegistration,
  onCancelAssignment,
  onDeleteAssignment,
}) {
  const activeUser = currentUser || user;
  const adminUserId = currentUserId ?? activeUser?.id;

  const editHandler = onEditAssignment || onEditRegistration;
  const deleteHandler = onCancelAssignment || onDeleteAssignment;

  const [trackerMode, setTrackerMode] = useState("today");

  const [trackerFilter, setTrackerFilter] = useState({
    date: getTodayString(),
    from_date: getFirstDayOfMonthString(),
    to_date: getLastDayOfMonthString(),
    user_id: "all",
    patient: "",
    therapist_id: "all",
  });

  const [assignments, setAssignments] = useState([]);
  const [agents, setAgents] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const loadTherapists = useCallback(async () => {
    try {
      const res = await api.get("reception/therapists/");

      setTherapists(
        Array.isArray(res.data?.therapists)
          ? res.data.therapists
          : []
      );
    } catch (err) {
      console.error("Failed to load therapists", err);
      setTherapists([]);
    }
  }, []);

  const loadAssignments = useCallback(
    async ({
      start_date = "",
      end_date = "",
      user_id = "all",
      patient = "",
      therapist_id = "all",
    } = {}) => {
      setLoading(true);

      try {
        const params = new URLSearchParams();

        if (start_date) {
          params.append("start_date", start_date);
        }

        if (end_date) {
          params.append("end_date", end_date);
        }

        if (user_id && user_id !== "all") {
          params.append("user_id", user_id);
        }

        if (patient?.trim()) {
          params.append("patient", patient.trim());
        }

        if (therapist_id && therapist_id !== "all") {
          params.append("therapist_id", therapist_id);
        }

        const query = params.toString();
        const url = query
          ? `reception/assignments/?${query}`
          : "reception/assignments/";

        const res = await api.get(url);
        const data = res.data || {};

        setAssignments(
          Array.isArray(data.assignments)
            ? data.assignments
            : []
        );

        setAgents(
          Array.isArray(data.agents)
            ? data.agents
            : []
        );

        setLoadError("");
      } catch (err) {
        console.error(
          "Failed to load assignments",
          err?.response?.data || err
        );

        setAssignments([]);
        setAgents([]);
        setLoadError(
          err?.response?.data?.detail ||
            err?.response?.data?.error ||
            "Failed to load registration history."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleApplyFilters = useCallback(
    async (filters = trackerFilter, mode = trackerMode) => {
      if (mode === "today") {
        const date = filters.date || getTodayString();

        await loadAssignments({
          start_date: date,
          end_date: date,
          user_id: filters.user_id,
          patient: filters.patient,
          therapist_id: filters.therapist_id,
        });

        return;
      }

      await loadAssignments({
        start_date: filters.from_date,
        end_date: filters.to_date,
        user_id: filters.user_id,
        patient: filters.patient,
        therapist_id: filters.therapist_id,
      });
    },
    [trackerFilter, trackerMode, loadAssignments]
  );

  useEffect(() => {
    loadTherapists();
  }, [loadTherapists]);

  useEffect(() => {
    handleApplyFilters();
  }, [handleApplyFilters]);

  const handleEditAssignment = useCallback(
    async (assignment, ...rest) => {
      if (typeof editHandler !== "function") {
        console.error(
          "Admin assignment editing is not connected. " +
            "Pass onEditAssignment from AdminDashboard."
        );
        return false;
      }

      try {
        // The parent opens the shared assignment editor.
        await editHandler(assignment, ...rest);
        return true;
      } catch (err) {
        console.error("Failed to open assignment editor", err);
        return false;
      }
    },
    [editHandler]
  );

  const handleCancelAssignment = useCallback(
    async (assignment, ...rest) => {
      if (typeof deleteHandler !== "function") {
        console.error(
          "Admin registration deletion is not connected. " +
            "Pass onCancelAssignment from AdminDashboard."
        );
        return false;
      }

      try {
        const result = await deleteHandler(assignment, ...rest);

        // Refresh only when the parent reports a successful deletion.
        if (result !== false) {
          await handleApplyFilters();
        }

        return result;
      } catch (err) {
        console.error("Failed to delete registration", err);
        return false;
      }
    },
    [deleteHandler, handleApplyFilters]
  );

  return (
    <div>
      {loadError && (
        <div
          role="alert"
          style={{
            padding: "12px 16px",
            marginBottom: "12px",
            color: "#991b1b",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
          }}
        >
          {loadError}
        </div>
      )}

      {loading && (
        <p role="status" style={{ color: "#64748b" }}>
          Loading registration history...
        </p>
      )}

      <RegistrationTrackerSection
        mode={trackerMode}
        onChangeMode={setTrackerMode}
        assignments={assignments}
        agents={agents}
        therapists={therapists}
        filter={trackerFilter}
        setFilter={setTrackerFilter}
        onApplyFilters={handleApplyFilters}
        onEditAssignment={handleEditAssignment}
        onCancelAssignment={handleCancelAssignment}
        userRole="admin"
        isAdmin={true}
        isReception={false}
        currentUserId={adminUserId}
      />
    </div>
  );
}

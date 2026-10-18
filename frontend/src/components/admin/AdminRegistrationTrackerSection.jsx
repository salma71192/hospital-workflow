
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
  onCancelAssignment,
}) {
  const activeUser = currentUser || user;
  const adminUserId = currentUserId ?? activeUser?.id;

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

  const loadTherapists = useCallback(async () => {
    try {
      const res = await api.get("reception/therapists/");
      setTherapists(res.data?.therapists || []);
    } catch (err) {
      console.error("Failed to load therapists", err);
      setTherapists([]);
    }
  }, []);

  const loadAssignments = useCallback(async ({
    start_date = "",
    end_date = "",
    user_id = "all",
    patient = "",
    therapist_id = "all",
  } = {}) => {
    try {
      const params = new URLSearchParams();

      if (start_date) {
        params.append("start_date", start_date);
      }

      if (end_date) {
        params.append("end_date", end_date);
      }

      if (user_id !== "all") {
        params.append("user_id", user_id);
      }

      if (patient?.trim()) {
        params.append("patient", patient.trim());
      }

      if (therapist_id !== "all") {
        params.append("therapist_id", therapist_id);
      }

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

      setAgents(
        Array.isArray(res.data?.agents)
          ? res.data.agents
          : []
      );
    } catch (err) {
      console.error("Failed to load assignments", err);
      setAssignments([]);
      setAgents([]);
    }
  }, []);

  const handleApplyFilters = useCallback(async () => {
    if (trackerMode === "today") {
      await loadAssignments({
        start_date: trackerFilter.date,
        end_date: trackerFilter.date,
        user_id: trackerFilter.user_id,
        patient: trackerFilter.patient,
        therapist_id: trackerFilter.therapist_id,
      });

      return;
    }

    await loadAssignments({
      start_date: trackerFilter.from_date,
      end_date: trackerFilter.to_date,
      user_id: trackerFilter.user_id,
      patient: trackerFilter.patient,
      therapist_id: trackerFilter.therapist_id,
    });
  }, [trackerMode, trackerFilter, loadAssignments]);

  useEffect(() => {
    loadTherapists();
  }, [loadTherapists]);

  useEffect(() => {
    handleApplyFilters();
  }, [handleApplyFilters]);

  // Reload the visible records after a successful edit or cancellation.
  const handleEditAssignment = useCallback(
    async (...args) => {
      if (typeof onEditAssignment !== "function") {
        console.warn(
          "Registration editing is not connected. Supply onEditAssignment from the parent."
        );
        return;
      }

      await onEditAssignment(...args);
      await handleApplyFilters();
    },
    [onEditAssignment, handleApplyFilters]
  );

  const handleCancelAssignment = useCallback(
    async (...args) => {
      if (typeof onCancelAssignment !== "function") {
        console.warn(
          "Registration cancellation is not connected. Supply onCancelAssignment from the parent."
        );
        return;
      }

      await onCancelAssignment(...args);
      await handleApplyFilters();
    },
    [onCancelAssignment, handleApplyFilters]
  );

  return (
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
  );
}

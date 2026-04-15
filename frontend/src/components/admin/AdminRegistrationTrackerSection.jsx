import React, { useEffect, useState } from "react";
import api from "../../api/api";
import RegistrationTrackerSection from "../assignments/RegistrationTrackerSection";

function getTodayString() {
  return new Date().toLocaleDateString("en-CA");
}

function getFirstDayOfMonthString() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toLocaleDateString("en-CA");
}

function getLastDayOfMonthString() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toLocaleDateString("en-CA");
}

export default function AdminRegistrationTrackerSection() {
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

  useEffect(() => {
    loadTherapists();
    handleApplyFilters();
  }, []);

  const loadTherapists = async () => {
    try {
      const res = await api.get("reception/therapists/");
      setTherapists(res.data.therapists || []);
    } catch (err) {
      console.error("Failed to load therapists", err);
      setTherapists([]);
    }
  };

  const loadAssignments = async ({
    start_date = "",
    end_date = "",
    user_id = "all",
    patient = "",
    therapist_id = "all",
  }) => {
    try {
      const params = new URLSearchParams();

      if (start_date) params.append("start_date", start_date);
      if (end_date) params.append("end_date", end_date);
      if (user_id !== "all") params.append("user_id", user_id);
      if (patient?.trim()) params.append("patient", patient.trim());
      if (therapist_id !== "all") {
        params.append("therapist_id", therapist_id);
      }

      const res = await api.get(`reception/assignments/?${params.toString()}`);

      setAssignments(res.data.assignments || []);
      setAgents(res.data.agents || []);
    } catch (err) {
      console.error("Failed to load assignments", err);
      setAssignments([]);
      setAgents([]);
    }
  };

  const handleApplyFilters = async () => {
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
  };

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
      isAdmin={true}   // 🔥 important (enables full visibility)
    />
  );
}
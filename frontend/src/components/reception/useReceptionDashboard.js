import { useEffect, useState } from "react";
import api from "../../api/api";

export default function useReceptionDashboard(user, actingAs) {
  const today = new Date().toISOString().split("T")[0];

  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [selectedTherapist, setSelectedTherapist] = useState("");
  const [category, setCategory] = useState("appointment");
  const [message, setMessage] = useState("");
  const [alerts, setAlerts] = useState([]);

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
      setAssignments([]);
    }
  };

  const loadTherapists = async () => {
    try {
      const res = await api.get("reception/therapists/");
      setTherapists(res.data.therapists || []);
    } catch (err) {
      console.error("Failed to load therapists", err);
      setTherapists([]);
    }
  };

  const loadAlerts = async () => {
    const todayAssignments = assignments || [];
    const alertItems = todayAssignments
      .filter((item) => item.category === "task_without_eligibility")
      .map((item) => ({
        level: "warning",
        message: `${item.patient_name} assigned without eligibility`,
      }));
    setAlerts(alertItems);
  };

  const handleSearch = async () => {
    try {
      const res = await api.get(`patients/?search=${encodeURIComponent(search)}`);
      setPatients(res.data.patients || []);
      setMessage(
        (res.data.patients || []).length
          ? "Patients loaded"
          : "No patients found. Register a new patient if needed."
      );
    } catch (err) {
      console.error("Failed to search patients", err);
      setPatients([]);
      setMessage("Search failed");
    }
  };

  const handleAssign = async (patient) => {
    if (!selectedTherapist) {
      setMessage("Select therapist first");
      return;
    }

    try {
      await api.post("reception/assignments/", {
        patient_id: patient.id,
        therapist_id: selectedTherapist,
        category,
      });

      setMessage("Assigned successfully");
      loadAssignments();
    } catch (err) {
      setMessage(err?.response?.data?.error || "Error assigning");
    }
  };

  useEffect(() => {
    loadAssignments();
    loadTherapists();
  }, [actingAs, user]);

  useEffect(() => {
    loadAlerts();
  }, [assignments]);

  return {
    today,
    search,
    setSearch,
    patients,
    assignments,
    therapists,
    selectedTherapist,
    setSelectedTherapist,
    category,
    setCategory,
    message,
    setMessage,
    alerts,
    handleSearch,
    handleAssign,
  };
}
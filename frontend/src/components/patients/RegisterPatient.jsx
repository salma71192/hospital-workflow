import React, { useEffect, useState } from "react";
import api from "../../api/api";
import DashboardNotice from "../common/DashboardNotice";
import PatientAssignmentForm from "./PatientAssignmentForm";
import UnifiedPatientSearch from "./UnifiedPatientSearch";
export default function RegisterPatient() {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [therapists, setTherapists] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [assignmentForm, setAssignmentForm] = useState({
    patient_id: "",
    therapist_id: "",
    category: "appointment",
    visit_number: "",
    referring_physician: "",
    notes: "",
  });
  useEffect(() => {
    const loadTherapists = async () => {
      try {
        const response = await api.get("reception/therapists/");
        setTherapists(response.data.therapists || []);
      } catch (err) {
        console.error("Failed to load therapists:", err);
        setError("Unable to load physiotherapists.");
      }
    };
    loadTherapists();
  }, []);
  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setAssignmentForm((previous) => ({
      ...previous,
      patient_id: patient.id,
      therapist_id: "",
    }));
    setMessage("");
    setError("");
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const response = await api.post(
        "reception/assignments/",
        assignmentForm
      );
      setMessage(
        response.data?.message ||
          "Patient registered successfully."
      );
      setSelectedPatient(null);
      setAssignmentForm({
        patient_id: "",
        therapist_id: "",
        category: "appointment",
        visit_number: "",
        referring_physician: "",
        notes: "",
      });
    } catch (err) {
      console.error("Failed to register patient:", err);
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          "Unable to register the patient."
      );
    }
  };
  return (
    <div style={{ display: "grid", gap: 16 }}>
      {message && (
        <DashboardNotice type="success">
          {message}
        </DashboardNotice>
      )}
      {error && (
        <DashboardNotice type="error">
          {error}
        </DashboardNotice>
      )}
      <UnifiedPatientSearch
        title="Find Existing Patient"
        placeholder="Search patient name or ID"
        actionLabel="Select Patient"
        onSelectPatient={handleSelectPatient}
        emptyText="Start typing to search patients."
        noResultsText="No patients found."
      />
      {selectedPatient && (
        <PatientAssignmentForm
          selectedPatient={selectedPatient}
          assignmentForm={assignmentForm}
          setAssignmentForm={setAssignmentForm}
          therapists={therapists}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
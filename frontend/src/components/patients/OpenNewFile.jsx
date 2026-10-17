import React, { useState } from "react";
import api from "../../api/api";
import DashboardNotice from "../common/DashboardNotice";
import PatientRegisterForm from "./PatientRegisterForm";
export default function OpenNewFile() {
  const [patientForm, setPatientForm] = useState({
    name: "",
    patient_id: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const handleCreatePatientFile = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const response = await api.post("patients/", {
        name: patientForm.name.trim(),
        patient_id: patientForm.patient_id.trim(),
      });
      setMessage(
        response.data?.message ||
          "Patient file created successfully."
      );
      setPatientForm({
        name: "",
        patient_id: "",
      });
    } catch (err) {
      console.error("Failed to create patient file:", err);
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          "Unable to create the patient file. Please check the patient details."
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
      <PatientRegisterForm
        patientForm={patientForm}
        setPatientForm={setPatientForm}
        onSubmit={handleCreatePatientFile}
      />
    </div>
  );
}

import React, { useState } from "react";
import api from "../../api/api";
import DashboardNotice from "../common/DashboardNotice";
import PatientRegisterForm from "./PatientRegisterForm";

export default function OpenNewFile() {
  const [patientForm, setPatientForm] = useState({
    name: "",
    patient_id: "",
    insurance_provider: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleCreatePatientFile = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    const name = (patientForm.name || "").trim();
    const patient_id = (patientForm.patient_id || "").trim();
    const insurance_provider = (
      patientForm.insurance_provider || ""
    ).trim();

    if (!name || !patient_id || !insurance_provider) {
      setError(
        "Please enter the patient name, patient ID, and insurance provider."
      );
      return;
    }

    try {
      const response = await api.post("patients/", {
        name,
        patient_id,
        insurance_provider,
      });

      setMessage(
        response.data?.message ||
          "Patient file created successfully."
      );

      setPatientForm({
        name: "",
        patient_id: "",
        insurance_provider: "",
      });
    } catch (err) {
      console.error(
        "Failed to create patient file:",
        err?.response?.data || err
      );

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

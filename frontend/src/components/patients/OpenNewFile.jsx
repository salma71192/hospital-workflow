import React, { useState } from "react";
import api from "../../api/api";
import DashboardNotice from "../common/DashboardNotice";
import PatientRegisterForm from "./PatientRegisterForm";
export default function OpenNewFile() {
  const [patientForm, setPatientForm] = useState({
    name: "",
    gender: "",
    patient_id: "",
    insurance_provider: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const handleCreatePatientFile = async (e) => {
    e.preventDefault();
    if (saving) return;
    setMessage("");
    setError("");
    const name = (patientForm.name || "").trim();
    const gender = (patientForm.gender || "").trim();
    const patient_id = (patientForm.patient_id || "").trim();
    const insurance_provider = (
      patientForm.insurance_provider || ""
    ).trim();
    if (!name || !gender || !patient_id || !insurance_provider) {
      setError(
        "Please enter the patient name, gender, file number, and insurance provider."
      );
      return;
    }
    try {
      setSaving(true);
      const response = await api.post("patients/", {
        name,
        gender,
        patient_id,
        insurance_provider,
      });
      setMessage(
        response.data?.message ||
          "Patient file created successfully."
      );
      setPatientForm({
        name: "",
        gender: "",
        patient_id: "",
        insurance_provider: "",
      });
    } catch (err) {
      console.error(
        "Failed to create patient file:",
        err?.response?.data || err
      );
      const responseData = err?.response?.data;
      setError(
        responseData?.error ||
          responseData?.detail ||
          responseData?.message ||
          (responseData && typeof responseData === "object"
            ? Object.values(responseData)
                .flat()
                .filter(Boolean)
                .map(String)
                .join(" ")
            : "") ||
          "Unable to create the patient file. Please check the patient details and try again."
      );
    } finally {
      setSaving(false);
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
        saving={saving}
      />
    </div>
  );
}
import React from "react";
import PatientRegisterForm from "../patients/PatientRegisterForm";

export default function CallCenterRegisterSection({
  patientForm,
  setPatientForm,
  onSubmit,
}) {
  return (
    <PatientRegisterForm
      patientForm={patientForm}
      setPatientForm={setPatientForm}
      onSubmit={onSubmit}
    />
  );
}
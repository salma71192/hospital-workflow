import React from "react";

/*
  PatientDetails.jsx: Displays detailed info about a single patient
  Props:
    - patient: object with patient details
    - onBack: function to go back to AssignedPatients
*/

export default function PatientDetails({ patient, onBack }) {
  if (!patient) return <p>No patient selected.</p>;

  return (
    <div>
      <button onClick={onBack}>Back</button>
      <h3>{patient.full_name}</h3>
      <p>File Number: {patient.file_number}</p>
      <p>Assigned Physio: {patient.therapist}</p>
      <p>Condition: {patient.condition || "N/A"}</p>
      {/* Add more patient info as needed */}
    </div>
  );
}
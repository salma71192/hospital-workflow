import React from "react";

/*
  AssignedPatients.jsx: Displays list of patients assigned to the physio
  Props:
    - patients: array of patient objects
    - onSelectPatient: function(patient) => sets selected patient
*/

export default function AssignedPatients({ patients, onSelectPatient }) {
  if (!patients.length) return <p>No assigned patients yet.</p>;

  return (
    <div>
      <h3>Assigned Patients</h3>
      <ul>
        {patients.map((p) => (
          <li key={p.id}>
            {p.full_name} - {p.file_number}
            <button onClick={() => onSelectPatient(p)}>View Details</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
import React, { useState } from "react";

export default function PhysioDashboard({ user }) {
  const [searchFile, setSearchFile] = useState("");
  const [assignedPatient, setAssignedPatient] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    const patient = { fileNumber: searchFile, fullName: "John Doe" }; // dummy
    setAssignedPatient(patient);
  };

  const handleAssign = () => {
    if (assignedPatient) {
      alert(`Assigned ${assignedPatient.fullName} to physiotherapy`);
      setSearchFile("");
      setAssignedPatient(null);
    }
  };

  return (
    <div>
      <h2>Welcome, {user.username}!</h2>

      <h3>Search Patient by File Number</h3>
      <form onSubmit={handleSearch}>
        <input
          placeholder="File Number"
          value={searchFile}
          onChange={(e) => setSearchFile(e.target.value)}
          required
        />
        <button type="submit">Search</button>
      </form>

      {assignedPatient && (
        <div>
          <p>
            Found: {assignedPatient.fullName} (File: {assignedPatient.fileNumber})
          </p>
          <button onClick={handleAssign}>Assign to Physiotherapy</button>
        </div>
      )}
    </div>
  );
}
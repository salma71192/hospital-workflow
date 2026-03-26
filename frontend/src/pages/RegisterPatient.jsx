import React, { useState } from "react";

export default function RegisterPatient() {
  const [fullName, setFullName] = useState("");
  const [fileNumber, setFileNumber] = useState("");

  const handleRegister = (e) => {
    e.preventDefault();
    // Replace alert with API call to register patient
    alert(`Registering patient: ${fullName}, File Number: ${fileNumber}`);
    setFullName("");
    setFileNumber("");
  };

  return (
    <div>
      <h3>Register New Patient</h3>
      <form onSubmit={handleRegister}>
        <input
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <br /><br />
        <input
          placeholder="File Number"
          value={fileNumber}
          onChange={(e) => setFileNumber(e.target.value)}
          required
        />
        <br /><br />
        <button type="submit">Create Patient</button>
      </form>
    </div>
  );
}
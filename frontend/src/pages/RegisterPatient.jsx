import React, { useState, useEffect } from "react";
import api from "../api/api";

export default function RegisterPatient() {
  const [fullName, setFullName] = useState("");
  const [fileNumber, setFileNumber] = useState("");
  const [therapists, setTherapists] = useState([]);
  const [selectedTherapist, setSelectedTherapist] = useState("");

  useEffect(() => {
    api.get("physios/")
      .then(res => setTherapists(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("patients/create/", {
        full_name: fullName,
        file_number: fileNumber,
        therapist: selectedTherapist,
      });
      alert("Patient created!");
      setFullName("");
      setFileNumber("");
      setSelectedTherapist("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Register Patient</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full Name"
          required
        />
        <br />
        <input
          type="text"
          value={fileNumber}
          onChange={(e) => setFileNumber(e.target.value)}
          placeholder="File Number"
          required
        />
        <br />
        <label>Assign Physiotherapist:</label>
        <select
          value={selectedTherapist}
          onChange={(e) => setSelectedTherapist(e.target.value)}
        >
          <option value="">Select Physio</option>
          {therapists.map((t) => (
            <option key={t.id} value={t.id}>{t.username}</option>
          ))}
        </select>
        <br />
        <button type="submit">Create Patient</button>
      </form>
    </div>
  );
}
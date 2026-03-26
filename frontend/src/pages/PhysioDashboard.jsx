import React, { useState } from "react";
import DashboardLayout from "./DashboardLayout";

export default function PhysioDashboard({ user }) {
  const [activeTab, setActiveTab] = useState("assign");
  const [searchFile, setSearchFile] = useState("");
  const [assignedPatient, setAssignedPatient] = useState(null);

  const tabs = [
    { id: "assign", label: "Assign Patient" },
    { id: "register", label: "Register Patient" },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    // Replace with API call
    const patient = { fileNumber: searchFile, fullName: "John Doe" };
    setAssignedPatient(patient);
  };

  const handleAssign = () => {
    if (assignedPatient) {
      alert(`Assigned ${assignedPatient.fullName} to physiotherapy`);
      setSearchFile("");
      setAssignedPatient(null);
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    alert(`New patient registered!`);
    setSearchFile("");
  };

  return (
    <DashboardLayout user={user} tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === "assign" && (
        <div>
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
      )}

      {activeTab === "register" && (
        <div>
          <form onSubmit={handleRegister}>
            <input placeholder="Full Name" required />
            <br />
            <input placeholder="File Number" required />
            <br />
            <button type="submit">Register Patient</button>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
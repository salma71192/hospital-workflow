import React, { useState } from "react";
import DashboardLayout from "./DashboardLayout";

export default function ReceptionDashboard({ user }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [fullName, setFullName] = useState("");
  const [fileNumber, setFileNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "search", label: "Search Patient" },
    { id: "register", label: "Register Patient" },
  ];

  const handleCreatePatient = (e) => {
    e.preventDefault();
    alert(`Patient ${fullName} created!`);
    setFullName("");
    setFileNumber("");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    alert(`Searching for ${searchQuery}`);
    setSearchQuery("");
  };

  return (
    <DashboardLayout user={user} tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === "dashboard" && (
        <div>
          <h3>Dashboard Stats</h3>
          <p>Patients today: 0</p>
          <p>Patients this month: 0</p>
        </div>
      )}

      {activeTab === "search" && (
        <div>
          <form onSubmit={handleSearch}>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name or File Number"
            />
            <button type="submit">Search</button>
          </form>
        </div>
      )}

      {activeTab === "register" && (
        <div>
          <form onSubmit={handleCreatePatient}>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full Name"
              required
            />
            <br />
            <input
              value={fileNumber}
              onChange={(e) => setFileNumber(e.target.value)}
              placeholder="File Number"
              required
            />
            <br />
            <button type="submit">Create Patient</button>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
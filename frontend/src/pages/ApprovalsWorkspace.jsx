import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import DashboardNotice from "../components/common/DashboardNotice";
import PatientRegisterForm from "../components/patients/PatientRegisterForm";
import UnifiedPatientSearch from "../components/patients/UnifiedPatientSearch";

export default function ApprovalsWorkspace({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("approval");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [patientForm, setPatientForm] = useState({
    name: "",
    patient_id: "",
  });

  const handleBackToAdmin = () => {
    onStopImpersonation?.();
    navigate("/admin");
  };

  const handleCreatePatientFile = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setMessage("Register new patient form is ready.");
  };

  const handleSelectPatientForApproval = async (patient) => {
    setMessage(`Selected ${patient.name} for approval.`);
    setError("");
  };

  return (
    <DashboardLayout
      title="Approvals Workspace"
      subtitle={`Welcome, ${actingAs?.username || user?.username || "Approvals User"}`}
      accent="#7c3aed"
      sidebarTitle="Approvals"
      sidebarItems={[
        { key: "home", label: "Home" },
        { key: "approval", label: "Add New Approval" },
        { key: "open_file", label: "Register New Patient" },
        { key: "history", label: "Approval History" },
      ]}
      activeSection={activeSection}
      setActiveSection={(key) => {
        if (key === "home") {
          navigate("/approvals");
          return;
        }
        setActiveSection(key);
      }}
      onLogout={onLogout}
      actingAs={actingAs}
      actingAsName={actingAs?.username}
      onBackToAdmin={handleBackToAdmin}
    >
      {message ? <DashboardNotice type="success">{message}</DashboardNotice> : null}
      {error ? <DashboardNotice type="error">{error}</DashboardNotice> : null}

      {activeSection === "approval" && (
        <div style={styles.stack}>
          <UnifiedPatientSearch
            title="Add New Approval"
            placeholder="Search patient name or ID"
            actionLabel="Open Approval"
            onSelectPatient={handleSelectPatientForApproval}
            emptyText="Start typing to search patients."
            noResultsText="No patients found. Register a new patient if needed."
            onRegisterNew={() => setActiveSection("open_file")}
            registerButtonLabel="Register New Patient"
          />

          <div style={styles.card}>
            Approval form goes here next.
          </div>
        </div>
      )}

      {activeSection === "open_file" && (
        <PatientRegisterForm
          patientForm={patientForm}
          setPatientForm={setPatientForm}
          onSubmit={handleCreatePatientFile}
        />
      )}

      {activeSection === "history" && (
        <div style={styles.card}>
          Approval history goes here next.
        </div>
      )}
    </DashboardLayout>
  );
}

const styles = {
  stack: { display: "grid", gap: "16px" },
  card: {
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "18px",
  },
};
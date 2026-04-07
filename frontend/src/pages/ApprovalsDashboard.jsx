import React from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import DashboardNotice from "../components/common/DashboardNotice";
import AlertPanel from "../components/common/AlertPanel";
import UnifiedPatientSearch from "../components/patients/UnifiedPatientSearch";
import ApprovalEditor from "../components/approvals/ApprovalEditor";
import ApprovalHistorySection from "../components/approvals/ApprovalHistorySection";
import ApprovalsPatientRegisterForm from "../components/approvals/ApprovalsPatientRegisterForm";
import ApprovalAlertsSection from "../components/approvals/ApprovalAlertsSection";
import useApprovalsDashboard from "../components/approvals/useApprovalsDashboard";

export default function ApprovalsDashboard({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();

  const {
    activeSection,
    setActiveSection,
    message,
    error,
    alerts,
    selectedPatient,
    patientForm,
    setPatientForm,
    approvalForm,
    setApprovalForm,
    handleSelectPatient,
    handleCreatePatientFile,
    handleSaveApproval,
    handleDeleteApproval,
    refreshTimelineKey,
  } = useApprovalsDashboard();

  const handleBackToAdmin = () => {
    onStopImpersonation?.();
    navigate("/admin");
  };

  const handleEditFromOutside = async (patient) => {
    await handleSelectPatient(patient);
    setActiveSection("approval");
  };

  const hasExistingApproval = Boolean(
    selectedPatient?.current_approval_number ||
      approvalForm?.authorization_number
  );

  return (
    <DashboardLayout
      title="Approvals Dashboard"
      subtitle={`Welcome ${actingAs?.username || user?.username || ""}`}
      sidebarTitle="Approvals Panel"
      sidebarItems={[
        { key: "search", label: "Search Patient" },
        { key: "register", label: "Register Patient" },
        {
          key: "approval",
          label: hasExistingApproval
            ? "Edit Current Approval"
            : "Add New Approval",
        },
        { key: "alerts", label: "Alerts" },
        { key: "history", label: "Approval History" },
      ]}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      onLogout={onLogout}
      actingAs={actingAs}
      actingAsName={actingAs?.username}
      onBackToAdmin={handleBackToAdmin}
    >
      <AlertPanel
        title="Alerts"
        items={alerts}
        emptyText="No approval alerts right now."
      />

      {message ? (
        <DashboardNotice type="success">{message}</DashboardNotice>
      ) : null}

      {error ? (
        <DashboardNotice type="error">{error}</DashboardNotice>
      ) : null}

      {activeSection === "search" && (
        <UnifiedPatientSearch
          title="Search Patient"
          onSelectPatient={handleEditFromOutside}
          noResultsText="No patients found."
          onRegisterNew={() => setActiveSection("register")}
          getActionLabel={(patient) =>
            patient?.current_approval_number
              ? "Edit Approval"
              : "Add New Approval"
          }
        />
      )}

      {activeSection === "register" && (
        <ApprovalsPatientRegisterForm
          patientForm={patientForm}
          setPatientForm={setPatientForm}
          onSubmit={handleCreatePatientFile}
        />
      )}

      {activeSection === "approval" && (
        <ApprovalEditor
          selectedPatient={selectedPatient}
          approvalForm={approvalForm}
          setApprovalForm={setApprovalForm}
          onSubmit={handleSaveApproval}
          onReloadPatient={handleSelectPatient}
          onDeleteApproval={handleDeleteApproval}
          refreshTimelineKey={refreshTimelineKey}
        />
      )}

      {activeSection === "alerts" && (
        <ApprovalAlertsSection onEditApproval={handleEditFromOutside} />
      )}

      {activeSection === "history" && (
        <ApprovalHistorySection onEditApproval={handleEditFromOutside} />
      )}
    </DashboardLayout>
  );
}
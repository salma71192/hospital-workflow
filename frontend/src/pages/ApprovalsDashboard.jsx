import React from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import DashboardNotice from "../components/common/DashboardNotice";
import AlertPanel from "../components/common/AlertPanel";
import UnifiedPatientSearch from "../components/patients/UnifiedPatientSearch";
import ApprovalEditor from "../components/approvals/ApprovalEditor";
import ApprovalHistorySection from "../components/approvals/ApprovalHistorySection";
import ApprovalsPatientRegisterForm from "../components/approvals/ApprovalsPatientRegisterForm";
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
    billingCodes,
    handleSelectPatient,
    handleCreatePatientFile,
    handleSaveApproval,
  } = useApprovalsDashboard();

  const handleBackToAdmin = () => {
    onStopImpersonation?.();
    navigate("/admin");
  };

  const hasExistingApproval = Boolean(
    selectedPatient?.current_approval_number || approvalForm?.authorization_number
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
          label: hasExistingApproval ? "Update Approval" : "Add Approval",
        },
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

      {message && <DashboardNotice type="success">{message}</DashboardNotice>}
      {error && <DashboardNotice type="error">{error}</DashboardNotice>}

      {activeSection === "search" && (
        <UnifiedPatientSearch
          title="Search Patient"
          actionLabel={hasExistingApproval ? "Update Approval" : "Add Approval"}
          onSelectPatient={handleSelectPatient}
          noResultsText="No patients found."
          onRegisterNew={() => setActiveSection("register")}
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
          billingCodes={billingCodes}
          onSubmit={handleSaveApproval}
          onReloadPatient={handleSelectPatient}
        />
      )}

      {activeSection === "history" && <ApprovalHistorySection />}
    </DashboardLayout>
  );
}
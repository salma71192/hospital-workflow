import React from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import DashboardNotice from "../components/common/DashboardNotice";
import PatientRegisterForm from "../components/patients/PatientRegisterForm";
import AlertPanel from "../components/common/AlertPanel";
import UnifiedPatientSearch from "../components/patients/UnifiedPatientSearch";
import ApprovalEditor from "../components/approvals/ApprovalEditor";
import BillingCodesSection from "../components/approvals/BillingCodesSection";
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
    billingForm,
    setBillingForm,
    handleSelectPatient,
    handleCreatePatientFile,
    handleSaveApproval,
    handleSaveBillingCode,
  } = useApprovalsDashboard();

  const handleBackToAdmin = () => {
    onStopImpersonation?.();
    navigate("/admin");
  };

  return (
    <DashboardLayout
      title="Approvals Dashboard"
      subtitle={`Welcome ${actingAs?.username || user?.username || ""}`}
      sidebarTitle="Approvals Panel"
      sidebarItems={[
        { key: "search", label: "Search Patient" },
        { key: "register", label: "Register Patient" },
        { key: "approval", label: "Update Approval" },
        { key: "billing", label: "Billing Codes" },
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
          actionLabel="Update Approval"
          onSelectPatient={handleSelectPatient}
        />
      )}

      {activeSection === "register" && (
        <PatientRegisterForm
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

      {activeSection === "billing" && (
        <BillingCodesSection
          billingForm={billingForm}
          setBillingForm={setBillingForm}
          billingCodes={billingCodes}
          onSubmit={handleSaveBillingCode}
        />
      )}
    </DashboardLayout>
  );
}

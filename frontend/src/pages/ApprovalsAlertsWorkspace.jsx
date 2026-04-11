import React from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";

export default function ApprovalsAlertsWorkspace({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();

  const handleBackToAdmin = () => {
    onStopImpersonation?.();
    navigate("/admin");
  };

  return (
    <DashboardLayout
      title="Alerts Workspace"
      subtitle={`Welcome, ${actingAs?.username || user?.username || "Approvals User"}`}
      accent="#2563eb"
      sidebarTitle="Alerts"
      sidebarItems={[
        { key: "home", label: "Home" },
        { key: "alerts", label: "Alerts" },
      ]}
      activeSection="alerts"
      setActiveSection={(key) => {
        if (key === "home") {
          navigate("/approvals");
        }
      }}
      onLogout={onLogout}
      actingAs={actingAs}
      actingAsName={actingAs?.username}
      onBackToAdmin={handleBackToAdmin}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: "18px",
          padding: "24px",
          color: "#475569",
          fontWeight: "600",
        }}
      >
        Alerts workspace is ready for the next phase.
      </div>
    </DashboardLayout>
  );
}
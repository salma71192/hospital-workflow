import React from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";

export default function PhysioFollowupWorkspace({
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
      title="Patient Follow-Up Workspace"
      subtitle={`Welcome, ${
        actingAs?.username || user?.username || "Physio User"
      }`}
      accent="#059669"
      sidebarTitle="Follow-Up"
      sidebarItems={[
        { key: "home", label: "Home" },
        { key: "followup", label: "Patient Follow-Up" },
      ]}
      activeSection="followup"
      setActiveSection={(key) => {
        if (key === "home") {
          navigate("/physio");
        }
      }}
      onLogout={onLogout}
      actingAs={actingAs}
      actingAsName={actingAs?.username}
      onBackToAdmin={handleBackToAdmin}
    >
      <div style={styles.card}>
        Patient follow-up workspace is ready for the next phase.
      </div>
    </DashboardLayout>
  );
}

const styles = {
  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "24px",
    color: "#475569",
    fontWeight: "600",
  },
};
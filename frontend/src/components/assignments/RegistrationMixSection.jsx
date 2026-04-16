import React from "react";
import RegistrationMixLegendItem from "./RegistrationMixLegendItem";

export default function RegistrationMixSection({ stats }) {
  return (
    <div style={styles.container}>
      <RegistrationMixLegendItem
        label="Walk In"
        value={stats.walkIn}
        percent={stats.walkInPct}
        color="#10b981"
      />

      <RegistrationMixLegendItem
        label="Has Appointment"
        value={stats.appointment}
        percent={stats.appointmentPct}
        color="#3b82f6"
      />

      <RegistrationMixLegendItem
        label="Initial Eval"
        value={stats.initialEval}
        percent={stats.initialEvalPct}
        color="#f59e0b"
      />

      <RegistrationMixLegendItem
        label="No Eligibility"
        value={stats.noEligibility}
        percent={stats.noEligibilityPct}
        color="#ef4444"
      />
    </div>
  );
}

const styles = {
  container: {
    display: "grid",
    gap: "12px",
    padding: "14px 16px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
  },
};
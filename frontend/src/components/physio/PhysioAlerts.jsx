import React from "react";

export default function PhysioAlerts({ alerts }) {
  if (!alerts.length) return null;

  return (
    <div style={styles.wrapper}>
      <h3 style={styles.title}>⚠️ Renewal Alerts</h3>

      {alerts.map((a, i) => (
        <div key={i} style={styles.alert}>
          {a.message}
        </div>
      ))}
    </div>
  );
}

const styles = {
  wrapper: {
    background: "#fef3c7",
    border: "1px solid #facc15",
    padding: "12px",
    borderRadius: "12px",
    marginBottom: "16px",
  },
  title: {
    fontWeight: "800",
    marginBottom: "8px",
  },
  alert: {
    fontSize: "14px",
    marginBottom: "4px",
  },
};

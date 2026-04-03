import React from "react";

export default function DashboardMetricInput({
  value,
  onChange,
  placeholder = "Enter target",
  label = "Target",
  min = 1,
}) {
  return (
    <div style={styles.wrapper}>
      <label style={styles.label}>{label}</label>
      <input
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.input}
        placeholder={placeholder}
      />
    </div>
  );
}

const styles = {
  wrapper: {
    maxWidth: "260px",
    display: "grid",
    gap: "8px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  input: {
    padding: "13px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box",
  },
};
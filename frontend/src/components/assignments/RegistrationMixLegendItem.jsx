import React from "react";

export default function RegistrationMixLegendItem({
  label,
  value,
  percent,
  color,
}) {
  return (
    <div style={styles.legendItem}>
      <div style={styles.legendLeft}>
        <span
          style={{
            ...styles.legendDot,
            background: color,
          }}
        />
        <span style={styles.legendLabel}>{label}</span>
      </div>

      <div style={styles.legendRight}>
        <span style={styles.legendPercent}>{percent}%</span>
        <span style={styles.legendValue}>{value}</span>
      </div>
    </div>
  );
}

const styles = {
  legendItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "10px 0",
    borderBottom: "1px solid #f1f5f9",
  },
  legendLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
  },
  legendDot: {
    width: "10px",
    height: "10px",
    borderRadius: "999px",
    flexShrink: 0,
  },
  legendLabel: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#334155",
  },
  legendRight: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexShrink: 0,
  },
  legendPercent: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#0f172a",
  },
  legendValue: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#64748b",
    minWidth: "24px",
    textAlign: "right",
  },
};
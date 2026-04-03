import React from "react";

export default function DashboardStatsGrid({ stats = [] }) {
  return (
    <div style={styles.grid}>
      {stats.map((item, index) => (
        <div key={index} style={styles.card}>
          <div style={styles.label}>{item.label}</div>
          <div style={styles.value}>{item.value}</div>
          {item.sub && <div style={styles.sub}>{item.sub}</div>}
        </div>
      ))}
    </div>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
  },
  card: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "18px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 6px 20px rgba(15, 23, 42, 0.05)",
  },
  label: {
    fontSize: "13px",
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: "8px",
  },
  value: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#0f172a",
  },
  sub: {
    marginTop: "6px",
    fontSize: "13px",
    color: "#64748b",
  },
};
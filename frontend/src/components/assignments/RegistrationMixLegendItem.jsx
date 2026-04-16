import React from "react";

function getTrend(percent) {
  const p = Number(percent || 0);

  if (p >= 50) {
    return { symbol: "↑", color: "#166534", bg: "#f0fdf4" };
  }
  if (p >= 20) {
    return { symbol: "→", color: "#b45309", bg: "#fffbeb" };
  }
  return { symbol: "↓", color: "#64748b", bg: "#f8fafc" };
}

export default function RegistrationMixLegendItem({
  label,
  value,
  percent,
  color,
}) {
  const trend = getTrend(percent);
  const safePercent = Math.max(0, Math.min(Number(percent || 0), 100));
  const safeValue = Number(value || 0);

  return (
    <div style={styles.card}>
      <div style={styles.topRow}>
        <div style={styles.labelWrap}>
          <span style={styles.label}>{label}</span>
        </div>

        <div style={styles.metricWrap}>
          <span
            style={{
              ...styles.trend,
              color: trend.color,
              background: trend.bg,
            }}
          >
            {trend.symbol}
          </span>

          <span style={styles.percent}>{safePercent}%</span>

          <span style={styles.countBadge}>{safeValue}</span>
        </div>
      </div>

      <div style={styles.barRow}>
        <div style={styles.track}>
          <div
            style={{
              ...styles.fill,
              width: `${safePercent}%`,
              background: color,
            }}
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    display: "grid",
    gap: "10px",
    padding: "12px 0",
    borderBottom: "1px solid #f1f5f9",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
  },
  labelWrap: {
    minWidth: 0,
    flex: 1,
  },
  label: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#334155",
  },
  metricWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexShrink: 0,
  },
  trend: {
    width: "26px",
    height: "26px",
    borderRadius: "999px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "13px",
  },
  percent: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#0f172a",
    minWidth: "52px",
    textAlign: "right",
    lineHeight: 1,
  },
  countBadge: {
    minWidth: "34px",
    height: "28px",
    padding: "0 10px",
    borderRadius: "999px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    color: "#475569",
    fontSize: "13px",
    fontWeight: "800",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  barRow: {
    display: "grid",
  },
  track: {
    width: "100%",
    height: "10px",
    borderRadius: "999px",
    background: "#e2e8f0",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: "999px",
    transition: "width 0.25s ease",
  },
};
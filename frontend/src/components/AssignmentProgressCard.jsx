import React from "react";

export default function AssignmentProgressCard({
  title,
  count = 0,
  target = 1,
  subtitle = "",
}) {
  const safeTarget = Math.max(Number(target) || 1, 1);
  const safeCount = Math.max(Number(count) || 0, 0);
  const percentage = Math.min(Math.round((safeCount / safeTarget) * 100), 100);

  const radius = 48;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const strokeDashoffset =
    circumference - (percentage / 100) * circumference;

  return (
    <div style={styles.card}>
      <div style={styles.left}>
        <p style={styles.kicker}>{title}</p>
        <div style={styles.bigNumber}>{safeCount}</div>
        <div style={styles.meta}>Target: {safeTarget}</div>
        <div style={styles.meta}>Achieved: {percentage}%</div>
        {subtitle ? <div style={styles.subtitle}>{subtitle}</div> : null}
      </div>

      <div style={styles.chartWrap}>
        <svg height={110} width={110}>
          <circle
            stroke="#e5e7eb"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx="55"
            cy="55"
          />
          <circle
            stroke="#2563eb"
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            style={{
              strokeDashoffset,
              transform: "rotate(-90deg)",
              transformOrigin: "55px 55px",
              transition: "stroke-dashoffset 0.35s",
            }}
            r={normalizedRadius}
            cx="55"
            cy="55"
          />
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dy=".3em"
            style={styles.percentText}
          >
            {percentage}%
          </text>
        </svg>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
    border: "1px solid #e8eef7",
    borderRadius: "20px",
    padding: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "18px",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
  },
  left: {
    display: "grid",
    gap: "8px",
  },
  kicker: {
    margin: 0,
    fontSize: "13px",
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  bigNumber: {
    fontSize: "36px",
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: 1,
  },
  meta: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#334155",
  },
  subtitle: {
    fontSize: "13px",
    color: "#64748b",
  },
  chartWrap: {
    flexShrink: 0,
  },
  percentText: {
    fontSize: "18px",
    fontWeight: "800",
    fill: "#0f172a",
  },
};
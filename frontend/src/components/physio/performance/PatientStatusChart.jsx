
import React, { useMemo } from "react";

const COLORS = [
  "#10b981", // Low
  "#f59e0b", // Moderate
  "#ef4444", // High
  "#64748b", // Inactive
];

const DEFAULT_STATUSES = [
  "Low",
  "Moderate",
  "High",
  "Inactive",
];

function getStatus(patient) {
  const raw =
    patient?.risk_level ??
    patient?.priority ??
    patient?.status ??
    patient?.patient_status ??
    "";

  const normalized = String(raw).trim().toLowerCase();

  const statusMap = {
    low: "Low",
    moderate: "Moderate",
    medium: "Moderate",
    high: "High",
    inactive: "Inactive",
  };

  return statusMap[normalized] || "";
}

function CircleChart({ status, count, percentage, color }) {
  const radius = 43;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference - (percentage / 100) * circumference;

  return (
    <div style={styles.circleItem}>
      <div
        style={styles.circleWrapper}
        role="img"
        aria-label={`${status}: ${count} patients, ${percentage.toFixed(1)} percent`}
      >
        <svg
          viewBox="0 0 110 110"
          width="145"
          height="145"
          style={styles.svg}
          aria-hidden="true"
        >
          <circle
            cx="55"
            cy="55"
            r={radius}
            fill="none"
            stroke="#edf2f7"
            strokeWidth="9"
          />

          <circle
            cx="55"
            cy="55"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 55 55)"
            style={{
              transition: "stroke-dashoffset 400ms ease",
            }}
          />
        </svg>

        <div style={styles.circleCenter}>
          <strong style={styles.circleCount}>
            {count.toLocaleString()}
          </strong>
          <span style={styles.circleUnit}>patients</span>
        </div>
      </div>

      <div style={styles.statusName} title={status}>
        <span
          style={{
            ...styles.legendDot,
            background: color,
          }}
        />
        {status}
      </div>

      <div style={styles.percentage}>
        {percentage.toFixed(1)}%
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 22,
    boxShadow: "0 8px 26px rgba(15, 23, 42, 0.05)",
    minWidth: 0,
    fontFamily: "Inter, Arial, sans-serif",
  },

  title: {
    margin: 0,
    color: "#16334f",
    fontSize: 20,
    fontWeight: 800,
  },

  subtitle: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 1.5,
    marginTop: 7,
    marginBottom: 22,
  },

  summary: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 24,
    flexWrap: "wrap",
  },

  total: {
    color: "#16334f",
    fontSize: 30,
    fontWeight: 850,
    lineHeight: 1.2,
  },

  totalLabel: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: 500,
  },

  circleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))",
    gap: 24,
    alignItems: "start",
  },

  circleItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: 0,
    padding: "8px 4px 12px",
    borderRadius: 14,
    background: "#ffffff",
  },

  circleWrapper: {
    width: 145,
    height: 145,
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  svg: {
    display: "block",
    overflow: "visible",
  },

  circleCenter: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },

  circleCount: {
    color: "#16334f",
    fontSize: 25,
    fontWeight: 800,
    lineHeight: 1.2,
  },

  circleUnit: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 3,
  },

  statusName: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 12,
    color: "#334155",
    fontSize: 13,
    fontWeight: 700,
    textAlign: "center",
    overflowWrap: "anywhere",
    maxWidth: "100%",
  },

  legendDot: {
    width: 9,
    height: 9,
    borderRadius: "50%",
    flexShrink: 0,
  },

  percentage: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: 600,
    marginTop: 5,
  },

  empty: {
    padding: 22,
    background: "#f8fafc",
    borderRadius: 12,
    color: "#64748b",
    fontSize: 13,
    textAlign: "center",
  },
};

export default function PatientStatusChart({
  patients = [],
  loading = false,
}) {
  const rows = useMemo(() => {
    const counts = new Map(
      DEFAULT_STATUSES.map((status) => [status, 0])
    );

    patients.forEach((patient) => {
      const status = getStatus(patient);

      if (counts.has(status)) {
        counts.set(status, counts.get(status) + 1);
      }
    });

    return DEFAULT_STATUSES.map((status) => ({
      status,
      count: counts.get(status) || 0,
    }));
  }, [patients]);

  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <section style={styles.card}>
      <h2 style={styles.title}>Patient Status</h2>

      <p style={styles.subtitle}>
        Distribution of patients by risk level and activity status.
      </p>

      {loading ? (
        <div style={styles.empty}>
          Loading patient status...
        </div>
      ) : (
        <>
          <div style={styles.summary}>
            <span style={styles.total}>
              {total.toLocaleString()}
            </span>
            <span style={styles.totalLabel}>
              patients in displayed categories
            </span>
          </div>

          <div style={styles.circleGrid}>
            {rows.map((row, index) => {
              const percentage =
                total > 0 ? (row.count / total) * 100 : 0;

              return (
                <CircleChart
                  key={row.status}
                  status={row.status}
                  count={row.count}
                  percentage={percentage}
                  color={COLORS[index]}
                />
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

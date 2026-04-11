import React from "react";

export default function BookingTargetStats({
  title = "Target Statistics",
  target = 0,
  actual = 0,
  onChangeTarget,
}) {
  const safeTarget = Number(target || 0);
  const safeActual = Number(actual || 0);
  const remaining = Math.max(safeTarget - safeActual, 0);
  const percentage =
    safeTarget > 0 ? Math.min((safeActual / safeTarget) * 100, 100) : 0;

  const chartBars = [
    { label: "Actual", value: safeActual },
    { label: "Remaining", value: remaining },
    { label: "Target", value: safeTarget },
  ];

  const maxValue = Math.max(...chartBars.map((item) => item.value), 1);

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>Performance</div>
          <h3 style={styles.title}>{title}</h3>
        </div>

        <div style={styles.targetBox}>
          <label style={styles.label}>Target</label>
          <input
            type="number"
            min="0"
            value={target}
            onChange={(e) => onChangeTarget?.(e.target.value)}
            style={styles.input}
          />
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Actual</div>
          <div style={styles.statValue}>{safeActual}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Remaining</div>
          <div style={styles.statValue}>{remaining}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Completion</div>
          <div style={styles.statValue}>{percentage.toFixed(0)}%</div>
        </div>
      </div>

      <div style={styles.progressWrap}>
        <div style={styles.progressTop}>
          <span style={styles.progressLabel}>Progress</span>
          <span style={styles.progressValue}>
            {safeActual} / {safeTarget || 0}
          </span>
        </div>

        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressFill,
              width: `${percentage}%`,
            }}
          />
        </div>
      </div>

      <div style={styles.chartWrap}>
        {chartBars.map((item) => {
          const height = `${(item.value / maxValue) * 100}%`;

          return (
            <div key={item.label} style={styles.chartItem}>
              <div style={styles.chartValue}>{item.value}</div>
              <div style={styles.chartBarArea}>
                <div
                  style={{
                    ...styles.chartBar,
                    height,
                    ...(item.label === "Actual"
                      ? styles.chartBarActual
                      : item.label === "Remaining"
                      ? styles.chartBarRemaining
                      : styles.chartBarTarget),
                  }}
                />
              </div>
              <div style={styles.chartLabel}>{item.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "20px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
    display: "grid",
    gap: "18px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  eyebrow: {
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#64748b",
    marginBottom: "6px",
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "800",
    color: "#0f172a",
  },
  targetBox: {
    display: "grid",
    gap: "6px",
    minWidth: "120px",
  },
  label: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#475569",
  },
  input: {
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    outline: "none",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "12px",
  },
  statCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "14px",
    display: "grid",
    gap: "6px",
  },
  statLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
  },
  progressWrap: {
    display: "grid",
    gap: "8px",
  },
  progressTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    fontSize: "13px",
    fontWeight: "700",
    color: "#475569",
  },
  progressLabel: {},
  progressValue: {},
  progressTrack: {
    width: "100%",
    height: "12px",
    background: "#e2e8f0",
    borderRadius: "999px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "#be185d",
    borderRadius: "999px",
    transition: "width 0.25s ease",
  },
  chartWrap: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(70px, 1fr))",
    gap: "16px",
    alignItems: "end",
    minHeight: "160px",
  },
  chartItem: {
    display: "grid",
    gap: "8px",
    justifyItems: "center",
    height: "100%",
  },
  chartValue: {
    fontSize: "13px",
    fontWeight: "800",
    color: "#334155",
  },
  chartBarArea: {
    height: "100px",
    width: "100%",
    display: "flex",
    alignItems: "end",
    justifyContent: "center",
  },
  chartBar: {
    width: "40px",
    borderRadius: "12px 12px 6px 6px",
    minHeight: "8px",
  },
  chartBarActual: {
    background: "#be185d",
  },
  chartBarRemaining: {
    background: "#cbd5e1",
  },
  chartBarTarget: {
    background: "#0ea5e9",
  },
  chartLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
  },
};
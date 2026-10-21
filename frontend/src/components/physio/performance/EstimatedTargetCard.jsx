import React from "react";

export default function EstimatedTargetCard({
  currentMonth,
  previousMonth,
  currentEvaluations = 0,
  previousEvaluations = 0,
}) {
  const target =
    (Number(currentEvaluations) + Number(previousEvaluations)) * 6;

  const styles = {
    card: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: 18,
      padding: 24,
      boxShadow: "0 8px 26px rgba(15, 23, 42, 0.05)",
      fontFamily: "Inter, Arial, sans-serif",
      minWidth: 0,
    },
    eyebrow: {
      color: "#64748b",
      fontSize: 12,
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "0.7px",
    },
    target: {
      color: "#12365a",
      fontSize: "clamp(32px, 5vw, 46px)",
      fontWeight: 850,
      lineHeight: 1.2,
      margin: "12px 0",
    },
    description: {
      color: "#64748b",
      fontSize: 13,
      lineHeight: 1.6,
      margin: 0,
    },
    metrics: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
      gap: 12,
      marginTop: 22,
    },
    metric: {
      background: "#f8fafc",
      border: "1px solid #e8edf4",
      borderRadius: 12,
      padding: 15,
      minWidth: 0,
    },
    metricLabel: {
      color: "#64748b",
      fontSize: 12,
      marginBottom: 8,
    },
    metricValue: {
      color: "#183b60",
      fontSize: 24,
      fontWeight: 800,
    },
  };

  return (
    <section style={styles.card}>
      <div style={styles.eyebrow}>Performance / Estimated target</div>

      <div style={styles.target}>{target.toLocaleString()}</div>

      <p style={styles.description}>
        Estimated target based on initial evaluations recorded in the
        current and previous months, multiplied by six.
      </p>

      <div style={styles.metrics}>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>
            Evaluations — {currentMonth}
          </div>
          <div style={styles.metricValue}>
            {Number(currentEvaluations).toLocaleString()}
          </div>
        </div>

        <div style={styles.metric}>
          <div style={styles.metricLabel}>
            Evaluations — {previousMonth}
          </div>
          <div style={styles.metricValue}>
            {Number(previousEvaluations).toLocaleString()}
          </div>
        </div>

        <div style={styles.metric}>
          <div style={styles.metricLabel}>Target calculation</div>
          <div style={{ ...styles.metricValue, fontSize: 20 }}>
            ({Number(currentEvaluations)} +{" "}
            {Number(previousEvaluations)}) × 6
          </div>
        </div>
      </div>
    </section>
  );
}
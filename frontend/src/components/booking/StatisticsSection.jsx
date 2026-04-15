import React from "react";

export default function StatisticsSection({
  stats,
  walkInCount = 0,
  initialEvalCount = 0,
  taskWithoutEligibilityCount = 0,
}) {
  if (!stats) return null;

  const appointments = stats.appointments || {};
  const totalSeen =
    Number(appointments.attended || 0) +
    Number(walkInCount || 0) +
    Number(initialEvalCount || 0);

  return (
    <div style={styles.card}>
      <div style={styles.title}>Today Statistics</div>

      <div style={styles.section}>
        <div style={styles.subtitle}>Appointments</div>
        <div style={styles.row}>
          <Stat label="Total" value={appointments.total || 0} />
          <Stat label="Attended" value={appointments.attended || 0} />
          <Stat label="No Show" value={appointments.no_show || 0} />
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.subtitle}>Other Sections</div>
        <div style={styles.row}>
          <Stat label="Walk In" value={walkInCount} />
          <Stat label="Initial Eval" value={initialEvalCount} />
          <Stat
            label="Task Without Eligibility"
            value={taskWithoutEligibilityCount}
          />
        </div>
      </div>

      <div style={styles.totalBox}>
        Total Seen Today: <strong>{totalSeen}</strong>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={styles.stat}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "22px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
    display: "grid",
    gap: "18px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f172a",
  },
  section: {
    display: "grid",
    gap: "10px",
  },
  subtitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#475569",
  },
  row: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  stat: {
    flex: "1",
    minWidth: "140px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "12px",
    textAlign: "center",
  },
  statLabel: {
    fontSize: "12px",
    color: "#64748b",
  },
  statValue: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#0f172a",
  },
  totalBox: {
    background: "#ecfdf5",
    border: "1px solid #10b981",
    color: "#065f46",
    padding: "14px",
    borderRadius: "12px",
    fontWeight: "800",
    textAlign: "center",
  },
};
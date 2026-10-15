
export default function RegistrationStatsSection({ stats = {} }) {
  const MONTHLY_TARGET = 400;

  const monthlyRegistrations = Math.max(
    0,
    Number(stats.monthly) || 0
  );

  const remaining = Math.max(
    0,
    MONTHLY_TARGET - monthlyRegistrations
  );

  const percentage = Math.round(
    (monthlyRegistrations / MONTHLY_TARGET) * 100
  );

  const progressWidth = Math.min(100, percentage);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <div style={styles.eyebrow}>
              RECEPTION · MY STATS
            </div>

            <h2 style={styles.title}>
              Monthly Registration Progress
            </h2>

            <p style={styles.subtitle}>
              Your registrations compared with your monthly target.
            </p>
          </div>

          <div style={styles.targetBadge}>
            Target: {MONTHLY_TARGET}
          </div>
        </div>

        <div style={styles.progressSection}>
          <div style={styles.progressHeader}>
            <span>Total registrations this month</span>
            <strong>
              {monthlyRegistrations} / {MONTHLY_TARGET}
            </strong>
          </div>

          <div style={styles.track}>
            <div
              style={{
                ...styles.fill,
                width: `${progressWidth}%`,
              }}
            />
          </div>

          <div style={styles.percentage}>
            {percentage}% completed
          </div>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statBox}>
            <span style={styles.statLabel}>
              Registrations
            </span>
            <strong style={styles.statNumber}>
              {monthlyRegistrations}
            </strong>
            <span style={styles.statHint}>
              Completed this month
            </span>
          </div>

          <div style={styles.statBox}>
            <span style={styles.statLabel}>
              Monthly Target
            </span>
            <strong style={styles.statNumber}>
              {MONTHLY_TARGET}
            </strong>
            <span style={styles.statHint}>
              Required registrations
            </span>
          </div>

          <div style={styles.statBox}>
            <span style={styles.statLabel}>
              Remaining
            </span>
            <strong style={styles.statNumber}>
              {remaining}
            </strong>
            <span style={styles.statHint}>
              {remaining === 0
                ? "Target achieved"
                : "More registrations needed"}
            </span>
          </div>
        </div>

        {monthlyRegistrations >= MONTHLY_TARGET && (
          <div style={styles.success}>
            Congratulations! You have reached your monthly target.
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    display: "grid",
    gap: "16px",
    boxSizing: "border-box",
  },

  card: {
    width: "100%",
    boxSizing: "border-box",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "24px",
    display: "grid",
    gap: "24px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
  },

  eyebrow: {
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "0.08em",
  },

  title: {
    margin: "8px 0",
    fontSize: "24px",
    lineHeight: 1.3,
    color: "#0f172a",
  },

  subtitle: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  targetBadge: {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    borderRadius: "12px",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },

  progressSection: {
    display: "grid",
    gap: "12px",
  },

  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
    color: "#334155",
    fontSize: "14px",
  },

  track: {
    width: "100%",
    height: "14px",
    borderRadius: "999px",
    background: "#e2e8f0",
    overflow: "hidden",
  },

  fill: {
    height: "100%",
    background: "#2563eb",
    borderRadius: "999px",
    transition: "width 0.3s ease",
  },

  percentage: {
    color: "#2563eb",
    fontSize: "14px",
    fontWeight: "800",
    textAlign: "right",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "14px",
  },

  statBox: {
    minWidth: 0,
    boxSizing: "border-box",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "18px",
    display: "grid",
    gap: "8px",
  },

  statLabel: {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "700",
  },

  statNumber: {
    color: "#0f172a",
    fontSize: "30px",
    lineHeight: 1.2,
    overflowWrap: "anywhere",
  },

  statHint: {
    color: "#64748b",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  success: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "12px",
    padding: "14px",
    color: "#166534",
    fontWeight: "800",
    lineHeight: 1.5,
  },
};

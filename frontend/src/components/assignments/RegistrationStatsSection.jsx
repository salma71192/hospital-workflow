
import React from "react";

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

  const achieved = monthlyRegistrations >= MONTHLY_TARGET;
  const nearTarget = percentage >= 75;
  const inProgress = percentage >= 40;

  const status = achieved
    ? {
        label: "Target achieved",
        ...styles.achievedBadge,
      }
    : nearTarget
    ? {
        label: "Almost there",
        ...styles.nearTargetBadge,
      }
    : inProgress
    ? {
        label: "In progress",
        ...styles.inProgressBadge,
      }
    : {
        label: "Getting started",
        ...styles.startBadge,
      };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <span style={styles.teamBadge}>RECEPTION TEAM</span>
          <h2 style={styles.title}>My Statistics</h2>
          <p style={styles.subtitle}>
            Your monthly registration performance and progress toward your target.
          </p>
        </div>

        <span style={styles.monthBadge}>Monthly Report</span>
      </div>

      <div style={styles.targetCard}>
        <div style={styles.targetIcon}>★</div>
        <div style={styles.targetContent}>
          <div style={styles.targetLabel}>MONTHLY REGISTRATION TARGET</div>
          <div style={styles.targetValue}>
            {MONTHLY_TARGET}
            <span> registrations</span>
          </div>
        </div>
        <span style={styles.goalBadge}>Your goal</span>
      </div>

      <div style={styles.mainCard}>
        <div style={styles.progressHeader}>
          <div>
            <div style={styles.sectionTitle}>Monthly Progress</div>
            <p style={styles.sectionSubtitle}>
              Registrations completed against your target
            </p>
          </div>

          <span style={status}>
            {status.label}
          </span>
        </div>

        <div style={styles.countRow}>
          <div style={styles.count}>
            {monthlyRegistrations}
            <span> / {MONTHLY_TARGET}</span>
          </div>

          <div style={styles.percentageBadge}>
            {percentage}%
          </div>
        </div>

        <div style={styles.track}>
          <div
            style={{
              ...styles.fill,
              width: `${progressWidth}%`,
              ...(achieved ? styles.achievedFill : {}),
            }}
          />
        </div>

        <div style={styles.progressFooter}>
          <span>0 registrations</span>
          <span>{MONTHLY_TARGET} registrations</span>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, ...styles.blueCard }}>
          <div style={{ ...styles.statIcon, ...styles.blueIcon }}>
            <span>▤</span>
          </div>
          <span style={styles.statLabel}>Registrations</span>
          <strong style={styles.statNumber}>
            {monthlyRegistrations}
          </strong>
          <span style={styles.statHint}>Completed this month</span>
          <span style={{ ...styles.miniBadge, ...styles.blueBadge }}>
            Monthly total
          </span>
        </div>

        <div style={{ ...styles.statCard, ...styles.purpleCard }}>
          <div style={{ ...styles.statIcon, ...styles.purpleIcon }}>
            <span>◎</span>
          </div>
          <span style={styles.statLabel}>Monthly Target</span>
          <strong style={styles.statNumber}>
            {MONTHLY_TARGET}
          </strong>
          <span style={styles.statHint}>Expected registrations</span>
          <span style={{ ...styles.miniBadge, ...styles.purpleBadge }}>
            Target
          </span>
        </div>

        <div
          style={{
            ...styles.statCard,
            ...(remaining === 0 ? styles.greenCard : styles.orangeCard),
          }}
        >
          <div
            style={{
              ...styles.statIcon,
              ...(remaining === 0 ? styles.greenIcon : styles.orangeIcon),
            }}
          >
            <span>{remaining === 0 ? "✓" : "↗"}</span>
          </div>
          <span style={styles.statLabel}>Remaining</span>
          <strong style={styles.statNumber}>{remaining}</strong>
          <span style={styles.statHint}>
            {remaining === 0
              ? "Monthly goal completed"
              : "More registrations needed"}
          </span>
          <span
            style={{
              ...styles.miniBadge,
              ...(remaining === 0 ? styles.greenBadge : styles.orangeBadge),
            }}
          >
            {remaining === 0 ? "Completed" : "In progress"}
          </span>
        </div>
      </div>

      {achieved && (
        <div style={styles.successBanner}>
          <div style={styles.successIcon}>✓</div>
          <div>
            <strong>Congratulations! Target achieved.</strong>
            <p>
              You have reached your monthly registration target of{" "}
              {MONTHLY_TARGET}.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    display: "grid",
    gap: "20px",
    color: "#172b4d",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "14px",
  },

  teamBadge: {
    display: "inline-block",
    background: "#ede9fe",
    color: "#6d28d9",
    padding: "6px 10px",
    borderRadius: "7px",
    fontSize: "10px",
    fontWeight: "900",
    letterSpacing: "1px",
  },

  title: {
    margin: "10px 0 0",
    color: "#172b4d",
    fontSize: "25px",
    fontWeight: "800",
  },

  subtitle: {
    margin: "7px 0 0",
    color: "#718096",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  monthBadge: {
    background: "#f3e8ff",
    color: "#7e22ce",
    border: "1px solid #e9d5ff",
    borderRadius: "999px",
    padding: "8px 12px",
    fontSize: "11px",
    fontWeight: "800",
  },

  targetCard: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "14px",
    padding: "18px",
    borderRadius: "14px",
    background: "linear-gradient(110deg, #eff6ff, #f5f3ff)",
    border: "1px solid #dbeafe",
  },

  targetIcon: {
    width: "44px",
    height: "44px",
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    borderRadius: "12px",
    background: "#4338ca",
    color: "#ffffff",
    fontSize: "23px",
  },

  targetContent: {
    flex: 1,
    minWidth: "150px",
  },

  targetLabel: {
    color: "#6366a5",
    fontSize: "10px",
    fontWeight: "900",
    letterSpacing: "1px",
    marginBottom: "5px",
  },

  targetValue: {
    color: "#27356d",
    fontSize: "20px",
    fontWeight: "900",
  },

  goalBadge: {
    background: "#ffffff",
    color: "#4338ca",
    border: "1px solid #c7d2fe",
    borderRadius: "999px",
    padding: "7px 11px",
    fontSize: "11px",
    fontWeight: "800",
  },

  mainCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "22px",
    display: "grid",
    gap: "18px",
    boxShadow: "0 6px 20px rgba(30, 41, 59, 0.04)",
    minWidth: 0,
  },

  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  },

  sectionTitle: {
    color: "#1e293b",
    fontSize: "16px",
    fontWeight: "850",
  },

  sectionSubtitle: {
    margin: "5px 0 0",
    color: "#94a3b8",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  achievedBadge: {
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "999px",
    padding: "7px 10px",
    fontSize: "11px",
    fontWeight: "800",
  },

  nearTargetBadge: {
    background: "#fef3c7",
    color: "#92400e",
    borderRadius: "999px",
    padding: "7px 10px",
    fontSize: "11px",
    fontWeight: "800",
  },

  inProgressBadge: {
    background: "#dbeafe",
    color: "#1d4ed8",
    borderRadius: "999px",
    padding: "7px 10px",
    fontSize: "11px",
    fontWeight: "800",
  },

  startBadge: {
    background: "#f3e8ff",
    color: "#7e22ce",
    borderRadius: "999px",
    padding: "7px 10px",
    fontSize: "11px",
    fontWeight: "800",
  },

  countRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },

  count: {
    color: "#1e293b",
    fontSize: "32px",
    fontWeight: "900",
    lineHeight: 1.2,
  },

  percentageBadge: {
    background: "#e0e7ff",
    color: "#4338ca",
    borderRadius: "10px",
    padding: "9px 12px",
    fontSize: "16px",
    fontWeight: "900",
  },

  track: {
    width: "100%",
    height: "11px",
    borderRadius: "999px",
    background: "#edf0f7",
    overflow: "hidden",
  },

  fill: {
    height: "100%",
    background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
    borderRadius: "999px",
    transition: "width 0.3s ease",
  },

  achievedFill: {
    background: "linear-gradient(90deg, #16a34a, #4ade80)",
  },

  progressFooter: {
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
    color: "#94a3b8",
    fontSize: "11px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "16px",
  },

  statCard: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "10px",
    border: "1px solid",
    borderRadius: "14px",
    padding: "18px",
  },

  blueCard: {
    background: "#f0f7ff",
    borderColor: "#dbeafe",
  },

  purpleCard: {
    background: "#f7f3ff",
    borderColor: "#e9d5ff",
  },

  greenCard: {
    background: "#f0fdf4",
    borderColor: "#bbf7d0",
  },

  orangeCard: {
    background: "#fff7ed",
    borderColor: "#fed7aa",
  },

  statIcon: {
    width: "40px",
    height: "40px",
    display: "grid",
    placeItems: "center",
    borderRadius: "11px",
    fontSize: "23px",
    fontWeight: "900",
  },

  blueIcon: {
    background: "#dbeafe",
    color: "#2563eb",
  },

  purpleIcon: {
    background: "#e9d5ff",
    color: "#7e22ce",
  },

  greenIcon: {
    background: "#dcfce7",
    color: "#15803d",
  },

  orangeIcon: {
    background: "#ffedd5",
    color: "#c2410c",
  },

  statLabel: {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "800",
  },

  statNumber: {
    color: "#1e293b",
    fontSize: "30px",
    lineHeight: 1.2,
    fontWeight: "900",
    overflowWrap: "anywhere",
  },

  statHint: {
    color: "#64748b",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  miniBadge: {
    marginTop: "3px",
    padding: "5px 9px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: "800",
  },

  blueBadge: {
    background: "#dbeafe",
    color: "#1d4ed8",
  },

  purpleBadge: {
    background: "#e9d5ff",
    color: "#7e22ce",
  },

  greenBadge: {
    background: "#dcfce7",
    color: "#166534",
  },

  orangeBadge: {
    background: "#ffedd5",
    color: "#9a3412",
  },

  successBanner: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "12px",
    color: "#166534",
  },

  successIcon: {
    width: "34px",
    height: "34px",
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    background: "#16a34a",
    color: "#ffffff",
    borderRadius: "50%",
    fontSize: "18px",
    fontWeight: "900",
  },
};

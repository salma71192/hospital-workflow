
import React, { useMemo } from "react";

const COLORS = {
  navy: "#142d4e",
  text: "#183450",
  teal: "#07856f",
  tealLight: "#d9f4eb",
  blue: "#2d7ff9",
  blueLight: "#eaf2ff",
  purple: "#8b5cf6",
  amber: "#f59e0b",
  amberLight: "#fff4d6",
  red: "#dc4c4c",
  muted: "#64748b",
  border: "#e5eaf1",
  soft: "#f8fafc",
  track: "#e8edf4",
  white: "#ffffff",
};

const SESSION_FIELDS = [
  "qualifying_utilized_sessions",
  "utilized_sessions",
  "utilizedSessions",
  "sessions_utilized",
  "total_utilized_sessions",
  "total_utilized",
  "sessions_used",
  "used_sessions",
  "utilized",
  "sessions_taken",
  "sessions_attended",
  "attended_sessions",
  "used",
];

const APPOINTMENT_FIELDS = [
  "appointments_utilized",
  "appointment_sessions",
  "appointment_count",
  "appointment_sessions_used",
  "appointments_used",
];

const WALKIN_FIELDS = [
  "walkin_utilized_sessions",
  "walk_in_utilized_sessions",
  "walkin_sessions",
  "walk_in_sessions",
  "walkin_count",
  "walk_in_count",
];

function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function getFirstNumber(objects, fields) {
  for (const object of objects) {
    if (!object || typeof object !== "object") continue;

    for (const field of fields) {
      const value = toNumber(object[field]);
      if (value !== null) return value;
    }
  }

  return null;
}

function getPatientObjects(patient) {
  return [
    patient,
    patient?.tracker,
    patient?.session_summary,
    patient?.sessionSummary,
    patient?.utilization,
    patient?.statistics,
    patient?.stats,
    patient?.sessions,
    patient?.appointment_summary,
  ].filter(
    (item) => item && typeof item === "object" && !Array.isArray(item)
  );
}

function calculateUtilizedSessions(patients) {
  if (!Array.isArray(patients)) return 0;

  return patients.reduce((total, patient) => {
    if (!patient || typeof patient !== "object") return total;

    const objects = getPatientObjects(patient);
    const explicitTotal = getFirstNumber(objects, SESSION_FIELDS);

    if (explicitTotal !== null) {
      return total + explicitTotal;
    }

    const appointmentCount = getFirstNumber(
      objects,
      APPOINTMENT_FIELDS
    );

    const walkinCount = getFirstNumber(objects, WALKIN_FIELDS);

    if (appointmentCount !== null && walkinCount !== null) {
      return total + appointmentCount + walkinCount;
    }

    if (appointmentCount !== null) {
      return total + appointmentCount;
    }

    if (walkinCount !== null) {
      return total + walkinCount;
    }

    return total;
  }, 0);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function ProgressBar({ percent, color, height = 10 }) {
  const safePercent = Math.min(Math.max(percent || 0, 0), 100);

  return (
    <div
      style={{
        width: "100%",
        height,
        background: COLORS.track,
        borderRadius: 999,
        overflow: "hidden",
      }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(safePercent)}
    >
      <div
        style={{
          width: `${safePercent}%`,
          height: "100%",
          borderRadius: 999,
          background: color,
          transition: "width 0.4s ease",
        }}
      />
    </div>
  );
}

function CircleIndicator({
  title,
  value,
  subtitle,
  color,
  percent,
  size = 116,
}) {
  const safePercent = Math.min(Math.max(percent || 0, 0), 100);
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset =
    circumference - (safePercent / 100) * circumference;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 12,
        padding: "20px 12px",
        background: COLORS.white,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        minWidth: 0,
      }}
    >
      <div
        style={{
          position: "relative",
          width: size,
          height: size,
          flexShrink: 0,
        }}
        role="img"
        aria-label={`${title}: ${formatNumber(value)}. ${safePercent.toFixed(1)} percent indicator.`}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{
            display: "block",
            transform: "rotate(-90deg)",
          }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={COLORS.track}
            strokeWidth={strokeWidth}
          />

          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transition: "stroke-dashoffset 0.45s ease",
            }}
          />
        </svg>

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 8,
          }}
        >
          <div
            style={{
              fontSize: 21,
              lineHeight: 1.2,
              fontWeight: 850,
              color: COLORS.navy,
              overflowWrap: "anywhere",
              maxWidth: "100%",
            }}
          >
            {formatNumber(value)}
          </div>

          <div
            style={{
              fontSize: 10,
              color: COLORS.muted,
              marginTop: 4,
            }}
          >
            sessions
          </div>
        </div>
      </div>

      <div
        style={{
          color: COLORS.navy,
          fontSize: 13,
          fontWeight: 800,
          lineHeight: 1.4,
        }}
      >
        {title}
      </div>

      <div
        style={{
          color: COLORS.muted,
          fontSize: 11,
          lineHeight: 1.5,
          maxWidth: 180,
        }}
      >
        {subtitle}
      </div>

      <div
        style={{
          color,
          background: `${color}14`,
          borderRadius: 999,
          padding: "5px 10px",
          fontSize: 11,
          fontWeight: 800,
        }}
      >
        {safePercent.toFixed(1)}%
      </div>
    </div>
  );
}

export default function EstimatedTargetCard({
  currentMonth,
  previousMonth,
  currentEvaluations = 0,
  previousEvaluations = 0,
  patients = [],
}) {
  const currentEvalCount = Math.max(
    0,
    Number(currentEvaluations) || 0
  );

  const previousEvalCount = Math.max(
    0,
    Number(previousEvaluations) || 0
  );

  const target = (currentEvalCount + previousEvalCount) * 6;

  const utilizedSessions = useMemo(
    () => calculateUtilizedSessions(patients),
    [patients]
  );

  const utilizationPercent =
    target > 0 ? (utilizedSessions / target) * 100 : 0;

  const progressPercent = Math.min(utilizationPercent, 100);

  const remainingSessions = Math.max(
    target - utilizedSessions,
    0
  );

  const exceededSessions = Math.max(
    utilizedSessions - target,
    0
  );

  const targetReached = target > 0 && utilizedSessions >= target;

  const chartColor =
    utilizationPercent >= 100
      ? COLORS.teal
      : utilizationPercent >= 75
        ? COLORS.blue
        : utilizationPercent >= 40
          ? COLORS.purple
          : COLORS.amber;

  const remainingPercent =
    target > 0 ? (remainingSessions / target) * 100 : 0;

  const styles = {
    card: {
      background: COLORS.white,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 18,
      padding: 24,
      boxShadow: "0 8px 26px rgba(15, 36, 62, 0.06)",
      fontFamily: "Inter, Arial, sans-serif",
      color: COLORS.text,
      minWidth: 0,
      width: "100%",
      boxSizing: "border-box",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 16,
      flexWrap: "wrap",
    },
    eyebrow: {
      color: COLORS.teal,
      fontSize: 12,
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "0.7px",
      marginBottom: 8,
    },
    heading: {
      margin: 0,
      color: COLORS.navy,
      fontSize: 21,
      fontWeight: 850,
    },
    description: {
      margin: "8px 0 0",
      color: COLORS.muted,
      fontSize: 13,
      lineHeight: 1.6,
    },
    targetBox: {
      background: COLORS.blueLight,
      border: "1px solid #d5e5ff",
      borderRadius: 14,
      padding: "14px 18px",
      minWidth: 140,
      boxSizing: "border-box",
    },
    targetLabel: {
      color: COLORS.muted,
      fontSize: 11,
      fontWeight: 750,
      textTransform: "uppercase",
      letterSpacing: "0.4px",
    },
    targetValue: {
      color: COLORS.blue,
      fontSize: 34,
      fontWeight: 850,
      lineHeight: 1.25,
      marginTop: 5,
    },
    metrics: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
      gap: 12,
      marginTop: 24,
    },
    metric: {
      background: COLORS.soft,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 13,
      padding: 16,
      minWidth: 0,
      boxSizing: "border-box",
    },
    metricLabel: {
      color: COLORS.muted,
      fontSize: 12,
      lineHeight: 1.5,
      marginBottom: 9,
    },
    metricValue: {
      color: COLORS.navy,
      fontSize: 25,
      fontWeight: 850,
      lineHeight: 1.3,
      overflowWrap: "anywhere",
    },
    chartSection: {
      marginTop: 24,
      padding: 20,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 16,
      background: "#fbfdff",
      minWidth: 0,
    },
    chartHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 16,
      flexWrap: "wrap",
    },
    chartTitle: {
      color: COLORS.navy,
      fontSize: 15,
      fontWeight: 800,
    },
    chartSubtitle: {
      color: COLORS.muted,
      fontSize: 12,
      marginTop: 5,
      lineHeight: 1.5,
    },
    percentageBadge: {
      background: targetReached ? COLORS.tealLight : COLORS.blueLight,
      color: targetReached ? COLORS.teal : COLORS.blue,
      borderRadius: 12,
      padding: "10px 14px",
      minWidth: 100,
      textAlign: "center",
      boxSizing: "border-box",
    },
    percentageValue: {
      fontSize: 25,
      fontWeight: 850,
      lineHeight: 1.2,
    },
    percentageLabel: {
      fontSize: 10,
      fontWeight: 750,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      marginTop: 4,
    },
    barArea: {
      marginTop: 24,
    },
    barLabels: {
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
      marginBottom: 10,
      color: COLORS.muted,
      fontSize: 12,
      fontWeight: 650,
    },
    mainBar: {
      height: 24,
      background: COLORS.track,
      borderRadius: 999,
      overflow: "hidden",
      position: "relative",
      boxShadow: "inset 0 1px 3px rgba(20, 45, 78, 0.08)",
    },
    mainBarFill: {
      height: "100%",
      width: `${progressPercent}%`,
      background: `linear-gradient(90deg, ${chartColor}, ${targetReached ? "#20b486" : "#69a5ff"})`,
      borderRadius: 999,
      transition: "width 0.45s ease",
    },
    circleGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))",
      gap: 14,
      marginTop: 20,
    },
    status: {
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
      marginTop: 18,
      padding: "12px 14px",
      borderRadius: 12,
      background: targetReached ? COLORS.tealLight : COLORS.blueLight,
      color: targetReached ? COLORS.teal : COLORS.navy,
      fontSize: 12,
      lineHeight: 1.6,
    },
    note: {
      color: COLORS.muted,
      fontSize: 12,
      lineHeight: 1.6,
      margin: "16px 0 0",
    },
  };

  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <div style={{ flex: "1 1 220px" }}>
          <div style={styles.eyebrow}>Performance overview</div>

          <h2 style={styles.heading}>Estimated Target</h2>

          <p style={styles.description}>
            Target based on initial evaluations from the current and
            previous months, multiplied by six.
          </p>
        </div>

        <div style={styles.targetBox}>
          <div style={styles.targetLabel}>Estimated target</div>

          <div style={styles.targetValue}>
            {formatNumber(target)}
          </div>

          <p style={{ ...styles.description, marginTop: 2 }}>
            Sessions
          </p>
        </div>
      </div>

      <div style={styles.metrics}>
        <div
          style={{
            ...styles.metric,
            borderTop: `3px solid ${COLORS.blue}`,
          }}
        >
          <div style={styles.metricLabel}>
            Evaluations — {currentMonth}
          </div>
          <div style={styles.metricValue}>
            {formatNumber(currentEvalCount)}
          </div>
        </div>

        <div
          style={{
            ...styles.metric,
            borderTop: `3px solid ${COLORS.purple}`,
          }}
        >
          <div style={styles.metricLabel}>
            Evaluations — {previousMonth}
          </div>
          <div style={styles.metricValue}>
            {formatNumber(previousEvalCount)}
          </div>
        </div>

        <div
          style={{
            ...styles.metric,
            borderTop: `3px solid ${COLORS.teal}`,
          }}
        >
          <div style={styles.metricLabel}>
            Utilized sessions — Patient Tracker
          </div>
          <div style={styles.metricValue}>
            {formatNumber(utilizedSessions)}
          </div>
        </div>

        <div
          style={{
            ...styles.metric,
            borderTop: `3px solid ${COLORS.amber}`,
          }}
        >
          <div style={styles.metricLabel}>Sessions remaining</div>
          <div style={styles.metricValue}>
            {formatNumber(remainingSessions)}
          </div>

          {exceededSessions > 0 && (
            <p style={styles.description}>
              Target exceeded by {formatNumber(exceededSessions)}.
            </p>
          )}
        </div>
      </div>

      <div style={styles.chartSection}>
        <div style={styles.chartHeader}>
          <div style={{ flex: "1 1 220px" }}>
            <div style={styles.chartTitle}>
              Utilized Sessions vs. Estimated Target
            </div>
            <div style={styles.chartSubtitle}>
              Compare utilized sessions, remaining sessions, and the full
              estimated target.
            </div>
          </div>

          <div style={styles.percentageBadge}>
            <div style={styles.percentageValue}>
              {utilizationPercent.toFixed(1)}%
            </div>
            <div style={styles.percentageLabel}>Target reached</div>
          </div>
        </div>

        <div style={styles.barArea}>
          <div style={styles.barLabels}>
            <span>0 sessions</span>
            <span>{formatNumber(target)} target sessions</span>
          </div>

          <div
            style={styles.mainBar}
            role="progressbar"
            aria-label="Utilized sessions compared with estimated target"
            aria-valuemin={0}
            aria-valuemax={target || 0}
            aria-valuenow={Math.min(utilizedSessions, target || 0)}
          >
            <div style={styles.mainBarFill} />
          </div>
        </div>

        <div style={styles.circleGrid}>
          <CircleIndicator
            title="Utilized Sessions"
            value={utilizedSessions}
            subtitle="Sessions used so far"
            color={chartColor}
            percent={utilizationPercent}
          />

          <CircleIndicator
            title="Sessions Remaining"
            value={remainingSessions}
            subtitle="Sessions needed to reach target"
            color={COLORS.amber}
            percent={remainingPercent}
          />

          <CircleIndicator
            title="Estimated Target"
            value={target}
            subtitle="Total expected sessions"
            color={COLORS.teal}
            percent={target > 0 ? 100 : 0}
          />
        </div>

        <div style={styles.status}>
          <span style={{ fontSize: 17, lineHeight: 1 }}>
            {targetReached ? "✓" : "●"}
          </span>

          <span>
            {target === 0
              ? "An estimated target will appear once evaluation counts are available."
              : targetReached
                ? exceededSessions > 0
                  ? `Target achieved. You have exceeded the estimated target by ${formatNumber(exceededSessions)} sessions.`
                  : "Target achieved. You have utilized all sessions in your estimated target."
                : `${formatNumber(remainingSessions)} more sessions are needed to reach your estimated target.`}
          </span>
        </div>
      </div>

      <p style={styles.note}>
        Utilization percentage = utilized sessions ÷ estimated target × 100.
        The main progress bar is capped at 100%; the displayed percentage
        can exceed 100% when the target is surpassed.
      </p>
    </section>
  );
}

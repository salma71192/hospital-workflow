
import React, { useMemo } from "react";

const SESSIONS_PER_PATIENT = 6;

const COLORS = {
  navy: "#17365d",
  text: "#243b5a",
  muted: "#7185a3",
  border: "#dce6f2",
  background: "#f1f5fb",
  white: "#ffffff",
  blue: "#3268f5",
  blueLight: "#eff6ff",
  blueBorder: "#d6e7ff",
  purple: "#8b32ed",
  purpleLight: "#f7f1ff",
  purpleBorder: "#e8d4ff",
  orange: "#e76a16",
  orangeLight: "#fff7ed",
  orangeBorder: "#ffd8ad",
  green: "#059669",
  greenLight: "#ecfdf5",
  track: "#e8edf6",
};

function getInsurance(patient) {
  const raw = String(
    patient?.insurance_provider ??
      patient?.insurance_company ??
      patient?.insurance ??
      patient?.payer ??
      patient?.insurance_type ??
      ""
  )
    .trim()
    .toLowerCase();

  if (raw.includes("thiqa")) return "Thiqa";
  if (raw.includes("daman")) return "Daman";

  return "Other";
}

function getUsedSessions(patient) {
  const fields = [
    "utilized_sessions",
    "sessions_taken",
    "sessions_used",
    "used_sessions",
    "sessions_utilized",
    "consumed_sessions",
    "completed_sessions",
    "appointments_attended",
  ];

  for (const field of fields) {
    const value = patient?.[field];

    if (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      Number.isFinite(Number(value))
    ) {
      return Math.max(0, Number(value));
    }
  }

  return 0;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 1,
  }).format(value);
}

function getPercentage(value, total) {
  return total > 0 ? (value / total) * 100 : 0;
}

function ProgressBar({ percentage, color = COLORS.blue }) {
  const safePercentage = Math.max(0, Math.min(100, percentage));

  return (
    <div style={styles.progressTrack}>
      <div
        style={{
          ...styles.progressFill,
          width: `${safePercentage}%`,
          background: color,
        }}
      />
    </div>
  );
}

function CircleChart({
  title,
  percentage,
  used,
  allocated,
  color,
  background,
  border,
  icon,
}) {
  const safePercentage = Math.max(0, Math.min(100, percentage));
  const radius = 43;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - safePercentage / 100);

  return (
    <div
      style={{
        ...styles.circleCard,
        background,
        borderColor: border,
      }}
    >
      <div style={styles.circleHeader}>
        <span
          style={{
            ...styles.circleIcon,
            color,
            background: `${color}18`,
          }}
        >
          {icon}
        </span>

        <span style={styles.circleTitle}>{title}</span>
      </div>

      <svg
        viewBox="0 0 120 120"
        width="150"
        height="150"
        role="img"
        aria-label={`${title}: ${percentage.toFixed(1)} percent utilization`}
      >
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={COLORS.track}
          strokeWidth="10"
        />

        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />

        <text
          x="60"
          y="56"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={COLORS.navy}
          fontSize="19"
          fontWeight="800"
        >
          {`${percentage.toFixed(1)}%`}
        </text>

        <text
          x="60"
          y="75"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={COLORS.muted}
          fontSize="9"
        >
          utilized
        </text>
      </svg>

      <div style={styles.circleMetrics}>
        <div style={styles.circleMetric}>
          <span>Sessions used</span>
          <strong>{formatNumber(used)}</strong>
        </div>

        <div style={styles.circleMetric}>
          <span>Total allocation</span>
          <strong>{formatNumber(allocated)}</strong>
        </div>

        <div style={styles.circleMetric}>
          <span>Sessions remaining</span>
          <strong>{formatNumber(Math.max(0, allocated - used))}</strong>
        </div>
      </div>

      {used > allocated && (
        <div style={styles.overAllocation}>
          Usage exceeds the six-session allocation.
        </div>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon,
  color,
  background,
  border,
  tag,
}) {
  return (
    <div
      style={{
        ...styles.metricCard,
        background,
        borderColor: border,
      }}
    >
      <div
        style={{
          ...styles.metricIcon,
          background: `${color}18`,
          color,
        }}
      >
        {icon}
      </div>

      <div style={styles.metricLabel}>{title}</div>
      <div style={styles.metricValue}>{formatNumber(value)}</div>
      <div style={styles.metricDescription}>{description}</div>

      {tag && (
        <span
          style={{
            ...styles.metricTag,
            background: `${color}18`,
            color,
          }}
        >
          {tag}
        </span>
      )}
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    padding: 0,
    color: COLORS.text,
    fontFamily: "Inter, Arial, sans-serif",
  },

  card: {
    background: COLORS.white,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    padding: 26,
    boxShadow: "0 8px 25px rgba(31, 55, 89, 0.045)",
    minWidth: 0,
    boxSizing: "border-box",
  },

  headingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 24,
  },

  title: {
    margin: 0,
    color: COLORS.navy,
    fontSize: 24,
    lineHeight: 1.3,
    fontWeight: 850,
    letterSpacing: "-0.5px",
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 1.7,
    margin: "7px 0 0",
  },

  headerBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    padding: "10px 16px",
    background: COLORS.purpleLight,
    border: `1px solid ${COLORS.purpleBorder}`,
    color: COLORS.purple,
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  allocationBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 18,
    padding: "20px 23px",
    marginBottom: 22,
    border: `1px solid ${COLORS.blueBorder}`,
    borderRadius: 16,
    background: "linear-gradient(110deg, #eff6ff, #f5f3ff)",
  },

  allocationLeft: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    minWidth: 0,
  },

  allocationIcon: {
    width: 54,
    height: 54,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#4938d4",
    color: "#ffffff",
    fontSize: 26,
    flexShrink: 0,
  },

  allocationLabel: {
    color: "#596ba2",
    fontSize: 12,
    fontWeight: 850,
    letterSpacing: "0.8px",
    textTransform: "uppercase",
    marginBottom: 6,
  },

  allocationValue: {
    color: COLORS.navy,
    fontSize: 24,
    fontWeight: 850,
  },

  allocationPill: {
    padding: "10px 15px",
    borderRadius: 24,
    border: "1px solid #cdd7ff",
    background: "#ffffff",
    color: "#4938d4",
    fontSize: 12,
    fontWeight: 800,
  },

  progressCard: {
    background: "#ffffff",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    padding: 26,
    boxShadow: "0 8px 25px rgba(31, 55, 89, 0.045)",
    marginBottom: 24,
    boxSizing: "border-box",
  },

  progressTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 16,
  },

  sectionTitle: {
    color: COLORS.navy,
    fontSize: 18,
    fontWeight: 850,
    margin: 0,
  },

  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 1.6,
  },

  statusBadge: {
    padding: "9px 14px",
    borderRadius: 24,
    background: COLORS.purpleLight,
    color: COLORS.purple,
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  progressValueRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 23,
    marginBottom: 18,
  },

  progressValue: {
    color: COLORS.navy,
    fontSize: 36,
    fontWeight: 850,
    letterSpacing: "-1px",
  },

  percentageBadge: {
    padding: "11px 15px",
    borderRadius: 13,
    background: "#e2e8ff",
    color: "#4338ca",
    fontSize: 18,
    fontWeight: 850,
  },

  progressTrack: {
    width: "100%",
    height: 13,
    background: "#edf1f7",
    borderRadius: 20,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 20,
    transition: "width 0.5s ease",
  },

  progressFooter: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 13,
  },

  metricGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
    gap: 18,
    marginBottom: 28,
  },

  metricCard: {
    minWidth: 0,
    boxSizing: "border-box",
    padding: 23,
    borderRadius: 17,
    border: "1px solid",
  },

  metricIcon: {
    width: 49,
    height: 49,
    borderRadius: 13,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 23,
    fontWeight: 800,
    marginBottom: 16,
  },

  metricLabel: {
    color: "#5e7495",
    fontSize: 14,
    fontWeight: 750,
    marginBottom: 12,
  },

  metricValue: {
    color: COLORS.navy,
    fontSize: 34,
    fontWeight: 850,
    letterSpacing: "-0.8px",
    overflowWrap: "anywhere",
  },

  metricDescription: {
    color: "#607797",
    fontSize: 13,
    lineHeight: 1.6,
    marginTop: 8,
  },

  metricTag: {
    display: "inline-flex",
    marginTop: 16,
    padding: "7px 11px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 850,
  },

  subsection: {
    marginTop: 28,
  },

  subsectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },

  subsectionTitle: {
    color: COLORS.navy,
    fontSize: 18,
    fontWeight: 850,
    margin: 0,
  },

  subsectionDescription: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 5,
    lineHeight: 1.6,
  },

  insuranceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
    gap: 18,
  },

  insuranceCard: {
    padding: 20,
    border: "1px solid",
    borderRadius: 15,
    minWidth: 0,
    boxSizing: "border-box",
  },

  insuranceTop: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 15,
  },

  insuranceDot: {
    width: 11,
    height: 11,
    borderRadius: "50%",
    flexShrink: 0,
  },

  insuranceName: {
    color: COLORS.navy,
    fontWeight: 850,
    fontSize: 15,
  },

  insuranceCount: {
    color: COLORS.navy,
    fontSize: 30,
    fontWeight: 850,
  },

  insuranceMeta: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 12,
  },

  circleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
    gap: 18,
  },

  circleCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    padding: 20,
    border: "1px solid",
    borderRadius: 16,
    minWidth: 0,
    boxSizing: "border-box",
  },

  circleHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 9,
    width: "100%",
  },

  circleIcon: {
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 850,
  },

  circleTitle: {
    color: COLORS.navy,
    fontSize: 15,
    fontWeight: 850,
    textAlign: "center",
  },

  circleMetrics: {
    width: "100%",
    marginTop: 1,
  },

  circleMetric: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    padding: "11px 0",
    borderTop: "1px solid rgba(148, 163, 184, 0.23)",
    color: "#657b99",
    fontSize: 12,
  },

  circleMetricStrong: {
    color: COLORS.navy,
    fontSize: 13,
    fontWeight: 850,
  },

  overAllocation: {
    color: "#b45309",
    fontSize: 11,
    lineHeight: 1.5,
    textAlign: "center",
    padding: 9,
    borderRadius: 9,
    background: "#fff7ed",
  },

  note: {
    marginTop: 22,
    padding: 15,
    border: `1px solid ${COLORS.border}`,
    background: "#f8fafc",
    borderRadius: 12,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 1.8,
  },

  empty: {
    padding: 26,
    background: "#f8fafc",
    border: `1px dashed ${COLORS.border}`,
    borderRadius: 14,
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 1.7,
    textAlign: "center",
  },

  error: {
    padding: 16,
    borderRadius: 12,
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#b91c1c",
    fontSize: 13,
  },
};

export default function InsuranceUtilizationChart({
  patients = [],
  loading = false,
}) {
  const summary = useMemo(() => {
    const safePatients = Array.isArray(patients) ? patients : [];

    const groups = {
      Thiqa: { patients: 0, used: 0 },
      Daman: { patients: 0, used: 0 },
      Other: { patients: 0, used: 0 },
    };

    safePatients.forEach((patient) => {
      const insurance = getInsurance(patient);
      groups[insurance].patients += 1;
      groups[insurance].used += getUsedSessions(patient);
    });

    Object.values(groups).forEach((group) => {
      group.allocated = group.patients * SESSIONS_PER_PATIENT;
      group.remaining = Math.max(0, group.allocated - group.used);
      group.utilization = getPercentage(group.used, group.allocated);
    });

    const totalPatients = safePatients.length;
    const totalAllocated = totalPatients * SESSIONS_PER_PATIENT;
    const totalUsed = Object.values(groups).reduce(
      (sum, group) => sum + group.used,
      0
    );

    const totalRemaining = Math.max(0, totalAllocated - totalUsed);

    return {
      groups,
      totalPatients,
      totalAllocated,
      totalUsed,
      totalRemaining,
      totalUtilization: getPercentage(totalUsed, totalAllocated),
      remainingPercentage: getPercentage(totalRemaining, totalAllocated),
    };
  }, [patients]);

  const thiqa = summary.groups.Thiqa;
  const daman = summary.groups.Daman;
  const other = summary.groups.Other;

  const progressStatus =
    summary.totalPatients === 0
      ? "Getting started"
      : summary.totalUtilization >= 100
        ? "Allocation reached"
        : "In progress";

  return (
    <section style={styles.page}>
      <div style={styles.headingRow}>
        <div>
          <h2 style={styles.title}>Insurance & Session Utilization</h2>
          <p style={styles.subtitle}>
            Track patient allocations, sessions used, and insurance utilization.
          </p>
        </div>

        <span style={styles.headerBadge}>SESSION REPORT</span>
      </div>

      <div style={styles.allocationBanner}>
        <div style={styles.allocationLeft}>
          <div style={styles.allocationIcon}>✦</div>

          <div>
            <div style={styles.allocationLabel}>SESSION ALLOCATION</div>
            <div style={styles.allocationValue}>
              {SESSIONS_PER_PATIENT} sessions per patient
            </div>
          </div>
        </div>

        <span style={styles.allocationPill}>Monthly overview</span>
      </div>

      {loading ? (
        <div style={styles.empty}>
          Loading insurance and session data...
        </div>
      ) : summary.totalPatients === 0 ? (
        <div style={styles.empty}>
          No patient records are available for this physiotherapist.
        </div>
      ) : (
        <>
          <div style={styles.progressCard}>
            <div style={styles.progressTop}>
              <div>
                <h3 style={styles.sectionTitle}>Overall Session Progress</h3>
                <div style={styles.sectionSubtitle}>
                  Sessions used compared with the total six-session allocation.
                </div>
              </div>

              <span style={styles.statusBadge}>{progressStatus}</span>
            </div>

            <div style={styles.progressValueRow}>
              <div style={styles.progressValue}>
                {formatNumber(summary.totalUsed)} /{" "}
                {formatNumber(summary.totalAllocated)}
              </div>

              <div style={styles.percentageBadge}>
                {summary.totalUtilization.toFixed(1)}%
              </div>
            </div>

            <ProgressBar percentage={summary.totalUtilization} />

            <div style={styles.progressFooter}>
              <span>
                {formatNumber(summary.totalUsed)} sessions used
              </span>
              <span>
                {formatNumber(summary.totalAllocated)} sessions allocated
              </span>
            </div>
          </div>

          <div style={styles.metricGrid}>
            <MetricCard
              title="Total Patients"
              value={summary.totalPatients}
              description="Patients included in this report"
              icon="▤"
              color={COLORS.blue}
              background={COLORS.blueLight}
              border={COLORS.blueBorder}
              tag="Patient total"
            />

            <MetricCard
              title="Sessions Allocated"
              value={summary.totalAllocated}
              description={`${SESSIONS_PER_PATIENT} sessions per patient`}
              icon="◎"
              color={COLORS.purple}
              background={COLORS.purpleLight}
              border={COLORS.purpleBorder}
              tag="Total allocation"
            />

            <MetricCard
              title="Sessions Remaining"
              value={summary.totalRemaining}
              description="Allocated sessions not yet used"
              icon="↗"
              color={COLORS.orange}
              background={COLORS.orangeLight}
              border={COLORS.orangeBorder}
              tag="Remaining"
            />
          </div>

          <div style={styles.subsection}>
            <div style={styles.subsectionHeader}>
              <div>
                <h3 style={styles.subsectionTitle}>
                  Patient Distribution by Insurance
                </h3>
                <div style={styles.subsectionDescription}>
                  Number of patients assigned to each insurance group.
                </div>
              </div>
            </div>

            <div style={styles.insuranceGrid}>
              {[
                {
                  name: "Thiqa",
                  group: thiqa,
                  color: COLORS.blue,
                  background: COLORS.blueLight,
                  border: COLORS.blueBorder,
                },
                {
                  name: "Daman",
                  group: daman,
                  color: COLORS.green,
                  background: COLORS.greenLight,
                  border: "#b7f0d6",
                },
                {
                  name: "Other",
                  group: other,
                  color: COLORS.purple,
                  background: COLORS.purpleLight,
                  border: COLORS.purpleBorder,
                },
              ].map(({ name, group, color, background, border }) => (
                <div
                  key={name}
                  style={{
                    ...styles.insuranceCard,
                    background,
                    borderColor: border,
                  }}
                >
                  <div style={styles.insuranceTop}>
                    <span
                      style={{
                        ...styles.insuranceDot,
                        background: color,
                      }}
                    />
                    <span style={styles.insuranceName}>{name}</span>
                  </div>

                  <div style={styles.insuranceCount}>
                    {formatNumber(group.patients)}
                  </div>

                  <ProgressBar
                    percentage={getPercentage(
                      group.patients,
                      summary.totalPatients
                    )}
                    color={color}
                  />

                  <div style={styles.insuranceMeta}>
                    <span>Share of patients</span>
                    <strong style={styles.circleMetricStrong}>
                      {getPercentage(
                        group.patients,
                        summary.totalPatients
                      ).toFixed(1)}
                      %
                    </strong>
                  </div>

                  <div style={styles.insuranceMeta}>
                    <span>Sessions used</span>
                    <strong style={styles.circleMetricStrong}>
                      {formatNumber(group.used)}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.subsection}>
            <div style={styles.subsectionHeader}>
              <div>
                <h3 style={styles.subsectionTitle}>
                  Session Utilization by Insurance
                </h3>
                <div style={styles.subsectionDescription}>
                  Percentage of allocated sessions that have been used.
                </div>
              </div>
            </div>

            <div style={styles.circleGrid}>
              <CircleChart
                title="Overall Utilization"
                percentage={summary.totalUtilization}
                used={summary.totalUsed}
                allocated={summary.totalAllocated}
                color={COLORS.purple}
                background="#ffffff"
                border={COLORS.border}
                icon="◎"
              />

              <CircleChart
                title="Thiqa Utilization"
                percentage={thiqa.utilization}
                used={thiqa.used}
                allocated={thiqa.allocated}
                color={COLORS.blue}
                background={COLORS.blueLight}
                border={COLORS.blueBorder}
                icon="▤"
              />

              <CircleChart
                title="Daman Utilization"
                percentage={daman.utilization}
                used={daman.used}
                allocated={daman.allocated}
                color={COLORS.green}
                background={COLORS.greenLight}
                border="#b7f0d6"
                icon="↗"
              />
            </div>
          </div>

          <div style={styles.note}>
            <strong>Calculation:</strong> Total allocation equals the number of
            patient records multiplied by six sessions. Utilization equals
            sessions used divided by allocated sessions, multiplied by 100.
            Patients categorized as Other are included in the overall totals.
            If recorded usage exceeds allocation, the percentage can exceed
            100%; the circular chart is capped at 100% for display.
          </div>
        </>
      )}
    </section>
  );
}

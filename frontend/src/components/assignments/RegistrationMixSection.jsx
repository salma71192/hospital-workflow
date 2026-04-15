import React from "react";
import RegistrationMixLegendItem from "./RegistrationMixLegendItem";

export default function RegistrationMixSection({ stats }) {
  return (
    <div style={styles.card}>
      <div style={styles.sectionHeader}>
        <div>
          <div style={styles.sectionTitle}>Registration Mix</div>
          <div style={styles.sectionSubtext}>
            Category distribution for current filtered results
          </div>
        </div>
        <div style={styles.totalPill}>{stats.total} total</div>
      </div>

      <div style={styles.topSummary}>
        <SoftStat label="Walk In" value={stats.walkIn} />
        <SoftStat label="Has Appointment" value={stats.appointment} />
        <SoftStat label="Initial Eval" value={stats.initialEval} />
        <SoftStat label="No Eligibility" value={stats.noEligibility} />
      </div>

      <div style={styles.stackWrap}>
        <div style={styles.stackBar}>
          <div
            style={{
              ...styles.stackSegment,
              width: `${stats.walkInPct}%`,
              background: tones.blue.fill,
            }}
          />
          <div
            style={{
              ...styles.stackSegment,
              width: `${stats.appointmentPct}%`,
              background: tones.green.fill,
            }}
          />
          <div
            style={{
              ...styles.stackSegment,
              width: `${stats.initialEvalPct}%`,
              background: tones.purple.fill,
            }}
          />
          <div
            style={{
              ...styles.stackSegment,
              width: `${stats.noEligibilityPct}%`,
              background: tones.amber.fill,
            }}
          />
          <div
            style={{
              ...styles.stackSegment,
              width: `${stats.otherPct}%`,
              background: tones.slate.fill,
            }}
          />
        </div>

        <div style={styles.legendGrid}>
          <RegistrationMixLegendItem
            label="Walk In"
            value={stats.walkIn}
            percent={stats.walkInPct}
            color={tones.blue.fill}
          />
          <RegistrationMixLegendItem
            label="Has Appointment"
            value={stats.appointment}
            percent={stats.appointmentPct}
            color={tones.green.fill}
          />
          <RegistrationMixLegendItem
            label="Initial Eval"
            value={stats.initialEval}
            percent={stats.initialEvalPct}
            color={tones.purple.fill}
          />
          <RegistrationMixLegendItem
            label="No Eligibility"
            value={stats.noEligibility}
            percent={stats.noEligibilityPct}
            color={tones.amber.fill}
          />
          <RegistrationMixLegendItem
            label="Other"
            value={stats.other}
            percent={stats.otherPct}
            color={tones.slate.fill}
          />
        </div>
      </div>
    </div>
  );
}

function SoftStat({ label, value }) {
  return (
    <div style={styles.softStat}>
      <div style={styles.softStatLabel}>{label}</div>
      <div style={styles.softStatValue}>{value}</div>
    </div>
  );
}

const tones = {
  blue: { fill: "#60a5fa" },
  green: { fill: "#34d399" },
  purple: { fill: "#a78bfa" },
  amber: { fill: "#fbbf24" },
  slate: { fill: "#cbd5e1" },
};

const styles = {
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "16px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.04)",
    display: "grid",
    gap: "14px",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    flexWrap: "wrap",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a",
  },
  sectionSubtext: {
    marginTop: "2px",
    fontSize: "13px",
    color: "#64748b",
  },
  totalPill: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    color: "#334155",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: "800",
  },
  topSummary: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "10px",
  },
  softStat: {
    background: "#fafafa",
    border: "1px solid #f1f5f9",
    borderRadius: "14px",
    padding: "12px 14px",
    display: "grid",
    gap: "4px",
  },
  softStatLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
  },
  softStatValue: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f172a",
  },
  stackWrap: {
    display: "grid",
    gap: "14px",
  },
  stackBar: {
    width: "100%",
    height: "14px",
    background: "#eef2f7",
    borderRadius: "999px",
    overflow: "hidden",
    display: "flex",
  },
  stackSegment: {
    height: "100%",
  },
  legendGrid: {
    display: "grid",
    gap: "10px",
  },
};
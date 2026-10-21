import React, { useMemo } from "react";

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

function getNumber(patient, fields) {
  for (const field of fields) {
    const value = patient?.[field];

    if (value !== null && value !== undefined && value !== "") {
      const number = Number(value);
      if (Number.isFinite(number) && number >= 0) return number;
    }
  }

  return 0;
}

function getApprovedSessions(patient) {
  return getNumber(patient, [
    "approved_sessions",
    "sessions_approved",
    "total_approved_sessions",
    "authorized_sessions",
    "sessions_authorized",
    "approved",
  ]);
}

function getUsedSessions(patient) {
  return getNumber(patient, [
    "sessions_taken",
    "sessions_used",
    "used_sessions",
    "utilized_sessions",
    "appointments_attended",
  ]);
}

export default function InsuranceUtilizationChart({
  patients = [],
  loading = false,
}) {
  const summary = useMemo(() => {
    const groups = {
      Thiqa: { patients: 0, approved: 0, used: 0 },
      Daman: { patients: 0, approved: 0, used: 0 },
      Other: { patients: 0, approved: 0, used: 0 },
    };

    patients.forEach((patient) => {
      const group = groups[getInsurance(patient)];

      group.patients += 1;
      group.approved += getApprovedSessions(patient);
      group.used += getUsedSessions(patient);
    });

    const totalPatients = patients.length;
    const totalApproved = Object.values(groups).reduce(
      (sum, group) => sum + group.approved,
      0
    );
    const totalUsed = Object.values(groups).reduce(
      (sum, group) => sum + group.used,
      0
    );

    return {
      groups,
      totalPatients,
      totalApproved,
      totalUsed,
      totalUtilization:
        totalApproved > 0 ? (totalUsed / totalApproved) * 100 : null,
    };
  }, [patients]);

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
    metricGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
      gap: 12,
      marginBottom: 25,
    },
    metric: {
      padding: 16,
      borderRadius: 13,
      border: "1px solid #e8edf4",
      background: "#f8fafc",
      minWidth: 0,
    },
    metricLabel: {
      color: "#64748b",
      fontSize: 12,
      marginBottom: 8,
    },
    metricValue: {
      color: "#16334f",
      fontSize: 25,
      fontWeight: 850,
    },
    sectionTitle: {
      color: "#334155",
      fontSize: 14,
      fontWeight: 800,
      marginBottom: 15,
    },
    row: {
      display: "grid",
      gap: 8,
      marginBottom: 20,
    },
    rowHeading: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
      color: "#334155",
      fontSize: 13,
    },
    track: {
      height: 10,
      borderRadius: 999,
      background: "#edf2f7",
      overflow: "hidden",
    },
    note: {
      color: "#64748b",
      fontSize: 12,
      lineHeight: 1.6,
      marginTop: 16,
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

  const thiqa = summary.groups.Thiqa;
  const daman = summary.groups.Daman;

  const thiqaShare = summary.totalPatients
    ? (thiqa.patients / summary.totalPatients) * 100
    : 0;

  const damanShare = summary.totalPatients
    ? (daman.patients / summary.totalPatients) * 100
    : 0;

  const utilization = (group) =>
    group.approved > 0 ? (group.used / group.approved) * 100 : null;

  const renderBar = (label, value, color, countLabel) => (
    <div style={styles.row} key={label}>
      <div style={styles.rowHeading}>
        <span>{label}</span>
        <strong>{countLabel}</strong>
      </div>

      <div
        style={styles.track}
        role="img"
        aria-label={`${label}: ${value.toFixed(1)} percent`}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(Math.max(value, 0), 100)}%`,
            background: color,
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  );

  return (
    <section style={styles.card}>
      <h2 style={styles.title}>Insurance & Session Utilization</h2>

      <p style={styles.subtitle}>
        Compare Thiqa and Daman coverage and track sessions used against
        approved sessions.
      </p>

      {loading ? (
        <div style={styles.empty}>Loading insurance and session data...</div>
      ) : summary.totalPatients === 0 ? (
        <div style={styles.empty}>
          No patient records are available for this physiotherapist.
        </div>
      ) : (
        <>
          <div style={styles.metricGrid}>
            <div style={styles.metric}>
              <div style={styles.metricLabel}>Thiqa patients</div>
              <div style={styles.metricValue}>
                {thiqa.patients}
              </div>
              <div style={{ color: "#64748b", fontSize: 12 }}>
                {thiqaShare.toFixed(1)}% of patients
              </div>
            </div>

            <div style={styles.metric}>
              <div style={styles.metricLabel}>Daman patients</div>
              <div style={styles.metricValue}>
                {daman.patients}
              </div>
              <div style={{ color: "#64748b", fontSize: 12 }}>
                {damanShare.toFixed(1)}% of patients
              </div>
            </div>

            <div style={styles.metric}>
              <div style={styles.metricLabel}>Overall utilization</div>
              <div style={styles.metricValue}>
                {summary.totalUtilization === null
                  ? "—"
                  : `${summary.totalUtilization.toFixed(1)}%`}
              </div>
              <div style={{ color: "#64748b", fontSize: 12 }}>
                {summary.totalUsed} of {summary.totalApproved} sessions
              </div>
            </div>
          </div>

          <div style={styles.sectionTitle}>
            Patient distribution by insurance
          </div>

          {renderBar(
            "Thiqa",
            thiqaShare,
            "#2563eb",
            `${thiqa.patients} patients · ${thiqaShare.toFixed(1)}%`
          )}

          {renderBar(
            "Daman",
            damanShare,
            "#10b981",
            `${daman.patients} patients · ${damanShare.toFixed(1)}%`
          )}

          <div style={{ ...styles.sectionTitle, marginTop: 26 }}>
            Session utilization by insurance
          </div>

          {renderBar(
            "Thiqa utilization",
            utilization(thiqa) ?? 0,
            "#2563eb",
            utilization(thiqa) === null
              ? "No approved-session data"
              : `${thiqa.used} / ${thiqa.approved} · ${utilization(thiqa).toFixed(1)}%`
          )}

          {renderBar(
            "Daman utilization",
            utilization(daman) ?? 0,
            "#10b981",
            utilization(daman) === null
              ? "No approved-session data"
              : `${daman.used} / ${daman.approved} · ${utilization(daman).toFixed(1)}%`
          )}

          <p style={styles.note}>
            Patients with other or unrecognized insurance are included in
            the overall utilization calculation but not in the Thiqa/Daman
            comparison. A dash means approved-session data is unavailable
            or zero.
          </p>
        </>
      )}
    </section>
  );
}
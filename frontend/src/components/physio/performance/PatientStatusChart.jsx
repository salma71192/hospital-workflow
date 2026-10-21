import React, { useMemo } from "react";

const COLORS = [
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#64748b",
  "#ec4899",
];

function getStatus(patient) {
  const raw =
    patient?.status ??
    patient?.patient_status ??
    patient?.risk_level ??
    patient?.priority ??
    "";

  return String(raw).trim() || "Not specified";
}

export default function PatientStatusChart({
  patients = [],
  loading = false,
}) {
  const rows = useMemo(() => {
    const counts = new Map();

    patients.forEach((patient) => {
      const status = getStatus(patient);
      counts.set(status, (counts.get(status) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
  }, [patients]);

  const total = rows.reduce((sum, row) => sum + row.count, 0);

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
    row: {
      display: "grid",
      gap: 8,
      marginBottom: 19,
    },
    rowHeading: {
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
      alignItems: "center",
      color: "#334155",
      fontSize: 13,
    },
    track: {
      height: 10,
      borderRadius: 999,
      background: "#edf2f7",
      overflow: "hidden",
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

  return (
    <section style={styles.card}>
      <h2 style={styles.title}>Patient Status</h2>

      <p style={styles.subtitle}>
        Distribution of patients by the status recorded in their patient
        files.
      </p>

      {loading ? (
        <div style={styles.empty}>Loading patient status...</div>
      ) : total === 0 ? (
        <div style={styles.empty}>
          No patient status records are available for this physiotherapist.
        </div>
      ) : (
        <>
          <div
            style={{
              color: "#16334f",
              fontSize: 30,
              fontWeight: 850,
              marginBottom: 22,
            }}
          >
            {total.toLocaleString()}
            <span
              style={{
                color: "#64748b",
                fontSize: 13,
                fontWeight: 500,
                marginLeft: 8,
              }}
            >
              patients
            </span>
          </div>

          {rows.map((row, index) => {
            const percentage = (row.count / total) * 100;

            return (
              <div key={row.status} style={styles.row}>
                <div style={styles.rowHeading}>
                  <span>{row.status}</span>
                  <strong>
                    {row.count} ({percentage.toFixed(1)}%)
                  </strong>
                </div>

                <div
                  style={styles.track}
                  role="img"
                  aria-label={`${row.status}: ${percentage.toFixed(1)}%`}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${percentage}%`,
                      background: COLORS[index % COLORS.length],
                      borderRadius: 999,
                      transition: "width 250ms ease",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </>
      )}
    </section>
  );
}
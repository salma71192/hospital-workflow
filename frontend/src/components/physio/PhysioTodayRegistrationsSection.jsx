import React, { useMemo, useState } from "react";

function getPercent(value, total) {
  if (!total) return 0;
  return Math.round((Number(value || 0) / Number(total)) * 100);
}

function getCategoryColor(key) {
  if (key === "walk_in") {
    return {
      dot: "#60a5fa",
      bar: "#60a5fa",
      soft: "#eff6ff",
      text: "#1d4ed8",
    };
  }

  if (key === "appointment") {
    return {
      dot: "#34d399",
      bar: "#34d399",
      soft: "#ecfdf5",
      text: "#047857",
    };
  }

  if (key === "initial_eval") {
    return {
      dot: "#a78bfa",
      bar: "#a78bfa",
      soft: "#f5f3ff",
      text: "#6d28d9",
    };
  }

  if (key === "no_eligibility") {
    return {
      dot: "#fbbf24",
      bar: "#fbbf24",
      soft: "#fffbeb",
      text: "#b45309",
    };
  }

  return {
    dot: "#cbd5e1",
    bar: "#cbd5e1",
    soft: "#f8fafc",
    text: "#475569",
  };
}

export default function PhysioTodayRegistrationsSection({
  walkInAssignments = [],
  initialEvalAssignments = [],
  taskWithoutEligibilityAssignments = [],
  appointmentCount = 0,
}) {
  const [expanded, setExpanded] = useState(false);

  const stats = useMemo(() => {
    const walkIn = walkInAssignments.length;
    const initialEval = initialEvalAssignments.length;
    const noEligibility = taskWithoutEligibilityAssignments.length;
    const appointment = Number(appointmentCount || 0);

    const total = walkIn + initialEval + noEligibility + appointment;
    const other = Math.max(
      total - walkIn - appointment - initialEval - noEligibility,
      0
    );

    return {
      total,
      walkIn,
      appointment,
      initialEval,
      noEligibility,
      other,
    };
  }, [
    walkInAssignments,
    initialEvalAssignments,
    taskWithoutEligibilityAssignments,
    appointmentCount,
  ]);

  const items = [
    {
      key: "walk_in",
      label: "Walk In",
      count: stats.walkIn,
      percent: getPercent(stats.walkIn, stats.total),
    },
    {
      key: "appointment",
      label: "Has Appointment",
      count: stats.appointment,
      percent: getPercent(stats.appointment, stats.total),
    },
    {
      key: "initial_eval",
      label: "Initial Eval",
      count: stats.initialEval,
      percent: getPercent(stats.initialEval, stats.total),
    },
    {
      key: "no_eligibility",
      label: "No Eligibility",
      count: stats.noEligibility,
      percent: getPercent(stats.noEligibility, stats.total),
    },
    {
      key: "other",
      label: "Other",
      count: stats.other,
      percent: getPercent(stats.other, stats.total),
    },
  ];

  return (
    <div style={styles.card}>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        style={styles.headerButton}
      >
        <div>
          <div style={styles.title}>Today Registrations</div>
          <div style={styles.subtitle}>
            Category distribution for this physio today
          </div>
        </div>

        <div style={styles.headerRight}>
          <div style={styles.totalBadge}>{stats.total} total</div>
          <div
            style={{
              ...styles.chevron,
              transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            }}
          >
            ❯
          </div>
        </div>
      </button>

      <div style={styles.progressTrack}>
        {items.map((item) => {
          const colors = getCategoryColor(item.key);

          return (
            <div
              key={item.key}
              style={{
                ...styles.progressSegment,
                width: `${item.percent}%`,
                background: colors.bar,
              }}
            />
          );
        })}
      </div>

      <div style={styles.list}>
        {items.map((item) => {
          const colors = getCategoryColor(item.key);

          return (
            <div key={item.key} style={styles.row}>
              <div style={styles.left}>
                <span
                  style={{
                    ...styles.dot,
                    background: colors.dot,
                  }}
                />
                <span style={styles.label}>{item.label}</span>
              </div>

              <div style={styles.right}>
                <span
                  style={{
                    ...styles.percent,
                    background: colors.soft,
                    color: colors.text,
                  }}
                >
                  {item.percent}%
                </span>
                <span style={styles.count}>{item.count}</span>
              </div>
            </div>
          );
        })}
      </div>

      {expanded ? (
        <div style={styles.detailWrap}>
          <RegistrationTable title="Walk In" rows={walkInAssignments} />
          <RegistrationTable title="Initial Eval" rows={initialEvalAssignments} />
          <RegistrationTable
            title="No Eligibility"
            rows={taskWithoutEligibilityAssignments}
          />
        </div>
      ) : null}
    </div>
  );
}

function RegistrationTable({ title, rows = [] }) {
  return (
    <div style={styles.innerCard}>
      <div style={styles.innerTitle}>
        {title} ({rows.length})
      </div>

      {rows.length === 0 ? (
        <div style={styles.emptyState}>No records found.</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Patient</th>
                <th style={styles.th}>File Number</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Created By</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td style={styles.tdBold}>{item.patient_name}</td>
                  <td style={styles.td}>{item.patient_file_id}</td>
                  <td style={styles.td}>{item.assignment_date || "-"}</td>
                  <td style={styles.td}>{item.created_by_name || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "18px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.04)",
    display: "grid",
    gap: "16px",
  },
  headerButton: {
    width: "100%",
    border: "none",
    background: "transparent",
    padding: 0,
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    textAlign: "left",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  title: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    marginTop: "4px",
    fontSize: "14px",
    color: "#64748b",
  },
  totalBadge: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },
  chevron: {
    width: "38px",
    height: "38px",
    borderRadius: "999px",
    background: "#e2e8f0",
    border: "1px solid #cbd5e1",
    color: "#0f172a",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "900",
    lineHeight: 1,
    boxShadow: "0 2px 6px rgba(15, 23, 42, 0.08)",
    transition: "transform 0.2s ease, background 0.2s ease",
  },
  progressTrack: {
    width: "100%",
    height: "14px",
    background: "#e2e8f0",
    borderRadius: "999px",
    overflow: "hidden",
    display: "flex",
  },
  progressSegment: {
    height: "100%",
  },
  list: {
    display: "grid",
    gap: "2px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "12px 0",
    borderBottom: "1px solid #eef2f7",
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "999px",
    flexShrink: 0,
  },
  label: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#334155",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  percent: {
    minWidth: "62px",
    textAlign: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "800",
  },
  count: {
    minWidth: "18px",
    textAlign: "right",
    fontSize: "15px",
    fontWeight: "800",
    color: "#475569",
  },
  detailWrap: {
    display: "grid",
    gap: "14px",
  },
  innerCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "14px",
    background: "#fcfcfd",
    display: "grid",
    gap: "12px",
  },
  innerTitle: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a",
  },
  tableWrap: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    background: "#fff",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "650px",
  },
  th: {
    textAlign: "left",
    padding: "12px 14px",
    background: "#f8fafc",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "800",
    borderBottom: "1px solid #e2e8f0",
  },
  td: {
    padding: "12px 14px",
    color: "#475569",
    fontSize: "14px",
    borderBottom: "1px solid #eef2f7",
  },
  tdBold: {
    padding: "12px 14px",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: "700",
    borderBottom: "1px solid #eef2f7",
  },
  emptyState: {
    padding: "14px",
    borderRadius: "12px",
    background: "#f8fafc",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
    fontWeight: "600",
  },
};
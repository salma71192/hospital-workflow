import React from "react";

export default function PhysioStatisticsTable({
  stats,
  title = "Physio Statistics",
}) {
  const rows = Array.isArray(stats?.rows) ? stats.rows : [];
  const totals = stats?.totals || null;
  const dateLabel = stats?.date || "";

  if (!rows.length) {
    return (
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <div style={styles.title}>{title}</div>
            {dateLabel ? <div style={styles.subtext}>{dateLabel}</div> : null}
          </div>
        </div>

        <div style={styles.emptyState}>No statistics available for today.</div>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>{title}</div>
          {dateLabel ? <div style={styles.subtext}>{dateLabel}</div> : null}
        </div>

        <div style={styles.badge}>
          {rows.length} Physio
        </div>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Therapist</th>
              <th style={styles.th}>Available Slots</th>
              <th style={styles.th}>Booked</th>
              <th style={styles.th}>Booked %</th>
              <th style={styles.th}>Walk In</th>
              <th style={styles.th}>Seen</th>
              <th style={styles.th}>Initial Eval</th>
              <th style={styles.th}>No Show</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => {
              const available = Number(row?.available_slots || 0);
              const booked = Number(row?.booked || 0);
              const walkIn = Number(row?.walk_in || 0);
              const seen = Number(row?.seen || 0);
              const initialEval = Number(row?.initial_eval || 0);
              const noShow = Number(row?.no_show || 0);

              const percent =
                available > 0
                  ? Math.min(100, Math.round((booked / available) * 100))
                  : 0;

              return (
                <tr key={row?.therapist_id || row?.therapist_name}>
                  <td style={styles.tdBold}>{row?.therapist_name || "-"}</td>
                  <td style={styles.td}>{available}</td>
                  <td style={styles.td}>{booked}</td>
                  <td style={styles.td}>
                    <div style={styles.percentWrap}>
                      <div style={styles.progressTrack}>
                        <div
                          style={{
                            ...styles.progressFill,
                            width: `${percent}%`,
                          }}
                        />
                      </div>
                      <span style={styles.percentText}>{percent}%</span>
                    </div>
                  </td>
                  <td style={styles.td}>{walkIn}</td>
                  <td style={styles.td}>{seen}</td>
                  <td style={styles.td}>{initialEval}</td>
                  <td style={styles.td}>{noShow}</td>
                </tr>
              );
            })}

            {totals ? (
              <tr style={styles.totalRow}>
                <td style={styles.totalCell}>Total</td>
                <td style={styles.totalCell}>{Number(totals.available_slots || 0)}</td>
                <td style={styles.totalCell}>{Number(totals.booked || 0)}</td>
                <td style={styles.totalCell}>-</td>
                <td style={styles.totalCell}>{Number(totals.walk_in || 0)}</td>
                <td style={styles.totalCell}>{Number(totals.seen || 0)}</td>
                <td style={styles.totalCell}>{Number(totals.initial_eval || 0)}</td>
                <td style={styles.totalCell}>{Number(totals.no_show || 0)}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
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
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    flexWrap: "wrap",
  },
  title: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f172a",
  },
  subtext: {
    marginTop: "4px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#64748b",
  },
  badge: {
    background: "#fdf2f8",
    color: "#be185d",
    border: "1px solid #fbcfe8",
    borderRadius: "999px",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },
  tableWrap: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
  },
  table: {
    width: "100%",
    minWidth: "1100px",
    borderCollapse: "collapse",
    background: "#fff",
  },
  th: {
    textAlign: "left",
    padding: "14px 16px",
    background: "#f8fafc",
    color: "#334155",
    fontSize: "14px",
    fontWeight: "800",
    borderBottom: "1px solid #e2e8f0",
  },
  td: {
    padding: "14px 16px",
    color: "#475569",
    fontSize: "14px",
    borderBottom: "1px solid #eef2f7",
    verticalAlign: "middle",
  },
  tdBold: {
    padding: "14px 16px",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: "700",
    borderBottom: "1px solid #eef2f7",
    verticalAlign: "middle",
  },
  totalRow: {
    background: "#f8fafc",
  },
  totalCell: {
    padding: "14px 16px",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: "800",
    borderBottom: "1px solid #eef2f7",
    verticalAlign: "middle",
  },
  percentWrap: {
    display: "grid",
    gap: "6px",
    minWidth: "140px",
  },
  progressTrack: {
    height: "10px",
    borderRadius: "999px",
    background: "#e2e8f0",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #10b981 0%, #059669 100%)",
  },
  percentText: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#475569",
  },
  emptyState: {
    padding: "18px",
    borderRadius: "12px",
    background: "#f8fafc",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
    fontWeight: "600",
  },
};
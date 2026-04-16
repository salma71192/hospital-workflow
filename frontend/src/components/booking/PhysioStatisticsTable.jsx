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

        <div style={styles.badge}>{rows.length} Physio</div>
      </div>

      <div style={styles.rowsWrap}>
        {rows.map((row) => {
          const available = Number(row?.available_slots || 0);
          const booked = Number(row?.booked || 0);
          const walkIn = Number(row?.walk_in || 0);
          const seen = Number(row?.seen || 0);
          const initialEval = Number(row?.initial_eval || 0);
          const noShow = Number(row?.no_show || 0);

          const bookedPercent =
            available > 0 ? Math.min(100, Math.round((booked / available) * 100)) : 0;

          return (
            <div key={row?.therapist_id || row?.therapist_name} style={styles.rowCard}>
              <div style={styles.rowTop}>
                <div>
                  <div style={styles.name}>{row?.therapist_name || "-"}</div>
                  <div style={styles.meta}>
                    {booked} booked out of {available} slots
                  </div>
                </div>

                <div style={styles.percentPill}>{bookedPercent}%</div>
              </div>

              <div style={styles.progressTrack}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${bookedPercent}%`,
                  }}
                />
              </div>

              <div style={styles.statsGrid}>
                <MiniStat label="Available" value={available} />
                <MiniStat label="Booked" value={booked} />
                <MiniStat label="Walk In" value={walkIn} />
                <MiniStat label="Seen" value={seen} />
                <MiniStat label="Initial Eval" value={initialEval} />
                <MiniStat label="No Show" value={noShow} />
              </div>
            </div>
          );
        })}
      </div>

      {totals ? (
        <div style={styles.totalCard}>
          <div style={styles.totalTitle}>Total</div>
          <div style={styles.statsGrid}>
            <MiniStat label="Available" value={Number(totals.available_slots || 0)} />
            <MiniStat label="Booked" value={Number(totals.booked || 0)} />
            <MiniStat label="Walk In" value={Number(totals.walk_in || 0)} />
            <MiniStat label="Seen" value={Number(totals.seen || 0)} />
            <MiniStat label="Initial Eval" value={Number(totals.initial_eval || 0)} />
            <MiniStat label="No Show" value={Number(totals.no_show || 0)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "16px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.04)",
    display: "grid",
    gap: "16px",
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
    background: "#f8fafc",
    color: "#334155",
    border: "1px solid #e2e8f0",
    borderRadius: "999px",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },
  rowsWrap: {
    display: "grid",
    gap: "12px",
  },
  rowCard: {
    background: "#fcfcfd",
    border: "1px solid #eef2f7",
    borderRadius: "16px",
    padding: "14px",
    display: "grid",
    gap: "12px",
  },
  rowTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    flexWrap: "wrap",
  },
  name: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a",
  },
  meta: {
    marginTop: "2px",
    fontSize: "13px",
    color: "#64748b",
    fontWeight: "600",
  },
  percentPill: {
    minWidth: "56px",
    height: "30px",
    padding: "0 10px",
    borderRadius: "999px",
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #dbeafe",
    fontSize: "14px",
    fontWeight: "800",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  progressTrack: {
    width: "100%",
    height: "10px",
    borderRadius: "999px",
    background: "#e2e8f0",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: "999px",
    background: "#60a5fa",
    transition: "width 0.25s ease",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "10px",
  },
  statCard: {
    background: "#ffffff",
    border: "1px solid #eef2f7",
    borderRadius: "12px",
    padding: "10px 12px",
    display: "grid",
    gap: "4px",
  },
  statLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: 1.1,
  },
  totalCard: {
    background: "#fafafa",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "14px",
    display: "grid",
    gap: "12px",
  },
  totalTitle: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#0f172a",
  },
  emptyState: {
    padding: "18px",
    borderRadius: "12px",
    background: "#fafafa",
    color: "#64748b",
    border: "1px dashed #d1d5db",
    fontWeight: "600",
  },
};
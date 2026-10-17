
import React from "react";

export default function LeaderboardSection({
  title = "Reception Leaderboard",
  rows = [],
  loading = false,
  error = "",
  onReload,
  target = 400,
  showTarget = true,
}) {
  const monthlyTarget = Number(target) > 0 ? Number(target) : 400;
  const safeRows = Array.isArray(rows) ? rows : [];

  const monthlyCount = (row) =>
    Math.max(
      0,
      Number(row.monthly ?? row.count ?? row.registration_count ?? 0) || 0
    );

  const todayCount = (row) =>
    Math.max(0, Number(row.today ?? row.today_count ?? 0) || 0);

  const displayName = (row) =>
    row.name || row.full_name || row.display_name || row.username || "-";

  const sortedRows = [...safeRows].sort(
    (a, b) => monthlyCount(b) - monthlyCount(a)
  );

  return (
    <div style={styles.page}>
      <div style={styles.heading}>
        <div>
          <span style={styles.teamBadge}>RECEPTION TEAM</span>
          <h2 style={styles.title}>{title}</h2>
          <p style={styles.subtitle}>
            Track monthly registrations and celebrate progress toward the target.
          </p>
        </div>

        {onReload && (
          <button
            type="button"
            onClick={onReload}
            style={styles.refreshButton}
          >
            ↻ Refresh
          </button>
        )}
      </div>

      <div style={styles.targetCard}>
        <div style={styles.targetIcon}>★</div>
        <div style={styles.targetContent}>
          <div style={styles.targetLabel}>MONTHLY TARGET</div>
          <div style={styles.targetValue}>
            {monthlyTarget}
            <span> registrations per staff member</span>
          </div>
        </div>
        <span style={styles.targetBadge}>Monthly goal</span>
      </div>

      {error ? <div style={styles.error}>{error}</div> : null}

      {loading ? (
        <div style={styles.empty}>Loading leaderboard...</div>
      ) : sortedRows.length === 0 ? (
        <div style={styles.empty}>
          No registration data available for this month.
        </div>
      ) : (
        <div style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <span>STAFF MEMBER</span>
            <span>TODAY</span>
            <span>THIS MONTH</span>
            {showTarget && <span>TARGET PROGRESS</span>}
          </div>

          {sortedRows.map((row, index) => {
            const monthly = monthlyCount(row);
            const today = todayCount(row);
            const percent = Math.round((monthly / monthlyTarget) * 100);
            const barWidth = Math.min(100, percent);
            const achieved = monthly >= monthlyTarget;
            const remaining = Math.max(0, monthlyTarget - monthly);

            const rankStyle =
              index === 0
                ? styles.goldRank
                : index === 1
                ? styles.silverRank
                : index === 2
                ? styles.bronzeRank
                : styles.normalRank;

            const statusStyle = achieved
              ? styles.achievedBadge
              : percent >= 75
              ? styles.nearTargetBadge
              : percent >= 40
              ? styles.inProgressBadge
              : styles.startBadge;

            const statusText = achieved
              ? "Target achieved"
              : percent >= 75
              ? "Almost there"
              : percent >= 40
              ? "In progress"
              : "Getting started";

            return (
              <div
                key={
                  row.user_id ??
                  row.id ??
                  row.username ??
                  `${displayName(row)}-${index}`
                }
                style={styles.tableRow}
              >
                <div style={styles.staffCell}>
                  <div style={{ ...styles.rank, ...rankStyle }}>
                    {index < 3
                      ? ["🥇", "🥈", "🥉"][index]
                      : `#${index + 1}`}
                  </div>

                  <div style={styles.staffDetails}>
                    <div style={styles.nameLine}>
                      <span style={styles.staffName}>{displayName(row)}</span>
                      {index === 0 && (
                        <span style={styles.topBadge}>TOP</span>
                      )}
                    </div>
                    <div style={styles.staffRole}>
                      {row.role || row.label || "Reception"}
                    </div>
                  </div>
                </div>

                <div style={styles.todayCell}>
                  <span style={styles.todayBadge}>{today}</span>
                </div>

                <div style={styles.monthCell}>
                  <strong>{monthly}</strong>
                  <span style={styles.monthTotal}> / {monthlyTarget}</span>
                  {showTarget && (
                    <div style={styles.statusLine}>
                      <span style={{ ...styles.statusBadge, ...statusStyle }}>
                        {statusText}
                      </span>
                    </div>
                  )}
                </div>

                {showTarget && (
                  <div style={styles.progressCell}>
                    <div style={styles.progressTop}>
                      <strong
                        style={{
                          ...styles.percent,
                          ...(achieved ? styles.achievedText : {}),
                        }}
                      >
                        {percent}%
                      </strong>
                      <span style={styles.remaining}>
                        {achieved ? "Complete" : `${remaining} left`}
                      </span>
                    </div>

                    <div style={styles.track}>
                      <div
                        style={{
                          ...styles.fill,
                          width: `${barWidth}%`,
                          ...(achieved ? styles.achievedFill : {}),
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div style={styles.footer}>
            <span style={styles.footerDot} />
            {sortedRows.length} staff member
            {sortedRows.length === 1 ? "" : "s"} ranked by monthly registrations
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

  heading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
  },

  teamBadge: {
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: "7px",
    background: "#ede9fe",
    color: "#6d28d9",
    fontSize: "10px",
    fontWeight: "900",
    letterSpacing: "1px",
  },

  title: {
    margin: "10px 0 0",
    color: "#172b4d",
    fontSize: "25px",
    lineHeight: 1.3,
    fontWeight: "800",
  },

  subtitle: {
    margin: "7px 0 0",
    color: "#718096",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  refreshButton: {
    background: "#eef2ff",
    color: "#4338ca",
    border: "1px solid #c7d2fe",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
  },

  targetCard: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
    background: "linear-gradient(110deg, #eff6ff, #f5f3ff)",
    border: "1px solid #dbeafe",
    borderRadius: "14px",
    padding: "18px",
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
    fontWeight: "900",
  },

  targetContent: {
    flex: 1,
    minWidth: "160px",
  },

  targetLabel: {
    fontSize: "10px",
    letterSpacing: "1px",
    color: "#6366a5",
    fontWeight: "900",
    marginBottom: "5px",
  },

  targetValue: {
    color: "#27356d",
    fontSize: "20px",
    fontWeight: "900",
    lineHeight: 1.5,
  },

  targetBadge: {
    background: "#ffffff",
    border: "1px solid #c7d2fe",
    color: "#4338ca",
    borderRadius: "999px",
    padding: "7px 11px",
    fontSize: "11px",
    fontWeight: "800",
  },

  tableCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    overflow: "hidden",
    minWidth: 0,
    boxShadow: "0 6px 20px rgba(30, 41, 59, 0.04)",
  },

  tableHeader: {
    display: "grid",
    gridTemplateColumns: "minmax(180px, 1.5fr) 70px 130px minmax(140px, 1fr)",
    gap: "12px",
    alignItems: "center",
    padding: "14px 18px",
    background: "#f8faff",
    borderBottom: "1px solid #e8edf5",
    color: "#64748b",
    fontSize: "10px",
    fontWeight: "900",
    letterSpacing: "0.6px",
  },

  tableRow: {
    display: "grid",
    gridTemplateColumns: "minmax(180px, 1.5fr) 70px 130px minmax(140px, 1fr)",
    gap: "12px",
    alignItems: "center",
    padding: "17px 18px",
    borderBottom: "1px solid #edf1f7",
    minWidth: 0,
  },

  staffCell: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: 0,
  },

  rank: {
    width: "38px",
    height: "38px",
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    borderRadius: "11px",
    fontSize: "16px",
    fontWeight: "900",
  },

  goldRank: {
    background: "#fef3c7",
    border: "1px solid #fcd34d",
  },

  silverRank: {
    background: "#f1f5f9",
    border: "1px solid #cbd5e1",
  },

  bronzeRank: {
    background: "#ffedd5",
    border: "1px solid #fdba74",
  },

  normalRank: {
    background: "#eef2ff",
    color: "#4f46e5",
    fontSize: "12px",
  },

  staffDetails: {
    minWidth: 0,
  },

  nameLine: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "7px",
  },

  staffName: {
    color: "#1e293b",
    fontSize: "13px",
    fontWeight: "800",
    overflowWrap: "anywhere",
  },

  topBadge: {
    background: "#fef3c7",
    color: "#92400e",
    borderRadius: "5px",
    padding: "3px 5px",
    fontSize: "9px",
    fontWeight: "900",
  },

  staffRole: {
    marginTop: "5px",
    color: "#94a3b8",
    fontSize: "11px",
  },

  todayCell: {
    textAlign: "center",
  },

  todayBadge: {
    display: "inline-block",
    minWidth: "28px",
    padding: "6px 8px",
    borderRadius: "8px",
    background: "#e0f2fe",
    color: "#0369a1",
    fontSize: "13px",
    fontWeight: "900",
  },

  monthCell: {
    color: "#1e293b",
    fontSize: "17px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },

  monthTotal: {
    color: "#94a3b8",
    fontSize: "11px",
    fontWeight: "600",
  },

  statusLine: {
    marginTop: "7px",
  },

  statusBadge: {
    display: "inline-block",
    borderRadius: "999px",
    padding: "5px 8px",
    fontSize: "10px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },

  achievedBadge: {
    background: "#dcfce7",
    color: "#166534",
  },

  nearTargetBadge: {
    background: "#fef3c7",
    color: "#92400e",
  },

  inProgressBadge: {
    background: "#dbeafe",
    color: "#1d4ed8",
  },

  startBadge: {
    background: "#f3e8ff",
    color: "#7e22ce",
  },

  progressCell: {
    display: "grid",
    gap: "8px",
    minWidth: 0,
  },

  progressTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
  },

  percent: {
    color: "#4f46e5",
    fontSize: "14px",
    fontWeight: "900",
  },

  achievedText: {
    color: "#15803d",
  },

  remaining: {
    color: "#94a3b8",
    fontSize: "10px",
    fontWeight: "700",
  },

  track: {
    width: "100%",
    height: "8px",
    background: "#edf0f7",
    borderRadius: "999px",
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

  footer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "14px 18px",
    background: "#fafbff",
    color: "#64748b",
    fontSize: "11px",
    fontWeight: "600",
  },

  footerDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#8b5cf6",
  },

  empty: {
    padding: "28px 18px",
    textAlign: "center",
    border: "1px dashed #cbd5e1",
    borderRadius: "12px",
    background: "#ffffff",
    color: "#64748b",
    fontSize: "13px",
  },

  error: {
    background: "#fff1f2",
    color: "#be123c",
    border: "1px solid #fecdd3",
    borderRadius: "12px",
    padding: "14px",
    fontWeight: "700",
  },
};

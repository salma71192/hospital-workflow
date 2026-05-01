import React from "react";

export default function LeaderboardSection({
  title = "Leaderboard",
  rows = [],
  loading = false,
  error = "",
  onReload,
}) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const topScore = Math.max(...safeRows.map((row) => row.monthly || 0), 1);

  return (
    <div style={styles.page}>
      <div style={styles.headerCard}>
        <div>
          <div style={styles.eyebrow}>Performance</div>
          <h2 style={styles.title}>{title}</h2>
          <p style={styles.subtitle}>
            Ranking by this month’s activity. Today’s count is shown beside it.
          </p>
        </div>

        {onReload ? (
          <button type="button" onClick={onReload} style={styles.refreshBtn}>
            Refresh
          </button>
        ) : null}
      </div>

      {error ? <div style={styles.error}>{error}</div> : null}

      {loading ? (
        <div style={styles.empty}>Loading leaderboard...</div>
      ) : safeRows.length === 0 ? (
        <div style={styles.empty}>No leaderboard data found.</div>
      ) : (
        <div style={styles.list}>
          {safeRows.map((row, index) => {
            const monthly = row.monthly || 0;
            const today = row.today || 0;
            const width = Math.max(6, Math.round((monthly / topScore) * 100));

            return (
              <div key={row.user_id || row.name || index} style={styles.row}>
                <div style={styles.rankBox}>
                  <div
                    style={{
                      ...styles.rank,
                      ...(index === 0 ? styles.gold : {}),
                      ...(index === 1 ? styles.silver : {}),
                      ...(index === 2 ? styles.bronze : {}),
                    }}
                  >
                    {index === 0
                      ? "🥇"
                      : index === 1
                      ? "🥈"
                      : index === 2
                      ? "🥉"
                      : `#${index + 1}`}
                  </div>
                </div>

                <div style={styles.main}>
                  <div style={styles.nameRow}>
                    <div>
                      <div style={styles.name}>{row.name || row.username || "-"}</div>
                      <div style={styles.role}>{row.role || "User"}</div>
                    </div>

                    <div style={styles.scoreGroup}>
                      <div style={styles.scoreBox}>
                        <strong>{monthly}</strong>
                        <span>Month</span>
                      </div>

                      <div style={styles.scoreBox}>
                        <strong>{today}</strong>
                        <span>Today</span>
                      </div>
                    </div>
                  </div>

                  <div style={styles.track}>
                    <div style={{ ...styles.fill, width: `${width}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    display: "grid",
    gap: "16px",
  },
  headerCard: {
    background: "linear-gradient(135deg, #fdf2f8, #ffffff)",
    border: "1px solid #fbcfe8",
    borderRadius: "20px",
    padding: "22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
  },
  eyebrow: {
    fontSize: "12px",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#be185d",
  },
  title: {
    margin: "4px 0",
    fontSize: "26px",
    fontWeight: "900",
    color: "#0f172a",
  },
  subtitle: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
  },
  refreshBtn: {
    background: "#be185d",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "10px 14px",
    fontWeight: "800",
    cursor: "pointer",
  },
  list: {
    display: "grid",
    gap: "12px",
  },
  row: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "14px",
    display: "grid",
    gridTemplateColumns: "58px 1fr",
    gap: "14px",
    alignItems: "center",
    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.04)",
  },
  rankBox: {
    display: "grid",
    placeItems: "center",
  },
  rank: {
    width: "46px",
    height: "46px",
    borderRadius: "999px",
    background: "#f1f5f9",
    color: "#334155",
    display: "grid",
    placeItems: "center",
    fontSize: "14px",
    fontWeight: "900",
  },
  gold: {
    background: "#fef3c7",
    color: "#92400e",
    fontSize: "22px",
  },
  silver: {
    background: "#e5e7eb",
    color: "#374151",
    fontSize: "22px",
  },
  bronze: {
    background: "#ffedd5",
    color: "#9a3412",
    fontSize: "22px",
  },
  main: {
    display: "grid",
    gap: "12px",
  },
  nameRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  name: {
    color: "#0f172a",
    fontSize: "16px",
    fontWeight: "900",
  },
  role: {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "capitalize",
  },
  scoreGroup: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  scoreBox: {
    minWidth: "72px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "8px 10px",
    display: "grid",
    textAlign: "center",
    gap: "2px",
  },
  track: {
    height: "10px",
    background: "#e2e8f0",
    borderRadius: "999px",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    background: "#be185d",
    borderRadius: "999px",
    transition: "width 0.25s ease",
  },
  empty: {
    color: "#64748b",
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: "14px",
    padding: "16px",
    fontWeight: "700",
  },
  error: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: "14px",
    padding: "14px",
    fontWeight: "800",
  },
};
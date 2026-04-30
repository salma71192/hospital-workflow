export default function LeaderboardSection({ title = "Leaderboard", rows = [] }) {
  return (
    <div style={styles.card}>
      <div>
        <div style={styles.eyebrow}>Performance</div>
        <h2 style={styles.title}>{title}</h2>
      </div>

      {rows.length === 0 ? (
        <div style={styles.empty}>No leaderboard data found.</div>
      ) : (
        <div style={styles.list}>
          {rows.map((row, index) => (
            <div key={row.user_id} style={styles.row}>
              <div style={styles.rank}>#{index + 1}</div>

              <div style={styles.info}>
                <strong>{row.name}</strong>
                <span>Today: {row.today || 0}</span>
              </div>

              <div style={styles.score}>{row.monthly || 0}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "22px",
    display: "grid",
    gap: "16px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
  },
  eyebrow: {
    fontSize: "12px",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#be185d",
  },
  title: {
    margin: 0,
    fontSize: "24px",
    color: "#0f172a",
  },
  list: {
    display: "grid",
    gap: "10px",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "52px 1fr 70px",
    alignItems: "center",
    gap: "12px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "12px",
  },
  rank: {
    width: "42px",
    height: "42px",
    borderRadius: "999px",
    background: "#fdf2f8",
    color: "#be185d",
    display: "grid",
    placeItems: "center",
    fontWeight: "900",
  },
  info: {
    display: "grid",
    gap: "4px",
    color: "#0f172a",
  },
  score: {
    fontSize: "24px",
    fontWeight: "900",
    color: "#1e3a8a",
    textAlign: "right",
  },
  empty: {
    color: "#64748b",
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: "12px",
    padding: "14px",
    fontWeight: "700",
  },
};
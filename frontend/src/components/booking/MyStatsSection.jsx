export default function MyStatsSection({ stats = {} }) {
  const today = Number(stats.today || 0);
  const monthly = Number(stats.monthly || 0);

  const maxValue = Math.max(today, monthly, 1);
  const todayPercent = Math.round((today / maxValue) * 100);
  const monthlyPercent = Math.round((monthly / maxValue) * 100);

  return (
    <div style={styles.page}>
      <div style={styles.heroCard}>
        <div>
          <div style={styles.eyebrow}>My Stats</div>
          <h2 style={styles.title}>Booking Performance</h2>
          <p style={styles.subtitle}>
            Track bookings created by you today and this month.
          </p>
        </div>

        <div style={styles.totalCircle}>
          <span style={styles.totalNumber}>{monthly}</span>
          <span style={styles.totalLabel}>Monthly</span>
        </div>
      </div>

      <div style={styles.grid}>
        <StatCard
          title="Today Bookings"
          value={today}
          label="Bookings created today"
          percent={todayPercent}
        />

        <StatCard
          title="Monthly Bookings"
          value={monthly}
          label="Bookings created this month"
          percent={monthlyPercent}
        />
      </div>

      <div style={styles.chartCard}>
        <div style={styles.sectionHeader}>
          <div>
            <div style={styles.eyebrow}>Comparison</div>
            <h3 style={styles.sectionTitle}>Today vs Monthly</h3>
          </div>
        </div>

        <Bar label="Today" value={today} percent={todayPercent} />
        <Bar label="Monthly" value={monthly} percent={monthlyPercent} />
      </div>
    </div>
  );
}

function StatCard({ title, value, label, percent }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statTop}>
        <div>
          <div style={styles.statTitle}>{title}</div>
          <div style={styles.statLabel}>{label}</div>
        </div>

        <div style={styles.badge}>{value}</div>
      </div>

      <div style={styles.ringWrap}>
        <div
          style={{
            ...styles.ring,
            background: `conic-gradient(#be185d ${percent}%, #fce7f3 ${percent}% 100%)`,
          }}
        >
          <div style={styles.ringInner}>
            <strong>{percent}%</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bar({ label, value, percent }) {
  return (
    <div style={styles.barRow}>
      <div style={styles.barHeader}>
        <span style={styles.barLabel}>{label}</span>
        <span style={styles.barValue}>{value}</span>
      </div>

      <div style={styles.barTrack}>
        <div
          style={{
            ...styles.barFill,
            width: `${percent}%`,
          }}
        />
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "grid",
    gap: "16px",
  },
  heroCard: {
    background: "linear-gradient(135deg, #be185d, #831843)",
    color: "#fff",
    borderRadius: "22px",
    padding: "26px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "18px",
    flexWrap: "wrap",
    boxShadow: "0 18px 40px rgba(190, 24, 93, 0.22)",
  },
  eyebrow: {
    fontSize: "12px",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    opacity: 0.85,
  },
  title: {
    margin: "6px 0 4px",
    fontSize: "28px",
    fontWeight: "900",
  },
  subtitle: {
    margin: 0,
    fontSize: "14px",
    opacity: 0.9,
    fontWeight: "600",
  },
  totalCircle: {
    width: "120px",
    height: "120px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.16)",
    border: "1px solid rgba(255,255,255,0.25)",
    display: "grid",
    placeItems: "center",
    textAlign: "center",
  },
  totalNumber: {
    fontSize: "36px",
    fontWeight: "950",
    lineHeight: 1,
  },
  totalLabel: {
    fontSize: "12px",
    fontWeight: "800",
    opacity: 0.9,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px",
  },
  statCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "22px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
    display: "grid",
    gap: "18px",
  },
  statTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "flex-start",
  },
  statTitle: {
    fontSize: "17px",
    fontWeight: "900",
    color: "#0f172a",
  },
  statLabel: {
    marginTop: "4px",
    fontSize: "13px",
    fontWeight: "700",
    color: "#64748b",
  },
  badge: {
    minWidth: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "#fdf2f8",
    color: "#be185d",
    display: "grid",
    placeItems: "center",
    fontSize: "22px",
    fontWeight: "950",
  },
  ringWrap: {
    display: "grid",
    placeItems: "center",
  },
  ring: {
    width: "132px",
    height: "132px",
    borderRadius: "999px",
    display: "grid",
    placeItems: "center",
  },
  ringInner: {
    width: "94px",
    height: "94px",
    borderRadius: "999px",
    background: "#fff",
    display: "grid",
    placeItems: "center",
    color: "#0f172a",
    fontSize: "18px",
  },
  chartCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "22px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
    display: "grid",
    gap: "18px",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    margin: "4px 0 0",
    fontSize: "18px",
    fontWeight: "900",
    color: "#0f172a",
  },
  barRow: {
    display: "grid",
    gap: "8px",
  },
  barHeader: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    fontWeight: "800",
    color: "#334155",
  },
  barLabel: {
    color: "#0f172a",
  },
  barValue: {
    color: "#be185d",
  },
  barTrack: {
    height: "14px",
    borderRadius: "999px",
    background: "#fce7f3",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #be185d, #ec4899)",
    transition: "width 300ms ease",
  },
};
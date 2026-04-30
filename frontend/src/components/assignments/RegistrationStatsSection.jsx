export default function RegistrationStatsSection({ stats }) {
  const daily = stats?.daily || [];
  const therapists = stats?.therapists || [];
  const categories = stats?.categories || [];
  const conversion = stats?.conversion || {};

  const maxDaily = Math.max(...daily.map((x) => x.count || 0), 1);
  const maxTherapist = Math.max(...therapists.map((x) => x.count || 0), 1);

  return (
    <div style={styles.page}>
      <div style={styles.heroCard}>
        <div>
          <div style={styles.eyebrow}>My Registration Stats</div>
          <h2 style={styles.title}>Registration Performance</h2>
          <p style={styles.subtitle}>
            Your daily and monthly registration activity.
          </p>
        </div>

        <div style={styles.heroStats}>
          <div style={styles.bigStat}>
            <span style={styles.bigLabel}>Today</span>
            <strong style={styles.bigNumber}>{stats?.today || 0}</strong>
          </div>

          <div style={styles.bigStat}>
            <span style={styles.bigLabel}>This Month</span>
            <strong style={styles.bigNumber}>{stats?.monthly || 0}</strong>
          </div>
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.sectionTitle}>Daily Chart</div>

          {daily.length === 0 ? (
            <div style={styles.empty}>No daily data found.</div>
          ) : (
            <div style={styles.chart}>
              {daily.map((item) => {
                const height = Math.max(
                  8,
                  Math.round(((item.count || 0) / maxDaily) * 120)
                );

                return (
                  <div key={item.date} style={styles.barWrap}>
                    <div style={styles.barValue}>{item.count}</div>
                    <div style={{ ...styles.bar, height }} />
                    <div style={styles.barLabel}>{item.label}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={styles.card}>
          <div style={styles.sectionTitle}>Conversion Summary</div>

          <div style={styles.summaryGrid}>
            <div style={styles.smallStat}>
              <span>Appointments</span>
              <strong>{conversion.appointment || 0}</strong>
            </div>

            <div style={styles.smallStat}>
              <span>Walk-in</span>
              <strong>{conversion.walk_in || 0}</strong>
            </div>

            <div style={styles.smallStat}>
              <span>Initial Eval</span>
              <strong>{conversion.initial_eval || 0}</strong>
            </div>

            <div style={styles.smallStat}>
              <span>Total</span>
              <strong>{conversion.total || 0}</strong>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.sectionTitle}>Per Physio</div>

          {therapists.length === 0 ? (
            <div style={styles.empty}>No physio data found.</div>
          ) : (
            <div style={styles.list}>
              {therapists.map((item) => {
                const width = Math.round(((item.count || 0) / maxTherapist) * 100);

                return (
                  <div key={item.therapist_id || item.therapist_name} style={styles.row}>
                    <div style={styles.rowTop}>
                      <strong>{item.therapist_name || "No Physio"}</strong>
                      <span>{item.count}</span>
                    </div>
                    <div style={styles.track}>
                      <div style={{ ...styles.fill, width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={styles.card}>
          <div style={styles.sectionTitle}>By Category</div>

          {categories.length === 0 ? (
            <div style={styles.empty}>No category data found.</div>
          ) : (
            <div style={styles.list}>
              {categories.map((item) => (
                <div key={item.category} style={styles.categoryRow}>
                  <span>{item.label}</span>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
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
    background: "linear-gradient(135deg, #eff6ff, #ffffff)",
    border: "1px solid #bfdbfe",
    borderRadius: "22px",
    padding: "24px",
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    flexWrap: "wrap",
    boxShadow: "0 14px 34px rgba(15, 23, 42, 0.08)",
  },
  eyebrow: {
    fontSize: "12px",
    fontWeight: "900",
    color: "#1d4ed8",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  title: {
    margin: "4px 0",
    fontSize: "26px",
    color: "#0f172a",
  },
  subtitle: {
    margin: 0,
    color: "#64748b",
    fontWeight: "600",
  },
  heroStats: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  bigStat: {
    minWidth: "150px",
    background: "#fff",
    border: "1px solid #dbeafe",
    borderRadius: "18px",
    padding: "18px",
    display: "grid",
    gap: "6px",
  },
  bigLabel: {
    fontSize: "13px",
    fontWeight: "800",
    color: "#64748b",
  },
  bigNumber: {
    fontSize: "34px",
    color: "#1e3a8a",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "16px",
  },
  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "20px",
    display: "grid",
    gap: "16px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
  },
  sectionTitle: {
    fontSize: "17px",
    fontWeight: "900",
    color: "#0f172a",
  },
  chart: {
    height: "170px",
    display: "flex",
    alignItems: "end",
    gap: "10px",
    overflowX: "auto",
    paddingTop: "12px",
  },
  barWrap: {
    minWidth: "42px",
    display: "grid",
    justifyItems: "center",
    alignItems: "end",
    gap: "6px",
  },
  barValue: {
    fontSize: "12px",
    fontWeight: "800",
    color: "#1e3a8a",
  },
  bar: {
    width: "28px",
    background: "#2563eb",
    borderRadius: "999px 999px 4px 4px",
  },
  barLabel: {
    fontSize: "11px",
    color: "#64748b",
    fontWeight: "700",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
  },
  smallStat: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "14px",
    display: "grid",
    gap: "6px",
  },
  list: {
    display: "grid",
    gap: "12px",
  },
  row: {
    display: "grid",
    gap: "8px",
  },
  rowTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    color: "#0f172a",
  },
  track: {
    height: "9px",
    borderRadius: "999px",
    background: "#e2e8f0",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    background: "#1e3a8a",
    borderRadius: "999px",
  },
  categoryRow: {
    display: "flex",
    justifyContent: "space-between",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "12px",
    fontWeight: "800",
    color: "#0f172a",
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
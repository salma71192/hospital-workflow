import React, { useMemo, useState } from "react";
import PatientAutocompleteFilter from "./PatientAutocompleteFilter";

export default function TodayAppointmentsSection({
  bookings = [],
  title = "Today's Appointments",
}) {
  const [patientSearch, setPatientSearch] = useState("");

  const filteredBookings = useMemo(() => {
    const term = patientSearch.trim().toLowerCase();
    if (!term) return bookings;

    return bookings.filter((item) => {
      const patientName = (item.patient_name || "").toLowerCase();
      const patientId = (item.patient_id || "").toLowerCase();
      return patientName.includes(term) || patientId.includes(term);
    });
  }, [bookings, patientSearch]);

  const totalBooked = filteredBookings.length;

  const attendedCount = filteredBookings.filter(
    (item) => (item.attendance_status || "no_show") === "attended"
  ).length;

  const noShowCount = totalBooked - attendedCount;

  const attendedPercent =
    totalBooked > 0 ? Math.round((attendedCount / totalBooked) * 100) : 0;

  const noShowPercent =
    totalBooked > 0 ? Math.round((noShowCount / totalBooked) * 100) : 0;

  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <div>
          <div style={styles.eyebrow}>Daily Overview</div>
          <h2 style={styles.cardTitle}>{title}</h2>
        </div>
      </div>

      <div style={styles.heroGrid}>
        <div style={styles.mainStatCard}>
          <div style={styles.mainStatLabel}>Total Bookings</div>
          <div style={styles.mainStatValue}>{totalBooked}</div>
          <div style={styles.mainStatHint}>Appointments in selected view</div>
        </div>

        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>Attendance Split</div>

          <div
            style={{
              ...styles.donut,
              background: `conic-gradient(#059669 0 ${attendedPercent}%, #dc2626 ${attendedPercent}% 100%)`,
            }}
          >
            <div style={styles.donutInner}>
              <strong>{attendedPercent}%</strong>
              <span>Attended</span>
            </div>
          </div>

          <div style={styles.legend}>
            <span style={styles.legendItem}>
              <span style={{ ...styles.legendDot, background: "#059669" }} />
              Attended {attendedCount}
            </span>
            <span style={styles.legendItem}>
              <span style={{ ...styles.legendDot, background: "#dc2626" }} />
              No Show {noShowCount}
            </span>
          </div>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <StatCard
          label="Attended"
          value={attendedCount}
          percent={attendedPercent}
          color="#059669"
          bg="#ecfdf5"
        />

        <StatCard
          label="No Show"
          value={noShowCount}
          percent={noShowPercent}
          color="#dc2626"
          bg="#fef2f2"
        />
      </div>

      <PatientAutocompleteFilter
        value={patientSearch}
        onChange={setPatientSearch}
        label="Patient"
        placeholder="Search patient name or file number"
      />

      {filteredBookings.length ? (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Patient Name</th>
                <th style={styles.th}>Patient ID</th>
                <th style={styles.th}>Time</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Booked By</th>
                <th style={styles.th}>Notes</th>
              </tr>
            </thead>

            <tbody>
              {filteredBookings.map((row) => {
                const isAttended =
                  (row.attendance_status || "no_show") === "attended";

                return (
                  <tr key={row.id}>
                    <td style={styles.tdBold}>{row.patient_name}</td>
                    <td style={styles.td}>{row.patient_id}</td>
                    <td style={styles.td}>{row.appointment_time}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          ...(isAttended
                            ? styles.statusAttended
                            : styles.statusNoShow),
                        }}
                      >
                        {isAttended ? "Attended" : "No Show"}
                      </span>
                    </td>
                    <td style={styles.td}>{row.created_by_name || "-"}</td>
                    <td style={styles.td}>{row.notes || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={styles.emptyState}>No appointments found.</div>
      )}
    </div>
  );
}

function StatCard({ label, value, percent, color, bg }) {
  return (
    <div style={{ ...styles.statCard, background: bg }}>
      <div style={styles.statTopRow}>
        <div style={styles.statLabel}>{label}</div>
        <div style={{ ...styles.statPercent, color }}>{percent}%</div>
      </div>

      <div style={styles.statValue}>{value}</div>

      <div style={styles.progressTrack}>
        <div
          style={{
            ...styles.progressBar,
            width: `${percent}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: "22px",
    padding: "24px",
    boxShadow: "0 14px 36px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e8eef7",
    display: "grid",
    gap: "18px",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  eyebrow: {
    fontSize: "12px",
    fontWeight: "900",
    color: "#be185d",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  cardTitle: {
    margin: 0,
    fontSize: "24px",
    color: "#0f172a",
    fontWeight: "900",
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "14px",
  },
  mainStatCard: {
    background: "linear-gradient(135deg, #be185d, #db2777)",
    color: "#fff",
    borderRadius: "20px",
    padding: "22px",
    display: "grid",
    gap: "8px",
  },
  mainStatLabel: {
    fontSize: "13px",
    fontWeight: "800",
    opacity: 0.9,
    textTransform: "uppercase",
  },
  mainStatValue: {
    fontSize: "46px",
    fontWeight: "900",
    lineHeight: 1,
  },
  mainStatHint: {
    fontSize: "13px",
    opacity: 0.9,
  },
  chartCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    padding: "18px",
    display: "grid",
    justifyItems: "center",
    gap: "12px",
  },
  chartTitle: {
    fontSize: "14px",
    fontWeight: "900",
    color: "#0f172a",
  },
  donut: {
    width: "138px",
    height: "138px",
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
  },
  donutInner: {
    width: "92px",
    height: "92px",
    borderRadius: "50%",
    background: "#fff",
    display: "grid",
    placeItems: "center",
    alignContent: "center",
    color: "#0f172a",
    fontSize: "12px",
  },
  legend: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "800",
    color: "#475569",
  },
  legendItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },
  legendDot: {
    width: "10px",
    height: "10px",
    borderRadius: "999px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
  },
  statCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "16px",
    display: "grid",
    gap: "10px",
  },
  statTopRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
  },
  statLabel: {
    fontSize: "12px",
    fontWeight: "900",
    color: "#64748b",
    textTransform: "uppercase",
  },
  statPercent: {
    fontSize: "12px",
    fontWeight: "900",
  },
  statValue: {
    fontSize: "28px",
    fontWeight: "900",
    color: "#0f172a",
  },
  progressTrack: {
    width: "100%",
    height: "10px",
    background: "#e2e8f0",
    borderRadius: "999px",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: "999px",
    transition: "width 0.25s ease",
  },
  tableWrap: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "860px",
    background: "#fff",
  },
  th: {
    textAlign: "left",
    padding: "14px 16px",
    background: "#f8fafc",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "900",
    borderBottom: "1px solid #e2e8f0",
  },
  td: {
    padding: "14px 16px",
    color: "#475569",
    fontSize: "14px",
    borderBottom: "1px solid #eef2f7",
  },
  tdBold: {
    padding: "14px 16px",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: "800",
    borderBottom: "1px solid #eef2f7",
  },
  statusBadge: {
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    display: "inline-block",
  },
  statusAttended: {
    background: "#dcfce7",
    color: "#166534",
  },
  statusNoShow: {
    background: "#fee2e2",
    color: "#b91c1c",
  },
  emptyState: {
    padding: "18px",
    borderRadius: "14px",
    background: "#f8fafc",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
    fontWeight: "700",
  },
};
import React, { useMemo, useState } from "react";
import PatientAutocompleteFilter from "./PatientAutocompleteFilter";

export default function TodayAppointmentsSection({
  bookings = [],
  title = "Today's Appointmt",
  target = 0,
  onChangeTarget,
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

  const safeTarget = Number(target || 0);
  const actual = filteredBookings.length;
  const remaining = Math.max(safeTarget - actual, 0);
  const progress =
    safeTarget > 0 ? Math.min((actual / safeTarget) * 100, 100) : 0;

  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <h2 style={styles.cardTitle}>{title}</h2>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Appointments</div>
          <div style={styles.statValue}>{actual}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Target</div>
          <input
            type="number"
            min="0"
            value={target}
            onChange={(e) =>
              onChangeTarget && onChangeTarget(Number(e.target.value || 0))
            }
            style={styles.targetInput}
          />
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Remaining</div>
          <div style={styles.statValue}>{remaining}</div>
        </div>
      </div>

      <div style={styles.progressWrap}>
        <div style={styles.progressTop}>
          <span style={styles.progressLabel}>Progress</span>
          <span style={styles.progressValue}>
            {safeTarget > 0 ? `${Math.round(progress)}%` : "No target"}
          </span>
        </div>

        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressBar, width: `${progress}%` }} />
        </div>
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
                <th style={styles.th}>Booked By</th>
                <th style={styles.th}>Notes</th>
              </tr>
            </thead>

            <tbody>
              {filteredBookings.map((row) => (
                <tr key={row.id}>
                  <td style={styles.tdBold}>{row.patient_name}</td>
                  <td style={styles.td}>{row.patient_id}</td>
                  <td style={styles.td}>{row.appointment_time}</td>
                  <td style={styles.td}>{row.created_by_name || "-"}</td>
                  <td style={styles.td}>{row.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={styles.emptyState}>No appointments found for today.</div>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
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
  cardTitle: {
    margin: 0,
    fontSize: "22px",
    color: "#0f172a",
    fontWeight: "800",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
  },
  statCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "14px",
    display: "grid",
    gap: "8px",
  },
  statLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
  },
  targetInput: {
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    background: "#fff",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  progressWrap: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "14px",
    display: "grid",
    gap: "10px",
  },
  progressTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  progressLabel: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#475569",
  },
  progressValue: {
    fontSize: "13px",
    fontWeight: "800",
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
    background: "#059669",
    borderRadius: "999px",
    transition: "width 0.25s ease",
  },
  tableWrap: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "760px",
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
  },
  tdBold: {
    padding: "14px 16px",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: "700",
    borderBottom: "1px solid #eef2f7",
  },
  emptyState: {
    padding: "18px",
    borderRadius: "12px",
    background: "#f8fafc",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
  },
};
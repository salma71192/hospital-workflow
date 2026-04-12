import React, { useMemo, useState } from "react";
import PatientAutocompleteFilter from "./PatientAutocompleteFilter";

export default function TodayAppointmentsSection({
  bookings = [],
  title = "Today's Appointmt",
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
  const noShowCount = filteredBookings.filter(
    (item) => (item.attendance_status || "no_show") !== "attended"
  ).length;

  const attendedPercent =
    totalBooked > 0 ? Math.round((attendedCount / totalBooked) * 100) : 0;

  const noShowPercent =
    totalBooked > 0 ? Math.round((noShowCount / totalBooked) * 100) : 0;

  const totalPercent = totalBooked > 0 ? 100 : 0;

  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <h2 style={styles.cardTitle}>{title}</h2>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statTopRow}>
            <div style={styles.statLabel}>Total Booked</div>
            <div style={styles.statPercent}>{totalPercent}%</div>
          </div>
          <div style={styles.statValue}>{totalBooked}</div>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressBarTotal, width: `${totalPercent}%` }} />
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statTopRow}>
            <div style={styles.statLabel}>Attended</div>
            <div style={styles.statPercent}>{attendedPercent}%</div>
          </div>
          <div style={styles.statValue}>{attendedCount}</div>
          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressBarAttended,
                width: `${attendedPercent}%`,
              }}
            />
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statTopRow}>
            <div style={styles.statLabel}>No Show</div>
            <div style={styles.statPercent}>{noShowPercent}%</div>
          </div>
          <div style={styles.statValue}>{noShowCount}</div>
          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressBarNoShow,
                width: `${noShowPercent}%`,
              }}
            />
          </div>
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
                <th style={styles.th}>Status</th>
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
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        ...((row.attendance_status || "no_show") === "attended"
                          ? styles.statusAttended
                          : styles.statusNoShow),
                      }}
                    >
                      {row.attendance_status || "no_show"}
                    </span>
                  </td>
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
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
  },
  statCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "14px",
    display: "grid",
    gap: "10px",
  },
  statTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  statLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
  },
  statPercent: {
    fontSize: "12px",
    fontWeight: "800",
    color: "#0f172a",
  },
  statValue: {
    fontSize: "24px",
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
  progressBarTotal: {
    height: "100%",
    background: "#2563eb",
    borderRadius: "999px",
    transition: "width 0.25s ease",
  },
  progressBarAttended: {
    height: "100%",
    background: "#059669",
    borderRadius: "999px",
    transition: "width 0.25s ease",
  },
  progressBarNoShow: {
    height: "100%",
    background: "#dc2626",
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
    minWidth: "860px",
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
  statusBadge: {
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "capitalize",
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
    borderRadius: "12px",
    background: "#f8fafc",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
  },
};
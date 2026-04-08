import React from "react";

export default function MonthlyBookingsSection({
  bookings = [],
  month = "",
}) {
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.eyebrow}>Monthly Tracker</div>
        <h2 style={styles.title}>Monthly Bookings</h2>
        <div style={styles.subtext}>
          {month ? `Bookings for ${month}` : "Bookings created this month by this agent."}
        </div>
      </div>

      {bookings.length === 0 ? (
        <div style={styles.emptyState}>No bookings found for this month.</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Patient</th>
                <th style={styles.th}>File Number</th>
                <th style={styles.th}>Therapist</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Time</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((item) => (
                <tr key={item.id}>
                  <td style={styles.td}>{item.patient_name}</td>
                  <td style={styles.td}>{item.patient_id}</td>
                  <td style={styles.td}>{item.therapist_name}</td>
                  <td style={styles.td}>{item.appointment_date}</td>
                  <td style={styles.td}>{item.appointment_time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
    gap: "16px",
  },
  header: {
    display: "grid",
    gap: "6px",
  },
  eyebrow: {
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#be185d",
  },
  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
  },
  subtext: {
    fontSize: "14px",
    color: "#64748b",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "760px",
  },
  th: {
    textAlign: "left",
    padding: "12px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "13px",
    color: "#334155",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #eef2f7",
    fontSize: "14px",
    color: "#0f172a",
  },
  emptyState: {
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: "12px",
    padding: "14px",
  },
};
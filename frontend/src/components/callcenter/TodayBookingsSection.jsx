import React from "react";

export default function TodayBookingsSection({
  bookings = [],
}) {
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.eyebrow}>Daily Booking</div>
        <h2 style={styles.title}>Today's Bookings</h2>
        <div style={styles.subtext}>
          Bookings created today by this agent.
        </div>
      </div>

      {bookings.length === 0 ? (
        <div style={styles.emptyState}>No bookings found for today.</div>
      ) : (
        <div style={styles.list}>
          {bookings.map((item) => (
            <div key={item.id} style={styles.bookingCard}>
              <div style={styles.topRow}>
                <div style={styles.patientName}>{item.patient_name}</div>
                <div style={styles.timeBadge}>{item.appointment_time}</div>
              </div>

              <div style={styles.metaGrid}>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>File Number</span>
                  <span style={styles.metaValue}>{item.patient_id}</span>
                </div>

                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>Therapist</span>
                  <span style={styles.metaValue}>{item.therapist_name}</span>
                </div>

                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>Date</span>
                  <span style={styles.metaValue}>{item.appointment_date}</span>
                </div>
              </div>

              {item.notes ? (
                <div style={styles.notesBox}>{item.notes}</div>
              ) : null}
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
  list: {
    display: "grid",
    gap: "12px",
  },
  bookingCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    background: "#f8fafc",
    padding: "16px",
    display: "grid",
    gap: "12px",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  patientName: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a",
  },
  timeBadge: {
    background: "#fdf2f8",
    color: "#be185d",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "10px",
  },
  metaItem: {
    display: "grid",
    gap: "4px",
  },
  metaLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
  },
  notesBox: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "10px 12px",
    color: "#475569",
    fontSize: "14px",
    fontWeight: "600",
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
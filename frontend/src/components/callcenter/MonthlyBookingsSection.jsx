import React from "react";

export default function MonthlyBookingsSection({
  bookings = [],
  agents = [],
  monthlyFilter,
  setMonthlyFilter,
  onApplyFilters,
}) {
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.eyebrow}>Monthly Tracker</div>
        <h2 style={styles.title}>Monthly Bookings</h2>
        <div style={styles.subtext}>
          View bookings by month, agent, or patient.
        </div>
      </div>

      <div style={styles.filterGrid}>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Month</label>
          <input
            type="month"
            value={monthlyFilter.month}
            onChange={(e) =>
              setMonthlyFilter((prev) => ({
                ...prev,
                month: e.target.value,
              }))
            }
            style={styles.input}
          />
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>User</label>
          <select
            value={monthlyFilter.user_id}
            onChange={(e) =>
              setMonthlyFilter((prev) => ({
                ...prev,
                user_id: e.target.value,
              }))
            }
            style={styles.input}
          >
            <option value="all">All</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Patient</label>
          <input
            type="text"
            placeholder="Search by patient name or file number"
            value={monthlyFilter.patient}
            onChange={(e) =>
              setMonthlyFilter((prev) => ({
                ...prev,
                patient: e.target.value,
              }))
            }
            style={styles.input}
          />
        </div>

        <div style={styles.fieldGroupEnd}>
          <button type="button" style={styles.primaryButton} onClick={onApplyFilters}>
            Apply Filters
          </button>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div style={styles.emptyState}>No bookings found for this filter.</div>
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
                <th style={styles.th}>Booked By</th>
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
                  <td style={styles.td}>{item.created_by_name || "-"}</td>
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
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
    alignItems: "end",
  },
  fieldGroup: {
    display: "grid",
    gap: "8px",
  },
  fieldGroupEnd: {
    display: "flex",
    alignItems: "end",
  },
  label: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#475569",
  },
  input: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    background: "#fff",
    outline: "none",
  },
  primaryButton: {
    background: "#be185d",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    fontWeight: "800",
    cursor: "pointer",
    width: "100%",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "860px",
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
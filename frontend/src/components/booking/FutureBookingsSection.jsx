import React, { useState } from "react";

function getTomorrowString() {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  return next.toISOString().split("T")[0];
}

export default function FutureBookingsSection({
  futureBookings = [],
  therapistSummary = [],
  daySummary = [],
  therapists = [],
  agents = [],
  futureFilter,
  setFutureFilter,
  onApplyFilters,
  onEditBooking,
  onDeleteBooking,
  defaultOpen = true,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const tomorrow = getTomorrowString();

  return (
    <div style={styles.wrap}>
      <button
        type="button"
        style={styles.collapseHeader}
        onClick={() => setOpen((prev) => !prev)}
      >
        <div>
          <div style={styles.eyebrow}>Future Booking</div>
          <div style={styles.title}>Future Booking Tracker</div>
        </div>
        <div style={styles.chevron}>{open ? "−" : "+"}</div>
      </button>

      {open ? (
        <div style={styles.page}>
          <div style={styles.card}>
            <div style={styles.subtext}>
              View future bookings with therapist and day summaries.
            </div>

            <div style={styles.filterGrid}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>From Date</label>
                <input
                  type="date"
                  min={tomorrow}
                  value={futureFilter.from_date}
                  onChange={(e) =>
                    setFutureFilter((prev) => ({
                      ...prev,
                      from_date: e.target.value,
                    }))
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>To Date</label>
                <input
                  type="date"
                  min={tomorrow}
                  value={futureFilter.to_date}
                  onChange={(e) =>
                    setFutureFilter((prev) => ({
                      ...prev,
                      to_date: e.target.value,
                    }))
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>User</label>
                <select
                  value={futureFilter.user_id}
                  onChange={(e) =>
                    setFutureFilter((prev) => ({
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
                <label style={styles.label}>Physio</label>
                <select
                  value={futureFilter.therapist_id}
                  onChange={(e) =>
                    setFutureFilter((prev) => ({
                      ...prev,
                      therapist_id: e.target.value,
                    }))
                  }
                  style={styles.input}
                >
                  <option value="all">All</option>
                  {therapists.map((therapist) => (
                    <option key={therapist.id} value={therapist.id}>
                      {therapist.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.fieldGroupEnd}>
                <button
                  type="button"
                  style={styles.primaryButton}
                  onClick={onApplyFilters}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>

          <div style={styles.summaryGrid}>
            <div style={styles.card}>
              <div style={styles.sectionTitle}>Per Physio</div>
              {therapistSummary.length === 0 ? (
                <div style={styles.emptyState}>No physio summary found.</div>
              ) : (
                <div style={styles.list}>
                  {therapistSummary.map((item) => (
                    <div key={item.therapist_id} style={styles.summaryRow}>
                      <span style={styles.summaryName}>{item.therapist_name}</span>
                      <span style={styles.summaryBadge}>{item.booked_slots}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.card}>
              <div style={styles.sectionTitle}>Per Day</div>
              {daySummary.length === 0 ? (
                <div style={styles.emptyState}>No day summary found.</div>
              ) : (
                <div style={styles.list}>
                  {daySummary.map((item) => (
                    <div key={item.date} style={styles.summaryRow}>
                      <span style={styles.summaryName}>{item.date}</span>
                      <span style={styles.summaryBadge}>{item.booked_slots}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.sectionTitle}>Future Booking List</div>

            {futureBookings.length === 0 ? (
              <div style={styles.emptyState}>No future bookings found.</div>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Patient</th>
                      <th style={styles.th}>File Number</th>
                      <th style={styles.th}>Physio</th>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Time</th>
                      <th style={styles.th}>Booked By</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {futureBookings.map((item) => (
                      <tr key={item.id}>
                        <td style={styles.td}>{item.patient_name}</td>
                        <td style={styles.td}>{item.patient_id}</td>
                        <td style={styles.td}>{item.therapist_name}</td>
                        <td style={styles.td}>{item.appointment_date}</td>
                        <td style={styles.td}>{item.appointment_time}</td>
                        <td style={styles.td}>{item.created_by_name || "-"}</td>
                        <td style={styles.td}>
                          <div style={styles.actions}>
                            <button
                              type="button"
                              style={styles.editBtn}
                              onClick={() => onEditBooking && onEditBooking(item)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              style={styles.deleteBtn}
                              onClick={() =>
                                onDeleteBooking && onDeleteBooking(item.id)
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const styles = {
  wrap: { display: "grid", gap: "12px" },
  collapseHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    textAlign: "left",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "18px 22px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
    cursor: "pointer",
  },
  chevron: {
    fontSize: "26px",
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: 1,
  },
  page: { display: "grid", gap: "16px" },
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "22px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
    display: "grid",
    gap: "16px",
  },
  eyebrow: {
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#be185d",
  },
  title: { fontSize: "24px", fontWeight: "800", color: "#0f172a" },
  subtext: { fontSize: "14px", color: "#64748b" },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
    alignItems: "end",
  },
  fieldGroup: { display: "grid", gap: "8px" },
  fieldGroupEnd: { display: "flex", alignItems: "end" },
  label: { fontSize: "13px", fontWeight: "700", color: "#475569" },
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
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
  },
  sectionTitle: { fontSize: "16px", fontWeight: "800", color: "#0f172a" },
  list: { display: "grid", gap: "10px" },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "12px 14px",
  },
  summaryName: { fontSize: "14px", fontWeight: "700", color: "#0f172a" },
  summaryBadge: {
    background: "#fdf2f8",
    color: "#be185d",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    minWidth: "36px",
    textAlign: "center",
  },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: "980px" },
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
    verticalAlign: "top",
  },
  actions: { display: "flex", gap: "8px", flexWrap: "wrap" },
  editBtn: {
    background: "#0ea5e9",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "700",
  },
  deleteBtn: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "700",
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
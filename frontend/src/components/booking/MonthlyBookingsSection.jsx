import React, { useMemo, useState } from "react";
import PatientAutocompleteFilter from "./PatientAutocompleteFilter";
import BookingTargetStats from "./BookingTargetStats";

export default function MonthlyBookingsSection({
  bookings = [],
  agents = [],
  therapists = [],
  monthlyFilter,
  setMonthlyFilter,
  onApplyFilters,
  defaultOpen = false,
  target = 0,
  onChangeTarget,
}) {
  const [open, setOpen] = useState(defaultOpen);

  const filteredBookings = useMemo(() => bookings, [bookings]);

  return (
    <div style={styles.wrap}>
      <button
        type="button"
        style={styles.collapseHeader}
        onClick={() => setOpen((prev) => !prev)}
      >
        <div>
          <div style={styles.eyebrow}>Monthly Bookings</div>
          <div style={styles.title}>Monthly Booking Tracker</div>
        </div>
        <div style={styles.chevron}>{open ? "−" : "+"}</div>
      </button>

      {open ? (
        <div style={styles.card}>
          <div style={styles.subtext}>
            Filter bookings by date range, user, patient, or physio.
          </div>

          <div style={styles.filterGrid}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>From Date</label>
              <input
                type="date"
                value={monthlyFilter.from_date}
                onChange={(e) =>
                  setMonthlyFilter((prev) => ({
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
                value={monthlyFilter.to_date}
                onChange={(e) =>
                  setMonthlyFilter((prev) => ({
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
              <label style={styles.label}>Physio</label>
              <select
                value={monthlyFilter.therapist_id}
                onChange={(e) =>
                  setMonthlyFilter((prev) => ({
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

            <PatientAutocompleteFilter
              value={monthlyFilter.patient || ""}
              onChange={(value) =>
                setMonthlyFilter((prev) => ({
                  ...prev,
                  patient: value,
                }))
              }
              label="Patient"
              placeholder="Search patient name or file number"
            />

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

          <BookingTargetStats
            title="Monthly Booking Target"
            target={target}
            actual={filteredBookings.length}
            onChangeTarget={onChangeTarget}
          />

          {filteredBookings.length === 0 ? (
            <div style={styles.emptyState}>No bookings found for this range.</div>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Patient</th>
                    <th style={styles.th}>File Number</th>
                    <th style={styles.th}>Physio</th>
                    <th style={styles.th}>Appointment Date</th>
                    <th style={styles.th}>Time</th>
                    <th style={styles.th}>Booked By</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((item) => (
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
      ) : null}
    </div>
  );
}

const styles = {
  wrap: {
    display: "grid",
    gap: "12px",
  },
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
  title: {
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
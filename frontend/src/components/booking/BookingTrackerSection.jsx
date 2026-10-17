import React, { useEffect, useMemo, useRef, useState } from "react";
import PatientAutocompleteFilter from "./PatientAutocompleteFilter";
function formatDate(date) {
  return date.toISOString().split("T")[0];
}
function getTodayString() {
  return formatDate(new Date());
}
function getTomorrowString() {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  return formatDate(next);
}
function getTwoWeeksForwardString() {
  const next = new Date();
  next.setDate(next.getDate() + 14);
  return formatDate(next);
}
function getCurrentMonthString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
function isPastBooking(appointmentDate, appointmentTime) {
  if (!appointmentDate || !appointmentTime) return false;
  const now = new Date();
  const [year, month, day] = String(appointmentDate)
    .split("-")
    .map(Number);
  const [hours, minutes] = String(appointmentTime)
    .split(":")
    .map(Number);
  const bookingDateTime = new Date(
    year,
    month - 1,
    day,
    hours,
    minutes,
    0,
    0
  );
  return bookingDateTime < now;
}
export default function BookingTrackerSection({
  mode = "today",
  onChangeMode,
  bookings = [],
  therapistSummary = [],
  daySummary = [],
  therapists = [],
  agents = [],
  filter = {},
  setFilter,
  onApplyFilters,
  onEditBooking,
  onDeleteBooking,
  isAdmin = false,
  isPhysio = false,
  currentUserId = "",
}) {
  const debounceRef = useRef(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const today = getTodayString();
  const tomorrow = getTomorrowString();
  const twoWeeksForward = getTwoWeeksForwardString();
  const currentMonth = getCurrentMonthString();
  const visibleTherapists = useMemo(() => {
    if (!isPhysio) return therapists;
    return therapists.filter(
      (therapist) =>
        String(therapist.id) === String(currentUserId)
    );
  }, [therapists, isPhysio, currentUserId]);
  const title = useMemo(() => {
    if (mode === "future") return "Future Booking Tracker";
    if (mode === "monthly") return "Monthly Booking Tracker";
    return "Same Day Booking Tracker";
  }, [mode]);
  const subtitle = useMemo(() => {
    if (mode === "future") return "View future bookings with shared filters.";
    if (mode === "monthly") return "View bookings by selected month.";
    return "View same day bookings using shared filters.";
  }, [mode]);
  useEffect(() => {
    if (!onApplyFilters) return;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onApplyFilters();
    }, 250);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [
    mode,
    filter.date,
    filter.from_date,
    filter.to_date,
    filter.month,
    filter.user_id,
    filter.therapist_id,
    filter.patient,
    onApplyFilters,
  ]);
  const handleModeChange = (nextMode) => {
    setSelectedBooking(null);
    setFilter?.((prev) => {
      if (nextMode === "today") {
        return {
          ...prev,
          mode: "today",
          date: prev.date || today,
        };
      }
      if (nextMode === "future") {
        return {
          ...prev,
          mode: "future",
          from_date: tomorrow,
          to_date: twoWeeksForward,
        };
      }
      return {
        ...prev,
        mode: "monthly",
        month: prev.month || currentMonth,
      };
    });
    onChangeMode?.(nextMode);
  };
  const handleEditSelectedBooking = () => {
    if (!selectedBooking || !onEditBooking) return;
    const booking = selectedBooking;
    setSelectedBooking(null);
    onEditBooking(booking);
  };
  const handleDeleteSelectedBooking = () => {
    if (!selectedBooking || !onDeleteBooking) return;
    const booking = selectedBooking;
    const confirmed = window.confirm(
      `Delete the appointment for ${booking.patient_name || "this patient"} on ${booking.appointment_date || ""} at ${booking.appointment_time || ""}? This action cannot be undone.`
    );
    if (!confirmed) return;
    setSelectedBooking(null);
    onDeleteBooking(booking.id);
  };
  useEffect(() => {
    if (!selectedBooking) return;
    const stillExists = bookings.some(
      (booking) => String(booking.id) === String(selectedBooking.id)
    );
    if (!stillExists) {
      setSelectedBooking(null);
    }
  }, [bookings, selectedBooking]);
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <div>
            <div style={styles.eyebrow}>Booking Tracker</div>
            <div style={styles.title}>{title}</div>
          </div>
          <div style={styles.modeButtons}>
            <button
              type="button"
              style={{
                ...styles.modeBtn,
                ...(mode === "today" ? styles.modeBtnActive : {}),
              }}
              onClick={() => handleModeChange("today")}
            >
              Same Day
            </button>
            <button
              type="button"
              style={{
                ...styles.modeBtn,
                ...(mode === "future" ? styles.modeBtnActive : {}),
              }}
              onClick={() => handleModeChange("future")}
            >
              Future
            </button>
            <button
              type="button"
              style={{
                ...styles.modeBtn,
                ...(mode === "monthly" ? styles.modeBtnActive : {}),
              }}
              onClick={() => handleModeChange("monthly")}
            >
              Month
            </button>
          </div>
        </div>
        <div style={styles.subtext}>{subtitle}</div>
        <div style={styles.filterGrid}>
          {mode === "today" ? (
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Date</label>
              <input
                type="date"
                value={filter.date || today}
                onChange={(e) =>
                  setFilter?.((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
                style={styles.input}
              />
            </div>
          ) : mode === "monthly" ? (
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Month</label>
              <input
                type="month"
                value={filter.month || currentMonth}
                onChange={(e) =>
                  setFilter?.((prev) => ({
                    ...prev,
                    month: e.target.value,
                  }))
                }
                style={styles.input}
              />
            </div>
          ) : (
            <>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>From Date</label>
                <input
                  type="date"
                  min={tomorrow}
                  value={filter.from_date || tomorrow}
                  onChange={(e) =>
                    setFilter?.((prev) => {
                      const nextFromDate = e.target.value;
                      const currentToDate = prev.to_date || twoWeeksForward;
                      return {
                        ...prev,
                        from_date: nextFromDate,
                        to_date:
                          currentToDate && currentToDate < nextFromDate
                            ? nextFromDate
                            : currentToDate,
                      };
                    })
                  }
                  style={styles.input}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>To Date</label>
                <input
                  type="date"
                  min={filter.from_date || tomorrow}
                  value={filter.to_date || twoWeeksForward}
                  onChange={(e) =>
                    setFilter?.((prev) => ({
                      ...prev,
                      to_date: e.target.value,
                    }))
                  }
                  style={styles.input}
                />
              </div>
            </>
          )}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>User</label>
            <select
              value={filter.user_id || "all"}
              onChange={(e) =>
                setFilter?.((prev) => ({
                  ...prev,
                  user_id: e.target.value,
                }))
              }
              style={styles.input}
            >
              <option value="all">All</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name || agent.username}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Physio</label>
            <select
              value={
                filter.therapist_id ||
                (isPhysio ? String(currentUserId) : "all")
              }
              onChange={(e) =>
                setFilter?.((prev) => ({
                  ...prev,
                  therapist_id: e.target.value,
                }))
              }
              style={styles.input}
              disabled={isPhysio}
            >
              {!isPhysio && <option value="all">All</option>}
              {visibleTherapists.map((therapist) => (
                <option key={therapist.id} value={therapist.id}>
                  {therapist.name || therapist.username}
                </option>
              ))}
            </select>
          </div>
          <PatientAutocompleteFilter
            value={filter.patient || ""}
            onChange={(value) =>
              setFilter?.((prev) => ({
                ...prev,
                patient: value,
              }))
            }
            label="Patient"
            placeholder="Search patient name or file number"
          />
        </div>
      </div>
      {mode === "future" && (
        <div style={styles.summaryGrid}>
          <div style={styles.card}>
            <div style={styles.sectionTitle}>Per Physio</div>
            {therapistSummary.length === 0 ? (
              <div style={styles.emptyState}>No physio summary found.</div>
            ) : (
              <div style={styles.list}>
                {therapistSummary.map((item) => (
                  <div key={item.therapist_id} style={styles.summaryRow}>
                    <span style={styles.summaryName}>
                      {item.therapist_name}
                    </span>
                    <span style={styles.summaryBadge}>
                      {item.booked_slots}
                    </span>
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
                    <span style={styles.summaryBadge}>
                      {item.booked_slots}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <div style={styles.card}>
        <div style={styles.sectionTitle}>{title}</div>
        <div style={styles.subtext}>
          Double-click an appointment row to view details and available actions.
        </div>
        {bookings.length === 0 ? (
          <div style={styles.emptyState}>No bookings found.</div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Patient</th>
                  <th style={styles.th}>File</th>
                  <th style={styles.th}>Physio</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Time</th>
                  <th style={styles.th}>By</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const pastBooking = isPastBooking(
                    b.appointment_date,
                    b.appointment_time
                  );
                  return (
                    <tr
                      key={b.id}
                      style={styles.bookingRow}
                      title="Double-click to view appointment details"
                      onDoubleClick={() => setSelectedBooking(b)}
                    >
                      <td style={styles.td}>{b.patient_name || "-"}</td>
                      <td style={styles.td}>{b.patient_id || "-"}</td>
                      <td style={styles.td}>{b.therapist_name || "-"}</td>
                      <td style={styles.td}>{b.appointment_date || "-"}</td>
                      <td style={styles.td}>{b.appointment_time || "-"}</td>
                      <td style={styles.td}>{b.created_by_name || "-"}</td>
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          {!pastBooking ? (
                            <button
                              type="button"
                              style={styles.editBtn}
                              onClick={() => onEditBooking?.(b)}
                            >
                              Edit
                            </button>
                          ) : (
                            <button
                              type="button"
                              style={styles.disabledBtn}
                              disabled
                            >
                              Edit
                            </button>
                          )}
                          {!pastBooking || isAdmin ? (
                            <button
                              type="button"
                              style={styles.deleteBtn}
                              onClick={() => {
                                const confirmed = window.confirm(
                                  `Delete the appointment for ${b.patient_name || "this patient"} on ${b.appointment_date || ""} at ${b.appointment_time || ""}? This action cannot be undone.`
                                );
                                if (confirmed) {
                                  onDeleteBooking?.(b.id);
                                }
                              }}
                            >
                              Delete
                            </button>
                          ) : (
                            <button
                              type="button"
                              style={styles.disabledBtn}
                              disabled
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selectedBooking && (
        <div
          style={styles.modalBackdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedBooking(null);
            }
          }}
        >
          <div
            style={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="appointment-details-title"
          >
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.eyebrow}>Appointment Details</div>
                <div id="appointment-details-title" style={styles.modalTitle}>
                  {selectedBooking.patient_name || "Booked patient"}
                </div>
              </div>
              <button
                type="button"
                style={styles.closeBtn}
                aria-label="Close appointment details"
                onClick={() => setSelectedBooking(null)}
              >
                ×
              </button>
            </div>
            <div style={styles.detailsGrid}>
              <Detail label="Patient file" value={selectedBooking.patient_id} />
              <Detail label="Physiotherapist" value={selectedBooking.therapist_name} />
              <Detail label="Appointment date" value={selectedBooking.appointment_date} />
              <Detail label="Appointment time" value={selectedBooking.appointment_time} />
              <Detail label="Booked by" value={selectedBooking.created_by_name} />
              <Detail label="Booking ID" value={selectedBooking.id} />
            </div>
            <div style={styles.modalActions}>
              {!isPastBooking(
                selectedBooking.appointment_date,
                selectedBooking.appointment_time
              ) ? (
                <button
                  type="button"
                  style={styles.editBtn}
                  onClick={handleEditSelectedBooking}
                  disabled={!onEditBooking}
                >
                  Reschedule
                </button>
              ) : (
                <button type="button" style={styles.disabledBtn} disabled>
                  Reschedule unavailable
                </button>
              )}
              {(!isPastBooking(
                selectedBooking.appointment_date,
                selectedBooking.appointment_time
              ) || isAdmin) && (
                <button
                  type="button"
                  style={styles.deleteBtn}
                  onClick={handleDeleteSelectedBooking}
                  disabled={!onDeleteBooking}
                >
                  Delete appointment
                </button>
              )}
              <button
                type="button"
                style={styles.cancelBtn}
                onClick={() => setSelectedBooking(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function Detail({ label, value }) {
  return (
    <div style={styles.detailItem}>
      <div style={styles.detailLabel}>{label}</div>
      <div style={styles.detailValue}>
        {value === null || value === undefined || value === ""
          ? "-"
          : String(value)}
      </div>
    </div>
  );
}
const styles = {
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
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
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
  modeButtons: { display: "flex", gap: "8px", flexWrap: "wrap" },
  modeBtn: {
    background: "#fff",
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: "800",
    cursor: "pointer",
  },
  modeBtnActive: {
    background: "#fdf2f8",
    color: "#be185d",
    borderColor: "#be185d",
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
    alignItems: "end",
  },
  fieldGroup: { display: "grid", gap: "8px" },
  label: { fontSize: "13px", fontWeight: "700", color: "#475569" },
  input: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    background: "#fff",
    outline: "none",
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
  bookingRow: { cursor: "pointer" },
  actions: { display: "flex", gap: "8px", flexWrap: "wrap" },
  editBtn: {
    background: "#0ea5e9",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "700",
  },
  deleteBtn: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "700",
  },
  disabledBtn: {
    background: "#cbd5e1",
    color: "#64748b",
    border: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    cursor: "not-allowed",
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
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    background: "rgba(15, 23, 42, 0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
  },
  modal: {
    width: "100%",
    maxWidth: "560px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 24px 64px rgba(15, 23, 42, 0.25)",
    display: "grid",
    gap: "22px",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },
  modalTitle: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f172a",
    marginTop: "5px",
  },
  closeBtn: {
    background: "#f1f5f9",
    color: "#334155",
    border: "none",
    borderRadius: "8px",
    width: "36px",
    height: "36px",
    fontSize: "24px",
    cursor: "pointer",
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
  },
  detailItem: {
    padding: "12px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    minWidth: 0,
  },
  detailLabel: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "700",
    marginBottom: "6px",
  },
  detailValue: {
    fontSize: "14px",
    color: "#0f172a",
    fontWeight: "700",
    overflowWrap: "anywhere",
  },
  modalActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    justifyContent: "flex-end",
  },
  cancelBtn: {
    background: "#fff",
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "8px 14px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "700",
  },
};
import React, { useMemo, useState } from "react";
import PatientAutocompleteFilter from "./PatientAutocompleteFilter";

export default function TodayBookingsSection({
  bookings = [],
  onEditBooking,
  onDeleteBooking,
  defaultOpen = true,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [patientSearch, setPatientSearch] = useState("");
  const today = new Date().toISOString().split("T")[0];

  const filteredBookings = useMemo(() => {
    const term = patientSearch.trim().toLowerCase();

    if (!term) {
      return bookings;
    }

    return bookings.filter((item) => {
      const patientName = (item.patient_name || "").toLowerCase();
      const patientId = (item.patient_id || "").toLowerCase();

      return patientName.includes(term) || patientId.includes(term);
    });
  }, [bookings, patientSearch]);

  return (
    <div style={styles.wrap}>
      <button
        type="button"
        style={styles.collapseHeader}
        onClick={() => setOpen((prev) => !prev)}
      >
        <div>
          <div style={styles.eyebrow}>Today&apos;s Bookings</div>
          <div style={styles.title}>Bookings Created Today</div>
        </div>
        <div style={styles.chevron}>{open ? "−" : "+"}</div>
      </button>

      {open ? (
        <div style={styles.card}>
          <div style={styles.subtext}>
            Shows bookings created today by the logged-in user for today or future appointments.
          </div>

          <PatientAutocompleteFilter
            value={patientSearch}
            onChange={setPatientSearch}
            label="Patient"
            placeholder="Search patient name or file number"
          />

          {filteredBookings.length === 0 ? (
            <div style={styles.emptyState}>No bookings found for today.</div>
          ) : (
            <div style={styles.list}>
              {filteredBookings.map((item) => {
                const isPastAppointment = item.appointment_date < today;

                return (
                  <div key={item.id} style={styles.bookingCard}>
                    <div style={styles.topRow}>
                      <div style={styles.patientName}>{item.patient_name}</div>

                      <div style={styles.rightActions}>
                        <div style={styles.timeBadge}>{item.appointment_time}</div>

                        {!isPastAppointment ? (
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
                        ) : (
                          <div style={styles.lockedBadge}>Locked</div>
                        )}
                      </div>
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
                        <span style={styles.metaLabel}>Appointment Date</span>
                        <span style={styles.metaValue}>{item.appointment_date}</span>
                      </div>
                    </div>

                    {item.notes ? (
                      <div style={styles.notesBox}>{item.notes}</div>
                    ) : null}
                  </div>
                );
              })}
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
  rightActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
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
  lockedBadge: {
    background: "#e2e8f0",
    color: "#475569",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
  },
  actions: {
    display: "flex",
    gap: "6px",
  },
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
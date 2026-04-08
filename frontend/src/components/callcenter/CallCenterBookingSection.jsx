import React from "react";
import BookingWeekStrip from "./BookingWeekStrip";
import BookingSlotsBoard from "./BookingSlotsBoard";

export default function CallCenterBookingSection({
  selectedPatient,
  bookingForm,
  setBookingForm,
  therapists,
  weekDates,
  slots,
  onSelectTherapist,
  onSelectDate,
  onSelectSlot,
  onConfirmBooking,
}) {
  if (!selectedPatient) {
    return (
      <div style={styles.emptyState}>
        Search or register a patient first to start booking.
      </div>
    );
  }

  const selectedTherapist =
    therapists.find(
      (item) => String(item.id) === String(bookingForm.therapist_id)
    ) || null;

  return (
    <div style={styles.page}>
      <div style={styles.patientCard}>
        <div style={styles.eyebrow}>Selected Patient</div>
        <div style={styles.patientName}>{selectedPatient.name}</div>
        <div style={styles.patientId}>
          File Number: {selectedPatient.patient_id}
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Choose Physio</div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Physio</label>
          <select
            value={bookingForm.therapist_id || ""}
            onChange={(e) => onSelectTherapist(e.target.value || "")}
            style={styles.input}
          >
            <option value="">Select physio</option>
            {therapists.map((therapist) => (
              <option key={therapist.id} value={String(therapist.id)}>
                {therapist.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <BookingWeekStrip
        weekDates={weekDates}
        selectedDate={bookingForm.appointment_date}
        onSelectDate={onSelectDate}
      />

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Available Slots</div>

        {!bookingForm.therapist_id ? (
          <div style={styles.emptyState}>
            Select a physio first to view slots.
          </div>
        ) : slots.length === 0 ? (
          <div style={styles.emptyState}>
            Loading slots or no availability...
          </div>
        ) : (
          <BookingSlotsBoard
            slots={slots}
            selectedTime={bookingForm.appointment_time}
            onSelectSlot={onSelectSlot}
          />
        )}
      </div>

      <div style={styles.actionCard}>
        <div style={styles.selectionRow}>
          <div style={styles.selectionItem}>
            <span style={styles.selectionLabel}>Physio</span>
            <span style={styles.selectionValue}>
              {selectedTherapist?.name || "-"}
            </span>
          </div>

          <div style={styles.selectionItem}>
            <span style={styles.selectionLabel}>Date</span>
            <span style={styles.selectionValue}>
              {bookingForm.appointment_date || "-"}
            </span>
          </div>

          <div style={styles.selectionItem}>
            <span style={styles.selectionLabel}>Time</span>
            <span style={styles.selectionValue}>
              {bookingForm.appointment_time || "-"}
            </span>
          </div>
        </div>

        <div style={styles.notesWrap}>
          <label style={styles.label}>Notes</label>
          <textarea
            value={bookingForm.notes || ""}
            onChange={(e) =>
              setBookingForm((prev) => ({
                ...prev,
                notes: e.target.value,
              }))
            }
            placeholder="Add optional booking notes"
            style={styles.textarea}
          />
        </div>

        <button
          type="button"
          style={{
            ...styles.primaryButton,
            ...((!bookingForm.therapist_id ||
              !bookingForm.appointment_date ||
              !bookingForm.appointment_time)
              ? styles.primaryButtonDisabled
              : {}),
          }}
          onClick={onConfirmBooking}
          disabled={
            !bookingForm.therapist_id ||
            !bookingForm.appointment_date ||
            !bookingForm.appointment_time
          }
        >
          {bookingForm.booking_id ? "Update Booking" : "Confirm Booking"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "grid",
    gap: "16px",
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
  actionCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "18px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
    display: "grid",
    gap: "14px",
  },
  patientCard: {
    background: "linear-gradient(135deg, #fdf2f8 0%, #ffffff 100%)",
    border: "1px solid #fbcfe8",
    borderRadius: "18px",
    padding: "22px",
    display: "grid",
    gap: "8px",
  },
  eyebrow: {
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#be185d",
  },
  patientName: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
  },
  patientId: {
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a",
  },
  fieldGroup: {
    display: "grid",
    gap: "8px",
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
  selectionRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
  },
  selectionItem: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "12px 14px",
    display: "grid",
    gap: "4px",
  },
  selectionLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
  },
  selectionValue: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#0f172a",
  },
  notesWrap: {
    display: "grid",
    gap: "8px",
  },
  textarea: {
    minHeight: "90px",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    background: "#fff",
    resize: "vertical",
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
  },
  primaryButtonDisabled: {
    background: "#f9a8d4",
    cursor: "not-allowed",
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
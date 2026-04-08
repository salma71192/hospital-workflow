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
      {/* PATIENT */}
      <div style={styles.patientCard}>
        <div style={styles.eyebrow}>Selected Patient</div>
        <div style={styles.patientName}>{selectedPatient.name}</div>
        <div style={styles.patientId}>
          File Number: {selectedPatient.patient_id}
        </div>
      </div>

      {/* PHYSIO DROPDOWN */}
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

      {/* WEEK STRIP */}
      <BookingWeekStrip
        weekDates={weekDates}
        selectedDate={bookingForm.appointment_date}
        onSelectDate={onSelectDate}
      />

      {/* SLOTS */}
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

      {/* CONFIRM */}
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
          Confirm Booking
        </button>
      </div>
    </div>
  );
}
import React from "react";

export default function CallCenterBookingSection({
  selectedPatient,
  bookingForm,
  setBookingForm,
  therapists,
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
        <div style={styles.sectionTitle}>Choose Therapist</div>

        {therapists.length === 0 ? (
          <div style={styles.emptyState}>No therapists available.</div>
        ) : (
          <div style={styles.therapistGrid}>
            {therapists.map((therapist) => {
              const isActive =
                String(bookingForm.therapist_id) === String(therapist.id);

              return (
                <button
                  key={therapist.id}
                  type="button"
                  onClick={() => onSelectTherapist(therapist.id)}
                  style={{
                    ...styles.therapistCard,
                    ...(isActive ? styles.therapistCardActive : {}),
                  }}
                >
                  <div style={styles.therapistName}>{therapist.name}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Selected Booking</div>

        <div style={styles.summaryGrid}>
          <div style={styles.summaryItem}>
            <div style={styles.summaryLabel}>Therapist</div>
            <div style={styles.summaryValue}>
              {therapists.find(
                (item) => String(item.id) === String(bookingForm.therapist_id)
              )?.name || "-"}
            </div>
          </div>

          <div style={styles.summaryItem}>
            <div style={styles.summaryLabel}>Date</div>
            <div style={styles.summaryValue}>
              {bookingForm.appointment_date || "-"}
            </div>
          </div>

          <div style={styles.summaryItem}>
            <div style={styles.summaryLabel}>Time</div>
            <div style={styles.summaryValue}>
              {bookingForm.appointment_time || "-"}
            </div>
          </div>
        </div>

        <div style={styles.infoBox}>
          Next step: add week strip and slot blocks here.
        </div>

        <button
          type="button"
          style={styles.primaryButton}
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
  therapistGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
  },
  therapistCard: {
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: "14px",
    padding: "16px",
    cursor: "pointer",
    textAlign: "left",
    fontWeight: "700",
  },
  therapistCardActive: {
    borderColor: "#be185d",
    background: "#fdf2f8",
  },
  therapistName: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#0f172a",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
  },
  summaryItem: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "14px",
    display: "grid",
    gap: "6px",
  },
  summaryLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
  },
  summaryValue: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#0f172a",
  },
  infoBox: {
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: "12px",
    padding: "14px",
    color: "#64748b",
    fontWeight: "600",
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
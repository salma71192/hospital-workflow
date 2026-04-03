import React from "react";

export default function PatientRegisterForm({
  patientForm,
  setPatientForm,
  onSubmit,
}) {
  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Register New Patient</h2>

      <form onSubmit={onSubmit} style={styles.form}>
        <input
          type="text"
          name="name"
          placeholder="Patient Name"
          value={patientForm.name}
          onChange={(e) =>
            setPatientForm({ ...patientForm, name: e.target.value })
          }
          style={styles.input}
          required
        />

        <input
          type="text"
          name="patient_id"
          placeholder="Patient ID"
          value={patientForm.patient_id}
          onChange={(e) =>
            setPatientForm({ ...patientForm, patient_id: e.target.value })
          }
          style={styles.input}
          required
        />

        <input
          type="text"
          name="current_approval_number"
          placeholder="Current Approval Number"
          value={patientForm.current_approval_number}
          onChange={(e) =>
            setPatientForm({
              ...patientForm,
              current_approval_number: e.target.value,
            })
          }
          style={styles.input}
        />

        <input
          type="number"
          name="sessions_taken"
          placeholder="Sessions Taken"
          value={patientForm.sessions_taken}
          onChange={(e) =>
            setPatientForm({ ...patientForm, sessions_taken: e.target.value })
          }
          style={styles.input}
        />

        <input
          type="text"
          name="taken_with"
          placeholder="Taken With"
          value={patientForm.taken_with}
          onChange={(e) =>
            setPatientForm({ ...patientForm, taken_with: e.target.value })
          }
          style={styles.input}
        />

        <textarea
          name="current_future_appointments"
          placeholder="Current / Future Appointments"
          value={patientForm.current_future_appointments}
          onChange={(e) =>
            setPatientForm({
              ...patientForm,
              current_future_appointments: e.target.value,
            })
          }
          style={styles.textarea}
        />

        <button type="submit" style={styles.primaryButton}>
          Register Patient
        </button>
      </form>
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: "22px",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e8eef7",
    padding: "24px",
  },
  cardTitle: {
    margin: "0 0 18px 0",
    fontSize: "28px",
    fontWeight: "800",
    color: "#0f172a",
  },
  form: {
    display: "grid",
    gap: "14px",
  },
  input: {
    padding: "13px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box",
  },
  textarea: {
    minHeight: "90px",
    padding: "13px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    resize: "vertical",
  },
  primaryButton: {
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "13px 18px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },
};
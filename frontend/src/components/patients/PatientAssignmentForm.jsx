import React from "react";

export default function PatientAssignmentForm({
  selectedPatient,
  assignmentForm,
  setAssignmentForm,
  therapists = [],
  onSubmit,
}) {
  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Assign Patient to Therapist</h2>

      {selectedPatient ? (
        <div style={styles.selectedPatientBox}>
          <strong>Selected Patient:</strong> {selectedPatient.name} (
          {selectedPatient.patient_id})
        </div>
      ) : (
        <div style={styles.helperText}>
          Search and select a patient first, or register a new one.
        </div>
      )}

      <div style={styles.fixedDateBox}>
        Assignment Date: Today
      </div>

      <form onSubmit={onSubmit} style={styles.form}>
        <select
          name="therapist_id"
          value={assignmentForm.therapist_id}
          onChange={(e) =>
            setAssignmentForm({ ...assignmentForm, therapist_id: e.target.value })
          }
          style={styles.input}
          required
        >
          <option value="">Select Therapist</option>
          {therapists.map((therapist) => (
            <option key={therapist.id} value={therapist.id}>
              {therapist.username}
            </option>
          ))}
        </select>

        <select
          name="category"
          value={assignmentForm.category}
          onChange={(e) =>
            setAssignmentForm({ ...assignmentForm, category: e.target.value })
          }
          style={styles.input}
          required
        >
          <option value="appointment">Has Appointment</option>
          <option value="walk_in">Walk In</option>
          <option value="initial_evaluation">Initial Evaluation</option>
          <option value="task_without_eligibility">Task Without Eligibility</option>
        </select>

        <textarea
          name="notes"
          placeholder="Notes"
          value={assignmentForm.notes}
          onChange={(e) =>
            setAssignmentForm({ ...assignmentForm, notes: e.target.value })
          }
          style={styles.textarea}
        />

        <button
          type="submit"
          style={styles.primaryButton}
          disabled={!assignmentForm.patient_id}
        >
          Assign Patient
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
  selectedPatientBox: {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    borderRadius: "12px",
    padding: "14px",
    marginBottom: "14px",
    fontWeight: "700",
  },
  helperText: {
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: "12px",
    padding: "14px",
    marginBottom: "14px",
  },
  fixedDateBox: {
    background: "#f8fafc",
    color: "#334155",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "12px 14px",
    marginBottom: "14px",
    fontWeight: "700",
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
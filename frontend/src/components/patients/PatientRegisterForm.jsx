import React from "react";

export default function PatientRegisterForm({
  patientForm,
  setPatientForm,
  onSubmit,
}) {
  return (
    <div style={styles.card}>
      <div style={styles.eyebrow}>Reception Registration</div>
      <h2 style={styles.cardTitle}>Register New Patient</h2>
      <p style={styles.helperText}>
        Create the patient file with name and file number only. Registration
        user and role are recorded automatically.
      </p>

      <form onSubmit={onSubmit} style={styles.form}>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Patient Name</label>
          <input
            type="text"
            name="name"
            placeholder="Enter patient name"
            value={patientForm.name || ""}
            onChange={(e) =>
              setPatientForm({ ...patientForm, name: e.target.value })
            }
            style={styles.input}
            required
          />
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>File Number</label>
          <input
            type="text"
            name="patient_id"
            placeholder="Enter file number"
            value={patientForm.patient_id || ""}
            onChange={(e) =>
              setPatientForm({ ...patientForm, patient_id: e.target.value })
            }
            style={styles.input}
            required
          />
        </div>

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
    display: "grid",
    gap: "12px",
  },
  eyebrow: {
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#2563eb",
  },
  cardTitle: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "800",
    color: "#0f172a",
  },
  helperText: {
    margin: 0,
    fontSize: "14px",
    color: "#64748b",
  },
  form: {
    display: "grid",
    gap: "14px",
    marginTop: "6px",
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
    padding: "13px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
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
    marginTop: "4px",
  },
};
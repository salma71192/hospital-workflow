import React from "react";

export default function ApprovalsPatientRegisterForm({
  patientForm,
  setPatientForm,
  onSubmit,
}) {
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.eyebrow}>Patient Registration</div>
        <h2 style={styles.title}>Register New Patient</h2>
        <div style={styles.subtext}>
          Create the patient file with patient name and file number only.
          Approval details can be added after registration.
        </div>
      </div>

      <form onSubmit={onSubmit} style={styles.form}>
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Patient Details</div>

          <div style={styles.formGrid}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Patient Name</label>
              <input
                type="text"
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
                placeholder="Enter file number"
                value={patientForm.patient_id || ""}
                onChange={(e) =>
                  setPatientForm({ ...patientForm, patient_id: e.target.value })
                }
                style={styles.input}
                required
              />
            </div>
          </div>
        </div>

        <div style={styles.infoBox}>
          The first registration user and role are recorded automatically in the
          patient file.
        </div>

        <div style={styles.actionBar}>
          <button type="submit" style={styles.primaryButton}>
            Register Patient
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
    display: "grid",
    gap: "20px",
  },
  header: {
    display: "grid",
    gap: "6px",
  },
  eyebrow: {
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#2563eb",
  },
  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
  },
  subtext: {
    fontSize: "14px",
    color: "#64748b",
  },
  form: {
    display: "grid",
    gap: "20px",
  },
  section: {
    display: "grid",
    gap: "12px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
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
    fontSize: "15px",
    background: "#fff",
    outline: "none",
  },
  infoBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "14px",
    color: "#475569",
    fontWeight: "600",
  },
  actionBar: {
    display: "flex",
    justifyContent: "flex-end",
    paddingTop: "8px",
    borderTop: "1px solid #e2e8f0",
  },
  primaryButton: {
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 20px",
    fontWeight: "800",
    cursor: "pointer",
  },
};
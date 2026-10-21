
import React from "react";

export default function PatientRegisterForm({
  patientForm,
  setPatientForm,
  onSubmit,
}) {
  const handleChange = (field, value) => {
    setPatientForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <span style={styles.eyebrow}>RECEPTION TEAM</span>
          <h2 style={styles.cardTitle}>Register New Patient</h2>
          <p style={styles.helperText}>
            Create a new patient file by entering the patient's
            name, file number, and insurance provider.
            Registration user and role are recorded automatically.
          </p>
        </div>

        <div style={styles.headerBadge}>
          <span style={styles.headerIcon}>+</span>
          <span>New Registration</span>
        </div>
      </div>

      <div style={styles.infoBanner}>
        <span style={styles.infoIcon}>i</span>
        <div>
          <strong style={styles.infoTitle}>
            Patient File Creation
          </strong>
          <p style={styles.infoText}>
            Please verify the patient name, file number, and
            insurance provider before submitting.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} style={styles.form}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionIcon}>01</span>
          <div>
            <h3 style={styles.sectionTitle}>
              Patient Information
            </h3>
            <p style={styles.sectionSubtitle}>
              Complete the required fields below.
            </p>
          </div>
        </div>

        <div style={styles.fieldsGrid}>
          {/* Patient Name */}
          <div style={styles.fieldGroup}>
            <label htmlFor="patient-name" style={styles.label}>
              Patient Name <span style={styles.required}>*</span>
            </label>

            <input
              id="patient-name"
              type="text"
              name="name"
              placeholder="Enter patient name"
              value={patientForm.name || ""}
              onChange={(e) =>
                handleChange("name", e.target.value)
              }
              style={styles.input}
              autoComplete="off"
              required
            />

            <span style={styles.fieldHint}>
              Enter the patient's full name.
            </span>
          </div>

          {/* File Number */}
          <div style={styles.fieldGroup}>
            <label
              htmlFor="patient-file-number"
              style={styles.label}
            >
              File Number <span style={styles.required}>*</span>
            </label>

            <input
              id="patient-file-number"
              type="text"
              name="patient_id"
              placeholder="Enter file number"
              value={patientForm.patient_id || ""}
              onChange={(e) =>
                handleChange("patient_id", e.target.value)
              }
              style={styles.input}
              autoComplete="off"
              required
            />

            <span style={styles.fieldHint}>
              Use the patient's existing hospital file number.
            </span>
          </div>

          {/* Insurance Provider */}
          <div style={styles.fieldGroup}>
            <label
              htmlFor="insurance-provider"
              style={styles.label}
            >
              Insurance Provider{" "}
              <span style={styles.required}>*</span>
            </label>

            <select
              id="insurance-provider"
              name="insurance_provider"
              value={patientForm.insurance_provider || ""}
              onChange={(e) =>
                handleChange(
                  "insurance_provider",
                  e.target.value
                )
              }
              style={styles.select}
              required
            >
              <option value="" disabled>
                Select insurance provider
              </option>
              <option value="Thiqa">Thiqa</option>
              <option value="Daman">Daman</option>
            </select>

            <span style={styles.fieldHint}>
              Select the patient's insurance provider.
            </span>
          </div>
        </div>

        <div style={styles.footer}>
          <div style={styles.requiredNote}>
            <span style={styles.required}>*</span> Required fields
          </div>

          <button type="submit" style={styles.primaryButton}>
            <span style={styles.buttonIcon}>+</span>
            Register Patient
            <span style={styles.buttonArrow}>→</span>
          </button>
        </div>
      </form>

      <div style={styles.bottomBadge}>
        <span style={styles.secureIcon}>✓</span>
        <span>Reception Registration</span>
        <span style={styles.dot}>•</span>
        <span>Patient File Management</span>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "#ffffff",
    borderRadius: "22px",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.07)",
    border: "1px solid #e3eaf5",
    padding: "clamp(18px, 3vw, 28px)",
    display: "grid",
    gap: "22px",
    width: "100%",
    boxSizing: "border-box",
    color: "#0f172a",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
  },

  eyebrow: {
    display: "inline-block",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "0.09em",
    color: "#2563eb",
    background: "#eff6ff",
    border: "1px solid #dbeafe",
    borderRadius: "8px",
    padding: "6px 10px",
    marginBottom: "12px",
  },

  cardTitle: {
    margin: "0 0 8px",
    fontSize: "clamp(22px, 3vw, 28px)",
    fontWeight: "800",
    lineHeight: 1.25,
    color: "#0f172a",
  },

  helperText: {
    margin: 0,
    fontSize: "14px",
    lineHeight: 1.7,
    color: "#64748b",
    maxWidth: "650px",
  },

  headerBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "#f5f3ff",
    color: "#6d28d9",
    border: "1px solid #ddd6fe",
    borderRadius: "12px",
    padding: "10px 12px",
    fontSize: "12px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },

  headerIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "23px",
    height: "23px",
    borderRadius: "7px",
    background: "#7c3aed",
    color: "#ffffff",
    fontSize: "19px",
    lineHeight: 1,
  },

  infoBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "15px",
    borderRadius: "14px",
    background:
      "linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)",
    border: "1px solid #dbeafe",
  },

  infoIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: "25px",
    height: "25px",
    borderRadius: "50%",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "800",
    fontStyle: "italic",
  },

  infoTitle: {
    display: "block",
    color: "#1e40af",
    fontSize: "13px",
    fontWeight: "800",
    marginBottom: "4px",
  },

  infoText: {
    margin: 0,
    color: "#475569",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  form: {
    display: "grid",
    gap: "20px",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  sectionIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    background: "#ede9fe",
    color: "#6d28d9",
    fontSize: "13px",
    fontWeight: "900",
  },

  sectionTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "16px",
    fontWeight: "800",
  },

  sectionSubtitle: {
    margin: "4px 0 0",
    color: "#64748b",
    fontSize: "12px",
  },

  fieldsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
    gap: "18px",
  },

  fieldGroup: {
    display: "grid",
    alignContent: "start",
    gap: "8px",
    minWidth: 0,
  },

  label: {
    fontSize: "13px",
    fontWeight: "800",
    color: "#334155",
  },

  required: {
    color: "#dc2626",
    fontWeight: "900",
  },

  input: {
    display: "block",
    padding: "13px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    lineHeight: 1.5,
    background: "#ffffff",
    color: "#0f172a",
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    outline: "none",
  },

  select: {
    display: "block",
    padding: "13px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    lineHeight: 1.5,
    background: "#ffffff",
    color: "#0f172a",
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    outline: "none",
    cursor: "pointer",
  },

  fieldHint: {
    color: "#94a3b8",
    fontSize: "11px",
    lineHeight: 1.5,
  },

  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "14px",
    paddingTop: "18px",
    borderTop: "1px solid #e2e8f0",
  },

  requiredNote: {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "600",
  },

  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    background:
      "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    padding: "13px 19px",
    fontSize: "14px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 5px 12px rgba(37, 99, 235, 0.20)",
    maxWidth: "100%",
  },

  buttonIcon: {
    fontSize: "19px",
    lineHeight: 1,
  },

  buttonArrow: {
    fontSize: "18px",
    lineHeight: 1,
    marginLeft: "3px",
  },

  bottomBadge: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
    paddingTop: "14px",
    borderTop: "1px solid #f1f5f9",
    color: "#64748b",
    fontSize: "11px",
    fontWeight: "700",
  },

  secureIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "19px",
    height: "19px",
    borderRadius: "6px",
    background: "#dcfce7",
    color: "#15803d",
    fontSize: "12px",
    fontWeight: "900",
  },

  dot: {
    color: "#cbd5e1",
  },
};

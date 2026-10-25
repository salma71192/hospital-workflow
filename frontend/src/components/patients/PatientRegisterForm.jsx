
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
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Hero Header */}
        <div style={styles.hero}>
          <div style={styles.heroContent}>
            <div style={styles.heroIcon}>
              <svg
                viewBox="0 0 24 24"
                width="40"
                height="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="9" cy="8" r="4" />
                <path d="M2 21v-2a7 7 0 0 1 14 0v2" />
                <path d="M19 8v6" />
                <path d="M16 11h6" />
              </svg>
            </div>

            <div style={styles.heroText}>
              <span style={styles.eyebrow}>RECEPTION TEAM</span>
              <h2 style={styles.cardTitle}>Register New Patient</h2>
              <p style={styles.heroDescription}>
                Create a new patient file by entering the patient's
                name, gender, file number, and insurance provider.
                Registration user and role are recorded automatically.
              </p>
            </div>
          </div>

          <div style={styles.headerBadge}>
            <span style={styles.badgePlus}>+</span>
            <span>New Registration</span>
          </div>
        </div>

        {/* Main Content */}
        <div style={styles.content}>
          {/* Information Banner */}
          <div style={styles.infoBanner}>
            <div style={styles.infoIcon}>i</div>
            <div style={styles.infoDivider} />
            <div style={styles.infoContent}>
              <strong style={styles.infoTitle}>
                Patient File Creation
              </strong>
              <p style={styles.infoText}>
                Please verify the patient name, gender, file number,
                and insurance provider before submitting.
              </p>
            </div>
          </div>

          {/* Patient Information Form */}
          <form onSubmit={onSubmit} style={styles.form}>
            <div style={styles.formCard}>
              <div style={styles.sectionHeader}>
                <div style={styles.sectionNumber}>01</div>
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
                    Patient Name{" "}
                    <span style={styles.required}>*</span>
                  </label>

                  <div style={styles.inputWrapper}>
                    <span style={styles.fieldIcon}>
                      <svg
                        viewBox="0 0 24 24"
                        width="21"
                        height="21"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
                      </svg>
                    </span>

                    <input
                      id="patient-name"
                      type="text"
                      name="name"
                      placeholder="Enter patient name"
                      value={patientForm?.name ?? ""}
                      onChange={(e) =>
                        handleChange("name", e.target.value)
                      }
                      style={styles.input}
                      autoComplete="off"
                      required
                    />
                  </div>

                  <span style={styles.fieldHint}>
                    Enter the patient's full name.
                  </span>
                </div>

                {/* Gender */}
                <div style={styles.fieldGroup}>
                  <label htmlFor="patient-gender" style={styles.label}>
                    Gender <span style={styles.required}>*</span>
                  </label>

                  <div style={styles.inputWrapper}>
                    <span style={styles.fieldIcon}>
                      <svg
                        viewBox="0 0 24 24"
                        width="21"
                        height="21"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <circle cx="9" cy="8" r="4" />
                        <path d="M9 12v8" />
                        <path d="M5 16h8" />
                        <path d="M16 5h5v5" />
                        <path d="m21 5-6 6" />
                        <path d="M16 15a4 4 0 1 0 0 8" />
                      </svg>
                    </span>

                    <select
                      id="patient-gender"
                      name="gender"
                      value={patientForm?.gender ?? ""}
                      onChange={(e) =>
                        handleChange("gender", e.target.value)
                      }
                      style={styles.select}
                      required
                    >
                      <option value="" disabled>
                        Select gender
                      </option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>

                    <span style={styles.selectArrow}>⌄</span>
                  </div>

                  <span style={styles.fieldHint}>
                    Select the patient's gender.
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

                  <div style={styles.inputWrapper}>
                    <span style={styles.fieldIcon}>
                      <svg
                        viewBox="0 0 24 24"
                        width="21"
                        height="21"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="16"
                          rx="2"
                        />
                        <circle cx="8" cy="10" r="2" />
                        <path d="M5.5 15a3 3 0 0 1 5 0" />
                        <path d="M14 9h4" />
                        <path d="M14 13h4" />
                        <path d="M14 16h3" />
                      </svg>
                    </span>

                    <input
                      id="patient-file-number"
                      type="text"
                      name="patient_id"
                      placeholder="Enter file number"
                      value={patientForm?.patient_id ?? ""}
                      onChange={(e) =>
                        handleChange("patient_id", e.target.value)
                      }
                      style={styles.input}
                      autoComplete="off"
                      required
                    />
                  </div>

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

                  <div style={styles.inputWrapper}>
                    <span style={styles.fieldIcon}>
                      <svg
                        viewBox="0 0 24 24"
                        width="21"
                        height="21"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </span>

                    <select
                      id="insurance-provider"
                      name="insurance_provider"
                      value={patientForm?.insurance_provider ?? ""}
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

                    <span style={styles.selectArrow}>⌄</span>
                  </div>

                  <span style={styles.fieldHint}>
                    Select the patient's insurance provider.
                  </span>
                </div>
              </div>

              {/* Form Footer */}
              <div style={styles.footer}>
                <div style={styles.requiredNote}>
                  <span style={styles.required}>*</span>
                  <span>Required fields</span>
                </div>

                <button type="submit" style={styles.primaryButton}>
                  <span style={styles.buttonPlus}>+</span>
                  <span>Register Patient</span>
                  <span style={styles.buttonArrow}>→</span>
                </button>
              </div>

              {/* Bottom Trust Strip */}
              <div style={styles.bottomBadge}>
                <span style={styles.secureIcon}>✓</span>
                <span>Reception Registration</span>
                <span style={styles.dot}>•</span>
                <span>Patient File Management</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    padding: "clamp(8px, 2vw, 24px)",
    background:
      "radial-gradient(ellipse at top left, #eaf4ff 0%, transparent 48%), linear-gradient(145deg, #f1f7ff 0%, #f8fbff 55%, #eaf5ff 100%)",
    borderRadius: "22px",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#102b55",
  },

  card: {
    width: "100%",
    maxWidth: "1500px",
    margin: "0 auto",
    background: "#ffffff",
    border: "1px solid #d9e9ff",
    borderRadius: "22px",
    overflow: "hidden",
    boxShadow: "0 18px 48px rgba(28, 83, 153, 0.10)",
    boxSizing: "border-box",
  },

  hero: {
    position: "relative",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "24px",
    padding: "clamp(24px, 4vw, 42px)",
    background:
      "linear-gradient(120deg, #123e86 0%, #1762ba 55%, #087fae 100%)",
    color: "#ffffff",
    overflow: "hidden",
  },

  heroContent: {
    display: "flex",
    alignItems: "center",
    gap: "22px",
    flex: "1 1 420px",
    minWidth: 0,
  },

  heroIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: "78px",
    height: "78px",
    borderRadius: "21px",
    color: "#ffffff",
    background: "rgba(255,255,255,0.13)",
    border: "1px solid rgba(255,255,255,0.28)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
  },

  heroText: {
    minWidth: 0,
  },

  eyebrow: {
    display: "inline-block",
    padding: "6px 11px",
    marginBottom: "10px",
    borderRadius: "20px",
    background: "rgba(97, 190, 255, 0.25)",
    border: "1px solid rgba(191, 226, 255, 0.28)",
    color: "#e6f5ff",
    fontSize: "10px",
    fontWeight: 850,
    letterSpacing: "0.12em",
  },

  cardTitle: {
    margin: "0 0 10px",
    fontSize: "clamp(23px, 3vw, 34px)",
    lineHeight: 1.2,
    fontWeight: 850,
    letterSpacing: "-0.8px",
    color: "#ffffff",
  },

  heroDescription: {
    margin: 0,
    maxWidth: "650px",
    color: "#e2efff",
    fontSize: "13px",
    lineHeight: 1.8,
  },

  headerBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "10px 16px",
    borderRadius: "30px",
    background: "linear-gradient(135deg, #18c7cf, #0ba6bd)",
    border: "1px solid rgba(167, 255, 255, 0.45)",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: 800,
    whiteSpace: "nowrap",
    boxShadow: "0 6px 18px rgba(0, 20, 70, 0.15)",
  },

  badgePlus: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    background: "#ffffff",
    color: "#087fae",
    fontSize: "23px",
    fontWeight: 600,
    lineHeight: 1,
  },

  content: {
    display: "grid",
    gap: "22px",
    padding: "clamp(16px, 3vw, 32px)",
    background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
  },

  infoBanner: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "17px 20px",
    borderRadius: "15px",
    border: "1px solid #bfdbfe",
    background: "linear-gradient(110deg, #edf6ff 0%, #f0f7ff 100%)",
  },

  infoIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: "43px",
    height: "43px",
    borderRadius: "50%",
    background: "linear-gradient(145deg, #3b82f6, #1762d5)",
    color: "#ffffff",
    fontSize: "22px",
    fontWeight: 850,
    fontStyle: "italic",
  },

  infoDivider: {
    width: "2px",
    alignSelf: "stretch",
    minHeight: "40px",
    background: "#93baff",
  },

  infoContent: {
    minWidth: 0,
  },

  infoTitle: {
    display: "block",
    marginBottom: "4px",
    color: "#1452a0",
    fontSize: "14px",
    fontWeight: 850,
  },

  infoText: {
    margin: 0,
    color: "#506c94",
    fontSize: "12px",
    lineHeight: 1.7,
  },

  form: {
    margin: 0,
    minWidth: 0,
  },

  formCard: {
    padding: "clamp(16px, 2.5vw, 28px)",
    border: "1px solid #dbeafe",
    borderRadius: "18px",
    background: "#ffffff",
    boxShadow: "0 5px 20px rgba(30, 64, 175, 0.035)",
    minWidth: 0,
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "26px",
  },

  sectionNumber: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    background: "linear-gradient(145deg, #e0efff, #d5e8ff)",
    border: "1px solid #bfdbfe",
    color: "#2563eb",
    fontSize: "19px",
    fontWeight: 900,
  },

  sectionTitle: {
    margin: 0,
    color: "#103b78",
    fontSize: "20px",
    fontWeight: 850,
    letterSpacing: "-0.4px",
  },

  sectionSubtitle: {
    margin: "5px 0 0",
    color: "#7187a8",
    fontSize: "12px",
    lineHeight: 1.6,
  },

  fieldsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 290px), 1fr))",
    gap: "26px 24px",
  },

  fieldGroup: {
    display: "grid",
    alignContent: "start",
    gap: "9px",
    minWidth: 0,
  },

  label: {
    color: "#173b70",
    fontSize: "13px",
    fontWeight: 800,
  },

  required: {
    color: "#e11d48",
    fontWeight: 900,
    marginLeft: "2px",
  },

  inputWrapper: {
    display: "flex",
    alignItems: "stretch",
    minWidth: 0,
    width: "100%",
    minHeight: "52px",
    border: "1px solid #c7d9f2",
    borderRadius: "12px",
    background: "#ffffff",
    boxSizing: "border-box",
    overflow: "hidden",
    transition: "border-color 0.2s ease",
  },

  fieldIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: "55px",
    color: "#3572d6",
    background: "#f2f7ff",
    borderRight: "1px solid #dce8f8",
  },

  input: {
    display: "block",
    flex: 1,
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#16365f",
    fontFamily: "inherit",
    fontSize: "13px",
  },

  select: {
    display: "block",
    flex: 1,
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    padding: "13px 8px 13px 14px",
    border: "none",
    outline: "none",
    appearance: "none",
    background: "transparent",
    color: "#16365f",
    fontFamily: "inherit",
    fontSize: "13px",
    cursor: "pointer",
  },

  selectArrow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    padding: "0 16px 5px 8px",
    color: "#3565a8",
    fontSize: "23px",
    pointerEvents: "none",
  },

  fieldHint: {
    color: "#8397b5",
    fontSize: "11px",
    lineHeight: 1.6,
  },

  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginTop: "28px",
    paddingTop: "20px",
    borderTop: "1px solid #dbeafe",
  },

  requiredNote: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#5c759b",
    fontSize: "12px",
    fontWeight: 650,
  },

  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    minHeight: "52px",
    padding: "13px 22px",
    border: "none",
    borderRadius: "14px",
    background: "linear-gradient(120deg, #1685f8 0%, #3f46e8 100%)",
    color: "#ffffff",
    fontFamily: "inherit",
    fontSize: "13px",
    fontWeight: 850,
    cursor: "pointer",
    boxShadow: "0 7px 17px rgba(37, 99, 235, 0.22)",
    maxWidth: "100%",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },

  buttonPlus: {
    fontSize: "27px",
    lineHeight: 0.8,
    fontWeight: 500,
  },

  buttonArrow: {
    fontSize: "23px",
    lineHeight: 1,
    marginLeft: "3px",
  },

  bottomBadge: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "12px",
    margin: "16px -28px -28px",
    padding: "16px 20px",
    borderTop: "1px solid #d6f4f4",
    borderRadius: "0 0 17px 17px",
    background: "linear-gradient(100deg, #edfcfb, #e8f9fc)",
    color: "#236b88",
    fontSize: "11px",
    fontWeight: 650,
  },

  secureIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "23px",
    height: "23px",
    borderRadius: "50%",
    background: "#0da99b",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 900,
  },

  dot: {
    color: "#36a4b5",
    fontWeight: 900,
  },
};

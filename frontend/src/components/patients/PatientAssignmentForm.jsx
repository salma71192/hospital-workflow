
import React, { forwardRef, useEffect, useState } from "react";

const PatientAssignmentForm = forwardRef(function PatientAssignmentForm(
  {
    selectedPatient,
    assignmentForm = {},
    setAssignmentForm,
    therapists = [],
    onSubmit,
    loading = false,
  },
  ref
) {
  const [highlight, setHighlight] = useState(false);
  const [validationError, setValidationError] = useState("");

  const category = assignmentForm.category || "appointment";
  const requiresPhysician = category === "initial_evaluation";

  // Highlight the card when the selected patient changes.
  useEffect(() => {
    if (!selectedPatient) {
      setHighlight(false);
      return undefined;
    }

    setHighlight(true);

    const timer = setTimeout(() => {
      setHighlight(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [selectedPatient]);

  // Update form fields without losing other values.
  const updateField = (field, value) => {
    setValidationError("");

    setAssignmentForm((previous) => ({
      ...previous,
      [field]: value,
      ...(field === "category" && value !== "initial_evaluation"
        ? { referring_physician: "" }
        : {}),
    }));
  };

  // Validate required fields before submitting.
  const handleSubmit = (event) => {
    event.preventDefault();
    setValidationError("");

    if (!assignmentForm.patient_id) {
      setValidationError("Please select a patient first.");
      return;
    }

    if (!assignmentForm.therapist_id) {
      setValidationError("Please select a therapist.");
      return;
    }

    if (!String(assignmentForm.visit_number ?? "").trim()) {
      setValidationError("Visit Number is required for every assignment.");
      return;
    }

    if (
      requiresPhysician &&
      !String(assignmentForm.referring_physician ?? "").trim()
    ) {
      setValidationError(
        "Referring Physician is required for Initial Evaluation."
      );
      return;
    }

    if (typeof onSubmit === "function") {
      onSubmit(event);
    }
  };

  return (
    <div
      ref={ref}
      style={{
        ...styles.card,
        ...(highlight ? styles.cardHighlight : {}),
      }}
    >
      <h2 style={styles.cardTitle}>Assign Patient to Therapist</h2>

      {selectedPatient ? (
        <div style={styles.selectedPatientBox}>
          <strong>Selected Patient:</strong>{" "}
          {selectedPatient.name || "Unnamed Patient"} (
          {selectedPatient.patient_id || assignmentForm.patient_id})
        </div>
      ) : (
        <div style={styles.helperText}>
          Search and select a patient first, or register a new one.
        </div>
      )}

      <div style={styles.fixedDateBox}>
        📅 Assignment Date: Today
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* CATEGORY */}
        <div style={styles.field}>
          <label htmlFor="assignment-category" style={styles.label}>
            Category <span style={styles.required}>*</span>
          </label>

          <select
            id="assignment-category"
            name="category"
            value={category}
            onChange={(event) =>
              updateField("category", event.target.value)
            }
            style={styles.input}
            required
          >
            <option value="appointment">Has Appointment</option>
            <option value="walk_in">Walk In</option>
            <option value="initial_evaluation">
              Initial Evaluation
            </option>
            <option value="task_without_eligibility">
              Task Without Eligibility
            </option>
            <option value="cash">Cash</option>
          </select>
        </div>

        {/* THERAPIST */}
        <div style={styles.field}>
          <label htmlFor="assignment-therapist" style={styles.label}>
            Assign Therapist <span style={styles.required}>*</span>
          </label>

          <select
            id="assignment-therapist"
            name="therapist_id"
            value={assignmentForm.therapist_id ?? ""}
            onChange={(event) =>
              updateField("therapist_id", event.target.value)
            }
            style={styles.input}
            required
          >
            <option value="">Select Therapist</option>

            {therapists.map((therapist) => (
              <option key={therapist.id} value={therapist.id}>
                {therapist.display_name ||
                  therapist.full_name ||
                  therapist.username ||
                  `Therapist ${therapist.id}`}
              </option>
            ))}
          </select>
        </div>

        {/* VISIT NUMBER - REQUIRED FOR ALL CATEGORIES */}
        <div style={styles.field}>
          <label htmlFor="assignment-visit-number" style={styles.label}>
            Visit Number <span style={styles.required}>*</span>
          </label>

          <input
            id="assignment-visit-number"
            name="visit_number"
            type="text"
            value={assignmentForm.visit_number ?? ""}
            onChange={(event) =>
              updateField("visit_number", event.target.value)
            }
            placeholder="Enter visit number"
            style={styles.input}
            required
          />

          <small style={styles.helpText}>
            Visit Number is required for every assigned task.
          </small>
        </div>

        {/* REFERRING PHYSICIAN - INITIAL EVALUATION ONLY */}
        {requiresPhysician && (
          <div style={styles.field}>
            <label
              htmlFor="assignment-referring-physician"
              style={styles.label}
            >
              Referring Physician{" "}
              <span style={styles.required}>*</span>
            </label>

            <input
              id="assignment-referring-physician"
              name="referring_physician"
              type="text"
              value={assignmentForm.referring_physician ?? ""}
              onChange={(event) =>
                updateField("referring_physician", event.target.value)
              }
              placeholder="Enter referring physician"
              style={styles.input}
              required
            />
          </div>
        )}

        {/* NOTES */}
        <div style={styles.field}>
          <label htmlFor="assignment-notes" style={styles.label}>
            Notes
          </label>

          <textarea
            id="assignment-notes"
            name="notes"
            placeholder="Notes (optional)"
            value={assignmentForm.notes ?? ""}
            onChange={(event) =>
              updateField("notes", event.target.value)
            }
            style={styles.textarea}
          />
        </div>

        {/* VALIDATION ERROR */}
        {validationError && (
          <div role="alert" style={styles.errorBox}>
            {validationError}
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          style={{
            ...styles.primaryButton,
            ...(!assignmentForm.patient_id || loading
              ? styles.disabledButton
              : {}),
          }}
          disabled={!assignmentForm.patient_id || loading}
        >
          {loading
            ? "Saving..."
            : assignmentForm.patient_id
              ? "Assign Patient"
              : "Select Patient First"}
        </button>
      </form>
    </div>
  );
});

export default PatientAssignmentForm;

const styles = {
  card: {
    background: "#fff",
    borderRadius: "22px",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e8eef7",
    padding: "24px",
    transition: "all 0.3s ease",
  },

  cardHighlight: {
    border: "2px solid #3b82f6",
    boxShadow: "0 0 0 4px rgba(59,130,246,0.15)",
  },

  cardTitle: {
    margin: "0 0 18px 0",
    fontSize: "26px",
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
    background: "#f1f5f9",
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

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    width: "100%",
  },

  label: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#374151",
  },

  required: {
    color: "#dc2626",
  },

  input: {
    boxSizing: "border-box",
    padding: "13px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    background: "#fff",
    color: "#111827",
    width: "100%",
  },

  textarea: {
    boxSizing: "border-box",
    minHeight: "90px",
    padding: "13px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    resize: "vertical",
    fontFamily: "inherit",
    width: "100%",
  },

  helpText: {
    color: "#64748b",
    fontSize: "12px",
  },

  errorBox: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    padding: "12px",
    fontSize: "14px",
    fontWeight: "600",
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
    transition: "all 0.2s ease",
  },

  disabledButton: {
    background: "#94a3b8",
    cursor: "not-allowed",
  },
};

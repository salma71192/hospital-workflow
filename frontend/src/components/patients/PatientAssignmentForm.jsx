
import React, { useMemo, useState, useEffect } from "react";

const DEFAULT_PHYSICIANS = [
  "Suad Trebinjac",
  "Philippe Noel Neyret",
  "Mahmoud Ramadan Adly Aly",
  "Modar Adel Alhasan",
  "Hamid Reza Ansari",
  "Yoosuf Shan",
  "Ammar Yasser Omran",
  "Yasser Salam",
];

const CATEGORIES = [
  { value: "appointment", label: "Appointment" },
  { value: "walk_in", label: "Walk-in" },
  { value: "cash", label: "Cash" },
  {
    value: "task_without_eligibility",
    label: "Task Without Eligibility",
  },
  {
    value: "initial_evaluation",
    label: "Initial Evaluation",
  },
];

const SPECIALITIES = [
  "Pediatrics",
  "Neuro",
  "TMJ",
  "Scoliosis",
  "Women Health - Pregnancy",
  "Women Health - Pelvic",
  "Lymphedema",
  "Lipodema",
  "Sports",
];

export default function PatientAssignmentForm({
  selectedPatient,
  assignmentForm = {},
  setAssignmentForm,
  therapists = [],
  physicians = DEFAULT_PHYSICIANS,
  specialities = [],
  onSubmit,
  loading = false,
}) {
  const [therapistSearch, setTherapistSearch] = useState("");
  const [therapistMenuOpen, setTherapistMenuOpen] = useState(false);
  const [physicianSearch, setPhysicianSearch] = useState("");

  const isEvaluation =
    assignmentForm.category === "initial_evaluation";

  const therapistLabel = (therapist) =>
    therapist.display_name ||
    therapist.full_name ||
    therapist.username ||
    `Therapist ${therapist.id}`;

  const selectedTherapist = useMemo(
    () =>
      therapists.find(
        (therapist) =>
          String(therapist.id) ===
          String(assignmentForm.therapist_id)
      ),
    [therapists, assignmentForm.therapist_id]
  );

  useEffect(() => {
    if (selectedTherapist && !therapistMenuOpen) {
      setTherapistSearch(therapistLabel(selectedTherapist));
    }
  }, [selectedTherapist, therapistMenuOpen]);

  const filteredTherapists = useMemo(() => {
    const query = therapistSearch.trim().toLowerCase();

    return therapists.filter((therapist) =>
      therapistLabel(therapist).toLowerCase().includes(query)
    );
  }, [therapists, therapistSearch]);

  const filteredPhysicians = useMemo(() => {
    const query = physicianSearch.trim().toLowerCase();

    return physicians.filter((name) =>
      String(name).toLowerCase().includes(query)
    );
  }, [physicians, physicianSearch]);

  const availableSpecialities = useMemo(
    () =>
      Array.from(
        new Set([...SPECIALITIES, ...specialities].filter(Boolean))
      ),
    [specialities]
  );

  const updateField = (field, value) => {
    setAssignmentForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const chooseTherapist = (therapist) => {
    updateField("therapist_id", String(therapist.id));
    setTherapistSearch(therapistLabel(therapist));
    setTherapistMenuOpen(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (loading) return;

    if (!selectedPatient) {
      alert("Please select a patient first.");
      return;
    }

    if (!assignmentForm.therapist_id) {
      alert("Please select a physiotherapist.");
      return;
    }

    const visitNumber = Number(assignmentForm.visit_number);

    if (!Number.isInteger(visitNumber) || visitNumber < 1) {
      alert("Please enter a valid visit number.");
      return;
    }

    if (isEvaluation && !assignmentForm.referring_physician) {
      alert("Please select the referring physician.");
      return;
    }

    if (typeof onSubmit === "function") {
      onSubmit(event);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={styles.card}
      onClick={(event) => {
        if (
          !event.target.closest("[data-therapist-autocomplete]")
        ) {
          setTherapistMenuOpen(false);
        }
      }}
    >
      <div style={styles.topAccent} />

      <div style={styles.header}>
        <div style={styles.headerText}>
          <div style={styles.eyebrow}>
            PATIENT MANAGEMENT
          </div>

          <h3 style={styles.title}>Assign Patient</h3>

          <p style={styles.subtitle}>
            Allocate a patient and complete the assignment details.
          </p>
        </div>

        <div style={styles.headerIcon} aria-hidden="true">
          <span>＋</span>
        </div>
      </div>

      {selectedPatient ? (
        <div style={styles.patient}>
          <div style={styles.patientIcon} aria-hidden="true">
            ♙
          </div>

          <div style={styles.patientInfo}>
            <span style={styles.patientLabel}>
              SELECTED PATIENT
            </span>

            <strong style={styles.patientName}>
              {selectedPatient.full_name ||
                selectedPatient.name ||
                selectedPatient.patient_name ||
                "Selected patient"}
            </strong>

            {selectedPatient.patient_id && (
              <span style={styles.patientMeta}>
                File No: {selectedPatient.patient_id}
              </span>
            )}
          </div>

          <span style={styles.patientStatus}>
            <span style={styles.statusDot} />
            Selected
          </span>
        </div>
      ) : (
        <div style={styles.notice}>
          <span aria-hidden="true">ⓘ</span>
          <span>Select a patient before saving the assignment.</span>
        </div>
      )}

      <div style={styles.sectionHeading}>
        <span style={styles.sectionNumber}>01</span>

        <div>
          <div style={styles.sectionTitle}>
            Assignment details
          </div>

          <div style={styles.sectionSubtitle}>
            Select the therapist and visit information.
          </div>
        </div>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>
          Physiotherapist <span style={styles.required}>*</span>
        </label>

        <div
          style={styles.autocomplete}
          data-therapist-autocomplete
        >
          <input
            type="text"
            value={
              therapistMenuOpen
                ? therapistSearch
                : selectedTherapist
                  ? therapistLabel(selectedTherapist)
                  : therapistSearch
            }
            onFocus={() => {
              setTherapistSearch("");
              setTherapistMenuOpen(true);
            }}
            onChange={(event) => {
              setTherapistSearch(event.target.value);
              setTherapistMenuOpen(true);
              updateField("therapist_id", "");
            }}
            style={styles.inputWithIcon}
            placeholder="Search physiotherapist..."
            autoComplete="off"
            aria-label="Search physiotherapist"
            aria-expanded={therapistMenuOpen}
            disabled={loading}
            required={!assignmentForm.therapist_id}
          />

          <span style={styles.searchIcon} aria-hidden="true">
            ⌕
          </span>

          {therapistMenuOpen && !loading && (
            <div
              style={styles.dropdown}
              role="listbox"
              aria-label="Physiotherapists"
            >
              {filteredTherapists.length > 0 ? (
                filteredTherapists.map((therapist) => {
                  const selected =
                    String(therapist.id) ===
                    String(assignmentForm.therapist_id);

                  return (
                    <button
                      type="button"
                      key={therapist.id}
                      style={{
                        ...styles.dropdownItem,
                        ...(selected
                          ? styles.dropdownItemSelected
                          : {}),
                      }}
                      onMouseDown={(event) =>
                        event.preventDefault()
                      }
                      onClick={() => chooseTherapist(therapist)}
                      role="option"
                      aria-selected={selected}
                    >
                      <span style={styles.avatar}>
                        {therapistLabel(therapist)
                          .charAt(0)
                          .toUpperCase()}
                      </span>

                      <span style={styles.therapistName}>
                        {therapistLabel(therapist)}
                      </span>

                      {selected && (
                        <span style={styles.check}>✓</span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div style={styles.noResults}>
                  No physiotherapists found.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={styles.row}>
        <div style={styles.field}>
          <label style={styles.label}>
            Assignment Type <span style={styles.required}>*</span>
          </label>

          <select
            value={assignmentForm.category || "appointment"}
            onChange={(event) => {
              const category = event.target.value;

              setAssignmentForm((previous) => ({
                ...previous,
                category,
                referring_physician:
                  category === "initial_evaluation"
                    ? previous.referring_physician || ""
                    : "",
              }));

              setPhysicianSearch("");
            }}
            style={styles.select}
            required
            disabled={loading}
          >
            {CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>
            Visit No. <span style={styles.required}>*</span>
          </label>

          <input
            type="number"
            min="1"
            step="1"
            value={assignmentForm.visit_number ?? 1}
            onChange={(event) =>
              updateField("visit_number", event.target.value)
            }
            style={styles.input}
            required
            disabled={loading}
          />
        </div>
      </div>

      {isEvaluation && (
        <>
          <div style={styles.sectionHeading}>
            <span style={styles.sectionNumber}>02</span>

            <div>
              <div style={styles.sectionTitle}>
                Referral information
              </div>

              <div style={styles.sectionSubtitle}>
                Specify the referring physician.
              </div>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              Referring Physician{" "}
              <span style={styles.required}>*</span>
            </label>

            <div style={styles.physicianSearchWrapper}>
              <input
                type="text"
                value={physicianSearch}
                onChange={(event) =>
                  setPhysicianSearch(event.target.value)
                }
                style={styles.input}
                placeholder="Filter physician list..."
                disabled={loading}
                autoComplete="off"
                aria-label="Search referring physician"
              />

              <span style={styles.searchHint}>
                Filter names below
              </span>
            </div>

            <select
              value={assignmentForm.referring_physician || ""}
              onChange={(event) =>
                updateField(
                  "referring_physician",
                  event.target.value
                )
              }
              style={styles.select}
              required
              disabled={loading}
            >
              <option value="">Select physician</option>

              {filteredPhysicians.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}

              {assignmentForm.referring_physician &&
                !filteredPhysicians.includes(
                  assignmentForm.referring_physician
                ) && (
                  <option
                    value={assignmentForm.referring_physician}
                  >
                    {assignmentForm.referring_physician}
                  </option>
                )}
            </select>
          </div>
        </>
      )}

      <details style={styles.optional}>
        <summary style={styles.optionalTitle}>
          <span style={styles.optionalPlus}>＋</span>

          <span>Speciality and notes</span>

          <span style={styles.optionalHint}>OPTIONAL</span>
        </summary>

        <div style={styles.optionalContent}>
          <div style={styles.field}>
            <label style={styles.label}>Speciality</label>

            <select
              value={assignmentForm.speciality || ""}
              onChange={(event) =>
                updateField("speciality", event.target.value)
              }
              style={styles.select}
              disabled={loading}
            >
              <option value="">Select speciality</option>

              {availableSpecialities.map((speciality) => (
                <option key={speciality} value={speciality}>
                  {speciality}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Notes</label>

            <textarea
              value={assignmentForm.notes || ""}
              onChange={(event) =>
                updateField("notes", event.target.value)
              }
              style={styles.textarea}
              placeholder="Add any additional assignment notes..."
              rows={3}
              disabled={loading}
            />
          </div>
        </div>
      </details>

      <button
        type="submit"
        style={{
          ...styles.button,
          ...(loading ? styles.buttonDisabled : {}),
        }}
        disabled={loading || !selectedPatient}
      >
        {loading ? (
          <span style={styles.buttonContent}>
            <span style={styles.spinner} />
            Saving assignment...
          </span>
        ) : (
          <>
            <span>Save Assignment</span>
            <span style={styles.buttonArrow} aria-hidden="true">
              →
            </span>
          </>
        )}
      </button>

      <p style={styles.footer}>
        Please verify the assignment details before saving.
      </p>

      <style>{`
        @keyframes patientAssignmentSpin {
          to { transform: rotate(360deg); }
        }

        .patient-assignment-input:focus {
          border-color: #7c3aed !important;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
          outline: none;
        }

        details > summary::-webkit-details-marker {
          display: none;
        }
      `}</style>
    </form>
  );
}

const styles = {
  card: {
    position: "relative",
    overflow: "visible",
    background: "#FFFFFF",
    border: "1px solid #E9DDFB",
    borderRadius: "20px",
    padding: "clamp(16px, 3vw, 26px)",
    boxShadow: "0 12px 32px rgba(76, 29, 149, 0.08)",
    color: "#334155",
    fontFamily: "inherit",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    minWidth: 0,
  },

  topAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "5px",
    borderRadius: "20px 20px 0 0",
    background:
      "linear-gradient(90deg, #6D28D9 0%, #A855F7 50%, #EC4899 100%)",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    marginBottom: "24px",
    paddingTop: "5px",
  },

  headerText: {
    minWidth: 0,
  },

  eyebrow: {
    display: "inline-block",
    color: "#6D28D9",
    background: "#F3E8FF",
    border: "1px solid #E9D5FF",
    borderRadius: "7px",
    padding: "6px 9px",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "1.1px",
    marginBottom: "9px",
  },

  title: {
    margin: 0,
    color: "#2E1065",
    fontSize: "24px",
    fontWeight: 800,
    letterSpacing: "-0.5px",
  },

  subtitle: {
    margin: "7px 0 0",
    color: "#7C7194",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  headerIcon: {
    background: "linear-gradient(135deg, #6D28D9, #A855F7)",
    color: "#FFFFFF",
    border: "1px solid #8B5CF6",
    borderRadius: "15px",
    width: "48px",
    height: "48px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    boxShadow: "0 7px 16px rgba(109, 40, 217, 0.2)",
  },

  patient: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "linear-gradient(120deg, #F5F3FF, #FDF4FF)",
    border: "1px solid #DDD6FE",
    color: "#4C1D95",
    padding: "14px",
    borderRadius: "14px",
    marginBottom: "25px",
    minWidth: 0,
  },

  patientIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "42px",
    height: "42px",
    flexShrink: 0,
    background: "#E9D5FF",
    color: "#6D28D9",
    borderRadius: "12px",
    fontSize: "24px",
  },

  patientInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    flex: 1,
    minWidth: 0,
  },

  patientLabel: {
    color: "#8B5CF6",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.8px",
  },

  patientName: {
    color: "#3B0764",
    fontSize: "14px",
    overflowWrap: "anywhere",
  },

  patientMeta: {
    color: "#7C3AED",
    fontSize: "11px",
  },

  patientStatus: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "#DCFCE7",
    color: "#166534",
    border: "1px solid #BBF7D0",
    borderRadius: "20px",
    padding: "6px 10px",
    fontSize: "11px",
    fontWeight: 800,
    flexShrink: 0,
  },

  statusDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#22C55E",
  },

  notice: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "13px",
    marginBottom: "23px",
    border: "1px solid #FDE68A",
    borderRadius: "12px",
    background: "#FFFBEB",
    color: "#92400E",
    fontSize: "13px",
  },

  sectionHeading: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
  },

  sectionNumber: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "35px",
    height: "35px",
    flexShrink: 0,
    borderRadius: "11px",
    background: "linear-gradient(135deg, #6D28D9, #A855F7)",
    color: "#FFFFFF",
    fontSize: "11px",
    fontWeight: 800,
    boxShadow: "0 4px 10px rgba(109, 40, 217, 0.18)",
  },

  sectionTitle: {
    color: "#3B0764",
    fontSize: "14px",
    fontWeight: 800,
  },

  sectionSubtitle: {
    color: "#9588A9",
    fontSize: "12px",
    marginTop: "4px",
    lineHeight: 1.4,
  },

  row: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
    gap: "14px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "17px",
    minWidth: 0,
  },

  label: {
    color: "#4C3A65",
    fontSize: "12px",
    fontWeight: 750,
  },

  required: {
    color: "#E11D48",
  },

  input: {
    display: "block",
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    padding: "12px 13px",
    border: "1px solid #DDD6E9",
    borderRadius: "10px",
    background: "#FFFFFF",
    color: "#2E1065",
    fontSize: "14px",
    outlineColor: "#8B5CF6",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },

  inputWithIcon: {
    display: "block",
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    padding: "12px 42px 12px 13px",
    border: "1px solid #DDD6E9",
    borderRadius: "10px",
    background: "#FFFFFF",
    color: "#2E1065",
    fontSize: "14px",
    outlineColor: "#8B5CF6",
  },

  select: {
    display: "block",
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    padding: "12px 13px",
    border: "1px solid #DDD6E9",
    borderRadius: "10px",
    background: "#FFFFFF",
    color: "#2E1065",
    fontSize: "14px",
    outlineColor: "#8B5CF6",
    cursor: "pointer",
  },

  autocomplete: {
    position: "relative",
    width: "100%",
    minWidth: 0,
  },

  searchIcon: {
    position: "absolute",
    right: "13px",
    top: "9px",
    fontSize: "23px",
    color: "#8B5CF6",
    pointerEvents: "none",
  },

  dropdown: {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: 0,
    right: 0,
    zIndex: 50,
    background: "#FFFFFF",
    border: "1px solid #DDD6FE",
    borderRadius: "13px",
    boxShadow: "0 14px 30px rgba(76, 29, 149, 0.15)",
    maxHeight: "240px",
    overflowY: "auto",
  },

  dropdownItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    border: "none",
    borderBottom: "1px solid #F3EFFA",
    background: "#FFFFFF",
    color: "#4C3A65",
    textAlign: "left",
    fontSize: "13px",
    cursor: "pointer",
  },

  dropdownItemSelected: {
    background: "#F3E8FF",
    color: "#6D28D9",
    fontWeight: 700,
  },

  therapistName: {
    flex: 1,
    minWidth: 0,
    overflowWrap: "anywhere",
  },

  avatar: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "31px",
    height: "31px",
    flexShrink: 0,
    borderRadius: "10px",
    background: "#EDE9FE",
    color: "#6D28D9",
    fontWeight: 800,
  },

  check: {
    marginLeft: "auto",
    color: "#7C3AED",
    fontWeight: 800,
  },

  noResults: {
    padding: "16px",
    color: "#9588A9",
    textAlign: "center",
    fontSize: "13px",
  },

  physicianSearchWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },

  searchHint: {
    color: "#9588A9",
    fontSize: "11px",
  },

  optional: {
    border: "1px solid #E9DDFB",
    borderRadius: "13px",
    padding: "0 14px",
    marginTop: "5px",
    background: "#FCFAFF",
  },

  optionalTitle: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    color: "#4C1D95",
    fontSize: "13px",
    fontWeight: 800,
    padding: "14px 0",
    listStyle: "none",
  },

  optionalPlus: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "27px",
    height: "27px",
    borderRadius: "9px",
    background: "#EDE9FE",
    color: "#7C3AED",
    fontSize: "19px",
  },

  optionalHint: {
    marginLeft: "auto",
    color: "#A78BFA",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.5px",
  },

  optionalContent: {
    borderTop: "1px solid #EDE5FA",
    paddingTop: "16px",
  },

  textarea: {
    display: "block",
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    padding: "12px 13px",
    border: "1px solid #DDD6E9",
    borderRadius: "10px",
    background: "#FFFFFF",
    color: "#2E1065",
    fontSize: "14px",
    resize: "vertical",
    outlineColor: "#8B5CF6",
    fontFamily: "inherit",
    lineHeight: 1.6,
  },

  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    width: "100%",
    boxSizing: "border-box",
    marginTop: "22px",
    padding: "15px 16px",
    background: "linear-gradient(135deg, #6D28D9 0%, #9333EA 55%, #A855F7 100%)",
    color: "#FFFFFF",
    border: "1px solid #7C3AED",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 7px 17px rgba(109, 40, 217, 0.22)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },

  buttonDisabled: {
    opacity: 0.65,
    cursor: "not-allowed",
    boxShadow: "none",
  },

  buttonContent: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },

  buttonArrow: {
    fontSize: "20px",
    lineHeight: 1,
  },

  spinner: {
    width: "15px",
    height: "15px",
    border: "2px solid rgba(255, 255, 255, 0.4)",
    borderTopColor: "#FFFFFF",
    borderRadius: "50%",
    display: "inline-block",
    animation: "patientAssignmentSpin 0.8s linear infinite",
  },

  footer: {
    margin: "13px 0 0",
    textAlign: "center",
    color: "#A097AE",
    fontSize: "11px",
    lineHeight: 1.6,
  },
};

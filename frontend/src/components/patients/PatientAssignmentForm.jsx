
import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "../../api/api";

const EXTERNAL_REFERRAL = "External Referral";
const LAST_THERAPIST_KEY = "hospital_workflow_last_therapist_id";

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

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getRememberedTherapistId() {
  try {
    return localStorage.getItem(LAST_THERAPIST_KEY) || "";
  } catch {
    return "";
  }
}

function normalizeRole(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getPhysicianName(physician) {
  if (typeof physician === "string") {
    return physician.trim();
  }

  if (!physician || typeof physician !== "object") {
    return "";
  }

  return String(
    physician.name ??
      physician.display_name ??
      physician.full_name ??
      physician.username ??
      ""
  ).trim();
}

function normalizePhysicianList(list) {
  const byNormalizedName = new Map();

  for (const physician of Array.isArray(list) ? list : []) {
    const name = getPhysicianName(physician);
    if (!name) continue;

    const key = name.toLocaleLowerCase().trim();

    if (!byNormalizedName.has(key)) {
      byNormalizedName.set(key, name);
    }
  }

  return Array.from(byNormalizedName.values()).sort((a, b) =>
    a.localeCompare(b)
  );
}

function isExternalPhysician(value) {
  const physician = String(value || "").trim().toLowerCase();

  return (
    physician === EXTERNAL_REFERRAL.toLowerCase() ||
    physician.startsWith(`${EXTERNAL_REFERRAL.toLowerCase()}:`)
  );
}

function extractPhysicianList(data) {
  if (Array.isArray(data)) return data;

  const possibleKeys = [
    "physicians",
    "doctors",
    "users",
    "results",
    "data",
  ];

  for (const key of possibleKeys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  return [];
}

function getErrorMessage(error) {
  const status = error?.response?.status;
  const data = error?.response?.data;

  if (status === 401) {
    return "The physician request was unauthorized. Please sign in again and retry.";
  }

  if (status === 403) {
    return "Your account does not have permission to access the physician list.";
  }

  if (status === 404) {
    return "The physician endpoint was not found. Check the Django URL configuration and API base URL.";
  }

  if (data && typeof data === "object") {
    return (
      data.detail ||
      data.error ||
      data.message ||
      error?.message ||
      "Could not load physicians."
    );
  }

  return error?.message || "Could not load physicians.";
}

export default function PatientAssignmentForm({
  selectedPatient,
  assignmentForm = {},
  setAssignmentForm,
  therapists = [],
  physicians = [],
  specialities = [],
  onSubmit,
  onCancelEdit,
  editingAssignmentId = null,
  savingAssignment = false,
  loading = false,
  userRole = "",
  role = "",
  user = null,
}) {
  const [therapistSearch, setTherapistSearch] = useState("");
  const [therapistMenuOpen, setTherapistMenuOpen] = useState(false);

  const [fetchedPhysicians, setFetchedPhysicians] = useState([]);
  const [physiciansLoading, setPhysiciansLoading] = useState(false);
  const [physiciansError, setPhysiciansError] = useState("");
  const [physicianRetry, setPhysicianRetry] = useState(0);
  const [physiciansLoaded, setPhysiciansLoaded] = useState(false);

  const isBusy = Boolean(loading || savingAssignment);

  const effectiveRole = normalizeRole(
    userRole ||
      role ||
      user?.role ||
      user?.user_role ||
      user?.user_type ||
      ""
  );

  const isAdmin = effectiveRole === "admin";
  const isEditing = Boolean(editingAssignmentId);

  const isEvaluation =
    assignmentForm.category === "initial_evaluation";

  const storedPhysician = String(
    assignmentForm.referring_physician || ""
  ).trim();

  const isExternalReferral = isExternalPhysician(storedPhysician);

  const currentPhysician = isExternalReferral
    ? EXTERNAL_REFERRAL
    : storedPhysician;

  const therapistLabel = useCallback(
    (therapist) =>
      therapist?.display_name ||
      therapist?.full_name ||
      therapist?.name ||
      therapist?.username ||
      `Therapist ${therapist?.id ?? ""}`,
    []
  );

  const selectedTherapist = useMemo(
    () =>
      therapists.find(
        (therapist) =>
          String(therapist.id) ===
          String(assignmentForm.therapist_id)
      ),
    [therapists, assignmentForm.therapist_id]
  );

  const additionalTherapistIds = useMemo(
    () =>
      Array.isArray(assignmentForm.additional_therapist_ids)
        ? assignmentForm.additional_therapist_ids.map(String)
        : [],
    [assignmentForm.additional_therapist_ids]
  );

  // Load the physician list when the assignment is an evaluation.
  useEffect(() => {
    if (!isEvaluation) {
      setPhysiciansLoading(false);
      setPhysiciansError("");
      return undefined;
    }

    let cancelled = false;

    async function loadPhysicians() {
      setPhysiciansLoading(true);
      setPhysiciansError("");
      setPhysiciansLoaded(false);

      try {
        const response = await api.get("users/physicians/");

        if (cancelled) return;

        const list = normalizePhysicianList(
          extractPhysicianList(response.data)
        );

        setFetchedPhysicians(list);
        setPhysiciansLoaded(true);

        if (list.length === 0) {
          setPhysiciansError(
            "The server returned no physicians. Check that the physician API returns a list of physician names."
          );
        }
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Failed to fetch physicians:",
          error?.response?.status,
          error?.response?.data || error
        );

        setPhysiciansError(getErrorMessage(error));
      } finally {
        if (!cancelled) {
          setPhysiciansLoading(false);
        }
      }
    }

    loadPhysicians();

    return () => {
      cancelled = true;
    };
  }, [isEvaluation, physicianRetry]);

  // Combine the parent list, fetched list, and currently saved physician.
  const availablePhysicians = useMemo(() => {
    const parentList = normalizePhysicianList(physicians);
    const fetchedList = normalizePhysicianList(fetchedPhysicians);

    const savedPhysician =
      currentPhysician && !isExternalReferral
        ? [currentPhysician]
        : [];

    return normalizePhysicianList([
      ...parentList,
      ...fetchedList,
      ...savedPhysician,
    ]);
  }, [
    physicians,
    fetchedPhysicians,
    currentPhysician,
    isExternalReferral,
  ]);

  const availableSpecialities = useMemo(
    () =>
      Array.from(
        new Set(
          [...SPECIALITIES, ...specialities].filter(Boolean)
        )
      ),
    [specialities]
  );

  // Restore the last-used therapist for a new assignment.
  useEffect(() => {
    if (
      isEditing ||
      assignmentForm.therapist_id ||
      therapists.length === 0 ||
      typeof setAssignmentForm !== "function"
    ) {
      return;
    }

    const rememberedId = getRememberedTherapistId();

    const rememberedTherapist = therapists.find(
      (therapist) =>
        String(therapist.id) === String(rememberedId)
    );

    if (rememberedTherapist) {
      setAssignmentForm((previous) => ({
        ...previous,
        therapist_id: String(rememberedTherapist.id),
      }));
    }
  }, [
    isEditing,
    therapists,
    assignmentForm.therapist_id,
    setAssignmentForm,
  ]);

  useEffect(() => {
    if (selectedTherapist && !therapistMenuOpen) {
      setTherapistSearch(therapistLabel(selectedTherapist));
    }
  }, [selectedTherapist, therapistMenuOpen, therapistLabel]);

  // Set today's date for an admin-created assignment.
  useEffect(() => {
    if (
      isAdmin &&
      !assignmentForm.assignment_date &&
      typeof setAssignmentForm === "function"
    ) {
      setAssignmentForm((previous) => ({
        ...previous,
        assignment_date:
          previous.assignment_date || getTodayDate(),
      }));
    }
  }, [
    isAdmin,
    assignmentForm.assignment_date,
    setAssignmentForm,
  ]);

  const filteredTherapists = useMemo(() => {
    const query = therapistSearch.trim().toLowerCase();

    return therapists.filter((therapist) =>
      therapistLabel(therapist).toLowerCase().includes(query)
    );
  }, [therapists, therapistSearch, therapistLabel]);

  const updateField = (field, value) => {
    if (typeof setAssignmentForm !== "function") return;

    setAssignmentForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const chooseTherapist = (therapist) => {
    const therapistId = String(therapist.id);

    setTherapistSearch(therapistLabel(therapist));
    setTherapistMenuOpen(false);

    setAssignmentForm((previous) => ({
      ...previous,
      therapist_id: therapistId,
      additional_therapist_ids: (
        previous.additional_therapist_ids || []
      ).filter((id) => String(id) !== therapistId),
    }));

    try {
      localStorage.setItem(LAST_THERAPIST_KEY, therapistId);
    } catch {
      // Browser storage is optional.
    }
  };

  const handleAdditionalTherapistChange = (event) => {
    const therapistId = event.target.value;

    setAssignmentForm((previous) => ({
      ...previous,
      with_another_therapist: Boolean(therapistId),
      additional_therapist_ids: therapistId
        ? [therapistId]
        : [],
    }));
  };

  const handleCategoryChange = (event) => {
    const category = event.target.value;

    setAssignmentForm((previous) => ({
      ...previous,
      category,
      referring_physician:
        category === "initial_evaluation"
          ? previous.referring_physician || ""
          : "",
      external_referring_physician: "",
    }));

    if (category === "initial_evaluation") {
      setPhysiciansError("");
    }
  };

  // Store the exact selected physician name as a string.
  const handlePhysicianChange = (event) => {
    const selectedName = String(event.target.value || "").trim();

    console.log("Physician selected in dropdown:", selectedName);

    setAssignmentForm((previous) => ({
      ...previous,
      referring_physician: selectedName,
      external_referring_physician: "",
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (isBusy) return;

    if (!selectedPatient?.id) {
      alert("Please select a patient first.");
      return;
    }

    if (!assignmentForm.therapist_id) {
      alert("Please select a physiotherapist.");
      return;
    }

    if (isAdmin && !assignmentForm.assignment_date) {
      alert("Please select the assignment date.");
      return;
    }

    if (
      isAdmin &&
      assignmentForm.assignment_date > getTodayDate()
    ) {
      alert("The assignment date cannot be in the future.");
      return;
    }

    const visitNumber = Number(assignmentForm.visit_number);

    if (!Number.isInteger(visitNumber) || visitNumber < 1) {
      alert("Please enter a valid visit number.");
      return;
    }

    const physicianForSubmission = isExternalPhysician(
      assignmentForm.referring_physician
    )
      ? EXTERNAL_REFERRAL
      : String(assignmentForm.referring_physician || "").trim();

    if (isEvaluation && !physicianForSubmission) {
      alert("Please select the referring physician.");
      return;
    }

    const additionalIds = additionalTherapistIds
      .filter(
        (id) => id !== String(assignmentForm.therapist_id)
      )
      .slice(0, 1);

    const submissionForm = {
      ...assignmentForm,
      patient_id: selectedPatient.id,
      therapist_id: String(assignmentForm.therapist_id),
      category: assignmentForm.category || "appointment",
      visit_number: visitNumber,
      referring_physician: isEvaluation
        ? physicianForSubmission
        : "",
      external_referring_physician: "",
      additional_therapist_ids: additionalIds,
      with_another_therapist: additionalIds.length > 0,
    };

    // Diagnostic output: confirms the exact name sent to the parent.
    console.log("Assignment submission snapshot:", {
      category: submissionForm.category,
      referring_physician: submissionForm.referring_physician,
      patient_id: submissionForm.patient_id,
      therapist_id: submissionForm.therapist_id,
    });

    if (typeof onSubmit !== "function") {
      console.error(
        "PatientAssignmentForm: onSubmit callback is missing."
      );
      alert(
        "Unable to save because the assignment submit handler is not configured."
      );
      return;
    }

    onSubmit(event, submissionForm);
  };

  const retryPhysicianFetch = useCallback(() => {
    setPhysiciansError("");
    setPhysicianRetry((previous) => previous + 1);
  }, []);

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
          <div style={styles.eyebrow}>PATIENT MANAGEMENT</div>
          <h3 style={styles.title}>
            {isEditing ? "Edit Assignment" : "Assign Patient"}
          </h3>
          <p style={styles.subtitle}>
            {isEditing
              ? "Review and update the existing patient assignment."
              : "Allocate a patient and complete the assignment details."}
          </p>
        </div>

        <div style={styles.headerIcon} aria-hidden="true">
          {isEditing ? "✎" : "＋"}
        </div>
      </div>

      {selectedPatient ? (
        <div style={styles.patient}>
          <div style={styles.patientIcon} aria-hidden="true">
            ♙
          </div>

          <div style={styles.patientInfo}>
            <span style={styles.patientLabel}>SELECTED PATIENT</span>

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
          <div style={styles.sectionTitle}>Assignment details</div>
          <div style={styles.sectionSubtitle}>
            Select the therapist and visit information.
            {isAdmin
              ? " Admin can also set the assignment date."
              : ""}
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
            disabled={isBusy}
          />

          <span style={styles.searchIcon} aria-hidden="true">
            ⌕
          </span>

          {therapistMenuOpen && !isBusy && (
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

        {selectedTherapist && (
          <p style={styles.rememberedHint}>
            Selected therapist: {therapistLabel(selectedTherapist)}.
            You can choose another therapist at any time.
          </p>
        )}
      </div>

      <div style={styles.field}>
        <label style={styles.label} htmlFor="additional_therapist_id">
          With Another Therapist
        </label>

        <select
          id="additional_therapist_id"
          value={additionalTherapistIds[0] || ""}
          onChange={handleAdditionalTherapistChange}
          style={styles.select}
          disabled={isBusy}
        >
          <option value="">None</option>

          {therapists
            .filter(
              (therapist) =>
                String(therapist.id) !==
                String(assignmentForm.therapist_id)
            )
            .map((therapist) => (
              <option
                key={therapist.id}
                value={String(therapist.id)}
              >
                {therapistLabel(therapist)}
              </option>
            ))}
        </select>

        <p style={styles.helperText}>
          Select one additional physiotherapist for this assignment.
          Choose None to remove the selection.
        </p>
      </div>

      {isAdmin && (
        <div style={styles.field}>
          <label style={styles.label}>
            Date of Assignment <span style={styles.required}>*</span>
          </label>

          <input
            type="date"
            value={assignmentForm.assignment_date || getTodayDate()}
            onChange={(event) =>
              updateField("assignment_date", event.target.value)
            }
            style={styles.input}
            required
            disabled={isBusy}
            max={getTodayDate()}
          />

          <p style={styles.dateHint}>
            You can select today or a previous date.
          </p>
        </div>
      )}

      <div style={styles.row}>
        <div style={styles.field}>
          <label style={styles.label}>
            Assignment Type <span style={styles.required}>*</span>
          </label>

          <select
            value={assignmentForm.category || "appointment"}
            onChange={handleCategoryChange}
            style={styles.select}
            required
            disabled={isBusy}
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
            disabled={isBusy}
          />
        </div>
      </div>

      {isEvaluation && (
        <>
          <div style={styles.sectionHeading}>
            <span style={styles.sectionNumber}>02</span>
            <div>
              <div style={styles.sectionTitle}>Referral information</div>
              <div style={styles.sectionSubtitle}>
                Select an internal physician or record an external referral.
              </div>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              Referring Physician <span style={styles.required}>*</span>
            </label>

            <select
              value={currentPhysician}
              onChange={handlePhysicianChange}
              style={styles.select}
              required
              disabled={isBusy}
            >
              <option value="">Select physician</option>

              {availablePhysicians.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}

              <option value={EXTERNAL_REFERRAL}>
                {EXTERNAL_REFERRAL}
              </option>
            </select>

            {physiciansLoading && (
              <p style={styles.helperText} role="status">
                Fetching physicians from the server...
              </p>
            )}

            {!physiciansLoading && physiciansError && (
              <div style={styles.errorPanel} role="alert">
                <p style={styles.errorText}>{physiciansError}</p>
                <button
                  type="button"
                  style={styles.retryButton}
                  onClick={retryPhysicianFetch}
                >
                  Retry loading physicians
                </button>
              </div>
            )}

            {!physiciansLoading &&
              !physiciansError &&
              physiciansLoaded &&
              availablePhysicians.length > 0 && (
                <p style={styles.successHint}>
                  {availablePhysicians.length} physician option(s) available.
                </p>
              )}
          </div>
        </>
      )}

      <details
        style={styles.optional}
        open={Boolean(assignmentForm.speciality || assignmentForm.notes)}
      >
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
              disabled={isBusy}
            >
              <option value="">None</option>

              {availableSpecialities.map((speciality) => (
                <option key={speciality} value={speciality}>
                  {speciality}
                </option>
              ))}
            </select>

            <p style={styles.helperText}>
              The selected speciality is included with the assignment.
              Choose None to clear it.
            </p>
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
              disabled={isBusy}
            />
          </div>
        </div>
      </details>

      <div style={styles.actions}>
        <button
          type="submit"
          style={{
            ...styles.button,
            ...(isBusy ? styles.buttonDisabled : {}),
          }}
          disabled={isBusy || !selectedPatient?.id}
        >
          {isBusy ? (
            <span style={styles.buttonContent}>
              <span style={styles.spinner} />
              {isEditing
                ? "Updating assignment..."
                : "Saving assignment..."}
            </span>
          ) : (
            <>
              <span>
                {isEditing ? "Update Assignment" : "Save Assignment"}
              </span>
              <span style={styles.buttonArrow} aria-hidden="true">
                →
              </span>
            </>
          )}
        </button>

        {isEditing && typeof onCancelEdit === "function" && (
          <button
            type="button"
            style={styles.cancelButton}
            onClick={onCancelEdit}
            disabled={isBusy}
          >
            Cancel Edit
          </button>
        )}
      </div>

      <p style={styles.footer}>
        Please verify the assignment details before{" "}
        {isEditing ? "updating" : "saving"}.
      </p>

      <style>{`
        @keyframes patientAssignmentSpin {
          to { transform: rotate(360deg); }
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
  headerText: { minWidth: 0 },
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
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    flexShrink: 0,
    background: "linear-gradient(135deg, #6D28D9, #A855F7)",
    color: "#FFFFFF",
    border: "1px solid #8B5CF6",
    borderRadius: "15px",
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
  patientMeta: { color: "#7C3AED", fontSize: "11px" },
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
  required: { color: "#E11D48" },
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
  rememberedHint: {
    margin: "7px 0 0",
    color: "#7C3AED",
    fontSize: "11px",
    lineHeight: 1.5,
  },
  dateHint: {
    margin: "-2px 0 0",
    color: "#9588A9",
    fontSize: "11px",
  },
  helperText: {
    margin: 0,
    color: "#7C7194",
    fontSize: "12px",
    lineHeight: 1.5,
  },
  errorPanel: {
    display: "grid",
    gap: "10px",
    padding: "12px",
    border: "1px solid #FECACA",
    borderRadius: "9px",
    background: "#FEF2F2",
  },
  errorText: {
    margin: 0,
    color: "#B91C1C",
    fontSize: "12px",
    lineHeight: 1.5,
    overflowWrap: "anywhere",
  },
  retryButton: {
    justifySelf: "start",
    padding: "8px 11px",
    border: "1px solid #FCA5A5",
    borderRadius: "8px",
    background: "#FFFFFF",
    color: "#B91C1C",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },
  successHint: {
    margin: 0,
    color: "#15803D",
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
  actions: {
    display: "grid",
    gap: "10px",
    marginTop: "22px",
  },
  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    width: "100%",
    boxSizing: "border-box",
    padding: "15px 16px",
    background:
      "linear-gradient(135deg, #6D28D9 0%, #9333EA 55%, #A855F7 100%)",
    color: "#FFFFFF",
    border: "1px solid #7C3AED",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 7px 17px rgba(109, 40, 217, 0.22)",
  },
  buttonDisabled: {
    opacity: 0.65,
    cursor: "not-allowed",
    boxShadow: "none",
  },
  cancelButton: {
    width: "100%",
    padding: "12px 16px",
    background: "#FFFFFF",
    color: "#6D28D9",
    border: "1px solid #DDD6FE",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
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

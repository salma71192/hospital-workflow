
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  validDate,
  validTime,
} from "./scheduleHelpers";

import {
  parseExcelTime,
} from "./excelImportRules";

// ============================================================
// CONFIGURATION
// ============================================================

const UAE_TIME_ZONE = "Asia/Dubai";

const PATIENT_SEARCH_DELAY = 280;

// Defaults apply to NEW manual appointments only.
// Existing saved records keep their actual statuses.

const DEFAULT_CONFIRMATION = "confirmed";
const DEFAULT_APPROVAL = "approved";

// ============================================================
// GENERAL HELPERS
// ============================================================

function getTodayUAE() {
  const parts = new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone: UAE_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [
      part.type,
      part.value,
    ])
  );

  return [
    values.year,
    values.month,
    values.day,
  ].join("-");
}

function clean(value) {
  return String(value ?? "").trim();
}

function getTherapistId(row) {
  const raw =
    row?.therapist_id ??
    row?.therapist ??
    "";

  if (
    raw &&
    typeof raw === "object"
  ) {
    return String(
      raw.value ??
      raw.id ??
      raw.pk ??
      ""
    );
  }

  return String(raw ?? "");
}

function getAppointmentDate(
  row,
  fallback = ""
) {
  return String(
    row?.appointment_date ||
    row?.date ||
    fallback ||
    ""
  ).slice(0, 10);
}

function getAppointmentTime(row) {
  const value =
    row?.time ??
    row?.appointment_time ??
    "";

  const parsed = parseExcelTime(value);

  return validTime(parsed)
    ? parsed
    : "";
}

function formatDate(value) {
  if (!validDate(value)) {
    return "No date selected";
  }

  const [year, month, day] = value
    .split("-")
    .map(Number);

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }
  ).format(
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    )
  );
}

function normalizeSearch(value) {
  return clean(value)
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(/\s+/g, " ");
}

function hasSelectedPatient(row) {
  return Boolean(
    row &&
    row.patient_id !== null &&
    row.patient_id !== undefined &&
    clean(row.patient_id) &&
    clean(row.patient_name)
  );
}

function patientName(patient) {
  return clean(
    patient?.name ??
    patient?.patient_name ??
    ""
  );
}

function patientFileNumber(patient) {
  return clean(
    patient?.file_number ??
    patient?.patient_file_number ??
    patient?.patient_id ??
    ""
  );
}

function getConfirmation(row) {
  if (
    row?.isNew &&
    !row?.id &&
    (
      !row?.source ||
      row.source === "manual"
    )
  ) {
    return DEFAULT_CONFIRMATION;
  }

  return (
    clean(row?.confirmation_status) ||
    DEFAULT_CONFIRMATION
  );
}

function getApproval(row) {
  if (
    row?.isNew &&
    !row?.id &&
    (
      !row?.source ||
      row.source === "manual"
    )
  ) {
    return DEFAULT_APPROVAL;
  }

  const raw =
    row?.claim_approval_status ??
    row?.insurance_approval_status ??
    row?.approval_status ??
    "unknown";

  return clean(raw)
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function formatApproval(value) {
  if (
    value === "unknown" ||
    value === "not_verified"
  ) {
    return "Not Verified";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

// ============================================================
// TIME HELPERS
// ============================================================

function to12Hour(value) {
  if (!validTime(value)) {
    return {
      hour: "",
      minute: "",
      period: "AM",
    };
  }

  const [hour24, minute] = value
    .split(":")
    .map(Number);

  const period =
    hour24 >= 12
      ? "PM"
      : "AM";

  const hour12 =
    hour24 % 12 || 12;

  return {
    hour: String(hour12),
    minute: String(minute)
      .padStart(2, "0"),
    period,
  };
}

function to24Hour(
  hour,
  minute,
  period
) {
  if (
    !hour ||
    minute === "" ||
    !period
  ) {
    return "";
  }

  const hour12 = Number(hour);

  if (
    hour12 < 1 ||
    hour12 > 12
  ) {
    return "";
  }

  const hour24 =
    (hour12 % 12) +
    (period === "PM" ? 12 : 0);

  return (
    String(hour24).padStart(2, "0") +
    ":" +
    String(minute).padStart(2, "0")
  );
}

const HOURS = Array.from(
  { length: 12 },
  (_, index) => index + 1
);

const MINUTES = Array.from(
  { length: 60 },
  (_, index) =>
    String(index).padStart(2, "0")
);

// ============================================================
// ICONS
// ============================================================

function Icon({
  name,
  size = 18,
}) {
  const paths = {
    plus: (
      <path d="M12 5v14M5 12h14" />
    ),

    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),

    calendar: (
      <>
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="2"
        />

        <path d="M7 3v4M17 3v4M3 10h18" />
      </>
    ),

    clock: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
        />

        <path d="M12 7v5l3 2" />
      </>
    ),

    search: (
      <>
        <circle
          cx="11"
          cy="11"
          r="7"
        />

        <path d="m20 20-4-4" />
      </>
    ),

    check: (
      <path d="m5 12 4 4L19 6" />
    ),

    close: (
      <path d="M6 6l12 12M18 6 6 18" />
    ),

    file: (
      <>
        <path d="M7 3h7l4 4v14H7z" />
        <path d="M14 3v5h4M10 13h5M10 17h5" />
      </>
    ),

    shield: (
      <>
        <path d="M12 2 20 6v6c0 5-4 8-8 10-4-2-8-5-8-10V6z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),

    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </>
    ),

    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16 4a2 2 0 0 1 4 4L9 19l-5 1 1-5z" />
      </>
    ),

    arrow: (
      <path d="M5 12h14m-6-6 6 6-6 6" />
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.info}
    </svg>
  );
}

// ============================================================
// FIELD
// ============================================================

function Field({
  title,
  icon,
  children,
  hint,
  full = false,
}) {
  return (
    <div
      className={`ma-field ${
        full
          ? "ma-field-full"
          : ""
      }`}
    >
      <div className="ma-field-label">
        <Icon
          name={icon}
          size={15}
        />

        <span>{title}</span>
      </div>

      {children}

      {hint && (
        <small className="ma-field-hint">
          {hint}
        </small>
      )}
    </div>
  );
}

// ============================================================
// COMPACT 12-HOUR TIME PICKER
// ============================================================

function CompactTimePicker({
  value = "",
  disabled = false,
  onChange = () => {},
  ariaLabel = "Appointment time",
}) {
  const time = to12Hour(value);

  const changePart = (
    field,
    nextValue
  ) => {
    const next = {
      ...time,
      [field]: nextValue,
    };

    // When the first time field is selected,
    // complete the other parts with sensible
    // defaults, without changing the chosen hour.

    if (
      field === "hour" &&
      nextValue &&
      next.minute === ""
    ) {
      next.minute = "00";
    }

    if (
      field === "minute" &&
      nextValue !== "" &&
      !next.hour
    ) {
      next.hour = "12";
    }

    const result = to24Hour(
      next.hour,
      next.minute,
      next.period
    );

    onChange(result);
  };

  return (
    <div
      className="ma-time-picker"
      role="group"
      aria-label={ariaLabel}
    >
      <select
        className="ma-time-part ma-time-hour"
        aria-label={`${ariaLabel} hour`}
        value={time.hour}
        disabled={disabled}
        onChange={(event) =>
          changePart(
            "hour",
            event.target.value
          )
        }
      >
        <option value="">
          HH
        </option>

        {HOURS.map((hour) => (
          <option
            key={hour}
            value={String(hour)}
          >
            {String(hour).padStart(2, "0")}
          </option>
        ))}
      </select>

      <span className="ma-time-colon">
        :
      </span>

      <select
        className="ma-time-part ma-time-minute"
        aria-label={`${ariaLabel} minute`}
        value={time.minute}
        disabled={disabled}
        onChange={(event) =>
          changePart(
            "minute",
            event.target.value
          )
        }
      >
        <option value="">
          MM
        </option>

        {MINUTES.map((minute) => (
          <option
            key={minute}
            value={minute}
          >
            {minute}
          </option>
        ))}
      </select>

      <select
        className="ma-time-part ma-time-period"
        aria-label={`${ariaLabel} AM or PM`}
        value={time.period}
        disabled={disabled}
        onChange={(event) =>
          changePart(
            "period",
            event.target.value
          )
        }
      >
        <option value="AM">
          AM
        </option>

        <option value="PM">
          PM
        </option>
      </select>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ManualAppointmentEntry({
  row = null,

  therapist = "",
  therapistOptions = [],

  date = "",

  busy = false,
  saving = false,

  onStartNew = () => {},
  onChange = () => {},
  onSave = () => {},
  onCancel = () => {},

  patientQuery = "",
  onPatientQueryChange = () => {},

  patientMatches = [],
  searchingPatients = false,

  onSearchPatient = () => {},
  onSelectPatient = () => {},

  error = "",
}) {
  // ----------------------------------------------------------
  // STATE
  // ----------------------------------------------------------

  const formRef = useRef(null);
  const searchInputRef = useRef(null);

  const searchCallbackRef = useRef(
    onSearchPatient
  );

  const [localError, setLocalError] =
    useState("");

  const [
    searchStarted,
    setSearchStarted,
  ] = useState(false);

  const [
    hospitalToday,
    setHospitalToday,
  ] = useState(getTodayUAE);

  // ----------------------------------------------------------
  // KEEP SEARCH CALLBACK CURRENT
  // ----------------------------------------------------------

  useEffect(() => {
    searchCallbackRef.current =
      onSearchPatient;
  }, [onSearchPatient]);

  // ----------------------------------------------------------
  // UPDATE UAE DATE
  // ----------------------------------------------------------

  useEffect(() => {
    const updateToday = () => {
      setHospitalToday(
        getTodayUAE()
      );
    };

    const interval = window.setInterval(
      updateToday,
      30000
    );

    const visibilityHandler = () => {
      if (!document.hidden) {
        updateToday();
      }
    };

    document.addEventListener(
      "visibilitychange",
      visibilityHandler
    );

    return () => {
      window.clearInterval(interval);

      document.removeEventListener(
        "visibilitychange",
        visibilityHandler
      );
    };
  }, []);

  // ----------------------------------------------------------
  // CURRENT APPOINTMENT
  // ----------------------------------------------------------

  const editing = Boolean(row);

  const selectedDate =
    getAppointmentDate(
      row,
      date
    );

  const isPastSchedule =
    Boolean(
      date &&
      validDate(date) &&
      date < hospitalToday
    );

  const isPastAppointment =
    Boolean(
      selectedDate &&
      validDate(selectedDate) &&
      selectedDate <
        hospitalToday
    );

  const isReadOnly =
    isPastSchedule ||
    isPastAppointment ||
    busy ||
    saving;

  const isNewManualAppointment =
    Boolean(
      row &&
      !row.id &&
      row.isNew &&
      (
        !row.source ||
        row.source === "manual"
      )
    );

  const patientSelected =
    hasSelectedPatient(row);

  // ----------------------------------------------------------
  // DEFAULT CONFIRMATION AND APPROVAL
  // ----------------------------------------------------------

  useEffect(() => {
    if (
      !row ||
      !isNewManualAppointment
    ) {
      return;
    }

    if (
      row.confirmation_status ===
        DEFAULT_CONFIRMATION &&
      row.approval_status ===
        DEFAULT_APPROVAL
    ) {
      return;
    }

    onChange({
      ...row,
      confirmation_status:
        DEFAULT_CONFIRMATION,
      approval_status:
        DEFAULT_APPROVAL,
      isDirty: true,
    });
  }, [
    row,
    isNewManualAppointment,
    onChange,
  ]);

  const confirmation =
    getConfirmation(row);

  const approval =
    getApproval(row);

  // ----------------------------------------------------------
  // SELECTED THERAPIST
  // ----------------------------------------------------------

  const matchedTherapist =
    useMemo(() => {
      const selectedId =
        getTherapistId(row) ||
        String(therapist ?? "");

      return therapistOptions.find(
        (option) =>
          String(option.value) ===
          String(selectedId)
      );
    }, [
      row,
      therapist,
      therapistOptions,
    ]);

  const therapistName =
    matchedTherapist?.label ||
    row?.therapist_name ||
    "Not selected";

  // ----------------------------------------------------------
  // PATIENT SEARCH RESULTS
  // ----------------------------------------------------------

  const normalizedQuery =
    normalizeSearch(patientQuery);

  const filteredPatientMatches =
    useMemo(() => {
      if (
        normalizedQuery.length < 2
      ) {
        return [];
      }

      return patientMatches.filter(
        (patient) => {
          const name =
            normalizeSearch(
              patientName(patient)
            );

          const fileNumber =
            normalizeSearch(
              patientFileNumber(patient)
            );

          return (
            name.includes(
              normalizedQuery
            ) ||
            fileNumber.includes(
              normalizedQuery
            )
          );
        }
      );
    }, [
      patientMatches,
      normalizedQuery,
    ]);

  // ----------------------------------------------------------
  // AUTOMATIC DEBOUNCED PATIENT SEARCH
  // ----------------------------------------------------------

  useEffect(() => {
    if (
      !editing ||
      patientSelected ||
      isReadOnly ||
      normalizedQuery.length < 2
    ) {
      return;
    }

    setSearchStarted(true);

    const timer = window.setTimeout(
      () => {
        searchCallbackRef.current();
      },
      PATIENT_SEARCH_DELAY
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    editing,
    patientSelected,
    isReadOnly,
    normalizedQuery,
  ]);

  // ----------------------------------------------------------
  // RESET ON OPEN / CLOSE
  // ----------------------------------------------------------

  useEffect(() => {
    setLocalError("");
    setSearchStarted(false);

    if (editing) {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [
    editing,
    row?.localId,
    row?.id,
  ]);

  // ----------------------------------------------------------
  // UPDATE APPOINTMENT
  // ----------------------------------------------------------

  const update = (field, value) => {
    if (
      !row ||
      isReadOnly
    ) {
      return;
    }

    onChange({
      ...row,
      [field]: value,
      isDirty: true,
    });

    setLocalError("");
  };

  // ----------------------------------------------------------
  // PATIENT SEARCH HANDLERS
  // ----------------------------------------------------------

  const handleQueryChange = (
    value
  ) => {
    if (isReadOnly) {
      return;
    }

    onPatientQueryChange(value);

    setSearchStarted(
      clean(value).length >= 2
    );

    setLocalError("");
  };

  const handleSelectPatient = (
    patient
  ) => {
    if (
      isReadOnly ||
      !patient
    ) {
      return;
    }

    const name =
      patientName(patient);

    if (
      !name ||
      patient.id === null ||
      patient.id === undefined
    ) {
      setLocalError(
        "Select a valid patient record from the hospital database."
      );
      return;
    }

    // The parent supplies the actual patient
    // selection logic and stores patient_id.

    onSelectPatient({
      ...patient,
      name,
      file_number:
        patientFileNumber(patient),
    });

    setSearchStarted(false);
    setLocalError("");
  };

  const handleChangePatient = () => {
    if (
      isReadOnly ||
      !row
    ) {
      return;
    }

    onChange({
      ...row,
      patient_id: null,
      patient_name: "",
      file_number: "",
      matched: false,
      isDirty: true,
    });

    onPatientQueryChange("");

    setSearchStarted(false);
    setLocalError("");

    window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
  };

  // ----------------------------------------------------------
  // VALIDATION
  // ----------------------------------------------------------

  const validateForm = () => {
    if (!row) {
      return "No appointment is being edited.";
    }

    if (
      !validDate(selectedDate) ||
      selectedDate < getTodayUAE()
    ) {
      return "Select today or a future appointment date.";
    }

    if (!patientSelected) {
      return "Select a patient from the hospital search results.";
    }

    if (!matchedTherapist) {
      return "Select a registered physiotherapist in Schedule Filters.";
    }

    if (
      !validTime(
        getAppointmentTime(row)
      )
    ) {
      return "Select a valid appointment time.";
    }

    return "";
  };

  // ----------------------------------------------------------
  // ACTIONS
  // ----------------------------------------------------------

  const handleApply = () => {
    if (
      !row ||
      isReadOnly
    ) {
      return;
    }

    const issue =
      validateForm();

    if (issue) {
      setLocalError(issue);
      return;
    }

    setLocalError("");
    onSave();
  };

  const handleStartNew = () => {
    if (
      busy ||
      saving ||
      isPastSchedule
    ) {
      return;
    }

    setLocalError("");

    onStartNew();
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section
      ref={formRef}
      className="ma-section"
    >
      {/* HEADER */}

      <div className="ma-header">
        <div className="ma-header-left">
          <span className="ma-header-icon">
            <Icon
              name="plus"
              size={22}
            />
          </span>

          <div>
            <h3>
              Manual Appointment Entry
            </h3>

            <p>
              Search for a patient and
              add an appointment to
              the selected schedule.
            </p>
          </div>
        </div>

        {!editing ? (
          <button
            type="button"
            className="ma-new-button"
            disabled={
              busy ||
              saving ||
              !therapist ||
              !validDate(date) ||
              isPastSchedule
            }
            onClick={handleStartNew}
          >
            <Icon
              name="plus"
              size={17}
            />

            New Appointment
          </button>
        ) : (
          <span className="ma-edit-badge">
            {row.id
              ? "Edit Appointment"
              : "New Appointment"}
          </span>
        )}
      </div>

      {/* EMPTY STATE */}

      {!editing && (
        <div className="ma-empty">
          <span className="ma-empty-icon">
            <Icon
              name="calendar"
              size={25}
            />
          </span>

          <div className="ma-empty-content">
            <strong>
              Add a patient appointment
            </strong>

            <p>
              Choose New Appointment,
              select a patient from search,
              and enter the appointment time.
            </p>
          </div>

          {isPastSchedule && (
            <span className="ma-locked">
              Past date locked
            </span>
          )}
        </div>
      )}

      {/* INLINE EDITOR */}

      {editing && (
        <div className="ma-editor">

          <div className="ma-editor-heading">
            <div>
              <h4>
                {row.id
                  ? "Edit Appointment"
                  : "Create New Appointment"}
              </h4>

              <p>
                Patient details are retrieved
                from the hospital database.
              </p>
            </div>

            <button
              type="button"
              className="ma-close"
              aria-label="Close editor"
              onClick={onCancel}
            >
              <Icon
                name="close"
                size={18}
              />
            </button>
          </div>

          {(isPastAppointment ||
            isPastSchedule) && (
            <div className="ma-error">
              Past appointment dates are
              read-only.
            </div>
          )}

          {(localError || error) && (
            <div
              className="ma-error"
              role="alert"
            >
              {localError || error}
            </div>
          )}

          {/* SCHEDULE CONTEXT */}

          <div className="ma-context">
            <div className="ma-context-item">
              <span className="ma-context-icon">
                <Icon
                  name="user"
                  size={18}
                />
              </span>

              <div>
                <small>
                  PHYSIOTHERAPIST
                </small>

                <strong>
                  {therapistName}
                </strong>
              </div>
            </div>

            <div className="ma-context-divider" />

            <div className="ma-context-item">
              <span className="ma-context-icon">
                <Icon
                  name="calendar"
                  size={18}
                />
              </span>

              <div>
                <small>
                  APPOINTMENT DATE
                </small>

                <strong>
                  {formatDate(
                    selectedDate
                  )}
                </strong>
              </div>
            </div>
          </div>

          {/* PATIENT SEARCH */}

          <div className="ma-patient-section">
            <div className="ma-patient-heading">
              <div>
                <h4>
                  <Icon
                    name="search"
                    size={18}
                  />

                  Patient Search
                </h4>

                <p>
                  Start typing a name
                  or hospital file number.
                </p>
              </div>

              {patientSelected && (
                <span className="ma-patient-status">
                  <Icon
                    name="check"
                    size={14}
                  />

                  Patient selected
                </span>
              )}
            </div>

            {patientSelected ? (
              <div className="ma-selected-patient">
                <span className="ma-selected-avatar">
                  {String(
                    row.patient_name || "?"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </span>

                <div className="ma-selected-info">
                  <strong>
                    {row.patient_name}
                  </strong>

                  <span>
                    File No.{" "}
                    <b>
                      {row.file_number ||
                        "Not available"}
                    </b>
                  </span>
                </div>

                <span className="ma-selected-check">
                  <Icon
                    name="check"
                    size={18}
                  />
                </span>

                <button
                  type="button"
                  className="ma-change-patient"
                  disabled={isReadOnly}
                  onClick={handleChangePatient}
                >
                  <Icon
                    name="edit"
                    size={15}
                  />

                  Change
                </button>
              </div>
            ) : (
              <>
                <div className="ma-search-input-wrap">
                  <span className="ma-search-icon">
                    <Icon
                      name="search"
                      size={18}
                    />
                  </span>

                  <input
                    ref={searchInputRef}
                    type="search"
                    className="ma-input ma-patient-search-input"
                    autoComplete="off"
                    value={patientQuery}
                    disabled={isReadOnly}
                    placeholder="Search patient name or file number..."
                    onChange={(event) =>
                      handleQueryChange(
                        event.target.value
                      )
                    }
                  />

                  {patientQuery && (
                    <button
                      type="button"
                      className="ma-clear-search"
                      aria-label="Clear patient search"
                      disabled={isReadOnly}
                      onClick={() =>
                        handleQueryChange("")
                      }
                    >
                      <Icon
                        name="close"
                        size={15}
                      />
                    </button>
                  )}

                  {searchingPatients && (
                    <span className="ma-inline-spinner" />
                  )}
                </div>

                {/* LIVE RESULTS */}

                {normalizedQuery.length >= 2 && (
                  <div
                    className="ma-results-panel"
                    aria-live="polite"
                  >
                    <div className="ma-results-heading">
                      <strong>
                        {searchingPatients
                          ? "Searching..."
                          : "Matching Patients"}
                      </strong>

                      {!searchingPatients && (
                        <span>
                          {filteredPatientMatches.length} results
                        </span>
                      )}
                    </div>

                    {filteredPatientMatches.length > 0 ? (
                      <div className="ma-patient-results">
                        {filteredPatientMatches.map(
                          (patient, index) => {
                            const name =
                              patientName(patient);

                            const file =
                              patientFileNumber(
                                patient
                              );

                            return (
                              <button
                                key={
                                  patient.id ??
                                  index
                                }
                                type="button"
                                className="ma-result-item"
                                disabled={isReadOnly}
                                onClick={() =>
                                  handleSelectPatient(
                                    patient
                                  )
                                }
                              >
                                <span className="ma-result-avatar">
                                  {(name || "?")
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>

                                <span className="ma-result-details">
                                  <strong>
                                    {name ||
                                      "Unnamed patient"}
                                  </strong>

                                  <small>
                                    File No.{" "}
                                    {file ||
                                      "Not available"}
                                  </small>
                                </span>

                                <span className="ma-result-action">
                                  Select
                                  <Icon
                                    name="arrow"
                                    size={15}
                                  />
                                </span>
                              </button>
                            );
                          }
                        )}
                      </div>
                    ) : (
                      <div className="ma-search-message">
                        {searchingPatients
                          ? "Searching hospital records..."
                          : searchStarted
                          ? "No matching patients returned."
                          : "Enter a patient name or file number."}
                      </div>
                    )}
                  </div>
                )}

                <p className="ma-search-note">
                  <Icon
                    name="info"
                    size={14}
                  />

                  Select the correct patient
                  from the results.
                </p>
              </>
            )}
          </div>

          {/* APPOINTMENT DETAILS */}

          <div className="ma-details-heading">
            <h4>
              Appointment Details
            </h4>

            <p>
              Enter the appointment time.
              Confirmation and approval
              are displayed below.
            </p>
          </div>

          <div className="ma-form-grid">

            {/* COMPACT TIME */}

            <Field
              title="Appointment Time"
              icon="clock"
            >
              <CompactTimePicker
                value={getAppointmentTime(row)}
                disabled={isReadOnly}
                onChange={(value) =>
                  update(
                    "time",
                    value
                  )
                }
              />
            </Field>

            {/* FIXED CONFIRMATION */}

            <Field
              title="Confirmation Status"
              icon="check"
              hint={
                isNewManualAppointment
                  ? "Default for new manual appointments."
                  : "Current saved appointment status."
              }
            >
              <div className="ma-fixed-status ma-fixed-confirmed">
                <Icon
                  name="check"
                  size={17}
                />

                <strong>
                  {confirmation
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (letter) =>
                      letter.toUpperCase()
                    )}
                </strong>
              </div>
            </Field>

            {/* TYPE */}

            <Field
              title="Appointment Type"
              icon="file"
            >
              <select
                className="ma-input ma-select"
                value={
                  row.appointment_type ||
                  "followup"
                }
                disabled={isReadOnly}
                onChange={(event) =>
                  update(
                    "appointment_type",
                    event.target.value
                  )
                }
              >
                <option value="followup">
                  Follow-up
                </option>

                <option value="evaluation">
                  Evaluation
                </option>
              </select>
            </Field>

            {/* FIXED APPROVAL */}

            <Field
              title="Claims Approval"
              icon="shield"
              hint={
                isNewManualAppointment
                  ? "Default value; actual Claims authorization requires verification."
                  : "Read-only value from the existing appointment record."
              }
            >
              <div
                className={`ma-fixed-status ${
                  approval === "approved"
                    ? "ma-fixed-approved"
                    : "ma-fixed-neutral"
                }`}
              >
                <Icon
                  name="shield"
                  size={17}
                />

                <strong>
                  {formatApproval(approval)}
                </strong>
              </div>
            </Field>

            {/* SOURCE */}

            <Field
              title="Appointment Source"
              icon="file"
            >
              <div className="ma-readonly-field">
                {row.source || "manual"}
              </div>
            </Field>

            {/* NOTES */}

            <Field
              title="Appointment Notes"
              icon="file"
              full
            >
              <textarea
                className="ma-input ma-textarea"
                rows={3}
                placeholder="Enter appointment notes..."
                value={row.notes || ""}
                disabled={isReadOnly}
                onChange={(event) =>
                  update(
                    "notes",
                    event.target.value
                  )
                }
              />
            </Field>
          </div>

          {/* FOOTER */}

          <div className="ma-footer">
            <div className="ma-footer-info">
              <Icon
                name="info"
                size={17}
              />

              <span>
                Apply to Draft adds the
                appointment to Therapist
                Appointments. Save Changes
                there to save to Django.
              </span>
            </div>

            <div className="ma-footer-actions">
              <button
                type="button"
                className="ma-cancel-button"
                onClick={onCancel}
              >
                Cancel
              </button>

              <button
                type="button"
                className="ma-save-button"
                disabled={
                  isReadOnly ||
                  !patientSelected ||
                  !matchedTherapist
                }
                onClick={handleApply}
              >
                <Icon
                  name="check"
                  size={17}
                />

                Apply to Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STYLES */}

      <style>{`
        .ma-section {
          --ma-blue: #2563eb;
          --ma-navy: #172b4d;
          --ma-border: #e3eaf5;

          background: #ffffff;
          border: 1px solid var(--ma-border);
          border-radius: 18px;
          margin: 18px 0;
          overflow: hidden;

          font-family: Inter, system-ui,
            -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;

          box-shadow: 0 7px 27px
            rgba(26,55,103,.06);

          scroll-margin-top: 20px;
        }

        .ma-section * {
          box-sizing: border-box;
        }

        .ma-section button {
          cursor: pointer;
          font-family: inherit;
        }

        .ma-section button:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        /* HEADER */

        .ma-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 15px;

          padding: 21px 24px;

          background: linear-gradient(
            115deg,
            #f1f5ff,
            #ffffff
          );

          border-bottom: 1px solid #e6edf9;
        }

        .ma-header-left {
          display: flex;
          align-items: center;
          gap: 13px;
          min-width: 0;
        }

        .ma-header-icon {
          display: grid;
          place-items: center;

          width: 43px;
          height: 43px;

          border-radius: 12px;

          background: linear-gradient(
            135deg,
            #2457d8,
            #4388f5
          );

          color: white;
          flex-shrink: 0;
        }

        .ma-header h3 {
          margin: 0 0 5px;
          font-size: 18px;
          font-weight: 850;
          color: #172b4d;
        }

        .ma-header p {
          margin: 0;
          font-size: 12px;
          line-height: 1.5;
          color: #7b8ba5;
        }

        .ma-new-button,
        .ma-save-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 17px;

          border: none;
          border-radius: 10px;

          background: linear-gradient(
            110deg,
            #2457d8,
            #3980f2
          );

          color: white;
          font-size: 12px;
          font-weight: 850;
        }

        .ma-edit-badge {
          padding: 9px 13px;
          border-radius: 999px;

          background: #e8f0ff;
          color: #2457c8;

          font-size: 11px;
          font-weight: 850;
        }

        /* EMPTY */

        .ma-empty {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          padding: 23px 25px;
        }

        .ma-empty-icon {
          display: grid;
          place-items: center;
          width: 52px;
          height: 52px;
          border-radius: 15px;
          background: #edf4ff;
          color: #3169d4;
          flex-shrink: 0;
        }

        .ma-empty-content {
          flex: 1;
          min-width: 180px;
        }

        .ma-empty-content strong {
          display: block;
          margin-bottom: 5px;
          color: #253b60;
          font-size: 13px;
          font-weight: 850;
        }

        .ma-empty-content p {
          margin: 0;
          color: #7b8ba4;
          font-size: 12px;
          line-height: 1.6;
        }

        .ma-locked {
          padding: 8px 12px;
          border-radius: 9px;
          background: #fff1f2;
          color: #be123c;
          font-size: 11px;
          font-weight: 800;
        }

        /* EDITOR */

        .ma-editor {
          padding: 24px;
        }

        .ma-editor-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;

          padding-bottom: 18px;
          margin-bottom: 20px;
          border-bottom: 1px solid #edf1f8;
        }

        .ma-editor-heading h4 {
          margin: 0 0 5px;
          color: #1d3558;
          font-size: 16px;
          font-weight: 850;
        }

        .ma-editor-heading p {
          margin: 0;
          color: #7f8da5;
          font-size: 12px;
          line-height: 1.5;
        }

        .ma-close {
          display: grid;
          place-items: center;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 9px;
          background: #eef2f7;
          color: #64748b;
          flex-shrink: 0;
        }

        /* CONTEXT */

        .ma-context {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;

          padding: 16px 18px;
          margin-bottom: 23px;

          border: 1px solid #dce8fb;
          border-radius: 13px;
          background: #f6f9ff;
        }

        .ma-context-item {
          display: flex;
          align-items: center;
          gap: 11px;
          flex: 1;
          min-width: 180px;
        }

        .ma-context-icon {
          display: grid;
          place-items: center;
          width: 37px;
          height: 37px;
          border-radius: 10px;
          background: #e6efff;
          color: #2865d4;
          flex-shrink: 0;
        }

        .ma-context-item div {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .ma-context-item small {
          color: #8190a8;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: .4px;
        }

        .ma-context-item strong {
          color: #253d63;
          font-size: 12px;
          font-weight: 850;
        }

        .ma-context-divider {
          width: 1px;
          height: 36px;
          background: #d8e5f9;
        }

        /* PATIENT SECTION */

        .ma-patient-section {
          padding: 19px;
          margin-bottom: 25px;
          border: 1px solid #dde7f6;
          border-radius: 14px;
          background: #ffffff;
        }

        .ma-patient-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 17px;
        }

        .ma-patient-heading h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 5px;
          color: #233c61;
          font-size: 15px;
          font-weight: 850;
        }

        .ma-patient-heading h4 svg {
          color: #3675e9;
        }

        .ma-patient-heading p {
          margin: 0;
          color: #8593a8;
          font-size: 12px;
          line-height: 1.5;
        }

        .ma-patient-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 11px;
          border-radius: 999px;
          background: #dcfce7;
          color: #047857;
          font-size: 11px;
          font-weight: 850;
        }

        /* SEARCH */

        .ma-search-input-wrap {
          position: relative;
          width: 100%;
          min-width: 0;
        }

        .ma-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          display: grid;
          place-items: center;
          color: #7a96c2;
          pointer-events: none;
        }

        .ma-section .ma-input {
          display: block;
          width: 100%;
          min-width: 0;
          height: 45px;
          min-height: 45px;

          padding: 0 13px;
          border: 1.5px solid #dce5f2;
          border-radius: 10px;
          background: white;
          color: #1f3557;

          font-family: inherit;
          font-size: 13px;
          font-weight: 650;

          outline: none;
          box-shadow: none;
        }

        .ma-section .ma-input:focus {
          border-color: #3675e9;
          box-shadow: 0 0 0 4px
            rgba(37,99,235,.09);
        }

        .ma-section .ma-input:disabled {
          background: #f5f7fb;
          color: #718096;
        }

        .ma-section .ma-patient-search-input {
          padding-left: 42px;
          padding-right: 60px;
          font-size: 14px;
        }

        .ma-clear-search {
          position: absolute;
          right: 35px;
          top: 50%;
          transform: translateY(-50%);
          display: grid;
          place-items: center;
          width: 25px;
          height: 25px;
          border: none;
          border-radius: 7px;
          background: #edf2f9;
          color: #66758d;
        }

        .ma-inline-spinner {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          width: 17px;
          height: 17px;
          border: 2px solid #dbeafe;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: ma-spin .7s linear infinite;
        }

        @keyframes ma-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .ma-search-note {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 12px 0 0;
          color: #8190a8;
          font-size: 11px;
          line-height: 1.5;
        }

        .ma-search-note svg {
          flex-shrink: 0;
          color: #5680c4;
        }

        /* RESULTS */

        .ma-results-panel {
          margin-top: 10px;
          border: 1px solid #e0e8f5;
          border-radius: 11px;
          overflow: hidden;
          background: white;
        }

        .ma-results-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding: 11px 14px;
          border-bottom: 1px solid #e9eef7;
          background: #f7faff;
        }

        .ma-results-heading strong {
          color: #405879;
          font-size: 11px;
          font-weight: 850;
        }

        .ma-results-heading span {
          color: #8190a8;
          font-size: 11px;
        }

        .ma-patient-results {
          display: flex;
          flex-direction: column;
          max-height: 260px;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .ma-result-item {
          display: flex;
          align-items: center;
          gap: 11px;
          width: 100%;
          padding: 12px;
          border: none;
          border-bottom: 1px solid #eef2f8;
          background: white;
          text-align: left;
        }

        .ma-result-item:last-child {
          border-bottom: none;
        }

        .ma-result-item:hover {
          background: #f0f6ff;
        }

        .ma-result-avatar,
        .ma-selected-avatar {
          display: grid;
          place-items: center;
          width: 37px;
          height: 37px;
          border-radius: 11px;
          background: #e8edff;
          color: #4f46e5;
          font-size: 14px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .ma-result-details {
          display: flex;
          flex-direction: column;
          gap: 5px;
          flex: 1;
          min-width: 0;
        }

        .ma-result-details strong {
          color: #273c5a;
          font-size: 12px;
          font-weight: 850;
        }

        .ma-result-details small {
          color: #7c8ca5;
          font-size: 11px;
        }

        .ma-result-action {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #2457d8;
          font-size: 11px;
          font-weight: 850;
        }

        .ma-search-message {
          padding: 20px 14px;
          text-align: center;
          color: #8190a8;
          font-size: 12px;
        }

        /* SELECTED PATIENT */

        .ma-selected-patient {
          display: flex;
          align-items: center;
          gap: 13px;
          flex-wrap: wrap;
          padding: 15px;
          border: 1px solid #a7e9c7;
          border-radius: 12px;
          background: #f0fdf6;
        }

        .ma-selected-avatar {
          width: 44px;
          height: 44px;
          background: #dcfce7;
          color: #047857;
        }

        .ma-selected-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
          min-width: 140px;
        }

        .ma-selected-info strong {
          color: #14532d;
          font-size: 14px;
          font-weight: 850;
        }

        .ma-selected-info span {
          color: #508368;
          font-size: 11px;
        }

        .ma-selected-info b {
          color: #047857;
          font-weight: 850;
        }

        .ma-selected-check {
          display: grid;
          place-items: center;
          width: 29px;
          height: 29px;
          border-radius: 50%;
          background: #bbf7d0;
          color: #047857;
        }

        .ma-change-patient {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 12px;
          border: 1px solid #a7e9c7;
          border-radius: 9px;
          background: white;
          color: #047857;
          font-size: 11px;
          font-weight: 850;
        }

        /* DETAILS */

        .ma-details-heading {
          margin: 22px 0 17px;
        }

        .ma-details-heading h4 {
          margin: 0 0 5px;
          color: #20385c;
          font-size: 15px;
          font-weight: 850;
        }

        .ma-details-heading p {
          margin: 0;
          color: #8290a6;
          font-size: 12px;
        }

        .ma-form-grid {
          display: grid;
          grid-template-columns:
            repeat(2,minmax(0,1fr));
          gap: 19px;
          align-items: start;
        }

        .ma-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .ma-field-full {
          grid-column: 1 / -1;
        }

        .ma-field-label {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #405577;
          font-size: 12px;
          font-weight: 800;
        }

        .ma-field-label svg {
          color: #3973d7;
          flex-shrink: 0;
        }

        .ma-field-hint {
          color: #94a3b8;
          font-size: 10px;
          line-height: 1.5;
        }

        .ma-section .ma-select {
          appearance: auto;
          -webkit-appearance: menulist;
          cursor: pointer;
        }

        /* COMPACT TIME */

        .ma-time-picker {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          width: fit-content;
          max-width: 100%;
          min-height: 45px;
          flex-wrap: nowrap;
        }

        .ma-section .ma-time-part {
          display: block;
          flex: 0 0 auto;

          width: 76px !important;
          min-width: 0 !important;
          height: 43px !important;
          min-height: 43px !important;
          max-height: 43px !important;

          padding: 0 8px !important;
          margin: 0 !important;

          border: 1.5px solid #dce5f2;
          border-radius: 9px;

          background: white;
          color: #1f3557;

          appearance: auto;
          -webkit-appearance: menulist;

          font-family: inherit;
          font-size: 13px;
          font-weight: 750;
          text-align: left;
          color-scheme: light;
        }

        .ma-section .ma-time-period {
          width: 78px !important;
          font-weight: 850;
        }

        .ma-section .ma-time-part:focus {
          outline: none;
          border-color: #3675e9;
          box-shadow: 0 0 0 3px
            rgba(37,99,235,.09);
        }

        .ma-time-colon {
          color: #3b5375;
          font-size: 19px;
          font-weight: 850;
        }

        /* FIXED STATUS */

        .ma-fixed-status {
          display: flex;
          align-items: center;
          gap: 9px;
          min-height: 45px;
          padding: 0 13px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 12px;
        }

        .ma-fixed-status strong {
          font-weight: 850;
        }

        .ma-fixed-confirmed,
        .ma-fixed-approved {
          background: #f0fdf4;
          border-color: #bbf7d0;
          color: #047857;
        }

        .ma-fixed-neutral {
          background: #f5f7fb;
          color: #64748b;
        }

        .ma-readonly-field {
          display: flex;
          align-items: center;
          height: 45px;
          padding: 0 13px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #f5f7fb;
          color: #718096;
          font-size: 12px;
          font-weight: 750;
          text-transform: capitalize;
        }

        .ma-section .ma-textarea {
          height: auto;
          min-height: 100px;
          padding: 13px;
          resize: vertical;
          line-height: 1.6;
        }

        /* FOOTER */

        .ma-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 18px;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #edf1f8;
        }

        .ma-footer-info {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          flex: 1;
          min-width: 200px;
          color: #8190a8;
          font-size: 11px;
          line-height: 1.6;
        }

        .ma-footer-info svg {
          flex-shrink: 0;
          color: #5680c4;
        }

        .ma-footer-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .ma-cancel-button {
          padding: 12px 17px;
          border: 1px solid #d7dfed;
          border-radius: 10px;
          background: white;
          color: #52627a;
          font-size: 12px;
          font-weight: 850;
        }

        .ma-error {
          margin-bottom: 18px;
          padding: 13px 15px;
          border: 1px solid #fecdd3;
          border-radius: 10px;
          background: #fff1f2;
          color: #be123c;
          font-size: 12px;
          line-height: 1.6;
        }

        @media (max-width: 750px) {
          .ma-form-grid {
            grid-template-columns: 1fr;
          }

          .ma-field-full {
            grid-column: auto;
          }

          .ma-context-divider {
            display: none;
          }
        }

        @media (max-width: 600px) {
          .ma-header,
          .ma-editor {
            padding: 17px;
          }

          .ma-header h3 {
            font-size: 16px;
          }

          .ma-empty {
            padding: 19px 17px;
          }

          .ma-new-button {
            width: 100%;
          }

          .ma-patient-section {
            padding: 14px;
          }

          .ma-footer-actions {
            width: 100%;
          }

          .ma-footer-actions button {
            flex: 1;
          }

          .ma-result-action {
            font-size: 0;
          }

          .ma-section .ma-time-part {
            width: 67px !important;
          }

          .ma-section .ma-time-period {
            width: 72px !important;
          }
        }
      `}</style>
    </section>
  );
}

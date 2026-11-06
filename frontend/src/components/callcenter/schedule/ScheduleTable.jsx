
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  formatTime12,
  parseExcelTime,
} from "./excelImportRules";

// ============================================================
// CONFIGURATION
// ============================================================

const HOSPITAL_TIME_ZONE = "Asia/Dubai";

const STATUS_INFO = {
  unconfirmed: { label: "Unconfirmed", icon: "◷" },
  confirmed: { label: "Confirmed", icon: "✓" },
  no_answer: { label: "No Answer", icon: "◷" },
  phone_off: { label: "Phone Off", icon: "◷" },
  cancelled: { label: "Cancelled", icon: "✕" },
  rescheduled: { label: "Rescheduled", icon: "↻" },
};

const APPROVAL_LABELS = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
  denied: "Denied",
  expired: "Expired",
  unknown: "Not Verified",
  not_verified: "Not Verified",
};

const clean = (value) =>
  String(value ?? "").trim();

const pad = (value) =>
  String(value).padStart(2, "0");

const label = (value) =>
  clean(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );

// ============================================================
// DATE HELPERS
// ============================================================

function getHospitalToday() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: HOSPITAL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

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

function normalizeDate(value) {
  if (!value) return "";

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return "";
    }

    return [
      value.getFullYear(),
      pad(value.getMonth() + 1),
      pad(value.getDate()),
    ].join("-");
  }

  const text = clean(value);

  const iso = text.match(
    /^(\d{4})-(\d{2})-(\d{2})/
  );

  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }

  const slash = text.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/
  );

  if (slash) {
    return [
      slash[3],
      pad(slash[2]),
      pad(slash[1]),
    ].join("-");
  }

  return "";
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
}

function isPastDate(value, today) {
  const date = normalizeDate(value);

  return (
    isValidDate(date) &&
    date < today
  );
}

function getDate(row, fallbackDate = "") {
  return normalizeDate(
    row.appointment_date ??
      row.date ??
      fallbackDate
  );
}

function formatDisplayDate(value) {
  const date = normalizeDate(value);

  if (!isValidDate(date)) {
    return "Date unavailable";
  }

  const [year, month, day] = date
    .split("-")
    .map(Number);

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(
    new Date(Date.UTC(year, month - 1, day))
  );
}

// ============================================================
// NORMALIZATION
// ============================================================

function normalizePatientName(value) {
  return clean(value)
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function getTime(row) {
  return parseExcelTime(
    row.time ?? row.appointment_time
  );
}

function getStatus(row) {
  const status = clean(
    row.confirmation_status ||
      row.status ||
      "unconfirmed"
  ).toLowerCase();

  return STATUS_INFO[status]
    ? status
    : "unconfirmed";
}

// ============================================================
// CLAIMS APPROVAL
// ============================================================

// Read-only display. Approval fields are never
// modified by this component.

function getApproval(row) {
  const candidates = [
    row.claim_approval_status,
    row.insurance_approval_status,
    row.approval_status,
  ];

  const actual = candidates.find(
    (value) =>
      value !== null &&
      value !== undefined &&
      clean(value) !== ""
  );

  if (actual === undefined) {
    return "unknown";
  }

  return (
    clean(actual)
      .toLowerCase()
      .replace(/[\s-]+/g, "_") ||
    "unknown"
  );
}

// ============================================================
// THERAPIST
// ============================================================

function getTherapistName(
  row,
  therapistOptions = []
) {
  const rawTherapist =
    row.therapist ??
    row.therapist_id ??
    "";

  const directName =
    row.therapist_name ||
    row.physiotherapist_name ||
    row.assigned_therapist_name ||
    row.import_therapist ||
    row.excel_therapist_name ||
    "";

  if (
    rawTherapist &&
    typeof rawTherapist === "object"
  ) {
    const objectName =
      rawTherapist.full_name ||
      rawTherapist.label ||
      rawTherapist.name ||
      [
        rawTherapist.first_name,
        rawTherapist.last_name,
      ]
        .filter(Boolean)
        .join(" ");

    if (objectName) {
      return clean(objectName);
    }
  }

  const therapistId =
    typeof rawTherapist === "object"
      ? rawTherapist?.id ??
        rawTherapist?.value
      : rawTherapist;

  const matched = therapistOptions.find(
    (option) =>
      String(
        option.value ??
          option.id ??
          option.username ??
          ""
      ) === String(therapistId ?? "")
  );

  if (matched) {
    return clean(
      matched.label ||
        matched.full_name ||
        matched.name ||
        directName
    );
  }

  if (directName) {
    return clean(directName);
  }

  if (
    typeof therapistId === "string" &&
    therapistId.trim() &&
    !/^\d+$/.test(therapistId)
  ) {
    return therapistId.trim();
  }

  return "Unassigned";
}

function getAppointmentType(row) {
  return row.appointment_type === "evaluation"
    ? "Evaluation"
    : "Follow-up";
}

// ============================================================
// DUPLICATE DETECTION
// ============================================================

function findDuplicates(
  appointments,
  fallbackDate
) {
  const seen = new Set();
  const duplicates = [];

  for (const row of appointments) {
    const name = normalizePatientName(
      row.patient_name
    );

    if (!name) continue;

    const date = getDate(row, fallbackDate);
    const key = `${date}::${name}`;

    if (seen.has(key)) {
      duplicates.push(row);
    } else {
      seen.add(key);
    }
  }

  return duplicates;
}

// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  label: title,
  value,
  type,
  icon,
}) {
  return (
    <div
      className={`st-summary-card st-summary-${type}`}
    >
      <div className="st-summary-icon">
        {icon}
      </div>

      <div className="st-summary-content">
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

// ============================================================
// THERAPIST DISPLAY
// ============================================================

function TherapistDisplay({ name }) {
  const assigned = name !== "Unassigned";

  return (
    <div className="st-therapist">
      <span className="st-therapist-avatar">
        {assigned
          ? name.charAt(0).toUpperCase()
          : "?"}
      </span>

      <div className="st-therapist-content">
        <strong>{name}</strong>
      </div>
    </div>
  );
}

// ============================================================
// SAVE MODAL
// ============================================================

function ScheduleModal({
  mode,
  appointments,
  therapistOptions,
  changedCount,
  savedCount,
  error,
  onClose,
  onConfirm,
  onViewHistory,
}) {
  const modalRef = useRef(null);

  const changedRows = useMemo(() => {
    const rows = appointments.filter(
      (row) => row.isNew || row.isDirty
    );

    return rows.length
      ? rows
      : appointments;
  }, [appointments]);

  const newCount = changedRows.filter(
    (row) => row.isNew || !row.id
  ).length;

  const updatedCount = changedRows.filter(
    (row) => row.id && !row.isNew
  ).length;

  const isSaving = mode === "saving";

  useEffect(() => {
    modalRef.current?.focus();

    const handleEscape = (event) => {
      if (
        event.key === "Escape" &&
        !isSaving
      ) {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleEscape
      );
  }, [isSaving, onClose]);

  const handleBackdrop = (event) => {
    if (
      event.target === event.currentTarget &&
      !isSaving
    ) {
      onClose();
    }
  };

  return (
    <div
      className="st-modal-overlay"
      onMouseDown={handleBackdrop}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="st-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="st-modal-title"
      >
        {mode === "confirm" && (
          <>
            <div className="st-modal-icon st-modal-icon-confirm">
              ▦
            </div>

            <h2 id="st-modal-title">
              Save Appointment Schedule?
            </h2>

            <p className="st-modal-description">
              Review the appointments before
              saving them to the hospital
              scheduling system.
            </p>

            <div className="st-modal-stats">
              <div>
                <strong>{changedCount}</strong>
                <span>Changes</span>
              </div>

              <div>
                <strong>{newCount}</strong>
                <span>New</span>
              </div>

              <div>
                <strong>{updatedCount}</strong>
                <span>Updated</span>
              </div>
            </div>

            <div className="st-modal-patient-list">
              <h4>Appointments to save</h4>

              {changedRows
                .slice(0, 5)
                .map((row, index) => (
                  <div
                    key={
                      row.localId ||
                      row.id ||
                      index
                    }
                    className="st-modal-patient"
                  >
                    <span className="st-modal-patient-check">
                      ✓
                    </span>

                    <div>
                      <strong>
                        {row.patient_name ||
                          "Unnamed patient"}
                      </strong>

                      <small>
                        {getTime(row)
                          ? formatTime12(
                              getTime(row)
                            )
                          : "No time"}
                        {" · "}
                        {getTherapistName(
                          row,
                          therapistOptions
                        )}
                      </small>
                    </div>
                  </div>
                ))}

              {changedRows.length > 5 && (
                <p className="st-modal-more">
                  + {changedRows.length - 5}
                  {" "}more appointments
                </p>
              )}
            </div>

            <div className="st-modal-info">
              <span>ⓘ</span>

              <p>
                After the hospital system
                confirms saving, the working
                table will be cleared.
                Saved records will remain
                in Scheduled History.
              </p>
            </div>

            <div className="st-modal-actions">
              <button
                type="button"
                className="st-modal-secondary"
                onClick={onClose}
              >
                Continue Editing
              </button>

              <button
                type="button"
                className="st-modal-primary"
                onClick={onConfirm}
              >
                ✓ Confirm & Save
              </button>
            </div>
          </>
        )}

        {mode === "saving" && (
          <div className="st-modal-centered">
            <div className="st-spinner" />

            <h2 id="st-modal-title">
              Saving Appointments
            </h2>

            <p className="st-modal-description">
              Please wait while the hospital
              scheduling system processes
              your changes.
            </p>

            <div className="st-saving-progress">
              <div />
            </div>

            <p className="st-saving-note">
              Do not close this page
              until saving is completed.
            </p>
          </div>
        )}

        {mode === "success" && (
          <div className="st-modal-centered">
            <div className="st-modal-icon st-modal-icon-success">
              ✓
            </div>

            <h2 id="st-modal-title">
              Appointments Saved!
            </h2>

            <p className="st-modal-description">
              Your appointment changes have
              been saved successfully.
            </p>

            <div className="st-success-count">
              <strong>{savedCount}</strong>
              <span>Appointments saved</span>
            </div>

            <div className="st-success-message">
              <span>✓</span>

              <p>
                The working table has been
                cleared. Your saved records
                are available in Scheduled
                History.
              </p>
            </div>

            <div className="st-modal-actions">
              <button
                type="button"
                className="st-modal-secondary"
                onClick={onClose}
              >
                Close
              </button>

              <button
                type="button"
                className="st-modal-primary"
                onClick={onViewHistory}
              >
                View Scheduled History
              </button>
            </div>
          </div>
        )}

        {mode === "error" && (
          <div className="st-modal-centered">
            <div className="st-modal-icon st-modal-icon-error">
              !
            </div>

            <h2 id="st-modal-title">
              Save Not Completed
            </h2>

            <p className="st-modal-description">
              {error ||
                "The scheduling system could not confirm the save."}
            </p>

            <div className="st-error-message">
              The working table has been
              retained. Please review the
              appointments before trying
              again. If some records were
              saved, refresh history before
              retrying to avoid duplicates.
            </div>

            <div className="st-modal-actions">
              <button
                type="button"
                className="st-modal-primary st-modal-full"
                onClick={onClose}
              >
                Return to Appointments
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ScheduleTable({
  appointments = [],
  date,
  therapistOptions = [],
  busy = false,
  saving = false,
  changedCount = 0,
  loadedSchedule = false,
  saveAppointments,
  editAppointment,
  openDetails,
  removeDraftAppointment,
  onSaveSuccess,
  onViewHistory,
}) {
  const [modalMode, setModalMode] =
    useState(null);

  const [saveError, setSaveError] =
    useState("");

  const [savedCount, setSavedCount] =
    useState(0);

  const [today, setToday] = useState(
    getHospitalToday
  );

  const saveInProgressRef = useRef(false);

  // ----------------------------------------------------------
  // KEEP TODAY CURRENT
  // ----------------------------------------------------------

  useEffect(() => {
    const updateToday = () => {
      setToday(getHospitalToday());
    };

    const interval = window.setInterval(
      updateToday,
      30000
    );

    const handleVisibility = () => {
      if (!document.hidden) {
        updateToday();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {
      window.clearInterval(interval);

      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, []);

  // ----------------------------------------------------------
  // DATE VALIDATION
  // ----------------------------------------------------------

  const scheduleDate = normalizeDate(date);

  const scheduleIsPast =
    isValidDate(scheduleDate) &&
    scheduleDate < today;

  const datedAppointments = useMemo(
    () =>
      appointments.map((row) => ({
        row,
        appointmentDate: getDate(
          row,
          scheduleDate
        ),
      })),
    [appointments, scheduleDate]
  );

  const pastAppointments =
    datedAppointments.filter(
      ({ appointmentDate }) =>
        isPastDate(appointmentDate, today)
    );

  const invalidDateAppointments =
    datedAppointments.filter(
      ({ appointmentDate }) =>
        !isValidDate(appointmentDate)
    );

  const hasPastAppointments =
    pastAppointments.length > 0;

  const hasInvalidDates =
    invalidDateAppointments.length > 0;

  const isRowPast = (row) =>
    isPastDate(
      getDate(row, scheduleDate),
      today
    );

  // ----------------------------------------------------------
  // DUPLICATES
  // ----------------------------------------------------------

  const duplicates = useMemo(
    () =>
      findDuplicates(
        appointments,
        scheduleDate
      ),
    [appointments, scheduleDate]
  );

  const duplicateCount =
    duplicates.length;

  // ----------------------------------------------------------
  // SORT
  // ----------------------------------------------------------

  const sorted = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const dateA = getDate(
        a,
        scheduleDate
      );

      const dateB = getDate(
        b,
        scheduleDate
      );

      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }

      const timeA =
        getTime(a) || "99:99";

      const timeB =
        getTime(b) || "99:99";

      return timeA.localeCompare(timeB);
    });
  }, [appointments, scheduleDate]);

  // ----------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------

  const summary = useMemo(() => {
    const count = (status) =>
      appointments.filter(
        (row) =>
          getStatus(row) === status
      ).length;

    return {
      total: appointments.length,
      confirmed: count("confirmed"),
      unconfirmed: count("unconfirmed"),
      rescheduled: count("rescheduled"),
      cancelled: count("cancelled"),
      no_answer: count("no_answer"),
      phone_off: count("phone_off"),

      missingTime:
        appointments.filter(
          (row) => !getTime(row)
        ).length,

      unassigned:
        appointments.filter(
          (row) =>
            getTherapistName(
              row,
              therapistOptions
            ) === "Unassigned"
        ).length,
    };
  }, [
    appointments,
    therapistOptions,
  ]);

  // ----------------------------------------------------------
  // SAVE VALIDATION
  // ----------------------------------------------------------

  const canSave =
    !busy &&
    !saving &&
    !saveInProgressRef.current &&
    modalMode !== "saving" &&
    !scheduleIsPast &&
    !hasPastAppointments &&
    !hasInvalidDates &&
    changedCount > 0 &&
    duplicateCount === 0 &&
    summary.missingTime === 0 &&
    summary.unassigned === 0 &&
    typeof saveAppointments === "function";

  // ----------------------------------------------------------
  // OPEN CONFIRMATION
  // ----------------------------------------------------------

  const handleSaveClick = () => {
    if (!canSave) return;

    setSaveError("");
    setModalMode("confirm");
  };

  // ----------------------------------------------------------
  // CONFIRMED SAVE
  // ----------------------------------------------------------

  const handleConfirmedSave = async () => {
    if (saveInProgressRef.current) {
      return;
    }

    // Recheck hospital date immediately
    // before starting the save.
    const currentToday =
      getHospitalToday();

    const blocked = appointments.some(
      (row) => {
        const rowDate = getDate(
          row,
          scheduleDate
        );

        return (
          !isValidDate(rowDate) ||
          rowDate < currentToday
        );
      }
    );

    if (
      blocked ||
      (isValidDate(scheduleDate) &&
        scheduleDate < currentToday)
    ) {
      setSaveError(
        "Past schedules cannot be updated. Review the appointment dates and try again."
      );

      setModalMode("error");
      return;
    }

    if (
      busy ||
      saving ||
      duplicateCount > 0 ||
      summary.missingTime > 0 ||
      summary.unassigned > 0 ||
      changedCount <= 0 ||
      typeof saveAppointments !== "function"
    ) {
      setSaveError(
        "The schedule is not ready to save. Review duplicate patients, appointment times, and therapist assignments."
      );

      setModalMode("error");
      return;
    }

    saveInProgressRef.current = true;

    setSaveError("");
    setModalMode("saving");

    const expectedCount = changedCount;

    try {
      /*
       * saveAppointments must return true,
       * or { success: true, savedCount } only
       * when the Django operation succeeds.
       *
       * Undefined is NOT treated as success.
       */

      const result = await saveAppointments({
        skipConfirmation: true,
      });

      const success =
        result === true ||
        result?.success === true;

      if (!success) {
        throw new Error(
          result?.message ||
            "Saving was not confirmed by the scheduling system."
        );
      }

      const completed =
        result &&
        typeof result === "object" &&
        Number.isFinite(
          Number(result.savedCount)
        )
          ? Number(result.savedCount)
          : expectedCount;

      /*
       * Parent callback should:
       * 1. Refresh Scheduled History.
       * 2. Clear the draft appointments.
       * 3. Clear import preview.
       * 4. Preserve Claims approval values.
       *
       * It must not clear the draft if
       * history synchronization fails.
       */

      if (
        typeof onSaveSuccess !== "function"
      ) {
        throw new Error(
          "Appointments were saved, but the parent has no onSaveSuccess callback to refresh history and clear the working draft. Refresh Scheduled History before retrying."
        );
      }

      const completion =
        await onSaveSuccess(result);

      if (
        completion === false ||
        completion?.success === false
      ) {
        throw new Error(
          completion?.message ||
            "Appointments were saved, but the working table could not be finalized. Refresh Scheduled History before retrying."
        );
      }

      setSavedCount(completed);
      setModalMode("success");
    } catch (error) {
      setSaveError(
        error?.message ||
          "Unable to complete the save."
      );

      setModalMode("error");
    } finally {
      saveInProgressRef.current = false;
    }
  };

  // ----------------------------------------------------------
  // HISTORY NAVIGATION
  // ----------------------------------------------------------

  const handleViewHistory = () => {
    setModalMode(null);
    onViewHistory?.();
  };

  // ----------------------------------------------------------
  // VISIBILITY
  // ----------------------------------------------------------

  if (
    appointments.length === 0 &&
    modalMode !== "success"
  ) {
    return null;
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      {appointments.length > 0 && (
        <section className="st-schedule">

          {/* HEADER */}

          <header className="st-header">
            <div className="st-heading-left">
              <div className="st-heading-icon">
                ▦
              </div>

              <div>
                <h2>
                  Therapist Appointments
                </h2>

                <p>
                  Manage appointments,
                  confirmations, approvals
                  and patient records
                </p>
              </div>
            </div>

            <div className="st-header-actions">
              <div className="st-header-pill">
                <span className="st-live-dot" />
                {summary.total} Appointments
              </div>

              <button
                type="button"
                className="st-save-button"
                disabled={!canSave}
                onClick={handleSaveClick}
              >
                {saving ||
                modalMode === "saving"
                  ? "Saving..."
                  : `Save Changes (${changedCount})`}
              </button>
            </div>
          </header>

          {/* SUMMARY CARDS */}

          <div className="st-summary-grid">
            <SummaryCard
              label="Total Booked"
              value={summary.total}
              type="total"
              icon="▦"
            />

            <SummaryCard
              label="Confirmed"
              value={summary.confirmed}
              type="confirmed"
              icon="✓"
            />

            <SummaryCard
              label="Unconfirmed"
              value={summary.unconfirmed}
              type="unconfirmed"
              icon="◷"
            />

            <SummaryCard
              label="Rescheduled"
              value={summary.rescheduled}
              type="rescheduled"
              icon="↻"
            />

            <SummaryCard
              label="Cancelled"
              value={summary.cancelled}
              type="cancelled"
              icon="✕"
            />
          </div>

          {/* HISTORICAL SCHEDULE WARNING */}

          {(
            scheduleIsPast ||
            hasPastAppointments
          ) && (
            <div className="st-warning-banner st-readonly-banner">
              <span className="st-warning-icon">
                🔒
              </span>

              <div>
                <strong>
                  Historical Schedule — Read Only
                </strong>

                <p>
                  Appointments dated before
                  {` ${formatDisplayDate(today)}`}
                  cannot be edited, removed,
                  or saved. Historical records
                  remain available in
                  Scheduled History.
                </p>
              </div>
            </div>
          )}

          {/* INVALID DATE WARNING */}

          {hasInvalidDates && (
            <div className="st-warning-banner">
              <span className="st-warning-icon">
                !
              </span>

              <div>
                <strong>
                  {invalidDateAppointments.length}
                  {" "}appointments need a valid date
                </strong>

                <p>
                  Correct the appointment dates
                  before saving. Every appointment
                  must have a valid date.
                </p>
              </div>
            </div>
          )}

          {/* DUPLICATE WARNING */}

          {duplicateCount > 0 && (
            <div className="st-warning-banner">
              <span className="st-warning-icon">
                !
              </span>

              <div>
                <strong>
                  {duplicateCount} duplicate
                  patient appointment
                  {duplicateCount === 1
                    ? ""
                    : "s"} detected
                </strong>

                <p>
                  Duplicate patient names
                  on the same date must be
                  reviewed before saving.
                  No records were removed
                  automatically.
                </p>
              </div>
            </div>
          )}

          {/* TIME WARNING */}

          {summary.missingTime > 0 && (
            <div className="st-warning-banner">
              <span className="st-warning-icon">
                !
              </span>

              <div>
                <strong>
                  {summary.missingTime}
                  {" "}appointments need
                  a valid time
                </strong>

                <p>
                  Edit these appointments
                  before saving.
                </p>
              </div>
            </div>
          )}

          {/* THERAPIST WARNING */}

          {summary.unassigned > 0 && (
            <div className="st-warning-banner">
              <span className="st-warning-icon">
                !
              </span>

              <div>
                <strong>
                  {summary.unassigned}
                  {" "}appointments have
                  no therapist assignment
                </strong>

                <p>
                  Select a registered
                  physiotherapist before saving.
                </p>
              </div>
            </div>
          )}

          {/* TABLE HEADING */}

          <div className="st-table-heading">
            <div>
              <h3>
                Appointment Schedule
              </h3>

              <span>
                Earliest appointments first
              </span>
            </div>

            <div className="st-sort-badge">
              ↑ Time: Earliest First
            </div>
          </div>

          {/* TABLE */}

          <div className="st-table-scroll">
            <table className="st-table">
              <thead>
                <tr>
                  <th>Appointment Time</th>
                  <th>Patient Details</th>
                  <th>Therapist</th>
                  <th>Confirmation Status</th>
                  <th>Type</th>
                  <th>Claims Approval</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {sorted.map((row, index) => {
                  const time = getTime(row);
                  const status = getStatus(row);
                  const statusInfo =
                    STATUS_INFO[status];

                  const approval =
                    getApproval(row);

                  const therapistName =
                    getTherapistName(
                      row,
                      therapistOptions
                    );

                  const rowIsPast =
                    scheduleIsPast ||
                    isRowPast(row);

                  const disableEditing =
                    busy ||
                    saving ||
                    modalMode === "saving" ||
                    rowIsPast;

                  return (
                    <tr
                      key={
                        row.localId ||
                        row.id ||
                        `${row.patient_name}-${index}`
                      }
                      className={
                        rowIsPast
                          ? "st-past-row"
                          : ""
                      }
                    >
                      {/* TIME */}

                      <td>
                        <div className="st-time-cell">
                          <span className="st-row-index">
                            {pad(index + 1)}
                          </span>

                          <span
                            className={
                              time
                                ? "st-time-value"
                                : "st-time-value st-time-missing"
                            }
                          >
                            <span className="st-clock-icon">
                              ◷
                            </span>

                            {time
                              ? formatTime12(time)
                              : "Missing time"}
                          </span>
                        </div>
                      </td>

                      {/* PATIENT */}

                      <td>
                        <div className="st-patient">
                          <strong>
                            {row.patient_name ||
                              "Unnamed patient"}
                          </strong>

                          <span>
                            File No.{" "}
                            <b>
                              {row.file_number ||
                                "Not matched"}
                            </b>
                          </span>

                          {rowIsPast && (
                            <span className="st-row-lock">
                              🔒 Historical record
                            </span>
                          )}
                        </div>
                      </td>

                      {/* THERAPIST */}

                      <td>
                        <TherapistDisplay
                          name={therapistName}
                        />
                      </td>

                      {/* STATUS */}

                      <td>
                        <div
                          className={`st-status-wrapper st-status-${status}`}
                        >
                          <span className="st-status-icon">
                            {statusInfo.icon}
                          </span>

                          <strong>
                            {statusInfo.label}
                          </strong>
                        </div>
                      </td>

                      {/* TYPE */}

                      <td>
                        <span
                          className={`st-type ${
                            row.appointment_type ===
                            "evaluation"
                              ? "st-type-evaluation"
                              : "st-type-followup"
                          }`}
                        >
                          {getAppointmentType(row)}
                        </span>
                      </td>

                      {/* APPROVAL */}

                      <td>
                        <span
                          className={`st-approval st-approval-${approval}`}
                        >
                          <span className="st-approval-dot" />

                          {APPROVAL_LABELS[approval] ||
                            label(approval)}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td>
                        <div className="st-row-actions">
                          <button
                            type="button"
                            className="st-action-edit"
                            disabled={disableEditing}
                            title={
                              rowIsPast
                                ? "Past appointments are read-only"
                                : "Edit appointment"
                            }
                            onClick={() => {
                              if (!disableEditing) {
                                editAppointment?.(row);
                              }
                            }}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="st-action-details"
                            onClick={() =>
                              openDetails?.(row)
                            }
                          >
                            Details
                          </button>

                          {row.isNew && (
                            <button
                              type="button"
                              className="st-action-remove"
                              disabled={disableEditing}
                              onClick={() => {
                                if (!disableEditing) {
                                  removeDraftAppointment?.(
                                    row
                                  );
                                }
                              }}
                            >
                              ✕ Remove
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* FOOTER */}

          <footer className="st-footer">
            <div className="st-footer-note">
              <strong>
                {scheduleIsPast ||
                hasPastAppointments
                  ? "Historical appointments are locked"
                  : duplicateCount > 0
                    ? `${duplicateCount} duplicate records require attention`
                    : changedCount > 0
                      ? `${changedCount} unsaved changes`
                      : "Appointment schedule"}
              </strong>

              <span>
                {scheduleIsPast ||
                hasPastAppointments
                  ? "Previous-day appointments cannot be modified."
                  : loadedSchedule
                    ? "Existing records are available in Django. Save only the changes you intend to make."
                    : "Appointments will appear in Scheduled History after saving."}
              </span>
            </div>

            <button
              type="button"
              className="st-footer-save"
              disabled={!canSave}
              onClick={handleSaveClick}
            >
              {saving ||
              modalMode === "saving"
                ? "Saving..."
                : `Save Changes (${changedCount})`}
            </button>
          </footer>
        </section>
      )}

      {/* SAVE MODAL */}

      {modalMode && (
        <ScheduleModal
          mode={modalMode}
          appointments={appointments}
          therapistOptions={therapistOptions}
          changedCount={changedCount}
          savedCount={savedCount}
          error={saveError}
          onClose={() =>
            setModalMode(null)
          }
          onConfirm={handleConfirmedSave}
          onViewHistory={handleViewHistory}
        />
      )}

      {/* STYLES */}

      <style>{`
        .st-schedule {
          --st-blue: #2563eb;
          --st-dark: #132341;
          --st-muted: #66758d;
          --st-border: #e5eaf3;
          background: #ffffff;
          border: 1px solid var(--st-border);
          border-radius: 20px;
          overflow: hidden;
          font-family: Inter, system-ui,
            -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
          box-shadow: 0 8px 35px
            rgba(28,49,92,.07);
        }

        .st-schedule * {
          box-sizing: border-box;
        }

        .st-header {
          padding: 25px 28px;
          background: linear-gradient(
            115deg,
            #132e6a 0%,
            #2456b8 60%,
            #3879e7 100%
          );
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .st-heading-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .st-heading-icon {
          display: grid;
          place-items: center;
          width: 48px;
          height: 48px;
          border-radius: 13px;
          background: rgba(255,255,255,.17);
          color: white;
          font-size: 27px;
          font-weight: 900;
        }

        .st-header h2 {
          margin: 0 0 5px;
          font-size: 23px;
          color: white;
          font-weight: 850;
          letter-spacing: -.6px;
        }

        .st-header p {
          margin: 0;
          font-size: 13px;
          color: #dce8ff;
          font-weight: 500;
        }

        .st-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .st-header-pill {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 10px 15px;
          border: 1px solid rgba(255,255,255,.25);
          border-radius: 999px;
          background: rgba(255,255,255,.16);
          color: white;
          font-size: 13px;
          font-weight: 800;
        }

        .st-live-dot {
          width: 9px;
          height: 9px;
          background: #6fffc4;
          border-radius: 50%;
          box-shadow: 0 0 0 4px
            rgba(111,255,196,.18);
        }

        .st-save-button {
          padding: 11px 17px;
          border: none;
          border-radius: 10px;
          background: white;
          color: #2457cb;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
        }

        .st-save-button:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .st-summary-grid {
          display: grid;
          grid-template-columns:
            repeat(5,minmax(0,1fr));
          gap: 13px;
          padding: 23px 25px;
          background: #f8faff;
        }

        .st-summary-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 15px 13px;
          border: 1px solid #e8edf6;
          border-radius: 14px;
          background: white;
          box-shadow: 0 3px 12px
            rgba(30,50,90,.035);
        }

        .st-summary-icon {
          width: 40px;
          height: 40px;
          border-radius: 11px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          font-size: 21px;
          font-weight: 900;
        }

        .st-summary-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .st-summary-content span {
          color: #687791;
          font-size: 11px;
          font-weight: 700;
        }

        .st-summary-content strong {
          color: #14233d;
          font-size: 25px;
          font-weight: 900;
        }

        .st-summary-total .st-summary-icon {
          background: #eaf0ff;
          color: #2457df;
        }

        .st-summary-confirmed .st-summary-icon {
          background: #d9fbea;
          color: #059669;
        }

        .st-summary-unconfirmed .st-summary-icon {
          background: #fff0d2;
          color: #e58b09;
        }

        .st-summary-rescheduled .st-summary-icon {
          background: #efe5ff;
          color: #7c3aed;
        }

        .st-summary-cancelled .st-summary-icon {
          background: #ffe4e8;
          color: #e11d48;
        }

        .st-warning-banner {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin: 20px 25px 0;
          padding: 15px;
          border-radius: 12px;
          background: #fff8e9;
          border: 1px solid #ffe1a4;
        }

        .st-warning-icon {
          display: grid;
          place-items: center;
          width: 27px;
          height: 27px;
          border-radius: 50%;
          background: #f59e0b;
          color: white;
          font-weight: 900;
          flex-shrink: 0;
        }

        .st-warning-banner strong {
          color: #995500;
          font-size: 13px;
          font-weight: 850;
        }

        .st-warning-banner p {
          margin: 5px 0 0;
          color: #a16d22;
          font-size: 12px;
          line-height: 1.5;
        }

        .st-readonly-banner {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .st-readonly-banner .st-warning-icon {
          background: #475569;
          font-size: 12px;
        }

        .st-readonly-banner strong {
          color: #334155;
        }

        .st-readonly-banner p {
          color: #64748b;
        }

        .st-table-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          padding: 21px 26px 15px;
        }

        .st-table-heading h3 {
          margin: 0 0 5px;
          font-size: 17px;
          font-weight: 850;
          color: #162641;
        }

        .st-table-heading span {
          font-size: 12px;
          color: #7b879b;
        }

        .st-sort-badge {
          padding: 8px 12px;
          border-radius: 8px;
          background: #eaf1ff;
          color: #2457cb;
          font-size: 11px;
          font-weight: 800;
        }

        .st-table-scroll {
          width: 100%;
          overflow-x: auto;
          padding: 0 22px 18px;
        }

        .st-table {
          width: 100%;
          min-width: 1200px;
          border-collapse: separate;
          border-spacing: 0;
        }

        .st-table thead th {
          padding: 14px 13px;
          text-align: left;
          background: #f0f5fd;
          color: #415575;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .55px;
          font-weight: 850;
          border-bottom: 2px solid #dfe8f7;
        }

        .st-table tbody td {
          padding: 15px 12px;
          border-bottom: 1px solid #edf1f7;
          vertical-align: middle;
        }

        .st-table tbody tr:nth-child(even) {
          background: #fafcff;
        }

        .st-table tbody tr:hover {
          background: #edf5ff;
        }

        .st-past-row {
          background: #f8fafc !important;
        }

        .st-past-row:hover {
          background: #f1f5f9 !important;
        }

        .st-row-lock {
          color: #64748b !important;
          font-size: 10px !important;
          font-weight: 800 !important;
        }

        .st-time-cell {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .st-row-index {
          display: grid;
          place-items: center;
          width: 25px;
          height: 25px;
          border-radius: 7px;
          background: #e8efff;
          color: #2457d8;
          font-size: 11px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .st-time-value {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 10px 12px;
          border-radius: 11px;
          background: #eef4ff;
          border: 1.5px solid #b9cffd;
          color: #174bb9;
          font-size: 13px;
          font-weight: 900;
          white-space: nowrap;
        }

        .st-time-missing {
          background: #fff1f2;
          border-color: #fecdd3;
          color: #be123c;
        }

        .st-clock-icon {
          font-size: 17px;
        }

        .st-patient {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .st-patient > strong {
          color: #172844;
          font-size: 13px;
          font-weight: 850;
        }

        .st-patient > span {
          color: #7a89a2;
          font-size: 11px;
          font-weight: 600;
        }

        .st-patient b {
          color: #3466c5;
          font-weight: 850;
        }

        .st-therapist {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 180px;
        }

        .st-therapist-avatar {
          display: grid;
          place-items: center;
          width: 32px;
          height: 32px;
          flex-shrink: 0;
          border-radius: 10px;
          background: #e9e5ff;
          color: #6542d3;
          font-weight: 900;
          font-size: 13px;
        }

        .st-therapist-content {
          display: flex;
          align-items: center;
          min-width: 0;
        }

        .st-therapist-content strong {
          color: #34445f;
          font-size: 12px;
          font-weight: 800;
        }

        .st-status-wrapper {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border-radius: 9px;
          padding: 10px 12px;
          border: 1px solid transparent;
          font-size: 12px;
          white-space: nowrap;
        }

        .st-status-icon {
          font-size: 16px;
          font-weight: 900;
        }

        .st-status-unconfirmed,
        .st-status-no_answer {
          background: #fff1d6;
          border-color: #ffdc9b;
          color: #a65b00;
        }

        .st-status-confirmed {
          background: #d9fae9;
          border-color: #a8edca;
          color: #087b4c;
        }

        .st-status-cancelled {
          background: #ffe3e9;
          border-color: #ffb9c8;
          color: #c41e49;
        }

        .st-status-rescheduled {
          background: #ece3ff;
          border-color: #d5c1ff;
          color: #6936bf;
        }

        .st-status-phone_off {
          background: #e2e8f0;
          border-color: #cbd5e1;
          color: #475569;
        }

        .st-type {
          display: inline-flex;
          align-items: center;
          padding: 8px 11px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 850;
          white-space: nowrap;
        }

        .st-type-evaluation {
          background: #e0e7ff;
          color: #4338ca;
        }

        .st-type-followup {
          background: #e0f2fe;
          color: #0369a1;
        }

        .st-approval {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border-radius: 999px;
          padding: 8px 12px;
          background: #eef2f7;
          color: #64748b;
          font-size: 11px;
          font-weight: 850;
          white-space: nowrap;
        }

        .st-approval-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: currentColor;
        }

        .st-approval-approved {
          background: #d9fae9;
          color: #047857;
        }

        .st-approval-pending {
          background: #fff0cc;
          color: #b77900;
        }

        .st-approval-rejected,
        .st-approval-denied,
        .st-approval-expired {
          background: #ffe3e9;
          color: #be123c;
        }

        .st-row-actions {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-wrap: wrap;
        }

        .st-row-actions button {
          border-radius: 9px;
          padding: 9px 12px;
          font-size: 11px;
          font-weight: 850;
          cursor: pointer;
          white-space: nowrap;
        }

        .st-action-edit {
          border: 1px solid #bfdbfe;
          background: #eff6ff;
          color: #1d4ed8;
        }

        .st-action-details {
          border: 1px solid #cbd5e1;
          background: white;
          color: #475569;
        }

        .st-action-remove {
          border: 1px solid #ffc5cf;
          background: #fff1f3;
          color: #d21f48;
        }

        .st-row-actions button:hover:not(:disabled) {
          filter: brightness(.96);
        }

        .st-row-actions button:disabled {
          opacity: .4;
          cursor: not-allowed;
        }

        .st-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          flex-wrap: wrap;
          padding: 20px 25px;
          background: #f8faff;
          border-top: 1px solid #e7edf8;
        }

        .st-footer-note {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .st-footer-note strong {
          color: #213455;
          font-size: 13px;
          font-weight: 850;
        }

        .st-footer-note span {
          color: #7a89a1;
          font-size: 11px;
        }

        .st-footer-save {
          border: none;
          border-radius: 10px;
          padding: 12px 18px;
          background: linear-gradient(
            110deg,
            #2457d8,
            #387cf2
          );
          color: white;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
          box-shadow: 0 5px 13px
            rgba(37,99,235,.2);
        }

        .st-footer-save:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        /* MODAL */

        .st-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          background: rgba(9,24,54,.65);
          backdrop-filter: blur(5px);
        }

        .st-modal {
          width: min(100%, 500px);
          max-height: 92vh;
          overflow-y: auto;
          padding: 30px;
          background: white;
          border-radius: 22px;
          box-shadow: 0 25px 90px
            rgba(0,0,0,.28);
          outline: none;
          animation: st-modal-pop .22s ease-out;
        }

        @keyframes st-modal-pop {
          from {
            opacity: 0;
            transform: translateY(12px) scale(.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .st-modal-icon {
          display: grid;
          place-items: center;
          width: 62px;
          height: 62px;
          margin: 0 auto 18px;
          border-radius: 19px;
          font-size: 31px;
          font-weight: 900;
        }

        .st-modal-icon-confirm {
          background: #e8f0ff;
          color: #2457d8;
        }

        .st-modal-icon-success {
          background: #dcfce7;
          color: #059669;
        }

        .st-modal-icon-error {
          background: #ffe4e6;
          color: #e11d48;
        }

        .st-modal h2 {
          margin: 0;
          text-align: center;
          color: #162641;
          font-size: 23px;
          font-weight: 850;
        }

        .st-modal-description {
          margin: 12px 0 0;
          text-align: center;
          color: #718096;
          font-size: 13px;
          line-height: 1.7;
        }

        .st-modal-stats {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 10px;
          margin: 24px 0;
        }

        .st-modal-stats > div {
          padding: 16px 10px;
          border-radius: 13px;
          background: #f0f5ff;
          text-align: center;
        }

        .st-modal-stats strong {
          display: block;
          color: #2457d8;
          font-size: 26px;
          font-weight: 900;
        }

        .st-modal-stats span {
          color: #66758d;
          font-size: 11px;
          font-weight: 700;
        }

        .st-modal-patient-list {
          padding: 17px;
          border: 1px solid #e6ecf6;
          border-radius: 13px;
          background: #fcfdff;
        }

        .st-modal-patient-list h4 {
          margin: 0 0 12px;
          color: #223454;
          font-size: 13px;
        }

        .st-modal-patient {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 0;
          border-bottom: 1px solid #eef2f8;
        }

        .st-modal-patient:last-child {
          border-bottom: none;
        }

        .st-modal-patient-check {
          display: grid;
          place-items: center;
          width: 25px;
          height: 25px;
          border-radius: 50%;
          background: #dcfce7;
          color: #059669;
          font-weight: 900;
          flex-shrink: 0;
        }

        .st-modal-patient strong {
          display: block;
          color: #253653;
          font-size: 12px;
        }

        .st-modal-patient small {
          display: block;
          margin-top: 4px;
          color: #8190a6;
          font-size: 11px;
        }

        .st-modal-more {
          margin: 12px 0 0;
          color: #2457d8;
          font-size: 12px;
          font-weight: 800;
        }

        .st-modal-info {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 18px;
          padding: 14px;
          border-radius: 12px;
          background: #eaf2ff;
          color: #2457b8;
        }

        .st-modal-info > span {
          font-size: 18px;
          font-weight: 900;
        }

        .st-modal-info p {
          margin: 0;
          font-size: 12px;
          line-height: 1.6;
        }

        .st-modal-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 11px;
          margin-top: 23px;
        }

        .st-modal-actions button {
          padding: 13px 10px;
          border-radius: 11px;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
        }

        .st-modal-secondary {
          border: 1px solid #d7dfed;
          background: white;
          color: #52627a;
        }

        .st-modal-primary {
          border: none;
          background: linear-gradient(
            110deg,
            #2457d8,
            #387cf2
          );
          color: white;
        }

        .st-modal-full {
          grid-column: 1 / -1;
        }

        .st-modal-centered {
          text-align: center;
        }

        .st-spinner {
          width: 54px;
          height: 54px;
          margin: 5px auto 24px;
          border: 5px solid #e2eaff;
          border-top-color: #2457d8;
          border-radius: 50%;
          animation: st-spin .8s linear infinite;
        }

        @keyframes st-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .st-saving-progress {
          height: 8px;
          margin-top: 26px;
          border-radius: 999px;
          overflow: hidden;
          background: #e5edff;
        }

        .st-saving-progress div {
          width: 35%;
          height: 100%;
          border-radius: 999px;
          background: #2563eb;
          animation: st-progress 1.5s ease-in-out infinite;
        }

        @keyframes st-progress {
          0% {
            transform: translateX(-110%);
          }
          100% {
            transform: translateX(300%);
          }
        }

        .st-saving-note {
          margin-top: 17px;
          color: #94a3b8;
          font-size: 11px;
        }

        .st-success-count {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin: 25px 0;
          padding: 20px;
          border-radius: 14px;
          background: #ecfdf5;
        }

        .st-success-count strong {
          color: #059669;
          font-size: 39px;
          font-weight: 900;
        }

        .st-success-count span {
          color: #047857;
          font-size: 12px;
          font-weight: 800;
        }

        .st-success-message {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 15px;
          border-radius: 12px;
          background: #f0fdf4;
          color: #166534;
          text-align: left;
        }

        .st-success-message > span {
          font-size: 20px;
          font-weight: 900;
        }

        .st-success-message p {
          margin: 0;
          font-size: 12px;
          line-height: 1.6;
        }

        .st-error-message {
          margin-top: 22px;
          padding: 15px;
          border-radius: 12px;
          background: #fff1f2;
          color: #be123c;
          font-size: 12px;
          line-height: 1.6;
        }

        @media (max-width: 1100px) {
          .st-summary-grid {
            grid-template-columns:
              repeat(3,minmax(0,1fr));
          }
        }

        @media (max-width: 650px) {
          .st-header {
            padding: 20px 16px;
          }

          .st-header h2 {
            font-size: 19px;
          }

          .st-summary-grid {
            grid-template-columns:
              repeat(2,minmax(0,1fr));
            padding: 15px;
          }

          .st-table-heading {
            padding: 18px 15px;
          }

          .st-table-scroll {
            padding: 0 10px 15px;
          }

          .st-footer {
            padding: 16px;
          }

          .st-footer-save {
            width: 100%;
          }

          .st-modal {
            padding: 23px 19px;
          }

          .st-modal h2 {
            font-size: 20px;
          }

          .st-modal-actions {
            grid-template-columns: 1fr;
          }

          .st-modal-full {
            grid-column: auto;
          }
        }
      `}</style>
    </>
  );
}


import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import * as XLSX from "xlsx";
import api from "../../api/api";

import {
  API,
  MAX_FILE_SIZE,
  MAX_APPOINTMENTS,
  ACCEPTED_EXTENSIONS,
  STATUS_OPTIONS,
  STATUS_COLORS,
  FOLLOW_UP_STATUSES,
  today,
  newLocalId,
  validDate,
  validTime,
  normalizeTherapists,
  normalizeHistory,
  emptyAppointment,
  normalizeAppointment,
  extractRows,
  errorMessage,
  detectHeaderRow,
  makeColumnHeaders,
  createColumnMapping,
  appointmentDuplicateKeys,
  validateAppointment,
  payloadForAppointment,
  statusLabel,
  formatDateTime,
} from "./schedule/scheduleHelpers";

import {
  detectScheduleHeader,
  extractScheduleAppointments,
  parseExcelTime,
} from "./schedule/excelImportRules";

import ScheduleFilters from "./schedule/ScheduleFilters";
import ScheduleUpload from "./schedule/ScheduleUpload";
import SchedulePreview from "./schedule/SchedulePreview";
import ScheduleSummaryCards from "./schedule/ScheduleSummaryCards";
import ScheduleHistory from "./schedule/ScheduleHistory";
import ScheduleTable from "./schedule/ScheduleTable";

// ============================================================
// GENERAL HELPERS
// ============================================================

const statusOptions = STATUS_OPTIONS;

const hasValue = (value) =>
  value !== null &&
  value !== undefined &&
  String(value).trim() !== "";

const normalizeId = (value) =>
  hasValue(value) ? String(value) : "";

function getTherapistId(row) {
  const value =
    row?.therapist_id ??
    row?.therapist ??
    row?.physiotherapist ??
    "";

  if (value && typeof value === "object") {
    return normalizeId(
      value.value ??
      value.id ??
      value.pk ??
      value.username ??
      ""
    );
  }

  return normalizeId(value);
}

function findRegisteredTherapist(value, options = []) {
  const id = normalizeId(value);

  if (!id) return null;

  return (
    options.find(
      (option) =>
        normalizeId(option.value) === id
    ) || null
  );
}

function normalizeName(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(
      /\b(dr|doctor|pt|physio|physiotherapist|mr|mrs|ms)\b/g,
      " "
    )
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findTherapistByName(name, options = []) {
  const target = normalizeName(name);

  if (!target) return null;

  const exact = options.filter(
    (option) =>
      normalizeName(option.label) === target
  );

  if (exact.length === 1) {
    return exact[0];
  }

  if (exact.length > 1) {
    return null;
  }

  const partial = options.filter((option) => {
    const candidate = normalizeName(option.label);

    return (
      candidate.length >= 5 &&
      target.length >= 5 &&
      (
        candidate.includes(target) ||
        target.includes(candidate)
      )
    );
  });

  return partial.length === 1
    ? partial[0]
    : null;
}

function resolveTherapist(row, options = []) {
  const byId = findRegisteredTherapist(
    getTherapistId(row),
    options
  );

  if (byId) return byId;

  const sourceName =
    row.excel_therapist_name ||
    row.import_therapist ||
    row.therapist_name ||
    "";

  return findTherapistByName(
    sourceName,
    options
  );
}

function applyTherapist(row, option) {
  if (!option) {
    return {
      ...row,
      therapist: "",
      therapist_id: "",
      therapist_name:
        row.excel_therapist_name ||
        row.therapist_name ||
        "",
      therapist_matched: false,
    };
  }

  return {
    ...row,
    therapist: option.value,
    therapist_id: option.value,
    therapist_name: option.label,
    therapist_matched: true,
  };
}

function getAppointmentTime(row) {
  const parsed = parseExcelTime(
    row?.time ?? row?.appointment_time
  );

  return validTime(parsed)
    ? parsed
    : "";
}

function sortAppointments(rows = []) {
  return [...rows].sort((a, b) => {
    const first = getAppointmentTime(a) || "99:99";
    const second = getAppointmentTime(b) || "99:99";

    return first.localeCompare(second);
  });
}

function appointmentKeys(row) {
  return appointmentDuplicateKeys(row);
}

function getApproval(row) {
  return (
    row.claim_approval_status ??
    row.insurance_approval_status ??
    row.approval_status ??
    "approved"
  );
}

function normalizeImportedRow(
  row,
  options,
  selectedDate
) {
  const matched = resolveTherapist(
    row,
    options
  );

  const base = {
    ...row,

    localId:
      row.localId || newLocalId(),

    date:
      row.date ||
      row.appointment_date ||
      selectedDate,

    appointment_date:
      row.appointment_date ||
      row.date ||
      selectedDate,

    time: getAppointmentTime(row),

    confirmation_status:
      row.confirmation_status ||
      "unconfirmed",

    appointment_type:
      row.appointment_type ||
      "followup",

    approval_status:
      getApproval(row),

    source:
      row.source || "excel",

    excel_therapist_name:
      row.excel_therapist_name ||
      row.import_therapist ||
      row.therapist_name ||
      "",

    isNew: true,
    isDirty: true,
  };

  return applyTherapist(
    base,
    matched
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className="csu-status-badge"
      style={{
        background:
          STATUS_COLORS[status] ||
          "#e2e8f0",
      }}
    >
      {statusLabel(status)}
    </span>
  );
}

function TypeBadge({ type }) {
  return (
    <span
      className={`csu-type ${type || "followup"}`}
    >
      {type === "evaluation"
        ? "Evaluation"
        : "Follow-up"}
    </span>
  );
}

// ============================================================
// APPOINTMENT EDITOR
// ============================================================

function AppointmentEditor({
  row,
  therapistOptions = [],
  onChange,
  onFindPatient,
  onSave,
  onClose,
  disabled,
}) {
  const update = (field, value) => {
    const next = {
      ...row,
      [field]: value,
      isDirty: true,
    };

    if (field === "patient_name") {
      next.patient_id = null;
      next.file_number = "";
      next.matched = false;
    }

    if (
      field === "confirmation_status" &&
      value !== "rescheduled"
    ) {
      next.rescheduled_to_date = "";
      next.rescheduled_to_time = "";
    }

    if (field === "therapist") {
      const selected =
        findRegisteredTherapist(
          value,
          therapistOptions
        );

      next.therapist =
        selected?.value ?? "";

      next.therapist_id =
        selected?.value ?? "";

      next.therapist_name =
        selected?.label ?? "";

      next.therapist_matched =
        Boolean(selected);
    }

    onChange(next);
  };

  return (
    <div className="csu-modal-backdrop">
      <div
        className="csu-modal csu-modal-wide"
        role="dialog"
        aria-modal="true"
        aria-label="Appointment editor"
      >
        <div className="csu-section-header">
          <h3>
            {row.id
              ? "Edit Appointment"
              : "New Appointment"}
          </h3>

          <button
            type="button"
            className="csu-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="csu-editor-grid">
          <label>
            Patient Name

            <input
              value={row.patient_name || ""}
              onChange={(event) =>
                update(
                  "patient_name",
                  event.target.value
                )
              }
            />
          </label>

          <label>
            Hospital File Number

            <div className="csu-inline-input">
              <input
                value={row.file_number || ""}
                disabled
              />

              <button
                type="button"
                className="csu-secondary"
                onClick={onFindPatient}
              >
                Find
              </button>
            </div>
          </label>

          <label>
            Physiotherapist

            <select
              value={getTherapistId(row)}
              onChange={(event) =>
                update(
                  "therapist",
                  event.target.value
                )
              }
            >
              <option value="">
                Select Physiotherapist
              </option>

              {therapistOptions.map((option) => (
                <option
                  key={String(option.value)}
                  value={String(option.value)}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Appointment Time

            <input
              type="time"
              value={getAppointmentTime(row)}
              onChange={(event) =>
                update(
                  "time",
                  event.target.value
                )
              }
            />
          </label>

          <label>
            Confirmation Status

            <select
              value={
                row.confirmation_status ||
                "unconfirmed"
              }
              onChange={(event) =>
                update(
                  "confirmation_status",
                  event.target.value
                )
              }
            >
              {STATUS_OPTIONS.map((status) => (
                <option
                  key={status.value}
                  value={status.value}
                >
                  {status.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Appointment Type

            <select
              value={
                row.appointment_type ||
                "followup"
              }
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
          </label>

          <label>
            Source

            <input
              value={row.source || "manual"}
              disabled
            />
          </label>

          <label>
            Claims Approval

            <input
              value={getApproval(row)}
              disabled
            />
          </label>

          {row.confirmation_status ===
            "rescheduled" && (
            <>
              <label>
                New Date

                <input
                  type="date"
                  value={
                    row.rescheduled_to_date || ""
                  }
                  onChange={(event) =>
                    update(
                      "rescheduled_to_date",
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                New Time

                <input
                  type="time"
                  value={
                    row.rescheduled_to_time || ""
                  }
                  onChange={(event) =>
                    update(
                      "rescheduled_to_time",
                      event.target.value
                    )
                  }
                />
              </label>
            </>
          )}

          <label className="csu-full-width">
            Notes

            <textarea
              rows={3}
              value={row.notes || ""}
              onChange={(event) =>
                update(
                  "notes",
                  event.target.value
                )
              }
            />
          </label>
        </div>

        <div className="csu-actions">
          <button
            type="button"
            className="csu-primary"
            disabled={disabled}
            onClick={onSave}
          >
            Apply to Draft
          </button>

          <button
            type="button"
            className="csu-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function CallCenterScheduleUpload({
  therapists = [],
}) {
  // ----------------------------------------------------------
  // GENERAL STATE
  // ----------------------------------------------------------

  const [activeTab, setActiveTab] =
    useState("create");

  const [therapist, setTherapist] =
    useState("");

  const [date, setDate] =
    useState(today());

  const [
    backendTherapists,
    setBackendTherapists,
  ] = useState([]);

  const [
    appointments,
    setAppointments,
  ] = useState([]);

  const [
    historyAppointments,
    setHistoryAppointments,
  ] = useState([]);

  const [alerts, setAlerts] =
    useState([]);

  // ----------------------------------------------------------
  // EXCEL STATE
  // ----------------------------------------------------------

  const [excelFile, setExcelFile] =
    useState(null);

  const [
    workbookSheets,
    setWorkbookSheets,
  ] = useState([]);

  const [
    selectedSheet,
    setSelectedSheet,
  ] = useState("");

  const [sheetRows, setSheetRows] =
    useState([]);

  const [
    headerRowIndex,
    setHeaderRowIndex,
  ] = useState(0);

  const [headers, setHeaders] =
    useState([]);

  const [
    columnMapping,
    setColumnMapping,
  ] = useState([]);

  const [
    importPreview,
    setImportPreview,
  ] = useState([]);

  const [
    importWarnings,
    setImportWarnings,
  ] = useState([]);

  const [
    importSkipped,
    setImportSkipped,
  ] = useState(0);

  // ----------------------------------------------------------
  // LOADING STATE
  // ----------------------------------------------------------

  const [loading, setLoading] =
    useState(false);

  const [
    loadingHistory,
    setLoadingHistory,
  ] = useState(false);

  const [
    loadingAlerts,
    setLoadingAlerts,
  ] = useState(false);

  const [
    loadingTherapists,
    setLoadingTherapists,
  ] = useState(false);

  const [saving, setSaving] =
    useState(false);

  const [importing, setImporting] =
    useState(false);

  // ----------------------------------------------------------
  // MESSAGES
  // ----------------------------------------------------------

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [
    alertsError,
    setAlertsError,
  ] = useState("");

  // ----------------------------------------------------------
  // WORKSPACE
  // ----------------------------------------------------------

  const [hasDraft, setHasDraft] =
    useState(false);

  const [
    loadedSchedule,
    setLoadedSchedule,
  ] = useState(false);

  const [
    editingAppointment,
    setEditingAppointment,
  ] = useState(null);

  const [
    detailsAppointment,
    setDetailsAppointment,
  ] = useState(null);

  const [
    detailsHistory,
    setDetailsHistory,
  ] = useState([]);

  // ----------------------------------------------------------
  // PATIENT SEARCH
  // ----------------------------------------------------------

  const [
    patientSearchOpen,
    setPatientSearchOpen,
  ] = useState(false);

  const [
    patientQuery,
    setPatientQuery,
  ] = useState("");

  const [
    patientMatches,
    setPatientMatches,
  ] = useState([]);

  const [
    searchingPatients,
    setSearchingPatients,
  ] = useState(false);

  // ----------------------------------------------------------
  // FILTERS
  // ----------------------------------------------------------

  const [
    historyFilter,
    setHistoryFilter,
  ] = useState("all");

  const [
    historyQuery,
    setHistoryQuery,
  ] = useState("");

  const [
    scheduleFilter,
    setScheduleFilter,
  ] = useState("all");

  // ----------------------------------------------------------
  // REFS
  // ----------------------------------------------------------

  const fileInputRef = useRef(null);
  const workbookRef = useRef(null);

  const requestRef = useRef(0);
  const historyRequestRef = useRef(0);
  const patientRequestRef = useRef(0);

  const busy =
    loading ||
    saving ||
    importing;

  // ==========================================================
  // THERAPISTS
  // ==========================================================

  const therapistOptions = useMemo(() => {
    const seen = new Set();

    return [
      ...normalizeTherapists(therapists),
      ...normalizeTherapists(
        backendTherapists
      ),
    ].filter((item) => {
      const key = normalizeId(item.value);

      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }, [
    therapists,
    backendTherapists,
  ]);

  const therapistName =
    therapistOptions.find(
      (option) =>
        normalizeId(option.value) ===
        normalizeId(therapist)
    )?.label || therapist;

  // ==========================================================
  // SUMMARY
  // ==========================================================

  const totals = useMemo(() => {
    const count = (status) =>
      appointments.filter(
        (row) =>
          row.confirmation_status === status
      ).length;

    return {
      total: appointments.length,
      confirmed: count("confirmed"),
      unconfirmed: count("unconfirmed"),
      no_answer: count("no_answer"),
      phone_off: count("phone_off"),
      cancelled: count("cancelled"),
      rescheduled: count("rescheduled"),

      evaluations: appointments.filter(
        (row) =>
          row.appointment_type ===
          "evaluation"
      ).length,

      missingTime: appointments.filter(
        (row) =>
          !getAppointmentTime(row)
      ).length,
    };
  }, [appointments]);

  const sortedAppointments = useMemo(() => {
    return sortAppointments(
      appointments.filter((row) => {
        if (scheduleFilter === "all") {
          return true;
        }

        if (
          scheduleFilter === "evaluations"
        ) {
          return (
            row.appointment_type ===
            "evaluation"
          );
        }

        return (
          row.confirmation_status ===
          scheduleFilter
        );
      })
    );
  }, [
    appointments,
    scheduleFilter,
  ]);

  const filteredHistory = useMemo(() => {
    const query = historyQuery
      .toLowerCase()
      .trim();

    return sortAppointments(
      historyAppointments.filter((row) => {
        const matchesStatus =
          historyFilter === "all" ||
          row.confirmation_status ===
            historyFilter;

        const matchesQuery =
          !query ||
          String(
            row.patient_name || ""
          )
            .toLowerCase()
            .includes(query) ||
          String(
            row.file_number || ""
          )
            .toLowerCase()
            .includes(query);

        return (
          matchesStatus &&
          matchesQuery
        );
      })
    );
  }, [
    historyAppointments,
    historyFilter,
    historyQuery,
  ]);

  const followUpAlerts = useMemo(() => {
    return alerts.filter((row) => {
      return (
        FOLLOW_UP_STATUSES.has(
          row.confirmation_status
        ) ||
        row.confirmation_status ===
          "unconfirmed"
      );
    });
  }, [alerts]);

  const changedCount = appointments.filter(
    (row) =>
      row.isNew ||
      row.isDirty
  ).length;

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // ==========================================================
  // FETCH REGISTERED THERAPISTS
  // ==========================================================

  useEffect(() => {
    let active = true;

    async function fetchTherapists() {
      setLoadingTherapists(true);

      try {
        const response = await api.get(
          `${API}therapists/`
        );

        if (!active) return;

        const rows =
          response.data?.therapists ||
          (
            Array.isArray(response.data)
              ? response.data
              : []
          );

        setBackendTherapists(rows);
      } catch (err) {
        if (
          active &&
          !therapists.length
        ) {
          setError(
            errorMessage(err)
          );
        }
      } finally {
        if (active) {
          setLoadingTherapists(false);
        }
      }
    }

    fetchTherapists();

    return () => {
      active = false;
    };
  }, [therapists.length]);

  // ==========================================================
  // SYNCHRONIZE IMPORTED THERAPISTS
  // ==========================================================

  useEffect(() => {
    if (!therapistOptions.length) {
      return;
    }

    setImportPreview((previous) => {
      let changed = false;

      const updated = previous.map((row) => {
        const matched = resolveTherapist(
          row,
          therapistOptions
        );

        if (!matched) {
          return row;
        }

        const currentId =
          getTherapistId(row);

        if (
          currentId ===
            normalizeId(matched.value) &&
          row.therapist_matched === true &&
          row.therapist_name ===
            matched.label
        ) {
          return row;
        }

        changed = true;

        return applyTherapist(
          row,
          matched
        );
      });

      return changed
        ? updated
        : previous;
    });
  }, [therapistOptions]);

  // ==========================================================
  // RESET EXCEL
  // ==========================================================

  const clearExcel = () => {
    workbookRef.current = null;

    setExcelFile(null);
    setWorkbookSheets([]);
    setSelectedSheet("");
    setSheetRows([]);
    setHeaderRowIndex(0);
    setHeaders([]);
    setColumnMapping([]);
    setImportPreview([]);
    setImportWarnings([]);
    setImportSkipped(0);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const cancelPreview = () => {
    setImportPreview([]);
    setImportWarnings([]);
    setImportSkipped(0);
    setError("");
    setSuccess("Import preview cancelled.");
  };

  // ==========================================================
  // RESET WORKSPACE
  // ==========================================================

  const resetWorkspace = () => {
    requestRef.current += 1;
    historyRequestRef.current += 1;
    patientRequestRef.current += 1;

    setAppointments([]);
    setHistoryAppointments([]);
    setAlerts([]);

    setHasDraft(false);
    setLoadedSchedule(false);

    setEditingAppointment(null);
    setDetailsAppointment(null);
    setPatientSearchOpen(false);

    setScheduleFilter("all");

    clearExcel();
    clearMessages();
  };

  const changeContext = (
    field,
    value
  ) => {
    if (busy) return;

    if (
      hasDraft &&
      !window.confirm(
        "Discard unsaved appointment changes?"
      )
    ) {
      return;
    }

    resetWorkspace();

    if (field === "therapist") {
      setTherapist(value);
    } else {
      setDate(value);
    }
  };

  // ==========================================================
  // LOAD SCHEDULE
  // ==========================================================

  const loadSchedule = async () => {
    if (
      !therapist ||
      !validDate(date)
    ) {
      setError(
        "Select a therapist and valid date."
      );
      return;
    }

    if (
      hasDraft &&
      !window.confirm(
        "Discard unsaved changes and reload?"
      )
    ) {
      return;
    }

    const requestId =
      ++requestRef.current;

    setLoading(true);
    clearMessages();

    try {
      const response = await api.get(
        `${API}list/`,
        {
          params: {
            therapist,
            date,
          },
          timeout: 30000,
        }
      );

      if (
        requestId !==
        requestRef.current
      ) {
        return;
      }

      const rows =
        extractRows(response.data);

      setAppointments(
        rows.map((row) =>
          normalizeAppointment(
            row,
            true
          )
        )
      );

      setHasDraft(false);
      setLoadedSchedule(true);

      setSuccess(
        `${rows.length} saved appointment(s) loaded.`
      );
    } catch (err) {
      if (
        requestId ===
        requestRef.current
      ) {
        setError(
          errorMessage(err)
        );
      }
    } finally {
      if (
        requestId ===
        requestRef.current
      ) {
        setLoading(false);
      }
    }
  };

  // ==========================================================
  // EXCEL SHEET LOADING
  // ==========================================================

  const loadSheet = (
    workbook,
    name
  ) => {
    const sheet =
      workbook.Sheets[name];

    if (!sheet) return;

    const rows =
      XLSX.utils.sheet_to_json(
        sheet,
        {
          header: 1,
          raw: true,
          defval: "",
          blankrows: false,
        }
      );

    let index = detectHeaderRow(rows);

    try {
      const detected =
        detectScheduleHeader(rows);

      if (
        Number.isInteger(detected?.index)
      ) {
        index = detected.index;
      }
    } catch {
      // Keep the general header detection.
    }

    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= rows.length
    ) {
      index = 0;
    }

    const nextHeaders =
      makeColumnHeaders(
        rows[index] || []
      );

    setSelectedSheet(name);
    setSheetRows(rows);
    setHeaderRowIndex(index);
    setHeaders(nextHeaders);

    setColumnMapping(
      createColumnMapping(
        nextHeaders
      )
    );

    setImportPreview([]);
    setImportWarnings([]);
    setImportSkipped(0);
  };

  // ==========================================================
  // EXCEL FILE UPLOAD
  // ==========================================================

  const handleExcelFile = async (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    clearMessages();

    const extension =
      `.${file.name
        .split(".")
        .pop()
        .toLowerCase()}`;

    if (
      !ACCEPTED_EXTENSIONS.includes(
        extension
      )
    ) {
      setError(
        "Select an XLSX, XLS, or CSV file."
      );

      event.target.value = "";
      return;
    }

    if (
      !file.size ||
      file.size > MAX_FILE_SIZE
    ) {
      setError(
        "File must be smaller than 15 MB."
      );

      event.target.value = "";
      return;
    }

    setImporting(true);

    try {
      const workbook = XLSX.read(
        await file.arrayBuffer(),
        {
          type: "array",
          cellDates: false,
        }
      );

      if (
        !workbook.SheetNames.length
      ) {
        throw new Error(
          "Spreadsheet has no worksheets."
        );
      }

      workbookRef.current =
        workbook;

      setExcelFile(file);

      setWorkbookSheets(
        workbook.SheetNames
      );

      loadSheet(
        workbook,
        workbook.SheetNames[0]
      );

      setSuccess(
        "Excel loaded. Review the schedule and preview appointments."
      );
    } catch (err) {
      clearExcel();

      setError(
        err.message ||
        "Unable to read Excel."
      );
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  // ==========================================================
  // HEADER AND MAPPING
  // ==========================================================

  const changeHeaderRow = (
    value
  ) => {
    const index = Number(value);

    if (
      index < 0 ||
      index >= sheetRows.length
    ) {
      return;
    }

    const nextHeaders =
      makeColumnHeaders(
        sheetRows[index] || []
      );

    setHeaderRowIndex(index);
    setHeaders(nextHeaders);

    setColumnMapping(
      createColumnMapping(
        nextHeaders
      )
    );

    setImportPreview([]);
  };

  const updateMapping = (
    index,
    field
  ) => {
    setColumnMapping(
      (previous) =>
        previous.map(
          (value, i) =>
            i === index
              ? field
              : field &&
                value === field
              ? ""
              : value
        )
    );

    setImportPreview([]);
  };

  // ==========================================================
  // EXCEL PREVIEW
  // ==========================================================

  const previewExcel = () => {
    clearMessages();

    if (!therapist) {
      setError(
        "Select a physiotherapist before previewing."
      );
      return;
    }

    if (
      !validDate(date)
    ) {
      setError(
        "Select a valid schedule date."
      );
      return;
    }

    if (
      !sheetRows.length
    ) {
      setError(
        "Upload an Excel file first."
      );
      return;
    }

    let result;

    try {
      result =
        extractScheduleAppointments({
          rows: sheetRows,
          therapistUsers:
            therapistOptions,
          selectedTherapist:
            therapist,
          appointmentDate:
            date,
          existingAppointments:
            appointments,
        });
    } catch (err) {
      setError(
        err.message ||
        "Unable to extract appointments."
      );
      return;
    }

    const imported =
      Array.isArray(result)
        ? result
        : result?.appointments ||
          result?.rows ||
          [];

    const warnings =
      Array.isArray(result?.warnings)
        ? result.warnings
        : [];

    const skipped =
      Number(result?.skipped || 0);

    if (
      imported.length >
      MAX_APPOINTMENTS
    ) {
      setError(
        `Maximum ${MAX_APPOINTMENTS} appointments allowed.`
      );
      return;
    }

    const normalized =
      imported.map((row) =>
        normalizeImportedRow(
          row,
          therapistOptions,
          date
        )
      );

    const seen = new Set(
      appointments.flatMap(
        appointmentKeys
      )
    );

    const unique = [];
    let duplicates = 0;

    normalized.forEach((row) => {
      const keys =
        appointmentKeys(row);

      if (
        !keys.length ||
        keys.some((key) =>
          seen.has(key)
        )
      ) {
        duplicates += 1;
        return;
      }

      keys.forEach((key) =>
        seen.add(key)
      );

      unique.push(row);
    });

    const sorted =
      sortAppointments(unique);

    const unassigned =
      sorted.filter(
        (row) =>
          !findRegisteredTherapist(
            getTherapistId(row),
            therapistOptions
          )
      ).length;

    setImportPreview(sorted);
    setImportWarnings(warnings);

    setImportSkipped(
      skipped + duplicates
    );

    setSuccess(
      `${sorted.length} appointment(s) ready. ` +
      `${duplicates} additional duplicate(s) skipped.` +
      (
        unassigned
          ? ` ${unassigned} require therapist assignment.`
          : ""
      )
    );
  };

  // ==========================================================
  // UPDATE PREVIEW ROW
  // ==========================================================

  const updateImportPreviewRow = (
    localId,
    field,
    value
  ) => {
    setImportPreview((previous) => {
      const updated = previous.map(
        (row) => {
          if (
            row.localId !== localId
          ) {
            return row;
          }

          if (
            field === "therapist" ||
            field === "therapist_id"
          ) {
            const selected =
              findRegisteredTherapist(
                value,
                therapistOptions
              );

            return {
              ...applyTherapist(
                row,
                selected
              ),
              isDirty: true,
            };
          }

          if (field === "time") {
            const parsed =
              parseExcelTime(value);

            return {
              ...row,
              time: parsed || value,
              isDirty: true,
            };
          }

          return {
            ...row,
            [field]: value,
            isDirty: true,
          };
        }
      );

      return sortAppointments(
        updated
      );
    });
  };

  // ==========================================================
  // REMOVE PREVIEW ROW
  // ==========================================================

  const removeImportPreviewRow = (
    localId
  ) => {
    setImportPreview(
      (previous) =>
        previous.filter(
          (row) =>
            row.localId !==
            localId
        )
    );
  };

  // ==========================================================
  // ADD PREVIEW TO DRAFT
  // ==========================================================

  const addPreviewToDraft = () => {
    clearMessages();

    if (
      !importPreview.length
    ) {
      setError(
        "No appointments available to import."
      );
      return;
    }

    const prepared =
      importPreview.map((row) => {
        const selected =
          findRegisteredTherapist(
            getTherapistId(row),
            therapistOptions
          );

        return applyTherapist(
          row,
          selected
        );
      });

    const unassigned =
      prepared.filter(
        (row) =>
          !getTherapistId(row)
      );

    if (
      unassigned.length
    ) {
      setError(
        `${unassigned.length} appointment(s) have no registered physiotherapist.`
      );
      return;
    }

    const invalidTime =
      prepared.find(
        (row) =>
          !validTime(row.time)
      );

    if (invalidTime) {
      setError(
        `${invalidTime.patient_name || "Appointment"} has an invalid time.`
      );
      return;
    }

    const seen = new Set(
      appointments.flatMap(
        appointmentKeys
      )
    );

    const accepted = [];

    prepared.forEach((row) => {
      const keys =
        appointmentKeys(row);

      if (
        !keys.length ||
        keys.some((key) =>
          seen.has(key)
        )
      ) {
        return;
      }

      keys.forEach((key) =>
        seen.add(key)
      );

      accepted.push({
        ...row,
        isNew: true,
        isDirty: true,
      });
    });

    if (
      appointments.length +
        accepted.length >
      MAX_APPOINTMENTS
    ) {
      setError(
        "Maximum appointment count exceeded."
      );
      return;
    }

    if (
      !accepted.length
    ) {
      setError(
        "No new appointments to add."
      );
      return;
    }

    if (
      !window.confirm(
        `Add ${accepted.length} appointment(s) to draft?`
      )
    ) {
      return;
    }

    setAppointments(
      (previous) =>
        sortAppointments([
          ...previous,
          ...accepted,
        ])
    );

    setHasDraft(true);
    setImportPreview([]);

    setSuccess(
      `${accepted.length} appointment(s) added to draft.`
    );
  };

  // ==========================================================
  // MANUAL APPOINTMENT
  // ==========================================================

  const addAppointment = () => {
    if (
      !therapist ||
      !validDate(date)
    ) {
      setError(
        "Select therapist and date first."
      );
      return;
    }

    if (
      appointments.length >=
      MAX_APPOINTMENTS
    ) {
      setError(
        "Maximum appointments reached."
      );
      return;
    }

    const selected =
      findRegisteredTherapist(
        therapist,
        therapistOptions
      );

    setEditingAppointment({
      ...emptyAppointment(),

      localId: newLocalId(),

      therapist:
        selected?.value ??
        therapist,

      therapist_id:
        selected?.value ??
        therapist,

      therapist_name:
        selected?.label ||
        therapistName,

      date,
      appointment_date: date,

      approval_status: "approved",

      isNew: true,
      isDirty: true,
    });

    clearMessages();
  };

  // ==========================================================
  // SAVE EDITOR TO DRAFT
  // ==========================================================

  const saveEditorToDraft = () => {
    if (
      !editingAppointment
    ) {
      return;
    }

    const selected =
      findRegisteredTherapist(
        getTherapistId(
          editingAppointment
        ),
        therapistOptions
      );

    if (!selected) {
      setError(
        "Select a registered physiotherapist."
      );
      return;
    }

    const updated = {
      ...applyTherapist(
        editingAppointment,
        selected
      ),

      time:
        getAppointmentTime(
          editingAppointment
        ),

      isDirty: true,

      isNew:
        editingAppointment.isNew ||
        !editingAppointment.id,
    };

    const validation =
      validateAppointment(
        updated
      );

    if (validation) {
      setError(validation);
      return;
    }

    setAppointments((previous) => {
      const exists =
        previous.some(
          (row) =>
            row.localId ===
            updated.localId
        );

      const next = exists
        ? previous.map(
            (row) =>
              row.localId ===
              updated.localId
                ? updated
                : row
          )
        : [
            ...previous,
            updated,
          ];

      return sortAppointments(next);
    });

    setHasDraft(true);
    setEditingAppointment(null);

    setError("");
    setSuccess(
      "Appointment updated in draft."
    );
  };

  // ==========================================================
  // REMOVE DRAFT
  // ==========================================================

  const removeDraftAppointment = (
    row
  ) => {
    if (row.id) {
      setError(
        "Saved appointments must be cancelled, not removed."
      );
      return;
    }

    if (
      !window.confirm(
        "Remove this draft appointment?"
      )
    ) {
      return;
    }

    setAppointments(
      (previous) =>
        previous.filter(
          (item) =>
            item.localId !==
            row.localId
        )
    );

    setHasDraft(true);
  };

  // ==========================================================
  // PATIENT SEARCH
  // ==========================================================

  const findPatient = async () => {
    const query =
      patientQuery.trim();

    if (
      query.length < 2
    ) {
      return;
    }

    const requestId =
      ++patientRequestRef.current;

    setSearchingPatients(true);

    try {
      const response = await api.get(
        `${API}patients/`,
        {
          params: {
            q: query,
          },
          timeout: 30000,
        }
      );

      if (
        requestId ===
        patientRequestRef.current
      ) {
        setPatientMatches(
          response.data?.matches ||
          []
        );
      }
    } catch (err) {
      if (
        requestId ===
        patientRequestRef.current
      ) {
        setError(
          errorMessage(err)
        );
      }
    } finally {
      if (
        requestId ===
        patientRequestRef.current
      ) {
        setSearchingPatients(false);
      }
    }
  };

  const selectPatient = (
    patient
  ) => {
    setEditingAppointment(
      (previous) =>
        previous
          ? {
              ...previous,

              patient_id:
                patient.id,

              patient_name:
                patient.name,

              file_number:
                patient.file_number ||
                patient.patient_id ||
                "",

              matched: true,
              isDirty: true,
            }
          : previous
    );

    setPatientSearchOpen(false);
    setPatientMatches([]);
    setPatientQuery("");
  };

  // ==========================================================
  // SAVE APPOINTMENTS
  // ==========================================================

  const saveAppointments = async () => {
    if (
      !validDate(date)
    ) {
      setError(
        "Select a valid date."
      );
      return;
    }

    const changed =
      appointments.filter(
        (row) =>
          row.isNew ||
          row.isDirty
      );

    if (
      !changed.length
    ) {
      setSuccess(
        "No changes to save."
      );
      return;
    }

    for (const row of changed) {
      const selected =
        findRegisteredTherapist(
          getTherapistId(row),
          therapistOptions
        );

      if (!selected) {
        setError(
          `${row.patient_name || "Appointment"}: Select a registered physiotherapist.`
        );
        return;
      }

      const issue =
        validateAppointment(
          row
        );

      if (issue) {
        setError(
          `${row.patient_name || "Appointment"}: ${issue}`
        );
        return;
      }
    }

    if (
      !window.confirm(
        `Save ${changed.length} appointment(s) to Django?`
      )
    ) {
      return;
    }

    setSaving(true);
    clearMessages();

    let completed = 0;
    const saved = [];

    try {
      for (const row of changed) {
        const selected =
          findRegisteredTherapist(
            getTherapistId(row),
            therapistOptions
          );

        const normalizedRow =
          applyTherapist(
            row,
            selected
          );

        const payload =
          payloadForAppointment(
            normalizedRow,
            selected.value,
            normalizedRow.date ||
              normalizedRow.appointment_date ||
              date
          );

        payload.therapist =
          selected.value;

        const response =
          row.id && !row.isNew
            ? await api.patch(
                `${API}appointments/${row.id}/`,
                payload,
                {
                  timeout: 30000,
                  withCredentials: true,
                }
              )
            : await api.post(
                `${API}appointments/`,
                payload,
                {
                  timeout: 30000,
                  withCredentials: true,
                }
              );

        saved.push({
          localId: row.localId,

          id:
            response.data?.appointment?.id ??
            response.data?.id ??
            row.id,
        });

        completed += 1;
      }

      setAppointments((previous) =>
        previous.map((row) => {
          const match =
            saved.find(
              (item) =>
                item.localId ===
                row.localId
            );

          return match
            ? {
                ...row,
                id: match.id,
                isNew: false,
                isDirty: false,
              }
            : row;
        })
      );

      setHasDraft(false);
      setLoadedSchedule(true);

      setSuccess(
        `${completed} appointment(s) saved successfully.`
      );

      const oneTherapist =
        changed.every(
          (row) =>
            getTherapistId(row) ===
            normalizeId(therapist)
        );

      if (
        therapist &&
        oneTherapist
      ) {
        try {
          const response =
            await api.get(
              `${API}list/`,
              {
                params: {
                  therapist,
                  date,
                },
                timeout: 30000,
              }
            );

          setAppointments(
            extractRows(
              response.data
            ).map((row) =>
              normalizeAppointment(
                row,
                true
              )
            )
          );
        } catch {
          setSuccess(
            `${completed} saved. Refresh failed; reload to verify.`
          );
        }
      }

      await loadAlerts();
    } catch (err) {
      setAppointments((previous) =>
        previous.map((row) => {
          const match =
            saved.find(
              (item) =>
                item.localId ===
                row.localId
            );

          return match
            ? {
                ...row,
                id: match.id,
                isNew: false,
                isDirty: false,
              }
            : row;
        })
      );

      setHasDraft(true);

      setError(
        `${completed}/${changed.length} saved. ` +
        errorMessage(err) +
        " Check saved records before retrying to avoid duplicates."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // HISTORY
  // ==========================================================

  const loadHistory = async () => {
    if (
      !validDate(date)
    ) {
      return;
    }

    const requestId =
      ++historyRequestRef.current;

    setLoadingHistory(true);
    setError("");

    try {
      const params = {
        date,
      };

      if (therapist) {
        params.therapist =
          therapist;
      }

      const response = await api.get(
        `${API}list/`,
        {
          params,
          timeout: 30000,
        }
      );

      if (
        requestId ===
        historyRequestRef.current
      ) {
        setHistoryAppointments(
          extractRows(
            response.data
          ).map((row) =>
            normalizeAppointment(
              row,
              true
            )
          )
        );
      }
    } catch (err) {
      if (
        requestId ===
        historyRequestRef.current
      ) {
        setError(
          errorMessage(err)
        );
      }
    } finally {
      if (
        requestId ===
        historyRequestRef.current
      ) {
        setLoadingHistory(false);
      }
    }
  };

  // ==========================================================
  // ALERTS
  // ==========================================================

  const loadAlerts = async () => {
    setLoadingAlerts(true);
    setAlertsError("");

    try {
      const response = await api.get(
        `${API}alerts/`,
        {
          timeout: 30000,
        }
      );

      const rows =
        response.data?.alerts ||
        extractRows(
          response.data
        );

      setAlerts(
        (
          Array.isArray(rows)
            ? rows
            : []
        ).map((row) =>
          normalizeAppointment(
            row,
            true
          )
        )
      );
    } catch (err) {
      setAlerts([]);
      setAlertsError(
        errorMessage(err)
      );
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    if (
      activeTab === "history"
    ) {
      if (
        validDate(date)
      ) {
        loadHistory();
      }

      loadAlerts();
    }
  }, [
    activeTab,
    therapist,
    date,
  ]);

  // ==========================================================
  // DETAILS
  // ==========================================================

  const openDetails = async (
    row
  ) => {
    setDetailsAppointment(row);

    setDetailsHistory(
      normalizeHistory(
        row.history
      )
    );

    if (!row.id) {
      return;
    }

    try {
      const response = await api.get(
        `${API}appointments/${row.id}/history/`
      );

      setDetailsHistory(
        normalizeHistory(
          response.data?.history ||
          response.data?.events ||
          []
        )
      );
    } catch {
      // Keep history included in appointment.
    }
  };

  // ==========================================================
  // RECORD CALL ATTEMPT
  // ==========================================================

  const recordCallAttempt = async (
    row
  ) => {
    if (!row.id) {
      setError(
        "Save appointment first."
      );
      return;
    }

    try {
      await api.post(
        `${API}alerts/${row.id}/call-attempt/`,
        {},
        {
          timeout: 30000,
          withCredentials: true,
        }
      );

      setSuccess(
        "Call attempt recorded."
      );

      await loadAlerts();
    } catch (err) {
      setError(
        errorMessage(err)
      );
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="csu-root">
      <style>{styles}</style>

      {/* HERO */}

      <header className="csu-hero">
        <div>
          <small>
            CALL CENTER OPERATIONS
          </small>

          <h2>
            Therapist Scheduling
          </h2>

          <p>
            Import schedules, confirm appointments,
            and track patient communications.
          </p>
        </div>

        <span className="csu-hero-icon">
          📅
        </span>
      </header>

      {/* TABS */}

      <div className="csu-tabs">
        {[
          [
            "create",
            "Create Schedule",
          ],
          [
            "history",
            "Schedule History",
          ],
        ].map(
          ([value, tabLabel]) => (
            <button
              type="button"
              key={value}
              className={
                activeTab === value
                  ? "active"
                  : ""
              }
              onClick={() => {
                if (!busy) {
                  setActiveTab(value);
                  clearMessages();
                }
              }}
            >
              {tabLabel}
            </button>
          )
        )}
      </div>

      {/* MESSAGES */}

      {error && (
        <div className="csu-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="csu-alert success">
          {success}
        </div>
      )}

      {/* FILTERS */}

      <ScheduleFilters
        activeTab={activeTab}
        therapist={therapist}
        therapistOptions={therapistOptions}
        loadingTherapists={loadingTherapists}
        onTherapistChange={(value) =>
          changeContext(
            "therapist",
            value
          )
        }
        date={date}
        onDateChange={(value) =>
          changeContext(
            "date",
            value
          )
        }
        busy={busy}
        loading={loading}
        loadingHistory={loadingHistory}
        onLoadSchedule={loadSchedule}
        onLoadHistory={loadHistory}
        hasDraft={hasDraft}
        historyFilter={historyFilter}
        onHistoryFilterChange={
          setHistoryFilter
        }
        historyQuery={historyQuery}
        onHistoryQueryChange={
          setHistoryQuery
        }
      />

      {/* CREATE TAB */}

      {activeTab === "create" && (
        <>
          {/* EXCEL UPLOAD */}

          <ScheduleUpload
            excelFile={excelFile}
            workbookSheets={workbookSheets}
            selectedSheet={selectedSheet}
            sheetRows={sheetRows}
            headerRowIndex={headerRowIndex}
            headers={headers}
            columnMapping={columnMapping}
            importing={importing}
            busy={busy}
            therapist={therapist}
            fileInputRef={fileInputRef}
            handleExcelFile={handleExcelFile}
            clearExcel={clearExcel}
            changeSheet={(name) => {
              if (
                workbookRef.current
              ) {
                loadSheet(
                  workbookRef.current,
                  name
                );
              }
            }}
            changeHeaderRow={
              changeHeaderRow
            }
            updateMapping={
              updateMapping
            }
            previewExcel={
              previewExcel
            }
          />

          {/* IMPORT PREVIEW */}

          <SchedulePreview
            importPreview={importPreview}
            importSkipped={importSkipped}
            importWarnings={importWarnings}
            therapistOptions={therapistOptions}
            busy={busy}
            updateImportPreviewRow={
              updateImportPreviewRow
            }
            removeImportPreviewRow={
              removeImportPreviewRow
            }
            addPreviewToDraft={
              addPreviewToDraft
            }
            cancelPreview={
              cancelPreview
            }
          />

          {/* MANUAL ENTRY */}

          <section className="csu-panel">
            <div className="csu-section-header">
              <h3>
                Manual Appointment Entry
              </h3>

              <button
                type="button"
                className="csu-primary"
                disabled={
                  !therapist ||
                  busy
                }
                onClick={
                  addAppointment
                }
              >
                + New Appointment
              </button>
            </div>

            <p className="csu-note">
              Add appointments manually or edit
              imported records.
            </p>
          </section>

  
              

          {/* UPDATED THERAPIST APPOINTMENTS TABLE */}

          <ScheduleTable
            appointments={sortedAppointments}
            therapistOptions={therapistOptions}
            busy={busy}
            saving={saving}
            changedCount={changedCount}
            loadedSchedule={loadedSchedule}
            saveAppointments={saveAppointments}
            editAppointment={(row) =>
              setEditingAppointment({
                ...row,
              })
            }
            openDetails={openDetails}
            removeDraftAppointment={
              removeDraftAppointment
            }
          />
        </>
      )}

      {/* HISTORY TAB */}

      {activeTab === "history" && (
        <ScheduleHistory
          filteredHistory={
            filteredHistory
          }
          historyFilter={
            historyFilter
          }
          setHistoryFilter={
            setHistoryFilter
          }
          historyQuery={
            historyQuery
          }
          setHistoryQuery={
            setHistoryQuery
          }
          statusOptions={
            statusOptions
          }
          loadingHistory={
            loadingHistory
          }
          openDetails={
            openDetails
          }
          StatusBadge={
            StatusBadge
          }
          TypeBadge={
            TypeBadge
          }
          loadingAlerts={
            loadingAlerts
          }
          loadAlerts={
            loadAlerts
          }
          alertsError={
            alertsError
          }
          followUpAlerts={
            followUpAlerts
          }
          recordCallAttempt={
            recordCallAttempt
          }
        />
      )}

      {/* APPOINTMENT EDITOR */}

      {editingAppointment && (
        <AppointmentEditor
          row={editingAppointment}
          therapistOptions={therapistOptions}
          onChange={setEditingAppointment}
          onFindPatient={() => {
            setPatientQuery(
              editingAppointment.patient_name ||
                ""
            );

            setPatientMatches([]);
            setPatientSearchOpen(true);
          }}
          onSave={saveEditorToDraft}
          onClose={() =>
            setEditingAppointment(null)
          }
          disabled={saving}
        />
      )}

      {/* PATIENT SEARCH */}

      {patientSearchOpen && (
        <div className="csu-modal-backdrop csu-modal-top">
          <div
            className="csu-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Find existing patient"
          >
            <div className="csu-section-header">
              <h3>
                Find Existing Patient
              </h3>

              <button
                type="button"
                className="csu-close"
                onClick={() =>
                  setPatientSearchOpen(false)
                }
              >
                ×
              </button>
            </div>

            <p className="csu-note">
              Search by patient name or hospital
              file number.
            </p>

            <div className="csu-search-row">
              <input
                value={patientQuery}
                onChange={(event) =>
                  setPatientQuery(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter"
                  ) {
                    findPatient();
                  }
                }}
                placeholder="Patient name or file number"
              />

              <button
                type="button"
                className="csu-primary"
                disabled={searchingPatients}
                onClick={findPatient}
              >
                {searchingPatients
                  ? "Searching..."
                  : "Search"}
              </button>
            </div>

            <div className="csu-matches">
              {patientMatches.map(
                (patient) => (
                  <button
                    type="button"
                    key={patient.id}
                    onClick={() =>
                      selectPatient(patient)
                    }
                  >
                    <strong>
                      {patient.name}
                    </strong>

                    <span>
                      File:{" "}
                      {patient.file_number ||
                        patient.patient_id ||
                        "N/A"}
                    </span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* APPOINTMENT DETAILS */}

      {detailsAppointment && (
        <div className="csu-modal-backdrop">
          <div
            className="csu-modal csu-modal-wide"
            role="dialog"
            aria-modal="true"
            aria-label="Appointment details"
          >
            <div className="csu-section-header">
              <h3>
                Appointment Details
              </h3>

              <button
                type="button"
                className="csu-close"
                onClick={() =>
                  setDetailsAppointment(null)
                }
              >
                ×
              </button>
            </div>

            <div className="csu-detail-grid">
              {[
                [
                  "Patient",
                  detailsAppointment.patient_name,
                ],
                [
                  "File Number",
                  detailsAppointment.file_number ||
                    "—",
                ],
                [
                  "Therapist",
                  detailsAppointment.therapist_name ||
                    therapistName,
                ],
                [
                  "Date",
                  detailsAppointment.date ||
                    detailsAppointment.appointment_date ||
                    date,
                ],
                [
                  "Time",
                  detailsAppointment.time ||
                    "—",
                ],
                [
                  "Status",
                  statusLabel(
                    detailsAppointment.confirmation_status
                  ),
                ],
                [
                  "Type",
                  detailsAppointment.appointment_type,
                ],
                [
                  "Claims Approval",
                  getApproval(detailsAppointment),
                ],
                [
                  "Notes",
                  detailsAppointment.notes ||
                    "—",
                ],
              ].map(
                ([detailLabel, value]) => (
                  <div key={detailLabel}>
                    <small>
                      {detailLabel}
                    </small>

                    <strong>
                      {value}
                    </strong>
                  </div>
                )
              )}
            </div>

            <h4>
              Change History
            </h4>

            {detailsHistory.length === 0 ? (
              <p className="csu-note">
                No audit events returned.
              </p>
            ) : (
              <div className="csu-timeline">
                {detailsHistory.map(
                  (event, index) => (
                    <div
                      className="csu-timeline-item"
                      key={event.id || index}
                    >
                      <strong>
                        {event.action}
                      </strong>

                      <p>
                        {event.old_status
                          ? `${statusLabel(
                              event.old_status
                            )} → `
                          : ""}

                        {event.new_status
                          ? statusLabel(
                              event.new_status
                            )
                          : ""}
                      </p>

                      {event.note && (
                        <p>
                          {event.note}
                        </p>
                      )}

                      <small>
                        {event.changed_by}
                        {" · "}
                        {formatDateTime(
                          event.created_at
                        )}
                      </small>
                    </div>
                  )
                )}
              </div>
            )}

            <div className="csu-actions">
              {activeTab === "create" && (
                <button
                  type="button"
                  className="csu-primary"
                  onClick={() => {
                    setEditingAppointment({
                      ...detailsAppointment,
                    });

                    setDetailsAppointment(null);
                  }}
                >
                  Edit Appointment
                </button>
              )}

              <button
                type="button"
                className="csu-secondary"
                onClick={() =>
                  setDetailsAppointment(null)
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = `
.csu-root {
  width: 100%;
  min-width: 0;
  color: #172b4d;
  font-family: inherit;
}

.csu-root * {
  box-sizing: border-box;
}

.csu-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 28px;
  margin-bottom: 18px;
  border-radius: 18px;
  background: linear-gradient(
    120deg,
    #172b4d,
    #355a91
  );
  color: white;
}

.csu-hero h2 {
  color: white;
  margin: 8px 0;
  font-size: 25px;
}

.csu-hero p {
  color: #dbeafe;
  font-size: 13px;
  margin: 0;
}

.csu-hero small {
  color: #fbcfe8;
  font-weight: 800;
  letter-spacing: 1px;
}

.csu-hero-icon {
  font-size: 45px;
}

.csu-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
  border-bottom: 1px solid #e2e8f0;
}

.csu-tabs button {
  padding: 14px 20px;
  background: transparent;
  border: 0;
  border-bottom: 3px solid transparent;
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
}

.csu-tabs button.active {
  color: #be185d;
  border-bottom-color: #be185d;
}

.csu-panel {
  padding: 22px;
  background: white;
  border: 1px solid #e6ebf2;
  border-radius: 18px;
  margin-bottom: 18px;
  min-width: 0;
  box-shadow: 0 8px 28px
    rgba(15,23,42,.055);
}

.csu-panel h3 {
  margin: 0 0 16px;
  font-size: 17px;
}

.csu-panel h4 {
  margin: 18px 0 12px;
  font-size: 14px;
}

.csu-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.csu-section-header h3 {
  margin: 0;
  color: #142d4e;
}

.csu-form-grid {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 14px;
}

.csu-form-grid label,
.csu-editor-grid label,
.csu-mapping-grid label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
}

.csu-form-grid label {
  flex: 1 1 210px;
}

.csu-root input,
.csu-root select,
.csu-root textarea {
  padding: 11px;
  width: 100%;
  min-width: 0;
  border: 1px solid #cbd5e1;
  border-radius: 9px;
  background: white;
  color: #172b4d;
  font: inherit;
}

.csu-root textarea {
  resize: vertical;
}

.csu-root button {
  cursor: pointer;
  font: inherit;
}

.csu-root button:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.csu-primary,
.csu-secondary {
  padding: 11px 16px;
  border-radius: 10px;
  font-size: 12px !important;
  font-weight: 800 !important;
  white-space: nowrap;
}

.csu-primary {
  background: #be185d;
  color: white;
  border: 1px solid #be185d;
}

.csu-secondary {
  background: white;
  color: #172b4d;
  border: 1px solid #cbd5e1;
}

.csu-remove {
  padding: 8px 11px;
  border: 1px solid #fecaca;
  border-radius: 9px;
  background: #fff1f2;
  color: #be123c;
  font-size: 12px;
  font-weight: 700;
}

.csu-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.csu-note {
  color: #64748b;
  font-size: 12px;
  line-height: 1.6;
  margin-top: 13px;
}

.csu-draft {
  color: #92400e;
  font-weight: 700;
}

.csu-alert {
  padding: 13px 16px;
  margin-bottom: 16px;
  border-radius: 10px;
  font-size: 13px;
}

.csu-alert.error {
  background: #fef2f2;
  color: #991b1b;
}

.csu-alert.success {
  background: #f0fdf4;
  color: #166534;
}

.csu-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 28px;
  border: 2px dashed #cbd5e1;
  border-radius: 13px;
  background: #f8fafc;
  text-align: center;
}

.csu-upload span {
  font-size: 30px;
}

.csu-upload strong {
  font-size: 13px;
}

.csu-upload p {
  color: #64748b;
  font-size: 12px;
  margin: 0;
}

.csu-upload input {
  max-width: 100%;
}

.csu-file-info {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 14px;
  margin: 15px 0;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  background: #f0fdf4;
  font-size: 12px;
}

.csu-mapping-grid {
  display: grid;
  grid-template-columns:
    repeat(3,minmax(0,1fr));
  gap: 12px;
  margin-top: 15px;
}

.csu-mapping-grid label {
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  min-width: 0;
}

.csu-mapping-grid label span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.csu-preview-summary {
  display: grid;
  grid-template-columns:
    repeat(4,minmax(0,1fr));
  gap: 10px;
  margin: 15px 0;
}

.csu-preview-summary > div {
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
}

.csu-preview-summary strong {
  display: block;
  font-size: 22px;
}

.csu-preview-summary span {
  color: #64748b;
  font-size: 11px;
}

.csu-stats {
  display: grid;
  grid-template-columns:
    repeat(4,minmax(0,1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.csu-stat {
  padding: 18px;
  border: 1px solid #e2e8f0;
  border-radius: 13px;
  background: white;
  cursor: pointer;
}

.csu-stat span {
  display: block;
  color: #64748b;
  font-size: 12px;
}

.csu-stat strong {
  display: block;
  margin-top: 8px;
  font-size: 27px;
}

.csu-table-wrap {
  width: 100%;
  overflow-x: auto;
  border: 1px solid #e7edf4;
  border-radius: 14px;
  background: white;
}

.csu-table-wrap table {
  width: 100%;
  min-width: 950px;
  border-collapse: collapse;
}

.csu-table-wrap th,
.csu-table-wrap td {
  padding: 12px;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  font-size: 12px;
  vertical-align: middle;
}

.csu-table-wrap th {
  background: #f5f8fc;
  color: #475569;
  font-weight: 800;
}

.csu-table-wrap tbody tr:hover {
  background: #f8fbff;
}

.csu-row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.csu-row-actions button {
  padding: 7px 9px;
}

.csu-status-badge {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 7px;
  color: #172b4d;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.csu-type {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 7px;
  font-size: 11px;
  font-weight: 700;
}

.csu-type.evaluation {
  background: #ffedd5;
  color: #9a3412;
  border: 1px solid #fdba74;
}

.csu-type.followup {
  background: #eff6ff;
  color: #1d4ed8;
}

.csu-invalid {
  color: #dc2626;
  font-weight: 800;
}

.csu-muted {
  color: #94a3b8;
}

.csu-empty {
  padding: 35px !important;
  text-align: center !important;
  color: #64748b;
}

.csu-empty-state {
  padding: 24px;
  border-radius: 10px;
  background: #f8fafc;
  text-align: center;
  color: #64748b;
  font-size: 13px;
}

.csu-warning-panel {
  padding: 15px;
  margin: 15px 0;
  border: 1px solid #fcd34d;
  border-radius: 10px;
  background: #fffbeb;
}

.csu-warning-panel ul {
  padding-left: 20px;
  font-size: 12px;
  line-height: 1.7;
}

.csu-count {
  padding: 7px 11px;
  border-radius: 20px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
}

.csu-alert-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.csu-alert-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 15px;
  border: 1px solid #fde68a;
  border-radius: 12px;
  background: #fffbeb;
}

.csu-alert-item strong {
  display: block;
  margin-bottom: 5px;
  font-size: 13px;
}

.csu-alert-item p {
  margin: 0 0 8px;
  color: #64748b;
  font-size: 12px;
}

.csu-alert-item small {
  display: block;
  margin-top: 8px;
  color: #64748b;
}

.csu-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15,23,42,.65);
}

.csu-modal-top {
  z-index: 10000;
}

.csu-modal {
  width: 100%;
  max-width: 520px;
  max-height: 88vh;
  overflow-y: auto;
  padding: 25px;
  background: white;
  border-radius: 15px;
}

.csu-modal-wide {
  max-width: 780px;
}

.csu-close {
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 26px !important;
  line-height: 1;
}

.csu-editor-grid {
  display: grid;
  grid-template-columns:
    repeat(2,minmax(0,1fr));
  gap: 15px;
}

.csu-full-width {
  grid-column: 1/-1;
}

.csu-inline-input {
  display: flex;
  gap: 8px;
}

.csu-inline-input input {
  flex: 1;
}

.csu-search-row {
  display: flex;
  gap: 10px;
  margin: 15px 0;
}

.csu-search-row input {
  flex: 1;
}

.csu-matches {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.csu-matches button {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 9px;
  background: #f8fafc;
}

.csu-matches span {
  font-size: 11px;
  color: #64748b;
}

.csu-detail-grid {
  display: grid;
  grid-template-columns:
    repeat(2,minmax(0,1fr));
  gap: 14px;
  margin: 20px 0;
}

.csu-detail-grid > div {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 9px;
}

.csu-detail-grid small {
  color: #64748b;
}

.csu-detail-grid strong {
  font-size: 13px;
}

.csu-timeline {
  padding-left: 12px;
  margin: 20px 0;
  border-left: 2px solid #e2e8f0;
}

.csu-timeline-item {
  position: relative;
  padding: 0 0 20px 22px;
}

.csu-timeline-item strong {
  font-size: 13px;
}

.csu-timeline-item p {
  margin: 6px 0;
  font-size: 12px;
}

.csu-timeline-item small {
  color: #64748b;
  font-size: 11px;
}

.csu-time12 {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  white-space: nowrap;
}

.csu-time12 select {
  min-width: 58px;
  padding: 7px 5px;
}

.csu-time12 select:last-child {
  min-width: 62px;
  font-weight: 700;
}

.csu-approval-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 11px;
  font-size: 11px;
  font-weight: 800;
}

.csu-approval-badge.approved {
  background: #dcfce7;
  color: #166534;
}

.csu-approval-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.csu-approval-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}

@media (max-width: 900px) {
  .csu-stats,
  .csu-preview-summary {
    grid-template-columns:
      repeat(2,minmax(0,1fr));
  }

  .csu-mapping-grid {
    grid-template-columns:
      repeat(2,minmax(0,1fr));
  }
}

@media (max-width: 600px) {
  .csu-hero {
    padding: 20px;
  }

  .csu-hero-icon {
    display: none;
  }

  .csu-panel {
    padding: 15px;
  }

  .csu-tabs button {
    flex: 1;
    padding: 12px 8px;
    font-size: 12px;
  }

  .csu-editor-grid,
  .csu-detail-grid,
  .csu-mapping-grid {
    grid-template-columns: 1fr;
  }

  .csu-search-row,
  .csu-alert-item {
    flex-direction: column;
    align-items: stretch;
  }

  .csu-modal {
    padding: 18px;
  }
}
`;

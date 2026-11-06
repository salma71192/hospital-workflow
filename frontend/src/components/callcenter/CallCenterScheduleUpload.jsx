
import React, {
  useCallback,
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
import ScheduleHistory from "./schedule/ScheduleHistory";
import ScheduleTable from "./schedule/ScheduleTable";
import ManualAppointmentEntry from "./schedule/ManualAppointmentEntry";

// ============================================================
// CONFIGURATION
// ============================================================

const HOSPITAL_TIME_ZONE = "Asia/Dubai";
const statusOptions = STATUS_OPTIONS;

// ============================================================
// DATE HELPERS
// ============================================================

function getHospitalToday() {
  const parts = new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone: HOSPITAL_TIME_ZONE,
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

function appointmentDate(
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

function isPastDate(value) {
  return Boolean(
    value &&
    validDate(value) &&
    value < getHospitalToday()
  );
}

function isEditableDate(value) {
  return Boolean(
    validDate(value) &&
    value >= getHospitalToday()
  );
}

// ============================================================
// GENERAL HELPERS
// ============================================================

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

  if (
    value &&
    typeof value === "object"
  ) {
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

function findRegisteredTherapist(
  value,
  options = []
) {
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
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /\b(dr|doctor|pt|physio|physiotherapist|mr|mrs|ms)\b/g,
      " "
    )
    .replace(
      /[^a-z0-9\u0600-\u06ff]+/g,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

function findTherapistByName(
  name,
  options = []
) {
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

  const partial = options.filter(
    (option) => {
      const candidate = normalizeName(
        option.label
      );

      return (
        candidate.length >= 5 &&
        target.length >= 5 &&
        (
          candidate.includes(target) ||
          target.includes(candidate)
        )
      );
    }
  );

  return partial.length === 1
    ? partial[0]
    : null;
}

function resolveTherapist(
  row,
  options = []
) {
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
    row?.time ??
    row?.appointment_time
  );

  return validTime(parsed)
    ? parsed
    : "";
}

function sortAppointments(rows = []) {
  return [...rows].sort((a, b) => {
    const firstDate = appointmentDate(a);
    const secondDate = appointmentDate(b);

    if (firstDate !== secondDate) {
      return firstDate.localeCompare(
        secondDate
      );
    }

    const first =
      getAppointmentTime(a) || "99:99";

    const second =
      getAppointmentTime(b) || "99:99";

    return first.localeCompare(second);
  });
}

function appointmentKeys(row) {
  return appointmentDuplicateKeys(row);
}

function getApproval(row) {
  const value =
    row?.claim_approval_status ??
    row?.insurance_approval_status ??
    row?.approval_status;

  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return "unknown";
  }

  return String(value);
}

function approvalLabel(row) {
  const value = getApproval(row)
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

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

function normalizeSavedRow(row) {
  const normalized = normalizeAppointment(
    row,
    true
  );

  return {
    ...normalized,
    localId:
      normalized.localId ||
      (
        normalized.id
          ? `saved-${normalized.id}`
          : newLocalId()
      ),
    approval_status:
      getApproval(normalized),
    isNew: false,
    isDirty: false,
  };
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

  const dateValue =
    appointmentDate(row, selectedDate);

  const base = {
    ...row,

    localId:
      row.localId || newLocalId(),

    date: dateValue,
    appointment_date: dateValue,

    time: getAppointmentTime(row),

    confirmation_status:
      row.confirmation_status ||
      "unconfirmed",

    appointment_type:
      row.appointment_type ||
      "followup",

    approval_status: getApproval(row),

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

// ============================================================
// DUPLICATE DETECTION
// ============================================================

// The same normalized patient name on the same
// date must be reviewed before saving.
//
// This matches the duplicate rule used by
// ScheduleTable. No appointments are removed
// automatically.

function patientDuplicateKey(
  row,
  fallbackDate = ""
) {
  const name = normalizeName(
    row.patient_name
  );

  const dateValue = appointmentDate(
    row,
    fallbackDate
  );

  if (!name || !dateValue) {
    return "";
  }

  return `${dateValue}::${name}`;
}

function findPatientDuplicates(
  rows,
  fallbackDate = ""
) {
  const seen = new Map();
  const duplicates = [];

  for (const row of rows) {
    const key = patientDuplicateKey(
      row,
      fallbackDate
    );

    if (!key) continue;

    if (seen.has(key)) {
      duplicates.push({
        first: seen.get(key),
        duplicate: row,
      });
    } else {
      seen.set(key, row);
    }
  }

  return duplicates;
}

// ============================================================
// DISPLAY COMPONENTS
// ============================================================

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
      className={`csu-type ${
        type || "followup"
      }`}
    >
      {type === "evaluation"
        ? "Evaluation"
        : "Follow-up"}
    </span>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function CallCenterScheduleUpload({
  therapists = [],
}) {
  // ----------------------------------------------------------
  // NAVIGATION
  // ----------------------------------------------------------

  const [activeTab, setActiveTab] =
    useState("create");

  // ----------------------------------------------------------
  // SELECTED SCHEDULE
  // ----------------------------------------------------------

  const [therapist, setTherapist] =
    useState("");

  const [date, setDate] = useState(
    getHospitalToday
  );

  const [
    backendTherapists,
    setBackendTherapists,
  ] = useState([]);

  // ----------------------------------------------------------
  // APPOINTMENTS
  // ----------------------------------------------------------

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

  const [
    sheetRows,
    setSheetRows,
  ] = useState([]);

  const [
    headerRowIndex,
    setHeaderRowIndex,
  ] = useState(0);

  const [
    headers,
    setHeaders,
  ] = useState([]);

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
  // LOADING
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
  // PATIENT SEARCH — INLINE
  // ----------------------------------------------------------

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
    historyMonth,
    setHistoryMonth,
  ] = useState("");

  const [
    historyTherapist,
    setHistoryTherapist,
  ] = useState("all");

  // A history query without a specific date is
  // not assumed to be supported by the backend.
  // Month and therapist filters apply to the
  // appointments returned for the selected date.

  // ----------------------------------------------------------
  // REFS
  // ----------------------------------------------------------

  const fileInputRef = useRef(null);
  const workbookRef = useRef(null);

  const requestRef = useRef(0);
  const historyRequestRef = useRef(0);
  const patientRequestRef = useRef(0);

  const saveInProgressRef = useRef(false);

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
      ...normalizeTherapists(
        therapists
      ),
      ...normalizeTherapists(
        backendTherapists
      ),
    ].filter((item) => {
      const key = normalizeId(
        item.value
      );

      if (
        !key ||
        seen.has(key)
      ) {
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
  // DATE LOCK
  // ==========================================================

  const scheduleIsPast = isPastDate(date);

  const hasPastAppointments =
    appointments.some((row) =>
      isPastDate(
        appointmentDate(
          row,
          date
        )
      )
    );

  const scheduleLocked =
    scheduleIsPast ||
    hasPastAppointments;

  const canCreate =
    Boolean(therapist) &&
    isEditableDate(date) &&
    !busy;

  // ==========================================================
  // COUNTS AND SORTING
  // ==========================================================

  const sortedAppointments = useMemo(
    () => sortAppointments(appointments),
    [appointments]
  );

  const changedCount = useMemo(
    () =>
      appointments.filter(
        (row) =>
          row.isNew ||
          row.isDirty
      ).length,
    [appointments]
  );

  const duplicateAppointments = useMemo(
    () =>
      findPatientDuplicates(
        appointments,
        date
      ),
    [appointments, date]
  );

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

        const rowDate = appointmentDate(
          row
        );

        const matchesMonth =
          !historyMonth ||
          rowDate.startsWith(
            historyMonth
          );

        const matchesTherapist =
          historyTherapist === "all" ||
          getTherapistId(row) ===
            normalizeId(
              historyTherapist
            );

        return (
          matchesStatus &&
          matchesQuery &&
          matchesMonth &&
          matchesTherapist
        );
      })
    );
  }, [
    historyAppointments,
    historyFilter,
    historyQuery,
    historyMonth,
    historyTherapist,
  ]);

  const followUpAlerts = useMemo(
    () =>
      alerts.filter(
        (row) =>
          FOLLOW_UP_STATUSES.has(
            row.confirmation_status
          ) ||
          row.confirmation_status ===
            "unconfirmed"
      ),
    [alerts]
  );

  // ==========================================================
  // MESSAGES
  // ==========================================================

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const showError = (message) => {
    setError(message);
    setSuccess("");
  };

  // ==========================================================
  // FETCH THERAPISTS
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
          showError(
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

      const updated = previous.map(
        (row) => {
          const matched =
            resolveTherapist(
              row,
              therapistOptions
            );

          if (!matched) {
            return row;
          }

          if (
            getTherapistId(row) ===
              normalizeId(
                matched.value
              ) &&
            row.therapist_matched ===
              true &&
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
        }
      );

      return changed
        ? updated
        : previous;
    });
  }, [therapistOptions]);

  // ==========================================================
  // CLEAR EXCEL
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
    setSuccess(
      "Import preview cancelled."
    );
  };

  // ==========================================================
  // WORKSPACE RESET
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
    setDetailsHistory([]);

    setPatientQuery("");
    setPatientMatches([]);

    clearExcel();
    clearMessages();
  };

  // ==========================================================
  // CHANGE CONTEXT
  // ==========================================================

  const changeContext = (
    field,
    value
  ) => {
    if (busy) return;

    if (
      field === "date" &&
      activeTab === "create" &&
      value &&
      !isEditableDate(value)
    ) {
      showError(
        "Past schedules are locked. Choose today or a future date."
      );
      return;
    }

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
    } else if (field === "date") {
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
      showError(
        "Select a physiotherapist and a valid date."
      );

      return {
        success: false,
      };
    }

    if (!isEditableDate(date)) {
      showError(
        "Historical schedules are read-only. Use Scheduled History to review them."
      );

      return {
        success: false,
      };
    }

    if (hasDraft) {
      // Never replace unsaved drafts automatically.
      return {
        success: false,
        message: "Unsaved draft exists.",
      };
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
        return {
          success: false,
          message: "Request superseded.",
        };
      }

      const rows =
        extractRows(response.data);

      setAppointments(
        rows.map(
          normalizeSavedRow
        )
      );

      setHasDraft(false);
      setLoadedSchedule(true);

      setSuccess(
        `${rows.length} appointment(s) loaded.`
      );

      return {
        success: true,
        count: rows.length,
      };
    } catch (err) {
      if (
        requestId ===
        requestRef.current
      ) {
        showError(
          errorMessage(err)
        );
      }

      return {
        success: false,
        message: errorMessage(err),
      };
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

    let index =
      detectHeaderRow(rows);

    try {
      const detected =
        detectScheduleHeader(rows);

      if (
        Number.isInteger(
          detected?.index
        )
      ) {
        index =
          detected.index;
      }
    } catch {
      // Preserve fallback header detection.
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
  // EXCEL UPLOAD
  // ==========================================================

  const handleExcelFile = async (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (
      !isEditableDate(date)
    ) {
      showError(
        "Cannot import appointments for past dates."
      );

      event.target.value = "";
      return;
    }

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
      showError(
        "Select an XLSX, XLS, or CSV file."
      );

      event.target.value = "";
      return;
    }

    if (
      !file.size ||
      file.size > MAX_FILE_SIZE
    ) {
      showError(
        "The file is empty or exceeds the allowed size."
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
        "Excel loaded. Review and preview the appointments."
      );
    } catch (err) {
      clearExcel();

      showError(
        err.message ||
        "Unable to read the Excel file."
      );
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  // ==========================================================
  // EXCEL MAPPING
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

    if (
      !therapist ||
      !isEditableDate(date)
    ) {
      showError(
        "Select a physiotherapist and a current or future date."
      );
      return;
    }

    if (!sheetRows.length) {
      showError(
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
      showError(
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
      Array.isArray(
        result?.warnings
      )
        ? result.warnings
        : [];

    const skipped =
      Number(
        result?.skipped || 0
      );

    if (
      imported.length >
      MAX_APPOINTMENTS
    ) {
      showError(
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

    const invalidDate =
      normalized.find(
        (row) =>
          !isEditableDate(
            appointmentDate(
              row,
              date
            )
          )
      );

    if (invalidDate) {
      showError(
        "The Excel file contains an appointment with a past or invalid date."
      );
      return;
    }

    // Retain every row returned by the extractor.
    // Do not silently discard duplicates.

    const previewDuplicates =
      findPatientDuplicates(
        [
          ...appointments,
          ...normalized,
        ],
        date
      );

    const extraWarnings = [
      ...warnings,
    ];

    if (
      previewDuplicates.length
    ) {
      extraWarnings.push(
        `${previewDuplicates.length} possible duplicate appointment(s). Review and correct them before adding the preview to the draft.`
      );
    }

    setImportPreview(
      sortAppointments(
        normalized
      )
    );

    setImportWarnings(
      extraWarnings
    );

    setImportSkipped(skipped);

    if (skipped > 0) {
      setSuccess(
        `${normalized.length} appointments extracted. ${skipped} row(s) were skipped by the Excel parser; review its warnings before proceeding.`
      );
    } else {
      setSuccess(
        `${normalized.length} appointment(s) ready for review.`
      );
    }
  };

  // ==========================================================
  // UPDATE PREVIEW ROW
  // ==========================================================

  const updateImportPreviewRow = (
    localId,
    field,
    value
  ) => {
    if (
      busy ||
      !isEditableDate(date)
    ) {
      return;
    }

    setImportPreview(
      (previous) =>
        sortAppointments(
          previous.map((row) => {
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
                parseExcelTime(
                  value
                );

              return {
                ...row,
                time:
                  parsed || value,
                isDirty: true,
              };
            }

            return {
              ...row,
              [field]: value,
              isDirty: true,
            };
          })
        )
    );
  };

  // ==========================================================
  // REMOVE PREVIEW ROW
  // ==========================================================

  const removeImportPreviewRow = (
    localId
  ) => {
    if (
      busy ||
      !isEditableDate(date)
    ) {
      return;
    }

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
  // ADD EXCEL PREVIEW TO DRAFT
  // ==========================================================

  const addPreviewToDraft = () => {
    clearMessages();

    if (
      !isEditableDate(date)
    ) {
      showError(
        "Past schedules cannot be changed."
      );
      return;
    }

    if (
      !importPreview.length
    ) {
      showError(
        "No appointments available to import."
      );
      return;
    }

    const prepared =
      importPreview.map(
        (row) => {
          const selected =
            resolveTherapist(
              row,
              therapistOptions
            );

          return applyTherapist(
            row,
            selected
          );
        }
      );

    const unassigned =
      prepared.filter(
        (row) =>
          !findRegisteredTherapist(
            getTherapistId(row),
            therapistOptions
          )
      );

    if (
      unassigned.length
    ) {
      showError(
        `${unassigned.length} appointment(s) require a registered physiotherapist.`
      );
      return;
    }

    const invalidTime =
      prepared.find(
        (row) =>
          !validTime(
            getAppointmentTime(row)
          )
      );

    if (invalidTime) {
      showError(
        `${invalidTime.patient_name || "Appointment"} has an invalid time.`
      );
      return;
    }

    const invalidDate =
      prepared.find(
        (row) =>
          !isEditableDate(
            appointmentDate(
              row,
              date
            )
          )
      );

    if (invalidDate) {
      showError(
        "The preview contains a past or invalid appointment date."
      );
      return;
    }

    const duplicates =
      findPatientDuplicates(
        [
          ...appointments,
          ...prepared,
        ],
        date
      );

    if (
      duplicates.length
    ) {
      showError(
        `${duplicates.length} duplicate appointment(s) detected. Resolve them in the preview before adding to the draft.`
      );
      return;
    }

    if (
      appointments.length +
      prepared.length >
      MAX_APPOINTMENTS
    ) {
      showError(
        "Maximum appointment count exceeded."
      );
      return;
    }

    setAppointments(
      (previous) =>
        sortAppointments([
          ...previous,
          ...prepared.map(
            (row) => ({
              ...row,
              isNew: true,
              isDirty: true,
            })
          ),
        ])
    );

    setHasDraft(true);
    setImportPreview([]);

    setSuccess(
      `${prepared.length} appointment(s) added to draft.`
    );
  };

  // ==========================================================
  // MANUAL APPOINTMENT — INLINE
  // ==========================================================

  const addAppointment = () => {
    if (
      !therapist ||
      !isEditableDate(date)
    ) {
      showError(
        "Select a physiotherapist and a current or future date first."
      );
      return;
    }

    if (
      appointments.length >=
      MAX_APPOINTMENTS
    ) {
      showError(
        "Maximum appointment count reached."
      );
      return;
    }

    const selected =
      findRegisteredTherapist(
        therapist,
        therapistOptions
      );

    if (!selected) {
      showError(
        "Select a registered physiotherapist."
      );
      return;
    }

    setEditingAppointment({
      ...emptyAppointment(),

      localId:
        newLocalId(),

      therapist:
        selected.value,

      therapist_id:
        selected.value,

      therapist_name:
        selected.label,

      date,
      appointment_date: date,

      confirmation_status:
        "unconfirmed",

      appointment_type:
        "followup",

      approval_status:
        "unknown",

      source: "manual",

      isNew: true,
      isDirty: true,
    });

    setPatientQuery("");
    setPatientMatches([]);

    clearMessages();
  };

  // ==========================================================
  // EDIT APPOINTMENT — INLINE
  // ==========================================================

  const editAppointment = (
    row
  ) => {
    if (
      busy ||
      isPastDate(date) ||
      isPastDate(
        appointmentDate(row, date)
      )
    ) {
      showError(
        "Previous-day appointments are read-only."
      );
      return;
    }

    setEditingAppointment({
      ...row,
    });

    setPatientQuery("");
    setPatientMatches([]);

    clearMessages();
  };

  // ==========================================================
  // SAVE INLINE EDITOR TO DRAFT
  // ==========================================================

  const saveEditorToDraft = () => {
    if (!editingAppointment) {
      return;
    }

    if (
      !isEditableDate(date) ||
      !isEditableDate(
        appointmentDate(
          editingAppointment,
          date
        )
      )
    ) {
      showError(
        "Past appointment schedules cannot be modified."
      );
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
      showError(
        "Select a registered physiotherapist."
      );
      return;
    }

    const updated = {
      ...applyTherapist(
        editingAppointment,
        selected
      ),

      time: getAppointmentTime(
        editingAppointment
      ),

      approval_status:
        getApproval(
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
      showError(validation);
      return;
    }

    const isSameRow = (first, second) => {
      if (
        first.localId &&
        second.localId
      ) {
        return (
          first.localId ===
          second.localId
        );
      }

      return Boolean(
        first.id &&
        second.id &&
        String(first.id) ===
          String(second.id)
      );
    };

    const otherRows =
      appointments.filter(
        (row) =>
          !isSameRow(
            row,
            updated
          )
      );

    const duplicate =
      findPatientDuplicates(
        [
          ...otherRows,
          updated,
        ],
        date
      );

    if (
      duplicate.length
    ) {
      showError(
        "This patient already has an appointment on the selected date. Review the existing appointment before adding another."
      );
      return;
    }

    if (
      !appointments.some(
        (row) =>
          isSameRow(
            row,
            updated
          )
      ) &&
      appointments.length >=
        MAX_APPOINTMENTS
    ) {
      showError(
        "Maximum appointments reached."
      );
      return;
    }

    setAppointments(
      (previous) => {
        const exists =
          previous.some(
            (row) =>
              isSameRow(
                row,
                updated
              )
          );

        const next = exists
          ? previous.map(
              (row) =>
                isSameRow(
                  row,
                  updated
                )
                  ? updated
                  : row
            )
          : [
              ...previous,
              updated,
            ];

        return sortAppointments(
          next
        );
      }
    );

    setHasDraft(true);
    setEditingAppointment(null);

    setPatientQuery("");
    setPatientMatches([]);

    setError("");
    setSuccess(
      "Appointment added to the working draft."
    );
  };

  // ==========================================================
  // REMOVE UNSAVED APPOINTMENT
  // ==========================================================

  const removeDraftAppointment = (
    row
  ) => {
    if (
      busy ||
      !isEditableDate(date) ||
      !isEditableDate(
        appointmentDate(row, date)
      )
    ) {
      showError(
        "Past schedules cannot be modified."
      );
      return;
    }

    if (row.id) {
      showError(
        "Saved appointments cannot be removed from the draft. Update their status instead."
      );
      return;
    }

    if (
      !window.confirm(
        "Remove this unsaved appointment?"
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
    setSuccess(
      "Draft appointment removed."
    );
  };

  // ==========================================================
  // PATIENT SEARCH — INLINE
  // ==========================================================

  const findPatient = async () => {
    const query =
      patientQuery.trim();

    if (
      query.length < 2 ||
      !editingAppointment
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
        showError(
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
    if (!editingAppointment) {
      return;
    }

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

    setPatientMatches([]);
    setPatientQuery("");
    setError("");
  };

  // ==========================================================
  // HISTORY
  // ==========================================================

  const loadHistory = async (
    options = {}
  ) => {
    const selectedDate =
      options.date || date;

    if (
      !validDate(
        selectedDate
      )
    ) {
      return {
        success: false,
        message:
          "Select a valid history date.",
      };
    }

    const requestId =
      ++historyRequestRef.current;

    setLoadingHistory(true);

    if (!options.silent) {
      setError("");
    }

    try {
      // Query every therapist for the selected date.
      // The all-physio history filter is therefore
      // not restricted by the Create Schedule therapist.

      const response = await api.get(
        `${API}list/`,
        {
          params: {
            date: selectedDate,
          },
          timeout: 30000,
        }
      );

      if (
        requestId !==
        historyRequestRef.current
      ) {
        return {
          success: false,
          message:
            "Request superseded.",
        };
      }

      const rows =
        extractRows(
          response.data
        ).map(normalizeSavedRow);

      setHistoryAppointments(rows);

      return {
        success: true,
        count: rows.length,
      };
    } catch (err) {
      if (
        requestId ===
        historyRequestRef.current
      ) {
        setError(
          `Unable to refresh history: ${errorMessage(err)}`
        );
      }

      return {
        success: false,
        message:
          errorMessage(err),
      };
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
        ).map(
          normalizeSavedRow
        )
      );

      return {
        success: true,
      };
    } catch (err) {
      setAlertsError(
        errorMessage(err)
      );

      // Do not erase existing alerts
      // because a refresh failed.

      return {
        success: false,
        message:
          errorMessage(err),
      };
    } finally {
      setLoadingAlerts(false);
    }
  };

  // ==========================================================
  // SAVE APPOINTMENTS TO DJANGO
  // ==========================================================

  const saveAppointments = async ({
    skipConfirmation = false,
  } = {}) => {
    if (
      saveInProgressRef.current
    ) {
      return {
        success: false,
        message:
          "A save is already in progress.",
      };
    }

    if (
      !isEditableDate(date)
    ) {
      const message =
        "Past schedules cannot be saved or modified.";

      showError(message);

      return {
        success: false,
        message,
      };
    }

    if (
      hasPastAppointments
    ) {
      const message =
        "One or more appointments belong to previous dates and cannot be modified.";

      showError(message);

      return {
        success: false,
        message,
      };
    }

    const changed =
      appointments.filter(
        (row) =>
          row.isNew ||
          row.isDirty
      );

    if (!changed.length) {
      return {
        success: false,
        message:
          "There are no changes to save.",
      };
    }

    if (
      duplicateAppointments.length
    ) {
      const message =
        `${duplicateAppointments.length} duplicate patient appointment(s) detected. Resolve them before saving.`;

      showError(message);

      return {
        success: false,
        message,
      };
    }

    for (const row of changed) {
      const rowDate = appointmentDate(
        row,
        date
      );

      if (
        !isEditableDate(rowDate)
      ) {
        const message =
          `${row.patient_name || "Appointment"} has a past or invalid date.`;

        showError(message);

        return {
          success: false,
          message,
        };
      }

      const selected =
        findRegisteredTherapist(
          getTherapistId(row),
          therapistOptions
        );

      if (!selected) {
        const message =
          `${row.patient_name || "Appointment"}: Select a registered physiotherapist.`;

        showError(message);

        return {
          success: false,
          message,
        };
      }

      const issue =
        validateAppointment(
          row
        );

      if (issue) {
        const message =
          `${row.patient_name || "Appointment"}: ${issue}`;

        showError(message);

        return {
          success: false,
          message,
        };
      }
    }

    if (
      !skipConfirmation &&
      !window.confirm(
        `Save ${changed.length} appointment(s) to Django?`
      )
    ) {
      return {
        success: false,
        message:
          "Saving cancelled.",
      };
    }

    saveInProgressRef.current = true;

    setSaving(true);
    clearMessages();

    const saved = [];
    let completed = 0;

    try {
      for (const row of changed) {
        // Recheck immediately before each write,
        // including changes that cross midnight.

        const rowDate = appointmentDate(
          row,
          date
        );

        if (
          !isEditableDate(date) ||
          !isEditableDate(rowDate)
        ) {
          throw new Error(
            "The appointment date has become historical. Further updates have been stopped."
          );
        }

        const selected =
          findRegisteredTherapist(
            getTherapistId(row),
            therapistOptions
          );

        if (!selected) {
          throw new Error(
            "A registered physiotherapist could not be resolved."
          );
        }

        const normalizedRow =
          applyTherapist(
            row,
            selected
          );

        const payload =
          payloadForAppointment(
            normalizedRow,
            selected.value,
            rowDate
          );

        payload.therapist =
          selected.value;

        // Claims Approval belongs to the Claims
        // system and must not be overwritten by
        // scheduling requests.
        //
        // This removes approval fields from both
        // POST and PATCH payloads.

        delete payload.approval_status;
        delete payload.claim_approval_status;
        delete payload.insurance_approval_status;

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
          originalId: row.id,
          id:
            response.data?.appointment?.id ??
            response.data?.id ??
            row.id,
        });

        completed += 1;
      }

      setHasDraft(false);
      setLoadedSchedule(true);

      setSuccess(
        `${completed} appointment(s) saved successfully.`
      );

      // Do not reload saved records into the
      // working draft here. The completion
      // callback handles history refresh
      // and clearing.

      return {
        success: true,
        savedCount: completed,
      };
    } catch (err) {
      // A partial save must never cause the
      // already-saved records to be POSTed again.

      if (saved.length) {
        setAppointments(
          (previous) =>
            previous.map((row) => {
              const match =
                saved.find(
                  (item) =>
                    (
                      item.localId &&
                      row.localId ===
                        item.localId
                    ) ||
                    (
                      item.originalId &&
                      row.id ===
                        item.originalId
                    )
                );

              if (!match) {
                return row;
              }

              return {
                ...row,
                id: match.id,
                isNew: false,
                isDirty: false,
              };
            })
        );
      }

      setHasDraft(true);

      const message =
        `${completed}/${changed.length} appointment(s) saved. ` +
        errorMessage(err) +
        " Review Scheduled History before retrying.";

      showError(message);

      return {
        success: false,
        savedCount: completed,
        message,
        partial: completed > 0,
      };
    } finally {
      setSaving(false);
      saveInProgressRef.current = false;
    }
  };

  // ==========================================================
  // SUCCESSFUL SAVE COMPLETION
  // ==========================================================

  const handleSaveSuccess = async (
    result
  ) => {
    if (
      result !== true &&
      result?.success !== true
    ) {
      return {
        success: false,
      };
    }

    // Invalidate any old Create Schedule
    // loading request before clearing.

    requestRef.current += 1;

    setAppointments([]);
    setImportPreview([]);
    setImportWarnings([]);
    setImportSkipped(0);

    setEditingAppointment(null);
    setPatientMatches([]);
    setPatientQuery("");

    setHasDraft(false);
    setLoadedSchedule(false);

    clearExcel();

    setSuccess(
      `${result?.savedCount ?? "All"} appointment(s) saved. The working table has been cleared.`
    );

    // History refresh is separate from saving.
    // A history refresh failure must not turn a
    // successful Django write into a failed save
    // that could be retried accidentally.

    const historyResult =
      await loadHistory({
        silent: true,
      });

    if (
      historyResult?.success === false
    ) {
      setError(
        "Appointments were saved successfully, but Scheduled History could not be refreshed. Use Refresh History to reload them."
      );
    }

    // Alerts are supplementary and may fail
    // independently of the save operation.

    await loadAlerts();

    return {
      success: true,
    };
  };

  // ==========================================================
  // AUTOMATIC HISTORY LOAD
  // ==========================================================

  useEffect(() => {
    if (
      activeTab !== "history"
    ) {
      return;
    }

    if (
      validDate(date)
    ) {
      loadHistory();
    }

    loadAlerts();
  }, [
    activeTab,
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
      // Retain history provided with row.
    }
  };

  // ==========================================================
  // RECORD CALL ATTEMPT
  // ==========================================================

  const recordCallAttempt = async (
    row
  ) => {
    if (!row.id) {
      showError(
        "Save the appointment first."
      );
      return;
    }

    if (
      isPastDate(
        appointmentDate(row)
      )
    ) {
      showError(
        "Previous-day appointments are read-only."
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
      showError(
        errorMessage(err)
      );
    }
  };

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const handleTabChange = (
    nextTab
  ) => {
    if (busy) return;

    setActiveTab(nextTab);
    clearMessages();
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
            Import schedules, manage
            appointments and review
            patient communications.
          </p>
        </div>

        <span className="csu-hero-icon">
          📅
        </span>
      </header>

      {/* NAVIGATION */}

      <div className="csu-tabs">
        <button
          type="button"
          className={
            activeTab === "create"
              ? "active"
              : ""
          }
          onClick={() =>
            handleTabChange(
              "create"
            )
          }
        >
          Create Schedule
        </button>

        <button
          type="button"
          className={
            activeTab === "history"
              ? "active"
              : ""
          }
          onClick={() =>
            handleTabChange(
              "history"
            )
          }
        >
          Scheduled History
        </button>
      </div>

      {/* MESSAGES */}

      {error && (
        <div
          className="csu-alert error"
          role="alert"
        >
          {error}
        </div>
      )}

      {success && (
        <div className="csu-alert success">
          {success}
        </div>
      )}

      {/* SCHEDULE FILTERS */}

      <ScheduleFilters
        activeTab={activeTab}
        therapist={therapist}
        therapistOptions={
          therapistOptions
        }
        loadingTherapists={
          loadingTherapists
        }
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
        loadingHistory={
          loadingHistory
        }
        onLoadSchedule={
          loadSchedule
        }
        onLoadHistory={
          loadHistory
        }
        autoLoadSchedule={true}
        hasDraft={hasDraft}
        historyFilter={
          historyFilter
        }
        onHistoryFilterChange={
          setHistoryFilter
        }
        historyQuery={
          historyQuery
        }
        onHistoryQueryChange={
          setHistoryQuery
        }
        historyMonth={
          historyMonth
        }
        onHistoryMonthChange={
          setHistoryMonth
        }
        historyTherapist={
          historyTherapist
        }
        onHistoryTherapistChange={
          setHistoryTherapist
        }
      />

      {/* CREATE SCHEDULE */}

      {activeTab === "create" && (
        <>
          {/* PAST DATE WARNING */}

          {scheduleLocked && (
            <div className="csu-lock-banner">
              <span>🔒</span>

              <div>
                <strong>
                  Historical Schedule — Read Only
                </strong>

                <p>
                  Previous-day schedules
                  cannot be modified.
                  Review historical appointments
                  in Scheduled History.
                </p>
              </div>
            </div>
          )}

          {/* EXCEL UPLOAD */}

          <div
            className={
              scheduleLocked
                ? "csu-disabled-section"
                : ""
            }
          >
            <ScheduleUpload
              excelFile={excelFile}
              workbookSheets={
                workbookSheets
              }
              selectedSheet={
                selectedSheet
              }
              sheetRows={
                sheetRows
              }
              headerRowIndex={
                headerRowIndex
              }
              headers={headers}
              columnMapping={
                columnMapping
              }
              importing={importing}
              busy={
                busy ||
                scheduleLocked
              }
              therapist={therapist}
              fileInputRef={
                fileInputRef
              }
              handleExcelFile={
                handleExcelFile
              }
              clearExcel={clearExcel}
              changeSheet={(name) => {
                if (
                  workbookRef.current &&
                  !scheduleLocked
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
          </div>

          {/* EXCEL PREVIEW */}

          <SchedulePreview
            importPreview={
              importPreview
            }
            importSkipped={
              importSkipped
            }
            importWarnings={
              importWarnings
            }
            therapistOptions={
              therapistOptions
            }
            busy={
              busy ||
              scheduleLocked
            }
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

          {/* INLINE MANUAL ENTRY */}

          <ManualAppointmentEntry
            row={
              editingAppointment
            }
            therapist={therapist}
            therapistOptions={
              therapistOptions
            }
            date={date}
            busy={
              busy ||
              scheduleLocked
            }
            saving={saving}
            onStartNew={
              addAppointment
            }
            onChange={
              setEditingAppointment
            }
            onSave={
              saveEditorToDraft
            }
            onCancel={() => {
              setEditingAppointment(null);
              setPatientQuery("");
              setPatientMatches([]);
              setError("");
            }}
            patientQuery={
              patientQuery
            }
            onPatientQueryChange={(
              value
            ) => {
              setPatientQuery(value);
              setPatientMatches([]);
            }}
            patientMatches={
              patientMatches
            }
            searchingPatients={
              searchingPatients
            }
            onSearchPatient={
              findPatient
            }
            onSelectPatient={
              selectPatient
            }
          />

          {/* APPOINTMENT TABLE */}

          <ScheduleTable
            appointments={
              sortedAppointments
            }
            date={date}
            therapistOptions={
              therapistOptions
            }
            busy={busy}
            saving={saving}
            changedCount={
              changedCount
            }
            loadedSchedule={
              loadedSchedule
            }
            saveAppointments={
              saveAppointments
            }
            editAppointment={
              editAppointment
            }
            openDetails={
              openDetails
            }
            removeDraftAppointment={
              removeDraftAppointment
            }
            onSaveSuccess={
              handleSaveSuccess
            }
            onViewHistory={() => {
              setActiveTab(
                "history"
              );
              clearMessages();
            }}
          />
        </>
      )}

      {/* SCHEDULED HISTORY */}

      {activeTab === "history" && (
        <>
          {historyMonth && (
            <div className="csu-history-scope">
              <strong>
                Month filter: {historyMonth}
              </strong>

              <span>
                Showing matching records
                returned for the selected
                schedule date. Full-month
                results require a date-range
                history API.
              </span>
            </div>
          )}

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
        </>
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
                  setDetailsAppointment(
                    null
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="csu-detail-grid">
              {[
                [
                  "Patient",
                  detailsAppointment.patient_name ||
                    "—",
                ],
                [
                  "File Number",
                  detailsAppointment.file_number ||
                    "—",
                ],
                [
                  "Therapist",
                  detailsAppointment.therapist_name ||
                    therapistName ||
                    "—",
                ],
                [
                  "Date",
                  appointmentDate(
                    detailsAppointment,
                    date
                  ),
                ],
                [
                  "Time",
                  getAppointmentTime(
                    detailsAppointment
                  ) || "—",
                ],
                [
                  "Status",
                  statusLabel(
                    detailsAppointment.confirmation_status
                  ),
                ],
                [
                  "Type",
                  detailsAppointment.appointment_type ||
                    "—",
                ],
                [
                  "Claims Approval",
                  approvalLabel(
                    detailsAppointment
                  ),
                ],
                [
                  "Notes",
                  detailsAppointment.notes ||
                    "—",
                ],
              ].map(
                ([
                  detailLabel,
                  value,
                ]) => (
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
                      key={
                        event.id ||
                        index
                      }
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
              {activeTab === "create" &&
                !busy &&
                !scheduleLocked &&
                !isPastDate(
                  appointmentDate(
                    detailsAppointment,
                    date
                  )
                ) && (
                  <button
                    type="button"
                    className="csu-primary"
                    onClick={() => {
                      editAppointment(
                        detailsAppointment
                      );

                      setDetailsAppointment(
                        null
                      );
                    }}
                  >
                    Edit Appointment
                  </button>
                )}

              <button
                type="button"
                className="csu-secondary"
                onClick={() =>
                  setDetailsAppointment(
                    null
                  )
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
  font-family: Inter, system-ui,
    -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
}

.csu-root * {
  box-sizing: border-box;
}

.csu-root button {
  cursor: pointer;
  font-family: inherit;
}

.csu-root button:disabled {
  opacity: .5;
  cursor: not-allowed;
}

/* HERO */

.csu-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 27px;
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
  font-weight: 850;
}

.csu-hero p {
  color: #dbeafe;
  font-size: 13px;
  margin: 0;
  line-height: 1.6;
}

.csu-hero small {
  color: #dceaff;
  font-weight: 800;
  letter-spacing: 1px;
}

.csu-hero-icon {
  font-size: 43px;
}

/* TABS */

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
  color: #2457d8;
  border-bottom-color: #2457d8;
}

/* MESSAGES */

.csu-alert {
  padding: 14px 16px;
  margin-bottom: 16px;
  border-radius: 11px;
  font-size: 13px;
  line-height: 1.6;
}

.csu-alert.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.csu-alert.success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

/* GENERAL PANELS */

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

.csu-form-grid,
.csu-mapping-grid {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 14px;
}

.csu-form-grid label,
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

/* Only style legacy CSU fields.
   Do not override custom filters,
   calendar or inline form controls. */

.csu-root .csu-panel input,
.csu-root .csu-panel select,
.csu-root .csu-panel textarea {
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

/* BUTTONS */

.csu-primary,
.csu-secondary {
  padding: 11px 16px;
  border-radius: 10px;
  font-size: 12px !important;
  font-weight: 800 !important;
  white-space: nowrap;
}

.csu-primary {
  background: #2563eb;
  color: white;
  border: 1px solid #2563eb;
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

/* EXCEL UPLOAD */

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

/* MAPPING */

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

/* PREVIEW */

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

/* STATISTICS */

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

/* TABLES */

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

/* WARNINGS */

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

.csu-lock-banner {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  padding: 16px;
  margin-bottom: 18px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  background: #f1f5f9;
}

.csu-lock-banner > span {
  font-size: 22px;
}

.csu-lock-banner strong {
  color: #334155;
  font-size: 13px;
  font-weight: 850;
}

.csu-lock-banner p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.6;
}

.csu-disabled-section {
  opacity: .65;
}

.csu-history-scope {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 15px;
  margin-bottom: 15px;
  border: 1px solid #dbeafe;
  border-radius: 11px;
  background: #eff6ff;
}

.csu-history-scope strong {
  color: #1d4ed8;
  font-size: 12px;
}

.csu-history-scope span {
  color: #64748b;
  font-size: 11px;
}

/* COUNTS */

.csu-count {
  padding: 7px 11px;
  border-radius: 20px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
}

/* CALL ALERTS */

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

/* DETAILS MODAL ONLY */

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

/* DETAILS */

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
  overflow-wrap: anywhere;
}

/* AUDIT TIMELINE */

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

/* TIME */

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

/* APPROVAL */

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

/* RESPONSIVE */

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

  .csu-detail-grid,
  .csu-mapping-grid {
    grid-template-columns: 1fr;
  }

  .csu-alert-item {
    flex-direction: column;
    align-items: stretch;
  }

  .csu-modal {
    padding: 18px;
  }
}
`;


import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
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
const MONTH_REQUEST_BATCH_SIZE = 5;

// Must match your actual PatientDetails route.
const PATIENT_FILE_ROUTE = "/patients";

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
    parts.map((part) => [part.type, part.value])
  );

  return [
    values.year,
    values.month,
    values.day,
  ].join("-");
}

function appointmentDate(row, fallback = "") {
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

function validMonth(value) {
  if (!/^\d{4}-\d{2}$/.test(value || "")) {
    return false;
  }

  const [year, month] = value
    .split("-")
    .map(Number);

  return (
    year >= 1900 &&
    year <= 9999 &&
    month >= 1 &&
    month <= 12
  );
}

function getMonthDates(monthValue) {
  if (!validMonth(monthValue)) {
    return [];
  }

  const [year, month] = monthValue
    .split("-")
    .map(Number);

  const numberOfDays = new Date(
    Date.UTC(year, month, 0)
  ).getUTCDate();

  return Array.from(
    { length: numberOfDays },
    (_, index) =>
      `${year}-${String(month).padStart(2, "0")}-${String(
        index + 1
      ).padStart(2, "0")}`
  );
}

function formatDisplayDate(value) {
  if (!validDate(value)) {
    return value || "—";
  }

  const [year, month, day] = value
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
    .replace(/[\u0300-\u036f]/g, "")
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

  if (exact.length === 1) return exact[0];
  if (exact.length > 1) return null;

  const partial = options.filter((option) => {
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
  });

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
    row?.time ?? row?.appointment_time
  );

  return validTime(parsed) ? parsed : "";
}

function sortAppointments(rows = []) {
  return [...rows].sort((a, b) => {
    const dateA = appointmentDate(a);
    const dateB = appointmentDate(b);

    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }

    return (
      getAppointmentTime(a) || "99:99"
    ).localeCompare(
      getAppointmentTime(b) || "99:99"
    );
  });
}

function getApproval(row) {
  const value =
    row?.claim_approval_status ??
    row?.insurance_approval_status ??
    row?.approval_status;

  if (!hasValue(value)) {
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

    // Preserve the real patient database ID.
    patient_id:
      row?.patient_id ??
      (
        typeof row?.patient === "object"
          ? row.patient?.id
          : row?.patient
      ) ??
      normalized.patient_id ??
      null,

    localId:
      normalized.localId ||
      (
        normalized.id
          ? `saved-${normalized.id}`
          : newLocalId()
      ),

    approval_status: getApproval(row),

    isNew: false,
    isDirty: false,
  };
}

function normalizeImportedRow(
  row,
  therapistOptions,
  selectedDate
) {
  const matched = resolveTherapist(
    row,
    therapistOptions
  );

  const dateValue = appointmentDate(
    row,
    selectedDate
  );

  const base = {
    ...row,

    localId: row.localId || newLocalId(),

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

    source: row.source || "excel",

    excel_therapist_name:
      row.excel_therapist_name ||
      row.import_therapist ||
      row.therapist_name ||
      "",

    isNew: true,
    isDirty: true,
  };

  return applyTherapist(base, matched);
}

// ============================================================
// PATIENT FILE HELPERS
// ============================================================

// The PatientDetails page expects the database
// patient ID in its route parameter.
//
// Do not substitute the hospital file number,
// appointment ID or medical record number.

function getPatientDatabaseId(row) {
  const patient =
    row?.patient ??
    row?.patient_record ??
    null;

  const candidate =
    row?.patient_id ??
    row?.patient_pk ??
    (
      patient &&
      typeof patient === "object"
        ? patient.id ?? patient.pk
        : patient
    );

  if (
    candidate &&
    typeof candidate === "object"
  ) {
    return normalizeId(
      candidate.id ?? candidate.pk
    );
  }

  return normalizeId(candidate);
}

// ============================================================
// DUPLICATE DETECTION
// ============================================================

function patientDuplicateKey(
  row,
  fallbackDate = ""
) {
  const patientId = getPatientDatabaseId(row);

  const name = normalizeName(
    row.patient_name
  );

  const dateValue = appointmentDate(
    row,
    fallbackDate
  );

  if (
    !dateValue ||
    (!patientId && !name)
  ) {
    return "";
  }

  return `${dateValue}::${
    patientId
      ? `id:${patientId}`
      : `name:${name}`
  }`;
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

function sameAppointment(a, b) {
  if (a?.id && b?.id) {
    return String(a.id) === String(b.id);
  }

  return Boolean(
    a?.localId &&
    b?.localId &&
    a.localId === b.localId
  );
}

// ============================================================
// HISTORY DEDUPLICATION
// ============================================================

function deduplicateHistory(rows = []) {
  const seen = new Set();

  return rows.filter((row, index) => {
    const key = row.id
      ? `id:${row.id}`
      : [
          appointmentDate(row),
          getTherapistId(row),
          row.file_number ||
            normalizeName(row.patient_name),
          getAppointmentTime(row),
          index,
        ].join("|");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
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
  const navigate = useNavigate();

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const [activeTab, setActiveTab] =
    useState("create");

  // ==========================================================
  // CREATE SCHEDULE FILTERS
  // ==========================================================

  const [therapist, setTherapist] =
    useState("");

  const [date, setDate] =
    useState(getHospitalToday);

  const [
    backendTherapists,
    setBackendTherapists,
  ] = useState([]);

  // ==========================================================
  // HISTORY FILTERS
  // ==========================================================

  const [historyMode, setHistoryMode] =
    useState("day");

  const [historyDate, setHistoryDate] =
    useState(getHospitalToday);

  const [historyMonth, setHistoryMonth] =
    useState(() =>
      getHospitalToday().slice(0, 7)
    );

  const [
    historyTherapist,
    setHistoryTherapist,
  ] = useState("all");

  const [
    historyFilter,
    setHistoryFilter,
  ] = useState("all");

  const [
    historyQuery,
    setHistoryQuery,
  ] = useState("");

  // ==========================================================
  // APPOINTMENTS
  // ==========================================================

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

  // ==========================================================
  // EXCEL STATE
  // ==========================================================

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

  // ==========================================================
  // LOADING
  // ==========================================================

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

  // ==========================================================
  // MESSAGES
  // ==========================================================

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [
    alertsError,
    setAlertsError,
  ] = useState("");

  // ==========================================================
  // WORKSPACE
  // ==========================================================

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

  // ==========================================================
  // PATIENT SEARCH
  // ==========================================================

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

  // ==========================================================
  // REFS
  // ==========================================================

  const fileInputRef = useRef(null);
  const workbookRef = useRef(null);

  const requestRef = useRef(0);
  const historyRequestRef = useRef(0);
  const patientRequestRef = useRef(0);
  const detailsRequestRef = useRef(0);

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
      ...normalizeTherapists(therapists),
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

  // ==========================================================
  // DATE LOCK
  // ==========================================================

  const scheduleIsPast =
    isPastDate(date);

  const hasPastAppointments =
    appointments.some((row) =>
      isPastDate(
        appointmentDate(row, date)
      )
    );

  const scheduleLocked =
    scheduleIsPast ||
    hasPastAppointments;

  // ==========================================================
  // APPOINTMENT COUNTS
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

  // ==========================================================
  // ALERT FILTER
  // ==========================================================

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
  // OPEN PATIENT FILE
  // ==========================================================

  const openPatientFile = useCallback(
    (row) => {
      const patientId =
        getPatientDatabaseId(row);

      if (!patientId) {
        setError(
          "This appointment is not linked to a registered patient database ID. The hospital file number cannot be used as the patient database ID."
        );

        setSuccess("");
        return;
      }

      // Navigate to the existing PatientDetails
      // route. PatientDetails uses useParams()
      // to obtain the patient database ID.

      navigate(
        `${PATIENT_FILE_ROUTE}/${encodeURIComponent(
          patientId
        )}`
      );
    },
    [navigate]
  );

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
  // SYNC IMPORTED THERAPISTS
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

          if (!matched) return row;

          if (
            getTherapistId(row) ===
              normalizeId(matched.value) &&
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
  // RESET CREATE WORKSPACE
  // ==========================================================

  const resetWorkspace = () => {
    requestRef.current += 1;
    patientRequestRef.current += 1;

    setAppointments([]);
    setHasDraft(false);
    setLoadedSchedule(false);

    setEditingAppointment(null);

    setPatientQuery("");
    setPatientMatches([]);
    setSearchingPatients(false);

    clearExcel();
    clearMessages();
  };

  // ==========================================================
  // CHANGE CREATE SCHEDULE CONTEXT
  // ==========================================================

  const changeContext = (field, value) => {
    if (busy) return;

    if (
      field === "date" &&
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
    }

    if (field === "date") {
      setDate(value);
    }
  };

  // ==========================================================
  // LOAD CREATE SCHEDULE
  // ==========================================================

  const loadSchedule = async () => {
    if (
      !therapist ||
      !validDate(date)
    ) {
      showError(
        "Select a physiotherapist and valid date."
      );

      return {
        success: false,
      };
    }

    if (!isEditableDate(date)) {
      showError(
        "Historical schedules are read-only."
      );

      return {
        success: false,
      };
    }

    if (hasDraft) {
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
        requestId !== requestRef.current
      ) {
        return {
          success: false,
        };
      }

      const rows = extractRows(
        response.data
      );

      setAppointments(
        rows.map(normalizeSavedRow)
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
        requestId === requestRef.current
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
        requestId === requestRef.current
      ) {
        setLoading(false);
      }
    }
  };

  // ==========================================================
  // LOAD EXCEL WORKSHEET
  // ==========================================================

  const loadSheet = (workbook, name) => {
    const sheet =
      workbook.Sheets[name];

    if (!sheet) return;

    const rows = XLSX.utils.sheet_to_json(
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
        Number.isInteger(
          detected?.index
        )
      ) {
        index = detected.index;
      }
    } catch {
      // Use general header detection.
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

    if (!isEditableDate(date)) {
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

      workbookRef.current = workbook;

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
        "Unable to read Excel."
      );
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  // ==========================================================
  // COLUMN MAPPING
  // ==========================================================

  const changeHeaderRow = (value) => {
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
    setColumnMapping((previous) =>
      previous.map((value, i) =>
        i === index
          ? field
          : field && value === field
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

    const imported = Array.isArray(result)
      ? result
      : result?.appointments ||
        result?.rows ||
        [];

    const warnings = Array.isArray(
      result?.warnings
    )
      ? result.warnings
      : [];

    const skipped = Number(
      result?.skipped || 0
    );

    if (
      imported.length > MAX_APPOINTMENTS
    ) {
      showError(
        `Maximum ${MAX_APPOINTMENTS} appointments allowed.`
      );

      return;
    }

    const normalized = imported.map(
      (row) =>
        normalizeImportedRow(
          row,
          therapistOptions,
          date
        )
    );

    const invalidDate = normalized.find(
      (row) =>
        !isEditableDate(
          appointmentDate(row, date)
        )
    );

    if (invalidDate) {
      showError(
        "The Excel file contains an appointment with a past or invalid date."
      );

      return;
    }

    const duplicates =
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

    if (duplicates.length) {
      extraWarnings.push(
        `${duplicates.length} possible duplicate appointment(s). Review them before importing.`
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

    setSuccess(
      `${normalized.length} appointment(s) extracted for review.` +
      (
        skipped
          ? ` ${skipped} row(s) skipped by the parser.`
          : ""
      )
    );
  };

  // ==========================================================
  // UPDATE EXCEL PREVIEW
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

    setImportPreview((previous) =>
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
            return {
              ...row,
              time:
                parseExcelTime(value) ||
                value,
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

  const removeImportPreviewRow = (
    localId
  ) => {
    if (
      busy ||
      !isEditableDate(date)
    ) {
      return;
    }

    setImportPreview((previous) =>
      previous.filter(
        (row) =>
          row.localId !== localId
      )
    );
  };

  // ==========================================================
  // ADD PREVIEW TO DRAFT
  // ==========================================================

  const addPreviewToDraft = () => {
    clearMessages();

    if (!isEditableDate(date)) {
      showError(
        "Past schedules cannot be changed."
      );

      return;
    }

    if (!importPreview.length) {
      showError(
        "No appointments available to import."
      );

      return;
    }

    const prepared = importPreview.map(
      (row) =>
        applyTherapist(
          row,
          resolveTherapist(
            row,
            therapistOptions
          )
        )
    );

    const unassigned = prepared.filter(
      (row) =>
        !findRegisteredTherapist(
          getTherapistId(row),
          therapistOptions
        )
    );

    if (unassigned.length) {
      showError(
        `${unassigned.length} appointment(s) require a registered physiotherapist.`
      );

      return;
    }

    const invalidTime = prepared.find(
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

    const invalidDate = prepared.find(
      (row) =>
        !isEditableDate(
          appointmentDate(row, date)
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

    if (duplicates.length) {
      showError(
        `${duplicates.length} duplicate appointment(s) detected. Resolve them before importing.`
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

    setAppointments((previous) =>
      sortAppointments([
        ...previous,
        ...prepared.map((row) => ({
          ...row,
          isNew: true,
          isDirty: true,
        })),
      ])
    );

    setHasDraft(true);
    setImportPreview([]);

    setSuccess(
      `${prepared.length} appointment(s) added to draft.`
    );
  };

  // ==========================================================
  // MANUAL APPOINTMENT
  // ==========================================================

  const addAppointment = () => {
    if (
      !therapist ||
      !isEditableDate(date)
    ) {
      showError(
        "Select a physiotherapist and current or future date."
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

      localId: newLocalId(),

      therapist: selected.value,
      therapist_id: selected.value,
      therapist_name: selected.label,

      date,
      appointment_date: date,

      confirmation_status:
        "confirmed",

      appointment_type:
        "followup",

      // Claims approval must be determined
      // by the Claims system.
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
  // EDIT APPOINTMENT
  // ==========================================================

  const editAppointment = (row) => {
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
        "Past appointments cannot be modified."
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
        getApproval(editingAppointment),

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

    const otherRows =
      appointments.filter(
        (row) =>
          !sameAppointment(
            row,
            updated
          )
      );

    const duplicates =
      findPatientDuplicates(
        [
          ...otherRows,
          updated,
        ],
        date
      );

    if (duplicates.length) {
      showError(
        "This patient already has an appointment on the selected date."
      );

      return;
    }

    const exists =
      appointments.some(
        (row) =>
          sameAppointment(
            row,
            updated
          )
      );

    if (
      !exists &&
      appointments.length >=
        MAX_APPOINTMENTS
    ) {
      showError(
        "Maximum appointments reached."
      );

      return;
    }

    setAppointments((previous) => {
      const alreadyExists =
        previous.some(
          (row) =>
            sameAppointment(
              row,
              updated
            )
        );

      const next = alreadyExists
        ? previous.map((row) =>
            sameAppointment(
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

      return sortAppointments(next);
    });

    setHasDraft(true);
    setEditingAppointment(null);

    setPatientQuery("");
    setPatientMatches([]);

    setError("");
    setSuccess(
      "Appointment added to working draft."
    );
  };

  // ==========================================================
  // REMOVE DRAFT APPOINTMENT
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
        "Saved appointments cannot be removed. Update their status instead."
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

    setAppointments((previous) =>
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
  // PATIENT SEARCH
  // ==========================================================

  const findPatient = async () => {
    const query = patientQuery.trim();

    if (
      query.length < 2 ||
      !editingAppointment
    ) {
      return;
    }

    const requestId =
      ++patientRequestRef.current;

    setSearchingPatients(true);
    setError("");

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
        const matches =
          response.data?.matches ??
          extractRows(
            response.data
          );

        setPatientMatches(
          Array.isArray(matches)
            ? matches
            : []
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

  const selectPatient = (patient) => {
    if (!editingAppointment) {
      return;
    }

    const patientId =
      patient?.id ??
      patient?.pk ??
      null;

    if (!hasValue(patientId)) {
      showError(
        "The selected patient does not have a valid database ID."
      );

      return;
    }

    setEditingAppointment((previous) =>
      previous
        ? {
            ...previous,

            patient_id: patientId,

            patient_name:
              patient.name ||
              patient.patient_name ||
              "",

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
  // HISTORY API — SINGLE DAY
  // ==========================================================

  const fetchHistoryDay = useCallback(
    async (day) => {
      const response = await api.get(
        `${API}list/`,
        {
          params: {
            date: day,
          },
          timeout: 30000,
        }
      );

      return extractRows(
        response.data
      ).map((row) => {
        const normalized =
          normalizeSavedRow(row);

        return {
          ...normalized,

          date: appointmentDate(
            normalized,
            day
          ),

          appointment_date:
            appointmentDate(
              normalized,
              day
            ),
        };
      });
    },
    []
  );

  // ==========================================================
  // LOAD DAY OR COMPLETE MONTH HISTORY
  // ==========================================================

  const loadHistory = useCallback(
    async (options = {}) => {
      const mode =
        options.mode ||
        historyMode;

      const targetDate =
        options.date ||
        historyDate;

      const targetMonth =
        options.month ||
        historyMonth ||
        targetDate.slice(0, 7);

      const dates =
        mode === "month"
          ? getMonthDates(
              targetMonth
            )
          : validDate(
              targetDate
            )
          ? [targetDate]
          : [];

      if (!dates.length) {
        return {
          success: false,
          message:
            "Select a valid history date or month.",
        };
      }

      const requestId =
        ++historyRequestRef.current;

      setLoadingHistory(true);

      if (!options.silent) {
        setError("");
      }

      setHistoryAppointments([]);

      try {
        const combined = [];

        // The existing backend supports
        // fetching history by date.
        //
        // Retrieve all days in batches
        // for a complete monthly view.

        for (
          let i = 0;
          i < dates.length;
          i += MONTH_REQUEST_BATCH_SIZE
        ) {
          const batch =
            dates.slice(
              i,
              i + MONTH_REQUEST_BATCH_SIZE
            );

          const results =
            await Promise.all(
              batch.map(
                fetchHistoryDay
              )
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

          results.forEach(
            (rows) => {
              combined.push(
                ...rows
              );
            }
          );
        }

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

        const unique =
          deduplicateHistory(
            combined
          );

        setHistoryAppointments(
          unique
        );

        return {
          success: true,
          count: unique.length,
        };
      } catch (err) {
        if (
          requestId ===
          historyRequestRef.current
        ) {
          setHistoryAppointments([]);

          setError(
            `Unable to load complete history: ${errorMessage(err)}`
          );
        }

        return {
          success: false,
          message: errorMessage(err),
        };
      } finally {
        if (
          requestId ===
          historyRequestRef.current
        ) {
          setLoadingHistory(false);
        }
      }
    },
    [
      historyMode,
      historyDate,
      historyMonth,
      fetchHistoryDay,
    ]
  );

  // ==========================================================
  // HISTORY FILTER HANDLERS
  // ==========================================================

  const changeHistoryMode = (mode) => {
    if (
      mode !== "day" &&
      mode !== "month"
    ) {
      return;
    }

    setHistoryMode(mode);
    setHistoryFilter("all");

    if (
      mode === "month" &&
      !validMonth(historyMonth)
    ) {
      setHistoryMonth(
        historyDate.slice(0, 7) ||
        getHospitalToday().slice(0, 7)
      );
    }
  };

  const changeHistoryDate = (
    value
  ) => {
    setHistoryDate(value);
    setHistoryFilter("all");
  };

  const changeHistoryMonth = (
    value
  ) => {
    setHistoryMonth(value);
    setHistoryFilter("all");
  };

  // ==========================================================
  // AUTOMATIC HISTORY LOADING
  // ==========================================================

  useEffect(() => {
    if (
      activeTab !== "history"
    ) {
      return;
    }

    loadHistory();

    return () => {
      historyRequestRef.current += 1;
    };
  }, [
    activeTab,
    loadHistory,
  ]);

  // ==========================================================
  // ALERTS API
  // ==========================================================

  const loadAlerts = useCallback(
    async () => {
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

        return {
          success: false,
          message:
            errorMessage(err),
        };
      } finally {
        setLoadingAlerts(false);
      }
    },
    []
  );

  // ==========================================================
  // LOAD ALERTS WHEN TAB OPENS
  // ==========================================================

  useEffect(() => {
    if (
      activeTab === "alerts"
    ) {
      loadAlerts();
    }
  }, [
    activeTab,
    loadAlerts,
  ]);

  // ==========================================================
  // SAVE APPOINTMENTS
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

    if (!isEditableDate(date)) {
      const message =
        "Past schedules cannot be saved.";

      showError(message);

      return {
        success: false,
        message,
      };
    }

    if (hasPastAppointments) {
      const message =
        "One or more appointments belong to past dates.";

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
          "No changes to save.",
      };
    }

    if (
      duplicateAppointments.length
    ) {
      const message =
        `${duplicateAppointments.length} duplicate appointment(s) detected.`;

      showError(message);

      return {
        success: false,
        message,
      };
    }

    for (const row of changed) {
      const rowDate =
        appointmentDate(
          row,
          date
        );

      if (!isEditableDate(rowDate)) {
        const message =
          `${row.patient_name || "Appointment"} has an invalid or past date.`;

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
        const rowDate =
          appointmentDate(
            row,
            date
          );

        if (
          !isEditableDate(date) ||
          !isEditableDate(rowDate)
        ) {
          throw new Error(
            "The appointment date has become historical."
          );
        }

        const selected =
          findRegisteredTherapist(
            getTherapistId(row),
            therapistOptions
          );

        if (!selected) {
          throw new Error(
            "Registered physiotherapist not found."
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

        // Claims approval is managed
        // by the Claims system only.

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

      setAppointments((previous) =>
        previous.map((row) => {
          const match = saved.find(
            (item) =>
              (
                item.localId &&
                item.localId ===
                  row.localId
              ) ||
              (
                item.originalId &&
                String(item.originalId) ===
                  String(row.id)
              )
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

      return {
        success: true,
        savedCount: completed,
      };
    } catch (err) {
      if (saved.length) {
        setAppointments((previous) =>
          previous.map((row) => {
            const match = saved.find(
              (item) =>
                (
                  item.localId &&
                  item.localId ===
                    row.localId
                ) ||
                (
                  item.originalId &&
                  String(item.originalId) ===
                    String(row.id)
                )
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
      }

      setHasDraft(true);

      const message =
        `${completed}/${changed.length} appointment(s) saved. ` +
        errorMessage(err) +
        " Review history before retrying.";

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
  // SAVE SUCCESS CALLBACK
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

    // Refresh independently so history failure
    // does not invalidate successful writes.

    const historyResult =
      await loadHistory({
        silent: true,
      });

    if (
      historyResult?.success === false
    ) {
      setError(
        "Appointments saved, but history could not be refreshed."
      );
    }

    return {
      success: true,
    };
  };

  // ==========================================================
  // APPOINTMENT DETAILS
  // ==========================================================

  const openDetails = async (row) => {
    const requestId =
      ++detailsRequestRef.current;

    setDetailsAppointment(row);

    setDetailsHistory(
      normalizeHistory(
        row.history
      )
    );

    if (!row.id) return;

    try {
      const response = await api.get(
        `${API}appointments/${row.id}/history/`
      );

      if (
        requestId ===
        detailsRequestRef.current
      ) {
        setDetailsHistory(
          normalizeHistory(
            response.data?.history ||
            response.data?.events ||
            []
          )
        );
      }
    } catch {
      // Keep row-provided audit history.
    }
  };

  const closeDetails = () => {
    detailsRequestRef.current += 1;

    setDetailsAppointment(null);
    setDetailsHistory([]);
  };

  // ==========================================================
  // RECORD CALL ATTEMPT
  // ==========================================================

  const recordCallAttempt = async (
    row
  ) => {
    if (!row.id) {
      showError(
        "Save appointment first."
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
  // TAB NAVIGATION
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

      {/* THREE TABS */}

      <nav
        className="csu-tabs"
        aria-label="Scheduling sections"
      >
        {[
          ["create", "Create Schedule"],
          ["history", "Scheduled History"],
          ["alerts", "Call Center Alerts"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={
              activeTab === value
                ? "active"
                : ""
            }
            aria-current={
              activeTab === value
                ? "page"
                : undefined
            }
            onClick={() =>
              handleTabChange(value)
            }
          >
            {label}
          </button>
        ))}
      </nav>

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
        <div
          className="csu-alert success"
          role="status"
        >
          {success}
        </div>
      )}

      {/* =====================================================
          CREATE SCHEDULE TAB
      ===================================================== */}

      {activeTab === "create" && (
        <>
          {/* CREATE SCHEDULE FILTERS ONLY */}

          <ScheduleFilters
            activeTab="create"
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
            onLoadSchedule={
              loadSchedule
            }
            autoLoadSchedule={true}
            hasDraft={hasDraft}
          />

          {/* HISTORICAL LOCK */}

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
                  Review them in
                  Scheduled History.
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
              sheetRows={sheetRows}
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

          {/* MANUAL APPOINTMENT ENTRY */}

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
              patientRequestRef.current += 1;

              setEditingAppointment(null);
              setPatientQuery("");
              setPatientMatches([]);
              setSearchingPatients(false);
              setError("");
            }}
            patientQuery={
              patientQuery
            }
            onPatientQueryChange={(value) => {
              patientRequestRef.current += 1;

              setPatientQuery(value);
              setPatientMatches([]);
              setSearchingPatients(false);
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

          {/* APPOINTMENTS TABLE */}

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
              setActiveTab("history");
              clearMessages();
            }}
          />
        </>
      )}

      {/* =====================================================
          SCHEDULED HISTORY TAB
      ===================================================== */}

      {activeTab === "history" && (
        <ScheduleHistory
          historyAppointments={
            historyAppointments
          }
          filteredHistory={
            historyAppointments
          }
          historyMode={
            historyMode
          }
          onHistoryModeChange={
            changeHistoryMode
          }
          historyDate={
            historyDate
          }
          onHistoryDateChange={
            changeHistoryDate
          }
          historyMonth={
            historyMonth
          }
          onHistoryMonthChange={
            changeHistoryMonth
          }
          historyTherapist={
            historyTherapist
          }
          setHistoryTherapist={
            setHistoryTherapist
          }
          therapistOptions={
            therapistOptions
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
            STATUS_OPTIONS
          }
          loadingHistory={
            loadingHistory
          }
          loadHistory={() =>
            loadHistory()
          }
          openDetails={
            openDetails
          }
          onOpenFile={
            openPatientFile
          }
          onOpenPatientFile={
            openPatientFile
          }
          StatusBadge={
            StatusBadge
          }
          TypeBadge={
            TypeBadge
          }
        />
      )}

      {/* =====================================================
          THIRD TAB — CALL CENTER ALERTS
      ===================================================== */}

      {activeTab === "alerts" && (
        <section className="csu-panel csu-alerts-panel">
          <div className="csu-section-header">
            <div>
              <h3>
                Internal Call Center Alerts
              </h3>

              <p className="csu-note">
                Appointments requiring
                follow-up calls.
                No SMS or WhatsApp
                messages are sent.
              </p>
            </div>

            <button
              type="button"
              className="csu-secondary"
              disabled={loadingAlerts}
              onClick={loadAlerts}
            >
              {loadingAlerts
                ? "Refreshing..."
                : "Refresh Alerts"}
            </button>
          </div>

          {/* ALERT SUMMARY */}

          <div className="csu-alert-summary">
            <div>
              <span>
                Pending Follow-ups
              </span>

              <strong>
                {followUpAlerts.length}
              </strong>
            </div>

            <div>
              <span>
                Unconfirmed
              </span>

              <strong>
                {
                  followUpAlerts.filter(
                    (row) =>
                      row.confirmation_status ===
                      "unconfirmed"
                  ).length
                }
              </strong>
            </div>

            <div>
              <span>
                Other Call Alerts
              </span>

              <strong>
                {
                  followUpAlerts.filter(
                    (row) =>
                      row.confirmation_status !==
                      "unconfirmed"
                  ).length
                }
              </strong>
            </div>
          </div>

          {alertsError && (
            <div className="csu-alert error">
              {alertsError}
            </div>
          )}

          {followUpAlerts.length === 0 ? (
            <div className="csu-empty-state">
              {loadingAlerts
                ? "Loading alerts..."
                : alertsError
                ? "Alerts could not be loaded."
                : "No pending follow-up alerts."}
            </div>
          ) : (
            <div className="csu-alert-list">
              {followUpAlerts.map((row) => {
                const rowDate =
                  appointmentDate(row);

                const locked =
                  isPastDate(rowDate);

                return (
                  <div
                    key={
                      row.id ||
                      row.localId
                    }
                    className="csu-alert-item"
                  >
                    <div className="csu-alert-patient">
                      <span className="csu-alert-avatar">
                        {String(
                          row.patient_name || "?"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </span>

                      <div>
                        <strong>
                          {row.patient_name ||
                            "Unknown Patient"}
                        </strong>

                        <p>
                          File:{" "}
                          {row.file_number ||
                            "—"}
                        </p>

                        <p>
                          {formatDisplayDate(
                            rowDate
                          )}
                          {" · "}
                          {getAppointmentTime(row) ||
                            "—"}
                        </p>

                        <p>
                          {row.therapist_name ||
                            getTherapistId(row) ||
                            "Not assigned"}
                        </p>

                        <StatusBadge
                          status={
                            row.confirmation_status
                          }
                        />

                        <small>
                          Call attempts:{" "}
                          {row.second_call_attempts ??
                            row.call_attempts ??
                            0}
                        </small>
                      </div>
                    </div>

                    <div className="csu-alert-actions">
                      <button
                        type="button"
                        className="csu-secondary"
                        onClick={() =>
                          openDetails(row)
                        }
                      >
                        View History
                      </button>

                      <button
                        type="button"
                        className="csu-secondary"
                        onClick={() =>
                          openPatientFile(row)
                        }
                      >
                        Open Patient File
                      </button>

                      <button
                        type="button"
                        className="csu-primary"
                        disabled={
                          locked ||
                          loadingAlerts
                        }
                        onClick={() =>
                          recordCallAttempt(row)
                        }
                      >
                        {locked
                          ? "Read Only"
                          : "Record Call Attempt"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* =====================================================
          APPOINTMENT DETAILS MODAL
      ===================================================== */}

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
                aria-label="Close details"
                onClick={closeDetails}
              >
                ×
              </button>
            </div>

            {/* PATIENT DETAILS */}

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
                    therapistOptions.find(
                      (item) =>
                        normalizeId(item.value) ===
                        getTherapistId(
                          detailsAppointment
                        )
                    )?.label ||
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
              ].map(([label, value]) => (
                <div key={label}>
                  <small>
                    {label}
                  </small>

                  <strong>
                    {value}
                  </strong>
                </div>
              ))}
            </div>

            {/* CHANGE HISTORY */}

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
                        event.id || index
                      }
                    >
                      <strong>
                        {event.action ||
                          "Update"}
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
                        {event.changed_by ||
                          "System"}
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

            {/* MODAL ACTIONS */}

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

                      closeDetails();
                    }}
                  >
                    Edit Appointment
                  </button>
                )}

              <button
                type="button"
                className="csu-primary"
                onClick={() =>
                  openPatientFile(
                    detailsAppointment
                  )
                }
              >
                Open Patient File
              </button>

              <button
                type="button"
                className="csu-secondary"
                onClick={closeDetails}
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

/* ==========================================================
   HERO
========================================================== */

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

/* ==========================================================
   TABS
========================================================== */

.csu-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
  border-bottom: 1px solid #e2e8f0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.csu-tabs button {
  flex-shrink: 0;
  padding: 14px 20px;
  background: transparent;
  border: 0;
  border-bottom: 3px solid transparent;
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
  white-space: nowrap;
}

.csu-tabs button.active {
  color: #2457d8;
  border-bottom-color: #2457d8;
}

/* ==========================================================
   MESSAGES
========================================================== */

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

/* ==========================================================
   GENERAL PANELS
========================================================== */

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

/* ==========================================================
   BUTTONS
========================================================== */

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

/* ==========================================================
   EXCEL UPLOAD
========================================================== */

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

/* ==========================================================
   EXCEL MAPPING
========================================================== */

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

/* ==========================================================
   EXCEL PREVIEW
========================================================== */

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

/* ==========================================================
   LEGACY STATS
========================================================== */

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

/* ==========================================================
   LEGACY TABLE STYLES
========================================================== */

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

/* ==========================================================
   STATUS AND TYPE BADGES
========================================================== */

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

/* ==========================================================
   WARNINGS AND LOCK
========================================================== */

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

/* ==========================================================
   THIRD TAB — ALERTS
========================================================== */

.csu-alerts-panel {
  padding: 0;
  overflow: hidden;
}

.csu-alerts-panel > .csu-section-header {
  margin: 0;
  padding: 21px 23px;
  background: linear-gradient(
    110deg,
    #f1f5ff,
    #ffffff
  );
  border-bottom: 1px solid #e8eef8;
}

.csu-alerts-panel .csu-note {
  margin: 5px 0 0;
}

.csu-alert-summary {
  display: grid;
  grid-template-columns:
    repeat(3,minmax(0,1fr));
  gap: 12px;
  padding: 20px 23px;
}

.csu-alert-summary > div {
  padding: 17px;
  border: 1px solid #e3eaf5;
  border-radius: 12px;
  background: #f8faff;
}

.csu-alert-summary span {
  display: block;
  color: #71839e;
  font-size: 12px;
  font-weight: 750;
}

.csu-alert-summary strong {
  display: block;
  margin-top: 8px;
  color: #1d3559;
  font-size: 27px;
  font-weight: 900;
}

.csu-alert-list {
  display: flex;
  flex-direction: column;
  gap: 11px;
  padding: 0 23px 23px;
}

.csu-alert-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 17px;
  border: 1px solid #fde68a;
  border-radius: 12px;
  background: #fffbeb;
}

.csu-alert-patient {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  min-width: 0;
}

.csu-alert-avatar {
  display: grid;
  place-items: center;
  width: 41px;
  height: 41px;
  border-radius: 11px;
  background: #fef3c7;
  color: #92400e;
  font-size: 15px;
  font-weight: 850;
  flex-shrink: 0;
}

.csu-alert-patient strong {
  display: block;
  margin-bottom: 7px;
  font-size: 13px;
  color: #233b5c;
}

.csu-alert-patient p {
  margin: 0 0 6px;
  color: #64748b;
  font-size: 12px;
}

.csu-alert-patient small {
  display: block;
  margin-top: 9px;
  color: #64748b;
  font-size: 11px;
}

.csu-alert-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  flex-shrink: 0;
}

.csu-alerts-panel > .csu-alert {
  margin: 0 23px 20px;
}

.csu-alerts-panel > .csu-empty-state {
  margin: 0 23px 23px;
}

/* ==========================================================
   DETAILS MODAL
========================================================== */

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

/* ==========================================================
   DETAILS GRID
========================================================== */

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

/* ==========================================================
   AUDIT TIMELINE
========================================================== */

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

/* ==========================================================
   PREVIEW TIME
========================================================== */

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

/* ==========================================================
   APPROVAL BADGES
========================================================== */

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

/* ==========================================================
   TABLET
========================================================== */

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

  .csu-alert-item {
    align-items: flex-start;
    flex-direction: column;
  }
}

/* ==========================================================
   MOBILE
========================================================== */

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

  .csu-alerts-panel {
    padding: 0;
  }

  .csu-alerts-panel > .csu-section-header {
    padding: 16px;
  }

  .csu-tabs {
    gap: 2px;
  }

  .csu-tabs button {
    padding: 12px 11px;
    font-size: 11px;
  }

  .csu-detail-grid,
  .csu-mapping-grid {
    grid-template-columns: 1fr;
  }

  .csu-alert-summary {
    grid-template-columns:
      repeat(2,minmax(0,1fr));
    padding: 15px;
  }

  .csu-alert-list {
    padding: 0 15px 15px;
  }

  .csu-alert-actions {
    width: 100%;
  }

  .csu-alert-actions button {
    flex: 1;
  }

  .csu-modal {
    padding: 18px;
  }
}
`;

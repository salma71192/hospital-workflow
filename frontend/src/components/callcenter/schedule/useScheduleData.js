
import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import api from "../../../api/api";

import {
  API,
  MAX_FILE_SIZE,
  MAX_APPOINTMENTS,
  ACCEPTED_EXTENSIONS,
  FOLLOW_UP_STATUSES,
  today,
  validDate,
  validTime,
  normalizeTherapists,
  normalizeHistory,
  emptyAppointment,
  normalizeAppointment,
  extractRows,
  errorMessage,
  validateAppointment,
  payloadForAppointment,
} from "./scheduleHelpers";

import {
  detectScheduleHeader,
  extractScheduleAppointments,
  matchTherapist,
  parseExcelTime,
} from "./excelImportRules";

// ============================================================
// CONSTANTS
// ============================================================

const EMPTY_EXCEL = {
  file: null,
  sheets: [],
  selectedSheet: "",
  rows: [],
  headerRowIndex: 0,
  headers: [],
  mapping: [],
  preview: [],
  warnings: [],
  skipped: 0,
  unmatchedTherapists: 0,
};

const APPROVAL_FIELDS = [
  "claim_approval_status",
  "insurance_approval_status",
  "approval_status",
];

const confirmDiscard = () =>
  window.confirm("Discard unsaved appointment changes?");

const clean = (value) => String(value ?? "").trim();

const normalizePatientName = (value) =>
  clean(value)
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();

const normalizeSaved = (rows) =>
  rows.map((row) => normalizeAppointment(row, true));

const sortByTime = (rows) =>
  [...rows].sort((a, b) => {
    const aTime =
      parseExcelTime(a.time ?? a.appointment_time) || "99:99";
    const bTime =
      parseExcelTime(b.time ?? b.appointment_time) || "99:99";

    return aTime.localeCompare(bTime);
  });

const isValidTherapist = (value) =>
  value !== null &&
  value !== undefined &&
  clean(value) !== "";

const isFollowUpStatus = (status) =>
  status === "unconfirmed" ||
  FOLLOW_UP_STATUSES.has(status);

const getTherapistId = (row) => {
  const value =
    row.therapist ??
    row.therapist_id ??
    row.physiotherapist ??
    "";

  if (value && typeof value === "object") {
    return (
      value.value ??
      value.id ??
      value.user_id ??
      ""
    );
  }

  return value;
};

const getAppointmentDate = (row, fallbackDate) =>
  row.appointment_date || row.date || fallbackDate;

const getAppointmentTime = (row) =>
  parseExcelTime(row.time ?? row.appointment_time);

const getStatus = (row) =>
  clean(
    row.confirmation_status ||
    row.status ||
    "unconfirmed"
  ).toLowerCase();

const getApproval = (row) => {
  for (const field of APPROVAL_FIELDS) {
    const value = row?.[field];

    if (
      value !== undefined &&
      value !== null &&
      clean(value) !== ""
    ) {
      return clean(value).toLowerCase();
    }
  }

  return "unknown";
};

/*
 * Preserve the actual approval value.
 *
 * A missing approval is not evidence of approval.
 * New Excel appointments can still carry the
 * approved default assigned by excelImportRules.
 */
function preserveApproval(row, responseRow = null) {
  const result = {
    ...row,
    ...(responseRow || {}),
  };

  const originalApproval = getApproval(row);
  const responseApproval = responseRow
    ? getApproval(responseRow)
    : "unknown";

  if (responseApproval !== "unknown") {
    return result;
  }

  if (originalApproval !== "unknown") {
    for (const field of APPROVAL_FIELDS) {
      if (
        responseRow?.[field] === undefined ||
        responseRow?.[field] === null ||
        clean(responseRow[field]) === ""
      ) {
        if (
          row[field] !== undefined &&
          row[field] !== null &&
          clean(row[field]) !== ""
        ) {
          result[field] = row[field];
        }
      }
    }
  }

  return result;
}

/*
 * One patient per appointment date.
 * Case, spacing and Unicode normalization
 * differences do not create new identities.
 *
 * Different dates are allowed.
 */
function patientDateKey(row, fallbackDate) {
  const name = normalizePatientName(row.patient_name);
  const appointmentDate = getAppointmentDate(
    row,
    fallbackDate
  );

  if (!name || !appointmentDate) return "";

  return `${appointmentDate}::${name}`;
}

function sameAppointment(a, b) {
  if (a.id && b.id) {
    return String(a.id) === String(b.id);
  }

  if (a.localId && b.localId) {
    return String(a.localId) === String(b.localId);
  }

  return false;
}

function findDuplicate(rows, candidate, fallbackDate) {
  const key = patientDateKey(candidate, fallbackDate);

  if (!key) return null;

  return (
    rows.find(
      (row) =>
        !sameAppointment(row, candidate) &&
        patientDateKey(row, fallbackDate) === key
    ) || null
  );
}

function deduplicateAppointments(rows, fallbackDate) {
  const seen = new Set();
  const accepted = [];
  const duplicates = [];

  for (const row of rows) {
    const key = patientDateKey(row, fallbackDate);

    if (key && seen.has(key)) {
      duplicates.push(row);
      continue;
    }

    if (key) seen.add(key);
    accepted.push(row);
  }

  return { accepted, duplicates };
}

/*
 * A rescheduled appointment requires an explicit
 * replacement date and time.
 *
 * The editor should populate:
 *   rescheduled_date: YYYY-MM-DD
 *   rescheduled_time: HH:mm
 *
 * Original date/time are retained as the
 * original booking information.
 */
function validateRescheduling(row, fallbackDate) {
  if (getStatus(row) !== "rescheduled") {
    return "";
  }

  const newDate = clean(
    row.rescheduled_date ??
    row.new_appointment_date ??
    ""
  );

  const newTime = parseExcelTime(
    row.rescheduled_time ??
    row.new_appointment_time ??
    ""
  );

  if (!validDate(newDate) || !validTime(newTime)) {
    return (
      "Rescheduled appointments require a new " +
      "appointment date and time."
    );
  }

  const originalDate = getAppointmentDate(
    row,
    fallbackDate
  );

  const originalTime = getAppointmentTime(row);

  if (
    newDate === originalDate &&
    newTime === originalTime
  ) {
    return (
      "The new date and time must differ " +
      "from the original appointment."
    );
  }

  return "";
}

function validateScheduleRow(row, fallbackDate) {
  const issue = validateAppointment(row);
  if (issue) return issue;

  const reschedulingIssue = validateRescheduling(
    row,
    fallbackDate
  );

  if (reschedulingIssue) return reschedulingIssue;

  return "";
}

/*
 * The backend must accept these rescheduling
 * fields for persistence. If its serializer uses
 * different field names, update this mapping.
 */
function buildAppointmentPayload(
  row,
  therapistId,
  appointmentDate
) {
  const payload = payloadForAppointment(
    row,
    therapistId,
    appointmentDate
  );

  if (getStatus(row) === "rescheduled") {
    payload.rescheduled_date = clean(
      row.rescheduled_date ??
      row.new_appointment_date
    );

    payload.rescheduled_time = parseExcelTime(
      row.rescheduled_time ??
      row.new_appointment_time
    );
  }

  /*
   * Do not overwrite a saved claims decision.
   * The backend remains the authority for
   * verified claims approval.
   *
   * For new records, preserve any approval
   * field already present in the appointment.
   */
  if (!row.id || row.isNew) {
    for (const field of APPROVAL_FIELDS) {
      if (
        row[field] !== undefined &&
        row[field] !== null &&
        clean(row[field]) !== ""
      ) {
        payload[field] = row[field];
      }
    }
  }

  return payload;
}

// ============================================================
// THERAPIST HELPERS
// ============================================================

function buildTherapistOptions(rawUsers = []) {
  const source = Array.isArray(rawUsers)
    ? rawUsers
    : [];

  return source
    .map((item) => {
      const user = item.user || item;

      const id =
        item.value ??
        item.id ??
        item.user_id ??
        user.id ??
        user.pk ??
        user.username ??
        "";

      const firstName =
        user.first_name ||
        item.first_name ||
        "";

      const middleName =
        user.middle_name ||
        item.middle_name ||
        "";

      const lastName =
        user.last_name ||
        item.last_name ||
        "";

      const composedName = [
        firstName,
        middleName,
        lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      const label = clean(
        item.full_name ||
        user.full_name ||
        composedName ||
        item.name ||
        user.name ||
        item.label ||
        user.username ||
        item.username ||
        ""
      );

      return {
        value: id,
        label,
        id,
        name: label,
        full_name: label,
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        username:
          user.username ||
          item.username ||
          "",
        original: item,
      };
    })
    .filter(
      (item) =>
        isValidTherapist(item.value) &&
        item.label
    );
}

function combineTherapists(
  frontendUsers = [],
  backendUsers = []
) {
  const combined = [
    ...buildTherapistOptions(frontendUsers),
    ...buildTherapistOptions(backendUsers),
    ...normalizeTherapists(frontendUsers),
    ...normalizeTherapists(backendUsers),
  ];

  const map = new Map();

  for (const item of combined) {
    const id = clean(item.value ?? item.id);
    if (!id) continue;

    const label = clean(
      item.label ||
      item.full_name ||
      item.name
    );

    if (!label) continue;

    const previous = map.get(id);

    if (!previous) {
      map.set(id, {
        ...item,
        value: item.value ?? item.id,
        label,
      });
      continue;
    }

    const previousWords = clean(previous.label)
      .split(/\s+/)
      .length;

    const currentWords = label.split(/\s+/).length;

    if (
      currentWords > previousWords ||
      (
        currentWords === previousWords &&
        label.length > previous.label.length
      )
    ) {
      map.set(id, {
        ...previous,
        ...item,
        value: item.value ?? item.id,
        label,
      });
    }
  }

  return Array.from(map.values());
}

function reconcilePreviewTherapists(
  preview = [],
  therapistOptions = [],
  selectedTherapist = ""
) {
  return preview.map((row) => {
    const currentId = getTherapistId(row);

    const existing = therapistOptions.find(
      (option) =>
        String(option.value) === String(currentId)
    );

    if (
      row.therapist_manually_assigned &&
      existing
    ) {
      return {
        ...row,
        therapist: existing.value,
        therapist_id: existing.value,
        therapist_name: existing.label,
        therapist_matched: true,
      };
    }

    const excelName =
      row.excel_therapist_name ||
      row.therapist_name ||
      "";

    const matched = matchTherapist(
      excelName,
      therapistOptions,
      selectedTherapist
    );

    if (!matched) {
      if (existing) {
        return {
          ...row,
          therapist: existing.value,
          therapist_id: existing.value,
          therapist_name: existing.label,
          therapist_matched: true,
        };
      }

      return {
        ...row,
        therapist: "",
        therapist_id: "",
        therapist_name: excelName,
        therapist_matched: false,
      };
    }

    return {
      ...row,
      therapist: matched.id,
      therapist_id: matched.id,
      therapist_name: matched.name,
      therapist_matched: true,
    };
  });
}

// ============================================================
// MAIN HOOK
// ============================================================

export default function useScheduleData(therapists = []) {
  const [activeTab, setActiveTab] = useState("create");
  const [therapist, setTherapist] = useState("");
  const [date, setDate] = useState(today());

  const [backendTherapists, setBackendTherapists] =
    useState([]);

  const [appointments, setAppointments] = useState([]);
  const [historyAppointments, setHistoryAppointments] =
    useState([]);
  const [alerts, setAlerts] = useState([]);
  const [excel, setExcel] = useState(EMPTY_EXCEL);

  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] =
    useState(false);
  const [loadingAlerts, setLoadingAlerts] =
    useState(false);
  const [loadingTherapists, setLoadingTherapists] =
    useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [alertsError, setAlertsError] = useState("");

  const [hasDraft, setHasDraft] = useState(false);
  const [loadedSchedule, setLoadedSchedule] =
    useState(false);

  /*
   * Show the working appointment table only
   * after a draft has been created or an
   * existing schedule has explicitly loaded.
   */
  const [showScheduleTable, setShowScheduleTable] =
    useState(false);

  const [editingAppointment, setEditingAppointment] =
    useState(null);

  const [detailsAppointment, setDetailsAppointment] =
    useState(null);

  const [detailsHistory, setDetailsHistory] =
    useState([]);

  const [patientSearchOpen, setPatientSearchOpen] =
    useState(false);

  const [patientQuery, setPatientQuery] =
    useState("");

  const [patientMatches, setPatientMatches] =
    useState([]);

  const [searchingPatients, setSearchingPatients] =
    useState(false);

  const [historyFilter, setHistoryFilter] =
    useState("all");

  const [historyQuery, setHistoryQuery] =
    useState("");

  const [scheduleFilter, setScheduleFilter] =
    useState("all");

  const fileInputRef = useRef(null);
  const workbookRef = useRef(null);

  const requestRef = useRef(0);
  const historyRequestRef = useRef(0);
  const patientRequestRef = useRef(0);
  const alertsRequestRef = useRef(0);

  /*
   * Prevent double-clicking Save from starting
   * multiple overlapping requests.
   */
  const saveLockRef = useRef(false);

  /*
   * Tracks successful POST/PATCH responses
   * during a save attempt.
   */
  const savedRecordsRef = useRef(new Map());

  const busy = loading || saving || importing;

  // ==========================================================
  // THERAPISTS
  // ==========================================================

  const therapistOptions = useMemo(
    () =>
      combineTherapists(
        therapists,
        backendTherapists
      ),
    [therapists, backendTherapists]
  );

  const therapistName =
    therapistOptions.find(
      (item) =>
        String(item.value) === String(therapist)
    )?.label || therapist;

  useEffect(() => {
    let active = true;

    async function loadTherapists() {
      setLoadingTherapists(true);

      try {
        const response = await api.get(
          `${API}therapists/`,
          { timeout: 30000 }
        );

        if (!active) return;

        const data = response.data;

        const users = Array.isArray(data)
          ? data
          : data?.therapists ||
            data?.results ||
            data?.users ||
            [];

        setBackendTherapists(
          Array.isArray(users) ? users : []
        );
      } catch (err) {
        if (active && !therapists.length) {
          setError(errorMessage(err));
        }
      } finally {
        if (active) {
          setLoadingTherapists(false);
        }
      }
    }

    loadTherapists();

    return () => {
      active = false;
    };
  }, [therapists.length]);

  useEffect(() => {
    if (!therapistOptions.length) return;

    setExcel((previous) => {
      if (!previous.preview.length) {
        return previous;
      }

      const preview = reconcilePreviewTherapists(
        previous.preview,
        therapistOptions,
        therapist
      );

      const unmatchedTherapists = preview.filter(
        (row) =>
          !isValidTherapist(getTherapistId(row))
      ).length;

      const changed = preview.some((row, index) => {
        const old = previous.preview[index];

        return (
          String(row.therapist) !==
            String(old.therapist) ||
          row.therapist_name !== old.therapist_name ||
          row.therapist_matched !== old.therapist_matched
        );
      });

      if (
        !changed &&
        unmatchedTherapists ===
          previous.unmatchedTherapists
      ) {
        return previous;
      }

      return {
        ...previous,
        preview,
        unmatchedTherapists,
      };
    });
  }, [therapistOptions, therapist]);

  // ==========================================================
  // SUMMARY AND FILTERS
  // ==========================================================

  const totals = useMemo(() => {
    const count = (status) =>
      appointments.filter(
        (row) => getStatus(row) === status
      ).length;

    return {
      total: appointments.length,
      confirmed: count("confirmed"),
      unconfirmed: count("unconfirmed"),
      cancelled: count("cancelled"),
      rescheduled: count("rescheduled"),
      no_answer: count("no_answer"),
      phone_off: count("phone_off"),
      evaluations: appointments.filter(
        (row) =>
          row.appointment_type === "evaluation"
      ).length,
      missingTime: appointments.filter(
        (row) => !validTime(getAppointmentTime(row))
      ).length,
    };
  }, [appointments]);

  const filteredAppointments = useMemo(
    () =>
      sortByTime(
        appointments.filter((row) => {
          if (scheduleFilter === "all") return true;

          if (scheduleFilter === "evaluations") {
            return row.appointment_type === "evaluation";
          }

          return getStatus(row) === scheduleFilter;
        })
      ),
    [appointments, scheduleFilter]
  );

  const filteredHistory = useMemo(() => {
    const query = historyQuery.trim().toLowerCase();

    return sortByTime(
      historyAppointments.filter((row) => {
        const statusMatches =
          historyFilter === "all" ||
          getStatus(row) === historyFilter;

        const searchMatches =
          !query ||
          clean(row.patient_name)
            .toLowerCase()
            .includes(query) ||
          clean(row.file_number)
            .toLowerCase()
            .includes(query);

        return statusMatches && searchMatches;
      })
    );
  }, [
    historyAppointments,
    historyFilter,
    historyQuery,
  ]);

  const followUpAlerts = useMemo(
    () =>
      sortByTime(
        alerts.filter((row) =>
          isFollowUpStatus(getStatus(row))
        )
      ),
    [alerts]
  );

  const changedCount = appointments.filter(
    (row) => row.isNew || row.isDirty
  ).length;

  // ==========================================================
  // MESSAGE AND WORKSPACE HELPERS
  // ==========================================================

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const updateExcel = (update) => {
    setExcel((previous) => ({
      ...previous,
      ...(typeof update === "function"
        ? update(previous)
        : update),
    }));
  };

  const clearExcel = () => {
    workbookRef.current = null;
    setExcel(EMPTY_EXCEL);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const cancelPreview = () => {
    updateExcel({
      preview: [],
      warnings: [],
      skipped: 0,
      unmatchedTherapists: 0,
    });

    clearMessages();
  };

  const resetWorkspace = () => {
    requestRef.current++;
    historyRequestRef.current++;
    patientRequestRef.current++;
    alertsRequestRef.current++;

    setAppointments([]);
    setHistoryAppointments([]);
    setAlerts([]);

    setHasDraft(false);
    setLoadedSchedule(false);
    setShowScheduleTable(false);

    setEditingAppointment(null);
    setDetailsAppointment(null);
    setDetailsHistory([]);

    setPatientSearchOpen(false);
    setPatientMatches([]);
    setPatientQuery("");

    setScheduleFilter("all");

    savedRecordsRef.current.clear();

    clearExcel();
    clearMessages();
  };

  const changeContext = (field, value) => {
    if (busy) return;

    if (hasDraft && !confirmDiscard()) {
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
  // LOAD EXISTING SCHEDULE
  // ==========================================================

  const loadSchedule = async () => {
    if (!therapist || !validDate(date)) {
      setError("Select a therapist and valid date.");
      return;
    }

    if (hasDraft && !confirmDiscard()) {
      return;
    }

    const requestId = ++requestRef.current;

    setLoading(true);
    clearMessages();

    try {
      const response = await api.get(
        `${API}list/`,
        {
          params: { therapist, date },
          timeout: 30000,
        }
      );

      if (requestId !== requestRef.current) {
        return;
      }

      const rows = normalizeSaved(
        extractRows(response.data)
      );

      const { accepted, duplicates } =
        deduplicateAppointments(rows, date);

      setAppointments(sortByTime(accepted));
      setHasDraft(false);
      setLoadedSchedule(true);
      setShowScheduleTable(accepted.length > 0);

      savedRecordsRef.current.clear();

      setSuccess(
        `${accepted.length} appointments loaded.` +
        (
          duplicates.length
            ? ` ${duplicates.length} duplicate records hidden.`
            : ""
        )
      );
    } catch (err) {
      if (requestId === requestRef.current) {
        setError(errorMessage(err));
      }
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false);
      }
    }
  };

  // ==========================================================
  // EXCEL WORKBOOK
  // ==========================================================

  const loadSheet = (workbook, sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return;

    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: true,
      defval: "",
      blankrows: false,
    });

    let headerRowIndex = 0;
    let headers = rows[0] || [];

    try {
      const detected = detectScheduleHeader(rows);
      headerRowIndex = detected.index;
      headers = rows[headerRowIndex] || [];
    } catch {
      // Preview performs final header validation.
    }

    updateExcel({
      selectedSheet: sheetName,
      rows,
      headerRowIndex,
      headers,
      mapping: [],
      preview: [],
      warnings: [],
      skipped: 0,
      unmatchedTherapists: 0,
    });
  };

  const handleExcelFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    clearMessages();

    const extension = `.${file.name
      .split(".")
      .pop()
      .toLowerCase()}`;

    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setError("Select an XLSX, XLS, or CSV file.");
      event.target.value = "";
      return;
    }

    if (!file.size || file.size > MAX_FILE_SIZE) {
      setError(
        "Excel file is empty or exceeds the size limit."
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

      if (!workbook.SheetNames.length) {
        throw new Error(
          "Excel file has no worksheets."
        );
      }

      workbookRef.current = workbook;

      let selectedSheet = workbook.SheetNames[0];

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];

        const rows = XLSX.utils.sheet_to_json(
          sheet,
          {
            header: 1,
            raw: true,
            defval: "",
            blankrows: false,
          }
        );

        try {
          detectScheduleHeader(rows);
          selectedSheet = sheetName;
          break;
        } catch {
          // Check the next worksheet.
        }
      }

      updateExcel({
        file,
        sheets: workbook.SheetNames,
      });

      loadSheet(workbook, selectedSheet);

      setSuccess(
        "Excel loaded. Preview appointments."
      );
    } catch (err) {
      clearExcel();
      setError(
        err.message || "Unable to read Excel."
      );
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  const changeSheet = (sheetName) => {
    if (workbookRef.current) {
      loadSheet(workbookRef.current, sheetName);
    }
  };

  const changeHeaderRow = (value) => {
    const index = Number(value);

    updateExcel({
      headerRowIndex: index,
      headers: excel.rows[index] || [],
      preview: [],
    });
  };

  const updateMapping = () => {
    // Automatic Excel column detection.
  };

  // ==========================================================
  // EXCEL PREVIEW
  // ==========================================================

  const previewExcel = () => {
    clearMessages();

    if (!validDate(date)) {
      setError("Select a valid appointment date.");
      return;
    }

    if (!excel.rows.length) {
      setError("Upload an Excel schedule first.");
      return;
    }

    try {
      const result = extractScheduleAppointments({
        rows: excel.rows,
        therapistUsers: therapistOptions,
        selectedTherapist: therapist,
        appointmentDate: date,
        existingAppointments: appointments,
      });

      if (result.appointments.length > MAX_APPOINTMENTS) {
        throw new Error(
          `Maximum ${MAX_APPOINTMENTS} appointments allowed.`
        );
      }

      const reconciled = reconcilePreviewTherapists(
        result.appointments,
        therapistOptions,
        therapist
      );

      const { accepted, duplicates } =
        deduplicateAppointments(
          reconciled,
          date
        );

      const unmatchedTherapists = accepted.filter(
        (row) =>
          !isValidTherapist(getTherapistId(row))
      ).length;

      updateExcel({
        preview: sortByTime(accepted),
        skipped:
          result.skipped + duplicates.length,
        warnings: [
          ...result.warnings,
          ...duplicates.map(
            (row) =>
              `Duplicate patient skipped: ${row.patient_name}`
          ),
        ],
        unmatchedTherapists,
      });

      setSuccess(
        `${accepted.length} appointments ready. ` +
        `${unmatchedTherapists} therapists unmatched. ` +
        `${result.skipped + duplicates.length} rows skipped.`
      );
    } catch (err) {
      setError(
        err.message || "Excel preview failed."
      );
    }
  };

  const updateImportPreviewRow = (
    localId,
    field,
    value
  ) => {
    updateExcel((previous) => {
      const preview = previous.preview.map((row) => {
        if (row.localId !== localId) return row;

        if (
          field === "therapist" ||
          field === "therapist_id"
        ) {
          const selected = therapistOptions.find(
            (option) =>
              String(option.value) === String(value)
          );

          return {
            ...row,
            therapist: selected?.value ?? "",
            therapist_id: selected?.value ?? "",
            therapist_name:
              selected?.label ??
              row.excel_therapist_name ??
              "",
            therapist_matched: Boolean(selected),
            therapist_manually_assigned:
              Boolean(selected),
            isDirty: true,
          };
        }

        if (
          field === "time" ||
          field === "rescheduled_time"
        ) {
          return {
            ...row,
            [field]: parseExcelTime(value),
            isDirty: true,
          };
        }

        return {
          ...row,
          [field]: value,
          isDirty: true,
        };
      });

      return {
        preview: sortByTime(preview),
        unmatchedTherapists: preview.filter(
          (row) =>
            !isValidTherapist(getTherapistId(row))
        ).length,
      };
    });
  };

  const removeImportPreviewRow = (localId) => {
    updateExcel((previous) => {
      const preview = previous.preview.filter(
        (row) => row.localId !== localId
      );

      return {
        preview,
        unmatchedTherapists: preview.filter(
          (row) =>
            !isValidTherapist(getTherapistId(row))
        ).length,
      };
    });
  };

  // ==========================================================
  // PREVIEW -> DRAFT
  // ==========================================================

  const addPreviewToDraft = () => {
    clearMessages();

    if (!excel.preview.length) {
      setError(
        "No appointments available to import."
      );
      return;
    }

    const unmatched = excel.preview.filter(
      (row) =>
        !isValidTherapist(getTherapistId(row)) ||
        !therapistOptions.some(
          (option) =>
            String(option.value) ===
            String(getTherapistId(row))
        )
    );

    if (unmatched.length) {
      setError(
        `${unmatched.length} appointments have unmatched therapists. ` +
        "Assign registered physiotherapists before importing."
      );
      return;
    }

    for (const row of excel.preview) {
      const issue = validateScheduleRow(row, date);

      if (issue) {
        setError(
          `${row.patient_name || "Appointment"}: ${issue}`
        );
        return;
      }
    }

    const seen = new Set(
      appointments
        .map((row) => patientDateKey(row, date))
        .filter(Boolean)
    );

    const accepted = [];
    let duplicateCount = 0;

    for (const row of excel.preview) {
      const key = patientDateKey(row, date);

      if (key && seen.has(key)) {
        duplicateCount++;
        continue;
      }

      if (key) seen.add(key);
      accepted.push(row);
    }

    if (!accepted.length) {
      setError(
        "All appointments already exist in the draft."
      );
      return;
    }

    if (
      appointments.length + accepted.length >
      MAX_APPOINTMENTS
    ) {
      setError(
        "Maximum appointment count exceeded."
      );
      return;
    }

    if (
      !window.confirm(
        `Add ${accepted.length} appointments to draft?`
      )
    ) {
      return;
    }

    setAppointments((previous) =>
      sortByTime([
        ...previous,
        ...accepted.map((row) => ({
          ...row,
          isNew: true,
          isDirty: true,
        })),
      ])
    );

    setHasDraft(true);
    setShowScheduleTable(true);

    /*
     * Remove the preview after adding the draft.
     * This makes the Appointment Preview disappear.
     */
    updateExcel({
      preview: [],
      warnings: [],
      skipped: 0,
      unmatchedTherapists: 0,
    });

    setScheduleFilter("all");

    setSuccess(
      `${accepted.length} appointments added to draft.` +
      (
        duplicateCount
          ? ` ${duplicateCount} duplicates skipped.`
          : ""
      )
    );
  };

  // ==========================================================
  // MANUAL APPOINTMENTS
  // ==========================================================

  const addAppointment = () => {
    if (!therapist || !validDate(date)) {
      setError(
        "Select therapist and date first."
      );
      return;
    }

    if (appointments.length >= MAX_APPOINTMENTS) {
      setError("Maximum appointments reached.");
      return;
    }

    setEditingAppointment({
      ...emptyAppointment(),
      therapist,
      therapist_id: therapist,
      therapist_name: therapistName,
      appointment_date: date,
      date,
      confirmation_status: "unconfirmed",
      approval_status: "approved",
    });

    clearMessages();
  };

  const saveEditorToDraft = () => {
    if (!editingAppointment) return;

    const issue = validateScheduleRow(
      editingAppointment,
      date
    );

    if (issue) {
      setError(issue);
      return;
    }

    const duplicate = findDuplicate(
      appointments,
      editingAppointment,
      date
    );

    if (duplicate) {
      setError(
        `${editingAppointment.patient_name} already has ` +
        "an appointment on this date. " +
        "Edit the existing appointment instead."
      );
      return;
    }

    const updated = {
      ...editingAppointment,
      isDirty: true,
      isNew:
        editingAppointment.isNew ||
        !editingAppointment.id,
    };

    setAppointments((previous) => {
      const exists = previous.some(
        (row) => sameAppointment(row, updated)
      );

      return sortByTime(
        exists
          ? previous.map((row) =>
              sameAppointment(row, updated)
                ? preserveApproval(row, updated)
                : row
            )
          : [...previous, updated]
      );
    });

    setHasDraft(true);
    setShowScheduleTable(true);
    setEditingAppointment(null);
    setError("");

    setSuccess(
      updated.id
        ? "Appointment changes added to draft."
        : "Appointment added to draft."
    );
  };

  const removeDraftAppointment = (row) => {
    if (row.id) {
      setError(
        "Saved appointments must be cancelled, not deleted."
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

    setAppointments((previous) => {
      const remaining = previous.filter(
        (item) => !sameAppointment(item, row)
      );

      if (!remaining.length) {
        setShowScheduleTable(false);
      }

      return remaining;
    });

    setHasDraft(true);
  };

  // ==========================================================
  // PATIENT SEARCH
  // ==========================================================

  const findPatient = async () => {
    const query = patientQuery.trim();

    if (query.length < 2) return;

    const requestId = ++patientRequestRef.current;
    setSearchingPatients(true);

    try {
      const response = await api.get(
        `${API}patients/`,
        {
          params: { q: query },
          timeout: 30000,
        }
      );

      if (requestId === patientRequestRef.current) {
        setPatientMatches(
          response.data?.matches || []
        );
      }
    } catch (err) {
      if (requestId === patientRequestRef.current) {
        setError(errorMessage(err));
      }
    } finally {
      if (requestId === patientRequestRef.current) {
        setSearchingPatients(false);
      }
    }
  };

  const selectPatient = (patient) => {
    setEditingAppointment((previous) =>
      previous
        ? {
            ...previous,
            patient_id: patient.id,
            patient_name: patient.name,
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
  // ALERTS
  // ==========================================================

  const loadAlerts = async () => {
    const requestId = ++alertsRequestRef.current;

    setLoadingAlerts(true);
    setAlertsError("");

    try {
      const response = await api.get(
        `${API}alerts/`,
        { timeout: 30000 }
      );

      if (requestId !== alertsRequestRef.current) {
        return;
      }

      const rows =
        response.data?.alerts ||
        extractRows(response.data);

      setAlerts(normalizeSaved(rows));
    } catch (err) {
      if (requestId === alertsRequestRef.current) {
        setAlerts([]);
        setAlertsError(errorMessage(err));
      }
    } finally {
      if (requestId === alertsRequestRef.current) {
        setLoadingAlerts(false);
      }
    }
  };

  // ==========================================================
  // SAVE TO DJANGO
  // ==========================================================

  const saveAppointments = async () => {
    if (saveLockRef.current) return;

    const changed = appointments.filter(
      (row) => row.isNew || row.isDirty
    );

    if (!changed.length) {
      setSuccess("No changes to save.");
      return;
    }

    /*
     * Check duplicates across the entire working
     * schedule before making any API requests.
     */
    const { duplicates } = deduplicateAppointments(
      appointments,
      date
    );

    if (duplicates.length) {
      setError(
        `Duplicate appointment detected for ${duplicates[0].patient_name}. ` +
        "Only one appointment per patient per date is allowed."
      );
      return;
    }

    for (const row of changed) {
      const issue = validateScheduleRow(row, date);

      if (issue) {
        setError(
          `${row.patient_name || "Appointment"}: ${issue}`
        );
        return;
      }

      const therapistId =
        getTherapistId(row) ||
        (row.source !== "excel" ? therapist : "");

      if (!isValidTherapist(therapistId)) {
        setError(
          `${row.patient_name || "Appointment"}: ` +
          "Assign a physiotherapist before saving."
        );
        return;
      }
    }

    if (
      !window.confirm(
        `Save ${changed.length} appointments to Django?`
      )
    ) {
      return;
    }

    saveLockRef.current = true;
    setSaving(true);
    clearMessages();

    const saved = [];

    const applySavedRecords = (previous) =>
      previous.map((row) => {
        const match = saved.find(
          (item) => item.localId === row.localId
        );

        if (!match) return row;

        const combined = preserveApproval(
          row,
          match.responseRow
        );

        return {
          ...combined,
          id: match.id,
          isNew: false,
          isDirty: false,
        };
      });

    try {
      for (const row of changed) {
        const therapistId =
          getTherapistId(row) || therapist;

        const appointmentDate = getAppointmentDate(
          row,
          date
        );

        const payload = buildAppointmentPayload(
          row,
          therapistId,
          appointmentDate
        );

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

        const responseRow =
          response.data?.appointment ||
          response.data ||
          {};

        const savedId =
          responseRow.id ??
          row.id;

        /*
         * A successful create must return an ID.
         * Without it, retrying may create duplicates.
         */
        if (!savedId) {
          throw new Error(
            `Appointment for ${row.patient_name} was sent, ` +
            "but Django did not return an appointment ID. " +
            "Check the saved schedule before retrying."
          );
        }

        saved.push({
          localId: row.localId,
          id: savedId,
          responseRow,
        });

        savedRecordsRef.current.set(
          String(row.localId),
          savedId
        );
      }

      /*
       * All requests succeeded.
       *
       * Clear only the working schedule, not the
       * Django records or appointment history.
       */
      setAppointments([]);
      setHasDraft(false);
      setLoadedSchedule(false);
      setShowScheduleTable(false);
      setScheduleFilter("all");

      setEditingAppointment(null);

      updateExcel({
        preview: [],
        warnings: [],
        skipped: 0,
        unmatchedTherapists: 0,
      });

      savedRecordsRef.current.clear();

      setSuccess(
        `${saved.length} appointments saved successfully. ` +
        "The working schedule has been cleared. " +
        "Saved appointments remain available in history."
      );

      /*
       * Alert refresh failure should not cause
       * successful appointment saving to be
       * reported as a failure.
       */
      try {
        await loadAlerts();
      } catch {
        // Appointment save is already complete.
      }
    } catch (err) {
      /*
       * Preserve IDs of successful requests.
       * Only unsaved rows remain dirty, avoiding
       * duplicate POSTs during a retry.
       */
      setAppointments((previous) =>
        applySavedRecords(previous)
      );

      setHasDraft(true);
      setShowScheduleTable(true);

      setError(
        `${saved.length}/${changed.length} appointments saved. ` +
        errorMessage(err) +
        " Review the remaining changes before retrying."
      );
    } finally {
      saveLockRef.current = false;
      setSaving(false);
    }
  };

  // ==========================================================
  // HISTORY
  // ==========================================================

  const loadHistory = async () => {
    if (!therapist || !validDate(date)) {
      return;
    }

    const requestId = ++historyRequestRef.current;

    setLoadingHistory(true);

    try {
      const response = await api.get(
        `${API}list/`,
        {
          params: { therapist, date },
          timeout: 30000,
        }
      );

      if (
        requestId === historyRequestRef.current
      ) {
        setHistoryAppointments(
          sortByTime(
            normalizeSaved(
              extractRows(response.data)
            )
          )
        );
      }
    } catch (err) {
      if (
        requestId === historyRequestRef.current
      ) {
        setError(errorMessage(err));
      }
    } finally {
      if (
        requestId === historyRequestRef.current
      ) {
        setLoadingHistory(false);
      }
    }
  };

  useEffect(() => {
    if (activeTab !== "history") {
      return;
    }

    if (therapist && validDate(date)) {
      loadHistory();
    }

    loadAlerts();
  }, [activeTab, therapist, date]);

  // ==========================================================
  // APPOINTMENT DETAILS
  // ==========================================================

  const openDetails = async (row) => {
    setDetailsAppointment(row);

    setDetailsHistory(
      normalizeHistory(row.history)
    );

    if (!row.id) return;

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
      // Keep any history already available.
    }
  };

  // ==========================================================
  // CALL ATTEMPTS
  // ==========================================================

  const recordCallAttempt = async (row) => {
    if (!row.id) {
      setError("Save appointment first.");
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

      setSuccess("Call attempt recorded.");
      await loadAlerts();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    activeTab,
    setActiveTab,

    therapist,
    date,
    therapistName,
    therapistOptions,
    changeContext,

    appointments,
    filteredAppointments,
    totals,

    scheduleFilter,
    setScheduleFilter,

    changedCount,
    hasDraft,
    loadedSchedule,

    /*
     * Use this in the parent component to
     * control ScheduleTable visibility.
     */
    showScheduleTable,

    excel,
    updateExcel,
    fileInputRef,
    handleExcelFile,
    clearExcel,
    changeSheet,
    changeHeaderRow,
    updateMapping,
    previewExcel,
    updateImportPreviewRow,
    removeImportPreviewRow,
    cancelPreview,
    addPreviewToDraft,

    addAppointment,
    saveAppointments,
    removeDraftAppointment,

    editingAppointment,
    setEditingAppointment,
    saveEditorToDraft,

    patientSearchOpen,
    setPatientSearchOpen,
    patientQuery,
    setPatientQuery,
    patientMatches,
    setPatientMatches,
    searchingPatients,
    findPatient,
    selectPatient,

    historyFilter,
    setHistoryFilter,
    historyQuery,
    setHistoryQuery,
    filteredHistory,
    loadHistory,

    followUpAlerts,
    loadAlerts,

    openDetails,
    detailsAppointment,
    setDetailsAppointment,
    detailsHistory,
    recordCallAttempt,

    busy,
    loading,
    loadingHistory,
    loadingAlerts,
    loadingTherapists,
    saving,
    importing,

    error,
    success,
    alertsError,
    clearMessages,
    loadSchedule,
  };
}

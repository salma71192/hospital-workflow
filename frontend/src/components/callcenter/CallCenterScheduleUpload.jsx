
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as XLSX from "xlsx";
import api from "../../api/api";

// ============================================================
// CONFIGURATION
// ============================================================

const API = "/physio/schedule/";

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MAX_APPOINTMENTS = 200;

const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv"];

const STATUS_OPTIONS = [
  { value: "unconfirmed", label: "Unconfirmed" },
  { value: "confirmed", label: "Confirmed" },
  { value: "no_answer", label: "No Answer" },
  { value: "phone_off", label: "Phone Off" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rescheduled", label: "Rescheduled" },
];

const STATUS_COLORS = {
  unconfirmed: "#D6B36A",
  confirmed: "#F1D84D",
  no_answer: "#E7A65A",
  phone_off: "#9CA3AF",
  cancelled: "#D96A6A",
  rescheduled: "#72A8D8",
};

const FOLLOW_UP_STATUSES = new Set([
  "unconfirmed",
  "no_answer",
  "phone_off",
]);

const FIELD_OPTIONS = [
  { value: "", label: "Do not import" },
  { value: "patient_name", label: "Patient Name" },
  { value: "file_number", label: "File Number" },
  { value: "time", label: "Appointment Time" },
  { value: "date", label: "Appointment Date" },
  { value: "therapist", label: "Therapist" },
  { value: "confirmation_status", label: "Status" },
  { value: "appointment_type", label: "Appointment Type" },
  { value: "notes", label: "Notes" },
];

const FIELD_ALIASES = {
  patient_name: [
    "patient",
    "patient name",
    "patientname",
    "name",
    "full name",
    "patient full name",
    "client",
    "client name",
    "اسم المريض",
    "المريض",
  ],
  file_number: [
    "file number",
    "file no",
    "file no.",
    "file",
    "file id",
    "patient id",
    "patient number",
    "mrn",
    "medical record number",
    "medical record",
    "رقم الملف",
  ],
  time: [
    "time",
    "appointment time",
    "appt time",
    "start time",
    "booking time",
    "slot",
    "وقت الموعد",
    "الوقت",
  ],
  date: [
    "date",
    "appointment date",
    "appt date",
    "booking date",
    "تاريخ الموعد",
    "التاريخ",
  ],
  therapist: [
    "therapist",
    "therapist name",
    "physiotherapist",
    "provider",
    "doctor",
    "resource",
    "المعالج",
  ],
  confirmation_status: [
    "status",
    "confirmation",
    "confirmation status",
    "appointment status",
    "حالة الموعد",
  ],
  appointment_type: [
    "type",
    "appointment type",
    "visit type",
    "service type",
    "visit",
    "نوع الموعد",
  ],
  notes: [
    "notes",
    "remarks",
    "comments",
    "comment",
    "description",
    "ملاحظات",
  ],
};

// ============================================================
// GENERAL HELPERS
// ============================================================

function today() {
  const d = new Date();

  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function newLocalId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2)
  );
}

function cleanText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeHeader(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[_\-./:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function validTime(value) {
  if (!/^\d{2}:\d{2}$/.test(value || "")) return false;

  const [hour, minute] = value.split(":").map(Number);

  return (
    hour >= 0 &&
    hour <= 23 &&
    minute >= 0 &&
    minute <= 59
  );
}

function normalizeTime(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";

    return (
      String(value.getHours()).padStart(2, "0") +
      ":" +
      String(value.getMinutes()).padStart(2, "0")
    );
  }

  // Excel stores times as fractions of a day.
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0) return "";

    const fraction = value - Math.floor(value);

    if (value >= 1 && fraction === 0) {
      return "";
    }

    const minutes = Math.round(fraction * 1440) % 1440;

    return (
      String(Math.floor(minutes / 60)).padStart(2, "0") +
      ":" +
      String(minutes % 60).padStart(2, "0")
    );
  }

  const text = cleanText(value)
    .replace(/\u00a0/g, " ")
    .replace(/\./g, ":");

  // 09:30, 9:30, 09:30:00, 9:30 AM
  const match = text.match(
    /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i
  );

  if (match) {
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const period = match[3]?.toUpperCase();

    if (minute > 59) return "";

    if (period) {
      if (hour < 1 || hour > 12) return "";
      hour = hour % 12;
      if (period === "PM") hour += 12;
    } else if (hour > 23) {
      return "";
    }

    return (
      String(hour).padStart(2, "0") +
      ":" +
      String(minute).padStart(2, "0")
    );
  }

  // 9 AM, 12 PM
  const hourOnly = text.match(/^(\d{1,2})\s*(AM|PM)$/i);

  if (hourOnly) {
    let hour = Number(hourOnly[1]);

    if (hour < 1 || hour > 12) return "";

    hour %= 12;

    if (hourOnly[2].toUpperCase() === "PM") hour += 12;

    return String(hour).padStart(2, "0") + ":00";
  }

  // Excel time fraction represented as text.
  if (/^0\.\d+$/.test(text)) {
    return normalizeTime(Number(text));
  }

  return "";
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));

  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

function normalizeDate(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";

    return [
      value.getFullYear(),
      String(value.getMonth() + 1).padStart(2, "0"),
      String(value.getDate()).padStart(2, "0"),
    ].join("-");
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);

    if (!parsed) return "";

    const result = [
      parsed.y,
      String(parsed.m).padStart(2, "0"),
      String(parsed.d).padStart(2, "0"),
    ].join("-");

    return validDate(result) ? result : "";
  }

  const text = cleanText(value);

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const result = text.slice(0, 10);
    return validDate(result) ? result : "";
  }

  // Day/month/year or day-month-year.
  const match = text.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/
  );

  if (match) {
    const first = Number(match[1]);
    const second = Number(match[2]);
    const year = match[3];

    // Do not guess ambiguous dates.
    if (first <= 12 && second <= 12) return "";

    const day = first > 12 ? first : second;
    const month = first > 12 ? second : first;

    const result =
      `${year}-${String(month).padStart(2, "0")}` +
      `-${String(day).padStart(2, "0")}`;

    return validDate(result) ? result : "";
  }

  return "";
}

function normalizeStatus(value) {
  const text = normalizeHeader(value).replace(/\s+/g, "_");

  const aliases = {
    confirmed: "confirmed",
    confirm: "confirmed",
    yes: "confirmed",
    unconfirmed: "unconfirmed",
    not_confirmed: "unconfirmed",
    pending: "unconfirmed",
    no_answer: "no_answer",
    noanswer: "no_answer",
    unanswered: "no_answer",
    phone_off: "phone_off",
    phoneoff: "phone_off",
    switched_off: "phone_off",
    cancelled: "cancelled",
    canceled: "cancelled",
    rescheduled: "rescheduled",
    postponed: "rescheduled",
  };

  return aliases[text] || "unconfirmed";
}

function normalizeType(value) {
  const text = normalizeHeader(value);

  if (
    text.includes("evaluation") ||
    text.includes("assessment") ||
    text === "eval" ||
    text === "new patient" ||
    text === "initial"
  ) {
    return "evaluation";
  }

  return "followup";
}

function statusLabel(value) {
  return (
    STATUS_OPTIONS.find((item) => item.value === value)?.label ||
    value ||
    "Unknown"
  );
}

function formatDateTime(value) {
  if (!value) return "Not recorded";

  const d = new Date(value);

  return Number.isNaN(d.getTime())
    ? String(value)
    : d.toLocaleString();
}

function normalizeTherapists(items) {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      if (typeof item === "string") {
        return { value: item, label: item };
      }

      const value = cleanText(
        item?.username ?? item?.value ?? item?.name
      );

      const label = cleanText(
        item?.full_name ??
        item?.label ??
        item?.name ??
        value
      );

      return value ? { value, label } : null;
    })
    .filter(Boolean);
}

function normalizeHistory(items) {
  if (!Array.isArray(items)) return [];

  return items.map((item) => ({
    id: item.id ?? newLocalId(),
    action: item.action || "Appointment updated",
    old_status:
      item.old_status ?? item.previous_status ?? null,
    new_status: item.new_status ?? item.status ?? null,
    note: item.note || item.notes || "",
    changed_by:
      item.changed_by_name ||
      (typeof item.changed_by === "string"
        ? item.changed_by
        : "Staff"),
    created_at:
      item.created_at ||
      item.changed_at ||
      item.timestamp ||
      null,
  }));
}

function emptyAppointment() {
  return {
    localId: newLocalId(),
    id: null,
    patient_name: "",
    patient_id: null,
    file_number: "",
    time: "",
    confirmation_status: "unconfirmed",
    appointment_type: "followup",
    source: "manual",
    notes: "",
    matched: false,
    isNew: true,
    isDirty: true,
    history: [],
    second_call_attempts: 0,
    rescheduled_to_date: "",
    rescheduled_to_time: "",
    import_file: "",
    import_sheet: "",
    import_row: null,
    import_date: "",
    import_therapist: "",
    import_warnings: [],
  };
}

function normalizeAppointment(row = {}, published = false) {
  const patientId =
    row.patient_id ?? row.patient?.id ?? null;

  const id = row.id ?? row.appointment_id ?? null;

  return {
    ...emptyAppointment(),
    ...row,
    localId: newLocalId(),
    id,
    patient_name: cleanText(
      row.patient_name || row.patient?.name
    ),
    patient_id: patientId,
    file_number: cleanText(
      row.file_number ||
      row.patient_file_number ||
      row.patient?.patient_id
    ),
    time: normalizeTime(
      row.time ?? row.appointment_time
    ),
    confirmation_status: normalizeStatus(
      row.confirmation_status || row.status
    ),
    appointment_type: normalizeType(
      row.appointment_type
    ),
    source: row.source || (published ? "concepts" : "excel"),
    notes: row.notes || "",
    matched: patientId !== null && patientId !== "",
    isNew: !published || id === null,
    isDirty: !published,
    history: normalizeHistory(
      row.history || row.status_history || []
    ),
    second_call_attempts: Number(
      row.second_call_attempts || 0
    ),
    rescheduled_to_date: row.rescheduled_to_date || "",
    rescheduled_to_time: normalizeTime(
      row.rescheduled_to_time
    ),
    import_warnings: row.import_warnings || [],
  };
}

function extractRows(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.appointments)) return data.appointments;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function errorMessage(err, fallback = "Request failed.") {
  const status = err?.response?.status;
  const data = err?.response?.data;

  if (status === 401) {
    return "Please log in again.";
  }

  if (status === 403) {
    return "Access denied or CSRF token invalid.";
  }

  if (status === 404) {
    return "The required Django API endpoint is unavailable.";
  }

  if (status === 413) {
    return "The request exceeds the server size limit.";
  }

  if (err?.code === "ECONNABORTED") {
    return "The request timed out.";
  }

  if (err?.request && !err?.response) {
    return "Network error. Check Django and your connection.";
  }

  if (typeof data === "string" && !data.startsWith("<")) {
    return data.slice(0, 300);
  }

  const message = data?.error || data?.detail || data?.message;

  if (typeof message === "string") return message;

  if (message && typeof message === "object") {
    return JSON.stringify(message);
  }

  return err?.message || fallback;
}

// ============================================================
// EXCEL HELPERS
// ============================================================

function guessField(header) {
  const normalized = normalizeHeader(header);

  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.some((alias) => normalizeHeader(alias) === normalized)) {
      return field;
    }
  }

  return "";
}

function detectHeaderRow(rows) {
  let bestIndex = 0;
  let bestScore = -1;

  rows.slice(0, 20).forEach((row, index) => {
    const recognized = new Set(
      row.map(guessField).filter(Boolean)
    );

    let score = recognized.size;

    if (recognized.has("patient_name")) score += 4;
    if (recognized.has("time")) score += 4;

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function makeColumnHeaders(row) {
  const used = new Map();

  return row.map((value, index) => {
    const original = cleanText(value) || `Column ${index + 1}`;
    const count = (used.get(original) || 0) + 1;

    used.set(original, count);

    return count === 1
      ? original
      : `${original} (${count})`;
  });
}

function createColumnMapping(headers) {
  const assigned = new Set();

  return headers.map((header) => {
    const field = guessField(header);

    if (!field || assigned.has(field)) return "";

    assigned.add(field);
    return field;
  });
}

function isAdministrativeRow(name) {
  const text = normalizeHeader(name);

  if (!text) return false;

  return (
    /^(duty time|duty tim|break time|lunch break|total appointments|schedule date|therapist name|appointment list|patient name|grand total)$/i.test(
      text
    ) ||
    text.includes("ask the therapist for double booking")
  );
}

function parseImportRows(
  rows,
  mapping,
  headerRowIndex,
  fileName,
  sheetName,
  selectedDate,
  selectedTherapist,
  therapistLabel
) {
  const appointments = [];
  const warnings = [];
  let skipped = 0;

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const cells = rows[i] || [];

    if (cells.every((cell) => cleanText(cell) === "")) {
      continue;
    }

    const data = {};

    mapping.forEach((field, index) => {
      if (field) data[field] = cells[index];
    });

    const name = cleanText(data.patient_name);

    if (!name || isAdministrativeRow(name)) {
      skipped++;
      continue;
    }

    const time = normalizeTime(data.time);
    const importedDate = normalizeDate(data.date);
    const rawDate = cleanText(data.date);
    const importedTherapist = cleanText(data.therapist);

    const rowWarnings = [];

    if (!time) {
      rowWarnings.push("Missing or invalid appointment time");
    }

    if (rawDate && !importedDate) {
      rowWarnings.push("Appointment date could not be interpreted");
    }

    if (importedDate && importedDate !== selectedDate) {
      rowWarnings.push(
        `Date ${importedDate} differs from selected ${selectedDate}`
      );
    }

    if (
      importedTherapist &&
      ![
        normalizeHeader(selectedTherapist),
        normalizeHeader(therapistLabel),
      ].includes(normalizeHeader(importedTherapist))
    ) {
      rowWarnings.push(
        `Therapist "${importedTherapist}" needs verification`
      );
    }

    const rawStatus = cleanText(data.confirmation_status);
    const rawType = cleanText(data.appointment_type);

    if (
      rawStatus &&
      ![
        "confirmed",
        "confirm",
        "yes",
        "unconfirmed",
        "not confirmed",
        "pending",
        "no answer",
        "noanswer",
        "unanswered",
        "phone off",
        "phoneoff",
        "switched off",
        "cancelled",
        "canceled",
        "rescheduled",
        "postponed",
      ].includes(normalizeHeader(rawStatus))
    ) {
      rowWarnings.push(
        `Unrecognized status "${rawStatus}"; defaulted to Unconfirmed`
      );
    }

    if (
      rawType &&
      !/eval|assessment|initial|new patient|follow|review|treatment|session/i.test(
        rawType
      )
    ) {
      rowWarnings.push(
        `Appointment type "${rawType}" needs verification`
      );
    }

    const row = normalizeAppointment(
      {
        patient_name: name,
        file_number: cleanText(data.file_number),
        time,
        confirmation_status: normalizeStatus(rawStatus),
        appointment_type: normalizeType(rawType),
        notes: cleanText(data.notes),
        source: "excel",
        import_file: fileName,
        import_sheet: sheetName,
        import_row: i + 1,
        import_date: importedDate,
        import_therapist: importedTherapist,
        import_warnings: rowWarnings,
      },
      false
    );

    appointments.push(row);

    if (rowWarnings.length) {
      warnings.push(
        `Row ${i + 1}: ${name} — ${rowWarnings.join("; ")}`
      );
    }
  }

  return { appointments, warnings, skipped };
}

function validateAppointment(row) {
  if (!cleanText(row.patient_name)) {
    return "Patient name is required.";
  }

  if (row.patient_name.trim().length > 255) {
    return "Patient name is too long.";
  }

  if (!validTime(row.time)) {
    return "A valid appointment time is required.";
  }

  if (
    !STATUS_OPTIONS.some(
      (option) => option.value === row.confirmation_status
    )
  ) {
    return "Invalid appointment status.";
  }

  if (!["evaluation", "followup"].includes(row.appointment_type)) {
    return "Invalid appointment type.";
  }

  if (row.confirmation_status === "rescheduled") {
    if (
      !validDate(row.rescheduled_to_date) ||
      !validTime(row.rescheduled_to_time)
    ) {
      return "Rescheduled appointments need a new date and time.";
    }
  }

  return null;
}

function payloadForAppointment(row, therapist, date) {
  return {
    therapist,
    date,
    patient_name: row.patient_name.trim(),
    patient_id: row.patient_id || null,
    time: row.time,
    confirmation_status: row.confirmation_status,
    appointment_type: row.appointment_type,
    notes: row.notes || "",
    rescheduled_to_date:
      row.confirmation_status === "rescheduled"
        ? row.rescheduled_to_date
        : null,
    rescheduled_to_time:
      row.confirmation_status === "rescheduled"
        ? row.rescheduled_to_time
        : null,
  };
}

// ============================================================
// BADGES AND EDITOR
// ============================================================

function StatusBadge({ status }) {
  return (
    <span
      className="csu-status-badge"
      style={{
        background: STATUS_COLORS[status] || "#E2E8F0",
      }}
    >
      {statusLabel(status)}
    </span>
  );
}

function TypeBadge({ type }) {
  return (
    <span className={`csu-type ${type}`}>
      {type === "evaluation" ? "Evaluation" : "Follow-up"}
    </span>
  );
}

function AppointmentFields({
  appointment,
  disabled,
  onChange,
  onFindPatient,
}) {
  const update = (field, value) => {
    const next = {
      ...appointment,
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

    onChange(next);
  };

  return (
    <div className="csu-editor-grid">
      <label>
        Patient Name
        <input
          value={appointment.patient_name}
          disabled={disabled}
          onChange={(e) =>
            update("patient_name", e.target.value)
          }
        />
      </label>

      <label>
        Hospital File Number
        <div className="csu-inline-input">
          <input
            value={appointment.file_number || ""}
            disabled
            placeholder="Not matched"
          />
          <button
            type="button"
            className="csu-secondary"
            disabled={disabled}
            onClick={onFindPatient}
          >
            Find
          </button>
        </div>
      </label>

      <label>
        Appointment Time
        <input
          type="time"
          value={appointment.time}
          disabled={disabled}
          onChange={(e) => update("time", e.target.value)}
        />
      </label>

      <label>
        Confirmation Status
        <select
          value={appointment.confirmation_status}
          disabled={disabled}
          onChange={(e) =>
            update("confirmation_status", e.target.value)
          }
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Appointment Type
        <select
          value={appointment.appointment_type}
          disabled={disabled}
          onChange={(e) =>
            update("appointment_type", e.target.value)
          }
        >
          <option value="followup">Follow-up</option>
          <option value="evaluation">Evaluation</option>
        </select>
      </label>

      <label>
        Source
        <input value={appointment.source || "manual"} disabled />
      </label>

      {appointment.confirmation_status === "rescheduled" && (
        <>
          <label>
            New Date
            <input
              type="date"
              value={appointment.rescheduled_to_date}
              disabled={disabled}
              onChange={(e) =>
                update("rescheduled_to_date", e.target.value)
              }
            />
          </label>

          <label>
            New Time
            <input
              type="time"
              value={appointment.rescheduled_to_time}
              disabled={disabled}
              onChange={(e) =>
                update("rescheduled_to_time", e.target.value)
              }
            />
          </label>
        </>
      )}

      <label className="csu-full-width">
        Notes
        <textarea
          rows={3}
          value={appointment.notes || ""}
          disabled={disabled}
          onChange={(e) => update("notes", e.target.value)}
        />
      </label>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function CallCenterScheduleUpload({
  therapists = [],
}) {
  const [activeTab, setActiveTab] = useState("create");

  const [therapist, setTherapist] = useState("");
  const [date, setDate] = useState(today());

  const [backendTherapists, setBackendTherapists] = useState([]);
  const [loadingTherapists, setLoadingTherapists] = useState(false);

  const [appointments, setAppointments] = useState([]);
  const [historyAppointments, setHistoryAppointments] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // Excel import state
  const [excelFile, setExcelFile] = useState(null);
  const [workbookSheets, setWorkbookSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [sheetRows, setSheetRows] = useState([]);
  const [headerRowIndex, setHeaderRowIndex] = useState(0);
  const [headers, setHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState([]);
  const [importPreview, setImportPreview] = useState([]);
  const [importWarnings, setImportWarnings] = useState([]);
  const [importSkipped, setImportSkipped] = useState(0);
  const [importing, setImporting] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [hasDraft, setHasDraft] = useState(false);
  const [loadedSchedule, setLoadedSchedule] = useState(false);

  const [editingAppointment, setEditingAppointment] = useState(null);
  const [detailsAppointment, setDetailsAppointment] = useState(null);
  const [detailsHistory, setDetailsHistory] = useState([]);

  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [patientQuery, setPatientQuery] = useState("");
  const [patientMatches, setPatientMatches] = useState([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [patientSearchTarget, setPatientSearchTarget] = useState(null);

  const [historyFilter, setHistoryFilter] = useState("all");
  const [historyQuery, setHistoryQuery] = useState("");

  const [alertsError, setAlertsError] = useState("");

  const fileInputRef = useRef(null);
  const workbookRef = useRef(null);
  const requestRef = useRef(0);
  const patientRequestRef = useRef(0);
  const historyRequestRef = useRef(0);
  const detailsRequestRef = useRef(0);
  const saveContextRef = useRef(null);

  const busy = loading || saving || importing;

  // ==========================================================
  // DERIVED VALUES
  // ==========================================================

  const therapistOptions = useMemo(() => {
    const combined = [
      ...normalizeTherapists(therapists),
      ...normalizeTherapists(backendTherapists),
    ];

    const seen = new Set();

    return combined.filter((item) => {
      if (seen.has(item.value)) return false;
      seen.add(item.value);
      return true;
    });
  }, [therapists, backendTherapists]);

  const selectedTherapistName =
    therapistOptions.find((item) => item.value === therapist)
      ?.label || therapist;

  const sortedAppointments = useMemo(
    () =>
      [...appointments].sort((a, b) =>
        (a.time || "99:99").localeCompare(b.time || "99:99")
      ),
    [appointments]
  );

  const totals = useMemo(() => {
    const count = (status) =>
      appointments.filter(
        (row) => row.confirmation_status === status
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
        (row) => row.appointment_type === "evaluation"
      ).length,
      missingTime: appointments.filter(
        (row) => !validTime(row.time)
      ).length,
    };
  }, [appointments]);

  const filteredHistory = useMemo(() => {
    const q = historyQuery.trim().toLowerCase();

    return historyAppointments
      .filter((row) => {
        if (
          historyFilter !== "all" &&
          row.confirmation_status !== historyFilter
        ) {
          return false;
        }

        if (!q) return true;

        return (
          row.patient_name.toLowerCase().includes(q) ||
          String(row.file_number || "").toLowerCase().includes(q) ||
          String(row.time || "").includes(q)
        );
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [historyAppointments, historyFilter, historyQuery]);

  const followUpAlerts = useMemo(
    () =>
      alerts.filter((row) =>
        FOLLOW_UP_STATUSES.has(row.confirmation_status)
      ),
    [alerts]
  );

  const previewErrors = useMemo(
    () =>
      importPreview.filter(
        (row) => !validTime(row.time) || !row.patient_name.trim()
      ).length,
    [importPreview]
  );

  const changedCount = appointments.filter(
    (row) => row.isNew || row.isDirty
  ).length;

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    let active = true;

    async function fetchTherapists() {
      setLoadingTherapists(true);

      try {
        const response = await api.get(`${API}therapists/`);

        if (!active) return;

        setBackendTherapists(
          Array.isArray(response.data?.therapists)
            ? response.data.therapists
            : []
        );
      } catch (err) {
        if (active && therapists.length === 0) {
          setError(errorMessage(err, "Unable to load therapists."));
        }
      } finally {
        if (active) setLoadingTherapists(false);
      }
    }

    fetchTherapists();

    return () => {
      active = false;
    };
  }, [therapists.length]);

  // ==========================================================
  // WORKSPACE
  // ==========================================================

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const confirmDiscard = () => {
    if (!hasDraft) return true;

    return window.confirm(
      "You have unsaved appointment changes. Discard them?"
    );
  };

  const clearExcel = () => {
    workbookRef.current = null;
    setExcelFile(null);
    setWorkbookSheets([]);
    setSelectedSheet("");
    setSheetRows([]);
    setHeaders([]);
    setColumnMapping([]);
    setImportPreview([]);
    setImportWarnings([]);
    setImportSkipped(0);
    setHeaderRowIndex(0);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetWorkspace = () => {
    requestRef.current++;
    historyRequestRef.current++;
    patientRequestRef.current++;
    detailsRequestRef.current++;

    setAppointments([]);
    setHistoryAppointments([]);
    setAlerts([]);
    setHasDraft(false);
    setLoadedSchedule(false);
    setEditingAppointment(null);
    setDetailsAppointment(null);
    setPatientSearchOpen(false);
    setPatientMatches([]);
    setAlertsError("");

    clearExcel();
    clearMessages();
  };

  const changeTherapist = (value) => {
    if (value === therapist) return;
    if (busy || !confirmDiscard()) return;

    resetWorkspace();
    setTherapist(value);
  };

  const changeDate = (value) => {
    if (value === date) return;
    if (busy || !confirmDiscard()) return;

    resetWorkspace();
    setDate(value);
  };

  const changeTab = (value) => {
    if (value === activeTab) return;
    if (busy) return;

    setActiveTab(value);
    clearMessages();
  };

  // ==========================================================
  // LOAD SCHEDULE
  // ==========================================================

  const loadSchedule = async () => {
    if (!therapist || !validDate(date)) {
      setError("Select a therapist and valid date.");
      return;
    }

    if (!confirmDiscard()) return;

    const requestId = ++requestRef.current;

    setLoading(true);
    clearMessages();

    try {
      const response = await api.get(`${API}list/`, {
        params: { therapist, date },
        timeout: 30000,
      });

      if (requestId !== requestRef.current) return;

      const rows = extractRows(response.data);

      setAppointments(
        rows.map((row) => normalizeAppointment(row, true))
      );
      setHasDraft(false);
      setLoadedSchedule(true);

      setSuccess(
        rows.length
          ? `Loaded ${rows.length} saved appointments.`
          : "No saved appointments found for this date."
      );
    } catch (err) {
      if (requestId === requestRef.current) {
        setError(errorMessage(err, "Unable to load schedule."));
      }
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false);
      }
    }
  };

  // ==========================================================
  // EXCEL FILE READING
  // ==========================================================

  const loadSheet = (workbook, sheetName) => {
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      setError("Selected worksheet could not be found.");
      return;
    }

    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: true,
      defval: "",
      blankrows: false,
    });

    const headerIndex = detectHeaderRow(rows);
    const detectedHeaders = makeColumnHeaders(
      rows[headerIndex] || []
    );

    setSelectedSheet(sheetName);
    setSheetRows(rows);
    setHeaderRowIndex(headerIndex);
    setHeaders(detectedHeaders);
    setColumnMapping(createColumnMapping(detectedHeaders));
    setImportPreview([]);
    setImportWarnings([]);
    setImportSkipped(0);
  };

  const handleExcelFile = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    clearMessages();

    const extension =
      "." + file.name.split(".").pop().toLowerCase();

    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setError("Please select an Excel or CSV file.");
      event.target.value = "";
      return;
    }

    if (!file.size || file.size > MAX_FILE_SIZE) {
      setError("File must be smaller than 15 MB.");
      event.target.value = "";
      return;
    }

    setImporting(true);

    try {
      const buffer = await file.arrayBuffer();

      const workbook = XLSX.read(buffer, {
        type: "array",
        cellDates: false,
      });

      if (!workbook.SheetNames.length) {
        throw new Error("The spreadsheet has no worksheets.");
      }

      workbookRef.current = workbook;
      setExcelFile(file);
      setWorkbookSheets(workbook.SheetNames);

      loadSheet(workbook, workbook.SheetNames[0]);

      setSuccess(
        `Loaded "${file.name}". Review column mapping, then preview appointments.`
      );
    } catch (err) {
      clearExcel();
      setError(
        err?.message || "Unable to read the Excel file."
      );
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  const changeSheet = (sheetName) => {
    if (!workbookRef.current) return;

    loadSheet(workbookRef.current, sheetName);
    clearMessages();
  };

  const changeHeaderRow = (value) => {
    const index = Number(value);

    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= sheetRows.length
    ) {
      return;
    }

    const nextHeaders = makeColumnHeaders(
      sheetRows[index] || []
    );

    setHeaderRowIndex(index);
    setHeaders(nextHeaders);
    setColumnMapping(createColumnMapping(nextHeaders));
    setImportPreview([]);
    setImportWarnings([]);
  };

  const updateMapping = (index, field) => {
    setColumnMapping((previous) =>
      previous.map((value, i) => {
        if (i === index) return field;
        if (field && value === field) return "";
        return value;
      })
    );

    setImportPreview([]);
    setImportWarnings([]);
  };

  const previewExcel = () => {
    clearMessages();

    if (!therapist || !validDate(date)) {
      setError("Select a therapist and schedule date first.");
      return;
    }

    if (!columnMapping.includes("patient_name")) {
      setError("Map a column to Patient Name.");
      return;
    }

    if (!columnMapping.includes("time")) {
      setError("Map a column to Appointment Time.");
      return;
    }

    const result = parseImportRows(
      sheetRows,
      columnMapping,
      headerRowIndex,
      excelFile?.name || "",
      selectedSheet,
      date,
      therapist,
      selectedTherapistName
    );

    if (result.appointments.length > MAX_APPOINTMENTS) {
      setError(
        `This worksheet contains ${result.appointments.length} appointments. ` +
        `The maximum is ${MAX_APPOINTMENTS}.`
      );
      return;
    }

    setImportPreview(result.appointments);
    setImportWarnings(result.warnings);
    setImportSkipped(result.skipped);

    setSuccess(
      `${result.appointments.length} appointments found. ` +
      `${result.warnings.length} row(s) require review.`
    );
  };

  const addPreviewToDraft = () => {
    if (!importPreview.length) {
      setError("Preview the Excel file first.");
      return;
    }

    if (appointments.length + importPreview.length > MAX_APPOINTMENTS) {
      setError(
        "Import exceeds the maximum of 200 appointments."
      );
      return;
    }

    const mismatched = importPreview.filter(
      (row) =>
        row.import_warnings.some(
          (warning) =>
            warning.startsWith("Date ") ||
            warning.startsWith("Appointment date") ||
            warning.startsWith("Therapist ")
        )
    );

    if (mismatched.length) {
      setError(
        `${mismatched.length} appointment(s) have an uncertain or mismatched ` +
        "date/therapist. Correct the source file or mapping before importing."
      );
      return;
    }

    const accepted = window.confirm(
      `Add ${importPreview.length} appointments to the draft?\n\n` +
      "Appointments will NOT be saved until you select Save Changes.\n\n" +
      "Check for existing appointments to avoid importing the same booking twice."
    );

    if (!accepted) return;

    setAppointments((previous) => [
      ...previous,
      ...importPreview,
    ]);

    setHasDraft(true);
    setImportPreview([]);

    setSuccess(
      "Excel appointments added to the draft. Review and save them."
    );
    setError("");
  };

  // ==========================================================
  // MANUAL APPOINTMENT EDITING
  // ==========================================================

  const addAppointment = () => {
    if (!therapist || !validDate(date)) {
      setError("Select therapist and date first.");
      return;
    }

    if (appointments.length >= MAX_APPOINTMENTS) {
      setError("Maximum 200 appointments allowed.");
      return;
    }

    setEditingAppointment(emptyAppointment());
    clearMessages();
  };

  const editAppointment = (row) => {
    setEditingAppointment({
      ...row,
      isDirty: true,
    });

    clearMessages();
  };

  const saveEditorToDraft = () => {
    if (!editingAppointment) return;

    const validation = validateAppointment(editingAppointment);

    if (validation) {
      setError(validation);
      return;
    }

    const updated = {
      ...editingAppointment,
      import_warnings: [],
    };

    setAppointments((previous) => {
      const found = previous.some(
        (row) => row.localId === updated.localId
      );

      if (found) {
        return previous.map((row) =>
          row.localId === updated.localId ? updated : row
        );
      }

      return [...previous, updated];
    });

    setHasDraft(true);
    setEditingAppointment(null);
    setSuccess("Changes applied to draft.");
    setError("");
  };

  const removeDraftAppointment = (row) => {
    if (row.id) {
      setError(
        "Saved appointments cannot be deleted here. " +
        "Change their status to Cancelled."
      );
      return;
    }

    if (!window.confirm("Remove this unsaved appointment?")) {
      return;
    }

    setAppointments((previous) =>
      previous.filter((item) => item.localId !== row.localId)
    );

    setHasDraft(true);
  };

  // ==========================================================
  // PATIENT SEARCH
  // ==========================================================

  const openPatientSearch = () => {
    if (!editingAppointment) return;

    setPatientSearchTarget(editingAppointment.localId);
    setPatientQuery(editingAppointment.patient_name || "");
    setPatientMatches([]);
    setPatientSearchOpen(true);
  };

  const findPatient = async () => {
    const query = patientQuery.trim();

    if (query.length < 2) {
      setPatientMatches([]);
      return;
    }

    const requestId = ++patientRequestRef.current;

    setSearchingPatients(true);
    setError("");

    try {
      const response = await api.get(`${API}patients/`, {
        params: { q: query },
        timeout: 30000,
      });

      if (requestId !== patientRequestRef.current) return;

      setPatientMatches(
        Array.isArray(response.data?.matches)
          ? response.data.matches
          : []
      );
    } catch (err) {
      if (requestId === patientRequestRef.current) {
        setError(errorMessage(err, "Patient search failed."));
      }
    } finally {
      if (requestId === patientRequestRef.current) {
        setSearchingPatients(false);
      }
    }
  };

  const selectPatient = (patient) => {
    if (
      !editingAppointment ||
      editingAppointment.localId !== patientSearchTarget
    ) {
      return;
    }

    setEditingAppointment((previous) => ({
      ...previous,
      patient_id: patient.id,
      patient_name: patient.name,
      file_number:
        patient.file_number || patient.patient_id || "",
      matched: true,
      isDirty: true,
    }));

    setPatientSearchOpen(false);
    setPatientMatches([]);
    setPatientQuery("");
    setPatientSearchTarget(null);
  };

  const closePatientSearch = () => {
    patientRequestRef.current++;
    setPatientSearchOpen(false);
    setPatientMatches([]);
    setPatientSearchTarget(null);
    setSearchingPatients(false);
  };

  // ==========================================================
  // SAVE TO DJANGO
  // ==========================================================

  const saveAppointments = async () => {
    if (!therapist || !validDate(date)) {
      setError("Select a therapist and date.");
      return;
    }

    const changed = appointments.filter(
      (row) => row.isNew || row.isDirty
    );

    if (!changed.length) {
      setSuccess("No unsaved changes.");
      return;
    }

    for (let i = 0; i < changed.length; i++) {
      const validation = validateAppointment(changed[i]);

      if (validation) {
        setError(
          `${changed[i].patient_name || `Appointment ${i + 1}`}: ` +
          validation
        );
        return;
      }
    }

    const accepted = window.confirm(
      `Save ${changed.length} appointment change(s) for ` +
      `${selectedTherapistName} on ${date}?\n\n` +
      "This action writes to the Django database."
    );

    if (!accepted) return;

    setSaving(true);
    clearMessages();

    let completed = 0;
    const savedIds = [];

    try {
      for (const row of changed) {
        const payload = payloadForAppointment(
          row,
          therapist,
          date
        );

        let response;

        if (row.id && !row.isNew) {
          response = await api.patch(
            `${API}appointments/${row.id}/`,
            payload,
            {
              timeout: 30000,
              withCredentials: true,
            }
          );
        } else {
          response = await api.post(
            `${API}appointments/`,
            payload,
            {
              timeout: 30000,
              withCredentials: true,
            }
          );
        }

        const returnedId =
          response.data?.appointment?.id ??
          response.data?.id ??
          row.id;

        savedIds.push({
          localId: row.localId,
          id: returnedId,
        });

        completed++;
      }

      setHasDraft(false);

      // Load the authoritative saved records.
      try {
        const response = await api.get(`${API}list/`, {
          params: { therapist, date },
          timeout: 30000,
        });

        setAppointments(
          extractRows(response.data).map((row) =>
            normalizeAppointment(row, true)
          )
        );

        setLoadedSchedule(true);

        setSuccess(
          `${completed} appointment change(s) saved successfully.`
        );
      } catch (reloadError) {
        // Do not claim that the database save failed
        // when only the reload failed.
        setAppointments((previous) =>
          previous.map((row) => {
            const saved = savedIds.find(
              (item) => item.localId === row.localId
            );

            if (!saved) return row;

            return {
              ...row,
              id: saved.id,
              isNew: false,
              isDirty: false,
            };
          })
        );

        setSuccess(
          `${completed} changes saved, but schedule refresh failed. ` +
          "Reload the schedule to verify saved records."
        );
      }
    } catch (err) {
      setError(
        `${completed} of ${changed.length} changes completed. ` +
        errorMessage(err) +
        " Some changes may have reached the server. " +
        "Reload the schedule before retrying to avoid duplicates."
      );

      // Avoid allowing an immediate repeat submission.
      setHasDraft(false);
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // HISTORY
  // ==========================================================

  const loadHistory = async () => {
    if (!therapist || !validDate(date)) return;

    const requestId = ++historyRequestRef.current;

    setLoadingHistory(true);

    try {
      const response = await api.get(`${API}list/`, {
        params: { therapist, date },
        timeout: 30000,
      });

      if (requestId !== historyRequestRef.current) return;

      setHistoryAppointments(
        extractRows(response.data).map((row) =>
          normalizeAppointment(row, true)
        )
      );
    } catch (err) {
      if (requestId === historyRequestRef.current) {
        setError(errorMessage(err, "Unable to load history."));
      }
    } finally {
      if (requestId === historyRequestRef.current) {
        setLoadingHistory(false);
      }
    }
  };

  const loadAlerts = async () => {
    setLoadingAlerts(true);
    setAlertsError("");

    try {
      const response = await api.get(`${API}alerts/`, {
        timeout: 30000,
      });

      const rows = Array.isArray(response.data?.alerts)
        ? response.data.alerts
        : extractRows(response.data);

      setAlerts(
        rows.map((row) => normalizeAppointment(row, true))
      );
    } catch (err) {
      setAlerts([]);
      setAlertsError(
        errorMessage(err, "Unable to load call center alerts.")
      );
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history" && therapist && date) {
      loadHistory();
    }
  }, [activeTab, therapist, date]);

  useEffect(() => {
    if (activeTab === "history") {
      loadAlerts();
    }
  }, [activeTab]);

  const openDetails = async (row) => {
    const requestId = ++detailsRequestRef.current;

    setDetailsAppointment(row);
    setDetailsHistory(normalizeHistory(row.history));

    if (!row.id) return;

    try {
      const response = await api.get(
        `${API}appointments/${row.id}/history/`,
        { timeout: 30000 }
      );

      if (requestId !== detailsRequestRef.current) return;

      const entries =
        response.data?.history ||
        response.data?.events ||
        [];

      if (Array.isArray(entries)) {
        setDetailsHistory(normalizeHistory(entries));
      }
    } catch (err) {
      // Existing history remains visible.
    }
  };

  const recordCallAttempt = async (row) => {
    if (!row.id) {
      setError("Save this appointment first.");
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
      setError(
        errorMessage(err, "Unable to record call attempt.")
      );
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="csu-root">
      <style>{styles}</style>

      <header className="csu-hero">
        <div>
          <small>CALL CENTER OPERATIONS</small>
          <h2>Therapist Scheduling</h2>
          <p>
            Import Excel schedules, confirm appointments,
            and track patient communications.
          </p>
        </div>

        <span className="csu-hero-icon">📅</span>
      </header>

      <div className="csu-tabs">
        <button
          type="button"
          className={activeTab === "create" ? "active" : ""}
          onClick={() => changeTab("create")}
        >
          Create Schedule
        </button>

        <button
          type="button"
          className={activeTab === "history" ? "active" : ""}
          onClick={() => changeTab("history")}
        >
          Schedule History
        </button>
      </div>

      {error && (
        <div className="csu-alert error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="csu-alert success" role="status">
          {success}
        </div>
      )}

      <section className="csu-panel">
        <div className="csu-section-header">
          <h3>Therapist and Schedule Date</h3>
        </div>

        <div className="csu-form-grid">
          <label>
            Therapist
            <select
              value={therapist}
              disabled={busy}
              onChange={(e) =>
                changeTherapist(e.target.value)
              }
            >
              <option value="">
                {loadingTherapists
                  ? "Loading therapists..."
                  : "Select therapist"}
              </option>

              {therapistOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Schedule Date
            <input
              type="date"
              value={date}
              disabled={busy}
              onChange={(e) => changeDate(e.target.value)}
            />
          </label>

          <button
            type="button"
            className="csu-secondary"
            disabled={!therapist || busy}
            onClick={
              activeTab === "create"
                ? loadSchedule
                : loadHistory
            }
          >
            {loading || loadingHistory
              ? "Loading..."
              : activeTab === "create"
              ? "Load Schedule"
              : "Refresh History"}
          </button>
        </div>

        {hasDraft && activeTab === "create" && (
          <p className="csu-note csu-draft">
            You have unsaved appointment changes.
          </p>
        )}
      </section>

      {activeTab === "create" && (
        <>
          {/* ================================================
              EXCEL IMPORT
          ================================================ */}

          <section className="csu-panel">
            <div className="csu-section-header">
              <h3>Import Appointments from Excel</h3>

              <button
                type="button"
                className="csu-secondary"
                disabled={busy}
                onClick={clearExcel}
              >
                Clear File
              </button>
            </div>

            <p className="csu-note">
              Import a daily schedule from Concepts using
              Excel or CSV. Appointment information will be
              reviewed before saving to Django.
            </p>

            <div className="csu-upload">
              <span>📊</span>
              <strong>Select Excel Schedule</strong>
              <p>
                Supported formats: XLSX, XLS, CSV.
                Maximum file size: 15 MB.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                disabled={busy}
                onChange={handleExcelFile}
              />
            </div>

            {excelFile && (
              <>
                <div className="csu-file-info">
                  <strong>{excelFile.name}</strong>
                  <span>
                    {(excelFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>

                <div className="csu-form-grid">
                  <label>
                    Worksheet
                    <select
                      value={selectedSheet}
                      onChange={(e) =>
                        changeSheet(e.target.value)
                      }
                    >
                      {workbookSheets.map((sheet) => (
                        <option key={sheet} value={sheet}>
                          {sheet}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Header Row
                    <select
                      value={headerRowIndex}
                      onChange={(e) =>
                        changeHeaderRow(e.target.value)
                      }
                    >
                      {sheetRows
                        .slice(0, Math.min(20, sheetRows.length))
                        .map((_, index) => (
                          <option key={index} value={index}>
                            Row {index + 1}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>

                <h4>Column Mapping</h4>

                <p className="csu-note">
                  Check that each Excel column is assigned
                  to the correct appointment field.
                </p>

                <div className="csu-mapping-grid">
                  {headers.map((header, index) => (
                    <label key={index}>
                      <span title={header}>{header}</span>

                      <select
                        value={columnMapping[index] || ""}
                        onChange={(e) =>
                          updateMapping(index, e.target.value)
                        }
                      >
                        {FIELD_OPTIONS.map((field) => (
                          <option
                            key={field.value}
                            value={field.value}
                          >
                            {field.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>

                <div className="csu-actions">
                  <button
                    type="button"
                    className="csu-primary"
                    disabled={busy || !therapist}
                    onClick={previewExcel}
                  >
                    Preview Appointments
                  </button>
                </div>
              </>
            )}
          </section>

          {/* ================================================
              IMPORT PREVIEW
          ================================================ */}

          {importPreview.length > 0 && (
            <section className="csu-panel">
              <div className="csu-section-header">
                <h3>Excel Import Preview</h3>

                <span className="csu-count">
                  {importPreview.length} appointments
                </span>
              </div>

              <div className="csu-preview-summary">
                <div>
                  <strong>{importPreview.length}</strong>
                  <span>Appointments</span>
                </div>

                <div>
                  <strong>{previewErrors}</strong>
                  <span>Missing Required Details</span>
                </div>

                <div>
                  <strong>{importWarnings.length}</strong>
                  <span>Rows With Warnings</span>
                </div>

                <div>
                  <strong>{importSkipped}</strong>
                  <span>Skipped Rows</span>
                </div>
              </div>

              <div className="csu-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Excel Row</th>
                      <th>Time</th>
                      <th>Patient</th>
                      <th>File Number</th>
                      <th>Status</th>
                      <th>Type</th>
                      <th>Validation</th>
                    </tr>
                  </thead>

                  <tbody>
                    {importPreview.map((row) => (
                      <tr key={row.localId}>
                        <td>{row.import_row}</td>

                        <td>
                          {validTime(row.time) ? (
                            row.time
                          ) : (
                            <span className="csu-invalid">
                              Missing time
                            </span>
                          )}
                        </td>

                        <td>{row.patient_name}</td>

                        <td>{row.file_number || "—"}</td>

                        <td>
                          <StatusBadge
                            status={row.confirmation_status}
                          />
                        </td>

                        <td>
                          <TypeBadge
                            type={row.appointment_type}
                          />
                        </td>

                        <td>
                          {row.import_warnings.length ? (
                            <span
                              className="csu-invalid"
                              title={row.import_warnings.join("; ")}
                            >
                              Review
                            </span>
                          ) : (
                            <span className="csu-saved-label">
                              Ready
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {importWarnings.length > 0 && (
                <div className="csu-warning-panel">
                  <h4>Import Warnings</h4>

                  <ul>
                    {importWarnings.slice(0, 30).map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>

                  {importWarnings.length > 30 && (
                    <p className="csu-note">
                      Additional warnings are not displayed.
                    </p>
                  )}
                </div>
              )}

              <div className="csu-actions">
                <button
                  type="button"
                  className="csu-primary"
                  disabled={busy}
                  onClick={addPreviewToDraft}
                >
                  Add {importPreview.length} to Draft
                </button>

                <button
                  type="button"
                  className="csu-secondary"
                  onClick={() => setImportPreview([])}
                >
                  Cancel Preview
                </button>
              </div>

              <p className="csu-note">
                Adding to draft does not save appointments.
                Correct missing times and review imported
                records before selecting Save Changes.
              </p>
            </section>
          )}

          {/* ================================================
              MANUAL ENTRY
          ================================================ */}

          <section className="csu-panel">
            <div className="csu-section-header">
              <h3>Manual Appointment Entry</h3>

              <button
                type="button"
                className="csu-primary"
                disabled={!therapist || busy}
                onClick={addAppointment}
              >
                + New Appointment
              </button>
            </div>

            <p className="csu-note">
              Add appointments manually or edit imported
              records before saving.
            </p>
          </section>

          {/* ================================================
              STATISTICS
          ================================================ */}

          <div className="csu-stats">
            {[
              ["Total", totals.total],
              ["Confirmed", totals.confirmed],
              ["Unconfirmed", totals.unconfirmed],
              ["No Answer", totals.no_answer],
              ["Phone Off", totals.phone_off],
              ["Cancelled", totals.cancelled],
              ["Rescheduled", totals.rescheduled],
              ["Evaluations", totals.evaluations],
            ].map(([label, value]) => (
              <div className="csu-stat" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          {/* ================================================
              APPOINTMENT TABLE
          ================================================ */}

          <section className="csu-panel">
            <div className="csu-section-header">
              <h3>Therapist Appointments</h3>

              <button
                type="button"
                className="csu-primary"
                disabled={!changedCount || busy}
                onClick={saveAppointments}
              >
                {saving
                  ? "Saving..."
                  : `Save Changes (${changedCount})`}
              </button>
            </div>

            {totals.missingTime > 0 && (
              <div className="csu-alert error">
                {totals.missingTime} appointment(s) have
                missing or invalid times. Edit these
                appointments before saving.
              </div>
            )}

            <div className="csu-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Patient</th>
                    <th>File Number</th>
                    <th>Status</th>
                    <th>Type</th>
                    <th>Record</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {sortedAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="csu-empty">
                        No appointments loaded. Import an Excel
                        file, load a schedule, or add manually.
                      </td>
                    </tr>
                  ) : (
                    sortedAppointments.map((row) => (
                      <tr
                        key={row.localId}
                        style={{
                          borderLeft:
                            `5px solid ${
                              STATUS_COLORS[row.confirmation_status]
                            }`,
                        }}
                      >
                        <td>
                          {validTime(row.time) ? (
                            <strong>{row.time}</strong>
                          ) : (
                            <span className="csu-invalid">
                              Missing time
                            </span>
                          )}
                        </td>

                        <td>{row.patient_name}</td>

                        <td>
                          {row.file_number || (
                            <span className="csu-muted">
                              Not matched
                            </span>
                          )}
                        </td>

                        <td>
                          <StatusBadge
                            status={row.confirmation_status}
                          />
                        </td>

                        <td>
                          <TypeBadge
                            type={row.appointment_type}
                          />
                        </td>

                        <td>
                          {row.isNew ? (
                            <span className="csu-draft-label">
                              New / Unsaved
                            </span>
                          ) : row.isDirty ? (
                            <span className="csu-draft-label">
                              Modified
                            </span>
                          ) : (
                            <span className="csu-saved-label">
                              Saved
                            </span>
                          )}
                        </td>

                        <td>
                          <div className="csu-row-actions">
                            <button
                              type="button"
                              className="csu-secondary"
                              disabled={busy}
                              onClick={() => editAppointment(row)}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="csu-secondary"
                              onClick={() => openDetails(row)}
                            >
                              Details
                            </button>

                            {row.isNew && (
                              <button
                                type="button"
                                className="csu-remove"
                                disabled={busy}
                                onClick={() =>
                                  removeDraftAppointment(row)
                                }
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {loadedSchedule && (
              <p className="csu-note">
                Existing appointments loaded from Django.
                Editing preserves their database IDs.
              </p>
            )}
          </section>
        </>
      )}

      {/* ======================================================
          SCHEDULE HISTORY
      ====================================================== */}

      {activeTab === "history" && (
        <>
          <section className="csu-panel">
            <div className="csu-section-header">
              <h3>Appointment Status History</h3>

              <span className="csu-count">
                {filteredHistory.length} appointments
              </span>
            </div>

            <div className="csu-form-grid">
              <label>
                Filter by Status
                <select
                  value={historyFilter}
                  onChange={(e) =>
                    setHistoryFilter(e.target.value)
                  }
                >
                  <option value="all">All statuses</option>

                  {STATUS_OPTIONS.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Search Patient / File Number
                <input
                  value={historyQuery}
                  onChange={(e) =>
                    setHistoryQuery(e.target.value)
                  }
                  placeholder="Search..."
                />
              </label>
            </div>

            <div className="csu-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Patient</th>
                    <th>File Number</th>
                    <th>Status</th>
                    <th>Type</th>
                    <th>Details</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="csu-empty">
                        {loadingHistory
                          ? "Loading..."
                          : "No appointments found."}
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((row) => (
                      <tr key={row.localId}>
                        <td>{row.time}</td>
                        <td>{row.patient_name}</td>
                        <td>{row.file_number || "—"}</td>

                        <td>
                          <StatusBadge
                            status={row.confirmation_status}
                          />
                        </td>

                        <td>
                          <TypeBadge
                            type={row.appointment_type}
                          />
                        </td>

                        <td>
                          <button
                            type="button"
                            className="csu-secondary"
                            onClick={() => openDetails(row)}
                          >
                            View History
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* ================================================
              INTERNAL ALERTS
          ================================================ */}

          <section className="csu-panel">
            <div className="csu-section-header">
              <h3>Internal Call Center Alerts</h3>

              <button
                type="button"
                className="csu-secondary"
                disabled={loadingAlerts}
                onClick={loadAlerts}
              >
                {loadingAlerts ? "Loading..." : "Refresh"}
              </button>
            </div>

            <p className="csu-note">
              Unconfirmed, No Answer, and Phone Off
              appointments require follow-up calls.
              No SMS or WhatsApp messages are sent.
            </p>

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
                {followUpAlerts.map((row) => (
                  <div
                    className="csu-alert-item"
                    key={row.id || row.localId}
                  >
                    <div>
                      <strong>{row.patient_name}</strong>

                      <p>
                        {row.appointment_date || row.date || ""}
                        {" · "}
                        {row.time}
                        {" · "}
                        {row.therapist || ""}
                      </p>

                      <StatusBadge
                        status={row.confirmation_status}
                      />

                      <small>
                        Call attempts: {row.second_call_attempts}
                      </small>
                    </div>

                    <button
                      type="button"
                      className="csu-secondary"
                      onClick={() => recordCallAttempt(row)}
                    >
                      Record Call Attempt
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* ======================================================
          APPOINTMENT EDITOR
      ====================================================== */}

      {editingAppointment && (
        <div className="csu-modal-backdrop">
          <div
            className="csu-modal csu-modal-wide"
            role="dialog"
            aria-modal="true"
            aria-label="Edit appointment"
          >
            <div className="csu-section-header">
              <h3>
                {editingAppointment.id
                  ? "Edit Appointment"
                  : "Create Appointment"}
              </h3>

              <button
                type="button"
                className="csu-close"
                onClick={() => setEditingAppointment(null)}
              >
                ×
              </button>
            </div>

            <p className="csu-note">
              Therapist: <strong>{selectedTherapistName}</strong>
              {" · "}
              Date: <strong>{date}</strong>
            </p>

            <AppointmentFields
              appointment={editingAppointment}
              disabled={saving}
              onChange={setEditingAppointment}
              onFindPatient={openPatientSearch}
            />

            <div className="csu-actions">
              <button
                type="button"
                className="csu-primary"
                disabled={saving}
                onClick={saveEditorToDraft}
              >
                Apply Changes
              </button>

              <button
                type="button"
                className="csu-secondary"
                onClick={() => setEditingAppointment(null)}
              >
                Cancel
              </button>
            </div>

            <p className="csu-note">
              Apply Changes updates the draft only.
              Select Save Changes to persist in Django.
            </p>
          </div>
        </div>
      )}

      {/* ======================================================
          PATIENT SEARCH
      ====================================================== */}

      {patientSearchOpen && (
        <div className="csu-modal-backdrop csu-modal-top">
          <div
            className="csu-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Find patient"
          >
            <div className="csu-section-header">
              <h3>Find Existing Patient</h3>

              <button
                type="button"
                className="csu-close"
                onClick={closePatientSearch}
              >
                ×
              </button>
            </div>

            <p className="csu-note">
              Search by patient name or hospital file number.
            </p>

            <div className="csu-search-row">
              <input
                autoFocus
                value={patientQuery}
                onChange={(e) =>
                  setPatientQuery(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") findPatient();
                }}
                placeholder="Patient name or file number"
              />

              <button
                type="button"
                className="csu-primary"
                disabled={searchingPatients}
                onClick={findPatient}
              >
                {searchingPatients ? "Searching..." : "Search"}
              </button>
            </div>

            <div className="csu-matches">
              {patientMatches.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => selectPatient(patient)}
                >
                  <strong>{patient.name}</strong>

                  <span>
                    File:{" "}
                    {patient.file_number ||
                      patient.patient_id ||
                      "N/A"}
                  </span>
                </button>
              ))}
            </div>

            {!searchingPatients &&
              patientMatches.length === 0 && (
                <p className="csu-note">
                  Enter at least two characters and search.
                </p>
              )}
          </div>
        </div>
      )}

      {/* ======================================================
          APPOINTMENT DETAILS
      ====================================================== */}

      {detailsAppointment && (
        <div className="csu-modal-backdrop">
          <div
            className="csu-modal csu-modal-wide"
            role="dialog"
            aria-modal="true"
            aria-label="Appointment details"
          >
            <div className="csu-section-header">
              <h3>Appointment Details</h3>

              <button
                type="button"
                className="csu-close"
                onClick={() => setDetailsAppointment(null)}
              >
                ×
              </button>
            </div>

            <div className="csu-detail-grid">
              <div>
                <small>Patient</small>
                <strong>{detailsAppointment.patient_name}</strong>
              </div>

              <div>
                <small>File Number</small>
                <strong>
                  {detailsAppointment.file_number || "Not matched"}
                </strong>
              </div>

              <div>
                <small>Therapist</small>
                <strong>
                  {detailsAppointment.therapist ||
                    selectedTherapistName}
                </strong>
              </div>

              <div>
                <small>Date and Time</small>
                <strong>
                  {detailsAppointment.appointment_date ||
                    detailsAppointment.date ||
                    date}
                  {" · "}
                  {detailsAppointment.time || "Missing time"}
                </strong>
              </div>

              <div>
                <small>Status</small>
                <StatusBadge
                  status={detailsAppointment.confirmation_status}
                />
              </div>

              <div>
                <small>Type</small>
                <TypeBadge
                  type={detailsAppointment.appointment_type}
                />
              </div>
            </div>

            {detailsAppointment.import_file && (
              <div className="csu-detail-note">
                <strong>Imported From</strong>
                <p>
                  {detailsAppointment.import_file}
                  {" · "}
                  {detailsAppointment.import_sheet}
                  {" · Row "}
                  {detailsAppointment.import_row}
                </p>
              </div>
            )}

            {detailsAppointment.notes && (
              <div className="csu-detail-note">
                <strong>Notes</strong>
                <p>{detailsAppointment.notes}</p>
              </div>
            )}

            {detailsAppointment.confirmation_status ===
              "rescheduled" && (
              <div className="csu-detail-note">
                <strong>Rescheduled To</strong>
                <p>
                  {detailsAppointment.rescheduled_to_date || "—"}
                  {" · "}
                  {detailsAppointment.rescheduled_to_time || "—"}
                </p>
              </div>
            )}

            <h4>Change History</h4>

            {detailsHistory.length === 0 ? (
              <p className="csu-note">
                No audit events were returned.
              </p>
            ) : (
              <div className="csu-timeline">
                {[...detailsHistory]
                  .sort(
                    (a, b) =>
                      new Date(b.created_at || 0) -
                      new Date(a.created_at || 0)
                  )
                  .map((event) => (
                    <div
                      className="csu-timeline-item"
                      key={event.id}
                    >
                      <div className="csu-timeline-dot" />

                      <div>
                        <strong>{event.action}</strong>

                        {event.new_status && (
                          <p>
                            {event.old_status
                              ? `${statusLabel(event.old_status)} → `
                              : ""}
                            {statusLabel(event.new_status)}
                          </p>
                        )}

                        {event.note && <p>{event.note}</p>}

                        <small>
                          {event.changed_by}
                          {" · "}
                          {formatDateTime(event.created_at)}
                        </small>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            <div className="csu-actions">
              {activeTab === "create" && (
                <button
                  type="button"
                  className="csu-primary"
                  onClick={() => {
                    const row = detailsAppointment;
                    setDetailsAppointment(null);
                    editAppointment(row);
                  }}
                >
                  Edit Appointment
                </button>
              )}

              <button
                type="button"
                className="csu-secondary"
                onClick={() => setDetailsAppointment(null)}
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
  background: linear-gradient(120deg,#172b4d,#355a91);
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
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  margin-bottom: 18px;
  min-width: 0;
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

.csu-file-info span {
  color: #64748b;
}

.csu-mapping-grid {
  display: grid;
  grid-template-columns: repeat(3,minmax(0,1fr));
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
  grid-template-columns: repeat(4,minmax(0,1fr));
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
  grid-template-columns: repeat(4,minmax(0,1fr));
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

.csu-table-wrap {
  width: 100%;
  overflow-x: auto;
}

.csu-table-wrap table {
  width: 100%;
  min-width: 900px;
  border-collapse: collapse;
}

.csu-table-wrap th,
.csu-table-wrap td {
  padding: 12px;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  font-size: 12px;
}

.csu-table-wrap th {
  background: #f8fafc;
  color: #475569;
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

.csu-draft-label {
  color: #b45309;
  font-weight: 700;
}

.csu-saved-label {
  color: #047857;
  font-weight: 700;
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
  background: #f1f5f9;
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
  grid-template-columns: repeat(2,minmax(0,1fr));
  gap: 15px;
}

.csu-full-width {
  grid-column: 1 / -1;
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
  grid-template-columns: repeat(2,minmax(0,1fr));
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

.csu-detail-note {
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 9px;
  font-size: 12px;
}

.csu-detail-note p {
  margin-bottom: 0;
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

.csu-timeline-dot {
  position: absolute;
  left: -19px;
  top: 3px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #be185d;
  border: 2px solid white;
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

@media(max-width:900px) {
  .csu-stats,
  .csu-preview-summary {
    grid-template-columns: repeat(2,minmax(0,1fr));
  }

  .csu-mapping-grid {
    grid-template-columns: repeat(2,minmax(0,1fr));
  }
}

@media(max-width:600px) {
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


import * as XLSX from "xlsx";

// ============================================================
// CONFIGURATION
// ============================================================

export const API = "/physio/schedule/";

export const MAX_FILE_SIZE = 15 * 1024 * 1024;
export const MAX_APPOINTMENTS = 500;

export const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv"];

export const STATUS_OPTIONS = [
  { value: "unconfirmed", label: "Unconfirmed" },
  { value: "confirmed", label: "Confirmed" },
  { value: "no_answer", label: "No Answer" },
  { value: "phone_off", label: "Phone Off" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rescheduled", label: "Rescheduled" },
];

export const STATUS_COLORS = {
  unconfirmed: "#D6B36A",
  confirmed: "#F1D84D",
  no_answer: "#E7A65A",
  phone_off: "#9CA3AF",
  cancelled: "#D96A6A",
  rescheduled: "#72A8D8",
};

export const FOLLOW_UP_STATUSES = new Set([
  "unconfirmed",
  "no_answer",
  "phone_off",
]);

export const IMPORT_STATUS_OPTIONS = [
  { value: "confirmed", label: "Confirmed" },
  { value: "unconfirmed", label: "Unconfirmed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rescheduled", label: "Rescheduled" },
];

export const IMPORT_APPROVAL_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export const FIELD_OPTIONS = [
  { value: "", label: "Do not import" },
  { value: "patient_name", label: "Patient Name" },
  { value: "file_number", label: "File Number" },
  { value: "time", label: "Appointment Time" },
  { value: "start", label: "Start (Date + Time)" },
  { value: "date", label: "Appointment Date" },
  { value: "therapist", label: "Therapist" },
  { value: "confirmation_status", label: "Status" },
  { value: "appointment_type", label: "Appointment Type" },
  { value: "notes", label: "Notes" },
];

export const FIELD_ALIASES = {
  patient_name: [
    "patient",
    "patient name",
    "patientname",
    "name",
    "full name",
    "patient full name",
    "subject",
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
    "code 1",
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
  start: [
    "start",
    "start datetime",
    "appointment start",
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
    "contacts",
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

export function today() {
  const d = new Date();

  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export function newLocalId() {
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

export function cleanText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function normalizeHeader(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[_\-./:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function validTime(value) {
  if (!/^\d{2}:\d{2}$/.test(value || "")) return false;

  const [hour, minute] = value.split(":").map(Number);

  return (
    hour >= 0 &&
    hour <= 23 &&
    minute >= 0 &&
    minute <= 59
  );
}

export function normalizeTime(value) {
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

  const hourOnly = text.match(/^(\d{1,2})\s*(AM|PM)$/i);

  if (hourOnly) {
    let hour = Number(hourOnly[1]);

    if (hour < 1 || hour > 12) return "";

    hour %= 12;

    if (hourOnly[2].toUpperCase() === "PM") hour += 12;

    return String(hour).padStart(2, "0") + ":00";
  }

  if (/^0\.\d+$/.test(text)) {
    return normalizeTime(Number(text));
  }

  return "";
}

export function validDate(value) {
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

export function normalizeDate(value) {
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

export function normalizeStatus(value) {
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

export function normalizeType(value) {
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

export function statusLabel(value) {
  return (
    STATUS_OPTIONS.find((item) => item.value === value)?.label ||
    value ||
    "Unknown"
  );
}

export function formatDateTime(value) {
  if (!value) return "Not recorded";

  const d = new Date(value);

  return Number.isNaN(d.getTime())
    ? String(value)
    : d.toLocaleString();
}

export function normalizeTherapists(items) {
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

export function normalizeHistory(items) {
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

export function emptyAppointment() {
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

export function normalizeAppointment(row = {}, published = false) {
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

export function extractRows(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.appointments)) return data.appointments;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export function errorMessage(err, fallback = "Request failed.") {
  const status = err?.response?.status;
  const data = err?.response?.data;

  if (status === 401) return "Please log in again.";
  if (status === 403) return "Access denied or CSRF token invalid.";
  if (status === 404) return "The required Django API endpoint is unavailable.";
  if (status === 413) return "The request exceeds the server size limit.";

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

export function guessField(header) {
  const normalized = normalizeHeader(header);

  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (
      aliases.some(
        (alias) => normalizeHeader(alias) === normalized
      )
    ) {
      return field;
    }
  }

  return "";
}

export function detectHeaderRow(rows) {
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

export function makeColumnHeaders(row) {
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

export function createColumnMapping(headers) {
  const assigned = new Set();

  return headers.map((header) => {
    const field = guessField(header);

    if (!field || assigned.has(field)) return "";

    assigned.add(field);
    return field;
  });
}

export function isAdministrativeRow(name) {
  const text = normalizeHeader(name);

  if (!text) return false;

  return (
    /^(duty time|duty tim|break time|lunch break|total appointments|schedule date|therapist name|appointment list|patient name|grand total)$/i.test(
      text
    ) ||
    text.includes("ask the therapist for double booking")
  );
}

export function normalizeStartDateTime(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return { date: "", time: "" };
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);

    if (!parsed) return { date: "", time: "" };

    const date = [
      parsed.y,
      String(parsed.m).padStart(2, "0"),
      String(parsed.d).padStart(2, "0"),
    ].join("-");

    const minutes = Math.round(
      (parsed.H || 0) * 60 +
      (parsed.M || 0) +
      (parsed.S || 0) / 60
    );

    const time =
      `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:` +
      String(minutes % 60).padStart(2, "0");

    return {
      date: validDate(date) ? date : "",
      time,
    };
  }

  if (
    value instanceof Date &&
    !Number.isNaN(value.getTime())
  ) {
    return {
      date: normalizeDate(value),
      time: normalizeTime(value),
    };
  }

  const raw = cleanText(value);

  const iso = raw.match(
    /^(\d{4}-\d{2}-\d{2})[T\s]+(.+)$/
  );

  if (iso) {
    return {
      date: normalizeDate(iso[1]),
      time: normalizeTime(iso[2]),
    };
  }

  const dmy = raw.match(
    /^(\d{1,2}[/-]\d{1,2}[/-]\d{4})[\s,]+(.+)$/
  );

  if (dmy) {
    return {
      date: normalizeDate(dmy[1]),
      time: normalizeTime(dmy[2]),
    };
  }

  return {
    date: normalizeDate(raw),
    time: normalizeTime(raw),
  };
}

export function appointmentDuplicateKeys(row) {
  const patient = normalizeHeader(row.patient_name || "");
  const file = normalizeHeader(row.file_number || "");
  const keys = [];

  if (patient) keys.push(`name:${patient}`);
  if (file) keys.push(`file:${file}`);

  return keys;
}

export function parseImportRows(
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

    if (
      cells.every((cell) => cleanText(cell) === "")
    ) {
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

    const startParts = normalizeStartDateTime(data.start);
    const time = normalizeTime(data.time) || startParts.time;
    const importedDate =
      normalizeDate(data.date) || startParts.date;
    const rawDate = cleanText(data.date || data.start);
    const importedTherapist = cleanText(data.therapist);

    const selectedTherapistKeys = [
      normalizeHeader(selectedTherapist),
      normalizeHeader(therapistLabel),
    ].filter(Boolean);

    const importedTherapistKey =
      normalizeHeader(importedTherapist);

    const therapistMatches = Boolean(
      importedTherapistKey &&
      selectedTherapistKeys.some(
        (selectedKey) =>
          importedTherapistKey === selectedKey ||
          importedTherapistKey.startsWith(`${selectedKey} `)
      )
    );

    if (!therapistMatches) {
      skipped++;
      continue;
    }

    const rowWarnings = [];

    if (!time) {
      rowWarnings.push(
        "Missing or invalid appointment time"
      );
    }

    if (rawDate && !importedDate) {
      rowWarnings.push(
        "Appointment date could not be interpreted"
      );
    }

    if (
      importedDate &&
      importedDate !== selectedDate
    ) {
      rowWarnings.push(
        `Date ${importedDate} differs from selected ${selectedDate}`
      );
    }

    const rawStatus = cleanText(
      data.confirmation_status
    );

    const rawType = cleanText(
      data.appointment_type
    );

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
        approval_status: "approved",
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

// ============================================================
// VALIDATION AND API PAYLOAD
// ============================================================

export function validateAppointment(row) {
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
      (option) =>
        option.value === row.confirmation_status
    )
  ) {
    return "Invalid appointment status.";
  }

  if (
    !["evaluation", "followup"].includes(
      row.appointment_type
    )
  ) {
    return "Invalid appointment type.";
  }

  if (row.confirmation_status === "rescheduled") {
    if (
      !validDate(row.rescheduled_to_date) ||
      !validTime(row.rescheduled_to_time)
    ) {
      return (
        "Rescheduled appointments need a new date and time."
      );
    }
  }

  return null;
}

export function payloadForAppointment(
  row,
  therapist,
  date
) {
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

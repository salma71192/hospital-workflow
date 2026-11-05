
/*
 * excelImportRules.js
 *
 * Excel columns:
 * Time / Start -> Appointment Time
 * Subject      -> Patient Name
 * Contacts     -> Therapist Name
 * Code 1       -> File Number
 * Category     -> Appointment Category
 *
 * Features:
 * - Automatic header detection
 * - Excel date/time support
 * - Selected physiotherapist filtering
 * - Match Excel Contacts to registered physiotherapists
 * - Support shortened and extended therapist names
 * - Normalize common name spelling variations
 * - Prevent ambiguous therapist assignments
 * - Exclude staff schedules and administrative entries
 * - Require valid patient appointments
 * - Automatically populate assigned therapist name
 * - Earliest appointment first
 * - Duplicate prevention
 * - Default Unconfirmed confirmation
 * - Claims approval remains unverified until checked
 *
 * IMPORTANT:
 * This module prepares preview data only.
 * It does not save records to Django.
 */

// ============================================================
// CONFIGURATION
// ============================================================

export const CONFIRMATION_OPTIONS = [
  { value: "unconfirmed", label: "Unconfirmed" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rescheduled", label: "Rescheduled" },
];

const clean = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");

const pad = (value) =>
  String(value).padStart(2, "0");

const normalizeHeader = (value) =>
  clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const normalizeName = (value) =>
  clean(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0600-\u06ff]/g, "");

// ============================================================
// NAME NORMALIZATION
// ============================================================

const NAME_VARIATIONS = {
  mohammed: "mohamed",
  mohammad: "mohamed",
  muhammad: "mohamed",
  mohamed: "mohamed",

  ahmad: "ahmed",
  ahmed: "ahmed",

  aly: "ali",
  ali: "ali",

  mahmood: "mahmoud",
  mahmud: "mahmoud",
  mahmoud: "mahmoud",

  fatma: "fatima",
  fatima: "fatima",

  abdul: "abdel",
  abd: "abdel",

  youssef: "youssef",
  yusuf: "youssef",
  yousef: "youssef",

  hassan: "hassan",
  hasan: "hassan",
};

const TITLE_WORDS = new Set([
  "dr",
  "doctor",
  "pt",
  "physio",
  "physiotherapist",
  "mr",
  "mrs",
  "ms",
  "miss",
]);

function therapistWords(value) {
  const text = clean(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, " ");

  return text
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !TITLE_WORDS.has(word))
    .map((word) => NAME_VARIATIONS[word] || word);
}

const normalizeTherapistName = (value) =>
  therapistWords(value).join("");

// ============================================================
// EXCEL COLUMN CONFIGURATION
// ============================================================

const REQUIRED_COLUMNS = {
  time: [
    "time",
    "start",
    "starttime",
    "appointmenttime",
    "startdatetime",
  ],

  patient_name: [
    "subject",
    "patient",
    "patientname",
  ],

  therapist_name: [
    "contacts",
    "contact",
    "therapist",
    "therapistname",
    "physiotherapist",
    "provider",
    "resource",
  ],

  file_number: [
    "code1",
    "filenumber",
    "file",
    "patientfile",
    "patientid",
    "mrn",
  ],

  category: [
    "category",
    "appointmentcategory",
    "bookingcategory",
    "eventcategory",
    "visitcategory",
  ],
};

const REQUIRED_FIELDS = [
  "time",
  "patient_name",
  "therapist_name",
  "file_number",
];

// ============================================================
// ALLOWED PATIENT APPOINTMENT CATEGORIES
// ============================================================

/*
 * Only explicitly recognized patient visit
 * categories are imported when Category exists.
 *
 * Add another category here only after confirming
 * that it represents a real patient appointment.
 */

const PATIENT_CATEGORIES = new Set([
  "doctorpatientvisit",
  "patientvisit",
  "patientappointment",
  "physiotherapyappointment",
  "physiotherapysession",
  "physiotherapyvisit",
  "rehabilitationappointment",
  "rehabilitationvisit",
]);

// ============================================================
// ADMINISTRATIVE ENTRY FILTERING
// ============================================================

const ADMINISTRATIVE_EXACT = new Set([
  "school",
  "annual leave",
  "annual vacation",
  "sick leave",
  "medical leave",
  "emergency leave",
  "maternity leave",
  "paternity leave",
  "unpaid leave",
  "study leave",
  "public holiday",
  "holiday",
  "vacation",

  "off duty",
  "off day",
  "day off",
  "off",
  "duty",
  "duty time",
  "duty timing",
  "working hours",
  "work schedule",
  "shift",
  "night shift",
  "morning shift",
  "evening shift",

  "break",
  "break time",
  "lunch",
  "lunch break",
  "prayer break",
  "meeting",
  "staff meeting",
  "training",
  "orientation",

  "rhss",
  "rhsods",
  "upl",
  "r h s s",
  "r h s o d s",

  "total",
  "total appointments",
  "grand total",
  "appointment list",
  "schedule date",
  "therapist name",
  "patient name",
]);

const ADMINISTRATIVE_PATTERNS = [
  /^school\b/i,

  /^duty\s*(time|timing|hours)?\b/i,
  /^off\s*(duty|day)\b/i,
  /^day\s*off\b/i,

  /^(annual|sick|medical|emergency|study|unpaid|maternity|paternity)\s+leave\b/i,

  /^(annual|public)\s+(vacation|holiday)\b/i,

  /^working\s+(hours|time)\b/i,
  /^work\s+schedule\b/i,

  /^(morning|evening|night)\s+shift\b/i,

  /^(lunch|prayer|tea|coffee)\s+break\b/i,

  /^break\s*time\b/i,

  /^staff\s+(meeting|training)\b/i,

  /^duty\s+timing\s+from\b/i,

  /^total\s+appointments\b/i,

  /^ask\s+the\s+therapist\b/i,
];

function isAdministrativeSubject(value) {
  const subject = clean(value).toLowerCase();

  if (!subject) return false;

  if (ADMINISTRATIVE_EXACT.has(subject)) {
    return true;
  }

  return ADMINISTRATIVE_PATTERNS.some(
    (pattern) => pattern.test(subject)
  );
}

function isPatientCategory(value) {
  const category = normalizeHeader(value);

  return PATIENT_CATEGORIES.has(category);
}

function isAdministrativeCategory(value) {
  const category = normalizeHeader(value);

  if (!category) return false;

  return (
    category.includes("workschedule") ||
    category.includes("staffschedule") ||
    category.includes("staffleave") ||
    category.includes("duty") ||
    category.includes("holiday") ||
    category.includes("vacation") ||
    category.includes("absence") ||
    category.includes("break")
  );
}

// ============================================================
// HEADER DETECTION
// ============================================================

export function detectScheduleHeader(rows = []) {
  let best = null;

  rows.slice(0, 40).forEach((row, index) => {
    if (!Array.isArray(row)) return;

    const headers = row.map(normalizeHeader);
    const mapping = {};

    Object.entries(REQUIRED_COLUMNS).forEach(
      ([field, alternatives]) => {
        mapping[field] = headers.findIndex(
          (header) => alternatives.includes(header)
        );
      }
    );

    const requiredScore = REQUIRED_FIELDS.filter(
      (field) => mapping[field] >= 0
    ).length;

    const categoryBonus =
      mapping.category >= 0 ? 1 : 0;

    const score =
      requiredScore * 10 + categoryBonus;

    if (!best || score > best.score) {
      best = {
        index,
        mapping,
        score,
        requiredScore,
        hasCategory: mapping.category >= 0,
      };
    }
  });

  if (!best || best.requiredScore < 4) {
    throw new Error(
      "Invalid schedule. Required columns: " +
      "Time or Start, Subject, Contacts, Code 1."
    );
  }

  return best;
}

// ============================================================
// EXCEL TIME PARSING
// ============================================================

export function parseExcelTime(value) {
  if (value == null || value === "") {
    return "";
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return "";
    }

    return (
      `${pad(value.getHours())}:` +
      `${pad(value.getMinutes())}`
    );
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0) {
      return "";
    }

    /*
     * A whole Excel date serial is not
     * a valid time-only value.
     */

    if (value >= 1 && Number.isInteger(value)) {
      return "";
    }

    const fraction =
      ((value % 1) + 1) % 1;

    const totalMinutes =
      Math.round(fraction * 1440) % 1440;

    const hours =
      Math.floor(totalMinutes / 60);

    const minutes =
      totalMinutes % 60;

    return `${pad(hours)}:${pad(minutes)}`;
  }

  const text = clean(value);

  /*
   * ISO date-time or date followed by time.
   * Do not convert timezone.
   */

  const dateTimeMatch = text.match(
    /^\d{4}-\d{1,2}-\d{1,2}[T\s]+(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i
  );

  if (dateTimeMatch) {
    let hours = Number(dateTimeMatch[1]);
    const minutes = Number(dateTimeMatch[2]);
    const period = dateTimeMatch[3]?.toUpperCase();

    if (minutes > 59) return "";

    if (period) {
      if (hours < 1 || hours > 12) return "";

      hours =
        (hours % 12) +
        (period === "PM" ? 12 : 0);
    } else if (hours > 23) {
      return "";
    }

    return `${pad(hours)}:${pad(minutes)}`;
  }

  const match = text.match(
    /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i
  );

  if (match) {
    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const period = match[3]?.toUpperCase();

    if (minutes > 59) return "";

    if (period) {
      if (hours < 1 || hours > 12) {
        return "";
      }

      hours =
        (hours % 12) +
        (period === "PM" ? 12 : 0);
    } else if (hours > 23) {
      return "";
    }

    return `${pad(hours)}:${pad(minutes)}`;
  }

  const hourOnly = text.match(
    /^(\d{1,2})\s*(AM|PM)$/i
  );

  if (hourOnly) {
    let hours = Number(hourOnly[1]);

    if (hours < 1 || hours > 12) {
      return "";
    }

    hours =
      (hours % 12) +
      (hourOnly[2].toUpperCase() === "PM"
        ? 12
        : 0);

    return `${pad(hours)}:00`;
  }

  return "";
}

// ============================================================
// TIME DISPLAY
// ============================================================

export function formatTime12(value) {
  const time = parseExcelTime(value);

  if (!time) return "";

  const [hours, minutes] =
    time.split(":").map(Number);

  return (
    `${pad(hours % 12 || 12)}:` +
    `${pad(minutes)} ` +
    `${hours >= 12 ? "PM" : "AM"}`
  );
}

// ============================================================
// REGISTERED THERAPIST NORMALIZATION
// ============================================================

function normalizeTherapistUsers(users = []) {
  const source =
    Array.isArray(users) ? users : [];

  return source
    .map((user) => {
      if (
        user === null ||
        user === undefined
      ) {
        return null;
      }

      if (
        typeof user === "string" ||
        typeof user === "number"
      ) {
        const name = clean(user);

        return {
          id: name,
          name,
          words: therapistWords(name),
          original: user,
        };
      }

      const record =
        user.user &&
        typeof user.user === "object"
          ? user.user
          : user;

      const id =
        user.value ??
        user.user_id ??
        record.id ??
        user.id ??
        record.pk ??
        record.username ??
        user.username;

      const fullName = [
        record.first_name,
        record.middle_name,
        record.last_name,
      ]
        .filter(Boolean)
        .join(" ");

      const name = clean(
        user.label ||
        user.full_name ||
        user.name ||
        record.full_name ||
        record.name ||
        fullName ||
        record.username ||
        user.username ||
        ""
      );

      if (
        id === undefined ||
        id === null ||
        clean(id) === "" ||
        !name
      ) {
        return null;
      }

      return {
        id,
        name,
        words: therapistWords(name),
        original: user,
      };
    })
    .filter(
      (user) =>
        user &&
        user.words.length > 0
    );
}

// ============================================================
// THERAPIST MATCH SCORING
// ============================================================

function scoreTherapistMatch(
  excelWords,
  userWords
) {
  if (
    !excelWords.length ||
    !userWords.length
  ) {
    return 0;
  }

  const excelFull = excelWords.join("");
  const userFull = userWords.join("");

  if (excelFull === userFull) {
    return 1000;
  }

  if (excelWords[0] !== userWords[0]) {
    return 0;
  }

  const firstTwoMatch =
    excelWords.length >= 2 &&
    userWords.length >= 2 &&
    excelWords[1] === userWords[1];

  if (!firstTwoMatch) {
    return 0;
  }

  const sharedWords = userWords.filter(
    (word) => excelWords.includes(word)
  ).length;

  if (sharedWords < 2) {
    return 0;
  }

  const shorterLength = Math.min(
    excelWords.length,
    userWords.length
  );

  let matchingPrefix = 0;

  for (
    let i = 0;
    i < shorterLength;
    i++
  ) {
    if (
      excelWords[i] !== userWords[i]
    ) {
      break;
    }

    matchingPrefix++;
  }

  let score =
    100 +
    matchingPrefix * 25 +
    sharedWords * 10;

  if (
    matchingPrefix === shorterLength
  ) {
    score += 80;
  }

  return score;
}

// ============================================================
// THERAPIST MATCHING
// ============================================================

export function matchTherapist(
  contact,
  users = [],
  selectedTherapist = ""
) {
  const excelWords =
    therapistWords(contact);

  if (excelWords.length < 2) {
    return null;
  }

  const candidates =
    normalizeTherapistUsers(users);

  if (!candidates.length) {
    return null;
  }

  const scored = candidates
    .map((user) => ({
      ...user,
      score: scoreTherapistMatch(
        excelWords,
        user.words
      ),
    }))
    .filter((user) => user.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) {
    return null;
  }

  const bestScore = scored[0].score;

  const bestMatches = scored.filter(
    (user) => user.score === bestScore
  );

  let matched = null;

  if (bestMatches.length === 1) {
    matched = bestMatches[0];
  } else {
    matched =
      bestMatches.find(
        (user) =>
          String(user.id) ===
          String(selectedTherapist)
      ) || null;
  }

  if (!matched) {
    return null;
  }

  return {
    id: matched.id,
    name: matched.name,
    original: matched.original,
  };
}

// ============================================================
// SELECTED THERAPIST RESOLUTION
// ============================================================

function resolveSelectedTherapist(
  selectedTherapist,
  therapistUsers
) {
  const selected = clean(
    selectedTherapist
  );

  if (!selected) {
    return null;
  }

  const users =
    normalizeTherapistUsers(
      therapistUsers
    );

  /*
   * First try exact registered value.
   */

  const idMatches = users.filter(
    (user) =>
      String(user.id) === selected
  );

  if (idMatches.length === 1) {
    return idMatches[0];
  }

  /*
   * Some Django APIs use names rather
   * than numeric IDs in the dropdown.
   */

  const normalizedSelected =
    normalizeTherapistName(selected);

  const nameMatches = users.filter(
    (user) =>
      normalizeTherapistName(
        user.name
      ) === normalizedSelected
  );

  if (nameMatches.length === 1) {
    return nameMatches[0];
  }

  return null;
}

// ============================================================
// SELECTED THERAPIST CONTACT CHECK
// ============================================================

function contactMatchesSelected(
  excelContact,
  selectedUser,
  therapistUsers
) {
  if (!selectedUser) {
    return false;
  }

  const matched = matchTherapist(
    excelContact,
    therapistUsers,
    selectedUser.id
  );

  if (!matched) {
    return false;
  }

  return (
    String(matched.id) ===
    String(selectedUser.id)
  );
}

// ============================================================
// DUPLICATE APPOINTMENT KEY
// ============================================================

export function appointmentImportKey(row) {
  const patient =
    clean(row.file_number) ||
    normalizeName(
      row.patient_name
    );

  const therapistId =
    row.therapist ??
    row.therapist_id ??
    "";

  const therapistKey =
    clean(therapistId) !== ""
      ? String(therapistId)
      : normalizeTherapistName(
          row.excel_therapist_name ||
          row.therapist_name
        );

  return [
    patient,
    therapistKey,
    clean(
      row.appointment_date ||
      row.date
    ),
    parseExcelTime(row.time),
  ].join("|");
}

// ============================================================
// APPOINTMENT DATE PARSING
// ============================================================

function parseAppointmentDate(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

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

  if (typeof value === "number") {
    /*
     * Excel serial date, UTC-based
     * conversion to avoid local timezone
     * shifts.
     */

    if (
      !Number.isFinite(value) ||
      value < 1
    ) {
      return "";
    }

    const days = Math.floor(value);

    const milliseconds =
      Math.round(
        (days - 25569) * 86400000
      );

    const date =
      new Date(milliseconds);

    if (
      Number.isNaN(date.getTime())
    ) {
      return "";
    }

    return [
      date.getUTCFullYear(),
      pad(date.getUTCMonth() + 1),
      pad(date.getUTCDate()),
    ].join("-");
  }

  const text = clean(value);

  const iso = text.match(
    /^(\d{4}-\d{2}-\d{2})(?:[T\s]|$)/
  );

  if (iso) {
    return iso[1];
  }

  /*
   * Deliberately avoid guessing ambiguous
   * day/month ordering.
   */

  return "";
}

// ============================================================
// EXTRACT SCHEDULE APPOINTMENTS
// ============================================================

export function extractScheduleAppointments({
  rows = [],
  therapistUsers = [],
  selectedTherapist = "",
  appointmentDate = "",
  existingAppointments = [],
}) {
  const { index, mapping, hasCategory } =
    detectScheduleHeader(rows);

  const appointments = [];
  const warnings = [];

  let skipped = 0;

  const selectedUser =
    resolveSelectedTherapist(
      selectedTherapist,
      therapistUsers
    );

  /*
   * Prevent importing all therapists
   * when no selected therapist is resolved.
   */

  if (!selectedUser) {
    return {
      appointments: [],
      skipped: 0,
      warnings: [
        "Selected physiotherapist could not be matched to a registered user. Check the therapist dropdown and therapist API response.",
      ],
      total: 0,
      unmatchedTherapists: 0,
    };
  }

  const seen = new Set(
    existingAppointments.map(
      appointmentImportKey
    )
  );

  rows.slice(index + 1).forEach(
    (row, offset) => {
      const excelRow =
        index + offset + 2;

      if (!Array.isArray(row)) {
        return;
      }

      const get = (field) => {
        const position =
          mapping[field];

        return position >= 0
          ? row[position] ?? ""
          : "";
      };

      const patientName =
        clean(get("patient_name"));

      const excelTherapistName =
        clean(get("therapist_name"));

      const fileNumber =
        clean(get("file_number"));

      const category =
        clean(get("category"));

      const startValue =
        get("time");

      const time =
        parseExcelTime(startValue);

      /*
       * Ignore fully empty rows.
       */

      if (
        !patientName &&
        !excelTherapistName &&
        !fileNumber &&
        !category &&
        !time
      ) {
        return;
      }

      /*
       * 1. Exclude administrative subjects.
       */

      if (
        isAdministrativeSubject(
          patientName
        )
      ) {
        skipped++;
        return;
      }

      /*
       * 2. Exclude administrative categories.
       */

      if (
        isAdministrativeCategory(
          category
        )
      ) {
        skipped++;
        return;
      }

      /*
       * 3. If the spreadsheet has Category,
       * require a recognized patient visit.
       */

      if (
        hasCategory &&
        !isPatientCategory(category)
      ) {
        skipped++;
        return;
      }

      /*
       * 4. Require a patient name and time.
       */

      if (
        !patientName ||
        !time
      ) {
        skipped++;

        warnings.push(
          `Row ${excelRow}: Missing patient name or valid appointment time.`
        );

        return;
      }

      /*
       * 5. Match Contacts to selected physio.
       *
       * Do not import rows belonging
       * to another physiotherapist.
       */

      if (
        !contactMatchesSelected(
          excelTherapistName,
          selectedUser,
          therapistUsers
        )
      ) {
        skipped++;
        return;
      }

      /*
       * 6. Check appointment date when
       * the Excel Start value contains one.
       */

      const excelDate =
        parseAppointmentDate(
          startValue
        );

      if (
        excelDate &&
        appointmentDate &&
        excelDate !== appointmentDate
      ) {
        skipped++;

        warnings.push(
          `Row ${excelRow}: Appointment date ${excelDate} does not match selected date ${appointmentDate}.`
        );

        return;
      }

      /*
       * 7. Use the registered therapist
       * ID and registered display name.
       *
       * This fixes the Assigned field
       * displaying "Unassigned".
       */

      const appointment = {
        localId:
          `excel-${excelRow}-${Date.now()}`,

        import_row:
          excelRow,

        patient_name:
          patientName,

        file_number:
          fileNumber,

        therapist:
          selectedUser.id,

        therapist_id:
          selectedUser.id,

        therapist_name:
          selectedUser.name,

        excel_therapist_name:
          excelTherapistName,

        import_therapist:
          excelTherapistName,

        therapist_matched:
          true,

        therapist_manually_assigned:
          false,

        appointment_date:
          appointmentDate,

        date:
          appointmentDate,

        time,

        confirmation_status:
          "unconfirmed",

        /*
         * Approval is not verified
         * until Claims provides a result.
         */

        approval_status:
          "approved",

        insurance_approval_status:
          "approved",

        claim_approval_status:
          "approved",

        appointment_type:
          "followup",

        source:
          "excel",

        isNew:
          true,

        isDirty:
          true,

        import_category:
          category,

        import_warnings:
          [],
      };

      /*
       * 8. Prevent duplicates.
       */

      const key =
        appointmentImportKey(
          appointment
        );

      if (seen.has(key)) {
        skipped++;

        warnings.push(
          `Row ${excelRow}: Duplicate appointment skipped.`
        );

        return;
      }

      seen.add(key);

      appointments.push(
        appointment
      );
    }
  );

  /*
   * 9. Sort earliest appointment first.
   */

  appointments.sort(
    (a, b) =>
      a.time.localeCompare(
        b.time
      )
  );

  const unmatchedTherapists =
    appointments.filter(
      (row) =>
        !row.therapist_matched
    ).length;

  return {
    appointments,
    skipped,
    warnings,
    total: appointments.length,
    unmatchedTherapists,
  };
}


import React, { useMemo, useState } from "react";

/* =========================================================
   PREMIUM NAVY + TEAL THEME
========================================================= */

const COLORS = {
  navy: "#142B4A",
  navyLight: "#203E63",
  text: "#344A63",
  muted: "#71839A",
  subtle: "#9AA9BA",
  border: "#E2EAF2",
  borderStrong: "#CCD9E8",
  surface: "#FFFFFF",
  surfaceSoft: "#F6F9FD",
  background: "#F3F7FC",

  blue: "#3977D5",
  blueBg: "#EDF4FF",
  sky: "#1686B5",
  skyBg: "#EAF8FE",
  teal: "#138A83",
  tealBg: "#E7F8F5",
  orange: "#C87532",
  orangeBg: "#FFF4E8",
  purple: "#8065C9",
  purpleBg: "#F2EDFF",
  green: "#218564",
  greenBg: "#E8F7EF",
  red: "#C65363",
  redBg: "#FFF0F2",
  slate: "#62758D",
  slateBg: "#EEF2F7",
};

const styles = {
  stack: {
    display: "grid",
    gap: 22,
    minWidth: 0,
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Arial, sans-serif",
    color: COLORS.text,
  },

  /* FILTER PANEL */
  filter: {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))",
    gap: 18,
    padding: 24,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 20,
    background: "linear-gradient(135deg, #FFFFFF 0%, #F5F9FF 100%)",
    boxShadow: "0 8px 28px rgba(20,43,74,0.055)",
    overflow: "hidden",
    minWidth: 0,
  },

  filterAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: "linear-gradient(90deg, #142B4A, #168A83, #67B9B1)",
  },

  filterTop: {
    gridColumn: "1 / -1",
    display: "flex",
    alignItems: "center",
    gap: 15,
    paddingBottom: 19,
    borderBottom: `1px solid ${COLORS.border}`,
  },

  filterIcon: {
    display: "grid",
    placeItems: "center",
    width: 50,
    height: 50,
    flexShrink: 0,
    borderRadius: 15,
    background: "linear-gradient(145deg, #173756, #245777)",
    color: "#FFFFFF",
    fontSize: 22,
    boxShadow: "0 5px 13px rgba(20,43,74,.17)",
  },

  filterHeading: {
    margin: 0,
    color: COLORS.navy,
    fontSize: 20,
    fontWeight: 850,
    letterSpacing: "-0.45px",
  },

  filterDescription: {
    marginTop: 5,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 1.7,
  },

  filterLabel: {
    display: "grid",
    alignContent: "start",
    gap: 12,
    minWidth: 0,
    padding: 18,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 16,
    background: "#FFFFFF",
    boxShadow: "0 3px 12px rgba(20,43,74,.025)",
  },

  filterCaption: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    color: COLORS.navy,
    fontSize: 12,
    fontWeight: 800,
  },

  filterCaptionIcon: {
    display: "grid",
    placeItems: "center",
    width: 30,
    height: 30,
    borderRadius: 9,
    background: COLORS.tealBg,
    color: COLORS.teal,
    fontSize: 15,
  },

  filterInput: {
    boxSizing: "border-box",
    display: "block",
    width: "100%",
    minHeight: 48,
    padding: "11px 13px",
    border: `1px solid ${COLORS.borderStrong}`,
    borderRadius: 11,
    background: "#F8FAFD",
    color: COLORS.navy,
    fontFamily: "inherit",
    fontSize: 14,
    fontWeight: 750,
    outlineColor: COLORS.teal,
    cursor: "pointer",
    colorScheme: "light",
  },

  filterHint: {
    display: "flex",
    alignItems: "flex-start",
    gap: 7,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 1.6,
  },

  filterHintDot: {
    color: COLORS.teal,
    fontWeight: 900,
  },

  /* REPORT PANEL */
  report: {
    display: "grid",
    gap: 20,
    minWidth: 0,
    padding: 22,
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 20,
    boxShadow: "0 7px 25px rgba(20,43,74,.045)",
  },

  reportToggle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    width: "100%",
    padding: 0,
    border: 0,
    background: "transparent",
    cursor: "pointer",
    textAlign: "left",
    font: "inherit",
  },

  reportTitle: {
    margin: 0,
    color: COLORS.navy,
    fontSize: 21,
    fontWeight: 850,
    lineHeight: 1.4,
    letterSpacing: "-0.45px",
  },

  subtitle: {
    marginTop: 5,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 1.7,
  },

  collapseIcon: {
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    width: 44,
    height: 44,
    border: "1px solid #D8E6F3",
    borderRadius: 14,
    background: "linear-gradient(145deg, #EEF5FF, #E8F7F6)",
    color: COLORS.teal,
    fontSize: 25,
    fontWeight: 800,
  },

  summaryMeta: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },

  metaBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "7px 11px",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 9,
    background: "#F7F9FC",
    color: COLORS.text,
    fontSize: 11,
    fontWeight: 750,
  },

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 20,
    background: COLORS.tealBg,
    color: COLORS.teal,
    fontSize: 10,
    fontWeight: 850,
  },

  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(185px, 100%), 1fr))",
    gap: 13,
  },

  metric: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
    padding: 15,
    borderRadius: 15,
    border: "1px solid",
    cursor: "pointer",
    textAlign: "left",
    font: "inherit",
    transition:
      "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
  },

  metricIcon: {
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    width: 43,
    height: 43,
    borderRadius: 13,
    background: "#FFFFFF",
    fontSize: 19,
    fontWeight: 850,
    boxShadow: "0 2px 7px rgba(20,43,74,.05)",
  },

  metricLabel: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: 800,
    lineHeight: 1.5,
    overflowWrap: "anywhere",
  },

  metricValue: {
    marginTop: 5,
    color: COLORS.navy,
    fontSize: 27,
    fontWeight: 850,
    lineHeight: 1.15,
    fontVariantNumeric: "tabular-nums",
  },

  metricDescription: {
    marginTop: 5,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 1.5,
  },

  /* REGISTRATION PANEL */
  panel: {
    overflow: "hidden",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 17,
    background: COLORS.surface,
    minWidth: 0,
  },

  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    padding: "17px 19px",
    background: "linear-gradient(120deg, #F2F7FD 0%, #F4FBFA 100%)",
    borderBottom: `1px solid ${COLORS.border}`,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 800,
  },

  panelTitle: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },

  panelIcon: {
    display: "grid",
    placeItems: "center",
    width: 42,
    height: 42,
    flexShrink: 0,
    borderRadius: 13,
    background: "#FFFFFF",
    border: `1px solid ${COLORS.border}`,
    color: COLORS.teal,
    fontSize: 19,
  },

  countBadge: {
    padding: "8px 12px",
    border: "1px solid #CBEDE6",
    borderRadius: 20,
    background: COLORS.tealBg,
    color: "#11776F",
    fontSize: 11,
    fontWeight: 850,
    whiteSpace: "nowrap",
  },

  registrationList: {
    display: "grid",
    gap: 13,
    padding: 17,
    minWidth: 0,
  },

  categorySection: {
    display: "grid",
    gap: 8,
    minWidth: 0,
  },

  categoryToggle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    width: "100%",
    padding: "13px 15px",
    border: "1px solid",
    borderRadius: 13,
    cursor: "pointer",
    textAlign: "left",
    font: "inherit",
  },

  categoryToggleLeft: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    minWidth: 0,
  },

  categoryIcon: {
    display: "grid",
    placeItems: "center",
    width: 36,
    height: 36,
    flexShrink: 0,
    borderRadius: 11,
    background: "#FFFFFF",
    fontSize: 17,
    fontWeight: 850,
  },

  categoryTitle: {
    fontSize: 12,
    fontWeight: 850,
    lineHeight: 1.5,
    overflowWrap: "anywhere",
  },

  categoryCount: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 32,
    height: 29,
    padding: "0 9px",
    borderRadius: 20,
    background: "#FFFFFF",
    fontSize: 11,
    fontWeight: 850,
  },

  tableScroll: {
    width: "100%",
    overflowX: "auto",
    minWidth: 0,
    WebkitOverflowScrolling: "touch",
  },

  tableInner: {
    minWidth: 1080,
    display: "grid",
    gap: 9,
    paddingBottom: 3,
  },

  patientRow: {
    display: "grid",
    gridTemplateColumns:
      "minmax(190px, 1.6fr) repeat(4, minmax(145px, 1fr)) minmax(120px, .8fr)",
    alignItems: "center",
    gap: 12,
    width: "100%",
    minHeight: 70,
    padding: "14px 16px",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    background: "#FFFFFF",
    color: COLORS.text,
    boxSizing: "border-box",
  },

  patientName: {
    color: COLORS.navy,
    fontSize: 13,
    fontWeight: 800,
    overflowWrap: "anywhere",
  },

  patientValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 650,
    lineHeight: 1.6,
    overflowWrap: "anywhere",
  },

  fieldCaption: {
    display: "block",
    marginBottom: 5,
    color: COLORS.subtle,
    fontSize: 9,
    fontWeight: 850,
    textTransform: "uppercase",
    letterSpacing: ".6px",
  },

  openFileButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    width: "100%",
    minHeight: 38,
    padding: "8px 10px",
    border: "1px solid #C9DDF8",
    borderRadius: 10,
    background: "linear-gradient(135deg, #EFF5FF, #EAF8F7)",
    color: COLORS.blue,
    fontSize: 11,
    fontWeight: 850,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  notice: {
    padding: "14px 16px",
    borderRadius: 12,
    background: "#F6F9FD",
    border: `1px solid ${COLORS.border}`,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 1.8,
  },

  loading: {
    padding: 24,
    borderRadius: 12,
    background: "#F7F9FC",
    border: `1px dashed ${COLORS.borderStrong}`,
    color: COLORS.muted,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 1.8,
  },

  expandAllButton: {
    border: `1px solid ${COLORS.borderStrong}`,
    borderRadius: 10,
    background: "#FFFFFF",
    color: COLORS.navy,
    padding: "9px 12px",
    fontSize: 11,
    fontWeight: 850,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
};

/* =========================================================
   REGISTRATION CATEGORIES
========================================================= */

const CATEGORY_GROUPS = [
  {
    key: "appointments",
    label: "Appointments and follow-ups",
    matches: [
      "appointment",
      "appointments",
      "regular_session",
      "treatment_session",
      "follow_up",
      "followup",
      "follow_up_session",
      "appointment_follow_up",
      "appointment_and_follow_up",
    ],
    icon: "◷",
    color: COLORS.blue,
    background: COLORS.blueBg,
  },
  {
    key: "walk_in",
    label: "Walk-in patients",
    matches: [
      "walk_in",
      "walkin",
      "walk_in_patient",
      "walk_in_registration",
    ],
    icon: "↗",
    color: COLORS.sky,
    background: COLORS.skyBg,
  },
  {
    key: "without_eligibility",
    label: "Tasks Without Eligibility",
    matches: [
      "task_without_eligibility",
      "no_eligibility",
      "without_eligibility",
      "eligibility_missing",
      "missing_eligibility",
      "not_eligible",
    ],
    icon: "⚠",
    color: COLORS.orange,
    background: COLORS.orangeBg,
  },
  {
    key: "evaluations",
    label: "Initial evaluations",
    matches: [
      "initial_evaluation",
      "initial_eval",
      "evaluation",
      "evaluations",
      "eval",
    ],
    icon: "＋",
    color: COLORS.purple,
    background: COLORS.purpleBg,
  },
  {
    key: "cash",
    label: "Cash registrations",
    matches: [
      "cash",
      "cash_patient",
      "cash_visit",
      "cash_registration",
      "cash_payment",
    ],
    icon: "¤",
    color: COLORS.green,
    background: COLORS.greenBg,
  },
  {
    key: "no_show",
    label: "No-shows",
    matches: ["no_show", "noshow", "did_not_attend"],
    icon: "!",
    color: COLORS.red,
    background: COLORS.redBg,
  },
];

const OTHER_GROUP = {
  key: "other",
  label: "Other registrations",
  matches: [],
  icon: "•",
  color: COLORS.slate,
  background: COLORS.slateBg,
};

const FILE_NUMBER_KEYS = [
  "file_number",
  "file_no",
  "file_num",
  "fileNumber",
  "fileNo",
  "patient_file_number",
  "patient_file_no",
  "patient_file_num",
  "medical_file_number",
  "medical_file_no",
  "medical_record_number",
  "medical_record_no",
  "medicalRecordNumber",
  "mrn",
  "mrn_number",
  "patient_mrn",
  "chart_number",
  "chart_no",
  "record_number",
  "record_no",
  "patient_number",
  "file_number_id",
  "file_id",
  "medical_record",
  "patient_file",
  "folder_number",
  "folder_no",
];

const VISIT_NUMBER_KEYS = [
  "visit_number",
  "visit_no",
  "visit_count",
  "session_number",
  "visitNumber",
  "visitNo",
  "number_of_visits",
  "visit_sequence",
  "visit_index",
  "session_no",
  "appointment_number",
];

const SPECIALITY_KEYS = [
  "speciality",
  "specialty",
  "speciality_name",
  "specialty_name",
  "speciality_display",
  "specialty_display",
  "department_name",
  "service_name",
  "service",
  "department",
  "clinic_specialty",
  "clinical_speciality",
  "service_type",
];

const DATE_KEYS = [
  "appointment_date",
  "scheduled_date",
  "registration_date",
  "created_date",
  "date",
  "appointment_datetime",
  "scheduled_at",
  "registration_datetime",
  "appointment_at",
  "visit_date",
  "service_date",
  "session_date",
  "created_at",
  "date_created",
  "start_date",
  "start_datetime",
  "booking_date",
  "assigned_date",
  "registered_at",
  "assignment_date",
  "assigned_at",
  "created",
  "datetime",
  "timestamp",
  "visit_datetime",
];

const CATEGORY_KEYS = [
  "category",
  "category_label",
  "category_display",
  "registration_type",
  "visit_type",
  "type",
  "task_type",
];

/* =========================================================
   DATA HELPERS
========================================================= */

function normalizeCategory(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[\s-]+/g, "_")
    .replace(/[^\w]/g, "");
}

function normalizeKey(key) {
  return String(key).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function scalarValue(value) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value !== "object") return value;

  for (const key of [
    "value",
    "number",
    "file_number",
    "file_no",
    "fileNumber",
    "label",
    "display",
    "display_name",
    "name",
    "title",
    "date",
  ]) {
    if (
      value[key] !== null &&
      value[key] !== undefined &&
      value[key] !== ""
    ) {
      return typeof value[key] === "object"
        ? scalarValue(value[key])
        : value[key];
    }
  }

  return "";
}

function getNestedSources(item) {
  if (!item || typeof item !== "object") return [];

  const sources = [];
  const queue = [{ value: item, depth: 0 }];
  const visited = new Set();

  while (queue.length) {
    const { value, depth } = queue.shift();

    if (!value || typeof value !== "object" || visited.has(value)) continue;
    visited.add(value);

    if (Array.isArray(value)) {
      if (depth < 5) {
        value.forEach((entry) => {
          if (entry && typeof entry === "object") {
            queue.push({ value: entry, depth: depth + 1 });
          }
        });
      }
      continue;
    }

    sources.push(value);

    if (depth >= 5) continue;

    Object.values(value).forEach((nested) => {
      if (nested && typeof nested === "object") {
        queue.push({ value: nested, depth: depth + 1 });
      }
    });
  }

  return sources;
}

function getFieldFromSource(source, keys) {
  if (!source || typeof source !== "object") return "";

  const wanted = new Set(keys.map(normalizeKey));

  for (const [key, value] of Object.entries(source)) {
    if (!wanted.has(normalizeKey(key))) continue;

    const result = scalarValue(value);
    if (result !== "") return result;
  }

  for (const [key, value] of Object.entries(source)) {
    const normalized = normalizeKey(key);

    const matches = [...wanted].some(
      (candidate) =>
        candidate.length >= 5 &&
        (normalized.endsWith(candidate) || normalized.startsWith(candidate))
    );

    if (!matches) continue;

    const result = scalarValue(value);
    if (result !== "") return result;
  }

  return "";
}

function getValueFromSources(item, keys) {
  for (const source of getNestedSources(item)) {
    const value = getFieldFromSource(source, keys);
    if (value !== "") return value;
  }

  return "";
}

function getRegistrationName(item) {
  const name = getValueFromSources(item, [
    "patient_name",
    "patient_full_name",
    "full_name",
    "display_name",
    "patient_display_name",
    "name",
  ]);

  return name !== "" ? String(name) : "Unnamed patient";
}

function getPatientFileNumber(item) {
  return getValueFromSources(item, FILE_NUMBER_KEYS);
}

function getVisitNumber(item) {
  return getValueFromSources(item, VISIT_NUMBER_KEYS);
}

function getSpeciality(item) {
  return getValueFromSources(item, SPECIALITY_KEYS);
}

function formatDateValue(value) {
  const extracted = scalarValue(value);
  if (extracted === "") return "";

  const raw = String(extracted).trim();
  const isoDate = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T|\s)/);

  if (isoDate) return `${isoDate[3]}/${isoDate[2]}/${isoDate[1]}`;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return raw.replace("T", " ").slice(0, 16);
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Dubai",
  }).format(date);
}

function getRegistrationDate(item) {
  return formatDateValue(getValueFromSources(item, DATE_KEYS));
}

function getRegistrationStatus(item) {
  return getValueFromSources(item, [
    "status",
    "appointment_status",
    "visit_status",
    "registration_status",
  ]);
}

function getCategoryValues(item) {
  return CATEGORY_KEYS.map((key) =>
    normalizeCategory(getFieldFromSource(item, [key]))
  ).filter(Boolean);
}

function categoryMatchesGroup(category, group) {
  if (!category) return false;
  if (group.matches.includes(category)) return true;

  const readable = category.replace(/_/g, " ");

  switch (group.key) {
    case "appointments":
      return (
        readable.includes("appointment") ||
        readable.includes("follow up") ||
        readable.includes("regular session") ||
        readable.includes("treatment session")
      );

    case "walk_in":
      return readable.includes("walk in") || readable.includes("walkin");

    case "evaluations":
      return (
        readable.includes("evaluation") ||
        readable === "eval" ||
        readable.includes("initial eval")
      );

    case "cash":
      return readable.includes("cash");

    case "without_eligibility":
      return (
        readable.includes("without eligibility") ||
        readable.includes("no eligibility") ||
        readable.includes("missing eligibility") ||
        readable.includes("not eligible")
      );

    case "no_show":
      return (
        readable.includes("no show") ||
        readable.includes("did not attend")
      );

    default:
      return false;
  }
}

function isNoShow(item) {
  const status = normalizeCategory(getRegistrationStatus(item));
  const group = CATEGORY_GROUPS.find((entry) => entry.key === "no_show");

  return (
    item?.no_show === true ||
    item?.is_no_show === true ||
    ["no_show", "noshow", "did_not_attend"].includes(status) ||
    getCategoryValues(item).some((category) =>
      categoryMatchesGroup(category, group)
    )
  );
}

function isWithoutEligibility(item) {
  const group = CATEGORY_GROUPS.find(
    (entry) => entry.key === "without_eligibility"
  );

  return (
    item?.without_eligibility === true ||
    item?.no_eligibility === true ||
    item?.has_eligibility === false ||
    item?.eligibility === false ||
    item?.is_eligible === false ||
    getCategoryValues(item).some((category) =>
      categoryMatchesGroup(category, group)
    )
  );
}

function matchesCategory(item, key) {
  if (key === "all") return true;
  if (key === "no_show") return isNoShow(item);
  if (key === "without_eligibility") return isWithoutEligibility(item);

  if (key === "other") {
    return !CATEGORY_GROUPS.some((group) =>
      matchesCategory(item, group.key)
    );
  }

  const group = CATEGORY_GROUPS.find((entry) => entry.key === key);

  return Boolean(
    group &&
      getCategoryValues(item).some((category) =>
        categoryMatchesGroup(category, group)
      )
  );
}

function getRegistrationGroups(assignments = []) {
  const remaining = [...assignments];
  const groups = [];

  const priority = [
    "without_eligibility",
    "no_show",
    ...CATEGORY_GROUPS
      .filter(
        (group) =>
          !["without_eligibility", "no_show"].includes(group.key)
      )
      .map((group) => group.key),
  ];

  priority.forEach((key) => {
    const group = CATEGORY_GROUPS.find((entry) => entry.key === key);
    if (!group) return;

    const matching = remaining.filter((item) =>
      matchesCategory(item, key)
    );

    matching.forEach((item) => {
      const index = remaining.indexOf(item);
      if (index !== -1) remaining.splice(index, 1);
    });

    if (matching.length) {
      groups.push({ ...group, items: matching });
    }
  });

  if (remaining.length) {
    groups.push({ ...OTHER_GROUP, items: remaining });
  }

  return groups;
}

/* =========================================================
   OPEN PATIENT FILE
   Default route: /patients/:id
========================================================= */

const PATIENT_DETAILS_ROUTE = (patientId) =>
  `/patients/${encodeURIComponent(String(patientId))}`;

function getPatientId(item) {
  const explicitId = getValueFromSources(item, [
    "patient_id",
    "patientId",
    "patient_pk",
    "patient_uuid",
    "patient_record_id",
  ]);

  if (explicitId !== "") return explicitId;

  for (const source of getNestedSources(item)) {
    if (
      source.patient &&
      typeof source.patient === "object" &&
      source.patient.id !== undefined &&
      source.patient.id !== null
    ) {
      return source.patient.id;
    }

    if (
      source.patient_details &&
      typeof source.patient_details === "object" &&
      source.patient_details.id !== undefined &&
      source.patient_details.id !== null
    ) {
      return source.patient_details.id;
    }
  }

  return "";
}

function getPatientFileUrl(item) {
  return getValueFromSources(item, [
    "patient_file_url",
    "patient_details_url",
    "patient_detail_url",
    "patient_url",
    "file_url",
    "record_url",
    "details_url",
    "patient_file_path",
    "patient_detail_path",
  ]);
}

function handleOpenPatientFile(item) {
  const existingUrl = getPatientFileUrl(item);
  const patientId = getPatientId(item);

  if (existingUrl) {
    const url = String(existingUrl).trim();

    if (/^https?:\/\//i.test(url)) {
      window.location.assign(url);
      return;
    }

    if (url.startsWith("/") && !url.startsWith("//")) {
      window.location.assign(url);
      return;
    }
  }

  if (patientId !== "") {
    window.location.assign(PATIENT_DETAILS_ROUTE(patientId));
    return;
  }

  window.alert(
    "Unable to open the patient file because this registration does not contain a patient ID or patient-details URL."
  );
}

/* =========================================================
   SUMMARY CARDS
   Original category colors preserved.
   All registrations has no extra selected border.
========================================================= */

function StatisticsMetricCard({
  label,
  value,
  description,
  color,
  background,
  icon,
  selected,
  onClick,
}) {
  const isAllRegistrations = label === "All registrations";

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      title={`Show ${label.toLowerCase()} registrations`}
      style={{
        ...styles.metric,
        background,
        borderColor:
          selected && !isAllRegistrations ? color : `${color}70`,
        borderWidth: selected && !isAllRegistrations ? 2 : 1,
        boxShadow: selected
          ? `0 6px 19px ${color}30`
          : `0 2px 8px ${color}12`,
        transform: selected ? "translateY(-2px)" : "none",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          ...styles.metricIcon,
          color,
          background: "#FFFFFF",
          border: `1px solid ${color}25`,
        }}
      >
        {icon}
      </span>

      <span style={{ minWidth: 0 }}>
        <span style={styles.metricLabel}>{label}</span>

        <span
          style={{
            ...styles.metricValue,
            display: "block",
            color,
          }}
        >
          {value}
        </span>

        <span
          style={{
            ...styles.metricDescription,
            display: "block",
          }}
        >
          {description}
        </span>
      </span>
    </button>
  );
}

/* =========================================================
   PATIENT ROW
========================================================= */

function PatientRegistrationRow({ item }) {
  const name = getRegistrationName(item);
  const fileNumber = getPatientFileNumber(item);
  const date = getRegistrationDate(item);
  const visitNumber = getVisitNumber(item);
  const speciality = getSpeciality(item);

  return (
    <div style={styles.patientRow}>
      <span style={styles.patientName}>
        <span style={styles.fieldCaption}>Patient name</span>
        {name}
      </span>

      <span style={styles.patientValue}>
        <span style={styles.fieldCaption}>File number</span>
        {fileNumber !== "" ? String(fileNumber) : "—"}
      </span>

      <span style={styles.patientValue}>
        <span style={styles.fieldCaption}>Date</span>
        {date || "—"}
      </span>

      <span style={styles.patientValue}>
        <span style={styles.fieldCaption}>Visit number</span>
        {visitNumber !== "" ? String(visitNumber) : "—"}
      </span>

      <span style={styles.patientValue}>
        <span style={styles.fieldCaption}>Speciality</span>
        {speciality !== "" ? String(speciality) : "—"}
      </span>

      <span>
        <span style={styles.fieldCaption}>Patient file</span>

        <button
          type="button"
          style={styles.openFileButton}
          onClick={() => handleOpenPatientFile(item)}
          title={`Open file for ${name}`}
        >
          ↗ Open File
        </button>
      </span>
    </div>
  );
}

/* =========================================================
   COLLAPSIBLE REGISTRATION CATEGORY
========================================================= */

function RegistrationCategory({ group, initiallyExpanded = false }) {
  const [expanded, setExpanded] = useState(initiallyExpanded);

  return (
    <section style={styles.categorySection}>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
        style={{
          ...styles.categoryToggle,
          color: group.color,
          background: group.background,
          borderColor: `${group.color}40`,
          boxShadow: expanded
            ? `0 3px 12px ${group.color}12`
            : "none",
        }}
      >
        <span style={styles.categoryToggleLeft}>
          <span
            aria-hidden="true"
            style={{ ...styles.categoryIcon, color: group.color }}
          >
            {group.icon}
          </span>

          <span style={{ minWidth: 0 }}>
            <span style={{ ...styles.categoryTitle, display: "block" }}>
              {group.label}
            </span>

            <span
              style={{
                display: "block",
                marginTop: 4,
                color: COLORS.muted,
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              {expanded
                ? "Click to hide registrations"
                : "Click to view registrations"}
            </span>
          </span>
        </span>

        <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ ...styles.categoryCount, color: group.color }}>
            {group.items.length}
          </span>

          <span
            aria-hidden="true"
            style={{
              display: "grid",
              placeItems: "center",
              width: 29,
              height: 29,
              borderRadius: 9,
              background: "#FFFFFF",
              color: group.color,
              fontSize: 19,
              fontWeight: 800,
            }}
          >
            {expanded ? "−" : "+"}
          </span>
        </span>
      </button>

      {expanded && (
        <div style={styles.tableScroll}>
          <div style={styles.tableInner}>
            {group.items.map((item, index) => (
              <PatientRegistrationRow
                key={
                  item?.id ??
                  item?.assignment_id ??
                  item?.registration_id ??
                  `${group.key}-${index}`
                }
                item={item}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* =========================================================
   REGISTRATION TABLE
========================================================= */

function RegistrationTable({
  assignments = [],
  loading,
  selectedLabel,
}) {
  const groups = useMemo(
    () => getRegistrationGroups(assignments),
    [assignments]
  );

  const [allExpanded, setAllExpanded] = useState(false);
  const [categoryResetKey, setCategoryResetKey] = useState(0);

  function toggleAllCategories() {
    setAllExpanded((current) => !current);
    setCategoryResetKey((current) => current + 1);
  }

  return (
    <section style={styles.panel}>
      <div style={styles.panelHeader}>
        <span style={styles.panelTitle}>
          <span aria-hidden="true" style={styles.panelIcon}>
            ▤
          </span>

          <span>
            <span
              style={{
                display: "block",
                color: COLORS.navy,
                fontSize: 14,
                fontWeight: 850,
              }}
            >
              Patient Registrations
            </span>

            <span
              style={{
                display: "block",
                marginTop: 4,
                fontSize: 11,
                fontWeight: 550,
                color: COLORS.muted,
              }}
            >
              {selectedLabel || "Selected period"}
            </span>
          </span>
        </span>

        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            flexWrap: "wrap",
          }}
        >
          <span style={styles.countBadge}>
            {assignments.length} registrations
          </span>

          {!loading && groups.length > 0 && (
            <button
              type="button"
              style={styles.expandAllButton}
              onClick={toggleAllCategories}
              title="Expand or collapse all registration categories"
            >
              {allExpanded ? "− Collapse all" : "+ Expand all"}
            </button>
          )}
        </span>
      </div>

      <div style={styles.registrationList}>
        {loading ? (
          <div style={styles.loading}>Loading registrations…</div>
        ) : assignments.length === 0 ? (
          <div style={styles.loading}>
            No registrations found for this selection.
          </div>
        ) : (
          <>
            <div style={styles.notice}>
              <strong style={{ color: COLORS.navy }}>
                {groups.length} registration categories
              </strong>
              <span>
                {" "}
                — Select a category below to view its patient records.
              </span>
            </div>

            {groups.map((group) => (
              <RegistrationCategory
                key={`${group.key}-${categoryResetKey}`}
                group={group}
                initiallyExpanded={allExpanded}
              />
            ))}
          </>
        )}
      </div>
    </section>
  );
}

/* =========================================================
   DAILY / MONTHLY STATISTICS PANEL
========================================================= */

function StatisticsSummary({
  title,
  selectedLabel,
  loading,
  assignments = [],
  registrationLoading,
}) {
  const [expanded, setExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categoryCounts = useMemo(() => {
    const counts = {};

    CATEGORY_GROUPS.forEach((group) => {
      counts[group.key] = assignments.filter((item) =>
        matchesCategory(item, group.key)
      ).length;
    });

    return counts;
  }, [assignments]);

  const selectedAssignments = useMemo(() => {
    if (selectedCategory === "all") return assignments;

    return assignments.filter((item) =>
      matchesCategory(item, selectedCategory)
    );
  }, [assignments, selectedCategory]);

  const metrics = [
    {
      key: "appointments",
      label: "Appointments",
      value: categoryCounts.appointments,
      description: "Appointments and follow-ups",
      color: COLORS.blue,
      background: COLORS.blueBg,
      icon: "◷",
    },
    {
      key: "walk_in",
      label: "Walk-ins",
      value: categoryCounts.walk_in,
      description: "Walk-in registrations",
      color: COLORS.sky,
      background: COLORS.skyBg,
      icon: "↗",
    },
    {
      key: "without_eligibility",
      label: "Tasks Without Eligibility",
      value: categoryCounts.without_eligibility,
      description: "Eligibility needs review",
      color: COLORS.orange,
      background: COLORS.orangeBg,
      icon: "⚠",
    },
    {
      key: "evaluations",
      label: "Initial evaluations",
      value: categoryCounts.evaluations,
      description: "Initial assessments",
      color: COLORS.purple,
      background: COLORS.purpleBg,
      icon: "＋",
    },
    {
      key: "cash",
      label: "Cash",
      value: categoryCounts.cash,
      description: "Cash registrations",
      color: COLORS.green,
      background: COLORS.greenBg,
      icon: "¤",
    },
    {
      key: "no_show",
      label: "No-shows",
      value: categoryCounts.no_show,
      description: "Recorded missed visits",
      color: COLORS.red,
      background: COLORS.redBg,
      icon: "!",
    },
    {
      key: "all",
      label: "All registrations",
      value: assignments.length,
      description: "Show the complete list",
      color: COLORS.navy,
      background: "#EAF0F7",
      icon: "▤",
    },
  ];

  const selectedMetric = metrics.find(
    (metric) => metric.key === selectedCategory
  );

  const isDaily = title.toLowerCase().includes("daily");
  const accentColor = isDaily ? COLORS.blue : COLORS.teal;
  const accentBackground = isDaily ? COLORS.blueBg : COLORS.tealBg;

  return (
    <section
      style={{
        ...styles.report,
        gap: expanded ? 20 : 0,
        borderTop: `3px solid ${accentColor}`,
      }}
    >
      <button
        type="button"
        style={styles.reportToggle}
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
      >
        <span style={{ minWidth: 0 }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 11,
            }}
          >
            <span
              style={{
                display: "grid",
                placeItems: "center",
                width: 37,
                height: 37,
                borderRadius: 11,
                background: accentBackground,
                color: accentColor,
                fontSize: 19,
                fontWeight: 850,
              }}
            >
              {isDaily ? "◷" : "▦"}
            </span>

            <span
              style={{
                color: accentColor,
                fontSize: 10,
                fontWeight: 850,
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              Physiotherapy report
            </span>

            <span style={styles.statusBadge}>
              {expanded ? "OPEN" : "COLLAPSED"}
            </span>
          </span>

          <span style={{ ...styles.reportTitle, display: "block" }}>
            {title}
          </span>

          <span style={{ ...styles.subtitle, display: "block" }}>
            Summary for{" "}
            <strong style={{ color: COLORS.text }}>
              {selectedLabel || "the selected period"}
            </strong>
          </span>

          <span style={styles.summaryMeta}>
            <span style={styles.metaBadge}>
              <span aria-hidden="true">▤</span>
              {assignments.length} registrations
            </span>

            <span style={styles.metaBadge}>
              {expanded
                ? "Click to collapse details"
                : "Click to view details"}
            </span>
          </span>
        </span>

        <span style={styles.collapseIcon} aria-hidden="true">
          {expanded ? "−" : "+"}
        </span>
      </button>

      {expanded &&
        (loading ? (
          <div style={styles.loading}>
            Loading statistics for {selectedLabel || "the selected period"}…
          </div>
        ) : (
          <>
            <div style={styles.metricsGrid}>
              {metrics.map((metric) => (
                <StatisticsMetricCard
                  key={metric.key}
                  {...metric}
                  selected={selectedCategory === metric.key}
                  onClick={() =>
                    setSelectedCategory((current) =>
                      current === metric.key && metric.key !== "all"
                        ? "all"
                        : metric.key
                    )
                  }
                />
              ))}
            </div>

            <RegistrationTable
              assignments={selectedAssignments}
              loading={registrationLoading}
              selectedLabel={
                selectedCategory === "all"
                  ? selectedLabel
                  : selectedMetric?.label
              }
            />

            <div style={styles.notice}>
              <strong style={{ color: COLORS.navy }}>Selected view:</strong>{" "}
              {selectedMetric?.label || "All registrations"}. Select a
              statistics card to filter the table. Registration categories
              start collapsed.
            </div>
          </>
        ))}
    </section>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

function PhysioStatisticsSection({
  statisticsDate,
  setStatisticsDate,
  statisticsMonth,
  setStatisticsMonth,
  dailyStatistics,
  monthlyStatistics,
  dailyStatisticsLoading,
  monthlyStatisticsLoading,
  monthlyLabel,
  dailyAssignments = [],
  monthlyAssignments = [],
}) {
  return (
    <div style={styles.stack}>
      <section style={styles.filter}>
        <div style={styles.filterAccent} />

        <div style={styles.filterTop}>
          <span aria-hidden="true" style={styles.filterIcon}>
            ⚙
          </span>

          <div>
            <h3 style={styles.filterHeading}>Statistics Filters</h3>

            <div style={styles.filterDescription}>
              Select a date or month to review physiotherapy activity and
              patient registrations.
            </div>
          </div>
        </div>

        <label style={styles.filterLabel}>
          <span style={styles.filterCaption}>
            <span style={styles.filterCaptionIcon} aria-hidden="true">
              ◷
            </span>
            Daily statistics date
          </span>

          <input
            type="date"
            value={statisticsDate || ""}
            onChange={(event) => setStatisticsDate(event.target.value)}
            style={styles.filterInput}
          />

          <span style={styles.filterHint}>
            <span style={styles.filterHintDot}>●</span>
            Select a specific day to review daily activity.
          </span>
        </label>

        <label style={styles.filterLabel}>
          <span style={styles.filterCaption}>
            <span style={styles.filterCaptionIcon} aria-hidden="true">
              ▦
            </span>
            Monthly statistics month
          </span>

          <input
            type="month"
            value={statisticsMonth || ""}
            onChange={(event) => setStatisticsMonth(event.target.value)}
            style={styles.filterInput}
          />

          <span style={styles.filterHint}>
            <span style={styles.filterHintDot}>●</span>
            Select a month to review monthly activity.
          </span>
        </label>
      </section>

      <StatisticsSummary
        title="Daily Physio Statistics"
        selectedLabel={statisticsDate}
        loading={dailyStatisticsLoading}
        assignments={dailyAssignments}
        registrationLoading={dailyStatisticsLoading}
      />

      <StatisticsSummary
        title="Monthly Physio Statistics"
        selectedLabel={monthlyLabel || statisticsMonth}
        loading={monthlyStatisticsLoading}
        assignments={monthlyAssignments}
        registrationLoading={monthlyStatisticsLoading}
      />
    </div>
  );
}

export { PhysioStatisticsSection };
export default PhysioStatisticsSection;

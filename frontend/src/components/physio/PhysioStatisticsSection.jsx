
import React, { useMemo, useState } from "react";

const COLORS = {
  navy: "#234268",
  text: "#294563",
  muted: "#718096",
  subtle: "#9aa9ba",
  border: "#e7ecf3",
  borderStrong: "#d8e1ed",
  surface: "#ffffff",
  surfaceSoft: "#fbfcfe",
  header: "#f4f7fb",
  blue: "#3975d7",
  blueBg: "#f0f5ff",
  sky: "#2382b4",
  skyBg: "#eff9ff",
  orange: "#c96b35",
  orangeBg: "#fff7f0",
  purple: "#8b6bd6",
  purpleBg: "#f7f4ff",
  green: "#218b70",
  greenBg: "#effaf5",
  red: "#c65e68",
  redBg: "#fff3f4",
  slate: "#65758b",
  slateBg: "#f3f6fa",
};

const styles = {
  stack: {
    display: "grid",
    gap: 20,
    minWidth: 0,
  },
  filter: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))",
    alignItems: "end",
    gap: 16,
    padding: 22,
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    boxShadow: "0 5px 20px rgba(35, 66, 104, 0.035)",
  },
  filterHeading: {
    gridColumn: "1 / -1",
    display: "flex",
    alignItems: "center",
    gap: 10,
    margin: 0,
    color: COLORS.navy,
    fontSize: 18,
    fontWeight: 800,
  },
  filterLabel: {
    display: "grid",
    gap: 8,
    minWidth: 0,
  },
  filterCaption: {
    fontSize: 12,
    fontWeight: 750,
    color: "#687b91",
  },
  filterInput: {
    boxSizing: "border-box",
    width: "100%",
    minHeight: 43,
    padding: "10px 12px",
    border: `1px solid ${COLORS.borderStrong}`,
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    color: COLORS.text,
    background: COLORS.surface,
  },
  report: {
    display: "grid",
    gap: 18,
    minWidth: 0,
    padding: 22,
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    boxShadow: "0 7px 24px rgba(35, 66, 104, 0.04)",
    fontFamily: "Inter, Arial, sans-serif",
  },
  reportTitle: {
    margin: 0,
    color: COLORS.navy,
    fontSize: 21,
    fontWeight: 850,
    lineHeight: 1.35,
  },
  subtitle: {
    marginTop: 6,
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 1.6,
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(155px, 100%), 1fr))",
    gap: 12,
  },
  metric: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
    padding: 16,
    borderRadius: 14,
    border: "1px solid",
    cursor: "pointer",
    textAlign: "left",
    font: "inherit",
    transition:
      "background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
  },
  metricIcon: {
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    width: 40,
    height: 40,
    borderRadius: 12,
    background: "#ffffff",
    fontSize: 19,
    fontWeight: 850,
  },
  metricLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: 750,
    lineHeight: 1.5,
  },
  metricValue: {
    marginTop: 4,
    color: COLORS.navy,
    fontSize: 26,
    fontWeight: 850,
    lineHeight: 1.2,
    fontVariantNumeric: "tabular-nums",
  },
  metricDescription: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 1.5,
  },
  dropdownPanel: {
    overflow: "hidden",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 15,
    background: COLORS.surface,
    minWidth: 0,
  },
  dropdown: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    width: "100%",
    padding: "16px 18px",
    border: "none",
    background: COLORS.surfaceSoft,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 800,
    textAlign: "left",
    boxSizing: "border-box",
  },
  dropdownLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },
  dropdownIcon: {
    display: "grid",
    placeItems: "center",
    width: 38,
    height: 38,
    flexShrink: 0,
    borderRadius: 11,
    background: COLORS.skyBg,
    color: COLORS.sky,
    fontSize: 18,
  },
  countBadge: {
    padding: "6px 10px",
    borderRadius: 20,
    background: COLORS.skyBg,
    color: "#276b92",
    fontSize: 11,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  registrationList: {
    display: "grid",
    gap: 14,
    padding: 14,
    borderTop: `1px solid ${COLORS.border}`,
    minWidth: 0,
  },
  categorySection: {
    display: "grid",
    gap: 8,
    minWidth: 0,
  },
  categoryHeading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    margin: 0,
    padding: "10px 12px",
    borderRadius: 9,
    fontSize: 12,
    fontWeight: 800,
  },
  tableScroll: {
    width: "100%",
    overflowX: "auto",
    minWidth: 0,
    WebkitOverflowScrolling: "touch",
  },
  tableInner: {
    minWidth: 720,
    display: "grid",
    gap: 8,
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns:
      "minmax(150px, 1.5fr) repeat(4, minmax(100px, 1fr)) 28px",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 9,
    background: COLORS.header,
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.35px",
    minWidth: 0,
  },
  patientRow: {
    display: "grid",
    gridTemplateColumns:
      "minmax(150px, 1.5fr) repeat(4, minmax(100px, 1fr)) 28px",
    alignItems: "center",
    gap: 10,
    width: "100%",
    padding: "13px 12px",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    background: COLORS.surface,
    color: COLORS.text,
    cursor: "pointer",
    textAlign: "left",
    boxSizing: "border-box",
  },
  patientName: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 800,
    overflowWrap: "anywhere",
  },
  patientValue: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 1.5,
    overflowWrap: "anywhere",
  },
  fieldCaption: {
    display: "block",
    marginBottom: 4,
    color: COLORS.subtle,
    fontSize: 9,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.4px",
  },
  expandedDetails: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(180px, 100%), 1fr))",
    gap: "8px 16px",
    padding: 14,
    marginTop: 6,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    background: COLORS.surfaceSoft,
  },
  detail: {
    minWidth: 0,
    color: "#53657b",
    fontSize: 12,
    lineHeight: 1.6,
    overflowWrap: "anywhere",
    whiteSpace: "pre-wrap",
  },
  notice: {
    padding: "13px 15px",
    borderRadius: 11,
    background: COLORS.surfaceSoft,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 1.7,
  },
  loading: {
    padding: 22,
    borderRadius: 10,
    background: COLORS.surfaceSoft,
    border: "1px dashed #d3dce8",
    color: COLORS.muted,
    textAlign: "center",
    fontSize: 13,
  },
};

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

const FIELD_LABELS = {
  id: "Registration ID",
  assignment_id: "Assignment ID",
  registration_id: "Registration ID",
  patient_id: "Patient ID",
  patient_name: "Patient name",
  patient_full_name: "Patient name",
  full_name: "Full name",
  display_name: "Display name",
  file_number: "File number",
  file_no: "File number",
  file_num: "File number",
  file_number_id: "File number",
  patient_file_number: "File number",
  patient_file_no: "File number",
  medical_file_number: "File number",
  medical_record_number: "File number",
  mrn: "File number",
  visit_number: "Visit number",
  visit_no: "Visit number",
  visit_count: "Visit number",
  session_number: "Visit number",
  speciality: "Speciality",
  specialty: "Speciality",
  speciality_name: "Speciality",
  specialty_name: "Speciality",
  department: "Department",
  category: "Category",
  category_label: "Category",
  category_display: "Category",
  registration_type: "Registration type",
  status: "Status",
  appointment_status: "Appointment status",
  visit_status: "Visit status",
  registration_status: "Registration status",
  date: "Date",
  appointment_date: "Appointment date",
  registration_date: "Registration date",
  scheduled_date: "Scheduled date",
  appointment_datetime: "Appointment date and time",
  scheduled_at: "Scheduled at",
  registration_datetime: "Registration date and time",
  time: "Time",
  appointment_time: "Appointment time",
  scheduled_time: "Scheduled time",
  start_time: "Start time",
  end_time: "End time",
  therapist_id: "Therapist ID",
  therapist_name: "Therapist",
  physio_name: "Physiotherapist",
  physiotherapist_name: "Physiotherapist",
  therapist_username: "Therapist username",
  notes: "Notes",
  remarks: "Remarks",
  reason: "Reason",
  diagnosis: "Diagnosis",
  service: "Service",
  visit_type: "Visit type",
  payment_type: "Payment type",
  amount: "Amount",
  created_at: "Created at",
  updated_at: "Updated at",
};

const HIDDEN_FIELDS = new Set([
  "patient",
  "therapist",
  "user",
  "created_by",
  "updated_by",
]);

const FILE_NUMBER_KEYS = [
  "file_number",
  "file_no",
  "file_num",
  "patient_file_number",
  "patient_file_no",
  "medical_file_number",
  "medical_record_number",
  "mrn",
  "file_number_id",
  "fileNumber",
  "fileNo",
  "mrn_number",
];

const DATE_KEYS = [
  "appointment_date",
  "scheduled_date",
  "registration_date",
  "date",
  "appointment_datetime",
  "scheduled_at",
  "registration_datetime",
  "appointment_at",
  "visit_date",
  "service_date",
  "created_at",
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

function normalizeCategory(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[\s-]+/g, "_")
    .replace(/[^\w]/g, "");
}

function getCategoryValues(item) {
  return CATEGORY_KEYS.map((key) => normalizeCategory(item?.[key])).filter(
    Boolean
  );
}

function getCategory(item) {
  return getCategoryValues(item)[0] ?? "";
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

function getRegistrationName(item) {
  return (
    item?.patient_name ??
    item?.patient_full_name ??
    item?.patient?.patient_name ??
    item?.patient?.full_name ??
    item?.patient?.name ??
    item?.patient?.display_name ??
    item?.full_name ??
    item?.name ??
    item?.display_name ??
    "Unnamed patient"
  );
}

function getRegistrationCategory(item) {
  return (
    item?.category_label ??
    item?.category_display ??
    item?.category ??
    item?.registration_type ??
    item?.visit_type ??
    item?.task_type ??
    item?.type ??
    "Other registration"
  );
}

function firstNonEmpty(source, keys) {
  if (!source || typeof source !== "object") return "";

  for (const key of keys) {
    const value = source[key];

    if (value === null || value === undefined || value === "") continue;

    if (typeof value === "object") {
      const nestedValue =
        value.value ??
        value.number ??
        value.file_number ??
        value.file_no ??
        value.label ??
        value.name;

      if (
        nestedValue !== null &&
        nestedValue !== undefined &&
        nestedValue !== ""
      ) {
        return nestedValue;
      }

      continue;
    }

    return value;
  }

  return "";
}

function getPatientFileNumber(item) {
  const sources = [
    item,
    item?.patient,
    item?.patient_details,
    item?.patient_record,
    item?.registration,
    item?.appointment,
  ];

  for (const source of sources) {
    const value = firstNonEmpty(source, FILE_NUMBER_KEYS);
    if (value !== "") return value;
  }

  return "";
}

function getVisitNumber(item) {
  return (
    firstNonEmpty(item, [
      "visit_number",
      "visit_no",
      "visit_count",
      "session_number",
      "visitNumber",
    ]) ||
    firstNonEmpty(item?.patient, [
      "visit_number",
      "visit_no",
      "visit_count",
      "session_number",
    ]) ||
    ""
  );
}

function getSpeciality(item) {
  return (
    item?.speciality ??
    item?.specialty ??
    item?.speciality_name ??
    item?.specialty_name ??
    item?.service_name ??
    item?.service ??
    item?.department_name ??
    item?.department ??
    item?.patient?.speciality ??
    item?.patient?.specialty ??
    item?.patient?.speciality_name ??
    item?.patient?.specialty_name ??
    ""
  );
}

function getPatientId(item) {
  return (
    item?.patient_id ??
    item?.patient?.id ??
    item?.patient?.patient_id ??
    item?.patient_details?.id ??
    ""
  );
}

function formatDateValue(value) {
  if (value === null || value === undefined || value === "") return "";

  if (typeof value === "string") {
    const dateOnlyMatch = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (dateOnlyMatch) {
      return `${dateOnlyMatch[3]}/${dateOnlyMatch[2]}/${dateOnlyMatch[1]}`;
    }
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).replace("T", " ").slice(0, 16);
  }

  return [
    String(date.getDate()).padStart(2, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    date.getFullYear(),
  ].join("/");
}

function getRegistrationDate(item) {
  const sources = [item, item?.appointment, item?.registration, item?.visit];

  for (const source of sources) {
    const value = firstNonEmpty(source, DATE_KEYS);
    if (value !== "") return formatDateValue(value);
  }

  return "";
}

function getRegistrationTime(item) {
  return (
    item?.appointment_time ??
    item?.scheduled_time ??
    item?.start_time ??
    item?.time ??
    item?.appointment?.appointment_time ??
    item?.appointment?.scheduled_time ??
    ""
  );
}

function getRegistrationTherapist(item) {
  return (
    item?.therapist_name ??
    item?.physio_name ??
    item?.physiotherapist_name ??
    item?.therapist?.name ??
    item?.therapist?.full_name ??
    item?.therapist?.username ??
    item?.therapist_username ??
    ""
  );
}

function getRegistrationStatus(item) {
  return (
    item?.status ??
    item?.appointment_status ??
    item?.visit_status ??
    item?.registration_status ??
    ""
  );
}

function isNoShow(item) {
  const status = normalizeCategory(getRegistrationStatus(item));
  const noShowGroup = CATEGORY_GROUPS.find(
    (group) => group.key === "no_show"
  );

  return (
    item?.no_show === true ||
    item?.is_no_show === true ||
    ["no_show", "noshow", "did_not_attend"].includes(status) ||
    getCategoryValues(item).some((category) =>
      categoryMatchesGroup(category, noShowGroup)
    )
  );
}

function isWithoutEligibility(item) {
  const eligibilityGroup = CATEGORY_GROUPS.find(
    (group) => group.key === "without_eligibility"
  );

  return (
    item?.without_eligibility === true ||
    item?.no_eligibility === true ||
    item?.has_eligibility === false ||
    item?.eligibility === false ||
    item?.is_eligible === false ||
    getCategoryValues(item).some((category) =>
      categoryMatchesGroup(category, eligibilityGroup)
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
  if (!group) return false;

  return getCategoryValues(item).some((category) =>
    categoryMatchesGroup(category, group)
  );
}

function getStatisticsTotals(rows = []) {
  return rows.reduce(
    (totals, row) => ({
      walk_in: totals.walk_in + Number(row.walk_in || 0),
      initial_eval: totals.initial_eval + Number(row.initial_eval || 0),
      cash: totals.cash + Number(row.cash || 0),
      no_show: totals.no_show + Number(row.no_show || 0),
      seen: totals.seen + Number(row.seen || 0),
    }),
    {
      walk_in: 0,
      initial_eval: 0,
      cash: 0,
      no_show: 0,
      seen: 0,
    }
  );
}

function getFieldLabel(key) {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];

  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatFieldValue(value) {
  if (value == null || value === "") return "";

  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (entry == null) return "";

        if (typeof entry === "object") {
          return (
            entry.name ??
            entry.full_name ??
            entry.display_name ??
            entry.label ??
            entry.username ??
            JSON.stringify(entry)
          );
        }

        return String(entry);
      })
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    return (
      value.name ??
      value.full_name ??
      value.display_name ??
      value.username ??
      value.patient_name ??
      value.label ??
      value.title ??
      ""
    );
  }

  return String(value);
}

function getRegistrationGroups(assignments = []) {
  const remaining = [...assignments];
  const groups = [];

  // Show tasks without eligibility and no-shows first.
  const priorityGroups = ["without_eligibility", "no_show"];

  priorityGroups.forEach((key) => {
    const group = CATEGORY_GROUPS.find((entry) => entry.key === key);

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

  CATEGORY_GROUPS.filter(
    (group) => !priorityGroups.includes(group.key)
  ).forEach((group) => {
    const matching = remaining.filter((item) =>
      matchesCategory(item, group.key)
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
    groups.push({
      ...OTHER_GROUP,
      items: remaining,
    });
  }

  return groups;
}

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
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      title={`Show ${label.toLowerCase()} registrations below`}
      style={{
        ...styles.metric,
        background: selected ? background : `${background}B3`,
        borderColor: selected ? color : `${color}55`,
        boxShadow: selected ? `0 0 0 2px ${color}20` : "none",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          ...styles.metricIcon,
          color,
        }}
      >
        {icon}
      </span>

      <span style={{ minWidth: 0 }}>
        <span style={styles.metricLabel}>{label}</span>

        <span style={{ ...styles.metricValue, display: "block" }}>
          {value}
        </span>

        <span style={{ ...styles.metricDescription, display: "block" }}>
          {description}
        </span>
      </span>
    </button>
  );
}

function PatientRegistrationRow({ item }) {
  const [expanded, setExpanded] = useState(false);

  const name = getRegistrationName(item);
  const fileNumber = getPatientFileNumber(item);
  const date = getRegistrationDate(item);
  const visitNumber = getVisitNumber(item);
  const speciality = getSpeciality(item);
  const patientId = getPatientId(item);
  const time = getRegistrationTime(item);
  const therapist = getRegistrationTherapist(item);
  const status = getRegistrationStatus(item);

  const patientFields =
    item?.patient && typeof item.patient === "object"
      ? Object.entries(item.patient).filter(
          ([key, value]) =>
            value !== null &&
            value !== undefined &&
            value !== "" &&
            typeof value !== "object" &&
            !key.startsWith("_")
        )
      : [];

  const excludedExtraFields = new Set([
    "patient",
    "patient_details",
    "patient_record",
    "registration",
    "appointment",
    "visit",
    "patient_name",
    "patient_full_name",
    "full_name",
    "name",
    "display_name",
    "category",
    "category_label",
    "category_display",
    "registration_type",
    "task_type",
    "type",
    "visit_type",
    "appointment_date",
    "scheduled_date",
    "registration_date",
    "date",
    "appointment_datetime",
    "scheduled_at",
    "registration_datetime",
    "appointment_at",
    "visit_date",
    "service_date",
    "created_at",
    "appointment_time",
    "scheduled_time",
    "start_time",
    "time",
    "therapist_name",
    "physio_name",
    "physiotherapist_name",
    "therapist_username",
    "therapist_id",
    "patient_id",
    ...FILE_NUMBER_KEYS,
    "visit_number",
    "visit_no",
    "visit_count",
    "session_number",
    "speciality",
    "specialty",
    "speciality_name",
    "specialty_name",
    "service",
    "service_name",
    "department",
    "department_name",
  ]);

  const extraFields = Object.entries(item ?? {}).filter(
    ([key, value]) =>
      !HIDDEN_FIELDS.has(key) &&
      !excludedExtraFields.has(key) &&
      !key.startsWith("_") &&
      value !== null &&
      value !== undefined &&
      value !== ""
  );

  return (
    <div style={{ minWidth: 0 }}>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
        style={{
          ...styles.patientRow,
          borderColor: expanded ? "#a8c5ef" : COLORS.border,
          background: expanded ? "#f7faff" : COLORS.surface,
        }}
      >
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
          {speciality ? String(speciality) : "—"}
        </span>

        <span aria-hidden="true" style={{ color: COLORS.muted }}>
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div style={styles.expandedDetails}>
          {patientId !== "" && (
            <div style={styles.detail}>
              <strong>Patient ID:</strong> {String(patientId)}
            </div>
          )}

          <div style={styles.detail}>
            <strong>Registration type:</strong>{" "}
            {String(getRegistrationCategory(item))}
          </div>

          {time && (
            <div style={styles.detail}>
              <strong>Time:</strong> {String(time)}
            </div>
          )}

          {status && (
            <div style={styles.detail}>
              <strong>Status:</strong> {String(status)}
            </div>
          )}

          {therapist && (
            <div style={styles.detail}>
              <strong>Therapist:</strong> {String(therapist)}
            </div>
          )}

          {patientFields.map(([key, value]) => (
            <div key={`patient-${key}`} style={styles.detail}>
              <strong>{getFieldLabel(key)}:</strong>{" "}
              {formatFieldValue(value)}
            </div>
          ))}

          {extraFields.map(([key, value]) => {
            const formatted = formatFieldValue(value);
            if (!formatted) return null;

            return (
              <div key={key} style={styles.detail}>
                <strong>{getFieldLabel(key)}:</strong> {formatted}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RegistrationTable({
  assignments = [],
  loading,
  selectedLabel,
}) {
  const groups = useMemo(
    () => getRegistrationGroups(assignments),
    [assignments]
  );

  return (
    <section style={styles.dropdownPanel}>
      <div style={{ ...styles.dropdown, cursor: "default" }}>
        <span style={styles.dropdownLeft}>
          <span aria-hidden="true" style={styles.dropdownIcon}>
            ▤
          </span>

          <span>
            Registrations — {selectedLabel || "Selected period"}
          </span>
        </span>

        <span style={styles.countBadge}>
          {assignments.length} registrations
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
              Click a patient row to expand its details. Each registration is
              displayed separately, including repeat registrations for the
              same patient.
            </div>

            <div style={styles.tableScroll}>
              <div style={styles.tableInner}>
                <div style={styles.tableHeader}>
                  <span>Patient name</span>
                  <span>File number</span>
                  <span>Date</span>
                  <span>Visit number</span>
                  <span>Speciality</span>
                  <span />
                </div>

                {groups.map((group) => (
                  <section
                    key={group.key}
                    style={styles.categorySection}
                  >
                    <h4
                      style={{
                        ...styles.categoryHeading,
                        color: group.color,
                        background: group.background,
                      }}
                    >
                      <span>
                        {group.icon} &nbsp; {group.label}
                      </span>

                      <span>{group.items.length}</span>
                    </h4>

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
                  </section>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function StatisticsSummary({
  title,
  selectedLabel,
  stats,
  loading,
  assignments = [],
  registrationLoading,
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const rows = stats?.rows ?? [];

  const totals = useMemo(() => getStatisticsTotals(rows), [rows]);

  const categoryCounts = useMemo(() => {
    const counts = {};

    CATEGORY_GROUPS.forEach((group) => {
      counts[group.key] = assignments.filter((item) =>
        matchesCategory(item, group.key)
      ).length;
    });

    counts.other = assignments.filter((item) =>
      matchesCategory(item, "other")
    ).length;

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
      background: "#eaf1ff",
      icon: "◷",
    },
    {
      key: "walk_in",
      label: "Walk-ins",
      value: categoryCounts.walk_in,
      description: "Walk-in registrations",
      color: COLORS.sky,
      background: "#e8f6fd",
      icon: "↗",
    },
    {
      key: "without_eligibility",
      label: "Tasks Without Eligibility",
      value: categoryCounts.without_eligibility,
      description: "Eligibility needs review",
      color: COLORS.orange,
      background: "#fff1e5",
      icon: "⚠",
    },
    {
      key: "evaluations",
      label: "Initial evaluations",
      value: categoryCounts.evaluations,
      description: "Initial assessments",
      color: COLORS.purple,
      background: "#f0eaff",
      icon: "＋",
    },
    {
      key: "cash",
      label: "Cash",
      value: categoryCounts.cash,
      description: "Cash registrations",
      color: COLORS.green,
      background: "#e4f7ed",
      icon: "¤",
    },
    {
      key: "no_show",
      label: "No-shows",
      value: categoryCounts.no_show,
      description: "Recorded missed visits",
      color: COLORS.red,
      background: "#ffebed",
      icon: "!",
    },
    {
      key: "all",
      label: "All registrations",
      value: assignments.length,
      description: "Show the complete list",
      color: COLORS.slate,
      background: "#edf1f6",
      icon: "▤",
    },
  ];

  const selectedMetric = metrics.find(
    (metric) => metric.key === selectedCategory
  );

  return (
    <section style={styles.report}>
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            marginBottom: 8,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              display: "grid",
              placeItems: "center",
              width: 34,
              height: 34,
              borderRadius: 10,
              background: COLORS.greenBg,
              color: COLORS.green,
              fontSize: 18,
              fontWeight: 850,
            }}
          >
            ▦
          </span>

          <span
            style={{
              color: COLORS.green,
              fontSize: 10,
              fontWeight: 850,
              letterSpacing: "0.9px",
              textTransform: "uppercase",
            }}
          >
            Physiotherapy statistics
          </span>
        </div>

        <h2 style={styles.reportTitle}>{title}</h2>

        <div style={styles.subtitle}>
          Summary for{" "}
          <strong style={{ color: COLORS.text }}>
            {selectedLabel || "the selected period"}
          </strong>
        </div>
      </div>

      {loading ? (
        <div style={styles.loading}>
          Loading statistics for {selectedLabel}…
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
            <strong>Selected view:</strong>{" "}
            {selectedMetric?.label || "All registrations"}. Click a statistics
            block to filter the registration table. Click the selected block
            again to return to all registrations.
          </div>
        </>
      )}
    </section>
  );
}

export default function PhysioStatisticsSection({
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
        <h3 style={styles.filterHeading}>
          <span
            aria-hidden="true"
            style={{
              display: "grid",
              placeItems: "center",
              width: 35,
              height: 35,
              borderRadius: 10,
              background: COLORS.greenBg,
              color: COLORS.green,
              fontSize: 18,
            }}
          >
            ⚙
          </span>

          Statistics Filters
        </h3>

        <label style={styles.filterLabel}>
          <span style={styles.filterCaption}>Daily statistics date</span>

          <input
            type="date"
            value={statisticsDate}
            onChange={(event) => setStatisticsDate(event.target.value)}
            style={styles.filterInput}
          />
        </label>

        <label style={styles.filterLabel}>
          <span style={styles.filterCaption}>Monthly statistics month</span>

          <input
            type="month"
            value={statisticsMonth}
            onChange={(event) => setStatisticsMonth(event.target.value)}
            style={styles.filterInput}
          />
        </label>
      </section>

      <StatisticsSummary
        stats={dailyStatistics}
        title="Daily Physio Statistics"
        selectedLabel={statisticsDate}
        loading={dailyStatisticsLoading}
        assignments={dailyAssignments}
        registrationLoading={dailyStatisticsLoading}
      />

      <StatisticsSummary
        stats={monthlyStatistics}
        title="Monthly Physio Statistics"
        selectedLabel={monthlyLabel || statisticsMonth}
        loading={monthlyStatisticsLoading}
        assignments={monthlyAssignments}
        registrationLoading={monthlyStatisticsLoading}
      />
    </div>
  );
}

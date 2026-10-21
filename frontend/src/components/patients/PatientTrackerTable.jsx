
import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";

const INSURANCE_OPTIONS = [
  { value: "thiqa", label: "Thiqa" },
  { value: "daman", label: "Daman" },
  { value: "cash", label: "Cash" },
];

const STATUS_OPTIONS = [
  { value: "inactive", label: "Inactive" },
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" },
  {
    value: "with_another_therapist",
    label: "With Another Therapist",
  },
];

const COLORS = {
  navy: "#17365d",
  text: "#243b5a",
  muted: "#7185a3",
  border: "#dce6f2",
  white: "#ffffff",
  blue: "#3268f5",
  blueLight: "#eff6ff",
  blueBorder: "#d6e7ff",
  purple: "#8b32ed",
  purpleLight: "#f7f1ff",
  purpleBorder: "#e8d4ff",
  orange: "#e76a16",
  orangeLight: "#fff7ed",
  orangeBorder: "#ffd8ad",
  green: "#059669",
  greenLight: "#ecfdf5",
  red: "#b91c1c",
};

function normalizeInsurance(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  if (normalized.includes("thiqa")) return "thiqa";
  if (normalized.includes("daman")) return "daman";

  if (
    ["cash", "selfpay", "selfpaid", "cashpatient"].includes(normalized)
  ) {
    return "cash";
  }

  return "not_set";
}

function getInsurance(patient) {
  return normalizeInsurance(
    patient?.insurance_type ??
      patient?.insuranceType ??
      patient?.insurance_name ??
      patient?.insuranceName ??
      patient?.insurance_provider ??
      patient?.insuranceProvider ??
      patient?.insurance ??
      patient?.payer ??
      ""
  );
}

function getInsuranceLabel(value) {
  return (
    INSURANCE_OPTIONS.find((item) => item.value === value)?.label ||
    "Not Set"
  );
}

function getSessions(patient) {
  const value = Number(
    patient?.utilized_sessions ??
      patient?.utilizedSessions ??
      patient?.sessions_used ??
      patient?.session_count ??
      patient?.sessions_count ??
      0
  );

  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function getCategorySessions(patient, category) {
  const fieldNames = {
    thiqa: ["thiqa_sessions", "thiqa_utilized_sessions", "thiqaSessions"],
    daman: ["daman_sessions", "daman_utilized_sessions", "damanSessions"],
    cash: ["cash_sessions", "cash_utilized_sessions", "cashSessions"],
  };

  for (const field of fieldNames[category] || []) {
    if (patient?.[field] !== undefined && patient?.[field] !== null) {
      const value = Number(patient[field]);
      return Number.isFinite(value) && value >= 0 ? value : 0;
    }
  }

  return 0;
}

function getStatusLabel(status) {
  const value = String(status || "inactive").toLowerCase();

  return (
    STATUS_OPTIONS.find(
      (item) =>
        item.value === value || item.label.toLowerCase() === value
    )?.label || "Inactive"
  );
}

function getStatusStyle(status) {
  switch (getStatusLabel(status)) {
    case "High":
      return {
        background: "#ecfdf5",
        color: "#047857",
        dot: "#059669",
        border: "#a7f3d0",
      };
    case "Moderate":
      return {
        background: "#eff6ff",
        color: "#1d4ed8",
        dot: "#3268f5",
        border: "#bfdbfe",
      };
    case "Low":
      return {
        background: "#fff7ed",
        color: "#9a3412",
        dot: "#e76a16",
        border: "#fed7aa",
      };
    case "With Another Therapist":
      return {
        background: "#f7f1ff",
        color: "#7435db",
        dot: "#8b32ed",
        border: "#e8d4ff",
      };
    default:
      return {
        background: "#f1f5f9",
        color: "#64748b",
        dot: "#94a3b8",
        border: "#dce6f2",
      };
  }
}

function formatDate(value) {
  if (!value) return "-";

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);

  return match ? `${match[3]}/${match[2]}/${match[1]}` : String(value);
}

function normalizeMonth(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}` : "";
}

function getInitials(name) {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);

  return words.length
    ? words.slice(0, 2).map((word) => word[0]).join("").toUpperCase()
    : "?";
}

function normalizeFileNumber(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .trim()
    .replace(/\.0$/, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function getPatientFileNumber(patient) {
  return (
    patient?.file_number ??
    patient?.patient_file_number ??
    patient?.patientFileNumber ??
    patient?.patient_id ??
    ""
  );
}

function getSpeciality(patient) {
  const assignment =
    patient?.latest_assignment ||
    patient?.latestAssignment ||
    patient?.assignment ||
    {};

  const values = [
    patient?.speciality,
    patient?.specialty,
    patient?.speciality_name,
    patient?.specialty_name,
    patient?.speciality_display,
    patient?.specialty_display,
    patient?.assigned_speciality,
    patient?.assigned_specialty,
    patient?.department_name,
    patient?.department,
    patient?.service_name,
    assignment?.speciality,
    assignment?.specialty,
    assignment?.speciality_name,
    assignment?.specialty_name,
    assignment?.department,
    assignment?.department_name,
  ];

  const value = values.find(
    (item) => item !== null && item !== undefined && String(item).trim()
  );

  return value ? String(value).trim() : "-";
}

function getHeaderKey(row, candidates) {
  return Object.keys(row || {}).find((key) => {
    const normalized = String(key)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    return candidates.includes(normalized);
  });
}

function getApiBaseUrl() {
  return String(axios.defaults.baseURL || "").replace(/\/+$/, "");
}

async function sendTrackerAction(payload) {
  const baseUrl = getApiBaseUrl();

  const url = /\/api$/i.test(baseUrl)
    ? `${baseUrl}/patients/tracker/`
    : `${baseUrl}/api/patients/tracker/`;

  const response = await axios.post(url, payload);
  return response.data;
}

const INSURANCE_BADGE_STYLES = {
  thiqa: {
    background: "#ecfdf5",
    color: "#047857",
    border: "1px solid #a7f3d0",
  },
  daman: {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
  },
  cash: {
    background: "#fff7ed",
    color: "#9a3412",
    border: "1px solid #fed7aa",
  },
  not_set: {
    background: "#f1f5f9",
    color: "#64748b",
    border: "1px solid #dce6f2",
  },
};

const styles = {
  page: {
    display: "grid",
    gap: 24,
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    color: COLORS.text,
    fontFamily: "Inter, Arial, sans-serif",
  },
  card: {
    display: "grid",
    gap: 24,
    minWidth: 0,
    padding: "clamp(16px, 2.5vw, 28px)",
    background: COLORS.white,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 17,
    boxShadow: "0 8px 25px rgba(31, 55, 89, 0.035)",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 18,
    paddingBottom: 22,
    borderBottom: "1px solid #edf2f7",
  },
  headingContent: {
    display: "grid",
    gap: 8,
    flex: "1 1 300px",
    minWidth: 0,
  },
  eyebrow: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    justifySelf: "start",
    padding: "7px 13px",
    borderRadius: 9,
    background: "#eee8ff",
    color: "#7435db",
    fontSize: 11,
    fontWeight: 850,
    letterSpacing: "0.8px",
    textTransform: "uppercase",
  },
  title: {
    margin: 0,
    color: COLORS.navy,
    fontSize: "clamp(22px, 2.5vw, 28px)",
    fontWeight: 850,
    letterSpacing: "-0.7px",
    lineHeight: 1.25,
    overflowWrap: "anywhere",
  },
  subtitle: {
    margin: 0,
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 1.7,
    maxWidth: 720,
  },
  headerRight: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 12,
    minWidth: 0,
  },
  monthFilter: {
    display: "grid",
    gap: 7,
  },
  fieldLabel: {
    display: "block",
    color: COLORS.text,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.4px",
    textTransform: "uppercase",
  },
  monthInput: {
    minHeight: 43,
    minWidth: 175,
    boxSizing: "border-box",
    padding: "9px 12px",
    border: `1px solid ${COLORS.blueBorder}`,
    borderRadius: 10,
    background: "#f8fbff",
    color: COLORS.navy,
    fontSize: 13,
    fontWeight: 750,
    fontFamily: "inherit",
    outlineColor: COLORS.blue,
  },
  monthBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 39,
    padding: "8px 13px",
    borderRadius: 24,
    border: `1px solid ${COLORS.purpleBorder}`,
    background: COLORS.purpleLight,
    color: COLORS.purple,
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  monthBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: COLORS.purple,
    flexShrink: 0,
  },
  errorMessage: {
    padding: 14,
    border: "1px solid #fecdd3",
    borderRadius: 13,
    background: "#fff1f2",
    color: COLORS.red,
    fontSize: 13,
    lineHeight: 1.7,
  },
  successMessage: {
    padding: 14,
    border: "1px solid #bbf7d0",
    borderRadius: 13,
    background: COLORS.greenLight,
    color: "#166534",
    fontSize: 13,
    lineHeight: 1.7,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
    gap: 14,
    minWidth: 0,
  },
  summaryCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    minWidth: 0,
    padding: "17px 15px",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 15,
    background: COLORS.white,
    boxShadow: "0 3px 12px rgba(31, 55, 89, 0.025)",
  },
  summaryIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 45,
    height: 45,
    flexShrink: 0,
    borderRadius: 13,
    fontSize: 22,
    fontWeight: 800,
  },
  summaryContent: {
    display: "grid",
    gap: 6,
    minWidth: 0,
  },
  summaryLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: 750,
    lineHeight: 1.5,
  },
  summaryValue: {
    color: COLORS.navy,
    fontSize: 25,
    fontWeight: 850,
    lineHeight: 1.1,
    fontVariantNumeric: "tabular-nums",
  },
  sectionHeading: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  sectionTitle: {
    margin: 0,
    color: COLORS.navy,
    fontSize: 18,
    fontWeight: 850,
  },
  sectionSubtitle: {
    margin: "6px 0 0",
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 1.65,
  },
  sectionBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 13px",
    borderRadius: 24,
    background: COLORS.purpleLight,
    color: COLORS.purple,
    fontSize: 11,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  insuranceSummary: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
    gap: 14,
    minWidth: 0,
  },
  insuranceCard: {
    display: "grid",
    justifyItems: "start",
    alignContent: "start",
    gap: 8,
    minWidth: 0,
    padding: 17,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 14,
    background: "#f8fbff",
    color: COLORS.navy,
    textAlign: "left",
    boxSizing: "border-box",
  },
  insuranceCardLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: 850,
    letterSpacing: "0.6px",
  },
  insuranceCardValue: {
    color: COLORS.navy,
    fontSize: 27,
    fontWeight: 850,
    fontVariantNumeric: "tabular-nums",
  },
  insuranceCardHint: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 1.5,
  },
  tableHeading: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 16,
  },
  tableHeadingIntro: {
    display: "grid",
    gap: 6,
    minWidth: 0,
  },
  tableTitle: {
    margin: 0,
    color: COLORS.navy,
    fontSize: 18,
    fontWeight: 850,
  },
  tableSubtitle: {
    margin: 0,
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 1.65,
  },
  headingActions: {
    display: "flex",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: 10,
  },
  importTypeField: {
    display: "grid",
    gap: 6,
    minWidth: 110,
  },
  toolbarSelect: {
    minHeight: 42,
    boxSizing: "border-box",
    padding: "9px 12px",
    border: `1px solid ${COLORS.blueBorder}`,
    borderRadius: 10,
    background: "#f8fbff",
    color: COLORS.navy,
    fontSize: 13,
    fontFamily: "inherit",
    cursor: "pointer",
  },
  importButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 42,
    padding: "10px 15px",
    border: "1px solid #a7f3d0",
    borderRadius: 24,
    background: COLORS.greenLight,
    color: "#047857",
    fontSize: 12,
    fontWeight: 800,
    fontFamily: "inherit",
    cursor: "pointer",
  },
  rolloverButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 42,
    padding: "10px 15px",
    border: `1px solid ${COLORS.purpleBorder}`,
    borderRadius: 24,
    background: COLORS.purpleLight,
    color: COLORS.purple,
    fontSize: 12,
    fontWeight: 800,
    fontFamily: "inherit",
    cursor: "pointer",
  },
  importResult: {
    display: "grid",
    gap: 7,
    padding: 15,
    border: "1px solid #bbf7d0",
    borderRadius: 13,
    background: COLORS.greenLight,
    color: "#166534",
    fontSize: 12,
    lineHeight: 1.7,
  },
  importWarning: {
    color: "#92400e",
    fontWeight: 750,
  },
  filterPanel: {
    display: "flex",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: 14,
    padding: 18,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 15,
    background: "#f8fbff",
    boxSizing: "border-box",
  },
  filterField: {
    display: "grid",
    gap: 7,
    flex: "1 1 210px",
    minWidth: 0,
  },
  input: {
    width: "100%",
    minHeight: 44,
    boxSizing: "border-box",
    padding: "10px 13px",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    background: COLORS.white,
    color: COLORS.text,
    fontSize: 13,
    fontFamily: "inherit",
    outlineColor: COLORS.blue,
  },
  select: {
    width: "100%",
    minHeight: 44,
    boxSizing: "border-box",
    padding: "9px 12px",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    background: COLORS.white,
    color: COLORS.text,
    fontSize: 13,
    fontFamily: "inherit",
    cursor: "pointer",
    outlineColor: COLORS.blue,
  },
  filterResult: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    minHeight: 44,
    color: COLORS.muted,
    fontSize: 12,
    whiteSpace: "nowrap",
  },
  filterResultNumber: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 30,
    height: 30,
    padding: "0 8px",
    borderRadius: 9,
    background: COLORS.blueLight,
    color: COLORS.blue,
    fontSize: 13,
    fontWeight: 850,
  },
  clearFiltersButton: {
    minHeight: 40,
    padding: "9px 14px",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 24,
    background: COLORS.white,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 750,
    fontFamily: "inherit",
    cursor: "pointer",
  },
  tableWrap: {
    width: "100%",
    minWidth: 0,
    overflowX: "auto",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 15,
    background: COLORS.white,
  },
  table: {
    width: "100%",
    minWidth: 1240,
    tableLayout: "fixed",
    borderCollapse: "separate",
    borderSpacing: 0,
    background: COLORS.white,
  },
  th: {
    position: "sticky",
    top: 0,
    padding: "14px 12px",
    textAlign: "left",
    background: "#f3f7fc",
    color: "#61738a",
    fontSize: 10,
    fontWeight: 850,
    letterSpacing: "0.4px",
    whiteSpace: "nowrap",
    borderBottom: `1px solid ${COLORS.border}`,
  },
  tr: {
    background: COLORS.white,
  },
  td: {
    padding: "15px 12px",
    color: "#465970",
    fontSize: 12,
    verticalAlign: "middle",
    borderBottom: "1px solid #edf2f7",
    overflowWrap: "anywhere",
  },
  patientTd: {
    padding: "15px 14px",
    color: "#465970",
    fontSize: 12,
    verticalAlign: "middle",
    borderBottom: "1px solid #edf2f7",
  },
  patientCell: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    minWidth: 0,
  },
  avatar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 42,
    height: 42,
    flexShrink: 0,
    borderRadius: 12,
    background: "linear-gradient(135deg, #eff6ff, #eee8ff)",
    color: COLORS.navy,
    fontSize: 12,
    fontWeight: 850,
    border: `1px solid ${COLORS.blueBorder}`,
  },
  patientInfo: {
    display: "grid",
    justifyItems: "start",
    gap: 6,
    minWidth: 0,
    flex: 1,
  },
  patientName: {
    display: "block",
    width: "100%",
    color: COLORS.navy,
    fontSize: 12,
    fontWeight: 800,
    lineHeight: 1.6,
    overflowWrap: "anywhere",
    whiteSpace: "normal",
  },
  newBadge: {
    width: "fit-content",
    padding: "4px 7px",
    borderRadius: 7,
    background: COLORS.orangeLight,
    color: "#c2410c",
    border: `1px solid ${COLORS.orangeBorder}`,
    fontSize: 8,
    fontWeight: 850,
    letterSpacing: "0.3px",
  },
  oldBadge: {
    width: "fit-content",
    padding: "4px 7px",
    borderRadius: 7,
    background: "#f1f5f9",
    color: "#64748b",
    border: "1px solid #e2e8f0",
    fontSize: 8,
    fontWeight: 850,
    letterSpacing: "0.3px",
  },
  fileNumber: {
    display: "inline-flex",
    alignItems: "center",
    maxWidth: "100%",
    padding: "8px 9px",
    border: `1px solid ${COLORS.blueBorder}`,
    borderRadius: 9,
    background: COLORS.blueLight,
    color: COLORS.navy,
    fontSize: 11,
    fontWeight: 800,
    lineHeight: 1.4,
    fontVariantNumeric: "tabular-nums",
    overflowWrap: "anywhere",
  },
  insuranceBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    maxWidth: "100%",
    padding: "7px 10px",
    borderRadius: 24,
    fontSize: 10,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  sessionsCell: {
    display: "grid",
    gap: 8,
    minWidth: 0,
  },
  sessionsTop: {
    display: "flex",
    alignItems: "baseline",
    gap: 5,
    flexWrap: "wrap",
  },
  sessionCount: {
    color: COLORS.navy,
    fontSize: 17,
    fontWeight: 850,
    lineHeight: 1.2,
    fontVariantNumeric: "tabular-nums",
  },
  sessionUnit: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: 650,
  },
  cashSessionNote: {
    color: "#9a3412",
    fontSize: 10,
    fontWeight: 750,
  },
  progressTrack: {
    width: 90,
    maxWidth: "100%",
    height: 6,
    overflow: "hidden",
    borderRadius: 24,
    background: "#e9eef5",
  },
  progressFill: {
    height: "100%",
    borderRadius: 24,
    transition: "width 0.2s ease",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    width: "fit-content",
    maxWidth: "100%",
    padding: "7px 9px",
    border: "1px solid transparent",
    borderRadius: 24,
    fontSize: 10,
    fontWeight: 800,
    whiteSpace: "normal",
    lineHeight: 1.45,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    flexShrink: 0,
  },
  specialityText: {
    display: "block",
    maxWidth: "100%",
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 650,
    lineHeight: 1.6,
    overflowWrap: "anywhere",
  },
  dateText: {
    display: "inline-block",
    color: COLORS.text,
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1.5,
    whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums",
  },
  openButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 90,
    minHeight: 38,
    padding: "8px 12px",
    border: `1px solid ${COLORS.navy}`,
    borderRadius: 24,
    background: COLORS.navy,
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 800,
    fontFamily: "inherit",
    cursor: "pointer",
    textAlign: "center",
    boxShadow: "0 3px 8px rgba(23, 54, 93, 0.12)",
  },
  emptyState: {
    display: "grid",
    justifyItems: "center",
    gap: 12,
    padding: "42px 20px",
    border: `1px dashed ${COLORS.border}`,
    borderRadius: 15,
    background: "#f8fbff",
    textAlign: "center",
  },
  emptyIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 52,
    height: 52,
    borderRadius: 15,
    background: COLORS.blueLight,
    color: COLORS.blue,
    fontSize: 26,
  },
  emptyTitle: {
    margin: 0,
    color: COLORS.navy,
    fontSize: 16,
    fontWeight: 850,
  },
  emptyText: {
    maxWidth: 440,
    margin: 0,
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 1.7,
  },
  footer: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "14px 17px",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    background: "#f8fafc",
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 1.75,
  },
  footerDot: {
    width: 8,
    height: 8,
    flexShrink: 0,
    marginTop: 6,
    borderRadius: "50%",
    background: COLORS.purple,
  },
};

export default function PatientTrackerTable({
  patients = [],
  title = "Patient Tracker",
  monthLabel = "",
  selectedMonth = "",
  onMonthChange,
  onRefresh,
}) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [busyAction, setBusyAction] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchName, setSearchName] = useState("");
  const [selectedSpeciality, setSelectedSpeciality] = useState("all");
  const [importInsurance, setImportInsurance] = useState("thiqa");
  const [insuranceOverrides, setInsuranceOverrides] = useState({});
  const [importSummary, setImportSummary] = useState(null);

  // Imported insurance types are temporary display overrides.
  // They are not saved to the database by this component.
  const trackerPatients = useMemo(
    () =>
      patients.map((patient) => {
        const fileNumber = normalizeFileNumber(
          getPatientFileNumber(patient)
        );
        const override = fileNumber
          ? insuranceOverrides[fileNumber]
          : undefined;

        return override
          ? { ...patient, insurance_type: override }
          : patient;
      }),
    [patients, insuranceOverrides]
  );

  const specialityOptions = useMemo(
    () =>
      [
        ...new Set(
          trackerPatients
            .map(getSpeciality)
            .filter((value) => value !== "-")
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [trackerPatients]
  );

  const summary = useMemo(() => {
    const activeStatuses = new Set(["low", "moderate", "high"]);

    const result = {
      totalPatients: trackerPatients.length,
      activePatients: 0,
      inactivePatients: 0,
      totalSessions: 0,
      thiqaPatients: 0,
      damanPatients: 0,
      cashPatients: 0,
      thiqaSessions: 0,
      damanSessions: 0,
      cashSessions: 0,
    };

    trackerPatients.forEach((patient) => {
      const status = String(patient.status || "inactive").toLowerCase();
      const insurance = getInsurance(patient);

      if (activeStatuses.has(status)) result.activePatients += 1;
      if (status === "inactive") result.inactivePatients += 1;

      result.totalSessions += getSessions(patient);
      result.thiqaSessions += getCategorySessions(patient, "thiqa");
      result.damanSessions += getCategorySessions(patient, "daman");
      result.cashSessions += getCategorySessions(patient, "cash");

      if (insurance === "thiqa") result.thiqaPatients += 1;
      if (insurance === "daman") result.damanPatients += 1;
      if (insurance === "cash") result.cashPatients += 1;
    });

    return result;
  }, [trackerPatients]);

  // The patient list is filtered by name and speciality only.
  const filteredPatients = useMemo(() => {
    const search = searchName.trim().toLowerCase();

    return trackerPatients.filter((patient) => {
      const name = String(patient.name || "").toLowerCase();
      const speciality = getSpeciality(patient);

      return (
        (!search || name.includes(search)) &&
        (selectedSpeciality === "all" ||
          speciality === selectedSpeciality)
      );
    });
  }, [trackerPatients, searchName, selectedSpeciality]);

  const clearMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const refreshTracker = async () => {
    if (typeof onRefresh === "function") {
      await onRefresh();
    }
  };

  const clearFilters = () => {
    setSearchName("");
    setSelectedSpeciality("all");
  };

  const openPatientFile = (patient) => {
    if (patient?.id) navigate(`/patients/${patient.id}`);
  };

  const rolloverMonth = async () => {
    if (!selectedMonth) {
      setErrorMessage("Please select a reporting month before rollover.");
      setSuccessMessage("");
      return;
    }

    const confirmed = window.confirm(
      `Carry eligible patients from ${selectedMonth} into the next month? Patients marked Inactive or With Another Therapist will be excluded.`
    );

    if (!confirmed) return;

    clearMessages();
    setBusyAction("rollover");

    try {
      const result = await sendTrackerAction({
        action: "rollover",
        month: selectedMonth,
      });

      setSuccessMessage(result?.message || "Monthly rollover completed.");
      await refreshTracker();
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.error ||
          "Monthly rollover failed. Please try again."
      );
    } finally {
      setBusyAction("");
    }
  };

  const handleInsuranceImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    clearMessages();
    setImportSummary(null);
    setBusyAction("insurance-import");

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

      if (!firstSheet) {
        throw new Error("The selected file does not contain a worksheet.");
      }

      const rows = XLSX.utils.sheet_to_json(firstSheet, {
        defval: "",
        raw: false,
      });

      if (!rows.length) {
        throw new Error("The selected file is empty.");
      }

      const firstRow = rows[0];

      const fileNumberKey = getHeaderKey(firstRow, [
        "filenumber",
        "patientfilenumber",
        "patientfile",
        "patientid",
        "fileid",
        "fileno",
        "patientnumber",
        "patientfileno",
        "mrn",
        "medicalrecordnumber",
      ]);

      if (!fileNumberKey) {
        throw new Error(
          "Could not find a File Number column. Include File Number, Patient File Number, or Patient ID."
        );
      }

      const insuranceKey = getHeaderKey(firstRow, [
        "insurancetype",
        "insurance",
        "insurancename",
        "insuranceprovider",
        "payer",
        "payername",
      ]);

      const existingFileNumbers = new Set(
        trackerPatients
          .map((patient) =>
            normalizeFileNumber(getPatientFileNumber(patient))
          )
          .filter(Boolean)
      );

      const updates = {};
      const importedNumbers = new Set();
      let matchedRows = 0;
      let unmatchedRows = 0;
      let invalidRows = 0;

      rows.forEach((row) => {
        const fileNumber = normalizeFileNumber(row[fileNumberKey]);

        if (!fileNumber) {
          invalidRows += 1;
          return;
        }

        if (!existingFileNumbers.has(fileNumber)) {
          unmatchedRows += 1;
          return;
        }

        const importedInsurance =
          insuranceKey && String(row[insuranceKey] || "").trim()
            ? normalizeInsurance(row[insuranceKey])
            : importInsurance;

        const insurance = ["thiqa", "daman", "cash"].includes(
          importedInsurance
        )
          ? importedInsurance
          : importInsurance;

        updates[fileNumber] = insurance;
        importedNumbers.add(fileNumber);
        matchedRows += 1;
      });

      if (!matchedRows) {
        throw new Error(
          "No imported file numbers matched patients in the current tracker. Check the file numbers and reporting month."
        );
      }

      setInsuranceOverrides((previous) => ({
        ...previous,
        ...updates,
      }));

      setImportSummary({
        fileName: file.name,
        matchedRows,
        uniquePatients: importedNumbers.size,
        unmatchedRows,
        invalidRows,
      });

      setSuccessMessage(
        `${importedNumbers.size} patient insurance assignment(s) applied to the current display.`
      );
    } catch (error) {
      setErrorMessage(
        error?.message || "Could not import the insurance file."
      );
    } finally {
      setBusyAction("");
    }
  };

  const insuranceCards = [
    {
      key: "thiqa",
      label: "THIQA PATIENTS",
      value: summary.thiqaPatients,
      sessions: summary.thiqaSessions,
      color: COLORS.green,
      background: COLORS.greenLight,
      border: "#a7f3d0",
    },
    {
      key: "daman",
      label: "DAMAN PATIENTS",
      value: summary.damanPatients,
      sessions: summary.damanSessions,
      color: COLORS.blue,
      background: COLORS.blueLight,
      border: COLORS.blueBorder,
    },
    {
      key: "cash",
      label: "CASH PATIENTS",
      value: summary.cashPatients,
      sessions: summary.cashSessions,
      color: COLORS.orange,
      background: COLORS.orangeLight,
      border: COLORS.orangeBorder,
    },
  ];

  const summaryCards = [
    {
      label: "Total Patients",
      value: summary.totalPatients,
      icon: "♧",
      color: COLORS.blue,
      background: COLORS.blueLight,
    },
    {
      label: "Active Patients",
      value: summary.activePatients,
      icon: "✓",
      color: COLORS.green,
      background: COLORS.greenLight,
    },
    {
      label: "Utilized Sessions",
      value: summary.totalSessions,
      icon: "▤",
      color: COLORS.purple,
      background: COLORS.purpleLight,
    },
    {
      label: "Inactive Patients",
      value: summary.inactivePatients,
      icon: "!",
      color: COLORS.orange,
      background: COLORS.orangeLight,
    },
  ];

  return (
    <section style={styles.page}>
      <div style={styles.card}>
        <header style={styles.header}>
          <div style={styles.headingContent}>
            <span style={styles.eyebrow}>PATIENT TRACKER</span>
            <h2 style={styles.title}>{title}</h2>
            <p style={styles.subtitle}>
              Monitor patient activity, insurance coverage, utilized
              sessions, and follow-up status in one place.
            </p>
          </div>

          <div style={styles.headerRight}>
            {onMonthChange && (
              <label style={styles.monthFilter}>
                <span style={styles.fieldLabel}>REPORTING MONTH</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(event) => onMonthChange(event.target.value)}
                  style={styles.monthInput}
                />
              </label>
            )}

            {monthLabel && (
              <span style={styles.monthBadge}>
                <span style={styles.monthBadgeDot} />
                {monthLabel}
              </span>
            )}
          </div>
        </header>

        {errorMessage && (
          <div role="alert" style={styles.errorMessage}>
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div role="status" style={styles.successMessage}>
            {successMessage}
          </div>
        )}

        <section aria-label="Patient summary" style={styles.summaryGrid}>
          {summaryCards.map((item) => (
            <div key={item.label} style={styles.summaryCard}>
              <div
                style={{
                  ...styles.summaryIcon,
                  color: item.color,
                  background: item.background,
                }}
                aria-hidden="true"
              >
                {item.icon}
              </div>

              <div style={styles.summaryContent}>
                <span style={styles.summaryLabel}>{item.label}</span>
                <strong style={styles.summaryValue}>
                  {item.value.toLocaleString()}
                </strong>
              </div>
            </div>
          ))}
        </section>

        <section aria-label="Insurance summary" style={styles.insuranceSummary}>
          {insuranceCards.map((item) => (
            <div
              key={item.key}
              style={{
                ...styles.insuranceCard,
                borderColor: item.border,
                background: item.background,
              }}
            >
              <span style={styles.insuranceCardLabel}>{item.label}</span>
              <strong
                style={{
                  ...styles.insuranceCardValue,
                  color: item.color,
                }}
              >
                {item.value.toLocaleString()}
              </strong>
              <span style={styles.insuranceCardHint}>
                Utilized sessions: {item.sessions.toLocaleString()}
              </span>
            </div>
          ))}
        </section>

        <section style={styles.tableHeading}>
          <div style={styles.tableHeadingIntro}>
            <h3 style={styles.tableTitle}>Patient Records</h3>
            <p style={styles.tableSubtitle}>
              Search patients and review their insurance and monthly session
              totals.
            </p>
          </div>

          <div style={styles.headingActions}>
            <label style={styles.importTypeField}>
              <span style={styles.fieldLabel}>IMPORT AS</span>
              <select
                value={importInsurance}
                onChange={(event) => setImportInsurance(event.target.value)}
                style={styles.toolbarSelect}
                aria-label="Default insurance type for import"
              >
                {INSURANCE_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              style={{
                ...styles.importButton,
                opacity: busyAction === "insurance-import" ? 0.65 : 1,
                cursor:
                  busyAction === "insurance-import"
                    ? "not-allowed"
                    : "pointer",
              }}
              onClick={() => fileInputRef.current?.click()}
              disabled={busyAction === "insurance-import"}
            >
              {busyAction === "insurance-import"
                ? "Importing..."
                : "Import Excel/CSV"}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleInsuranceImport}
              style={{ display: "none" }}
              aria-label="Import patient insurance list"
            />

            <button
              type="button"
              style={{
                ...styles.rolloverButton,
                opacity: busyAction === "rollover" ? 0.65 : 1,
                cursor:
                  busyAction === "rollover" || !selectedMonth
                    ? "not-allowed"
                    : "pointer",
              }}
              onClick={rolloverMonth}
              disabled={busyAction === "rollover" || !selectedMonth}
            >
              ↻{" "}
              {busyAction === "rollover"
                ? "Processing..."
                : "Monthly Rollover"}
            </button>
          </div>
        </section>

        {importSummary && (
          <div style={styles.importResult} role="status">
            <strong>Import summary: {importSummary.fileName}</strong>
            <span>
              Matched rows: {importSummary.matchedRows} · Unique patients:{" "}
              {importSummary.uniquePatients} · Unmatched rows:{" "}
              {importSummary.unmatchedRows} · Blank file numbers:{" "}
              {importSummary.invalidRows}
            </span>
            <span style={styles.importWarning}>
              These insurance assignments are temporary and have not been
              saved to the database.
            </span>
          </div>
        )}

        <div style={styles.filterPanel}>
          <label style={styles.filterField}>
            <span style={styles.fieldLabel}>SEARCH PATIENT NAME</span>
            <input
              type="search"
              value={searchName}
              onChange={(event) => setSearchName(event.target.value)}
              placeholder="Type patient name..."
              style={styles.input}
              aria-label="Search patient name"
            />
          </label>

          <label style={styles.filterField}>
            <span style={styles.fieldLabel}>FILTER BY SPECIALITY</span>
            <select
              value={selectedSpeciality}
              onChange={(event) =>
                setSelectedSpeciality(event.target.value)
              }
              style={styles.select}
              aria-label="Filter by speciality"
            >
              <option value="all">All Specialities</option>
              {specialityOptions.map((speciality) => (
                <option key={speciality} value={speciality}>
                  {speciality}
                </option>
              ))}
              {trackerPatients.some(
                (patient) => getSpeciality(patient) === "-"
              ) && <option value="-">Not Specified</option>}
            </select>
          </label>

          <div style={styles.filterResult} aria-live="polite">
            <strong style={styles.filterResultNumber}>
              {filteredPatients.length.toLocaleString()}
            </strong>
            <span>
              {filteredPatients.length === 1
                ? "patient found"
                : "patients found"}
            </span>
          </div>

          {(searchName || selectedSpeciality !== "all") && (
            <button
              type="button"
              onClick={clearFilters}
              style={styles.clearFiltersButton}
            >
              Clear Filters
            </button>
          )}
        </div>

        {filteredPatients.length > 0 ? (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>PATIENT</th>
                  <th style={styles.th}>FILE NUMBER</th>
                  <th style={styles.th}>INSURANCE TYPE</th>
                  <th style={styles.th}>UTILIZED SESSIONS</th>
                  <th style={styles.th}>STATUS</th>
                  <th style={styles.th}>SPECIALITY</th>
                  <th style={styles.th}>LAST SEEN</th>
                  <th style={styles.th}>PATIENT FILE</th>
                </tr>
              </thead>

              <tbody>
                {filteredPatients.map((patient, index) => {
                  const sessions = getSessions(patient);
                  const statusLabel = getStatusLabel(patient.status);
                  const statusStyle = getStatusStyle(patient.status);
                  const patientMonth = normalizeMonth(patient.month);
                  const displayMonth = normalizeMonth(selectedMonth);

                  const isNewEvaluation =
                    Boolean(patient.is_new_evaluation) &&
                    Boolean(patientMonth) &&
                    (!displayMonth || patientMonth === displayMonth);

                  const fileNumber = getPatientFileNumber(patient) || "-";
                  const speciality = getSpeciality(patient);
                  const insurance = getInsurance(patient);
                  const lastSeen =
                    patient.last_seen_date ||
                    patient.latest_seen_date ||
                    null;

                  const progress = Math.min((sessions / 6) * 100, 100);

                  return (
                    <tr
                      key={patient.id ?? `${fileNumber}-${index}`}
                      style={styles.tr}
                    >
                      <td style={styles.patientTd}>
                        <div style={styles.patientCell}>
                          <div style={styles.avatar} aria-hidden="true">
                            {getInitials(patient.name)}
                          </div>

                          <div style={styles.patientInfo}>
                            <strong style={styles.patientName}>
                              {patient.name || "Unnamed patient"}
                            </strong>
                            <span
                              style={
                                isNewEvaluation
                                  ? styles.newBadge
                                  : styles.oldBadge
                              }
                            >
                              {isNewEvaluation
                                ? "NEW EVALUATION"
                                : "OLD"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.fileNumber}>{fileNumber}</span>
                      </td>

                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.insuranceBadge,
                            ...INSURANCE_BADGE_STYLES[insurance],
                          }}
                        >
                          {getInsuranceLabel(insurance)}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <div style={styles.sessionsCell}>
                          <div style={styles.sessionsTop}>
                            <strong style={styles.sessionCount}>
                              {sessions}
                            </strong>
                            <span style={styles.sessionUnit}>
                              {sessions === 1 ? "session" : "sessions"}
                            </span>
                          </div>

                          <div
                            style={styles.progressTrack}
                            role="img"
                            aria-label={`${sessions} utilized sessions`}
                          >
                            <div
                              style={{
                                ...styles.progressFill,
                                width: `${progress}%`,
                                background:
                                  sessions >= 6
                                    ? COLORS.green
                                    : sessions >= 3
                                      ? COLORS.blue
                                      : sessions > 0
                                        ? COLORS.orange
                                        : "#cbd5e1",
                              }}
                            />
                          </div>

                          {insurance === "cash" && (
                            <span style={styles.cashSessionNote}>
                              Cash insurance category
                            </span>
                          )}

                          {getCategorySessions(patient, "cash") > 0 && (
                            <span style={styles.cashSessionNote}>
                              Cash sessions:{" "}
                              {getCategorySessions(patient, "cash")}
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            background: statusStyle.background,
                            color: statusStyle.color,
                            borderColor: statusStyle.border,
                          }}
                        >
                          <span
                            style={{
                              ...styles.statusDot,
                              background: statusStyle.dot,
                            }}
                          />
                          {statusLabel}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.specialityText}>
                          {speciality === "-" ? "Not Specified" : speciality}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.dateText}>
                          {formatDate(lastSeen)}
                        </span>
                      </td>

                      <td style={{ ...styles.td, textAlign: "center" }}>
                        <button
                          type="button"
                          style={{
                            ...styles.openButton,
                            opacity: patient.id ? 1 : 0.5,
                            cursor: patient.id ? "pointer" : "not-allowed",
                          }}
                          onClick={() => openPatientFile(patient)}
                          disabled={!patient.id}
                          title={
                            patient.id
                              ? `Open file for ${patient.name || "patient"}`
                              : "Patient file unavailable"
                          }
                        >
                          Open File
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon} aria-hidden="true">
              ♧
            </div>

            <h3 style={styles.emptyTitle}>
              {trackerPatients.length === 0
                ? "No patients found"
                : "No matching patients"}
            </h3>

            <p style={styles.emptyText}>
              {trackerPatients.length === 0
                ? "There are no patient records to display for this month. Try selecting another reporting month."
                : "No patients match your search or speciality filter. Try changing your filters or clearing them."}
            </p>

            {(searchName || selectedSpeciality !== "all") && (
              <button
                type="button"
                onClick={clearFilters}
                style={styles.clearFiltersButton}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        <footer style={styles.footer}>
          <span style={styles.footerDot} aria-hidden="true" />
          <span>
            Utilized Sessions includes the monthly total. Thiqa, Daman, and
            Cash session breakdowns require the corresponding category totals
            from the backend. Status levels: Inactive = 0, Low = 1–2,
            Moderate = 3–5, High = 6 or more sessions.
          </span>
        </footer>
      </div>
    </section>
  );
}

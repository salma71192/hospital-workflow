
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

const C = {
  navy: "#172b4d",
  text: "#334155",
  muted: "#64748b",
  border: "#e2e8f0",
  blue: "#2563eb",
  green: "#15803d",
  purple: "#7c3aed",
  red: "#b91c1c",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getValue(obj, keys, fallback = "") {
  for (const key of keys) {
    const value = obj?.[key];
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      typeof value !== "object"
    ) {
      return value;
    }
  }
  return fallback;
}

function getNestedObject(obj, keys) {
  for (const key of keys) {
    const value = obj?.[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value;
    }
  }
  return {};
}

function getPatient(claim) {
  return getNestedObject(claim, [
    "patient",
    "patient_details",
    "patientDetails",
    "patient_data",
    "patientData",
  ]);
}

function getPatientName(claim) {
  const patient = getPatient(claim);

  const direct = getValue(claim, [
    "patientName",
    "patient_name",
    "patient_full_name",
    "patientFullName",
  ]);

  if (direct) return String(direct);

  const fullName = getValue(patient, [
    "full_name",
    "fullName",
    "patient_name",
    "patientName",
    "name",
    "display_name",
  ]);

  if (fullName) return String(fullName);

  const first = getValue(patient, ["first_name", "firstName"]);
  const last = getValue(patient, ["last_name", "lastName"]);
  return `${first} ${last}`.trim() || "Unknown patient";
}

function getPatientId(claim) {
  const patient = getPatient(claim);

  return getValue(
    claim,
    ["patientId", "patient_id"],
    getValue(patient, ["id", "patient_id", "patientId"], null)
  );
}

function getFileNumber(claim) {
  const keys = [
    "file_number",
    "fileNumber",
    "patient_file_number",
    "patientFileNumber",
    "patient_file_no",
    "patientFileNo",
    "file_no",
    "fileNo",
    "medical_record_number",
    "medicalRecordNumber",
    "medical_record_no",
    "medicalRecordNo",
    "medical_record",
    "mrn",
    "patient_number",
    "patientNumber",
    "file_number_display",
  ];

  const patient = getPatient(claim);

  const direct = getValue(claim, keys);
  if (direct) return String(direct);

  const patientValue = getValue(patient, keys);
  if (patientValue) return String(patientValue);

  const records = getNestedObject(patient, [
    "patient_record",
    "patientRecord",
    "medical_record_details",
    "medicalRecordDetails",
  ]);

  const recordValue = getValue(records, keys);
  return recordValue ? String(recordValue) : "—";
}

function getClaimId(claim) {
  return getValue(
    claim,
    ["claimId", "claim_id", "claim_number", "claimNumber", "id"],
    "—"
  );
}

function getStatus(claim) {
  return String(
    getValue(claim, ["status", "claim_status", "claimStatus"], "Pending")
  );
}

function getCreatedDate(claim) {
  return getValue(claim, [
    "createdAt",
    "created_at",
    "dateCreated",
    "date_created",
    "submittedAt",
    "submitted_at",
  ], "");
}

function getCreatorObject(claim) {
  return getNestedObject(claim, [
    "created_by",
    "createdBy",
    "creator",
    "created_user",
    "createdUser",
    "created_by_user",
    "createdByUser",
    "submitted_by",
    "submittedBy",
  ]);
}

function getCreatedById(claim) {
  const creator = getCreatorObject(claim);

  return getValue(
    creator,
    ["id", "user_id", "userId", "pk"],
    getValue(claim, [
      "created_by_id",
      "createdById",
      "creator_id",
      "creatorId",
      "created_user_id",
      "createdUserId",
    ], "")
  );
}

function getCreatedBy(claim) {
  const creator = getCreatorObject(claim);

  const name = getValue(creator, [
    "display_name",
    "displayName",
    "full_name",
    "fullName",
    "name",
    "username",
    "email",
  ]);

  if (name) return String(name);

  const directName = getValue(claim, [
    "created_by_name",
    "createdByName",
    "creator_name",
    "creatorName",
    "created_by_username",
    "createdByUsername",
    "created_by_display_name",
    "createdByDisplayName",
    "submitted_by_name",
    "submittedByName",
  ]);

  if (directName) return String(directName);

  const id = getCreatedById(claim);
  return id !== "" ? `RCM user #${id}` : "Not recorded";
}

function getRejectionReason(claim) {
  return getValue(claim, [
    "rejectionReason",
    "rejection_reason",
    "rejectionRemarks",
    "rejection_remarks",
    "rejection_description",
    "denial_reason",
    "denialReason",
    "reason",
  ], "No rejection reason recorded.");
}

function statusCategory(claim) {
  const status = getStatus(claim).toLowerCase().trim();

  if (
    status.includes("reject") ||
    status.includes("denied") ||
    status.includes("denial")
  ) {
    return "Rejected";
  }

  if (
    status.includes("approv") ||
    status.includes("complete") ||
    status.includes("paid")
  ) {
    return "Approved";
  }

  return "Pending";
}

function getStatusStyle(status) {
  const category = statusCategory({ status });

  if (category === "Approved") {
    return {
      color: C.green,
      background: "#ecfdf3",
      borderColor: "#bbf7d0",
      dot: "#16a34a",
    };
  }

  if (category === "Rejected") {
    return {
      color: C.red,
      background: "#fff1f2",
      borderColor: "#fecdd3",
      dot: "#e11d48",
    };
  }

  return {
    color: C.purple,
    background: "#f5f3ff",
    borderColor: "#ddd6fe",
    dot: "#8b5cf6",
  };
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function localDateString(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

/*
 * Use the date portion directly for YYYY-MM-DD values.
 * For timestamps, convert to the browser's local calendar date.
 */
function getDateParts(value) {
  if (!value) return null;

  const raw = String(value);
  const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnly) {
    return {
      year: dateOnly[1],
      month: Number(dateOnly[2]) - 1,
      day: raw,
    };
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return {
    year: String(date.getFullYear()),
    month: date.getMonth(),
    day: localDateString(date),
  };
}

function matchesSelectedMonth(value, selectedMonth, selectedYear) {
  const parts = getDateParts(value);
  if (!parts) return false;

  if (
    selectedMonth !== "All" &&
    parts.month !== Number(selectedMonth)
  ) {
    return false;
  }

  if (
    selectedYear !== "All" &&
    parts.year !== selectedYear
  ) {
    return false;
  }

  return true;
}

/* FIX: This function was missing from the original component. */
function matchesSelectedDay(value, selectedDay) {
  if (!selectedDay) return true;

  const parts = getDateParts(value);
  return Boolean(parts && parts.day === selectedDay);
}

function openPatientFile(navigate, patientId) {
  if (patientId === null || patientId === undefined || patientId === "") {
    return;
  }

  navigate(`/patients/${patientId}`);
}

function Icon({ name, size = 18 }) {
  const paths = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m16 16 4 4" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    filter: <path d="M4 5h16M7 12h10m-7 7h4" />,
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3" />
      </>
    ),
    reset: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5" />
      </>
    ),
    close: <path d="m18 6-12 12M6 6l12 12" />,
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h8" />
      </>
    ),
    external: (
      <>
        <path d="M14 3h7v7M10 14 21 3" />
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      </>
    ),
    chevron: <path d="m7 10 5 5 5-5" />,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.file}
    </svg>
  );
}

export default function ClaimHistory({ refreshKey = 0 }) {
  const navigate = useNavigate();

  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [createdByFilter, setCreatedByFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [dayFilter, setDayFilter] = useState("");
  const [expandedClaim, setExpandedClaim] = useState(null);

  const loadClaims = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    setError("");

    try {
      const response = await api.get("rcm/claims/");
      const data = response.data;

      const list = Array.isArray(data)
        ? data
        : data?.claims || data?.results || data?.data || [];

      setClaims(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Unable to load claim history. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadClaims();
  }, [loadClaims, refreshKey]);

  const creatorOptions = useMemo(() => {
    const map = new Map();

    claims.forEach((claim) => {
      const id = getCreatedById(claim);
      const name = getCreatedBy(claim);

      if (name === "Not recorded") return;

      const key = id !== "" ? String(id) : name;

      if (!map.has(key)) map.set(key, { key, name });
    });

    return [...map.values()].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [claims]);

  const stats = useMemo(() => ({
    total: claims.length,
    approved: claims.filter(
      (claim) => statusCategory(claim) === "Approved"
    ).length,
    pending: claims.filter(
      (claim) => statusCategory(claim) === "Pending"
    ).length,
    rejected: claims.filter(
      (claim) => statusCategory(claim) === "Rejected"
    ).length,
  }), [claims]);

  const filteredClaims = useMemo(() => {
    const query = search.trim().toLowerCase();

    return claims.filter((claim) => {
      const creatorId = getCreatedById(claim);
      const creatorName = getCreatedBy(claim);
      const creatorKey = creatorId !== ""
        ? String(creatorId)
        : creatorName;

      const searchText = [
        getPatientName(claim),
        getFileNumber(claim),
        getClaimId(claim),
        getStatus(claim),
        creatorName,
      ].join(" ").toLowerCase();

      const matchesSearch = searchText.includes(query);

      const matchesCreator =
        createdByFilter === "All"
          ? true
          : createdByFilter === "Not recorded"
            ? creatorName === "Not recorded"
            : creatorKey === createdByFilter;

      const createdDate = getCreatedDate(claim);

      const matchesMonth =
        monthFilter === "All" ||
        matchesSelectedMonth(createdDate, monthFilter, yearFilter);

      const matchesYear =
        yearFilter === "All" ||
        (getDateParts(createdDate)?.year === yearFilter);

      const matchesDay =
        !dayFilter || matchesSelectedDay(createdDate, dayFilter);

      return (
        matchesSearch &&
        matchesCreator &&
        matchesMonth &&
        matchesYear &&
        matchesDay
      );
    });
  }, [
    claims,
    search,
    createdByFilter,
    monthFilter,
    yearFilter,
    dayFilter,
  ]);

  const hasFilters =
    Boolean(search.trim()) ||
    createdByFilter !== "All" ||
    monthFilter !== "All" ||
    yearFilter !== "All" ||
    Boolean(dayFilter);

  const resetFilters = () => {
    setSearch("");
    setCreatedByFilter("All");
    setMonthFilter("All");
    setYearFilter("All");
    setDayFilter("");
  };

  const summaryCards = [
    {
      label: "Total Claims",
      value: stats.total,
      description: "All recorded claims",
      icon: "▤",
      color: C.blue,
      background: "#eff6ff",
      border: "#bfdbfe",
    },
    {
      label: "Approved Claims",
      value: stats.approved,
      description: "Approved, completed, or paid",
      icon: "✓",
      color: C.green,
      background: "#f0fdf4",
      border: "#bbf7d0",
    },
    {
      label: "Pending Claims",
      value: stats.pending,
      description: "Awaiting processing or review",
      icon: "◷",
      color: C.purple,
      background: "#f5f3ff",
      border: "#ddd6fe",
    },
    {
      label: "Rejected Claims",
      value: stats.rejected,
      description: "Requiring review",
      icon: "!",
      color: C.red,
      background: "#fff1f2",
      border: "#fecdd3",
    },
  ];

  return (
    <div className="claim-history-page">
      <style>{`
        .claim-history-page { width:100%; color:${C.navy}; font-family:inherit; font-size:15px; }
        .claim-history-page * { box-sizing:border-box; }
        .ch-summary-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; margin-bottom:24px; }
        .ch-summary-card { min-width:0; padding:22px; border:1px solid; border-radius:16px; }
        .ch-summary-top { display:flex; align-items:center; gap:12px; margin-bottom:16px; }
        .ch-summary-icon { display:grid; place-items:center; width:44px; height:44px; flex-shrink:0; border-radius:12px; font-size:23px; font-weight:900; }
        .ch-summary-label { color:#40516a; font-size:14px; font-weight:850; }
        .ch-summary-value { margin-bottom:6px; color:${C.navy}; font-size:34px; font-weight:900; }
        .ch-summary-description { color:${C.muted}; font-size:12px; line-height:1.5; }
        .ch-panel { margin-bottom:20px; overflow:hidden; border:1px solid ${C.border}; border-radius:17px; background:#fff; box-shadow:0 5px 22px #172b4d0b; }
        .ch-panel-content { padding:24px; }
        .ch-panel-header,.ch-filter-heading,.ch-filter-footer,.ch-table-heading { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
        .ch-panel-header { margin-bottom:22px; }
        .ch-panel-title { margin:0 0 7px; font-size:25px; font-weight:900; }
        .ch-subtitle { margin:0; color:${C.muted}; font-size:13px; line-height:1.6; }
        .ch-count { display:inline-flex; padding:9px 12px; border:1px solid #dbeafe; border-radius:9px; background:#eff6ff; color:#1d4ed8; font-size:12px; font-weight:850; }
        .ch-filter-section { padding:22px; border:1px solid #dbe5f3; border-radius:15px; background:#f8faff; }
        .ch-filter-heading { margin-bottom:20px; }
        .ch-filter-heading-title { display:flex; align-items:center; gap:10px; font-size:18px; font-weight:900; }
        .ch-filter-heading-icon { display:grid; place-items:center; width:40px; height:40px; border-radius:11px; background:#eef2ff; color:#4338ca; }
        .ch-filter-grid { display:grid; grid-template-columns:minmax(220px,1.5fr) minmax(180px,1fr); gap:17px; align-items:end; }
        .ch-filter-label { display:block; min-width:0; color:#354b67; font-size:13px; font-weight:850; }
        .ch-filter-control-wrap { position:relative; margin-top:8px; }
        .ch-filter-control,.ch-date-control { display:block; width:100%; min-width:0; height:47px; padding:0 12px; border:1px solid #d5deeb; border-radius:9px; background:#fff; color:${C.navy}; font-family:inherit; font-size:14px; outline:none; }
        .ch-filter-control:focus,.ch-date-control:focus { border-color:#6366f1; box-shadow:0 0 0 3px #6366f11f; }
        .ch-search-symbol { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#64748b; pointer-events:none; }
        .ch-search-input { padding-left:40px; padding-right:38px; }
        .ch-clear-search { position:absolute; right:7px; top:50%; transform:translateY(-50%); display:grid; place-items:center; width:29px; height:29px; border:0; border-radius:7px; background:#f1f5f9; color:#475569; cursor:pointer; }
        .ch-date-filter-box { grid-column:1/-1; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; align-items:end; padding:17px; border:1px solid #dbe5f3; border-radius:12px; background:#fff; }
        .ch-date-filter-heading { grid-column:1/-1; display:flex; align-items:center; gap:9px; font-size:14px; font-weight:900; }
        .ch-date-filter-heading span { color:${C.muted}; font-size:12px; font-weight:600; }
        .ch-date-actions { display:flex; align-items:end; gap:9px; flex-wrap:wrap; }
        .ch-date-actions .ch-button { flex:1; }
        .ch-filter-footer { margin-top:18px; padding-top:16px; border-top:1px solid #e0e7f1; }
        .ch-active-filter-text { color:${C.muted}; font-size:12px; font-weight:650; }
        .ch-filter-chips { display:flex; gap:7px; flex-wrap:wrap; margin-top:14px; }
        .ch-filter-chip { padding:7px 10px; border:1px solid #c7d2fe; border-radius:8px; background:#eef2ff; color:#4338ca; font-size:12px; font-weight:800; }
        .ch-button { display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:40px; padding:9px 13px; border:1px solid #4338ca; border-radius:9px; background:#4338ca; color:#fff; font-family:inherit; font-size:12px; font-weight:850; cursor:pointer; }
        .ch-button:hover:not(:disabled) { background:#3730a3; }
        .ch-button:disabled { opacity:.6; cursor:wait; }
        .ch-button-secondary { border-color:#d5deeb; background:#fff; color:${C.navy}; }
        .ch-button-secondary:hover:not(:disabled) { background:#f1f5f9; }
        .ch-table-section { margin-top:27px; }
        .ch-table-heading { margin-bottom:14px; }
        .ch-table-heading-title { margin:0; font-size:19px; font-weight:900; }
        .ch-table-wrap { width:100%; overflow:auto; border:1px solid #e0e7f1; border-radius:12px; }
        .ch-table { width:100%; min-width:1000px; border-collapse:separate; border-spacing:0; text-align:left; }
        .ch-table thead th { position:sticky; top:0; z-index:1; padding:15px 13px; border-bottom:1px solid #dce5f0; background:#f4f7fc; color:#526782; font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:.05em; white-space:nowrap; }
        .ch-table tbody td { padding:15px 13px; border-bottom:1px solid #edf1f7; color:#475569; font-size:13px; line-height:1.5; vertical-align:middle; }
        .claim-main-row:hover { background:#f7f9ff; }
        .claim-main-row.is-expanded { background:#f3f6ff; }
        .ch-claim-id { display:inline-block; padding:7px 9px; border:1px solid #dbeafe; border-radius:7px; background:#eff6ff; color:#1d4ed8; font-size:12px; font-weight:900; white-space:nowrap; }
        .ch-patient-link,.ch-file-link { padding:0; border:0; background:transparent; color:${C.navy}; font-family:inherit; font-size:13px; font-weight:850; text-align:left; cursor:pointer; }
        .ch-patient-link:hover,.ch-file-link:hover { color:${C.blue}; text-decoration:underline; }
        .ch-file-link { color:${C.blue}; white-space:nowrap; }
        .ch-status { display:inline-flex; align-items:center; gap:7px; padding:7px 9px; border:1px solid; border-radius:7px; font-size:11px; font-weight:900; white-space:nowrap; }
        .ch-status-dot { width:7px; height:7px; flex-shrink:0; border-radius:50%; }
        .ch-created-by { display:inline-block; max-width:180px; overflow:hidden; color:#334155; font-size:12px; font-weight:750; text-overflow:ellipsis; vertical-align:middle; }
        .ch-date { font-size:12px; font-weight:700; white-space:nowrap; }
        .ch-expand-cell { width:75px; text-align:center!important; }
        .ch-expand-button { display:inline-flex; align-items:center; justify-content:center; min-height:34px; padding:7px 10px; border:1px solid #c7d2fe; border-radius:8px; background:#eef2ff; color:#4338ca; font-family:inherit; font-size:12px; font-weight:800; cursor:pointer; }
        .ch-expand-button:hover { background:#e0e7ff; }
        .ch-detail-row td { padding:0!important; background:#f7f9ff; }
        .ch-detail-content { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; padding:18px; }
        .ch-detail-item { min-width:0; padding:13px; border:1px solid #e2e8f0; border-radius:10px; background:#fff; }
        .ch-detail-label { margin-bottom:7px; color:#64748b; font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:.05em; }
        .ch-detail-value { color:${C.navy}; font-size:13px; font-weight:750; overflow-wrap:anywhere; white-space:pre-wrap; }
        .ch-detail-rejection { border-color:#fecaca; background:#fffafa; }
        .ch-detail-rejection .ch-detail-label { color:${C.red}; }
        .ch-detail-actions { grid-column:1/-1; display:flex; justify-content:flex-end; }
        .ch-empty { padding:40px 18px; text-align:center; color:${C.muted}; font-size:14px; }
        .ch-empty-icon { display:grid; place-items:center; width:52px; height:52px; margin:0 auto 13px; border-radius:14px; background:#eef2ff; color:#6366f1; }
        .ch-empty-title { margin-bottom:8px; color:${C.navy}; font-size:18px; font-weight:900; }
        .ch-error { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin:20px 0; padding:15px; border:1px solid #fecaca; border-radius:11px; background:#fef2f2; color:${C.red}; font-size:13px; }
        @media(max-width:1050px) { .ch-summary-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .ch-detail-content { grid-template-columns:repeat(2,minmax(0,1fr)); } }
        @media(max-width:650px) { .ch-summary-grid { gap:10px; } .ch-summary-card { padding:14px; } .ch-summary-top { align-items:flex-start; gap:8px; } .ch-summary-icon { width:35px; height:35px; font-size:18px; } .ch-summary-label { font-size:12px; } .ch-summary-value { font-size:28px; } .ch-summary-description { font-size:10px; } .ch-panel-content,.ch-filter-section { padding:13px; } .ch-filter-grid,.ch-date-filter-box,.ch-detail-content { grid-template-columns:1fr; } .ch-date-filter-heading { grid-column:auto; flex-wrap:wrap; } .ch-date-filter-box { padding:12px; } .ch-panel-title { font-size:22px; } .ch-detail-content { padding:12px; } }
      `}</style>

      <div className="ch-summary-grid">
        {summaryCards.map((item) => (
          <article
            key={item.label}
            className="ch-summary-card"
            style={{ background: item.background, borderColor: item.border }}
          >
            <div className="ch-summary-top">
              <div
                className="ch-summary-icon"
                style={{ background: item.border, color: item.color }}
              >
                {item.icon}
              </div>
              <div className="ch-summary-label">{item.label}</div>
            </div>
            <div className="ch-summary-value">{item.value}</div>
            <div className="ch-summary-description">{item.description}</div>
          </article>
        ))}
      </div>

      <section className="ch-panel">
        <div className="ch-panel-content">
          <div className="ch-panel-header">
            <div>
              <h2 className="ch-panel-title">Claim Records</h2>
              <p className="ch-subtitle">
                Search, filter, and review claim details.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
              <span className="ch-count">
                {filteredClaims.length} of {claims.length} claims
              </span>
              <button
                type="button"
                className="ch-button"
                onClick={() => loadClaims(false)}
                disabled={refreshing}
              >
                <Icon name="refresh" size={16} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          <div className="ch-filter-section">
            <div className="ch-filter-heading">
              <div className="ch-filter-heading-title">
                <span className="ch-filter-heading-icon">
                  <Icon name="filter" size={20} />
                </span>
                Search &amp; Filter Claims
              </div>
              {hasFilters && <span className="ch-count">Filters active</span>}
            </div>

            <div className="ch-filter-grid">
              <label className="ch-filter-label">
                Search claims
                <div className="ch-filter-control-wrap">
                  <span className="ch-search-symbol">
                    <Icon name="search" size={19} />
                  </span>
                  <input
                    className="ch-filter-control ch-search-input"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Patient, file number, claim ID..."
                  />
                  {search && (
                    <button
                      type="button"
                      className="ch-clear-search"
                      aria-label="Clear search"
                      onClick={() => setSearch("")}
                    >
                      <Icon name="close" size={15} />
                    </button>
                  )}
                </div>
              </label>

              <label className="ch-filter-label">
                Created by — RCM user
                <div className="ch-filter-control-wrap">
                  <select
                    className="ch-filter-control"
                    value={createdByFilter}
                    onChange={(event) => setCreatedByFilter(event.target.value)}
                  >
                    <option value="All">All RCM creators</option>
                    {creatorOptions.map((user) => (
                      <option key={user.key} value={user.key}>
                        {user.name}
                      </option>
                    ))}
                    <option value="Not recorded">Not recorded</option>
                  </select>
                </div>
              </label>

              <div className="ch-date-filter-box">
                <div className="ch-date-filter-heading">
                  <Icon name="calendar" size={18} />
                  Date filters
                  <span>Combine month, year, and specific date.</span>
                </div>

                <label className="ch-filter-label">
                  Month
                  <div className="ch-filter-control-wrap">
                    <select
                      className="ch-date-control"
                      value={monthFilter}
                      onChange={(event) => setMonthFilter(event.target.value)}
                    >
                      <option value="All">All months</option>
                      {MONTHS.map((month, index) => (
                        <option key={month} value={String(index)}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>

                <label className="ch-filter-label">
                  Year
                  <div className="ch-filter-control-wrap">
                    <select
                      className="ch-date-control"
                      value={yearFilter}
                      onChange={(event) => setYearFilter(event.target.value)}
                    >
                      <option value="All">All years</option>
                      {Array.from(
                        { length: 11 },
                        (_, index) => new Date().getFullYear() - 5 + index
                      ).map((year) => (
                        <option key={year} value={String(year)}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>

                <label className="ch-filter-label">
                  Specific date
                  <div className="ch-filter-control-wrap">
                    <input
                      className="ch-date-control"
                      type="date"
                      value={dayFilter}
                      onChange={(event) => setDayFilter(event.target.value)}
                    />
                  </div>
                </label>

                <div className="ch-date-actions">
                  <button
                    type="button"
                    className="ch-button ch-button-secondary"
                    onClick={() => {
                      setMonthFilter("All");
                      setYearFilter("All");
                      setDayFilter("");
                    }}
                  >
                    Clear dates
                  </button>
                  <button
                    type="button"
                    className="ch-button ch-button-secondary"
                    onClick={() => {
                      const today = localDateString(new Date());
                      setDayFilter(today);
                      setMonthFilter("All");
                      setYearFilter("All");
                    }}
                  >
                    Today
                  </button>
                </div>
              </div>
            </div>

            {hasFilters && (
              <div className="ch-filter-chips">
                {search.trim() && (
                  <span className="ch-filter-chip">Search: {search.trim()}</span>
                )}
                {createdByFilter !== "All" && (
                  <span className="ch-filter-chip">
                    Created by: {
                      creatorOptions.find((user) => user.key === createdByFilter)?.name
                      || createdByFilter
                    }
                  </span>
                )}
                {monthFilter !== "All" && (
                  <span className="ch-filter-chip">
                    Month: {MONTHS[Number(monthFilter)]}
                  </span>
                )}
                {yearFilter !== "All" && (
                  <span className="ch-filter-chip">Year: {yearFilter}</span>
                )}
                {dayFilter && (
                  <span className="ch-filter-chip">Date: {dayFilter}</span>
                )}
              </div>
            )}

            <div className="ch-filter-footer">
              <div className="ch-active-filter-text">
                Showing <strong>{filteredClaims.length}</strong> matching{" "}
                {filteredClaims.length === 1 ? "claim" : "claims"}
              </div>
              {hasFilters && (
                <button
                  type="button"
                  className="ch-button ch-button-secondary"
                  onClick={resetFilters}
                >
                  <Icon name="reset" size={15} />
                  Clear all filters
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="ch-error" role="alert">
              <span>{error}</span>
              <button
                type="button"
                className="ch-button ch-button-secondary"
                onClick={() => loadClaims()}
                disabled={loading}
              >
                Try again
              </button>
            </div>
          )}

          <div className="ch-table-section">
            <div className="ch-table-heading">
              <h3 className="ch-table-heading-title">All Claims</h3>
              <span className="ch-active-filter-text">
                Use the Details button to view additional information.
              </span>
            </div>

            {loading ? (
              <div className="ch-empty" role="status">
                Loading claim records...
              </div>
            ) : (
              <div className="ch-table-wrap">
                <table className="ch-table">
                  <thead>
                    <tr>
                      <th>Claim ID</th>
                      <th>Patient</th>
                      <th>File Number</th>
                      <th>Status</th>
                      <th>Created By</th>
                      <th>Date Created</th>
                      <th className="ch-expand-cell">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClaims.map((claim, index) => {
                      const status = getStatus(claim);
                      const category = statusCategory(claim);
                      const badge = getStatusStyle(status);
                      const patientId = getPatientId(claim);
                      const claimKey = String(
                        claim.id ?? `${getClaimId(claim)}-${index}`
                      );
                      const isExpanded = expandedClaim === claimKey;

                      return (
                        <React.Fragment key={claimKey}>
                          <tr className={`claim-main-row ${isExpanded ? "is-expanded" : ""}`}>
                            <td>
                              <span className="ch-claim-id">{getClaimId(claim)}</span>
                            </td>
                            <td>
                              {patientId !== null && patientId !== undefined && patientId !== "" ? (
                                <button
                                  type="button"
                                  className="ch-patient-link"
                                  onClick={() => openPatientFile(navigate, patientId)}
                                >
                                  {getPatientName(claim)}
                                </button>
                              ) : (
                                <strong style={{ color: C.navy }}>
                                  {getPatientName(claim)}
                                </strong>
                              )}
                            </td>
                            <td>
                              {patientId !== null && patientId !== undefined && patientId !== "" ? (
                                <button
                                  type="button"
                                  className="ch-file-link"
                                  title="Open patient file"
                                  onClick={() => openPatientFile(navigate, patientId)}
                                >
                                  {getFileNumber(claim)}
                                  <span style={{ display: "inline-flex", marginLeft: 6 }}>
                                    <Icon name="external" size={12} />
                                  </span>
                                </button>
                              ) : (
                                <span>{getFileNumber(claim)}</span>
                              )}
                            </td>
                            <td>
                              <span
                                className="ch-status"
                                style={{
                                  color: badge.color,
                                  background: badge.background,
                                  borderColor: badge.borderColor,
                                }}
                              >
                                <span
                                  className="ch-status-dot"
                                  style={{ background: badge.dot }}
                                />
                                {status}
                              </span>
                            </td>
                            <td>
                              <span className="ch-created-by" title={getCreatedBy(claim)}>
                                {getCreatedBy(claim)}
                              </span>
                            </td>
                            <td className="ch-date">
                              {formatDate(getCreatedDate(claim))}
                            </td>
                            <td className="ch-expand-cell">
                              <button
                                type="button"
                                className="ch-expand-button"
                                aria-label={isExpanded ? "Hide claim details" : "Show claim details"}
                                aria-expanded={isExpanded}
                                onClick={() =>
                                  setExpandedClaim(isExpanded ? null : claimKey)
                                }
                              >
                                {isExpanded ? "Hide details" : "Details"}
                              </button>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="ch-detail-row">
                              <td colSpan={7}>
                                <div className="ch-detail-content">
                                  <div className="ch-detail-item">
                                    <div className="ch-detail-label">Patient</div>
                                    <div className="ch-detail-value">
                                      {getPatientName(claim)}
                                    </div>
                                  </div>
                                  <div className="ch-detail-item">
                                    <div className="ch-detail-label">File Number</div>
                                    <div className="ch-detail-value">
                                      {getFileNumber(claim)}
                                    </div>
                                  </div>
                                  <div className="ch-detail-item">
                                    <div className="ch-detail-label">Created By — RCM user</div>
                                    <div className="ch-detail-value">
                                      {getCreatedBy(claim)}
                                    </div>
                                  </div>
                                  <div className="ch-detail-item">
                                    <div className="ch-detail-label">Claim Status</div>
                                    <div className="ch-detail-value">{status}</div>
                                  </div>
                                  <div className="ch-detail-item">
                                    <div className="ch-detail-label">Date Created</div>
                                    <div className="ch-detail-value">
                                      {formatDate(getCreatedDate(claim))}
                                    </div>
                                  </div>
                                  {category === "Rejected" && (
                                    <div className="ch-detail-item ch-detail-rejection">
                                      <div className="ch-detail-label">
                                        Rejection Reason / Remarks
                                      </div>
                                      <div className="ch-detail-value">
                                        {getRejectionReason(claim)}
                                      </div>
                                    </div>
                                  )}
                                  {patientId !== null && patientId !== undefined && patientId !== "" && (
                                    <div className="ch-detail-actions">
                                      <button
                                        type="button"
                                        className="ch-button"
                                        onClick={() => openPatientFile(navigate, patientId)}
                                      >
                                        <Icon name="file" size={15} />
                                        Open Patient File
                                        <Icon name="external" size={14} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}

                    {!filteredClaims.length && !error && (
                      <tr>
                        <td colSpan={7}>
                          <div className="ch-empty">
                            <div className="ch-empty-icon">
                              <Icon name="file" size={24} />
                            </div>
                            <div className="ch-empty-title">
                              {claims.length
                                ? "No matching claims found"
                                : "No claims recorded yet"}
                            </div>
                            <p className="ch-subtitle">
                              {claims.length
                                ? "Try changing your search or date filters."
                                : "Submitted claims will appear here."}
                            </p>
                            {hasFilters && (
                              <button
                                type="button"
                                className="ch-button ch-button-secondary"
                                onClick={resetFilters}
                                style={{ marginTop: 16 }}
                              >
                                <Icon name="reset" size={15} />
                                Clear all filters
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

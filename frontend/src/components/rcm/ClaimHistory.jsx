import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

const C = {
  navy: "#172b4d",
  text: "#334155",
  muted: "#64748b",
  border: "#dbe4f0",
  blue: "#2563eb",
  green: "#15803d",
  purple: "#7c3aed",
  red: "#b91c1c",
};

const localDateString = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function valueOf(obj, keys, fallback = "") {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && value !== "" && typeof value !== "object") {
      return value;
    }
  }
  return fallback;
}

function objectOf(obj, keys) {
  for (const key of keys) {
    const value = obj?.[key];
    if (value && typeof value === "object" && !Array.isArray(value)) return value;
  }
  return {};
}

function listFromResponse(data, keys = []) {
  if (Array.isArray(data)) return data;
  for (const key of [...keys, "results", "items", "users", "claims"]) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  if (data?.data && typeof data.data === "object") return listFromResponse(data.data, keys);
  return [];
}

function patientOf(claim) {
  return objectOf(claim, ["patient", "patient_details", "patientDetails", "patient_data", "patientData"]);
}

function patientName(claim) {
  const patient = patientOf(claim);
  const direct = valueOf(claim, ["patientName", "patient_name", "patient_full_name", "patientFullName"]);
  if (direct) return String(direct);

  const full = valueOf(patient, [
    "full_name", "fullName", "patient_name", "patientName",
    "name", "display_name", "displayName",
  ]);
  if (full) return String(full);

  return `${valueOf(patient, ["first_name", "firstName"])} ${valueOf(patient, ["last_name", "lastName"])}`.trim() || "Unknown patient";
}

function patientIdOf(claim) {
  return valueOf(claim, ["patientId", "patient_id"], valueOf(patientOf(claim), ["id", "patient_id", "patientId"], ""));
}

const FILE_KEYS = [
  "file_number", "fileNumber", "patient_file_number", "patientFileNumber",
  "patient_file_no", "patientFileNo", "file_no", "fileNo",
  "medical_record_number", "medicalRecordNumber", "medical_record_no",
  "medicalRecordNo", "medical_record", "mrn", "patient_number",
  "patientNumber", "file_number_display",
];

function fileNumberOf(claim) {
  const direct = valueOf(claim, FILE_KEYS);
  if (direct) return String(direct);

  const patient = patientOf(claim);
  const patientValue = valueOf(patient, FILE_KEYS);
  if (patientValue) return String(patientValue);

  const record = objectOf(patient, [
    "patient_record", "patientRecord", "medical_record_details", "medicalRecordDetails",
  ]);
  return String(valueOf(record, FILE_KEYS, "—"));
}

function claimIdOf(claim) {
  return valueOf(claim, ["claimId", "claim_id", "claim_number", "claimNumber", "id"], "—");
}

function statusOf(claim) {
  return String(valueOf(claim, ["status", "claim_status", "claimStatus"], "Pending"));
}

function creatorOf(claim) {
  return objectOf(claim, [
    "created_by", "createdBy", "creator", "created_user", "createdUser",
    "created_by_user", "createdByUser", "submitted_by", "submittedBy",
  ]);
}

function creatorIdOf(claim) {
  return valueOf(
    creatorOf(claim),
    ["id", "user_id", "userId", "pk", "user_pk"],
    valueOf(claim, [
      "created_by_id", "createdById", "creator_id", "creatorId",
      "created_user_id", "createdUserId", "submitted_by_id", "submittedById",
    ], "")
  );
}

function creatorNameOf(claim) {
  const creator = creatorOf(claim);
  const name = valueOf(creator, [
    "display_name", "displayName", "full_name", "fullName",
    "first_name", "firstName", "name", "username", "email",
  ]);
  if (name) return String(name);

  const direct = valueOf(claim, [
    "created_by_name", "createdByName", "creator_name", "creatorName",
    "created_by_username", "createdByUsername", "created_by_display_name",
    "createdByDisplayName", "submitted_by_name", "submittedByName",
  ]);
  if (direct) return String(direct);

  const id = creatorIdOf(claim);
  return id !== "" ? `RCM user #${id}` : "Not recorded";
}

function createdDateOf(claim) {
  return valueOf(claim, [
    "createdAt", "created_at", "dateCreated", "date_created",
    "submittedAt", "submitted_at", "created", "creation_date",
    "created_date", "claim_date", "submission_date", "date",
  ]);
}

function rejectionReasonOf(claim) {
  return String(valueOf(claim, [
    "rejectionReason", "rejection_reason", "rejectionRemarks", "rejection_remarks",
    "rejection_description", "denial_reason", "denialReason", "reason",
  ], ""));
}

function statusCategory(input) {
  const status = (typeof input === "string" ? input : statusOf(input)).toLowerCase().trim();
  if (status.includes("reject") || status.includes("denied") || status.includes("denial")) return "Rejected";
  if (status.includes("approv") || status.includes("complete") || status.includes("paid")) return "Approved";
  return "Pending";
}

function dateParts(value) {
  if (!value) return null;
  const raw = String(value);
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return { day: `${match[1]}-${match[2]}-${match[3]}` };

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return { day: localDateString(date) };
}

function formatDate(value) {
  const parts = dateParts(value);
  if (!parts) return "—";
  const [year, month, day] = parts.day.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMonth(value) {
  if (!value) return "All months";
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return value;
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

function statusColors(status) {
  const category = statusCategory(status);
  if (category === "Approved") return { color: "#047857", bg: "#e8faf3", border: "#b8eee0", dot: "#10b981" };
  if (category === "Rejected") return { color: "#be123c", bg: "#fff0f2", border: "#fecdd3", dot: "#f43f5e" };
  return { color: "#6d28d9", bg: "#f3efff", border: "#ddd0ff", dot: "#8b5cf6" };
}

function userIdOf(user) {
  return valueOf(user, ["id", "user_id", "userId", "pk", "user_pk"], "");
}

function userDisplayName(user) {
  const name = valueOf(user, [
    "display_name", "displayName", "full_name", "fullName",
    "first_name", "firstName", "name", "username", "email",
  ]);
  const id = userIdOf(user);
  return String(name || (id !== "" ? `User #${id}` : "Unnamed user"));
}

function openPatientFile(navigate, id) {
  if (id !== null && id !== undefined && id !== "") navigate(`/patients/${id}`);
}

function Icon({ name, size = 18 }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    filter: <><path d="M4 5h16M7 12h10m-7 7h4" /><circle cx="8" cy="5" r="1" /><circle cx="15" cy="12" r="1" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3" /></>,
    reset: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6" /><path d="M10 10v6m4-6v6" /></>,
    close: <path d="m18 6-12 12M6 6l12 12" />,
    list: <><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    alert: <><path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 4h.01" /></>,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] || paths.file}
    </svg>
  );
}

export default function ClaimHistory({ refreshKey = 0 }) {
  const navigate = useNavigate();

  const [claims, setClaims] = useState([]);
  const [rcmUsers, setRcmUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [createdByFilter, setCreatedByFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const [expandedClaim, setExpandedClaim] = useState(null);
  const [editingClaim, setEditingClaim] = useState(null);
  const [editStatus, setEditStatus] = useState("Pending");
  const [editReason, setEditReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadClaims = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    setError("");
    setActionError("");
    setSuccessMessage("");

    try {
      const response = await api.get("rcm/claims/");
      setClaims(listFromResponse(response.data, ["claims", "results", "data", "items"]));
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message ||
        err.response?.data?.error || "Unable to load claim history. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadRcmUsers = useCallback(async () => {
    try {
      const response = await api.get("users/");
      const users = listFromResponse(response.data, ["users", "results", "data", "items"]);
      // Load all returned users so creators are not hidden by missing role metadata.
      setRcmUsers(users);
    } catch {
      setRcmUsers([]);
    }
  }, []);

  useEffect(() => {
    loadClaims();
    loadRcmUsers();
  }, [loadClaims, loadRcmUsers, refreshKey]);

  const displayCreatorName = useCallback((claim) => {
    const savedName = creatorNameOf(claim);
    const creatorId = creatorIdOf(claim);
    if (creatorId !== "") {
      const matchingUser = rcmUsers.find(
        (user) => String(userIdOf(user)) === String(creatorId)
      );
      if (matchingUser) return userDisplayName(matchingUser);
    }
    return savedName;
  }, [rcmUsers]);

  const creatorOptions = useMemo(() => {
    const map = new Map();

    rcmUsers.forEach((user) => {
      const id = userIdOf(user);
      if (id !== "") map.set(String(id), { key: String(id), name: userDisplayName(user) });
    });

    claims.forEach((claim) => {
      const id = creatorIdOf(claim);
      const name = displayCreatorName(claim);
      if (name === "Not recorded") return;
      const key = id !== "" ? String(id) : name;
      if (!map.has(key)) map.set(key, { key, name });
    });

    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [claims, rcmUsers, displayCreatorName]);

  const stats = useMemo(() => ({
    total: claims.length,
    approved: claims.filter((claim) => statusCategory(claim) === "Approved").length,
    pending: claims.filter((claim) => statusCategory(claim) === "Pending").length,
    rejected: claims.filter((claim) => statusCategory(claim) === "Rejected").length,
  }), [claims]);

  const filteredClaims = useMemo(() => {
    const query = search.trim().toLowerCase();

    return claims.filter((claim) => {
      const parts = dateParts(createdDateOf(claim));
      const creatorId = creatorIdOf(claim);
      const creatorName = displayCreatorName(claim);
      const creatorKey = creatorId !== "" ? String(creatorId) : creatorName;

      const searchText = [
        patientName(claim), fileNumberOf(claim), claimIdOf(claim),
        statusOf(claim), creatorName,
      ].join(" ").toLowerCase();

      if (query && !searchText.includes(query)) return false;
      if (statusFilter !== "All" && statusCategory(claim) !== statusFilter) return false;

      if (createdByFilter !== "All") {
        if (createdByFilter === "Not recorded") {
          if (creatorName !== "Not recorded") return false;
        } else if (creatorKey !== createdByFilter) {
          return false;
        }
      }

      if (selectedDate) {
        if (parts?.day !== selectedDate) return false;
      } else if (selectedMonth && !parts?.day?.startsWith(`${selectedMonth}-`)) {
        return false;
      }

      return true;
    });
  }, [claims, search, statusFilter, createdByFilter, selectedDate, selectedMonth, displayCreatorName]);

  const hasFilters = Boolean(search.trim()) || createdByFilter !== "All" ||
    statusFilter !== "All" || selectedDate !== "" || selectedMonth !== "";

  function resetFilters() {
    setSearch("");
    setCreatedByFilter("All");
    setStatusFilter("All");
    setSelectedMonth("");
    setSelectedDate("");
  }

  function selectStatus(status) {
    setStatusFilter((current) => current === status ? "All" : status);
  }

  function startEditing(claim) {
    setActionError("");
    setSuccessMessage("");
    setEditingClaim(claim);
    setEditStatus(statusOf(claim));
    setEditReason(rejectionReasonOf(claim));
  }

  function closeEdit() {
    if (saving) return;
    setEditingClaim(null);
    setActionError("");
  }

  async function saveClaim(event) {
    event.preventDefault();
    if (!editingClaim) return;

    setSaving(true);
    setActionError("");
    setSuccessMessage("");

    try {
      const response = await api.put(`rcm/claims/${editingClaim.id}/`, {
        status: editStatus,
        rejection_reason: editReason,
      });

      const updated = response.data?.claim || response.data?.data || response.data;

      setClaims((current) => current.map((claim) => {
        if (String(claim.id) !== String(editingClaim.id)) return claim;
        return {
          ...claim,
          ...(updated && typeof updated === "object" ? updated : {}),
          status: updated?.status ?? editStatus,
          rejection_reason: updated?.rejection_reason ?? updated?.rejectionReason ?? editReason,
        };
      }));

      setEditingClaim(null);
      setSuccessMessage("Claim updated successfully.");
    } catch (err) {
      setActionError(err.response?.data?.detail || err.response?.data?.message ||
        err.response?.data?.error || "Unable to update the claim. Check the backend update endpoint and permissions.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteClaim(claim) {
    const confirmed = window.confirm(
      `Delete claim ${claimIdOf(claim)} for ${patientName(claim)}?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(String(claim.id));
    setActionError("");
    setSuccessMessage("");

    try {
      await api.delete(`rcm/claims/${claim.id}/`);
      setClaims((current) => current.filter((item) => String(item.id) !== String(claim.id)));

      if (String(expandedClaim) === String(claim.id)) setExpandedClaim(null);
      setSuccessMessage("Claim deleted successfully.");
    } catch (err) {
      setActionError(err.response?.data?.detail || err.response?.data?.message ||
        err.response?.data?.error || "Unable to delete the claim. Check the backend delete endpoint and permissions.");
    } finally {
      setDeletingId(null);
    }
  }

  const cards = [
    { label: "Total Claims", value: stats.total, description: "All recorded claims", status: "All", color: C.blue, bg: "#f1f7ff", border: "#c9e0ff", icon: "list" },
    { label: "Approved Claims", value: stats.approved, description: "Approved, completed, or paid", status: "Approved", color: C.green, bg: "#effbf6", border: "#c2f0df", icon: "check" },
    { label: "Pending Claims", value: stats.pending, description: "Awaiting processing or review", status: "Pending", color: C.purple, bg: "#f6f3ff", border: "#e0d7ff", icon: "clock" },
    { label: "Rejected Claims", value: stats.rejected, description: "Requiring review", status: "Rejected", color: C.red, bg: "#fff3f4", border: "#ffd4dc", icon: "alert" },
  ];

  const monthDescription = formatMonth(selectedMonth);
  const dateDescription = selectedDate ? formatDate(selectedDate) : "All days";

  return (
    <div className="claim-history-page">
      <style>{`
        .claim-history-page{width:100%;color:${C.navy};font-family:inherit;font-size:14px}
        .claim-history-page *{box-sizing:border-box}
        .ch-cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px;margin-bottom:22px}
        .ch-card{display:flex;align-items:flex-start;gap:13px;padding:18px;border:1px solid;border-radius:13px;text-align:left;cursor:pointer;font-family:inherit;transition:box-shadow .18s,transform .18s;min-width:0}
        .ch-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px #172b4d12}
        .ch-card.ch-selected{outline:2px solid #93baff;outline-offset:1px}
        .ch-card-icon{display:grid;place-items:center;width:42px;height:42px;border-radius:50%;flex-shrink:0}
        .ch-card-content{min-width:0}
        .ch-card-label{font-size:12px;font-weight:800;line-height:1.5}
        .ch-card-value{font-size:27px;font-weight:900;margin:5px 0}
        .ch-card-description{color:${C.muted};font-size:10px;line-height:1.5}
        .ch-panel{border:1px solid ${C.border};border-radius:15px;background:#fff;box-shadow:0 4px 18px #172b4d08;overflow:hidden}
        .ch-content{padding:22px}
        .ch-header,.ch-heading,.ch-footer,.ch-table-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
        .ch-header{margin-bottom:20px}
        .ch-title{font-size:24px;font-weight:900;margin:0 0 6px;color:${C.navy}}
        .ch-subtitle{margin:0;color:${C.muted};font-size:12px;line-height:1.6}
        .ch-count{display:inline-flex;padding:7px 11px;border:1px solid #d2e3fc;border-radius:20px;background:#eff6ff;color:#2455a0;font-size:11px;font-weight:800;white-space:nowrap}
        .ch-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:36px;padding:8px 12px;border:1px solid #1557b0;border-radius:9px;background:#1557b0;color:#fff;font-family:inherit;font-size:12px;font-weight:750;cursor:pointer}
        .ch-button:hover:not(:disabled){filter:brightness(.96)}
        .ch-button:disabled{opacity:.55;cursor:wait}
        .ch-secondary{border-color:#cbdcf3;background:#fff;color:#174b91}
        .ch-danger{border-color:#fecdd3;background:#fff5f5;color:#be123c}
        .ch-edit{border-color:#c9ddfc;background:#f0f6ff;color:#1d4ed8}
        .ch-filter{padding:0;border:1px solid #dbe7f7;border-radius:13px;background:#fff;overflow:hidden;box-shadow:0 3px 12px #1e40af08}
        .ch-heading{padding:15px 19px;margin:0;border-bottom:1px solid #e5edf8;background:linear-gradient(110deg,#f5f9ff,#fff)}
        .ch-heading-title{display:flex;align-items:center;gap:10px;color:#173b73;font-size:15px;font-weight:850}
        .ch-filter-grid{display:grid;grid-template-columns:minmax(230px,1.5fr) repeat(2,minmax(150px,1fr));gap:14px;align-items:end;padding:19px}
        .ch-label{display:block;min-width:0;color:#526781;font-size:11px;font-weight:750}
        .ch-control-wrap{position:relative;margin-top:7px}
        .ch-control{width:100%;min-width:0;height:42px;padding:0 12px;border:1px solid #d4dfed;border-radius:9px;background:#fff;color:${C.navy};font-family:inherit;font-size:12px;outline:none;transition:border-color .18s,box-shadow .18s}
        .ch-control:hover{border-color:#a9bfdf}
        .ch-control:focus{border-color:#3b82f6;box-shadow:0 0 0 3px #3b82f61a}
        .ch-search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#64748b;pointer-events:none}
        .ch-search{padding-left:39px}
        .ch-date-box{grid-column:1/-1;padding:15px;border:1px solid #e0eaf7;border-radius:11px;background:#f8fbff}
        .ch-date-title{display:flex;align-items:center;gap:9px;margin-bottom:13px;color:#244b83;font-size:13px;font-weight:800}
        .ch-date-title-icon{display:grid;place-items:center;width:32px;height:32px;border-radius:9px;background:#e2edff;color:#2563eb}
        .ch-date-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}
        .ch-date-hint{margin-top:12px;padding:10px 12px;border-radius:8px;background:#edf4ff;color:#526781;font-size:11px;line-height:1.8}
        .ch-date-hint strong{color:#1d4ed8}
        .ch-chips{display:flex;gap:7px;flex-wrap:wrap;padding:0 19px;margin-top:-3px}
        .ch-chip{padding:6px 10px;border:1px solid #cfe0fb;border-radius:20px;background:#eff6ff;color:#1d4ed8;font-size:11px;font-weight:750;overflow-wrap:anywhere}
        .ch-footer{margin-top:0;padding:13px 19px;border-top:1px solid #e7edf6;background:#fbfdff}
        .ch-muted{color:${C.muted};font-size:11px}
        .ch-table-section{margin-top:25px}
        .ch-table-heading{margin-bottom:13px}
        .ch-table-title{margin:0 0 5px;color:${C.navy};font-size:18px;font-weight:850}
        .ch-table-wrap{width:100%;overflow:auto;border:1px solid #dce7f5;border-radius:11px;background:#fff}
        .ch-table{width:100%;min-width:1050px;border-collapse:separate;border-spacing:0;text-align:left}
        .ch-table th{padding:13px;border-bottom:1px solid #dce7f5;background:#eff5fd;color:#31527f;font-size:10px;font-weight:850;text-transform:uppercase;letter-spacing:.035em;white-space:nowrap}
        .ch-table td{padding:12px 13px;border-bottom:1px solid #eaf0f8;color:#526781;font-size:12px;vertical-align:middle}
        .ch-row{transition:background .15s}
        .ch-row:hover{background:#f5f9ff}
        .ch-claim-id{display:inline-block;padding:6px 10px;border:1px solid #d8e8ff;border-radius:20px;background:#eaf3ff;color:#1554a5;font-size:11px;font-weight:850;white-space:nowrap}
        .ch-link{padding:0;border:0;background:transparent;color:#17365f;font-family:inherit;font-size:12px;font-weight:800;text-align:left;cursor:pointer}
        .ch-link:hover{color:${C.blue};text-decoration:underline}
        .ch-status{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border:1px solid;border-radius:20px;font-size:10px;font-weight:800;white-space:nowrap}
        .ch-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
        .ch-creator{display:inline-block;max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#49617f;font-weight:650}
        .ch-table .ch-button{min-height:31px;padding:6px 9px;border-radius:8px;font-size:11px;white-space:nowrap}
        .ch-detail-row td{padding:0;background:#f4f8ff}
        .ch-detail-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:15px}
        .ch-detail-item{min-width:0;padding:12px;border:1px solid #dce8f8;border-radius:9px;background:#fff}
        .ch-detail-label{margin-bottom:7px;color:#71839d;font-size:10px;font-weight:800;text-transform:uppercase}
        .ch-detail-value{color:#203c63;font-size:12px;font-weight:700;overflow-wrap:anywhere;white-space:pre-wrap}
        .ch-detail-actions{grid-column:1/-1;display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap}
        .ch-empty{padding:38px 16px;text-align:center;color:#71839d;font-size:13px}
        .ch-empty strong{display:block;margin-bottom:8px;color:#203c63;font-size:16px}
        .ch-alert{margin:14px 0;padding:12px 14px;border:1px solid;border-radius:10px;font-size:13px;line-height:1.6}
        .ch-error{border-color:#fecaca;background:#fef2f2;color:${C.red}}
        .ch-success{border-color:#bbf7d0;background:#f0fdf4;color:${C.green}}
        .ch-modal-backdrop{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:18px;background:#0f172a88}
        .ch-modal{width:100%;max-width:530px;max-height:90vh;overflow:auto;border-radius:16px;background:#fff;box-shadow:0 20px 70px #0003}
        .ch-modal-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:20px;border-bottom:1px solid ${C.border}}
        .ch-modal-title{margin:0 0 5px;font-size:20px;font-weight:850}
        .ch-modal-body{padding:20px}
        .ch-modal-field{margin-bottom:17px}
        .ch-modal-actions{display:flex;justify-content:flex-end;gap:9px;flex-wrap:wrap;padding-top:9px}
        @media(max-width:950px){.ch-cards{grid-template-columns:repeat(2,minmax(0,1fr))}.ch-detail-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:850px){.ch-filter-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ch-filter-grid>.ch-label:first-child{grid-column:1/-1}}
        @media(max-width:650px){.ch-content{padding:13px}.ch-cards{gap:9px}.ch-card{padding:12px;gap:9px}.ch-card-value{font-size:23px}.ch-card-icon{width:34px;height:34px}.ch-detail-grid{grid-template-columns:1fr}.ch-filter-grid,.ch-date-grid{grid-template-columns:1fr}.ch-filter-grid>.ch-label:first-child,.ch-date-box{grid-column:auto}.ch-heading,.ch-filter-grid{padding:14px}.ch-chips{padding:0 14px}.ch-footer{padding:12px 14px}.ch-title{font-size:21px}}
      `}</style>

      <div className="ch-cards">
        {cards.map((card) => (
          <button
            type="button"
            key={card.label}
            className={`ch-card ${statusFilter === card.status ? "ch-selected" : ""}`}
            style={{ background: card.bg, borderColor: card.border }}
            onClick={() => selectStatus(card.status)}
            aria-pressed={statusFilter === card.status}
            title={`Filter by ${card.label}`}
          >
            <span className="ch-card-icon" style={{ background: card.border, color: card.color }}>
              <Icon name={card.icon} size={21} />
            </span>
            <span className="ch-card-content">
              <span className="ch-card-label">{card.label}</span>
              <span className="ch-card-value" style={{ color: card.color, display: "block" }}>{card.value}</span>
              <span className="ch-card-description">{card.description}</span>
            </span>
          </button>
        ))}
      </div>

      <section className="ch-panel">
        <div className="ch-content">
          <div className="ch-header">
            <div>
              <h2 className="ch-title">Claim Records</h2>
              <p className="ch-subtitle">Search, filter, and manage your claim history.</p>
            </div>
            <div style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap" }}>
              <span className="ch-count">{filteredClaims.length} of {claims.length} claims</span>
              <button type="button" className="ch-button" onClick={() => { loadClaims(false); loadRcmUsers(); }} disabled={refreshing}>
                <Icon name="refresh" size={15} />{refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          {actionError && !editingClaim && <div className="ch-alert ch-error" role="alert">{actionError}</div>}
          {successMessage && <div className="ch-alert ch-success" role="status">{successMessage}</div>}

          <div className="ch-filter">
            <div className="ch-heading">
              <div className="ch-heading-title"><Icon name="filter" size={19} />Filters &amp; Search</div>
              {hasFilters && <span className="ch-count">Filters active</span>}
            </div>

            <div className="ch-filter-grid">
              <label className="ch-label">
                Search claims
                <div className="ch-control-wrap">
                  <span className="ch-search-icon"><Icon name="search" size={17} /></span>
                  <input className="ch-control ch-search" type="search" value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search patient, file number, claim ID..." />
                </div>
              </label>

              <label className="ch-label">
                Status
                <div className="ch-control-wrap">
                  <select className="ch-control" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    <option value="All">All statuses</option>
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </label>

              <label className="ch-label">
                Created by (RCM user)
                <div className="ch-control-wrap">
                  <select className="ch-control" value={createdByFilter} onChange={(event) => setCreatedByFilter(event.target.value)}>
                    <option value="All">All RCM creators</option>
                    {creatorOptions.map((user) => <option key={user.key} value={user.key}>{user.name}</option>)}
                    <option value="Not recorded">Not recorded</option>
                  </select>
                </div>
              </label>

              <div className="ch-date-box">
                <div className="ch-date-title">
                  <span className="ch-date-title-icon"><Icon name="calendar" size={17} /></span>
                  Filter by date
                </div>
                <div className="ch-date-grid">
                  <label className="ch-label">
                    Month
                    <div className="ch-control-wrap">
                      <input className="ch-control" type="month" value={selectedMonth}
                        onChange={(event) => { setSelectedMonth(event.target.value); setSelectedDate(""); }}
                        aria-label="Select claim month" />
                    </div>
                  </label>
                  <label className="ch-label">
                    Specific date (optional)
                    <div className="ch-control-wrap">
                      <input className="ch-control" type="date" value={selectedDate}
                        onChange={(event) => { const day = event.target.value; setSelectedDate(day); if (day) setSelectedMonth(day.slice(0, 7)); }}
                        aria-label="Select specific claim date" />
                    </div>
                  </label>
                </div>
                <div className="ch-date-hint">
                  <strong>Current selection:</strong> {selectedDate ? dateDescription : monthDescription}
                  <br />By default, all dates are shown. Choose a month or a specific date to narrow the results.
                </div>
              </div>
            </div>

            {hasFilters && (
              <div className="ch-chips">
                {statusFilter !== "All" && <span className="ch-chip">Status: {statusFilter}</span>}
                {search.trim() && <span className="ch-chip">Search: {search.trim()}</span>}
                {createdByFilter !== "All" && (
                  <span className="ch-chip">
                    Created by: {creatorOptions.find((user) => user.key === createdByFilter)?.name || createdByFilter}
                  </span>
                )}
                {selectedDate ? <span className="ch-chip">Date: {dateDescription}</span> :
                  selectedMonth ? <span className="ch-chip">Month: {monthDescription}</span> : null}
              </div>
            )}

            <div className="ch-footer">
              <span className="ch-muted">Showing <strong>{filteredClaims.length}</strong> matching claims</span>
              {hasFilters && (
                <button type="button" className="ch-button ch-secondary" onClick={resetFilters}>
                  <Icon name="reset" size={14} />Reset filters
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="ch-alert ch-error" role="alert">
              {error}
              <button type="button" className="ch-button ch-secondary" onClick={() => loadClaims()} disabled={loading} style={{ marginLeft: 10 }}>
                Try again
              </button>
            </div>
          )}

          <div className="ch-table-section">
            <div className="ch-table-heading">
              <div>
                <h3 className="ch-table-title">Claim Records</h3>
                <p className="ch-subtitle">Review claim details, status, creator, and submission date.</p>
              </div>
              <span className="ch-count">{filteredClaims.length} of {claims.length} claims</span>
            </div>

            {loading ? (
              <div className="ch-empty">Loading claim records...</div>
            ) : (
              <div className="ch-table-wrap">
                <table className="ch-table">
                  <thead>
                    <tr>
                      <th>Claim ID</th><th>Patient</th><th>File Number</th><th>Status</th>
                      <th>Created By</th><th>Date Created</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClaims.map((claim, index) => {
                      const status = statusOf(claim);
                      const badge = statusColors(status);
                      const patientId = patientIdOf(claim);
                      const claimKey = String(claim.id ?? `${claimIdOf(claim)}-${index}`);
                      const isExpanded = String(expandedClaim) === claimKey;
                      const canManage = true;
                      const isDeleting = deletingId === String(claim.id);

                      return (
                        <React.Fragment key={claimKey}>
                          <tr className="ch-row">
                            <td><span className="ch-claim-id">{claimIdOf(claim)}</span></td>
                            <td>
                              {patientId !== "" && patientId != null ? (
                                <button type="button" className="ch-link" onClick={() => openPatientFile(navigate, patientId)}>{patientName(claim)}</button>
                              ) : <strong style={{ color: C.navy }}>{patientName(claim)}</strong>}
                            </td>
                            <td>
                              {patientId !== "" && patientId != null ? (
                                <button type="button" className="ch-link" style={{ color: C.blue }}
                                  onClick={() => openPatientFile(navigate, patientId)} title="Open patient file">
                                  {fileNumberOf(claim)}
                                </button>
                              ) : fileNumberOf(claim)}
                            </td>
                            <td>
                              <span className="ch-status" style={{ color: badge.color, background: badge.bg, borderColor: badge.border }}>
                                <span className="ch-dot" style={{ background: badge.dot }} />{status}
                              </span>
                            </td>
                            <td><span className="ch-creator" title={displayCreatorName(claim)}>{displayCreatorName(claim)}</span></td>
                            <td style={{ whiteSpace: "nowrap" }}>{formatDate(createdDateOf(claim))}</td>
                            <td>
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                <button type="button" className="ch-button ch-secondary"
                                  onClick={() => setExpandedClaim(isExpanded ? null : claimKey)}>
                                  {isExpanded ? "Hide details" : "Details"}
                                </button>
                                <button type="button" className="ch-button ch-edit" onClick={() => startEditing(claim)} aria-label={`Edit claim ${claimIdOf(claim)}`}>
                                  <Icon name="edit" size={13} /> Edit
                                </button>
                                <button type="button" className="ch-button ch-danger" onClick={() => deleteClaim(claim)} disabled={isDeleting} aria-label={`Delete claim ${claimIdOf(claim)}`}>
                                  <Icon name="trash" size={13} /> {isDeleting ? "Deleting..." : "Delete"}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="ch-detail-row">
                              <td colSpan={7}>
                                <div className="ch-detail-grid">
                                  {[
                                    ["Patient", patientName(claim)],
                                    ["File Number", fileNumberOf(claim)],
                                    ["Created By", displayCreatorName(claim)],
                                    ["Status", status],
                                    ["Date Created", formatDate(createdDateOf(claim))],
                                    ["Rejection Reason", rejectionReasonOf(claim) || "No rejection reason recorded."],
                                  ].map(([label, value]) => (
                                    <div className="ch-detail-item" key={label}>
                                      <div className="ch-detail-label">{label}</div>
                                      <div className="ch-detail-value">{value}</div>
                                    </div>
                                  ))}
                                  <div className="ch-detail-actions">
                                    {patientId !== "" && patientId != null && (
                                      <button type="button" className="ch-button" onClick={() => openPatientFile(navigate, patientId)}>
                                        <Icon name="file" size={14} />Open Patient File
                                      </button>
                                    )}
                                  </div>
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
                            <strong>{claims.length ? "No matching claims found" : "No claims recorded yet"}</strong>
                            {claims.length
                              ? "Try changing the search, status, creator, or date filter."
                              : "Submitted claims will appear here."}
                            {hasFilters && (
                              <div style={{ marginTop: 14 }}>
                                <button type="button" className="ch-button ch-secondary" onClick={resetFilters}>Reset filters</button>
                              </div>
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

      {editingClaim && (
        <div className="ch-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeEdit();
        }}>
          <section className="ch-modal" role="dialog" aria-modal="true" aria-labelledby="ch-edit-title">
            <div className="ch-modal-header">
              <div>
                <h3 className="ch-modal-title" id="ch-edit-title">Edit Claim</h3>
                <p className="ch-subtitle">Claim {claimIdOf(editingClaim)} · {patientName(editingClaim)}</p>
              </div>
              <button type="button" className="ch-button ch-secondary" onClick={closeEdit} disabled={saving} aria-label="Close edit form">
                <Icon name="close" size={15} />
              </button>
            </div>

            <form className="ch-modal-body" onSubmit={saveClaim}>
              <label className="ch-label ch-modal-field">
                Claim status
                <div className="ch-control-wrap">
                  <select className="ch-control" value={editStatus} onChange={(event) => setEditStatus(event.target.value)} required>
                    {["Pending", "Submitted", "Processing", "Approved", "Rejected", "Paid"].map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                    {!["Pending", "Submitted", "Processing", "Approved", "Rejected", "Paid"].some((status) => status.toLowerCase() === editStatus.toLowerCase()) &&
                      <option value={editStatus}>{editStatus}</option>}
                  </select>
                </div>
              </label>

              <label className="ch-label ch-modal-field">
                Rejection reason / remarks
                <div className="ch-control-wrap">
                  <textarea className="ch-control" value={editReason} onChange={(event) => setEditReason(event.target.value)}
                    placeholder="Enter rejection reason or additional remarks..." rows={4}
                    style={{ height: 120, padding: 12, resize: "vertical" }} />
                </div>
              </label>

              {actionError && <div className="ch-alert ch-error" role="alert">{actionError}</div>}

              <div className="ch-modal-actions">
                <button type="button" className="ch-button ch-secondary" onClick={closeEdit} disabled={saving}>Cancel</button>
                <button type="submit" className="ch-button" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
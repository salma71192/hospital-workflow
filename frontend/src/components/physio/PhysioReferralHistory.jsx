
import React, { useMemo, useState } from "react";

const styles = `
.prh {
  --navy: #183451;
  --teal: #087f8c;
  --ink: #26384b;
  --muted: #728196;
  --line: #e4eaf0;
  color: var(--ink);
  font-family: Inter, "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
  font-size: 13px;
  min-width: 0;
}
.prh *, .prh *::before, .prh *::after { box-sizing: border-box; }
.prh button, .prh input, .prh select, .prh textarea { font: inherit; }
.prh button { -webkit-tap-highlight-color: transparent; }
.prh .prh-shell { display: grid; gap: 20px; min-width: 0; }

.prh .prh-hero {
  display:flex; align-items:center; justify-content:space-between; gap:20px;
  padding:27px 29px; border-radius:18px; color:white;
  background:linear-gradient(118deg,#183451,#20516c 66%,#087f8c 130%);
  box-shadow:0 8px 25px rgba(24,52,81,.13);
}
.prh .prh-eyebrow {
  display:flex; align-items:center; gap:7px; margin-bottom:9px;
  color:#bce8e9; font-size:10px; font-weight:800; letter-spacing:.13em;
}
.prh .prh-eyebrow-dot { width:7px; height:7px; border-radius:50%; background:#7be0cc; }
.prh .prh-hero h2 { margin:0; font-size:clamp(22px,2.6vw,29px); font-weight:800; }
.prh .prh-hero p { margin:9px 0 0; color:#d4e3ef; font-size:12px; line-height:1.8; }
.prh .prh-refresh {
  padding:10px 15px; border:1px solid #ffffff55; border-radius:9px;
  background:#ffffff18; color:#fff; font-weight:750; cursor:pointer;
}
.prh .prh-refresh:disabled { opacity:.5; cursor:not-allowed; }

.prh .prh-stats { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:15px; }
.prh .prh-stat {
  position:relative; display:flex; align-items:center; gap:14px; min-width:0;
  padding:19px; border:1px solid var(--line); border-radius:15px;
  background:#fff; color:var(--ink); text-align:left; cursor:pointer;
  box-shadow:0 3px 12px #19324b0b; transition:.18s ease;
}
.prh .prh-stat:hover { transform:translateY(-2px); box-shadow:0 8px 22px #19324b16; }
.prh .prh-stat.is-active { border-color:var(--teal); box-shadow:0 0 0 2px #087f8c1c; }
.prh .prh-stat-icon {
  display:flex; align-items:center; justify-content:center; flex-shrink:0;
  width:45px; height:45px; border-radius:13px; font-size:21px; font-weight:800;
}
.prh .prh-stat-icon.awaiting { background:#fff0d9; color:#b96919; }
.prh .prh-stat-icon.completed { background:#dcf5e7; color:#16805d; }
.prh .prh-stat-icon.total { background:#e1edff; color:#2865a1; }
.prh .prh-stat-copy { display:flex; flex-direction:column; min-width:0; }
.prh .prh-stat-label { color:#6e7d90; font-size:11px; font-weight:750; }
.prh .prh-stat-value { margin-top:5px; color:var(--navy); font-size:28px; font-weight:850; }
.prh .prh-stat-note { margin-top:4px; color:#8794a4; font-size:10px; }

.prh .prh-panel { min-width:0; overflow:hidden; border:1px solid var(--line); border-radius:15px; background:#fff; }
.prh .prh-panel-heading {
  display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap;
  gap:12px; padding:19px 22px; border-bottom:1px solid var(--line);
}
.prh .prh-panel-heading h3 { margin:0; color:var(--navy); font-size:14px; font-weight:800; }
.prh .prh-panel-heading p { margin:4px 0 0; color:var(--muted); font-size:11px; }
.prh .prh-filter-content { padding:20px 22px; }
.prh .prh-filter-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:17px; }
.prh .prh-field { display:grid; gap:7px; min-width:0; }
.prh .prh-label { color:#64758a; font-size:10px; font-weight:800; letter-spacing:.06em; }
.prh .prh-control {
  width:100%; min-width:0; min-height:41px; padding:10px 12px;
  border:1px solid #dce4ed; border-radius:8px; outline:none;
  background:#fff; color:#26384b; font-size:12px;
}
.prh .prh-control:focus { border-color:#5aabb1; box-shadow:0 0 0 3px #087f8c17; }
.prh textarea.prh-control { resize:vertical; min-height:100px; line-height:1.6; }
.prh .prh-filter-footer {
  display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap;
  gap:12px; margin-top:20px; padding-top:15px; border-top:1px solid #edf1f5;
}
.prh .prh-filter-summary { display:flex; align-items:center; flex-wrap:wrap; gap:9px; color:var(--muted); font-size:11px; }
.prh .prh-count-pill { padding:6px 10px; border-radius:7px; background:#eaf5f6; color:#087782; font-size:11px; font-weight:800; }

.prh .prh-button {
  display:inline-flex; align-items:center; justify-content:center; gap:7px;
  min-height:35px; padding:8px 12px; border:1px solid #dce4ed;
  border-radius:8px; background:#fff; color:#41546a; cursor:pointer;
  font-size:11px; font-weight:750; white-space:nowrap; transition:.18s ease;
}
.prh .prh-button:hover:not(:disabled) { background:#f5f8fb; border-color:#b9c9d8; }
.prh .prh-button:disabled { opacity:.5; cursor:not-allowed; }
.prh .prh-button-primary { background:#087f8c; border-color:#087f8c; color:#fff; }
.prh .prh-button-primary:hover:not(:disabled) { background:#066875; color:#fff; }
.prh .prh-button-edit { background:#1769aa; border-color:#1769aa; color:#fff; }
.prh .prh-button-edit:hover:not(:disabled) { background:#12558c; color:#fff; }
.prh .prh-button-delete { background:#c43d48; border-color:#c43d48; color:#fff; }
.prh .prh-button-delete:hover:not(:disabled) { background:#a92e39; color:#fff; }

.prh .prh-alert {
  display:flex; align-items:flex-start; gap:10px; padding:12px 15px;
  border-radius:9px; font-size:12px; line-height:1.65; overflow-wrap:anywhere;
}
.prh .prh-alert-error { color:#a82f3c; background:#fff4f4; border:1px solid #f3d0d4; }
.prh .prh-alert-success { color:#13744f; background:#effaf4; border:1px solid #ccebd8; }
.prh .prh-alert-symbol { font-weight:900; }

.prh .prh-table-heading {
  display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap;
  gap:12px; padding:22px 24px; background:#fbfdff;
}
.prh .prh-table-heading h3 { margin:0; color:var(--navy); font-size:16px; font-weight:800; }
.prh .prh-table-heading p { margin:6px 0 0; color:var(--muted); font-size:11px; }
.prh .prh-table-wrap { width:100%; overflow:auto; border-top:1px solid #e3ebf3; }
.prh .prh-table { width:100%; min-width:940px; border-collapse:separate; border-spacing:0; text-align:left; font-size:12px; }
.prh .prh-table th {
  position:sticky; top:0; z-index:2; padding:14px 16px;
  background:#edf5f8; color:#48657b; border-bottom:1px solid #d9e6ed;
  font-size:9px; font-weight:850; letter-spacing:.075em; white-space:nowrap;
}
.prh .prh-table th:first-child, .prh .prh-table td:first-child { padding-left:20px; }
.prh .prh-table td { padding:15px 16px; border-bottom:1px solid #edf1f5; color:#45566b; vertical-align:middle; line-height:1.6; }
.prh .prh-table tbody tr:hover { background:#eff9fa !important; }
.prh .prh-patient { color:var(--navy); font-weight:800; }
.prh .prh-date { display:inline-block; padding:6px 9px; border:1px solid #d9e8f2; border-radius:7px; background:#f1f7fc; color:#315f83; font-size:11px; font-weight:750; white-space:nowrap; }
.prh .prh-physician { color:#354a60; font-weight:700; }
.prh .prh-status { display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:20px; font-size:10px; font-weight:800; white-space:nowrap; }
.prh .prh-status.awaiting { background:#fff5e8; border:1px solid #f2dfc2; color:#a86217; }
.prh .prh-status.completed { background:#eaf8f0; border:1px solid #cdebd9; color:#18784f; }
.prh .prh-status-dot { width:6px; height:6px; border-radius:50%; background:currentColor; }
.prh .prh-actions { display:flex; flex-wrap:wrap; align-items:center; gap:7px; }
.prh .prh-actions .prh-button { min-height:33px; padding:7px 11px; font-size:10px; }
.prh .prh-empty { padding:45px 20px !important; text-align:center; color:var(--muted) !important; }
.prh .prh-empty-title { margin-bottom:5px; color:var(--navy); font-size:13px; font-weight:800; }
.prh .prh-table-footer {
  display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px;
  padding:15px 22px; border-top:1px solid #e5edf4; background:#f8fafc;
  color:#748397; font-size:10px;
}

/* Shared modal styling */
.prh .prh-modal-overlay {
  position:fixed; inset:0; z-index:9999; display:flex; align-items:center;
  justify-content:center; padding:18px; background:rgba(15,32,49,.62);
  backdrop-filter:blur(5px); overflow-y:auto; animation:prh-fade-in .16s ease-out;
}
.prh .prh-modal {
  width:100%; max-width:520px; max-height:92vh; overflow-y:auto;
  border:1px solid #ffffffaa; border-radius:18px; background:#fff;
  box-shadow:0 28px 90px rgba(10,30,50,.3); animation:prh-modal-in .2s ease-out;
}
.prh .prh-modal-header { display:flex; align-items:flex-start; gap:13px; padding:23px 24px 19px; border-bottom:1px solid var(--line); }
.prh .prh-modal-icon {
  display:flex; align-items:center; justify-content:center; flex-shrink:0;
  width:43px; height:43px; border-radius:13px; background:#eaf5f6; color:var(--teal); font-size:20px;
}
.prh .prh-modal-icon.danger { background:#fff0f0; color:#c43d48; }
.prh .prh-modal-title { margin:1px 0 5px; color:var(--navy); font-size:19px; font-weight:850; }
.prh .prh-modal-description { margin:0; color:var(--muted); font-size:11px; line-height:1.7; }
.prh .prh-modal-body { padding:22px 24px; }
.prh .prh-modal-fields { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:17px; }
.prh .prh-span-two { grid-column:1 / -1; }
.prh .prh-modal-footer {
  display:flex; justify-content:flex-end; flex-wrap:wrap; gap:9px;
  padding:16px 24px; border-top:1px solid var(--line); background:#fafbfd;
}
.prh .prh-modal-footer .prh-button { min-width:100px; min-height:39px; }
.prh .prh-delete-summary {
  display:flex; align-items:flex-start; gap:12px; padding:15px;
  border:1px solid #f3d6d8; border-radius:12px; background:#fff7f7;
}
.prh .prh-delete-summary-icon {
  display:flex; align-items:center; justify-content:center; flex-shrink:0;
  width:39px; height:39px; border-radius:11px; background:#ffe5e5; color:#b82f3c; font-size:18px;
}
.prh .prh-delete-patient { margin:0 0 4px; color:#7f2430; font-size:14px; font-weight:850; overflow-wrap:anywhere; }
.prh .prh-delete-meta { color:#856b70; font-size:11px; line-height:1.7; overflow-wrap:anywhere; }
.prh .prh-warning-note {
  margin-top:15px; padding:11px 12px; border-radius:9px;
  background:#fff8e8; color:#875816; font-size:11px; line-height:1.7;
}
.prh .prh-modal-error { margin:0 24px 5px; }
.prh .prh-spinner {
  display:inline-block; width:12px; height:12px; border:2px solid currentColor;
  border-right-color:transparent; border-radius:50%; animation:prh-spin .65s linear infinite;
}
@keyframes prh-spin { to { transform:rotate(360deg); } }
@keyframes prh-fade-in { from { opacity:0; } to { opacity:1; } }
@keyframes prh-modal-in { from { opacity:0; transform:translateY(8px) scale(.985); } to { opacity:1; transform:translateY(0) scale(1); } }

@media(max-width:900px) {
  .prh .prh-filter-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .prh .prh-stat { padding:15px; gap:10px; }
}
@media(max-width:620px) {
  .prh .prh-shell { gap:14px; }
  .prh .prh-hero { align-items:flex-start; flex-direction:column; padding:21px 19px; }
  .prh .prh-refresh { width:100%; }
  .prh .prh-stats { grid-template-columns:1fr; gap:9px; }
  .prh .prh-filter-grid { grid-template-columns:1fr; gap:14px; }
  .prh .prh-panel-heading, .prh .prh-filter-content, .prh .prh-table-heading { padding-left:15px; padding-right:15px; }
  .prh .prh-filter-footer { align-items:stretch; flex-direction:column; }
  .prh .prh-filter-footer .prh-button { width:100%; }
  .prh .prh-modal-overlay { padding:10px; }
  .prh .prh-modal { max-height:95vh; border-radius:14px; }
  .prh .prh-modal-header, .prh .prh-modal-body { padding:18px; }
  .prh .prh-modal-footer { padding:14px 18px; }
  .prh .prh-modal-fields { grid-template-columns:1fr; }
  .prh .prh-span-two { grid-column:auto; }
  .prh .prh-modal-footer .prh-button { flex:1; }
  .prh .prh-table-footer { padding:13px 15px; }
}
`;

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function getTodayLocalDate() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function getCurrentLocalMonth() {
  return getTodayLocalDate().slice(0, 7);
}

function getPatientName(referral) {
  const patient = referral?.patient;
  if (typeof patient === "string") return patient;

  return firstValue(
    referral?.patient_name,
    patient?.name,
    patient?.full_name,
    patient?.display_name,
    referral?.patient_full_name
  ) || "Unknown patient";
}

function getPatientId(referral) {
  const patient = referral?.patient;
  return firstValue(
    referral?.patient_id,
    typeof patient === "object" ? patient?.id : null
  );
}

function getPatientFileNumber(referral) {
  const patient = referral?.patient;
  return firstValue(
    referral?.patient_file_id,
    referral?.patient_file_number,
    referral?.file_number,
    patient?.patient_id,
    patient?.file_number,
    patient?.patient_file_number
  ) || "";
}

function getPhysicianName(referral) {
  const physician = referral?.physician;
  if (typeof physician === "string") return physician;

  return firstValue(
    referral?.physician_name,
    physician?.name,
    physician?.display_name,
    physician?.full_name,
    physician?.username
  ) || "Unknown physician";
}

function getPhysicianId(referral) {
  const physician = referral?.physician;
  return firstValue(
    referral?.physician_id,
    typeof physician === "object" ? physician?.id : null
  );
}

function getReferralReason(referral) {
  return String(firstValue(
    referral?.reason,
    referral?.referral_reason,
    referral?.notes,
    ""
  ));
}

function getReferringPhysioName(referral) {
  const person = referral?.referring_physio ?? referral?.referred_by;
  if (typeof person === "string") return person;

  return firstValue(
    referral?.referring_physio_name,
    referral?.referred_by_name,
    referral?.created_by_name,
    person?.display_name,
    person?.name,
    person?.full_name,
    person?.username
  ) || "—";
}

function getDateValue(value) {
  if (!value) return "";
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(String(value));
  if (match) return match[1];

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, "0"),
    String(parsed.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDate(value) {
  const date = getDateValue(value);
  if (!date) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : date;
}

function hasFirstVisit(referral) {
  if (typeof referral?.first_visit_completed === "boolean") {
    return referral.first_visit_completed;
  }
  if (typeof referral?.has_first_visit === "boolean") {
    return referral.has_first_visit;
  }
  if (referral?.first_visit_at || referral?.first_visit_date || referral?.first_visit_completed_at) {
    return true;
  }

  return ["completed", "complete", "done", "closed"].includes(
    String(referral?.status ?? "").trim().toLowerCase()
  );
}

function getReferralDate(referral) {
  return firstValue(
    referral?.referral_date,
    referral?.created_at,
    referral?.date_created,
    referral?.created
  );
}

function getPhysicianOptionName(physician) {
  return firstValue(
    physician?.name,
    physician?.display_name,
    physician?.full_name,
    physician?.username
  ) || "Unknown physician";
}

function getPatientOptionName(patient) {
  return firstValue(
    patient?.name,
    patient?.full_name,
    patient?.display_name,
    patient?.patient_name
  ) || `Patient #${patient?.id ?? ""}`;
}

function getErrorMessage(error, fallback) {
  const data = error?.response?.data;
  if (typeof data === "string" && data.trim()) return data;

  return (
    data?.detail ||
    data?.error ||
    data?.message ||
    error?.message ||
    fallback
  );
}

function StatCard({ label, value, note, tone, active, onClick }) {
  const icon = { awaiting: "◷", completed: "✓", total: "▤" }[tone] || "▤";

  return (
    <button
      type="button"
      className={`prh-stat ${active ? "is-active" : ""}`}
      onClick={onClick}
      aria-pressed={active}
    >
      <span className={`prh-stat-icon ${tone}`} aria-hidden="true">{icon}</span>
      <span className="prh-stat-copy">
        <span className="prh-stat-label">{label}</span>
        <span className="prh-stat-value">{value}</span>
        <span className="prh-stat-note">{note}</span>
      </span>
    </button>
  );
}

export default function PhysioReferralHistory({
  referrals = [],
  physicians = [],
  patients = [],
  loading = false,
  error = "",
  success = "",
  onRefresh,
  onEditReferral,
  onDeleteReferral,
}) {
  const [search, setSearch] = useState("");
  const [dateMode, setDateMode] = useState("date");
  const [selectedDate, setSelectedDate] = useState(getTodayLocalDate);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentLocalMonth);
  const [physicianFilter, setPhysicianFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [editingReferral, setEditingReferral] = useState(null);
  const [editForm, setEditForm] = useState({
    patient: "",
    physician: "",
    reason: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const safeReferrals = Array.isArray(referrals) ? referrals : [];
  const safePhysicians = Array.isArray(physicians) ? physicians : [];
  const safePatients = Array.isArray(patients) ? patients : [];

  const selectedPhysician = safePhysicians.find(
    (physician) => String(physician?.id) === String(physicianFilter)
  );

  const selectedPhysicianName = String(firstValue(
    selectedPhysician?.name,
    selectedPhysician?.display_name,
    selectedPhysician?.full_name,
    selectedPhysician?.username,
    ""
  )).toLowerCase();

  const filteredReferrals = useMemo(() => {
    const query = search.trim().toLowerCase();

    return safeReferrals
      .filter((referral) => {
        const patientName = getPatientName(referral).toLowerCase();
        const fileNumber = String(getPatientFileNumber(referral)).toLowerCase();
        const physicianName = getPhysicianName(referral).toLowerCase();
        const referringPhysio = getReferringPhysioName(referral).toLowerCase();
        const referralDate = getDateValue(getReferralDate(referral));
        const status = hasFirstVisit(referral) ? "completed" : "awaiting";
        const physicianId = getPhysicianId(referral);

        const matchesSearch =
          !query ||
          patientName.includes(query) ||
          fileNumber.includes(query) ||
          physicianName.includes(query) ||
          referringPhysio.includes(query);

        const matchesDate =
          dateMode !== "date" || !selectedDate || referralDate === selectedDate;

        const matchesMonth =
          dateMode !== "month" || !selectedMonth || referralDate.startsWith(selectedMonth);

        const matchesPhysician =
          !physicianFilter ||
          String(physicianId ?? "") === String(physicianFilter) ||
          physicianName === selectedPhysicianName;

        const matchesStatus = statusFilter === "all" || status === statusFilter;

        return matchesSearch && matchesDate && matchesMonth && matchesPhysician && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = getDateValue(getReferralDate(a));
        const dateB = getDateValue(getReferralDate(b));
        if (dateA !== dateB) return dateB.localeCompare(dateA);
        return Number(b?.id ?? 0) - Number(a?.id ?? 0);
      });
  }, [
    safeReferrals,
    search,
    dateMode,
    selectedDate,
    selectedMonth,
    physicianFilter,
    selectedPhysicianName,
    statusFilter,
  ]);

  const awaitingCount = safeReferrals.filter((referral) => !hasFirstVisit(referral)).length;
  const completedCount = safeReferrals.filter(hasFirstVisit).length;

  const hasActiveFilters = Boolean(
    search.trim() ||
    dateMode !== "date" ||
    selectedDate !== getTodayLocalDate() ||
    selectedMonth !== getCurrentLocalMonth() ||
    physicianFilter ||
    statusFilter !== "all"
  );

  const clearFilters = () => {
    setSearch("");
    setDateMode("all");
    setSelectedDate("");
    setSelectedMonth("");
    setPhysicianFilter("");
    setStatusFilter("all");
    setActionError("");
  };

  const openEditModal = (referral) => {
    setActionError("");
    setActionSuccess("");
    setEditingReferral(referral);

    setEditForm({
      patient: String(getPatientId(referral) ?? ""),
      physician: String(getPhysicianId(referral) ?? ""),
      reason: getReferralReason(referral),
    });
  };

  const closeEditModal = () => {
    if (savingEdit) return;
    setEditingReferral(null);
    setActionError("");
  };

  const handleSaveEdit = async (event) => {
    event.preventDefault();
    if (savingEdit) return;

    if (!editingReferral?.id) {
      setActionError("This referral does not have a valid ID.");
      return;
    }

    if (!editForm.patient || !editForm.physician) {
      setActionError("Please select both a patient and a physician.");
      return;
    }

    if (typeof onEditReferral !== "function") {
      setActionError("Edit is not connected. Pass an onEditReferral callback from the parent component.");
      return;
    }

    setSavingEdit(true);
    setActionError("");
    setActionSuccess("");

    try {
      const result = await onEditReferral(editingReferral.id, {
        patient: editForm.patient,
        physician: editForm.physician,
        reason: editForm.reason.trim(),
      });

      if (result === false) {
        throw new Error("The parent component reported that the referral was not updated.");
      }

      if (typeof onRefresh === "function") {
        const refreshResult = await onRefresh();
        if (refreshResult === false) {
          throw new Error("The update request returned, but refreshing referral records failed.");
        }
      }

      setEditingReferral(null);
      setActionSuccess("Referral update request completed successfully.");
    } catch (err) {
      setActionError(getErrorMessage(err, "Could not update the referral."));
    } finally {
      setSavingEdit(false);
    }
  };

  const openDeleteModal = (referral) => {
    if (!referral?.id) {
      setActionError("This referral does not have a valid ID.");
      return;
    }

    setActionError("");
    setActionSuccess("");
    setDeleteTarget(referral);
  };

  const closeDeleteModal = () => {
    if (deletingId !== null) return;
    setDeleteTarget(null);
    setActionError("");
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id || deletingId !== null) return;

    if (typeof onDeleteReferral !== "function") {
      setActionError("Delete is not connected. Pass an onDeleteReferral callback from the parent component.");
      return;
    }

    const referralId = deleteTarget.id;
    const patientName = getPatientName(deleteTarget);

    setDeletingId(referralId);
    setActionError("");
    setActionSuccess("");

    try {
      const result = await onDeleteReferral(referralId);

      if (result === false) {
        throw new Error("The parent component reported that the referral was not deleted.");
      }

      if (typeof onRefresh === "function") {
        const refreshResult = await onRefresh();

        if (refreshResult === false) {
          throw new Error("The delete request returned, but refreshing referral records failed.");
        }
      }

      setDeleteTarget(null);
      setActionSuccess(
        `The delete request for ${patientName} completed. If the record remains visible, check the server response and reload the referral list.`
      );
    } catch (err) {
      setActionError(getErrorMessage(err, "Could not delete the referral."));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="prh">
      <style>{styles}</style>

      <div className="prh-shell">
        <header className="prh-hero">
          <div>
            <div className="prh-eyebrow">
              <span className="prh-eyebrow-dot" />
              PHYSIOTHERAPY DEPARTMENT
            </div>
            <h2>Referral History</h2>
            <p>
              Manage referred patients, review referring physiotherapists,
              and monitor first-visit completion.
            </p>
          </div>

          {typeof onRefresh === "function" && (
            <button
              type="button"
              className="prh-refresh"
              onClick={async () => {
                setActionError("");
                try {
                  await onRefresh();
                } catch (err) {
                  setActionError(getErrorMessage(err, "Could not refresh referrals."));
                }
              }}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "↻ Refresh history"}
            </button>
          )}
        </header>

        <section className="prh-stats" aria-label="Referral statistics">
          <StatCard
            label="Awaiting first visit"
            value={awaitingCount}
            note="First visit not yet recorded"
            tone="awaiting"
            active={statusFilter === "awaiting"}
            onClick={() => setStatusFilter((current) => current === "awaiting" ? "all" : "awaiting")}
          />
          <StatCard
            label="Completed referrals"
            value={completedCount}
            note="First visit recorded"
            tone="completed"
            active={statusFilter === "completed"}
            onClick={() => setStatusFilter((current) => current === "completed" ? "all" : "completed")}
          />
          <StatCard
            label="Total referrals"
            value={safeReferrals.length}
            note="All recorded referrals"
            tone="total"
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
          />
        </section>

        {error && (
          <div className="prh-alert prh-alert-error" role="alert">
            <span className="prh-alert-symbol">!</span><span>{error}</span>
          </div>
        )}

        {success && (
          <div className="prh-alert prh-alert-success" role="status">
            <span className="prh-alert-symbol">✓</span><span>{success}</span>
          </div>
        )}

        {actionError && !editingReferral && !deleteTarget && (
          <div className="prh-alert prh-alert-error" role="alert">
            <span className="prh-alert-symbol">!</span><span>{actionError}</span>
          </div>
        )}

        {actionSuccess && (
          <div className="prh-alert prh-alert-success" role="status">
            <span className="prh-alert-symbol">✓</span><span>{actionSuccess}</span>
          </div>
        )}

        <section className="prh-panel">
          <div className="prh-panel-heading">
            <div>
              <h3>Find referrals</h3>
              <p>Use the filters below to narrow down the records.</p>
            </div>
            <button type="button" className="prh-button" onClick={clearFilters} disabled={!hasActiveFilters}>
              ↺ Reset filters
            </button>
          </div>

          <div className="prh-filter-content">
            <div className="prh-filter-grid">
              <label className="prh-field">
                <span className="prh-label">REFERRAL DATE</span>
                <input
                  className="prh-control"
                  type="date"
                  value={selectedDate}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedDate(value);
                    setDateMode(value ? "date" : "all");
                  }}
                />
              </label>

              <label className="prh-field">
                <span className="prh-label">REFERRAL MONTH</span>
                <input
                  className="prh-control"
                  type="month"
                  value={selectedMonth}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedMonth(value);
                    setDateMode(value ? "month" : "all");
                  }}
                />
              </label>

              <label className="prh-field">
                <span className="prh-label">SEARCH RECORDS</span>
                <input
                  className="prh-control"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Patient, file number, physician..."
                />
              </label>

              <label className="prh-field">
                <span className="prh-label">REFERRED PHYSICIAN</span>
                <select className="prh-control" value={physicianFilter} onChange={(event) => setPhysicianFilter(event.target.value)}>
                  <option value="">All physicians</option>
                  {safePhysicians.map((physician) => physician?.id == null ? null : (
                    <option key={physician.id} value={physician.id}>{getPhysicianOptionName(physician)}</option>
                  ))}
                </select>
              </label>

              <label className="prh-field">
                <span className="prh-label">FIRST-VISIT STATUS</span>
                <select className="prh-control" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="all">All statuses</option>
                  <option value="awaiting">Awaiting</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
            </div>

            <div className="prh-filter-footer">
              <div className="prh-filter-summary">
                <span className="prh-count-pill">{filteredReferrals.length} matching records</span>
                {dateMode === "date" && selectedDate && <span>Date: {formatDate(selectedDate)}</span>}
                {dateMode === "month" && selectedMonth && <span>Month: {selectedMonth}</span>}
              </div>
              <button type="button" className="prh-button" onClick={clearFilters} disabled={!hasActiveFilters}>
                Clear all filters
              </button>
            </div>
          </div>
        </section>

        <section className="prh-panel">
          <div className="prh-table-heading">
            <div>
              <h3>Referral records</h3>
              <p>Review referral details and manage individual records.</p>
            </div>
            <span className="prh-count-pill">{filteredReferrals.length} records</span>
          </div>

          <div className="prh-table-wrap">
            <table className="prh-table">
              <thead>
                <tr>
                  <th>Referral date</th>
                  <th>Patient</th>
                  <th>File number</th>
                  <th>Referred physician</th>
                  <th>Referring physio</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && safeReferrals.length === 0 ? (
                  <tr><td colSpan={7} className="prh-empty">Loading referral records...</td></tr>
                ) : filteredReferrals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="prh-empty">
                      <div className="prh-empty-title">
                        {hasActiveFilters ? "No matching referrals" : "No referrals recorded yet"}
                      </div>
                      <div>
                        {hasActiveFilters
                          ? "Try changing your search criteria or clearing the filters."
                          : "Referral records will appear here when available."}
                      </div>
                    </td>
                  </tr>
                ) : filteredReferrals.map((referral, index) => {
                  const completed = hasFirstVisit(referral);
                  const isDeleting = deletingId === referral?.id;

                  return (
                    <tr key={referral?.id ?? index} style={{ background: index % 2 === 0 ? "#fff" : "#f7fafd" }}>
                      <td><span className="prh-date">{formatDate(getReferralDate(referral))}</span></td>
                      <td><div className="prh-patient">{getPatientName(referral)}</div></td>
                      <td>{getPatientFileNumber(referral) || "—"}</td>
                      <td><div className="prh-physician">{getPhysicianName(referral)}</div></td>
                      <td>{getReferringPhysioName(referral)}</td>
                      <td>
                        <span className={`prh-status ${completed ? "completed" : "awaiting"}`}>
                          <span className="prh-status-dot" />
                          {completed ? "Completed" : "Awaiting"}
                        </span>
                      </td>
                      <td>
                        <div className="prh-actions">
                          <button
                            type="button"
                            className="prh-button prh-button-edit"
                            onClick={() => openEditModal(referral)}
                            disabled={savingEdit || deletingId !== null}
                          >
                            ✎ Edit
                          </button>
                          <button
                            type="button"
                            className="prh-button prh-button-delete"
                            onClick={() => openDeleteModal(referral)}
                            disabled={deletingId !== null || savingEdit}
                          >
                            {isDeleting ? "Deleting..." : "⌫ Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <footer className="prh-table-footer">
            <span>Showing {filteredReferrals.length} of {safeReferrals.length} referrals</span>
            <span>Status reflects whether the first visit has been recorded.</span>
          </footer>
        </section>
      </div>

      {/* Custom delete confirmation modal */}
      {deleteTarget && (
        <div
          className="prh-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDeleteModal();
          }}
        >
          <section
            className="prh-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="prh-delete-title"
          >
            <header className="prh-modal-header">
              <div className="prh-modal-icon danger" aria-hidden="true">⌫</div>
              <div>
                <h2 id="prh-delete-title" className="prh-modal-title">Delete referral?</h2>
                <p className="prh-modal-description">
                  Please review this referral before confirming deletion.
                </p>
              </div>
            </header>

            <div className="prh-modal-body">
              {actionError && (
                <div className="prh-alert prh-alert-error" role="alert" style={{ marginBottom: 16 }}>
                  <span className="prh-alert-symbol">!</span><span>{actionError}</span>
                </div>
              )}

              <div className="prh-delete-summary">
                <div className="prh-delete-summary-icon" aria-hidden="true">!</div>
                <div>
                  <p className="prh-delete-patient">{getPatientName(deleteTarget)}</p>
                  <div className="prh-delete-meta">
                    Referral date: {formatDate(getReferralDate(deleteTarget))}
                    <br />
                    Physician: {getPhysicianName(deleteTarget)}
                    <br />
                    File number: {getPatientFileNumber(deleteTarget) || "—"}
                    <br />
                    Referral ID: {deleteTarget.id}
                  </div>
                </div>
              </div>

              <div className="prh-warning-note">
                <strong>Important:</strong> This action may permanently remove the referral
                record. It will not be removed from this screen unless the delete callback
                completes successfully.
              </div>
            </div>

            <footer className="prh-modal-footer">
              <button
                type="button"
                className="prh-button"
                onClick={closeDeleteModal}
                disabled={deletingId !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                className="prh-button prh-button-delete"
                onClick={handleConfirmDelete}
                disabled={deletingId !== null}
              >
                {deletingId !== null ? (
                  <><span className="prh-spinner" /> Deleting...</>
                ) : (
                  "⌫ Yes, delete referral"
                )}
              </button>
            </footer>
          </section>
        </div>
      )}

      {/* Edit referral modal */}
      {editingReferral && (
        <div
          className="prh-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditModal();
          }}
        >
          <section className="prh-modal" role="dialog" aria-modal="true" aria-labelledby="prh-edit-title">
            <header className="prh-modal-header">
              <div className="prh-modal-icon" aria-hidden="true">✎</div>
              <div>
                <h2 id="prh-edit-title" className="prh-modal-title">Edit referral</h2>
                <p className="prh-modal-description">Update the patient, physician, or referral reason.</p>
              </div>
            </header>

            <form onSubmit={handleSaveEdit}>
              <div className="prh-modal-body">
                {actionError && (
                  <div className="prh-alert prh-alert-error" role="alert" style={{ marginBottom: 17 }}>
                    <span className="prh-alert-symbol">!</span><span>{actionError}</span>
                  </div>
                )}

                <div className="prh-modal-fields">
                  <label className="prh-field">
                    <span className="prh-label">PATIENT</span>
                    <select
                      required
                      className="prh-control"
                      value={editForm.patient}
                      onChange={(event) => setEditForm((current) => ({ ...current, patient: event.target.value }))}
                    >
                      <option value="">Select patient</option>
                      {safePatients.map((patient) => patient?.id == null ? null : (
                        <option key={patient.id} value={patient.id}>{getPatientOptionName(patient)}</option>
                      ))}
                      {editForm.patient && !safePatients.some((patient) => String(patient?.id) === String(editForm.patient)) && (
                        <option value={editForm.patient}>{getPatientName(editingReferral)} (current)</option>
                      )}
                    </select>
                  </label>

                  <label className="prh-field">
                    <span className="prh-label">REFERRED PHYSICIAN</span>
                    <select
                      required
                      className="prh-control"
                      value={editForm.physician}
                      onChange={(event) => setEditForm((current) => ({ ...current, physician: event.target.value }))}
                    >
                      <option value="">Select physician</option>
                      {safePhysicians.map((physician) => physician?.id == null ? null : (
                        <option key={physician.id} value={physician.id}>{getPhysicianOptionName(physician)}</option>
                      ))}
                      {editForm.physician && !safePhysicians.some((physician) => String(physician?.id) === String(editForm.physician)) && (
                        <option value={editForm.physician}>{getPhysicianName(editingReferral)} (current)</option>
                      )}
                    </select>
                  </label>

                  <label className="prh-field prh-span-two">
                    <span className="prh-label">REFERRAL REASON</span>
                    <textarea
                      rows={4}
                      className="prh-control"
                      value={editForm.reason}
                      onChange={(event) => setEditForm((current) => ({ ...current, reason: event.target.value }))}
                      placeholder="Enter referral reason..."
                    />
                  </label>
                </div>
              </div>

              <footer className="prh-modal-footer">
                <button type="button" className="prh-button" onClick={closeEditModal} disabled={savingEdit}>
                  Cancel
                </button>
                <button type="submit" className="prh-button prh-button-primary" disabled={savingEdit}>
                  {savingEdit ? <><span className="prh-spinner" /> Saving...</> : "✓ Save changes"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

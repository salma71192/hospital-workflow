
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

// ============================================================
// CONFIGURATION
// ============================================================

const EMPTY_ARRAY = [];
const PAGE_SIZE = 25;

const SUMMARY_CARDS = [
  { key: "booked", label: "Total Booked", icon: "calendar", color: "blue" },
  { key: "confirmed", label: "Confirmed", icon: "check", color: "green" },
  { key: "unconfirmed", label: "Unconfirmed", icon: "clock", color: "orange" },
  { key: "rescheduled", label: "Rescheduled", icon: "refresh", color: "purple" },
  { key: "cancelled", label: "Cancelled", icon: "close", color: "red" },
];

// ============================================================
// HELPERS
// ============================================================

const clean = (value) => String(value ?? "").trim();

function normalizeText(value) {
  return clean(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeStatus(value) {
  return normalizeText(value).replace(/[\s-]+/g, "_");
}

function prettify(value) {
  return clean(value)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function firstLetter(value) {
  return clean(value).charAt(0).toUpperCase() || "?";
}

function getTherapistId(row) {
  const raw =
    row?.therapist_id ??
    row?.therapist ??
    row?.physiotherapist ??
    "";

  if (raw && typeof raw === "object") {
    return clean(raw.value ?? raw.id ?? raw.pk ?? "");
  }

  return clean(raw);
}

function getTherapistName(row, options = []) {
  const direct =
    row?.therapist_name ??
    row?.physiotherapist_name ??
    row?.therapist?.full_name ??
    row?.therapist?.name ??
    row?.physiotherapist?.name ??
    "";

  if (clean(direct)) return clean(direct);

  const id = getTherapistId(row);
  const match = options.find(
    (option) => clean(option.value) === id
  );

  return match?.label || id || "Not assigned";
}

function getDate(row) {
  return clean(
    row?.appointment_date ?? row?.date ?? ""
  ).slice(0, 10);
}

function getTime(row) {
  return clean(
    row?.time ?? row?.appointment_time ?? ""
  );
}

function getPatientId(row) {
  const raw =
    row?.patient_id ??
    row?.patient_pk ??
    row?.patient?.id ??
    row?.patient?.pk ??
    (typeof row?.patient === "string" ||
    typeof row?.patient === "number"
      ? row.patient
      : "");

  return clean(raw);
}

function getFileNumber(row) {
  return clean(
    row?.file_number ??
    row?.patient?.file_number ??
    row?.patient?.patient_id ??
    ""
  );
}

function getAppointmentType(row) {
  return clean(
    row?.appointment_type ?? row?.type ?? "followup"
  );
}

function appointmentKey(row, index) {
  return (
    row?.id ??
    row?.localId ??
    `${getDate(row)}-${getTime(row)}-${getFileNumber(row)}-${index}`
  );
}

// ============================================================
// DATE / TIME
// ============================================================

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
}

function validMonth(value) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value || "");
}

function formatDate(value) {
  if (!validDate(value)) return value || "Select date";

  const [year, month, day] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatMonth(value) {
  if (!validMonth(value)) return "Select month";

  const [year, month] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function timeMinutes(value) {
  const raw = clean(value);

  const match = raw.match(
    /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i
  );

  if (!match) return Number.MAX_SAFE_INTEGER;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3]?.toUpperCase();

  if (minute > 59) return Number.MAX_SAFE_INTEGER;

  if (period) {
    if (hour < 1 || hour > 12) {
      return Number.MAX_SAFE_INTEGER;
    }

    hour %= 12;
    if (period === "PM") hour += 12;
  } else if (hour > 23) {
    return Number.MAX_SAFE_INTEGER;
  }

  return hour * 60 + minute;
}

function formatTime(value) {
  const minutes = timeMinutes(value);

  if (minutes === Number.MAX_SAFE_INTEGER) {
    return clean(value) || "—";
  }

  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;

  return (
    `${hour % 12 || 12}:` +
    `${String(minute).padStart(2, "0")} ` +
    (hour >= 12 ? "PM" : "AM")
  );
}

function sortHistory(rows) {
  return [...rows].sort((a, b) => {
    const dateOrder = getDate(b).localeCompare(getDate(a));

    if (dateOrder !== 0) return dateOrder;

    return timeMinutes(getTime(a)) - timeMinutes(getTime(b));
  });
}

// ============================================================
// CLAIMS APPROVAL
// ============================================================

function readApprovalStatus(value) {
  if (value == null) return "";

  if (typeof value === "object") {
    return clean(
      value.approval_status ??
      value.claim_approval_status ??
      value.insurance_approval_status ??
      value.authorization_status ??
      value.rcm_approval_status ??
      value.status ??
      value.value ??
      ""
    );
  }

  return clean(value);
}

function isKnownApproval(value) {
  return Boolean(
    normalizeStatus(value) &&
    ![
      "unknown",
      "not_verified",
      "not_available",
      "none",
      "null",
    ].includes(normalizeStatus(value))
  );
}

function getApproval(row) {
  const candidates = [
    row?.claim_approval_status,
    row?.claims_approval_status,
    row?.insurance_approval_status,
    row?.authorization_status,
    row?.rcm_approval_status,
    row?.approval_status,
    row?.claim?.approval_status,
    row?.claim?.status,
    row?.claims?.approval_status,
    row?.claims?.status,
    row?.insurance_claim?.approval_status,
    row?.authorization?.status,
    row?.approval?.status,
  ];

  for (const candidate of candidates) {
    const value = readApprovalStatus(candidate);
    if (isKnownApproval(value)) return value;
  }

  return "unknown";
}

function getClaimAppointmentId(claim) {
  return clean(
    claim?.appointment_id ??
    claim?.appointment?.id ??
    claim?.schedule_appointment_id ??
    ""
  );
}

function resolveClaimsApproval(row, claimsApprovals = []) {
  const direct = getApproval(row);

  if (isKnownApproval(direct)) return direct;

  if (!Array.isArray(claimsApprovals)) return "unknown";

  const appointmentId = clean(row?.id);

  const exactMatches = appointmentId
    ? claimsApprovals.filter(
        (claim) =>
          getClaimAppointmentId(claim) === appointmentId
      )
    : [];

  if (exactMatches.length) {
    const statuses = [
      ...new Set(
        exactMatches
          .map(getApproval)
          .filter(isKnownApproval)
          .map(normalizeStatus)
      ),
    ];

    return statuses.length === 1 ? statuses[0] : "unknown";
  }

  const patientId = getPatientId(row);
  const fileNumber = getFileNumber(row);
  const date = getDate(row);

  if (!date || (!patientId && !fileNumber)) {
    return "unknown";
  }

  const matches = claimsApprovals.filter((claim) => {
    const linkedId = getClaimAppointmentId(claim);

    if (
      appointmentId &&
      linkedId &&
      linkedId !== appointmentId
    ) {
      return false;
    }

    const claimPatientId = clean(
      claim?.patient_id ?? claim?.patient?.id ?? ""
    );

    const claimFileNumber = clean(
      claim?.file_number ??
      claim?.patient?.file_number ??
      ""
    );

    const claimDate = clean(
      claim?.appointment_date ??
      claim?.visit_date ??
      claim?.service_date ??
      claim?.date ??
      ""
    ).slice(0, 10);

    const samePatient =
      (patientId && claimPatientId === patientId) ||
      (fileNumber && claimFileNumber === fileNumber);

    return Boolean(samePatient && claimDate === date);
  });

  return matches.length === 1
    ? getApproval(matches[0])
    : "unknown";
}

// ============================================================
// ICONS
// ============================================================

function Icon({ name, size = 17 }) {
  const paths = {
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4M17 3v4M3 10h18" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M5 9a8 8 0 0 1 13-2l2 5" />
      </>
    ),
    close: <path d="M6 6l12 12M18 6 6 18" />,
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a6 6 0 0 1 12 0v2" />
        <path d="M17 5a3 3 0 0 1 0 6" />
        <path d="M18 14a5 5 0 0 1 3 5v1" />
      </>
    ),
    filter: (
      <>
        <path d="M4 7h16M7 12h10M10 17h4" />
      </>
    ),
    folder: (
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10H3z" />
    ),
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5M12 7v5l4 2" />
      </>
    ),
    more: (
      <>
        <circle cx="5" cy="12" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="19" cy="12" r="1.5" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </>
    ),
    shield: (
      <>
        <path d="M12 2 20 6v6c0 5-3 8-8 10-5-2-8-5-8-10V6z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    layout: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 9v11M14 9v11" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.info}
    </svg>
  );
}

// ============================================================
// BADGES
// ============================================================

function SummaryCard({ card, count, active, onClick }) {
  return (
    <button
      type="button"
      className={`sh-mini-card sh-mini-${card.color} ${
        active ? "sh-mini-active" : ""
      }`}
      aria-pressed={active}
      onClick={onClick}
    >
      <span className="sh-mini-icon">
        <Icon name={card.icon} size={21} />
      </span>

      <span className="sh-mini-content">
        <span className="sh-mini-label">{card.label}</span>
        <strong className="sh-mini-count">{count}</strong>
      </span>
    </button>
  );
}

function ConfirmationBadge({ status }) {
  const normalized = normalizeStatus(status);

  const safeStatus = [
    "confirmed",
    "unconfirmed",
    "rescheduled",
    "cancelled",
    "no_answer",
    "phone_off",
  ].includes(normalized)
    ? normalized
    : "other";

  const icon =
    normalized === "confirmed"
      ? "check"
      : normalized === "rescheduled"
      ? "refresh"
      : normalized === "cancelled"
      ? "close"
      : "clock";

  return (
    <span className={`sh-confirmation sh-confirmation-${safeStatus}`}>
      <Icon name={icon} size={14} />
      {prettify(status || "Unconfirmed")}
    </span>
  );
}

function AppointmentTypeBadge({ type }) {
  const normalized = normalizeStatus(type);

  const evaluation = [
    "evaluation",
    "eval",
    "initial_evaluation",
    "assessment",
  ].includes(normalized);

  return (
    <span
      className={`sh-appointment-type ${
        evaluation ? "evaluation" : "followup"
      }`}
    >
      {evaluation
        ? "Evaluation"
        : ["followup", "follow_up", ""].includes(normalized)
        ? "Follow-up"
        : prettify(type)}
    </span>
  );
}

function ClaimsApprovalBadge({ row, claimsApprovals }) {
  const status = normalizeStatus(
    resolveClaimsApproval(row, claimsApprovals)
  );

  let appearance = "unknown";
  let label = "Not Verified";

  if (
    ["approved", "active", "authorized", "authorised"].includes(status)
  ) {
    appearance = "approved";
    label = "Approved";
  } else if (
    ["pending", "submitted", "in_review", "under_review"].includes(status)
  ) {
    appearance = "pending";
    label = prettify(status);
  } else if (
    ["rejected", "denied", "declined"].includes(status)
  ) {
    appearance = "rejected";
    label = prettify(status);
  } else if (isKnownApproval(status)) {
    label = prettify(status);
  }

  return (
    <span className={`sh-approval sh-approval-${appearance}`}>
      <span className="sh-approval-dot" />
      {label}
    </span>
  );
}

// ============================================================
// THREE-DOT MENU
// ============================================================

function AppointmentActions({
  row,
  onViewHistory,
  onOpenFile,
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
  });

  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const calculatePosition = useCallback(() => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();

    const menuWidth = 210;
    const menuHeight = 110;

    const left = Math.max(
      8,
      Math.min(
        rect.right - menuWidth,
        window.innerWidth - menuWidth - 8
      )
    );

    const top =
      window.innerHeight - rect.bottom >= menuHeight + 10
        ? rect.bottom + 6
        : Math.max(8, rect.top - menuHeight - 6);

    setPosition({ top, left });
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const closeOutside = (event) => {
      if (
        buttonRef.current?.contains(event.target) ||
        menuRef.current?.contains(event.target)
      ) {
        return;
      }

      setOpen(false);
    };

    const closeEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    const closeScroll = () => setOpen(false);

    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    window.addEventListener("scroll", closeScroll, true);
    window.addEventListener("resize", calculatePosition);

    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
      window.removeEventListener("scroll", closeScroll, true);
      window.removeEventListener("resize", calculatePosition);
    };
  }, [open, calculatePosition]);

  const canOpenFile =
    typeof onOpenFile === "function" &&
    Boolean(getPatientId(row));

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`sh-more-button ${open ? "active" : ""}`}
        aria-label={`Actions for ${row.patient_name || "patient"}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          if (!open) calculatePosition();
          setOpen((previous) => !previous);
        }}
      >
        <Icon name="more" size={19} />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="sh-portal-menu"
            role="menu"
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              width: 210,
              zIndex: 100000,
            }}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onViewHistory?.(row);
              }}
            >
              <Icon name="history" size={16} />
              View History
            </button>

            <button
              type="button"
              role="menuitem"
              disabled={!canOpenFile}
              onClick={() => {
                setOpen(false);
                onOpenFile?.(row);
              }}
            >
              <Icon name="folder" size={16} />
              Open Patient File
            </button>
          </div>,
          document.body
        )}
    </>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ScheduleHistory({
  historyAppointments,
  filteredHistory = EMPTY_ARRAY,

  historyMode = "day",
  onHistoryModeChange = () => {},

  historyDate = "",
  onHistoryDateChange = () => {},

  historyMonth = "",
  onHistoryMonthChange = () => {},

  historyTherapist = "all",
  setHistoryTherapist = () => {},

  therapistOptions = EMPTY_ARRAY,

  historyFilter = "all",
  setHistoryFilter = () => {},

  historyQuery = "",
  setHistoryQuery = () => {},

  loadingHistory = false,
  loadHistory = () => {},

  openDetails = () => {},
  onOpenFile,
  onOpenPatientFile,

  claimsApprovals = EMPTY_ARRAY,
}) {
  const [physioSearch, setPhysioSearch] = useState("");
  const [physioOpen, setPhysioOpen] = useState(false);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const physioRef = useRef(null);

  const source = Array.isArray(historyAppointments)
    ? historyAppointments
    : filteredHistory;

  const selectedMonth =
    historyMonth || historyDate.slice(0, 7);

  const openPatientFile = onOpenFile || onOpenPatientFile;

  // ==========================================================
  // THERAPISTS
  // ==========================================================

  const allTherapists = useMemo(() => {
    const map = new Map();

    therapistOptions.forEach((item) => {
      const id = clean(item.value);
      const label = clean(item.label);

      if (id && label) {
        map.set(id, { value: id, label });
      }
    });

    source.forEach((row) => {
      const id = getTherapistId(row);
      const label = getTherapistName(row, therapistOptions);

      if (id && label !== "Not assigned" && !map.has(id)) {
        map.set(id, { value: id, label });
      }
    });

    return [...map.values()].sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [source, therapistOptions]);

  const selectedPhysio = allTherapists.find(
    (item) => item.value === String(historyTherapist)
  );

  const matchingTherapists = useMemo(() => {
    const query = normalizeText(physioSearch);

    return allTherapists.filter(
      (item) =>
        !query || normalizeText(item.label).includes(query)
    );
  }, [allTherapists, physioSearch]);

  useEffect(() => {
    if (!physioOpen) return undefined;

    const closeOutside = (event) => {
      if (
        physioRef.current &&
        !physioRef.current.contains(event.target)
      ) {
        setPhysioOpen(false);
      }
    };

    const closeEscape = (event) => {
      if (event.key === "Escape") setPhysioOpen(false);
    };

    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, [physioOpen]);

  // ==========================================================
  // FILTER
  // ==========================================================

  const baseRows = useMemo(() => {
    const patientSearch = normalizeText(historyQuery);
    const therapistSearch = normalizeText(physioSearch);

    return source.filter((row) => {
      const rowDate = getDate(row);

      const matchesDate =
        historyMode === "month"
          ? validMonth(selectedMonth) &&
            rowDate.startsWith(selectedMonth)
          : validDate(historyDate) &&
            rowDate === historyDate;

      const matchesPatient =
        !patientSearch ||
        normalizeText(row.patient_name).includes(patientSearch) ||
        normalizeText(getFileNumber(row)).includes(patientSearch);

      const rowTherapistName = normalizeText(
        getTherapistName(row, therapistOptions)
      );

      let matchesTherapist = true;

      if (historyTherapist !== "all") {
        matchesTherapist =
          getTherapistId(row) === String(historyTherapist) ||
          Boolean(
            selectedPhysio?.label &&
            rowTherapistName === normalizeText(selectedPhysio.label)
          );
      } else if (therapistSearch) {
        matchesTherapist =
          rowTherapistName.includes(therapistSearch);
      }

      return (
        matchesDate &&
        matchesPatient &&
        matchesTherapist
      );
    });
  }, [
    source,
    historyMode,
    historyDate,
    selectedMonth,
    historyQuery,
    historyTherapist,
    physioSearch,
    therapistOptions,
    selectedPhysio,
  ]);

  // ==========================================================
  // SUMMARY
  // ==========================================================

  const summary = useMemo(() => {
    const count = (status) =>
      baseRows.filter(
        (row) =>
          normalizeStatus(row.confirmation_status) === status
      ).length;

    return {
      booked: baseRows.filter(
        (row) =>
          normalizeStatus(row.confirmation_status) !== "cancelled"
      ).length,
      confirmed: count("confirmed"),
      unconfirmed: count("unconfirmed"),
      rescheduled: count("rescheduled"),
      cancelled: count("cancelled"),
    };
  }, [baseRows]);

  const visibleRows = useMemo(() => {
    return sortHistory(
      baseRows.filter((row) => {
        const status = normalizeStatus(row.confirmation_status);

        if (historyFilter === "all") return true;
        if (historyFilter === "booked") {
          return status !== "cancelled";
        }

        return status === normalizeStatus(historyFilter);
      })
    );
  }, [baseRows, historyFilter]);

  useEffect(() => {
    setPageSize(PAGE_SIZE);
  }, [
    historyMode,
    historyDate,
    historyMonth,
    historyTherapist,
    physioSearch,
    historyQuery,
    historyFilter,
  ]);

  const displayedRows = visibleRows.slice(0, pageSize);

  const selectPhysio = (item) => {
    setHistoryTherapist(item.value);
    setPhysioSearch("");
    setPhysioOpen(false);
  };

  const clearFilters = () => {
    setHistoryTherapist("all");
    setPhysioSearch("");
    setHistoryQuery("");
    setHistoryFilter("all");
    setPhysioOpen(false);
  };

  const hasActiveFilters =
    historyTherapist !== "all" ||
    Boolean(physioSearch) ||
    Boolean(historyQuery) ||
    historyFilter !== "all";

  const selectedCard = SUMMARY_CARDS.find(
    (card) => card.key === historyFilter
  );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="sh-root">
      <style>{styles}</style>

      {/* FILTER PANEL */}

      <section className="sh-filter-panel">
        <div className="sh-filter-header">
          <div className="sh-filter-title">
            <span className="sh-filter-icon">
              <Icon name="filter" size={20} />
            </span>

            <div>
              <h3>Schedule History</h3>
              <p>
                Search saved appointments by day,
                month or physiotherapist
              </p>
            </div>
          </div>

          <button
            type="button"
            className="sh-refresh-button"
            disabled={loadingHistory}
            onClick={() => loadHistory()}
          >
            <Icon name="refresh" size={15} />
            {loadingHistory ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="sh-filter-body">
          <div className="sh-period-row">
            <span className="sh-period-label">
              VIEW SCHEDULE BY
            </span>

            <div className="sh-segmented">
              <button
                type="button"
                className={historyMode === "day" ? "active" : ""}
                onClick={() => onHistoryModeChange("day")}
                aria-pressed={historyMode === "day"}
              >
                <Icon name="calendar" size={14} />
                Day
              </button>

              <button
                type="button"
                className={historyMode === "month" ? "active" : ""}
                onClick={() => onHistoryModeChange("month")}
                aria-pressed={historyMode === "month"}
              >
                <Icon name="calendar" size={14} />
                Month
              </button>
            </div>
          </div>

          <div className="sh-filter-grid">
            {/* CENTERED DATE FIELD */}

            <div className="sh-field sh-date-field">
              <label htmlFor="sh-history-date">
                <Icon name="calendar" size={15} />
                {historyMode === "month"
                  ? "Select Month"
                  : "Select Day"}
              </label>

              <div className="sh-date-display">
                <span className="sh-date-centered-text">
                  {historyMode === "month"
                    ? formatMonth(selectedMonth)
                    : formatDate(historyDate)}
                </span>

                <input
                  key={historyMode}
                  id="sh-history-date"
                  type={
                    historyMode === "month"
                      ? "month"
                      : "date"
                  }
                  value={
                    historyMode === "month"
                      ? selectedMonth
                      : historyDate
                  }
                  aria-label={
                    historyMode === "month"
                      ? "Choose month"
                      : "Choose date"
                  }
                  onChange={(event) => {
                    if (historyMode === "month") {
                      onHistoryMonthChange(event.target.value);
                    } else {
                      onHistoryDateChange(event.target.value);
                    }
                  }}
                />
              </div>
            </div>

            {/* PHYSIOTHERAPIST */}

            <div className="sh-field sh-physio-field" ref={physioRef}>
              <label htmlFor="sh-physio">
                <Icon name="users" size={15} />
                Physiotherapist
              </label>

              <div className="sh-search-wrap">
                <Icon name="search" size={16} />

                <input
                  id="sh-physio"
                  className="sh-control"
                  type="search"
                  autoComplete="off"
                  placeholder="All physiotherapists — type a name"
                  value={
                    physioOpen
                      ? physioSearch
                      : selectedPhysio?.label || physioSearch
                  }
                  onFocus={() => {
                    setPhysioSearch("");
                    setPhysioOpen(true);
                  }}
                  onChange={(event) => {
                    setPhysioSearch(event.target.value);
                    setHistoryTherapist("all");
                    setPhysioOpen(true);
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      matchingTherapists.length === 1
                    ) {
                      event.preventDefault();
                      selectPhysio(matchingTherapists[0]);
                    }
                  }}
                />

                {(historyTherapist !== "all" || physioSearch) && (
                  <button
                    type="button"
                    className="sh-input-clear"
                    onClick={() => selectPhysio({ value: "all" })}
                    aria-label="Clear physiotherapist"
                  >
                    <Icon name="close" size={14} />
                  </button>
                )}
              </div>

              {physioOpen && (
                <div className="sh-physio-dropdown">
                  <button
                    type="button"
                    className="sh-physio-option sh-all-option"
                    onClick={() => selectPhysio({ value: "all" })}
                  >
                    <Icon name="users" size={16} />
                    All Physiotherapists
                  </button>

                  {matchingTherapists.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className="sh-physio-option"
                      onClick={() => selectPhysio(item)}
                    >
                      <span className="sh-avatar-small">
                        {firstLetter(item.label)}
                      </span>
                      <span>{item.label}</span>
                    </button>
                  ))}

                  {matchingTherapists.length === 0 && (
                    <div className="sh-no-results">
                      No matching physiotherapists
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* PATIENT SEARCH */}

            <div className="sh-field sh-patient-field">
              <label htmlFor="sh-patient-search">
                <Icon name="search" size={15} />
                Patient / File Number
              </label>

              <div className="sh-search-wrap">
                <Icon name="search" size={16} />

                <input
                  id="sh-patient-search"
                  className="sh-control"
                  type="search"
                  placeholder="Search patient or file number"
                  value={historyQuery}
                  onChange={(event) =>
                    setHistoryQuery(event.target.value)
                  }
                />

                {historyQuery && (
                  <button
                    type="button"
                    className="sh-input-clear"
                    onClick={() => setHistoryQuery("")}
                    aria-label="Clear patient search"
                  >
                    <Icon name="close" size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="sh-filter-footer">
            <span className="sh-filter-information">
              <Icon name="info" size={15} />
              {historyMode === "month"
                ? "Showing appointments for the selected month."
                : "Showing appointments for the selected day."}
              {" "}All physiotherapists are included unless filtered.
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                className="sh-clear-button"
                onClick={clearFilters}
              >
                <Icon name="close" size={14} />
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* APPOINTMENT PANEL */}

      <section className="sh-appointments-panel">
        <div className="sh-appointments-header">
          <div className="sh-appointments-heading">
            <span className="sh-appointments-icon">
              <Icon name="layout" size={23} />
            </span>

            <div>
              <h2>Therapist Appointments</h2>
              <p>
                Review appointments, confirmations,
                approvals and patient records
              </p>
            </div>
          </div>

          <span className="sh-total-pill">
            <span className="sh-live-dot" />
            {baseRows.length} Appointments
          </span>
        </div>

        {/* SUMMARY CARDS */}

        <div className="sh-summary-strip">
          {SUMMARY_CARDS.map((card) => (
            <SummaryCard
              key={card.key}
              card={card}
              count={summary[card.key]}
              active={historyFilter === card.key}
              onClick={() =>
                setHistoryFilter(
                  historyFilter === card.key
                    ? "all"
                    : card.key
                )
              }
            />
          ))}
        </div>

        {/* TABLE TITLE */}

        <div className="sh-schedule-heading">
          <div>
            <h3>Appointment Schedule</h3>
            <p>
              {historyMode === "month"
                ? "Latest dates first · Earliest times first"
                : "Earliest appointments first"}
            </p>
          </div>

          <div className="sh-schedule-toolbar">
            <span className="sh-time-indicator">
              <Icon name="clock" size={14} />
              {historyMode === "month"
                ? "Date: Latest First"
                : "Time: Earliest First"}
            </span>

            {selectedCard && (
              <button
                type="button"
                className="sh-selected-filter"
                onClick={() => setHistoryFilter("all")}
              >
                {selectedCard.label}
                <Icon name="close" size={13} />
              </button>
            )}
          </div>
        </div>

        {/* TABLE */}

        <div className="sh-table-scroll">
          <table className="sh-table">
            {/* FIXED COLUMNS THAT FIT THE AVAILABLE WIDTH */}
            <colgroup>
              <col style={{ width: "12%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "4%" }} />
            </colgroup>

            <thead>
              <tr>
                <th>APPOINTMENT DATE</th>
                <th>APPOINTMENT TIME</th>
                <th>PATIENT DETAILS</th>
                <th>THERAPIST</th>
                <th>CONFIRMATION STATUS</th>
                <th>TYPE</th>
                <th>CLAIMS APPROVAL</th>
                <th className="sh-action-column">ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {loadingHistory ? (
                <tr>
                  <td colSpan={8} className="sh-empty-cell">
                    Loading appointment history...
                  </td>
                </tr>
              ) : displayedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="sh-empty-cell">
                    No appointments found.
                  </td>
                </tr>
              ) : (
                displayedRows.map((row, index) => {
                  const therapistName = getTherapistName(
                    row,
                    therapistOptions
                  );

                  return (
                    <tr key={appointmentKey(row, index)}>
                      <td>
                        <div className="sh-date-cell">
                          <span className="sh-row-number">
                            {String(index + 1).padStart(2, "0")}
                          </span>

                          <strong className="sh-date-value">
                            {formatDate(getDate(row))}
                          </strong>
                        </div>
                      </td>

                      <td>
                        <span className="sh-time-badge">
                          <Icon name="clock" size={13} />
                          {formatTime(getTime(row))}
                        </span>
                      </td>

                      <td>
                        <div className="sh-patient-details">
                          <strong className="sh-patient-name">
                            {row.patient_name || "Unknown Patient"}
                          </strong>

                          <span className="sh-patient-file">
                            File No.{" "}
                            <b>{getFileNumber(row) || "—"}</b>
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="sh-therapist-details">
                          <span className="sh-therapist-avatar">
                            {firstLetter(therapistName)}
                          </span>

                          <span className="sh-therapist-name">
                            {therapistName}
                          </span>
                        </div>
                      </td>

                      <td>
                        <ConfirmationBadge
                          status={row.confirmation_status}
                        />
                      </td>

                      <td>
                        <AppointmentTypeBadge
                          type={getAppointmentType(row)}
                        />
                      </td>

                      <td>
                        <ClaimsApprovalBadge
                          row={row}
                          claimsApprovals={claimsApprovals}
                        />
                      </td>

                      <td className="sh-action-cell">
                        <AppointmentActions
                          row={row}
                          onViewHistory={openDetails}
                          onOpenFile={openPatientFile}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}

        <div className="sh-table-footer">
          <div>
            <strong>{visibleRows.length} appointment(s)</strong>
            <span>
              Showing {displayedRows.length} of {visibleRows.length}
            </span>
          </div>

          <div className="sh-footer-right">
            {displayedRows.length < visibleRows.length && (
              <button
                type="button"
                className="sh-show-more"
                onClick={() =>
                  setPageSize((previous) => previous + PAGE_SIZE)
                }
              >
                Show 25 More
              </button>
            )}

            <span className="sh-readonly-label">
              <Icon name="shield" size={14} />
              Read-only History
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================================
// COMPLETE STYLES
// ============================================================

const styles = `

.sh-root {
  --sh-navy: #172d58;
  --sh-blue: #2967db;
  width: 100%;
  min-width: 0;
  color: var(--sh-navy);
  font-family: Inter, system-ui, -apple-system,
    BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.sh-root * {
  box-sizing: border-box;
}

.sh-root button {
  cursor: pointer;
  font-family: inherit;
}

.sh-root button:disabled {
  opacity: .5;
  cursor: not-allowed;
}

/* FILTER PANEL */

.sh-filter-panel {
  position: relative;
  margin-bottom: 22px;
  background: white;
  border: 1px solid #e1e8f3;
  border-radius: 17px;
  box-shadow: 0 6px 24px rgba(23,48,88,.045);
}

.sh-filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  padding: 18px 23px;
  background: linear-gradient(105deg,#f0f5ff,#fff);
  border-bottom: 1px solid #e8edf7;
  border-radius: 17px 17px 0 0;
}

.sh-filter-title {
  display: flex;
  align-items: center;
  gap: 13px;
  min-width: 0;
}

.sh-filter-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  color: white;
  background: linear-gradient(135deg,#2867dc,#468af3);
  flex-shrink: 0;
}

.sh-filter-title h3 {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 850;
}

.sh-filter-title p {
  margin: 0;
  color: #8291a8;
  font-size: 11px;
}

.sh-refresh-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  color: #245ac1;
  background: white;
  border: 1px solid #cbdcf8;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 850;
}

.sh-filter-body {
  padding: 19px 23px 18px;
}

.sh-period-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 17px;
}

.sh-period-label {
  font-size: 10px;
  font-weight: 850;
  letter-spacing: .7px;
  color: #8190a7;
}

.sh-segmented {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  background: #f1f5fb;
  border: 1px solid #e2e9f4;
  border-radius: 10px;
}

.sh-segmented button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 15px;
  min-width: 88px;
  justify-content: center;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: #7788a0;
  font-size: 11px;
  font-weight: 850;
}

.sh-segmented button.active {
  color: #2457c8;
  background: white;
  box-shadow: 0 2px 7px rgba(24,50,90,.1);
}

/* FILTER GRID */

.sh-filter-grid {
  display: grid;
  grid-template-columns: 195px minmax(0,1fr) minmax(0,1fr);
  gap: 15px;
  align-items: end;
}

.sh-field {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.sh-field label {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #405577;
  font-size: 11px;
  font-weight: 850;
}

.sh-field label svg {
  color: #3973d7;
}

/* CENTERED DATE FIELD */

.sh-date-field {
  width: 195px;
}

.sh-date-display {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 195px;
  height: 40px;
  border: 1.5px solid #dbe5f3;
  border-radius: 9px;
  background: white;
  overflow: hidden;
}

.sh-date-display:focus-within {
  border-color: #3975df;
  box-shadow: 0 0 0 3px rgba(37,99,235,.09);
}

.sh-date-centered-text {
  display: block;
  width: 100%;
  padding: 0 9px;
  color: #29415f;
  font-size: 12px;
  font-weight: 750;
  text-align: center;
  white-space: nowrap;
  pointer-events: none;
}

.sh-date-display input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  opacity: 0;
  cursor: pointer;
  font-size: 16px;
  color-scheme: light;
}

/* SEARCH INPUTS */

.sh-search-wrap {
  position: relative;
  width: 100%;
}

.sh-search-wrap > svg {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #819cc5;
  pointer-events: none;
}

.sh-root .sh-search-wrap input {
  display: block;
  width: 100%;
  min-width: 0;
  height: 40px;
  margin: 0;
  padding: 0 36px 0 38px;
  background: white;
  color: #29415f;
  border: 1.5px solid #dbe5f3;
  border-radius: 9px;
  font-family: inherit;
  font-size: 12px;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.sh-root .sh-search-wrap input:focus {
  border-color: #3975df;
  box-shadow: 0 0 0 3px rgba(37,99,235,.09);
}

.sh-search-wrap input::placeholder {
  color: #a1acbd;
}

.sh-input-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 7px;
  background: #edf2f9;
  color: #657b98;
}

.sh-physio-field {
  z-index: 35;
}

.sh-physio-dropdown {
  position: absolute;
  z-index: 100;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  max-height: 250px;
  overflow-y: auto;
  padding: 6px;
  background: white;
  border: 1px solid #dce5f2;
  border-radius: 11px;
  box-shadow: 0 12px 30px rgba(20,46,90,.16);
}

.sh-physio-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 42px;
  padding: 9px 10px;
  border: none;
  border-radius: 8px;
  background: white;
  color: #344b6c;
  font-size: 12px;
  text-align: left;
}

.sh-physio-option:hover {
  background: #edf4ff;
}

.sh-all-option {
  color: #2457c8;
  font-weight: 850;
}

.sh-avatar-small {
  display: grid;
  place-items: center;
  width: 29px;
  height: 29px;
  border-radius: 8px;
  background: #edf3ff;
  color: #3267c9;
  font-weight: 850;
}

.sh-no-results {
  padding: 14px;
  font-size: 12px;
  color: #8290a6;
}

.sh-filter-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 17px;
  padding-top: 13px;
  border-top: 1px solid #edf1f8;
}

.sh-filter-information {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #8391a7;
  font-size: 11px;
}

.sh-clear-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 9px;
  border: none;
  background: transparent;
  color: #2457bf;
  font-size: 11px;
  font-weight: 850;
}

/* MAIN PANEL */

.sh-appointments-panel {
  width: calc(100% + 30px);
  max-width: none;
  margin-left: -15px;
  margin-right: -15px;
  margin-bottom: 20px;
  min-width: 0;
  overflow: hidden;
  background: white;
  border: 1px solid #e0e8f3;
  border-radius: 19px;
  box-shadow: 0 8px 30px rgba(24,52,98,.065);
}

.sh-appointments-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  padding: 25px 28px;
  color: white;
  background: linear-gradient(
    112deg,
    #16336e 0%,
    #2450a6 52%,
    #3679e8 100%
  );
}

.sh-appointments-heading {
  display: flex;
  align-items: center;
  gap: 15px;
  min-width: 0;
}

.sh-appointments-icon {
  display: grid;
  place-items: center;
  width: 49px;
  height: 49px;
  flex-shrink: 0;
  border-radius: 13px;
  background: rgba(255,255,255,.15);
}

.sh-appointments-heading h2 {
  margin: 0 0 6px;
  color: white;
  font-size: 22px;
  font-weight: 900;
}

.sh-appointments-heading p {
  margin: 0;
  color: #dce8ff;
  font-size: 12px;
}

.sh-total-pill {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 9px 14px;
  border: 1px solid rgba(255,255,255,.24);
  border-radius: 999px;
  background: rgba(255,255,255,.13);
  color: white;
  font-size: 12px;
  font-weight: 850;
}

.sh-live-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #44e5a2;
}

/* SUMMARY CARDS */

.sh-summary-strip {
  display: grid;
  grid-template-columns: repeat(5,minmax(0,1fr));
  gap: 12px;
  padding: 23px 25px;
  background: #f7f9ff;
  border-bottom: 1px solid #e9eef7;
}

.sh-mini-card {
  --mini-color: #2866da;
  --mini-bg: #e9f0ff;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  min-height: 83px;
  padding: 12px;
  background: white;
  border: 1.5px solid #e3eaf5;
  border-radius: 15px;
  text-align: left;
}

.sh-mini-active,
.sh-mini-card:hover {
  border-color: var(--mini-color);
}

.sh-mini-active {
  background: var(--mini-bg);
}

.sh-mini-blue {
  --mini-color: #2866da;
  --mini-bg: #eaf1ff;
}

.sh-mini-green {
  --mini-color: #13a578;
  --mini-bg: #e8faf1;
}

.sh-mini-orange {
  --mini-color: #d58a19;
  --mini-bg: #fff4dc;
}

.sh-mini-purple {
  --mini-color: #8b42cf;
  --mini-bg: #f1e9ff;
}

.sh-mini-red {
  --mini-color: #d93c60;
  --mini-bg: #ffedf1;
}

.sh-mini-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 11px;
  background: var(--mini-bg);
  color: var(--mini-color);
}

.sh-mini-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.sh-mini-label {
  color: #75839b;
  font-size: 11px;
  font-weight: 800;
}

.sh-mini-count {
  color: #1c3458;
  font-size: 24px;
  font-weight: 900;
}

/* TABLE HEADING */

.sh-schedule-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 20px 26px 16px;
}

.sh-schedule-heading h3 {
  margin: 0 0 5px;
  color: #1e304d;
  font-size: 17px;
  font-weight: 900;
}

.sh-schedule-heading p {
  margin: 0;
  color: #94a0b3;
  font-size: 11px;
}

.sh-schedule-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 9px;
}

.sh-time-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 12px;
  border-radius: 8px;
  background: #eaf1ff;
  color: #245ac0;
  font-size: 11px;
  font-weight: 850;
}

.sh-selected-filter {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 11px;
  border: 1px solid #cbdcf8;
  border-radius: 8px;
  background: white;
  color: #245ac0;
  font-size: 11px;
  font-weight: 850;
}

/* TABLE - NO FORCED 1190PX WIDTH */

.sh-table-scroll {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.sh-table {
  width: 100%;
  min-width: 0;
  table-layout: fixed;
  border-collapse: collapse;
}

.sh-table thead th {
  padding: 15px 8px;
  background: #edf2fc;
  border-bottom: 2px solid #dae5f4;
  color: #415473;
  font-size: 9px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: .35px;
  text-align: left;
  white-space: normal;
  overflow-wrap: normal;
  line-height: 1.45;
}

.sh-table tbody td {
  padding: 15px 8px;
  background: white;
  border-bottom: 1px solid #e8edf5;
  color: #3d5070;
  font-size: 11px;
  vertical-align: middle;
  min-width: 0;
}

.sh-table tbody tr:nth-child(even) td {
  background: #f7f9fd;
}

.sh-table tbody tr:hover td {
  background: #eef5ff;
}

.sh-table tbody tr:last-child td {
  border-bottom: none;
}

/* DATE */

.sh-date-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.sh-row-number {
  display: inline-grid;
  place-items: center;
  min-width: 25px;
  height: 25px;
  padding: 0 4px;
  background: #e8f0ff;
  color: #245ec4;
  border-radius: 7px;
  font-size: 10px;
  font-weight: 900;
  flex-shrink: 0;
}

.sh-date-value {
  color: #4b5e79;
  font-size: 10px;
  font-weight: 750;
  line-height: 1.4;
}

/* TIME */

.sh-time-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 38px;
  padding: 7px 8px;
  max-width: 100%;
  border: 1.5px solid #a9c6f6;
  border-radius: 10px;
  background: #eef3ff;
  color: #2454ac;
  font-size: 11px;
  font-weight: 900;
  white-space: nowrap;
}

/* PATIENT */

.sh-patient-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.sh-patient-name {
  color: #1c2d4d;
  font-size: 11px;
  font-weight: 900;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.sh-patient-file {
  color: #8c9aaf;
  font-size: 10px;
  overflow-wrap: anywhere;
}

.sh-patient-file b {
  color: #3767bd;
  font-weight: 850;
}

/* THERAPIST */

.sh-therapist-details {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.sh-therapist-avatar {
  display: grid;
  place-items: center;
  width: 31px;
  height: 31px;
  flex-shrink: 0;
  border-radius: 9px;
  background: #eae4ff;
  color: #6b4cc7;
  font-size: 12px;
  font-weight: 900;
}

.sh-therapist-name {
  color: #3e4e6b;
  font-size: 11px;
  font-weight: 750;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

/* STATUS */

.sh-confirmation {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 36px;
  max-width: 100%;
  padding: 7px 8px;
  border-radius: 9px;
  border: 1px solid transparent;
  font-size: 10px;
  font-weight: 850;
  white-space: nowrap;
}

.sh-confirmation-confirmed {
  background: #ddf9eb;
  color: #15835d;
  border-color: #a8ebcf;
}

.sh-confirmation-unconfirmed {
  background: #fff0d5;
  color: #a76516;
  border-color: #f4d89d;
}

.sh-confirmation-rescheduled {
  background: #efe5ff;
  color: #713bbd;
  border-color: #d8c3fa;
}

.sh-confirmation-cancelled {
  background: #ffe5eb;
  color: #c33555;
  border-color: #fac9d3;
}

.sh-confirmation-no_answer,
.sh-confirmation-phone_off {
  background: #edf1f7;
  color: #53657d;
  border-color: #dce4ef;
}

.sh-confirmation-other {
  background: #eaf1ff;
  color: #3866b2;
}

/* APPOINTMENT TYPE */

.sh-appointment-type {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  padding: 7px 8px;
  border-radius: 7px;
  font-size: 10px;
  font-weight: 850;
  white-space: nowrap;
}

.sh-appointment-type.followup {
  background: #e2f3ff;
  color: #18648e;
}

.sh-appointment-type.evaluation {
  background: #fff0dc;
  color: #a34e13;
  border: 1px solid #f2bb7f;
}

/* CLAIMS APPROVAL */

.sh-approval {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  max-width: 100%;
  min-height: 30px;
  padding: 7px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 850;
  white-space: nowrap;
}

.sh-approval-dot {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 50%;
  background: currentColor;
}

.sh-approval-approved {
  background: #dff9ed;
  color: #14815d;
}

.sh-approval-pending {
  background: #fff0d4;
  color: #a26a16;
}

.sh-approval-rejected {
  background: #ffe5e8;
  color: #c33450;
}

.sh-approval-unknown {
  background: #edf1f7;
  color: #748399;
}

/* ACTIONS */

.sh-action-column,
.sh-action-cell {
  text-align: center !important;
}

.sh-more-button {
  display: inline-grid;
  place-items: center;
  width: 35px;
  height: 35px;
  padding: 0;
  border: 1px solid #cbd9eb;
  border-radius: 9px;
  background: white;
  color: #4c6c9e;
}

.sh-more-button:hover,
.sh-more-button.active {
  background: #eaf2ff;
  color: #245ac0;
  border-color: #9fc0f4;
}

/* PORTAL MENU - GLOBAL */

.sh-portal-menu {
  padding: 6px;
  background: white;
  border: 1px solid #dbe5f2;
  border-radius: 11px;
  box-shadow: 0 14px 38px rgba(21,45,83,.2);
  font-family: Inter,system-ui,sans-serif;
}

.sh-portal-menu button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 42px;
  padding: 10px 11px;
  border: none;
  border-radius: 8px;
  background: white;
  color: #344d70;
  font-size: 12px;
  font-weight: 750;
  text-align: left;
  cursor: pointer;
}

.sh-portal-menu button:hover:not(:disabled) {
  background: #edf4ff;
  color: #245ac0;
}

.sh-portal-menu button:disabled {
  opacity: .4;
  cursor: not-allowed;
}

/* FOOTER */

.sh-empty-cell {
  padding: 35px !important;
  text-align: center !important;
  color: #8392a8 !important;
}

.sh-table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 20px 26px;
  background: #f8faff;
  border-top: 1px solid #e5ebf5;
}

.sh-table-footer > div:first-child {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.sh-table-footer strong {
  color: #21385c;
  font-size: 12px;
  font-weight: 900;
}

.sh-table-footer span {
  color: #8290a6;
  font-size: 11px;
}

.sh-footer-right {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
}

.sh-show-more {
  padding: 8px 12px;
  background: #eaf1ff;
  color: #245ac0;
  border: 1px solid #cadbf9;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 850;
}

.sh-readonly-label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

/* TABLET */

@media (max-width: 1000px) {
  .sh-summary-strip {
    gap: 9px;
    padding: 18px;
  }

  .sh-mini-card {
    padding: 10px;
    gap: 8px;
  }

  .sh-mini-icon {
    width: 35px;
    height: 35px;
  }

  .sh-mini-count {
    font-size: 22px;
  }

  .sh-table thead th {
    padding: 12px 6px;
    font-size: 9px;
  }

  .sh-table tbody td {
    padding: 12px 6px;
  }
}

@media (max-width: 850px) {
  .sh-filter-grid {
    grid-template-columns: 195px minmax(0,1fr);
  }

  .sh-patient-field {
    grid-column: 1 / -1;
  }

  .sh-summary-strip {
    grid-template-columns: repeat(3,minmax(0,1fr));
  }

  .sh-table {
    min-width: 900px;
  }

  .sh-appointments-panel {
    width: 100%;
    margin-left: 0;
    margin-right: 0;
  }
}

/* MOBILE */

@media (max-width: 600px) {
  .sh-filter-header,
  .sh-filter-body {
    padding: 15px;
  }

  .sh-filter-grid {
    grid-template-columns: 1fr;
  }

  .sh-patient-field {
    grid-column: auto;
  }

  .sh-period-row {
    flex-wrap: wrap;
  }

  .sh-summary-strip {
    grid-template-columns: repeat(2,minmax(0,1fr));
    padding: 13px;
  }

  .sh-mini-card {
    min-height: 76px;
  }

  .sh-appointments-header {
    padding: 20px;
  }

  .sh-appointments-heading h2 {
    font-size: 18px;
  }

  .sh-appointments-icon {
    width: 42px;
    height: 42px;
  }

  .sh-schedule-heading,
  .sh-table-footer {
    padding: 17px 15px;
  }
}

`;

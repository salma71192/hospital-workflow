
import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

const C = {
  navy: "#172b4d",
  text: "#334155",
  muted: "#64748b",
  border: "#dbe4f0",
  blue: "#2563eb",
  green: "#15803d",
  teal: "#0f766e",
  orange: "#c2410c",
  red: "#b91c1c",
};

const localDateString = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

const localMonthString = () => localDateString().slice(0, 7);

function valueOf(obj, keys, fallback = "") {
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

function objectOf(obj, keys) {
  for (const key of keys) {
    const value = obj?.[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value;
    }
  }
  return {};
}

function listFromResponse(data, keys = []) {
  if (Array.isArray(data)) return data;

  for (const key of [...keys, "results", "items", "claims", "history"]) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  if (data?.data && typeof data.data === "object") {
    return listFromResponse(data.data, keys);
  }

  return [];
}

function patientOf(claim) {
  return objectOf(claim, [
    "patient",
    "patient_details",
    "patientDetails",
    "patient_data",
    "patientData",
  ]);
}

function patientName(claim) {
  const patient = patientOf(claim);

  const direct = valueOf(claim, [
    "patientName",
    "patient_name",
    "patient_full_name",
    "patientFullName",
  ]);

  if (direct) return String(direct);

  const full = valueOf(patient, [
    "full_name",
    "fullName",
    "patient_name",
    "patientName",
    "name",
    "display_name",
    "displayName",
  ]);

  if (full) return String(full);

  return (
    `${valueOf(patient, ["first_name", "firstName"])} ${valueOf(
      patient,
      ["last_name", "lastName"]
    )}`.trim() || "Unknown patient"
  );
}

function patientIdOf(claim) {
  return valueOf(
    claim,
    ["patientId", "patient_id"],
    valueOf(patientOf(claim), ["id", "patient_id", "patientId"], "")
  );
}

const FILE_KEYS = [
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

function fileNumberOf(claim) {
  const direct = valueOf(claim, FILE_KEYS);
  if (direct) return String(direct);

  const patient = patientOf(claim);
  const patientValue = valueOf(patient, FILE_KEYS);
  if (patientValue) return String(patientValue);

  const record = objectOf(patient, [
    "patient_record",
    "patientRecord",
    "medical_record_details",
    "medicalRecordDetails",
  ]);

  return String(valueOf(record, FILE_KEYS, "—"));
}

function claimDatabaseId(claim) {
  return valueOf(claim, ["id", "claim_pk", "claimPk"], "");
}

function claimIdOf(claim) {
  return valueOf(
    claim,
    ["claim_number", "claimNumber", "claim_id", "claimId", "id"],
    "—"
  );
}

function statusOf(claim) {
  return String(
    valueOf(claim, ["status", "claim_status", "claimStatus"], "Pending")
  );
}

function statusCategory(input) {
  const status = (typeof input === "string" ? input : statusOf(input))
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, " ");

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

  if (
    status.includes("submit") ||
    status.includes("filed") ||
    status.includes("sent for review") ||
    status.includes("sent to insurance") ||
    status.includes("under review")
  ) {
    return "Submitted";
  }

  return "Pending";
}

function statusColors(status) {
  const category = statusCategory(status);

  if (category === "Approved") {
    return {
      color: "#047857",
      bg: "#e8faf3",
      border: "#b8eee0",
      dot: "#10b981",
    };
  }

  if (category === "Rejected") {
    return {
      color: "#be123c",
      bg: "#fff0f2",
      border: "#fecdd3",
      dot: "#f43f5e",
    };
  }

  if (category === "Submitted") {
    return {
      color: "#0f766e",
      bg: "#f0fdfa",
      border: "#99f6e4",
      dot: "#14b8a6",
    };
  }

  return {
    color: "#c2410c",
    bg: "#fff7ed",
    border: "#fed7aa",
    dot: "#f97316",
  };
}

function createdDateOf(claim) {
  return valueOf(claim, [
    "createdAt",
    "created_at",
    "dateCreated",
    "date_created",
    "submittedAt",
    "submitted_at",
    "submission_date",
    "submissionDate",
    "created_date",
    "createdDate",
    "date_submitted",
    "dateSubmitted",
  ]);
}

function dateParts(value) {
  if (!value) return null;

  const raw = String(value);
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    return { day: `${match[1]}-${match[2]}-${match[3]}` };
  }

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

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDate(value);

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

function currentUserFromStorage() {
  for (const key of [
    "user",
    "currentUser",
    "current_user",
    "authUser",
    "loggedInUser",
    "userData",
  ]) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      const user = parsed?.user || parsed?.currentUser || parsed;

      if (user && typeof user === "object") return user;
    } catch {
      // Continue checking other storage keys.
    }
  }

  return {
    id:
      localStorage.getItem("user_id") ||
      localStorage.getItem("userId") ||
      localStorage.getItem("id") ||
      "",
  };
}

function userIdOf(user) {
  return valueOf(user, ["id", "user_id", "userId", "pk"], "");
}

function creatorOf(claim) {
  return objectOf(claim, [
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

function creatorIdOf(claim) {
  const creator = creatorOf(claim);
  const nestedId = valueOf(creator, ["id", "user_id", "userId", "pk"], "");

  if (nestedId !== "") return String(nestedId);

  const direct = valueOf(
    claim,
    [
      "created_by_id",
      "createdById",
      "creator_id",
      "creatorId",
      "created_user_id",
      "createdUserId",
      "submitted_by_id",
      "submittedById",
    ],
    ""
  );

  if (direct !== "") return String(direct);

  const raw =
    claim?.created_by ??
    claim?.createdBy ??
    claim?.creator ??
    claim?.submitted_by ??
    claim?.submittedBy;

  return typeof raw === "number" || typeof raw === "string"
    ? String(raw)
    : "";
}

function nameFromUser(user) {
  return String(
    valueOf(user, [
      "display_name",
      "displayName",
      "full_name",
      "fullName",
      "name",
      "username",
      "email",
    ])
  );
}

function creatorNameOf(claim) {
  const nestedName = nameFromUser(creatorOf(claim));
  if (nestedName) return nestedName;

  const direct = valueOf(claim, [
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

  if (direct) return String(direct);

  const id = creatorIdOf(claim);
  return id !== "" ? `RCM user #${id}` : "Not recorded";
}

/* ---------------- Claim history helpers ---------------- */

function eventDate(event) {
  return valueOf(event, [
    "created_at",
    "createdAt",
    "timestamp",
    "event_date",
    "eventDate",
    "changed_at",
    "changedAt",
    "date",
  ]);
}

function normalizedEventType(event) {
  return String(
    valueOf(
      event,
      [
        "event_type",
        "eventType",
        "action",
        "event",
        "title",
        "change_type",
        "activity_type",
        "activityType",
      ],
      ""
    )
  )
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .trim();
}

function isCreationEvent(event) {
  const type = normalizedEventType(event);

  return (
    type.includes("creat") ||
    type.includes("initial") ||
    type.includes("claim submitted") ||
    type === "new" ||
    type === "insert"
  );
}

function eventStatus(event, claim) {
  const status = valueOf(
    event,
    [
      "new_status",
      "newStatus",
      "current_status",
      "currentStatus",
      "to_status",
      "toStatus",
      "status_after",
      "statusAfter",
      "claim_status",
      "claimStatus",
      "status",
    ],
    ""
  );

  if (status) return String(status);

  const details = objectOf(event, [
    "changes",
    "details",
    "metadata",
    "data",
  ]);

  const nestedStatus = valueOf(
    details,
    ["new_status", "newStatus", "current_status", "status"],
    ""
  );

  if (nestedStatus) return String(nestedStatus);

  if (isCreationEvent(event)) return statusOf(claim);

  return "Status not recorded";
}

function eventUserName(event) {
  const user = objectOf(event, [
    "changed_by",
    "changedBy",
    "edited_by",
    "editedBy",
    "updated_by",
    "updatedBy",
    "performed_by",
    "performedBy",
    "actor",
    "user",
    "created_by",
    "createdBy",
    "changed_by_user",
    "changedByUser",
  ]);

  const nestedName = nameFromUser(user);
  if (nestedName) return nestedName;

  const directName = valueOf(
    event,
    [
      "changed_by_name",
      "changedByName",
      "edited_by_name",
      "editedByName",
      "updated_by_name",
      "updatedByName",
      "performed_by_name",
      "performedByName",
      "actor_name",
      "actorName",
      "user_name",
      "userName",
      "created_by_name",
      "createdByName",
      "username",
    ],
    ""
  );

  if (directName) return String(directName);

  const id = valueOf(
    event,
    [
      "changed_by_id",
      "changedById",
      "edited_by_id",
      "editedById",
      "updated_by_id",
      "updatedById",
      "performed_by_id",
      "performedById",
      "actor_id",
      "actorId",
      "user_id",
      "userId",
      "created_by_id",
      "createdById",
    ],
    ""
  );

  return id !== "" ? `User #${id}` : "Not recorded";
}

function eventKey(event, index) {
  return String(
    event.id ||
      event.pk ||
      `${eventDate(event) || "event"}-${normalizedEventType(event)}-${index}`
  );
}

function historyActorLabel(event) {
  return isCreationEvent(event) ? "Created by" : "Edited by";
}

function embeddedHistoryOf(claim) {
  for (const key of [
    "history",
    "claim_history",
    "claimHistory",
    "history_records",
    "historyRecords",
  ]) {
    if (Array.isArray(claim?.[key])) return claim[key];
  }

  return null;
}

/*
 * Remove duplicate history entries before displaying them.
 *
 * First, remove repeated records with the same database ID.
 * Next, remove exact duplicate events based on their event type,
 * timestamp, status and actor.
 * Finally, if a creation event exists, suppress a non-creation event
 * that has the same timestamp and status as that creation event.
 *
 * This is a display-layer safeguard. If the backend creates two
 * different records with different timestamps, the backend should
 * also be corrected so the stored history remains accurate.
 */
function deduplicateHistoryEvents(events, claim) {
  if (!Array.isArray(events)) return [];

  const sorted = [...events].sort((a, b) => {
    const aTime = new Date(eventDate(a) || 0).getTime();
    const bTime = new Date(eventDate(b) || 0).getTime();

    return aTime - bTime;
  });

  const unique = [];
  const seenIds = new Set();
  const seenSignatures = new Set();

  for (const event of sorted) {
    const rawId = valueOf(event, ["id", "pk"], "");

    if (rawId !== "") {
      const id = String(rawId);

      if (seenIds.has(id)) continue;
      seenIds.add(id);
    }

    const type = normalizedEventType(event);
    const status = eventStatus(event, claim).trim().toLowerCase();
    const actor = eventUserName(event).trim().toLowerCase();
    const timestamp = eventDate(event);
    const creation = isCreationEvent(event);

    const signature = [
      timestamp || "",
      status,
      actor,
      type,
    ].join("|");

    if (seenSignatures.has(signature)) continue;
    seenSignatures.add(signature);

    const duplicateOfCreation =
      !creation &&
      unique.some((existing) => {
        if (!isCreationEvent(existing)) return false;

        const existingTimestamp = eventDate(existing);
        const existingStatus = eventStatus(existing, claim)
          .trim()
          .toLowerCase();

        return (
          Boolean(timestamp) &&
          Boolean(existingTimestamp) &&
          new Date(timestamp).getTime() ===
            new Date(existingTimestamp).getTime() &&
          existingStatus === status
        );
      });

    if (duplicateOfCreation) continue;

    unique.push(event);
  }

  return unique;
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
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6" />
        <path d="M10 10v6m4-6v6" />
      </>
    ),
    list: (
      <>
        <path d="M8 6h13M8 12h13M8 18h13" />
        <path d="M3 6h.01M3 12h.01M3 18h.01" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    alert: (
      <>
        <path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4m0 4h.01" />
      </>
    ),
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5M12 7v5l3 2" />
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
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.list}
    </svg>
  );
}

export default function ClaimHistory({ refreshKey = 0 }) {
  const navigate = useNavigate();

  const [claims, setClaims] = useState([]);
  const [currentUser, setCurrentUser] = useState(currentUserFromStorage);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const [expandedClaim, setExpandedClaim] = useState(null);
  const [historyByClaim, setHistoryByClaim] = useState({});
  const [historyLoadingId, setHistoryLoadingId] = useState(null);
  const [historyErrors, setHistoryErrors] = useState({});
  const [historyCountByClaim, setHistoryCountByClaim] = useState({});

  const [search, setSearch] = useState("");
  const [createdByFilter, setCreatedByFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [dateMode, setDateMode] = useState("day");
  const [selectedDate, setSelectedDate] = useState(localDateString());
  const [selectedMonth, setSelectedMonth] = useState(localMonthString());

  const userId = String(userIdOf(currentUser) || "");

  const loadClaims = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    setError("");
    setActionError("");
    setSuccessMessage("");

    try {
      const response = await api.get("rcm/claims/");
      const loadedClaims = listFromResponse(response.data, [
        "claims",
        "results",
        "data",
        "items",
      ]);

      setClaims(loadedClaims);

      setHistoryCountByClaim((current) => {
        const next = { ...current };

        loadedClaims.forEach((claim) => {
          const id = String(claimDatabaseId(claim) || "");
          const embedded = embeddedHistoryOf(claim);

          if (id && embedded !== null) {
            next[id] = embedded.length;
          }
        });

        return next;
      });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to load claim records. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadCurrentUser = useCallback(async () => {
    try {
      const response = await api.get("users/me/");
      const data = response.data;
      const user = data?.user || data?.data?.user || data?.data || data;

      if (user && typeof user === "object") setCurrentUser(user);
    } catch {
      // Keep local user information if the endpoint is unavailable.
    }
  }, []);

  useEffect(() => {
    loadClaims();
    loadCurrentUser();
  }, [loadClaims, loadCurrentUser, refreshKey]);

  const creatorOptions = useMemo(() => {
    const map = new Map();

    claims.forEach((claim) => {
      const id = creatorIdOf(claim);
      const name = creatorNameOf(claim);

      if (name === "Not recorded") return;

      const key = id !== "" ? String(id) : name;
      if (!map.has(key)) map.set(key, { key, name });
    });

    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [claims]);

  const periodClaims = useMemo(() => {
    return claims.filter((claim) => {
      const created = dateParts(createdDateOf(claim));

      if (!created?.day) return false;

      if (dateMode === "day") {
        return created.day === selectedDate;
      }

      return created.day.startsWith(`${selectedMonth}-`);
    });
  }, [claims, dateMode, selectedDate, selectedMonth]);

  const stats = useMemo(
    () => ({
      total: periodClaims.length,
      approved: periodClaims.filter(
        (claim) => statusCategory(claim) === "Approved"
      ).length,
      submitted: periodClaims.filter(
        (claim) => statusCategory(claim) === "Submitted"
      ).length,
      pending: periodClaims.filter(
        (claim) => statusCategory(claim) === "Pending"
      ).length,
      rejected: periodClaims.filter(
        (claim) => statusCategory(claim) === "Rejected"
      ).length,
    }),
    [periodClaims]
  );

  const filteredClaims = useMemo(() => {
    const query = search.trim().toLowerCase();

    return periodClaims.filter((claim) => {
      const creatorId = creatorIdOf(claim);
      const creatorName = creatorNameOf(claim);
      const creatorKey = creatorId !== "" ? creatorId : creatorName;

      const searchText = [
        patientName(claim),
        fileNumberOf(claim),
        claimIdOf(claim),
        statusOf(claim),
        creatorName,
      ]
        .join(" ")
        .toLowerCase();

      if (query && !searchText.includes(query)) return false;

      if (createdByFilter !== "All") {
        if (createdByFilter === "Not recorded") {
          if (creatorName !== "Not recorded") return false;
        } else if (String(creatorKey) !== createdByFilter) {
          return false;
        }
      }

      if (
        statusFilter !== "All" &&
        statusCategory(claim) !== statusFilter
      ) {
        return false;
      }

      return true;
    });
  }, [periodClaims, search, createdByFilter, statusFilter]);

  const hasFilters =
    Boolean(search.trim()) ||
    createdByFilter !== "All" ||
    statusFilter !== "All";

  function resetFilters() {
    setSearch("");
    setCreatedByFilter("All");
    setStatusFilter("All");
  }

  function handleCardClick(category) {
    setStatusFilter((current) =>
      category === "All" || current === category ? "All" : category
    );
  }

  function startEditing(claim) {
    const id = claimDatabaseId(claim);

    if (id === "" || id === "—") {
      setActionError("This claim has no database ID.");
      return;
    }

    setActionError("");
    setSuccessMessage("");

    navigate("/rcm/claims", {
      state: {
        editClaim: claim,
        claimId: id,
        mode: "edit",
      },
    });
  }

  function historyCountOf(claim) {
    const id = String(claimDatabaseId(claim) || "");
    const embedded = embeddedHistoryOf(claim);

    if (embedded !== null) return embedded.length;

    if (typeof historyCountByClaim[id] === "number") {
      return historyCountByClaim[id];
    }

    return null;
  }

  function canDeleteClaim(claim) {
    if (!userId) return false;

    const createdDay = dateParts(createdDateOf(claim))?.day;
    if (createdDay !== localDateString()) return false;

    const creatorId = creatorIdOf(claim);
    if (!creatorId || String(creatorId) !== userId) return false;

    const count = historyCountOf(claim);

    if (count === null) return false;

    return count <= 1;
  }

  async function loadClaimHistory(claim, forceRefresh = false) {
    const id = String(claimDatabaseId(claim) || "");

    if (!id || id === "—") {
      setHistoryErrors((current) => ({
        ...current,
        [id]: "This claim has no database ID.",
      }));
      return;
    }

    setExpandedClaim(id);
    setHistoryErrors((current) => ({ ...current, [id]: "" }));

    if (!forceRefresh && Array.isArray(historyByClaim[id])) return;

    setHistoryLoadingId(id);

    try {
      const response = await api.get(`rcm/claims/${id}/history/`);

      const events = listFromResponse(response.data, [
        "history",
        "claim_history",
        "claimHistory",
        "results",
        "items",
        "data",
      ]);

      setHistoryByClaim((current) => ({
        ...current,
        [id]: events,
      }));

      // Keep the stored record count for deletion protection.
      // Do not use the deduplicated display count for this rule.
      setHistoryCountByClaim((current) => ({
        ...current,
        [id]: events.length,
      }));
    } catch (err) {
      setHistoryErrors((current) => ({
        ...current,
        [id]:
          err.response?.data?.detail ||
          err.response?.data?.message ||
          "Unable to load history. Please check the claim-history API endpoint.",
      }));
    } finally {
      setHistoryLoadingId(null);
    }
  }

  async function deleteClaim(claim) {
    setActionError("");
    setSuccessMessage("");

    const id = String(claimDatabaseId(claim) || "");
    const count = historyCountOf(claim);

    if (count === null) {
      setActionError(
        "Claim history has not been verified. Open History and refresh it before deleting this claim."
      );
      return;
    }

    if (count > 1) {
      setActionError(
        "This claim cannot be deleted because it has more than one history record."
      );
      return;
    }

    if (!canDeleteClaim(claim)) {
      setActionError(
        "Only a claim created by your account today can be deleted."
      );
      return;
    }

    if (!id || id === "—") {
      setActionError("The claim database ID is missing.");
      return;
    }

    const confirmed = window.confirm(
      `Delete claim ${claimIdOf(claim)} for ${patientName(claim)}?`
    );

    if (!confirmed) return;

    setDeletingId(id);

    try {
      await api.delete(`rcm/claims/${id}/`);

      setClaims((current) =>
        current.filter((item) => String(claimDatabaseId(item)) !== id)
      );

      setHistoryByClaim((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });

      setHistoryCountByClaim((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });

      setHistoryErrors((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });

      setExpandedClaim((current) =>
        String(current) === id ? null : current
      );

      setSuccessMessage("Claim deleted successfully.");
    } catch (err) {
      const data = err.response?.data;

      setActionError(
        data?.detail ||
          data?.message ||
          data?.error ||
          (err.response?.status === 403
            ? "The server denied deletion. Check the backend delete permissions."
            : err.response?.status === 404
              ? "The claim was not found. Refresh the list and try again."
              : err.response?.status === 409
                ? "This claim cannot be deleted because it has more than one history record."
                : "The server could not delete this claim. Check the backend response and delete rules.")
      );

      loadClaims(false);
    } finally {
      setDeletingId(null);
    }
  }

  function openPatientFile(id) {
    if (id !== null && id !== undefined && id !== "") {
      navigate(`/patients/${id}`);
    }
  }

  const periodLabel =
    dateMode === "day"
      ? formatDate(selectedDate)
      : formatMonth(selectedMonth);

  const cards = [
    {
      label: "Total Claims",
      value: stats.total,
      category: "All",
      description: "Claims in selected period",
      color: C.blue,
      bg: "#eff6ff",
      border: "#bfdbfe",
      icon: "list",
    },
    {
      label: "Approved Claims",
      value: stats.approved,
      category: "Approved",
      description: "Approved, completed, or paid",
      color: C.green,
      bg: "#ecfdf5",
      border: "#a7f3d0",
      icon: "check",
    },
    {
      label: "Submitted Claims",
      value: stats.submitted,
      category: "Submitted",
      description: "Submitted or awaiting a decision",
      color: C.teal,
      bg: "#f0fdfa",
      border: "#99f6e4",
      icon: "history",
    },
    {
      label: "Pending Claims",
      value: stats.pending,
      category: "Pending",
      description: "Awaiting action or processing",
      color: C.orange,
      bg: "#fff7ed",
      border: "#fed7aa",
      icon: "clock",
    },
    {
      label: "Rejected Claims",
      value: stats.rejected,
      category: "Rejected",
      description: "Rejected or denied claims",
      color: C.red,
      bg: "#fff1f2",
      border: "#fecdd3",
      icon: "alert",
    },
  ];

  return (
    <div className="claim-history-page">
      <style>{`
        .claim-history-page{width:100%;color:${C.navy};font-family:inherit;font-size:14px}
        .claim-history-page *{box-sizing:border-box}
        .ch-page-header{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;margin-bottom:22px}
        .ch-title{font-size:25px;font-weight:900;margin:0 0 7px;color:${C.navy};letter-spacing:-.45px}
        .ch-subtitle{margin:0;color:${C.muted};font-size:13px;line-height:1.65}
        .ch-count{display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border:1px solid #d4e4fa;border-radius:20px;background:#f1f7ff;color:#2455a0;font-size:12px;font-weight:800;white-space:nowrap}
        .ch-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:40px;padding:9px 13px;border:1px solid #1557b0;border-radius:9px;background:#1557b0;color:#fff;font-family:inherit;font-size:13px;font-weight:750;cursor:pointer;transition:background .15s,border .15s}
        .ch-button:hover:not(:disabled){filter:brightness(.97)}
        .ch-button:disabled{opacity:.5;cursor:not-allowed}
        .ch-secondary{border-color:#cbdcf3;background:#fff;color:#174b91}
        .ch-danger{border-color:#fecdd3;background:#fff5f5;color:#be123c}
        .ch-edit{border-color:#c9ddfc;background:#f0f6ff;color:#1d4ed8}
        .ch-cards{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:13px;margin-bottom:22px}
        .ch-card{position:relative;display:flex;align-items:flex-start;gap:11px;min-width:0;width:100%;padding:16px 13px;border:1px solid;border-radius:14px;text-align:left;font-family:inherit;cursor:pointer;transition:transform .18s,box-shadow .18s,outline-color .18s;appearance:none;color:inherit}
        .ch-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px #172b4d12}
        .ch-card:focus-visible{outline:3px solid #60a5fa;outline-offset:3px}
        .ch-card.ch-card-active{box-shadow:0 0 0 2px #2563eb,0 8px 24px #172b4d12}
        .ch-card-icon{display:grid;place-items:center;width:38px;height:38px;border-radius:11px;flex-shrink:0}
        .ch-card-content{min-width:0}
        .ch-card-label{display:block;font-size:12px;font-weight:800;line-height:1.5;color:#334155}
        .ch-card-value{display:block;font-size:27px;font-weight:900;margin:6px 0 4px;line-height:1.2}
        .ch-card-description{display:block;color:${C.muted};font-size:10px;line-height:1.5}
        .ch-card-active-label{display:block;margin-top:7px;color:#1d4ed8;font-size:10px;font-weight:850;text-transform:uppercase;letter-spacing:.04em}
        .ch-panel{border:1px solid ${C.border};border-radius:15px;background:#fff;box-shadow:0 4px 18px #172b4d08;overflow:hidden}
        .ch-content{padding:22px}
        .ch-toolbar{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:20px}
        .ch-filter{border:1px solid #dce7f5;border-radius:14px;background:#fff;overflow:hidden}
        .ch-filter-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:17px 20px;border-bottom:1px solid #e5edf8;background:linear-gradient(120deg,#f3f8ff,#fbfdff)}
        .ch-filter-title{display:flex;align-items:center;gap:10px;color:#173b73;font-size:16px;font-weight:850}
        .ch-filter-subtitle{margin:4px 0 0 29px;color:${C.muted};font-size:12px}
        .ch-filter-body{padding:20px}
        .ch-mode-row{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:19px;padding:15px;border:1px solid #e1eaf7;border-radius:12px;background:#f8fbff}
        .ch-mode-label{display:flex;align-items:center;gap:10px;color:#244b83;font-size:13px;font-weight:850}
        .ch-mode-label small{display:block;margin-top:4px;color:${C.muted};font-size:11px;font-weight:500}
        .ch-segment{display:inline-flex;gap:4px;padding:4px;border:1px solid #d4e1f2;border-radius:10px;background:#edf3fb}
        .ch-segment button{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:36px;padding:8px 15px;border:0;border-radius:7px;background:transparent;color:#506782;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer}
        .ch-segment button.active{background:#fff;color:#174b91;box-shadow:0 1px 4px #172b4d18}
        .ch-filter-grid{display:grid;grid-template-columns:minmax(240px,1.5fr) repeat(2,minmax(170px,1fr));gap:16px;align-items:end}
        .ch-label{display:block;min-width:0;color:#526781;font-size:12px;font-weight:800}
        .ch-control-wrap{position:relative;margin-top:8px}
        .ch-control{width:100%;min-width:0;height:45px;padding:0 12px;border:1px solid #d4dfed;border-radius:9px;background:#fff;color:${C.navy};font-family:inherit;font-size:13px;outline:none}
        .ch-control:focus{border-color:#3b82f6;box-shadow:0 0 0 3px #3b82f61a}
        .ch-search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#64748b;pointer-events:none}
        .ch-search{padding-left:39px}
        .ch-date-description{margin-top:8px;color:#64748b;font-size:11px;font-weight:500;line-height:1.6}
        .ch-period-summary{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:18px;padding:12px 14px;border:1px solid #dbeafe;border-radius:9px;background:#eff6ff;color:#244b83;font-size:12px}
        .ch-period-summary strong{font-weight:850}
        .ch-filter-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:14px 20px;border-top:1px solid #e7edf6;background:#fbfdff}
        .ch-muted{color:${C.muted};font-size:12px}
        .ch-table-section{margin-top:27px}
        .ch-table-heading{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px}
        .ch-table-title{margin:0 0 5px;color:${C.navy};font-size:18px;font-weight:850}
        .ch-table-wrap{width:100%;overflow:auto;border:1px solid #dce7f5;border-radius:11px;background:#fff}
        .ch-table{width:100%;min-width:1120px;border-collapse:separate;border-spacing:0;text-align:left}
        .ch-table th{padding:14px;border-bottom:1px solid #dce7f5;background:#eff5fd;color:#31527f;font-size:11px;font-weight:850;text-transform:uppercase;letter-spacing:.035em;white-space:nowrap}
        .ch-table td{padding:13px;border-bottom:1px solid #eaf0f8;color:#526781;font-size:13px;vertical-align:middle}
        .ch-row:hover{background:#f7faff}
        .ch-claim-id{display:inline-block;padding:7px 10px;border:1px solid #d8e8ff;border-radius:20px;background:#eaf3ff;color:#1554a5;font-size:12px;font-weight:850;white-space:nowrap}
        .ch-link{padding:0;border:0;background:transparent;color:#17365f;font-family:inherit;font-size:13px;font-weight:800;text-align:left;cursor:pointer}
        .ch-link:hover{color:${C.blue};text-decoration:underline}
        .ch-status{display:inline-flex;align-items:center;gap:6px;padding:7px 10px;border:1px solid;border-radius:20px;font-size:12px;font-weight:800;white-space:nowrap}
        .ch-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
        .ch-creator{display:inline-block;max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#49617f;font-weight:650}
        .ch-table .ch-button{min-height:35px;padding:7px 10px;border-radius:8px;font-size:12px}
        .ch-detail-row td{padding:0;background:#f4f8ff}
        .ch-history-wrap{padding:18px}
        .ch-history-header{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:15px}
        .ch-history-heading{margin:0 0 5px;color:#173b73;font-size:16px;font-weight:850}
        .ch-history-table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #dce8f8}
        .ch-history-table th,.ch-history-table td{padding:13px 15px;border-bottom:1px solid #e8eff8;text-align:left;vertical-align:middle}
        .ch-history-table th{background:#edf4ff;color:#31527f;font-size:11px;text-transform:uppercase;letter-spacing:.03em}
        .ch-history-table td{color:#334e70;font-size:13px;overflow-wrap:anywhere}
        .ch-history-table tr:last-child td{border-bottom:0}
        .ch-history-event{display:inline-flex;padding:6px 10px;border-radius:20px;background:#eff6ff;color:#1d4ed8;font-size:12px;font-weight:800}
        .ch-history-empty{padding:24px;border:1px dashed #cbdcf0;border-radius:10px;background:#fff;text-align:center;color:#71839d;line-height:1.7}
        .ch-empty{padding:38px 16px;text-align:center;color:#71839d;font-size:13px;line-height:1.7}
        .ch-empty strong{display:block;margin-bottom:8px;color:#203c63;font-size:17px}
        .ch-alert{margin:14px 0;padding:12px 14px;border:1px solid;border-radius:10px;font-size:13px;line-height:1.6}
        .ch-error{border-color:#fecaca;background:#fef2f2;color:${C.red}}
        .ch-success{border-color:#bbf7d0;background:#f0fdf4;color:${C.green}}
        @media(max-width:1250px){.ch-cards{grid-template-columns:repeat(3,minmax(0,1fr))}}
        @media(max-width:850px){.ch-cards{grid-template-columns:repeat(2,minmax(0,1fr))}.ch-filter-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ch-filter-grid>.ch-label:first-child{grid-column:1/-1}}
        @media(max-width:650px){.ch-content{padding:13px}.ch-cards{gap:9px}.ch-card{padding:12px;gap:9px}.ch-card-value{font-size:24px}.ch-card-icon{width:35px;height:35px}.ch-filter-grid{grid-template-columns:1fr}.ch-filter-grid>.ch-label:first-child{grid-column:auto}.ch-filter-heading,.ch-filter-body{padding:14px}.ch-filter-footer{padding:12px 14px}.ch-title{font-size:22px}.ch-mode-row{align-items:flex-start}.ch-segment{width:100%}.ch-segment button{flex:1}}
      `}</style>

      <div className="ch-page-header">
        <div>
          <h2 className="ch-title">Claim Records</h2>
          <p className="ch-subtitle">
            Search, review, edit, and track claims by day or month.
          </p>
        </div>

        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
          <span className="ch-count">
            <Icon name="calendar" size={15} />
            {periodLabel}
          </span>

          <button
            type="button"
            className="ch-button"
            onClick={() => {
              loadClaims(false);
              loadCurrentUser();
            }}
            disabled={refreshing}
          >
            <Icon name="refresh" size={16} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {actionError && (
        <div className="ch-alert ch-error" role="alert">
          {actionError}
        </div>
      )}

      {successMessage && (
        <div className="ch-alert ch-success" role="status">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="ch-alert ch-error" role="alert">
          {error}
          <button
            type="button"
            className="ch-button ch-secondary"
            onClick={() => loadClaims()}
            disabled={loading}
            style={{ marginLeft: 10 }}
          >
            Try again
          </button>
        </div>
      )}

      <div className="ch-cards">
        {cards.map((card) => {
          const active = statusFilter === card.category;

          return (
            <button
              key={card.label}
              type="button"
              className={`ch-card${active ? " ch-card-active" : ""}`}
              style={{
                background: card.bg,
                borderColor: active ? card.color : card.border,
              }}
              onClick={() => handleCardClick(card.category)}
              aria-pressed={active}
              aria-label={`${card.label}: ${card.value}. ${
                active
                  ? "Currently selected. Click to clear the status filter."
                  : "Click to filter claims."
              }`}
              title={
                active
                  ? "Click to clear this status filter"
                  : `Filter table by ${card.category.toLowerCase()} claims`
              }
            >
              <span
                className="ch-card-icon"
                style={{
                  background: card.border,
                  color: card.color,
                }}
              >
                <Icon name={card.icon} size={21} />
              </span>

              <span className="ch-card-content">
                <span className="ch-card-label">{card.label}</span>
                <span
                  className="ch-card-value"
                  style={{ color: card.color }}
                >
                  {card.value}
                </span>
                <span className="ch-card-description">
                  {card.description}
                </span>
                {active && (
                  <span className="ch-card-active-label">
                    {card.category === "All"
                      ? "All claims selected"
                      : "Filter active"}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <section className="ch-panel">
        <div className="ch-content">
          <div className="ch-toolbar">
            <div>
              <h3 className="ch-table-title">Find a claim</h3>
              <p className="ch-subtitle">
                Select a period first, then narrow the results using search,
                creator, or the summary cards.
              </p>
            </div>

            <span className="ch-count">
              {filteredClaims.length} matching claims
            </span>
          </div>

          <div className="ch-filter">
            <div className="ch-filter-heading">
              <div>
                <div className="ch-filter-title">
                  <Icon name="filter" size={19} />
                  Filters &amp; Date Selection
                </div>
                <p className="ch-filter-subtitle">
                  Choose whether to view claims for one day or an entire month.
                </p>
              </div>
            </div>

            <div className="ch-filter-body">
              <div className="ch-mode-row">
                <div className="ch-mode-label">
                  <Icon name="calendar" size={21} />
                  <div>
                    View claims by
                    <small>
                      {dateMode === "day"
                        ? "Daily summary and records"
                        : "Monthly summary and records"}
                    </small>
                  </div>
                </div>

                <div
                  className="ch-segment"
                  role="group"
                  aria-label="Date filter mode"
                >
                  <button
                    type="button"
                    className={dateMode === "day" ? "active" : ""}
                    aria-pressed={dateMode === "day"}
                    onClick={() => setDateMode("day")}
                  >
                    <Icon name="calendar" size={15} />
                    Day
                  </button>

                  <button
                    type="button"
                    className={dateMode === "month" ? "active" : ""}
                    aria-pressed={dateMode === "month"}
                    onClick={() => setDateMode("month")}
                  >
                    <Icon name="list" size={15} />
                    Month
                  </button>
                </div>
              </div>

              <div className="ch-filter-grid">
                <label className="ch-label">
                  Search claims
                  <div className="ch-control-wrap">
                    <span className="ch-search-icon">
                      <Icon name="search" size={18} />
                    </span>
                    <input
                      className="ch-control ch-search"
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Patient, file number, claim ID..."
                    />
                  </div>
                  <div className="ch-date-description">
                    Search by patient name, file number, claim ID, status, or
                    creator.
                  </div>
                </label>

                <label className="ch-label">
                  Created by
                  <div className="ch-control-wrap">
                    <select
                      className="ch-control"
                      value={createdByFilter}
                      onChange={(event) =>
                        setCreatedByFilter(event.target.value)
                      }
                    >
                      <option value="All">All creators</option>
                      {creatorOptions.map((user) => (
                        <option key={user.key} value={user.key}>
                          {user.name}
                        </option>
                      ))}
                      <option value="Not recorded">Not recorded</option>
                    </select>
                  </div>
                  <div className="ch-date-description">
                    Show claims created by a particular user.
                  </div>
                </label>

                {dateMode === "day" ? (
                  <label className="ch-label">
                    Select day
                    <div className="ch-control-wrap">
                      <input
                        className="ch-control"
                        type="date"
                        value={selectedDate}
                        onChange={(event) =>
                          setSelectedDate(event.target.value)
                        }
                      />
                    </div>
                    <div className="ch-date-description">
                      Summary cards and records will reflect this date.
                    </div>
                  </label>
                ) : (
                  <label className="ch-label">
                    Select month
                    <div className="ch-control-wrap">
                      <input
                        className="ch-control"
                        type="month"
                        value={selectedMonth}
                        onChange={(event) =>
                          setSelectedMonth(event.target.value)
                        }
                      />
                    </div>
                    <div className="ch-date-description">
                      Summary cards and records will reflect the whole month.
                    </div>
                  </label>
                )}
              </div>

              <div className="ch-period-summary">
                <span>
                  <strong>Current period:</strong> {periodLabel}
                </span>
                <span>
                  <strong>{periodClaims.length}</strong> claims in this period
                </span>
              </div>
            </div>

            <div className="ch-filter-footer">
              <span className="ch-muted">
                Showing {filteredClaims.length} of {periodClaims.length} claims
                for the selected period.
                {statusFilter !== "All" && <> Status: {statusFilter}.</>}
              </span>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {hasFilters && (
                  <button
                    type="button"
                    className="ch-button ch-secondary"
                    onClick={resetFilters}
                  >
                    <Icon name="reset" size={15} />
                    Clear filters
                  </button>
                )}

                <button
                  type="button"
                  className="ch-button ch-secondary"
                  onClick={() => {
                    setDateMode("day");
                    setSelectedDate(localDateString());
                    setSelectedMonth(localMonthString());
                    resetFilters();
                  }}
                >
                  Today
                </button>

                <button
                  type="button"
                  className="ch-button ch-secondary"
                  onClick={() => {
                    setDateMode("month");
                    setSelectedMonth(localMonthString());
                    resetFilters();
                  }}
                >
                  Current month
                </button>
              </div>
            </div>
          </div>

          <div className="ch-table-section">
            <div className="ch-table-heading">
              <div>
                <h3 className="ch-table-title">Claim Records</h3>
                <p className="ch-subtitle">
                  {dateMode === "day"
                    ? `Claims created on ${periodLabel}.`
                    : `Claims created during ${periodLabel}.`}
                  {statusFilter !== "All" &&
                    ` Showing ${statusFilter.toLowerCase()} claims.`}
                </p>
              </div>

              <span className="ch-count">
                {filteredClaims.length} of {periodClaims.length} claims
              </span>
            </div>

            {loading ? (
              <div className="ch-empty">Loading claim records...</div>
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
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredClaims.map((claim, index) => {
                      const status = statusOf(claim);
                      const badge = statusColors(status);
                      const patientId = patientIdOf(claim);
                      const id = claimDatabaseId(claim);
                      const claimKey = String(
                        id || `${claimIdOf(claim)}-${index}`
                      );
                      const isExpanded = String(expandedClaim) === claimKey;
                      const count = historyCountOf(claim);
                      const canDelete = canDeleteClaim(claim);
                      const hasMultipleHistory =
                        typeof count === "number" && count > 1;
                      const isDeleting = deletingId === String(id);

                      const historyEvents = deduplicateHistoryEvents(
                        historyByClaim[claimKey],
                        claim
                      );

                      const deleteDisabled =
                        isDeleting || !canDelete || hasMultipleHistory;

                      const deleteTitle = hasMultipleHistory
                        ? "Cannot delete: this claim has more than one history record"
                        : count === null
                          ? "Open claim history to verify whether deletion is allowed"
                          : canDelete
                            ? "Delete your claim created today"
                            : "Only your own claims created today with no more than one history record are eligible";

                      return (
                        <Fragment key={claimKey}>
                          <tr className="ch-row">
                            <td>
                              <span className="ch-claim-id">
                                {claimIdOf(claim)}
                              </span>
                            </td>

                            <td>
                              {patientId !== "" && patientId != null ? (
                                <button
                                  type="button"
                                  className="ch-link"
                                  onClick={() => openPatientFile(patientId)}
                                >
                                  {patientName(claim)}
                                </button>
                              ) : (
                                <strong style={{ color: C.navy }}>
                                  {patientName(claim)}
                                </strong>
                              )}
                            </td>

                            <td>
                              {patientId !== "" && patientId != null ? (
                                <button
                                  type="button"
                                  className="ch-link"
                                  style={{ color: C.blue }}
                                  onClick={() => openPatientFile(patientId)}
                                  title="Open patient file"
                                >
                                  {fileNumberOf(claim)}
                                </button>
                              ) : (
                                fileNumberOf(claim)
                              )}
                            </td>

                            <td>
                              <span
                                className="ch-status"
                                style={{
                                  color: badge.color,
                                  background: badge.bg,
                                  borderColor: badge.border,
                                }}
                              >
                                <span
                                  className="ch-dot"
                                  style={{ background: badge.dot }}
                                />
                                {status}
                              </span>
                            </td>

                            <td>
                              <span
                                className="ch-creator"
                                title={creatorNameOf(claim)}
                              >
                                {creatorNameOf(claim)}
                              </span>
                            </td>

                            <td style={{ whiteSpace: "nowrap" }}>
                              {formatDate(createdDateOf(claim))}
                            </td>

                            <td>
                              <div
                                style={{
                                  display: "flex",
                                  gap: 7,
                                  flexWrap: "wrap",
                                  alignItems: "center",
                                }}
                              >
                                <button
                                  type="button"
                                  className="ch-button ch-secondary"
                                  onClick={() => {
                                    if (isExpanded) {
                                      setExpandedClaim(null);
                                    } else {
                                      loadClaimHistory(claim);
                                    }
                                  }}
                                  aria-expanded={isExpanded}
                                >
                                  <Icon name="history" size={15} />
                                  {isExpanded ? "Hide history" : "History"}
                                </button>

                                <button
                                  type="button"
                                  className="ch-button ch-edit"
                                  onClick={() => startEditing(claim)}
                                  title="Edit claim"
                                >
                                  <Icon name="edit" size={15} />
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className="ch-button ch-danger"
                                  onClick={() => deleteClaim(claim)}
                                  disabled={deleteDisabled}
                                  title={deleteTitle}
                                >
                                  <Icon name="trash" size={15} />
                                  {isDeleting ? "Deleting..." : "Delete"}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="ch-detail-row">
                              <td colSpan={7}>
                                <div className="ch-history-wrap">
                                  <div className="ch-history-header">
                                    <div>
                                      <h4 className="ch-history-heading">
                                        Claim History
                                      </h4>
                                      <p className="ch-subtitle">
                                        Claim {claimIdOf(claim)} ·{" "}
                                        {patientName(claim)}
                                      </p>
                                    </div>

                                    <button
                                      type="button"
                                      className="ch-button ch-secondary"
                                      onClick={() =>
                                        loadClaimHistory(claim, true)
                                      }
                                      disabled={historyLoadingId === claimKey}
                                    >
                                      <Icon name="refresh" size={15} />
                                      Refresh history
                                    </button>
                                  </div>

                                  {historyLoadingId === claimKey ? (
                                    <div className="ch-history-empty">
                                      Loading history...
                                    </div>
                                  ) : historyErrors[claimKey] ? (
                                    <div className="ch-alert ch-error">
                                      {historyErrors[claimKey]}
                                    </div>
                                  ) : historyEvents.length === 0 ? (
                                    <div className="ch-history-empty">
                                      No history records are available for
                                      this claim.
                                    </div>
                                  ) : (
                                    <div style={{ overflowX: "auto" }}>
                                      <table className="ch-history-table">
                                        <thead>
                                          <tr>
                                            <th>Date</th>
                                            <th>Status</th>
                                            <th>Created by / Edited by</th>
                                          </tr>
                                        </thead>

                                        <tbody>
                                          {historyEvents.map(
                                            (event, eventIndex) => {
                                              const creation =
                                                isCreationEvent(event);

                                              const creatorName =
                                                creatorNameOf(claim);

                                              const actorName = creation
                                                ? creatorName !== "Not recorded"
                                                  ? creatorName
                                                  : eventUserName(event)
                                                : eventUserName(event);

                                              return (
                                                <tr
                                                  key={eventKey(
                                                    event,
                                                    eventIndex
                                                  )}
                                                >
                                                  <td
                                                    style={{
                                                      whiteSpace: "nowrap",
                                                    }}
                                                  >
                                                    {formatDateTime(
                                                      eventDate(event)
                                                    )}
                                                  </td>

                                                  <td>
                                                    <span className="ch-history-event">
                                                      {eventStatus(
                                                        event,
                                                        claim
                                                      )}
                                                    </span>
                                                  </td>

                                                  <td>
                                                    <strong>
                                                      {historyActorLabel(
                                                        event
                                                      )}
                                                      :{" "}
                                                    </strong>
                                                    {actorName}
                                                  </td>
                                                </tr>
                                              );
                                            }
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}

                    {!filteredClaims.length && !error && (
                      <tr>
                        <td colSpan={7}>
                          <div className="ch-empty">
                            <strong>
                              {periodClaims.length
                                ? "No matching claims found"
                                : "No claims for this period"}
                            </strong>

                            {periodClaims.length
                              ? "Try changing the search, creator, or selected summary card."
                              : `No claims were found for ${periodLabel}. Choose another day or month.`}

                            {(hasFilters || periodClaims.length === 0) && (
                              <div
                                style={{
                                  marginTop: 14,
                                  display: "flex",
                                  justifyContent: "center",
                                  gap: 8,
                                  flexWrap: "wrap",
                                }}
                              >
                                {hasFilters && (
                                  <button
                                    type="button"
                                    className="ch-button ch-secondary"
                                    onClick={resetFilters}
                                  >
                                    <Icon name="reset" size={15} />
                                    Clear filters
                                  </button>
                                )}

                                <button
                                  type="button"
                                  className="ch-button ch-secondary"
                                  onClick={() => {
                                    setDateMode("day");
                                    setSelectedDate(localDateString());
                                    setSelectedMonth(localMonthString());
                                    resetFilters();
                                  }}
                                >
                                  View today
                                </button>

                                <button
                                  type="button"
                                  className="ch-button ch-secondary"
                                  onClick={() => {
                                    setDateMode("month");
                                    setSelectedMonth(localMonthString());
                                    resetFilters();
                                  }}
                                >
                                  View current month
                                </button>
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
    </div>
  );
}

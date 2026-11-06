import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

/* =========================================================
   HELPERS
========================================================= */

function firstValue(...values) {
  return values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
  );
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getPatientSources(item) {
  if (!isObject(item)) return [];

  const sources = [];
  const visited = new Set();

  const relatedKeys = [
    "patient",
    "patient_details",
    "patient_detail",
    "patient_data",
    "patient_info",
    "patient_record",
    "patient_obj",
    "patient_profile",
    "patient_registration",
    "registration",
    "medical_record",
    "identification",
    "patient_file",
  ];

  function visit(source, depth = 0) {
    if (!isObject(source) || visited.has(source) || depth > 4) return;

    visited.add(source);
    sources.push(source);

    relatedKeys.forEach((key) => {
      if (isObject(source[key])) visit(source[key], depth + 1);
    });
  }

  visit(item);
  return sources;
}

function getPatientName(item) {
  for (const source of getPatientSources(item)) {
    const name = firstValue(
      source.patient_name,
      source.patient_full_name,
      source.full_name,
      source.display_name,
      source.name,
      source.first_name && source.last_name
        ? `${source.first_name} ${source.last_name}`
        : undefined
    );

    if (name !== undefined) return String(name);
  }

  return "Patient";
}

function getFileNumber(item) {
  const fields = [
    "patient_file_id",
    "file_number",
    "file_no",
    "file_num",
    "patient_file_number",
    "medical_record_number",
    "mrn",
    "patient_number",
    "hospital_number",
    "registration_number",
    "fileNumber",
    "patientFileNumber",
  ];

  for (const source of getPatientSources(item)) {
    for (const field of fields) {
      const value = source[field];

      if (value === undefined || value === null || String(value).trim() === "") {
        continue;
      }

      if (isObject(value)) {
        const nested = firstValue(
          value.file_number,
          value.file_no,
          value.number,
          value.value,
          value.label
        );

        if (nested !== undefined) return String(nested);
      } else {
        return String(value);
      }
    }
  }

  return "—";
}

/*
 * Extract the actual patient database ID.
 * Never use the evaluation/assignment ID as a patient ID.
 */
function getPatientId(item) {
  const fields = [
    "patient_id",
    "patientId",
    "patient",
    "patient_details",
    "patient_data",
    "patient_record",
    "patient_obj",
    "patient_profile",
  ];

  for (const field of fields) {
    const value = item?.[field];

    if (isObject(value)) {
      const id = firstValue(value.id, value.pk, value.patient_id);
      if (id !== undefined) return String(id);
    }

    if (
      field === "patient_id" ||
      field === "patientId"
    ) {
      if (value !== undefined && value !== null && value !== "") {
        return String(value);
      }
    }
  }

  for (const source of getPatientSources(item)) {
    if (source === item) continue;

    const id = firstValue(source.id, source.pk);

    if (id !== undefined) return String(id);
  }

  return "";
}

/*
 * Do not use the top-level assignment id as the patient ID.
 */
function getPatientIdentity(item) {
  const patientId = getPatientId(item);

  if (patientId) return `id:${patientId}`;

  const fileNumber = getFileNumber(item);

  if (fileNumber !== "—") {
    return `file:${normalize(fileNumber)}`;
  }

  const name = getPatientName(item);

  if (name !== "Patient") {
    return `name:${normalize(name)}`;
  }

  return null;
}

function getEvaluationDate(item) {
  return (
    firstValue(
      item?.evaluation_date,
      item?.assignment_date,
      item?.date_of_evaluation,
      item?.date_of_eval,
      item?.date,
      item?.created_at
    ) || null
  );
}

function getVisitNumber(item) {
  return (
    firstValue(
      item?.visit_number,
      item?.first_visit_number,
      item?.visit_no,
      item?.session_number
    ) ?? "—"
  );
}

function getPhysician(item) {
  const value = firstValue(
    item?.referring_physician_name,
    item?.referring_physician,
    item?.referring_doctor_name,
    item?.referring_doctor,
    item?.physician_name,
    item?.doctor_name
  );

  if (isObject(value)) return value.name || value.label || "—";

  return value || "—";
}

function getCategory(item) {
  return normalize(
    firstValue(
      item?.category,
      item?.category_label,
      item?.assignment_category,
      item?.assignment_type,
      item?.registration_type,
      item?.visit_type,
      item?.appointment_type,
      item?.type
    )
  );
}

function getRecordTimestamp(item) {
  const value = firstValue(
    item?.assignment_date,
    item?.registration_date,
    item?.created_at,
    item?.evaluation_date,
    item?.date,
    item?.visit_date,
    item?.appointment_date
  );

  if (!value) return 0;

  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getTherapistId(item) {
  const fields = [
    "therapist_id",
    "assigned_therapist_id",
    "physio_id",
    "physiotherapist_id",
    "assigned_to_id",
    "assigned_user_id",
  ];

  for (const source of getPatientSources(item)) {
    for (const field of fields) {
      const value = source[field];

      if (value !== undefined && value !== null && value !== "") {
        return String(value).trim();
      }
    }
  }

  const therapistObjects = [
    item?.therapist,
    item?.assigned_therapist,
    item?.physiotherapist,
    item?.assigned_to,
    item?.assigned_user,
  ];

  for (const therapist of therapistObjects) {
    if (isObject(therapist)) {
      const id = firstValue(
        therapist.id,
        therapist.pk,
        therapist.user_id
      );

      if (id !== undefined) return String(id).trim();
    }
  }

  return "";
}

function getTherapistName(item) {
  const value = firstValue(
    item?.therapist_name,
    item?.assigned_therapist_name,
    item?.physiotherapist_name,
    item?.assigned_to_name,
    item?.assigned_user_name,
    item?.therapist?.username,
    item?.therapist?.name,
    item?.assigned_therapist?.username,
    item?.assigned_therapist?.name,
    item?.physiotherapist?.username,
    item?.physiotherapist?.name,
    item?.assigned_to?.username,
    item?.assigned_to?.name
  );

  return value === undefined ? "" : String(value).trim();
}

function isInitialEvaluation(item) {
  return new Set([
    "initial_evaluation",
    "initial_eval",
    "initial_evaluation_visit",
    "initial_assessment",
    "evaluation",
    "eval",
  ]).has(getCategory(item));
}

function isStartedRegistration(item) {
  const category = getCategory(item);

  return (
    category === "appointment" ||
    category === "walk_in" ||
    category.includes("appointment") ||
    category.includes("walk_in") ||
    category.includes("walkin")
  );
}

/* =========================================================
   STATUS CALCULATION
========================================================= */

/*
 * Patient registration history is fetched separately for each patient.
 * Therefore, records in this history already belong to this patient.
 */
function calculatePatientStatus(evaluation, history = []) {
  const evaluationDate = getRecordTimestamp(evaluation);

  if (!evaluationDate || !Array.isArray(history)) {
    return { label: "Awaiting", type: "pending" };
  }

  const subsequentRecords = history
    .filter((record) => {
      if (!isObject(record)) return false;

      const recordDate = getRecordTimestamp(record);

      return (
        recordDate > evaluationDate &&
        isStartedRegistration(record)
      );
    })
    .sort(
      (a, b) => getRecordTimestamp(a) - getRecordTimestamp(b)
    );

  const nextRecord = subsequentRecords[0];

  if (!nextRecord) {
    return { label: "Awaiting", type: "pending" };
  }

  const evaluationTherapistId = getTherapistId(evaluation);
  const nextTherapistId = getTherapistId(nextRecord);

  const evaluationTherapistName = normalize(
    getTherapistName(evaluation)
  );

  const nextTherapistName = normalize(
    getTherapistName(nextRecord)
  );

  if (evaluationTherapistId && nextTherapistId) {
    if (evaluationTherapistId === nextTherapistId) {
      return { label: "Started", type: "started" };
    }

    const name = getTherapistName(nextRecord);

    return {
      label: name ? `Transferred – ${name}` : "Transferred",
      type: "transferred",
    };
  }

  if (evaluationTherapistName && nextTherapistName) {
    if (evaluationTherapistName === nextTherapistName) {
      return { label: "Started", type: "started" };
    }

    const name = getTherapistName(nextRecord);

    return {
      label: name ? `Transferred – ${name}` : "Transferred",
      type: "transferred",
    };
  }

  return { label: "Awaiting", type: "pending" };
}

/* =========================================================
   FORMATTING
========================================================= */

function formatDate(value) {
  if (!value) return "—";

  const text = String(value);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);

  const date = match
    ? new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3])
      )
    : new Date(value);

  if (Number.isNaN(date.getTime())) return text;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getMonthLabel(month) {
  if (!month) return "Selected month";

  const [year, monthNumber] = month.split("-").map(Number);

  if (!year || !monthNumber) return month;

  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthNumber - 1, 1));
}

function getStatusColors(type) {
  const colors = {
    started: {
      background: "#dcfce7",
      color: "#15803d",
      border: "1px solid #bbf7d0",
    },
    transferred: {
      background: "#f3e8ff",
      color: "#7e22ce",
      border: "1px solid #e9d5ff",
    },
    pending: {
      background: "#fff7ed",
      color: "#c2410c",
      border: "1px solid #fed7aa",
    },
    rejected: {
      background: "#ffe4e6",
      color: "#be123c",
      border: "1px solid #fecdd3",
    },
  };

  return colors[type] || colors.pending;
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({ label, value, percentage, type }) {
  const cardStyles = {
    total: {
      background: "linear-gradient(135deg, #eff6ff, #ffffff)",
      border: "#bfdbfe",
      iconBackground: "#dbeafe",
      iconColor: "#2563eb",
      symbol: "▤",
    },
    started: {
      background: "linear-gradient(135deg, #ecfdf5, #ffffff)",
      border: "#a7f3d0",
      iconBackground: "#d1fae5",
      iconColor: "#059669",
      symbol: "✓",
    },
    transferred: {
      background: "linear-gradient(135deg, #faf5ff, #ffffff)",
      border: "#e9d5ff",
      iconBackground: "#f3e8ff",
      iconColor: "#7c3aed",
      symbol: "⇄",
    },
    pending: {
      background: "linear-gradient(135deg, #fff7ed, #ffffff)",
      border: "#fed7aa",
      iconBackground: "#ffedd5",
      iconColor: "#ea580c",
      symbol: "◷",
    },
    rejected: {
      background: "linear-gradient(135deg, #fff1f2, #ffffff)",
      border: "#fecdd3",
      iconBackground: "#ffe4e6",
      iconColor: "#be123c",
      symbol: "✕",
    },
  };

  const config = cardStyles[type] || cardStyles.total;

  const safePercentage = Math.min(
    Math.max(Number(percentage) || 0, 0),
    100
  );

  return (
    <div
      style={{
        background: config.background,
        border: `1px solid ${config.border}`,
        borderRadius: 16,
        padding: "20px 21px",
        minWidth: 0,
        display: "grid",
        gap: 15,
        boxSizing: "border-box",
        boxShadow: "0 4px 14px rgba(31, 52, 89, 0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              background: config.iconBackground,
              color: config.iconColor,
              display: "grid",
              placeItems: "center",
              fontSize: 25,
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {config.symbol}
          </div>

          <div
            style={{
              color: "#526985",
              fontSize: 13,
              fontWeight: 750,
              lineHeight: 1.4,
            }}
          >
            {label}
          </div>
        </div>

        <span
          style={{
            background: config.iconBackground,
            color: config.iconColor,
            borderRadius: 20,
            padding: "5px 9px",
            fontSize: 11,
            fontWeight: 800,
            whiteSpace: "nowrap",
          }}
        >
          {safePercentage}%
        </span>
      </div>

      <div
        style={{
          fontSize: 32,
          fontWeight: 850,
          lineHeight: 1,
          color: "#17335d",
          letterSpacing: "-0.7px",
        }}
      >
        {value}
      </div>

      <div
        style={{
          height: 5,
          borderRadius: 10,
          background: config.border,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${safePercentage}%`,
            background: config.iconColor,
            borderRadius: 10,
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

/* =========================================================
   ROLE OPTIONS
========================================================= */

export const STATIC_ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "physio", label: "Physiotherapist" },
  { value: "rehab_manager", label: "Rehab Manager" },
  { value: "approvals", label: "Approvals" },
  { value: "reception", label: "Reception" },
  { value: "reception_supervisor", label: "Reception Supervisor" },
  { value: "visitor", label: "Visitor" },
  { value: "visitor_ceo", label: "Visitor CEO" },
  { value: "doctor", label: "Doctor" },
  { value: "rcm", label: "RCM" },
  { value: "callcenter", label: "Call Center" },
  { value: "callcenter_supervisor", label: "Call Center Supervisor" },
];

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function EvaluationTrackerSection({
  assignments = [],
  month = "",
  onMonthChange,
  loading = false,
  error = "",
  onReload,
}) {
  const navigate = useNavigate();

  const safeAssignments = Array.isArray(assignments)
    ? assignments
    : [];

  const [searchTerm, setSearchTerm] = useState("");

  const [patientHistories, setPatientHistories] = useState({});
  const [historyLoading, setHistoryLoading] = useState(false);

  /*
   * Approval status defaults to Pending.
   * If a real approval status is later supplied by the backend,
   * this helper will display it.
   */
  const getApprovalStatus = (item) => {
    const value = firstValue(
      item?.approval_status,
      item?.rcm_approval_status,
      item?.current_approval_status,
      item?.authorization_status
    );

    return value || "Pending";
  };

  const evaluations = useMemo(() => {
    return safeAssignments
      .filter((item) => {
        if (!isInitialEvaluation(item)) return false;

        if (month) {
          const dateValue = getEvaluationDate(item);

          if (!dateValue) return false;

          const text = String(dateValue);
          const match = text.match(/^(\d{4})-(\d{2})/);

          let rowMonth = "";

          if (match) {
            rowMonth = `${match[1]}-${match[2]}`;
          } else {
            const date = new Date(dateValue);

            if (Number.isNaN(date.getTime())) return false;

            rowMonth = `${date.getFullYear()}-${String(
              date.getMonth() + 1
            ).padStart(2, "0")}`;
          }

          if (rowMonth !== month) return false;
        }

        return true;
      })
      .sort(
        (a, b) => getRecordTimestamp(b) - getRecordTimestamp(a)
      );
  }, [safeAssignments, month]);

  /*
   * Fetch registration history directly from each patient's file.
   * This includes registrations made under other physiotherapists.
   */
  const patientIds = useMemo(() => {
    return [
      ...new Set(
        evaluations
          .map((evaluation) => getPatientId(evaluation))
          .filter(Boolean)
      ),
    ];
  }, [evaluations]);

  const loadPatientHistories = useCallback(async () => {
    if (!patientIds.length) {
      setPatientHistories({});
      return;
    }

    setHistoryLoading(true);

    try {
      const results = await Promise.all(
        patientIds.map(async (patientId) => {
          try {
            const response = await api.get(
              `patients/${encodeURIComponent(patientId)}/?months=6`
            );

            const data = response.data || {};

            const history = Array.isArray(data.registration_history)
              ? data.registration_history
              : [];

            return [patientId, history];
          } catch (err) {
            console.error(
              `Unable to load registration history for patient ${patientId}:`,
              err
            );

            return [patientId, null];
          }
        })
      );

      setPatientHistories(Object.fromEntries(results));
    } finally {
      setHistoryLoading(false);
    }
  }, [patientIds]);

  useEffect(() => {
    loadPatientHistories();
  }, [loadPatientHistories]);

  const getHistoryForEvaluation = useCallback(
    (evaluation) => {
      const patientId = getPatientId(evaluation);

      if (!patientId) return [];

      return patientHistories[patientId] || [];
    },
    [patientHistories]
  );

  const getEvaluationStatus = useCallback(
    (evaluation) => {
      const patientId = getPatientId(evaluation);

      if (!patientId) {
        return { label: "Awaiting", type: "pending" };
      }

      const history = patientHistories[patientId];

      if (!Array.isArray(history)) {
        return { label: "Awaiting", type: "pending" };
      }

      return calculatePatientStatus(evaluation, history);
    },
    [patientHistories]
  );

  const statistics = useMemo(() => {
    const counts = {
      total: evaluations.length,
      started: 0,
      transferred: 0,
      pending: 0,
      rejected: 0,
    };

    evaluations.forEach((evaluation) => {
      const status = getEvaluationStatus(evaluation);

      if (status.type === "started") counts.started += 1;
      else if (status.type === "transferred") counts.transferred += 1;
      else if (status.type === "rejected") counts.rejected += 1;
      else counts.pending += 1;
    });

    return counts;
  }, [evaluations, getEvaluationStatus]);

  const filteredEvaluations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return evaluations;

    return evaluations.filter((item) => {
      const status = getEvaluationStatus(item);

      const searchableValues = [
        getPatientName(item),
        getFileNumber(item),
        getVisitNumber(item),
        getPhysician(item),
        formatDate(getEvaluationDate(item)),
        status.label,
        getApprovalStatus(item),
      ];

      return searchableValues.some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      );
    });
  }, [evaluations, searchTerm, getEvaluationStatus]);

  const getPercentage = (value) =>
    statistics.total
      ? Math.round((value / statistics.total) * 1000) / 10
      : 0;

  const openPatientFile = (item) => {
    const patientId = getPatientId(item);

    if (!patientId) {
      window.alert(
        "The patient ID is missing from this evaluation record. The patient file cannot be opened."
      );
      return;
    }

    navigate(`/patients/${encodeURIComponent(patientId)}`);
  };

  const styles = {
    page: {
      background: "linear-gradient(135deg, #f1f5fb 0%, #f8faff 100%)",
      borderRadius: 20,
      padding: 22,
      display: "grid",
      gap: 20,
      minWidth: 0,
      fontFamily: "Inter, Arial, sans-serif",
      color: "#17335d",
      boxSizing: "border-box",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 18,
    },
    teamBadge: {
      display: "inline-flex",
      alignItems: "center",
      padding: "7px 12px",
      borderRadius: 9,
      background: "#e9eaff",
      color: "#5145cd",
      fontSize: 11,
      fontWeight: 850,
      letterSpacing: "0.8px",
      textTransform: "uppercase",
      marginBottom: 12,
    },
    title: {
      margin: 0,
      fontSize: 30,
      fontWeight: 850,
      color: "#142f59",
      letterSpacing: "-0.8px",
    },
    subtitle: {
      margin: "7px 0 0",
      fontSize: 14,
      color: "#7185a5",
      lineHeight: 1.6,
    },
    monthLabel: {
      display: "grid",
      gap: 7,
      color: "#526985",
      fontSize: 12,
      fontWeight: 750,
    },
    monthInput: {
      padding: "11px 13px",
      border: "1px solid #d3dded",
      borderRadius: 11,
      background: "#ffffff",
      color: "#243b63",
      fontSize: 13,
      outline: "none",
      minWidth: 170,
    },
    statsPanel: {
      padding: 12,
      background: "rgba(255,255,255,0.75)",
      border: "1px solid #e4ecfa",
      borderRadius: 18,
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: 14,
    },
    recordsPanel: {
      background: "#ffffff",
      border: "1px solid #e1eaf7",
      borderRadius: 18,
      padding: 22,
      boxShadow: "0 8px 28px rgba(30, 56, 95, 0.055)",
      display: "grid",
      gap: 18,
      minWidth: 0,
    },
    recordsHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 14,
    },
    recordsTitle: {
      margin: 0,
      fontSize: 20,
      fontWeight: 850,
      color: "#17335d",
      letterSpacing: "-0.3px",
    },
    recordsSubtitle: {
      margin: "6px 0 0",
      fontSize: 13,
      color: "#7b8eac",
    },
    toolbar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 12,
    },
    searchWrap: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flex: "1 1 300px",
      maxWidth: 470,
      minWidth: 0,
      padding: "0 13px",
      border: "1px solid #dce5f1",
      borderRadius: 12,
      background: "#f8faff",
      boxSizing: "border-box",
      height: 44,
    },
    searchInput: {
      flex: 1,
      minWidth: 0,
      border: "none",
      outline: "none",
      background: "transparent",
      color: "#243b63",
      fontSize: 13,
      fontFamily: "inherit",
    },
    clearButton: {
      border: "none",
      background: "transparent",
      color: "#7185a5",
      fontSize: 18,
      cursor: "pointer",
      padding: 3,
      lineHeight: 1,
    },
    refreshButton: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: "12px 17px",
      border: "none",
      borderRadius: 11,
      background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
      color: "#ffffff",
      fontSize: 12,
      fontWeight: 800,
      cursor: loading || historyLoading ? "wait" : "pointer",
      opacity: loading || historyLoading ? 0.65 : 1,
      boxShadow: "0 4px 10px rgba(37, 99, 235, 0.18)",
    },
    tableWrap: {
      width: "100%",
      overflowX: "auto",
      border: "1px solid #dce6f3",
      borderRadius: 14,
      background: "#ffffff",
    },
    table: {
      width: "100%",
      minWidth: 1050,
      borderCollapse: "separate",
      borderSpacing: 0,
    },
    th: {
      textAlign: "left",
      padding: "16px 17px",
      background: "linear-gradient(110deg, #203b63, #315b8e)",
      color: "#ffffff",
      fontSize: 10,
      fontWeight: 850,
      textTransform: "uppercase",
      letterSpacing: "0.75px",
      whiteSpace: "nowrap",
      borderBottom: "1px solid #294d7b",
      position: "sticky",
      top: 0,
      zIndex: 1,
    },
    td: {
      padding: "16px 17px",
      color: "#405775",
      fontSize: 12,
      borderBottom: "1px solid #edf2f8",
      verticalAlign: "middle",
    },
    patientName: {
      display: "block",
      color: "#1e3a5f",
      fontWeight: 800,
      fontSize: 13,
      marginBottom: 6,
    },
    fileNumber: {
      display: "inline-block",
      color: "#365d91",
      fontWeight: 750,
      fontSize: 10,
      fontVariantNumeric: "tabular-nums",
      background: "#eff6ff",
      border: "1px solid #dbeafe",
      borderRadius: 7,
      padding: "4px 8px",
      whiteSpace: "nowrap",
    },
    statusBadge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "7px 11px",
      borderRadius: 30,
      fontSize: 11,
      fontWeight: 800,
      whiteSpace: "nowrap",
      maxWidth: 280,
    },
    approvalBadge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "7px 11px",
      borderRadius: 30,
      fontSize: 11,
      fontWeight: 800,
      whiteSpace: "nowrap",
      background: "#fff7ed",
      color: "#c2410c",
      border: "1px solid #fed7aa",
    },
    openFileButton: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      padding: "9px 13px",
      border: "1px solid #c8dcff",
      borderRadius: 9,
      background: "#eff6ff",
      color: "#245fc2",
      fontSize: 11,
      fontWeight: 850,
      cursor: "pointer",
      whiteSpace: "nowrap",
    },
    emptyState: {
      padding: 42,
      borderRadius: 12,
      background: "#f7faff",
      color: "#7185a5",
      textAlign: "center",
      lineHeight: 1.7,
      fontSize: 13,
      border: "1px dashed #d8e3f1",
    },
    error: {
      padding: 14,
      borderRadius: 11,
      background: "#fff1f0",
      border: "1px solid #ffd6d2",
      color: "#b42318",
      fontSize: 13,
    },
    footer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 10,
      color: "#8496b1",
      fontSize: 12,
    },
    resultCount: {
      color: "#526985",
      fontSize: 12,
      fontWeight: 700,
    },
  };

  function renderStatus(item) {
    const status = getEvaluationStatus(item);

    const symbol =
      status.type === "started"
        ? "✓"
        : status.type === "transferred"
        ? "⇄"
        : status.type === "rejected"
        ? "✕"
        : "◷";

    return (
      <span
        style={{
          ...styles.statusBadge,
          ...getStatusColors(status.type),
        }}
        title={`Registration status: ${status.label}`}
      >
        <span aria-hidden="true">{symbol}</span>
        <span>{status.label}</span>
      </span>
    );
  }

  return (
    <section style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.teamBadge}>Physiotherapy</div>

          <h2 style={styles.title}>Evaluation Tracker</h2>

          <p style={styles.subtitle}>
            Track initial evaluations and subsequent patient registrations.
          </p>
        </div>

        <label style={styles.monthLabel}>
          Evaluation Month

          <input
            type="month"
            value={month}
            onChange={(event) =>
              onMonthChange?.(event.target.value)
            }
            style={styles.monthInput}
          />
        </label>
      </div>

      <div style={styles.statsPanel}>
        <div style={styles.statsGrid}>
          <SummaryCard
            label="Total Evaluations"
            value={statistics.total}
            type="total"
            percentage={100}
          />

          <SummaryCard
            label="Started / Registered"
            value={statistics.started}
            type="started"
            percentage={getPercentage(statistics.started)}
          />

          <SummaryCard
            label="Transferred"
            value={statistics.transferred}
            type="transferred"
            percentage={getPercentage(statistics.transferred)}
          />

          <SummaryCard
            label="Awaiting"
            value={statistics.pending}
            type="pending"
            percentage={getPercentage(statistics.pending)}
          />

          <SummaryCard
            label="Rejected"
            value={statistics.rejected}
            type="rejected"
            percentage={getPercentage(statistics.rejected)}
          />
        </div>
      </div>

      {error ? <div style={styles.error}>{error}</div> : null}

      <div style={styles.recordsPanel}>
        <div style={styles.recordsHeader}>
          <div>
            <h3 style={styles.recordsTitle}>Evaluation Records</h3>

            <p style={styles.recordsSubtitle}>
              Showing initial evaluations for {getMonthLabel(month)}.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              onReload?.();
              loadPatientHistories();
            }}
            disabled={loading || historyLoading}
            style={styles.refreshButton}
          >
            <span aria-hidden="true">↻</span>
            {loading || historyLoading
              ? "Refreshing..."
              : "Refresh Evaluations"}
          </button>
        </div>

        <div style={styles.toolbar}>
          <div style={styles.searchWrap}>
            <span
              aria-hidden="true"
              style={{ color: "#7b8eac", fontSize: 17 }}
            >
              ⌕
            </span>

            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search patient, file number, physician..."
              aria-label="Search evaluation records"
              style={styles.searchInput}
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                style={styles.clearButton}
                aria-label="Clear search"
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <span style={styles.resultCount}>
            {filteredEvaluations.length} of {evaluations.length} records
            {historyLoading ? " · Checking patient files..." : ""}
          </span>
        </div>

        {loading ? (
          <div style={styles.emptyState}>
            Loading evaluations...
          </div>
        ) : filteredEvaluations.length === 0 ? (
          <div style={styles.emptyState}>
            {evaluations.length === 0
              ? `No initial evaluations were found for ${getMonthLabel(month)}.`
              : "No matching patients found. Try another search."}
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Patient / File Number</th>
                  <th style={styles.th}>Visit Number</th>
                  <th style={styles.th}>Evaluation Date</th>
                  <th style={styles.th}>Referring Physician</th>
                  <th style={styles.th}>Approval Status</th>
                  <th style={styles.th}>Registration Status</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredEvaluations.map((item, index) => (
                  <tr
                    key={
                      item?.id ??
                      item?.assignment_id ??
                      `${getPatientIdentity(item) || "patient"}-${index}`
                    }
                    style={{
                      background: index % 2 === 0 ? "#ffffff" : "#f8faff",
                    }}
                  >
                    <td style={styles.td}>
                      <span style={styles.patientName}>
                        {getPatientName(item)}
                      </span>

                      <span style={styles.fileNumber}>
                        File: {getFileNumber(item)}
                      </span>
                    </td>

                    <td style={styles.td}>
                      {getVisitNumber(item)}
                    </td>

                    <td style={styles.td}>
                      {formatDate(getEvaluationDate(item))}
                    </td>

                    <td style={styles.td}>
                      {getPhysician(item)}
                    </td>

                    <td style={styles.td}>
                      <span style={styles.approvalBadge}>
                        <span aria-hidden="true">◷</span>
                        {getApprovalStatus(item)}
                      </span>
                    </td>

                    <td style={styles.td}>
                      {renderStatus(item)}
                    </td>

                    <td style={styles.td}>
                      <button
                        type="button"
                        style={styles.openFileButton}
                        onClick={() => openPatientFile(item)}
                      >
                        Open File <span aria-hidden="true">↗</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={styles.footer}>
          <span>
            Showing {filteredEvaluations.length}{" "}
            {filteredEvaluations.length === 1 ? "evaluation" : "evaluations"}
          </span>

          <span>{getMonthLabel(month)}</span>
        </div>
      </div>
    </section>
  );
}
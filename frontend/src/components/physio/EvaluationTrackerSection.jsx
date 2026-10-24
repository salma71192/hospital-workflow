
import React, { useMemo } from "react";

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
    "assignment",
    "data",
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
      source.patient?.name,
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

      if (value !== undefined && value !== null && String(value).trim()) {
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
  }

  return "—";
}

function getPatientIdentity(item) {
  const patientId = firstValue(
    item?.patient_id,
    item?.patient?.id,
    item?.patient?.pk,
    item?.patient?.patient_id
  );

  if (patientId !== undefined) return `id:${String(patientId).trim()}`;

  const fileNumber = getFileNumber(item);
  if (fileNumber !== "—") return `file:${normalize(fileNumber)}`;

  const name = getPatientName(item);
  if (name !== "Patient") return `name:${normalize(name)}`;

  return null;
}

function getEvaluationDate(item) {
  return firstValue(
    item?.evaluation_date,
    item?.assignment_date,
    item?.date_of_evaluation,
    item?.date_of_eval,
    item?.date,
    item?.created_at
  ) || null;
}

function getVisitNumber(item) {
  return firstValue(
    item?.visit_number,
    item?.first_visit_number,
    item?.visit_no,
    item?.session_number
  ) ?? "—";
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

  if (isObject(value)) {
    return value.name || value.label || "—";
  }

  return value || "—";
}

function getSpecialty(item) {
  return firstValue(
    item?.physician_specialty,
    item?.physician_speciality,
    item?.specialty,
    item?.speciality,
    item?.department
  ) || "—";
}

function getCategory(item) {
  return normalize(
    firstValue(
      item?.category,
      item?.category_label,
      item?.assignment_category,
      item?.assignment_type,
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
    item?.date
  );

  if (!value) return 0;

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getTherapistId(item) {
  const value = firstValue(
    item?.therapist_id,
    item?.assigned_therapist_id,
    item?.physio_id,
    item?.physiotherapist_id,
    item?.therapist?.id
  );

  return value === undefined ? "" : String(value);
}

function getTherapistName(item) {
  const value = firstValue(
    item?.therapist_name,
    item?.assigned_therapist_name,
    item?.physiotherapist_name,
    item?.therapist?.username,
    item?.therapist?.name
  );

  return value === undefined ? "" : String(value);
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

  // These are the actual assignment category values in the backend.
  return category === "appointment" || category === "walk_in";
}

function calculatePatientStatus(evaluation, history) {
  const evaluationDate = getRecordTimestamp(evaluation);
  const evaluationTherapistId = getTherapistId(evaluation);

  const laterRecords = history
    .filter((record) => {
      if (getPatientIdentity(record) !== getPatientIdentity(evaluation)) {
        return false;
      }

      // Only consider records on or after the evaluation date.
      return getRecordTimestamp(record) >= evaluationDate;
    })
    .sort((a, b) => getRecordTimestamp(a) - getRecordTimestamp(b));

  if (laterRecords.length === 0) {
    return { label: "Pending", type: "pending" };
  }

  // A later appointment or walk-in registration means treatment has started.
  const startedRecord = laterRecords
    .filter(isStartedRegistration)
    .sort((a, b) => getRecordTimestamp(b) - getRecordTimestamp(a))[0];

  if (!startedRecord) {
    return { label: "Pending", type: "pending" };
  }

  // A different therapist on a later qualifying registration indicates transfer.
  const startedTherapistId = getTherapistId(startedRecord);

  const differentTherapistRecord = laterRecords
    .filter((record) => {
      if (!isStartedRegistration(record)) return false;

      const therapistId = getTherapistId(record);

      return (
        therapistId &&
        evaluationTherapistId &&
        therapistId !== evaluationTherapistId
      );
    })
    .sort((a, b) => getRecordTimestamp(b) - getRecordTimestamp(a))[0];

  if (differentTherapistRecord) {
    const therapistName = getTherapistName(differentTherapistRecord);

    return {
      label: therapistName
        ? `Transferred – ${therapistName}`
        : "Transferred",
      type: "transferred",
    };
  }

  // If the patient started with the evaluating therapist, show Started.
  if (
    !evaluationTherapistId ||
    !startedTherapistId ||
    startedTherapistId === evaluationTherapistId
  ) {
    return { label: "Started", type: "started" };
  }

  return { label: "Pending", type: "pending" };
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

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
      background: "#dff7ec",
      color: "#08784f",
      border: "1px solid #c4efdf",
    },
    transferred: {
      background: "#fff0d9",
      color: "#a85b00",
      border: "1px solid #ffe1ad",
    },
    pending: {
      background: "#f1e6ff",
      color: "#7928ca",
      border: "1px solid #e6d2ff",
    },
    rejected: {
      background: "#ffe4e6",
      color: "#be123c",
      border: "1px solid #fecdd3",
    },
  };

  return colors[type] || colors.pending;
}

function SummaryCard({ label, value, percentage, type }) {
  const cardStyles = {
    total: {
      background: "linear-gradient(135deg, #f0f6ff, #ffffff)",
      border: "#cfe1ff",
      iconBackground: "#dceaff",
      iconColor: "#2563eb",
      symbol: "▤",
    },
    started: {
      background: "linear-gradient(135deg, #effcf7, #ffffff)",
      border: "#bceedd",
      iconBackground: "#d8f7eb",
      iconColor: "#059669",
      symbol: "✓",
    },
    transferred: {
      background: "linear-gradient(135deg, #fff8ed, #ffffff)",
      border: "#ffdfad",
      iconBackground: "#ffedcf",
      iconColor: "#d97706",
      symbol: "⇄",
    },
    pending: {
      background: "linear-gradient(135deg, #f8f2ff, #ffffff)",
      border: "#e4d1ff",
      iconBackground: "#ebdcff",
      iconColor: "#7c3aed",
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
        boxShadow: "0 4px 14px rgba(31, 52, 89, 0.025)",
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

export default function EvaluationTrackerSection({
  assignments = [],
  month = "",
  onMonthChange,
  loading = false,
  error = "",
  onReload,
}) {
  const safeAssignments = Array.isArray(assignments) ? assignments : [];

  const evaluations = useMemo(() => {
    return safeAssignments
      .filter((item) => {
        if (!isInitialEvaluation(item)) return false;

        if (month) {
          const dateValue = getEvaluationDate(item);
          if (!dateValue) return false;

          const date = new Date(dateValue);
          if (Number.isNaN(date.getTime())) return false;

          const rowMonth = `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, "0")}`;

          if (rowMonth !== month) return false;
        }

        return true;
      })
      .sort(
        (a, b) => getRecordTimestamp(b) - getRecordTimestamp(a)
      );
  }, [safeAssignments, month]);

  const statistics = useMemo(() => {
    const counts = {
      total: evaluations.length,
      started: 0,
      transferred: 0,
      pending: 0,
      rejected: 0,
    };

    evaluations.forEach((evaluation) => {
      const status = calculatePatientStatus(evaluation, safeAssignments);

      if (status.type === "started") counts.started += 1;
      else if (status.type === "transferred") counts.transferred += 1;
      else if (status.type === "rejected") counts.rejected += 1;
      else counts.pending += 1;
    });

    return counts;
  }, [evaluations, safeAssignments]);

  const getPercentage = (value) =>
    statistics.total
      ? Math.round((value / statistics.total) * 1000) / 10
      : 0;

  const styles = {
    page: {
      background: "linear-gradient(135deg, #f0f5fc 0%, #f8faff 100%)",
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
      background: "#eee5ff",
      color: "#7029d8",
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
      border: "1px solid #d3ddff",
      borderRadius: 11,
      background: "#ffffff",
      color: "#243b63",
      fontSize: 13,
      outline: "none",
      minWidth: 170,
    },
    statsPanel: {
      padding: 12,
      background: "rgba(255,255,255,0.68)",
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
      boxShadow: "0 7px 24px rgba(30, 56, 95, 0.045)",
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
    refreshButton: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: "12px 17px",
      border: "none",
      borderRadius: 11,
      background: "linear-gradient(135deg, #10b981, #059669)",
      color: "#ffffff",
      fontSize: 12,
      fontWeight: 800,
      cursor: loading ? "wait" : "pointer",
      opacity: loading ? 0.65 : 1,
    },
    tableWrap: {
      width: "100%",
      overflowX: "auto",
      border: "1px solid #e5edf8",
      borderRadius: 13,
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
      padding: "15px 16px",
      background: "#f0f5fc",
      color: "#607696",
      fontSize: 10,
      fontWeight: 850,
      textTransform: "uppercase",
      letterSpacing: "0.45px",
      whiteSpace: "nowrap",
      borderBottom: "1px solid #e2eaf5",
    },
    td: {
      padding: "15px 16px",
      color: "#3c5477",
      fontSize: 12,
      borderBottom: "1px solid #edf2f9",
      verticalAlign: "middle",
    },
    patientName: {
      color: "#203c65",
      fontWeight: 750,
      whiteSpace: "nowrap",
    },
    fileNumber: {
      color: "#456184",
      fontWeight: 750,
      fontVariantNumeric: "tabular-nums",
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
    emptyState: {
      padding: 38,
      borderRadius: 12,
      background: "#f7faff",
      color: "#7185a5",
      textAlign: "center",
      lineHeight: 1.7,
      fontSize: 13,
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
  };

  function renderStatus(item) {
    const status = calculatePatientStatus(item, safeAssignments);
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
            onChange={(event) => onMonthChange?.(event.target.value)}
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
            label="Pending"
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

          {onReload && (
            <button
              type="button"
              onClick={onReload}
              disabled={loading}
              style={styles.refreshButton}
            >
              <span aria-hidden="true">↻</span>
              {loading ? "Refreshing..." : "Refresh Evaluations"}
            </button>
          )}
        </div>

        {loading ? (
          <div style={styles.emptyState}>Loading evaluations...</div>
        ) : evaluations.length === 0 ? (
          <div style={styles.emptyState}>
            No initial evaluations were found for {getMonthLabel(month)}.
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>File Number</th>
                  <th style={styles.th}>Visit Number</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Referring Physician</th>
                  <th style={styles.th}>Specialty</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>

              <tbody>
                {evaluations.map((item, index) => (
                  <tr key={item?.id ?? item?.assignment_id ?? `${getPatientIdentity(item) || "patient"}-${index}`}>
                    <td style={styles.td}>
                      <span style={styles.patientName}>
                        {getPatientName(item)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.fileNumber}>
                        {getFileNumber(item)}
                      </span>
                    </td>
                    <td style={styles.td}>{getVisitNumber(item)}</td>
                    <td style={styles.td}>
                      {formatDate(getEvaluationDate(item))}
                    </td>
                    <td style={styles.td}>{getPhysician(item)}</td>
                    <td style={styles.td}>{getSpecialty(item)}</td>
                    <td style={styles.td}>{renderStatus(item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={styles.footer}>
          <span>
            Showing {evaluations.length}{" "}
            {evaluations.length === 1 ? "evaluation" : "evaluations"}
          </span>
          <span>{getMonthLabel(month)}</span>
        </div>
      </div>
    </section>
  );
}

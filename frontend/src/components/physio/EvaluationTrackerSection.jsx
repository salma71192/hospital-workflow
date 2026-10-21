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
function getPatientObject(item) {
  if (!isObject(item)) return {};
  const possiblePatients = [
    item.patient,
    item.patient_details,
    item.patient_detail,
    item.patient_data,
    item.patient_info,
    item.patient_record,
    item.patient_obj,
    item.patient_profile,
    item.patient_registration,
    item.patient_registration_details,
    item.patient_details_data,
    item.registration,
    item.patient?.patient,
    item.data?.patient,
    item.data?.patient_details,
    item.assignment?.patient,
    item.patient_assignment?.patient,
  ];
  return possiblePatients.find(isObject) || {};
}
/**
 * Collects possible patient and assignment objects from common API formats.
 * Scalar IDs are deliberately excluded.
 */
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
    "patient_registration_details",
    "patient_details_data",
    "registration",
    "patient_assignment",
    "assignment",
    "data",
    "patient_details_object",
    "patient_identification",
    "medical_record",
    "identification",
  ];
  function visit(source, depth = 0) {
    if (!isObject(source) || visited.has(source) || depth > 4) return;
    visited.add(source);
    sources.push(source);
    relatedKeys.forEach((key) => {
      if (isObject(source[key])) {
        visit(source[key], depth + 1);
      }
    });
  }
  visit(item);
  return sources;
}
function getPatientName(item) {
  const sources = getPatientSources(item);
  for (const source of sources) {
    const fullName = firstValue(
      source.first_name && source.last_name
        ? `${source.first_name} ${source.last_name}`
        : undefined,
      source.firstName && source.lastName
        ? `${source.firstName} ${source.lastName}`
        : undefined
    );
    const name = firstValue(
      source.patient_name,
      source.patient_full_name,
      source.full_name,
      source.fullName,
      source.display_name,
      source.displayName,
      source.name,
      fullName
    );
    if (name !== undefined) return String(name);
  }
  return "Patient";
}
/**
 * Extracts the actual patient file number from the API response.
 * Never substitutes patient.id, patient.pk, or assignment.id.
 */
function getFileNumber(item) {
  const sources = getPatientSources(item);
  const fileNumberFields = [
    "file_number",
    "file_no",
    "file_num",
    "file_number_display",
    "patient_file_number",
    "patient_file_no",
    "patient_file_num",
    "medical_file_number",
    "medical_file_no",
    "medical_record_number",
    "medical_record_no",
    "medical_record",
    "mrn",
    "patient_mrn",
    "patient_number",
    "patient_no",
    "patient_code",
    "hospital_number",
    "hospital_no",
    "registration_number",
    "registration_no",
    "record_number",
    "record_no",
    "chart_number",
    "chart_no",
    "health_record_number",
    "health_record_no",
    "clinic_file_number",
    "clinic_file_no",
    "emr_number",
    "emr_no",
    "fileNumber",
    "fileNo",
    "fileNum",
    "medicalFileNumber",
    "medicalFileNo",
    "medicalRecordNumber",
    "medicalRecordNo",
    "patientFileNumber",
    "patientFileNo",
    "patientNumber",
    "patientNo",
    "patientCode",
    "hospitalNumber",
    "hospitalNo",
    "registrationNumber",
    "registrationNo",
    "recordNumber",
    "recordNo",
    "chartNumber",
    "chartNo",
    "healthRecordNumber",
    "clinicFileNumber",
    "emrNumber",
  ];
  const nestedNumberFields = [
    "file_number",
    "file_no",
    "patient_file_number",
    "medical_record_number",
    "medical_file_number",
    "mrn",
    "number",
    "value",
    "label",
    "display",
    "text",
  ];
  function extractNumber(value, depth = 0) {
    if (value === undefined || value === null || depth > 3) {
      return undefined;
    }
    if (typeof value === "string" || typeof value === "number") {
      const text = String(value).trim();
      return text ? text : undefined;
    }
    if (isObject(value)) {
      for (const field of nestedNumberFields) {
        if (value[field] === undefined || value[field] === null) {
          continue;
        }
        const extracted = extractNumber(value[field], depth + 1);
        if (extracted !== undefined) return extracted;
      }
    }
    return undefined;
  }
  for (const source of sources) {
    for (const field of fileNumberFields) {
      if (source[field] === undefined || source[field] === null) {
        continue;
      }
      const extracted = extractNumber(source[field]);
      if (extracted !== undefined) return extracted;
    }
  }
  const patient = getPatientObject(item);
  const nestedSources = [
    patient.registration,
    patient.patient_registration,
    patient.patient_profile,
    patient.medical_record,
    patient.identification,
    patient.patient_identification,
    patient.file,
    item?.registration,
    item?.patient_registration,
    item?.patient_profile,
    item?.medical_record,
    item?.identification,
    item?.data?.patient,
    item?.data?.patient_details,
  ];
  for (const source of nestedSources) {
    if (!isObject(source)) continue;
    for (const field of fileNumberFields) {
      if (source[field] === undefined || source[field] === null) {
        continue;
      }
      const extracted = extractNumber(source[field]);
      if (extracted !== undefined) return extracted;
    }
  }
  return "—";
}
function getEvaluationDate(item) {
  return (
    firstValue(
      item?.evaluation_date,
      item?.assignment_date,
      item?.date,
      item?.registration_date,
      item?.created_at
    ) ?? null
  );
}
/**
 * Supports several common API field names for visit number.
 */
function getVisitNumber(item) {
  const sources = getPatientSources(item);
  for (const source of sources) {
    const visitNumber = firstValue(
      source.visit_number,
      source.first_visit_number,
      source.visit_no,
      source.session_number,
      source.visitNumber,
      source.firstVisitNumber,
      source.visitNo,
      source.sessionNumber
    );
    if (visitNumber !== undefined) return visitNumber;
  }
  return "—";
}
function getPhysician(item) {
  const sources = getPatientSources(item);
  for (const source of sources) {
    const physician = firstValue(
      source.referring_physician,
      source.physician_name,
      source.doctor_name,
      source.referring_doctor,
      source.physician?.name,
      source.doctor?.name
    );
    if (physician !== undefined) return physician;
  }
  return "—";
}
function getSpecialty(item) {
  const sources = getPatientSources(item);
  for (const source of sources) {
    const specialty = firstValue(
      source.specialty,
      source.speciality,
      source.physician_specialty,
      source.physician_speciality,
      source.referring_physician_specialty,
      source.physician?.specialty,
      source.physician?.speciality,
      source.doctor?.specialty,
      source.doctor?.speciality
    );
    if (specialty !== undefined) return specialty;
  }
  return "—";
}
function getStatus(item) {
  const rawStatus = String(
    firstValue(
      item?.follow_up_status,
      item?.status,
      item?.appointment_status,
      item?.registration_status
    ) ?? ""
  ).trim();
  if (!rawStatus) return "Pending";
  const normalized = rawStatus.toLowerCase();
  if (
    normalized.includes("not started") ||
    normalized.includes("did not start") ||
    normalized.includes("pending")
  ) {
    return "Pending";
  }
  if (
    normalized.includes("transfer") ||
    normalized.includes("another therapist")
  ) {
    const therapist =
      firstValue(
        item?.follow_up_therapist_name,
        item?.other_therapist_name,
        item?.treatment_therapist_name
      ) ?? "";
    return therapist ? `Transferred – ${therapist}` : "Transferred";
  }
  if (
    normalized === "started" ||
    normalized.includes("started with evaluating therapist")
  ) {
    return "Started";
  }
  return rawStatus;
}
function getStatusType(status) {
  const normalized = String(status).toLowerCase();
  if (normalized === "started") return "started";
  if (normalized.includes("transfer")) return "transferred";
  return "pending";
}
function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            minWidth: 0,
          }}
        >
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
/**
 * Static role options.
 * Include "Rehab Manager" as a physiotherapy role.
 *
 * If your app uses a separate role dropdown or backend role list,
 * add "rehab_manager" to that source as well.
 */
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
  const evaluations = useMemo(() => {
    const evaluationCategories = [
      "initial_evaluation",
      "initial_eval",
      "evaluation",
      "eval",
    ];
    const safeAssignments = Array.isArray(assignments)
      ? assignments
      : [];
    return safeAssignments
      .filter((item) => {
        const category = String(
          item?.category ??
            item?.category_label ??
            item?.assignment_category ??
            ""
        )
          .trim()
          .toLowerCase()
          .replace(/[\s-]+/g, "_");
        return evaluationCategories.includes(category);
      })
      .sort((a, b) =>
        String(getEvaluationDate(b) ?? "").localeCompare(
          String(getEvaluationDate(a) ?? "")
        )
      );
  }, [assignments]);
  const statistics = useMemo(() => {
    const counts = {
      total: evaluations.length,
      started: 0,
      transferred: 0,
      pending: 0,
    };
    evaluations.forEach((item) => {
      const type = getStatusType(getStatus(item));
      if (type === "started") {
        counts.started += 1;
      } else if (type === "transferred") {
        counts.transferred += 1;
      } else {
        counts.pending += 1;
      }
    });
    return counts;
  }, [evaluations]);
  const getPercentage = (value) => {
    if (!statistics.total) return 0;
    return Math.round((value / statistics.total) * 1000) / 10;
  };
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
      boxShadow: "0 2px 6px rgba(41, 65, 130, 0.03)",
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
      boxShadow: "0 5px 12px rgba(5, 150, 105, 0.15)",
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
    const status = getStatus(item);
    const type = getStatusType(status);
    const symbol =
      type === "started" ? "✓" : type === "transferred" ? "⇄" : "◷";
    return (
      <span
        style={{
          ...styles.statusBadge,
          ...getStatusColors(type),
        }}
        title={status}
      >
        <span aria-hidden="true">{symbol}</span>
        <span>{status}</span>
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
            Track initial evaluations and patient follow-up status.
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
            label="Started"
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
                  <th style={styles.th}>Date of Eval</th>
                  <th style={styles.th}>Patient Name</th>
                  <th style={styles.th}>File Number</th>
                  <th style={styles.th}>Visit Number</th>
                  <th style={styles.th}>Referring Physician</th>
                  <th style={styles.th}>Specialty</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {evaluations.map((item, index) => (
                  <tr
                    key={
                      item?.id ??
                      item?.assignment_id ??
                      `${getFileNumber(item)}-${index}`
                    }
                  >
                    <td style={styles.td}>
                      {formatDate(getEvaluationDate(item))}
                    </td>
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
                    <td style={styles.td}>
                      {getVisitNumber(item)}
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
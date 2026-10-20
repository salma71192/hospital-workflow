
import React, { useMemo } from "react";

function firstValue(...values) {
  return values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
  );
}

function getPatientName(item) {
  return (
    firstValue(
      item?.patient_name,
      item?.patient?.name,
      item?.patient?.full_name,
      item?.patient_full_name,
      item?.full_name
    ) ?? "Patient"
  );
}

/**
 * File number is different from the database patient ID.
 * Check the patient object and common file/MRN fields first.
 */
function getFileNumber(item) {
  const patient = item?.patient;

  const value = firstValue(
    patient?.file_number,
    patient?.file_no,
    patient?.medical_file_number,
    patient?.medical_record_number,
    patient?.mrn,
    patient?.patient_file_number,
    patient?.patient_number,
    patient?.fileNumber,
    patient?.fileNo,
    patient?.medicalRecordNumber,
    patient?.record_number,
    patient?.chart_number,

    item?.patient_file_number,
    item?.patient_file_no,
    item?.patient_medical_file_number,
    item?.patient_medical_record_number,
    item?.patient_mrn,
    item?.file_number,
    item?.file_no,
    item?.medical_file_number,
    item?.medical_record_number,
    item?.mrn,
    item?.patient_number,
    item?.fileNumber,
    item?.fileNo,
    item?.chart_number
  );

  return value ?? "—";
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
  return (
    firstValue(
      item?.referring_physician,
      item?.physician_name,
      item?.doctor_name,
      item?.referring_doctor,
      item?.physician?.name,
      item?.doctor?.name
    ) ?? "—"
  );
}

function getSpecialty(item) {
  return (
    firstValue(
      item?.specialty,
      item?.speciality,
      item?.physician_specialty,
      item?.physician_speciality,
      item?.referring_physician_specialty,
      item?.physician?.specialty,
      item?.physician?.speciality,
      item?.doctor?.specialty,
      item?.doctor?.speciality
    ) ?? "—"
  );
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

  // Not Started and all other unrecognized statuses are grouped as Pending.
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

  const config = cardStyles[type];
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

    return assignments
      .filter((item) => {
        const category = String(
          item?.category ?? item?.category_label ?? ""
        )
          .trim()
          .toLowerCase()
          .replace(/[\s-]+/g, "_");

        return evaluationCategories.includes(category);
      })
      .sort((a, b) => {
        return String(getEvaluationDate(b) ?? "").localeCompare(
          String(getEvaluationDate(a) ?? "")
        );
      });
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

                    <td style={styles.td}>{getVisitNumber(item)}</td>

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

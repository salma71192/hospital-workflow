
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function PatientTrackerTable({
  patients = [],
  title = "Patient Tracker",
  monthLabel = "",
  selectedMonth = "",
  onMonthChange,
}) {
  const navigate = useNavigate();

  const getValue = (row, keys, fallback = "") => {
    for (const key of keys) {
      const value = row?.[key];

      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }

    return fallback;
  };

  const getNumber = (row, keys) => {
    const value = getValue(row, keys, 0);
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  };

  // Only walk-ins and appointments count toward utilized sessions.
  const getUtilizedSessions = (row) => {
    const walkIns = getNumber(row, [
      "walk_in_sessions",
      "walkin_sessions",
      "walk_in_count",
      "walkin_count",
      "utilized_walk_ins",
    ]);

    const appointments = getNumber(row, [
      "appointment_sessions",
      "appointments_utilized",
      "utilized_appointments",
      "appointment_count",
    ]);

    const hasSeparateCounts = [
      "walk_in_sessions",
      "walkin_sessions",
      "walk_in_count",
      "walkin_count",
      "utilized_walk_ins",
      "appointment_sessions",
      "appointments_utilized",
      "utilized_appointments",
      "appointment_count",
    ].some((key) => row?.[key] !== undefined && row?.[key] !== null);

    if (hasSeparateCounts) {
      return walkIns + appointments;
    }

    return getNumber(row, [
      "qualifying_utilized_sessions",
      "walkin_appointment_sessions",
    ]);
  };

  const getActivityStatus = (sessions) => {
    if (sessions <= 0) return "Inactive";
    if (sessions <= 2) return "Low";
    if (sessions <= 5) return "Moderate";
    return "High";
  };

  const getTherapist = (row) =>
    getValue(
      row,
      [
        "last_treated_by_name",
        "last_therapist_name",
        "latest_therapist_name",
        "current_therapist_name",
        "therapist_name",
        "physiotherapist_name",
        "therapist",
      ],
      "Not assigned"
    );

  const formatDate = (value) => {
    if (!value) return "-";

    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (match) {
      return `${match[3]}/${match[2]}/${match[1]}`;
    }

    return value;
  };

  const getStatusColors = (status) => {
    switch (status) {
      case "High":
        return {
          background: "#dcfce7",
          color: "#166534",
          dot: "#16a34a",
        };
      case "Moderate":
        return {
          background: "#dbeafe",
          color: "#1d4ed8",
          dot: "#2563eb",
        };
      case "Low":
        return {
          background: "#fef3c7",
          color: "#92400e",
          dot: "#d97706",
        };
      default:
        return {
          background: "#f1f5f9",
          color: "#475569",
          dot: "#94a3b8",
        };
    }
  };

  const summary = useMemo(() => {
    const rows = patients.map((patient) => ({
      sessions: getUtilizedSessions(patient),
    }));

    const active = rows.filter((row) => row.sessions > 0).length;
    const totalSessions = rows.reduce(
      (sum, row) => sum + row.sessions,
      0
    );

    const inactive = rows.length - active;

    return {
      totalPatients: rows.length,
      activePatients: active,
      inactivePatients: inactive,
      totalSessions,
    };
  }, [patients]);

  const getInitials = (name) => {
    const words = String(name).trim().split(/\s+/).filter(Boolean);

    if (!words.length) return "?";

    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const renderSummaryIcon = (type) => {
    const common = {
      width: 22,
      height: 22,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.8,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": true,
    };

    if (type === "patients") {
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="10" cy="7" r="4" />
          <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    }

    if (type === "active") {
      return (
        <svg {...common}>
          <path d="M20 6 9 17l-5-5" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
    }

    if (type === "sessions") {
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18M8 14h3M8 17h6" />
        </svg>
      );
    }

    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
    );
  };

  const summaryCards = [
    {
      label: "Total Patients",
      value: summary.totalPatients,
      type: "patients",
      color: "#2563eb",
      background: "#eff6ff",
    },
    {
      label: "Active Patients",
      value: summary.activePatients,
      type: "active",
      color: "#059669",
      background: "#ecfdf5",
    },
    {
      label: "Utilized Sessions",
      value: summary.totalSessions,
      type: "sessions",
      color: "#7c3aed",
      background: "#f5f3ff",
    },
    {
      label: "Inactive Patients",
      value: summary.inactivePatients,
      type: "inactive",
      color: "#d97706",
      background: "#fffbeb",
    },
  ];

  return (
    <section style={styles.page}>
      <div style={styles.card}>
        {/* Main heading */}
        <div style={styles.header}>
          <div style={styles.headingContent}>
            <div style={styles.eyebrow}>PATIENT MANAGEMENT</div>

            <h2 style={styles.title}>{title}</h2>

            <p style={styles.subtitle}>
              Track patient activity, utilized sessions, and follow-up
              status.
            </p>
          </div>

          <div style={styles.headerRight}>
            {onMonthChange && (
              <label style={styles.monthFilter}>
                <span style={styles.monthLabel}>Reporting Month</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(event) =>
                    onMonthChange(event.target.value)
                  }
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
        </div>

        {/* Summary cards */}
        <div style={styles.summaryGrid}>
          {summaryCards.map((item) => (
            <div
              key={item.label}
              style={styles.summaryCard}
            >
              <div
                style={{
                  ...styles.summaryIcon,
                  color: item.color,
                  background: item.background,
                }}
              >
                {renderSummaryIcon(item.type)}
              </div>

              <div style={styles.summaryContent}>
                <div style={styles.summaryLabel}>{item.label}</div>
                <div style={styles.summaryValue}>
                  {item.value.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Table heading */}
        <div style={styles.tableHeading}>
          <div>
            <h3 style={styles.tableTitle}>Patient Records</h3>
            <p style={styles.tableSubtitle}>
              Individual patient follow-up information
            </p>
          </div>

          <span style={styles.recordCount}>
            {patients.length}{" "}
            {patients.length === 1 ? "record" : "records"}
          </span>
        </div>

        {/* Patient table */}
        {patients.length > 0 ? (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Patient</th>
                  <th style={styles.th}>File Number</th>
                  <th style={styles.th}>Utilized Sessions</th>
                  <th style={styles.th}>Last Seen</th>
                  <th style={styles.th}>Therapist</th>
                  <th style={styles.th}>Activity Status</th>
                  <th style={styles.th}>Speciality</th>
                </tr>
              </thead>

              <tbody>
                {patients.map((row, index) => {
                  const utilizedSessions = getUtilizedSessions(row);
                  const activityStatus =
                    getActivityStatus(utilizedSessions);
                  const statusColors = getStatusColors(activityStatus);

                  const patientName = getValue(
                    row,
                    ["name", "patient_name", "full_name"],
                    "Unnamed patient"
                  );

                  const fileNumber = getValue(
                    row,
                    [
                      "file_number",
                      "file_no",
                      "medical_record_number",
                      "mrn",
                      "patient_id",
                    ],
                    "-"
                  );

                  const lastSeen = getValue(
                    row,
                    [
                      "latest_seen_date",
                      "last_seen_date",
                      "last_session_date",
                      "last_visit_date",
                    ],
                    ""
                  );

                  const speciality = getValue(
                    row,
                    [
                      "speciality",
                      "specialty",
                      "speciality_name",
                      "specialty_name",
                    ],
                    "-"
                  );

                  const patientId = getValue(row, ["id"], null);

                  const progress = Math.min(
                    (utilizedSessions / 6) * 100,
                    100
                  );

                  return (
                    <tr
                      key={patientId ?? `${fileNumber}-${index}`}
                      style={styles.tr}
                    >
                      <td style={styles.td}>
                        <div style={styles.patientCell}>
                          <div style={styles.avatar}>
                            {getInitials(patientName)}
                          </div>

                          <div style={styles.patientInfo}>
                            <span style={styles.patientName}>
                              {patientName}
                            </span>
                            <span style={styles.patientCaption}>
                              Patient
                            </span>
                          </div>
                        </div>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.fileNumber}>
                          {fileNumber}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <div style={styles.sessionsCell}>
                          <span style={styles.sessionCount}>
                            {utilizedSessions}
                          </span>

                          <div style={styles.progressTrack}>
                            <div
                              style={{
                                ...styles.progressFill,
                                width: `${progress}%`,
                                background:
                                  utilizedSessions > 5
                                    ? "#059669"
                                    : utilizedSessions > 2
                                      ? "#3b82f6"
                                      : utilizedSessions > 0
                                        ? "#d97706"
                                        : "#cbd5e1",
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.dateText}>
                          {formatDate(lastSeen)}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.therapistText}>
                          {getTherapist(row)}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            background: statusColors.background,
                            color: statusColors.color,
                          }}
                        >
                          <span
                            style={{
                              ...styles.statusDot,
                              background: statusColors.dot,
                            }}
                          />
                          {activityStatus}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <div style={styles.specialityCell}>
                          <span style={styles.specialityText}>
                            {speciality}
                          </span>

                          {patientId && (
                            <button
                              type="button"
                              style={styles.openButton}
                              onClick={() =>
                                navigate(`/patients/${patientId}`)
                              }
                            >
                              Open File
                              <span aria-hidden="true"> ↗</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              {renderSummaryIcon("patients")}
            </div>

            <h3 style={styles.emptyTitle}>No patients found</h3>

            <p style={styles.emptyText}>
              There are no patient records to display for this selection.
              Try selecting another month or adjusting your filters.
            </p>
          </div>
        )}

        <div style={styles.footer}>
          <div style={styles.footerDot} />
          <span>
            Activity status is based on qualifying utilized sessions.
            Only walk-ins and appointments are counted.
          </span>
        </div>
      </div>
    </section>
  );
}

const styles = {
  page: {
    width: "100%",
    minWidth: 0,
    fontFamily: "Inter, Arial, sans-serif",
    color: "#10243e",
  },

  card: {
    display: "grid",
    gap: 24,
    minWidth: 0,
    padding: "clamp(16px, 2.5vw, 26px)",
    background: "#ffffff",
    border: "1px solid #e1eaf4",
    borderRadius: 20,
    boxShadow: "0 8px 28px rgba(15, 23, 42, 0.05)",
  },

  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 20,
    paddingBottom: 20,
    borderBottom: "1px solid #edf2f7",
  },

  headingContent: {
    flex: "1 1 280px",
    minWidth: 0,
  },

  eyebrow: {
    marginBottom: 8,
    color: "#07856f",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "1.2px",
  },

  title: {
    margin: 0,
    color: "#10243e",
    fontSize: "clamp(21px, 2.5vw, 27px)",
    fontWeight: 800,
    lineHeight: 1.3,
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#718096",
    fontSize: 13,
    lineHeight: 1.6,
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

  monthLabel: {
    color: "#52647a",
    fontSize: 11,
    fontWeight: 800,
  },

  monthInput: {
    width: "100%",
    boxSizing: "border-box",
    minHeight: 42,
    padding: "9px 12px",
    border: "1px solid #d5e0ec",
    borderRadius: 10,
    background: "#ffffff",
    color: "#243b53",
    fontSize: 13,
    fontFamily: "inherit",
  },

  monthBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    minHeight: 22,
    padding: "9px 12px",
    borderRadius: 999,
    border: "1px solid #ccefe0",
    background: "#e9f9f1",
    color: "#08784f",
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  monthBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#10b981",
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
    padding: "18px 16px",
    border: "1px solid #e8eef5",
    borderRadius: 15,
    background: "#ffffff",
    boxShadow: "0 3px 10px rgba(15, 23, 42, 0.025)",
  },

  summaryIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 46,
    height: 46,
    flexShrink: 0,
    borderRadius: 13,
  },

  summaryContent: {
    display: "grid",
    gap: 5,
    minWidth: 0,
  },

  summaryLabel: {
    color: "#718096",
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1.4,
  },

  summaryValue: {
    color: "#10243e",
    fontSize: 25,
    fontWeight: 850,
    lineHeight: 1.1,
    fontVariantNumeric: "tabular-nums",
  },

  tableHeading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },

  tableTitle: {
    margin: 0,
    color: "#10243e",
    fontSize: 19,
    fontWeight: 800,
  },

  tableSubtitle: {
    margin: "5px 0 0",
    color: "#718096",
    fontSize: 12,
    lineHeight: 1.5,
  },

  recordCount: {
    padding: "8px 12px",
    borderRadius: 999,
    background: "#eff6ff",
    border: "1px solid #dbeafe",
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  tableWrap: {
    width: "100%",
    minWidth: 0,
    overflowX: "auto",
    border: "1px solid #e3eaf2",
    borderRadius: 14,
    background: "#ffffff",
  },

  table: {
    width: "100%",
    minWidth: 1000,
    borderCollapse: "separate",
    borderSpacing: 0,
    background: "#ffffff",
  },

  th: {
    padding: "15px 16px",
    textAlign: "left",
    background: "#f4f7fb",
    color: "#52647a",
    fontSize: 10,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.65px",
    whiteSpace: "nowrap",
    borderBottom: "1px solid #e1e8f0",
  },

  tr: {
    background: "#ffffff",
  },

  td: {
    padding: "15px 16px",
    color: "#465970",
    fontSize: 12,
    verticalAlign: "middle",
    borderBottom: "1px solid #edf1f6",
  },

  patientCell: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    minWidth: 160,
  },

  avatar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 38,
    height: 38,
    flexShrink: 0,
    borderRadius: 12,
    background: "#e7f2fc",
    color: "#176b9b",
    fontSize: 12,
    fontWeight: 850,
  },

  patientInfo: {
    display: "grid",
    gap: 4,
    minWidth: 0,
  },

  patientName: {
    color: "#16334f",
    fontSize: 12,
    fontWeight: 800,
    lineHeight: 1.4,
  },

  patientCaption: {
    color: "#94a3b8",
    fontSize: 10,
  },

  fileNumber: {
    display: "inline-block",
    padding: "6px 9px",
    border: "1px solid #e2e8f0",
    borderRadius: 7,
    background: "#f8fafc",
    color: "#52647a",
    fontSize: 11,
    fontWeight: 700,
  },

  sessionsCell: {
    display: "grid",
    gridTemplateColumns: "30px 65px",
    alignItems: "center",
    gap: 9,
  },

  sessionCount: {
    color: "#16334f",
    fontSize: 14,
    fontWeight: 850,
    fontVariantNumeric: "tabular-nums",
  },

  progressTrack: {
    width: 65,
    height: 6,
    overflow: "hidden",
    borderRadius: 999,
    background: "#e9eef5",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 0.2s ease",
  },

  dateText: {
    color: "#52647a",
    fontSize: 12,
    whiteSpace: "nowrap",
  },

  therapistText: {
    color: "#465970",
    fontSize: 12,
    fontWeight: 600,
  },

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "7px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    flexShrink: 0,
  },

  specialityCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    minWidth: 150,
  },

  specialityText: {
    color: "#52647a",
    fontSize: 11,
  },

  openButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 11px",
    border: "1px solid #cce8f8",
    borderRadius: 9,
    background: "#eff8ff",
    color: "#0369a1",
    fontSize: 11,
    fontWeight: 800,
    fontFamily: "inherit",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  emptyState: {
    display: "grid",
    justifyItems: "center",
    gap: 10,
    padding: "42px 20px",
    border: "1px dashed #cbd8e6",
    borderRadius: 15,
    background: "#f8fafc",
    textAlign: "center",
  },

  emptyIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 54,
    height: 54,
    borderRadius: 16,
    background: "#e7f2fc",
    color: "#176b9b",
  },

  emptyTitle: {
    margin: 0,
    color: "#16334f",
    fontSize: 16,
    fontWeight: 800,
  },

  emptyText: {
    maxWidth: 380,
    margin: 0,
    color: "#718096",
    fontSize: 12,
    lineHeight: 1.7,
  },

  footer: {
    display: "flex",
    alignItems: "flex-start",
    gap: 9,
    paddingTop: 14,
    borderTop: "1px solid #edf2f7",
    color: "#718096",
    fontSize: 11,
    lineHeight: 1.7,
  },

  footerDot: {
    width: 7,
    height: 7,
    flexShrink: 0,
    marginTop: 5,
    borderRadius: "50%",
    background: "#0d9488",
  },
};

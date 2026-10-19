
import React from "react";
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

  // Count only qualifying walk-ins and appointments.
  // Evaluations, cash visits, and tasks without eligibility must
  // not be included in the utilized-session total.
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

    const hasSeparateCounts =
      [
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

    // Use a backend-calculated total only when the backend already
    // guarantees that it excludes evaluations, cash, and ineligible tasks.
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
    getValue(row, [
      "last_treated_by_name",
      "last_therapist_name",
      "latest_therapist_name",
      "current_therapist_name",
      "therapist_name",
      "physiotherapist_name",
      "therapist",
    ], "Not assigned");

  const getStatusStyle = (status) => {
    switch (status) {
      case "High":
        return styles.statusHigh;
      case "Moderate":
        return styles.statusModerate;
      case "Low":
        return styles.statusLow;
      default:
        return styles.statusInactive;
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";
    return value;
  };

  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <h2 style={styles.cardTitle}>{title}</h2>

        <div style={styles.headerActions}>
          {onMonthChange && (
            <label style={styles.monthFilter}>
              <span style={styles.monthLabel}>Month</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => onMonthChange(event.target.value)}
                style={styles.monthInput}
              />
            </label>
          )}

          {monthLabel && (
            <div style={styles.monthBadge}>{monthLabel}</div>
          )}
        </div>
      </div>

      {patients.length > 0 ? (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>File Number</th>
                <th style={styles.th}>Utilized Sessions</th>
                <th style={styles.th}>Last Seen</th>
                <th style={styles.th}>Therapist</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Speciality</th>
              </tr>
            </thead>

            <tbody>
              {patients.map((row, index) => {
                const utilizedSessions = getUtilizedSessions(row);
                const activityStatus =
                  getActivityStatus(utilizedSessions);

                const patientName = getValue(row, [
                  "name",
                  "patient_name",
                  "full_name",
                ], "Unnamed patient");

                const fileNumber = getValue(row, [
                  "file_number",
                  "file_no",
                  "medical_record_number",
                  "mrn",
                  "patient_id",
                ], "-");

                const lastSeen = getValue(row, [
                  "latest_seen_date",
                  "last_seen_date",
                  "last_session_date",
                  "last_visit_date",
                ], "");

                const speciality = getValue(row, [
                  "speciality",
                  "specialty",
                  "speciality_name",
                  "specialty_name",
                ], "-");

                const patientId = getValue(row, ["id"], null);

                return (
                  <tr key={patientId ?? `${fileNumber}-${index}`}>
                    <td style={styles.tdBold}>{patientName}</td>

                    <td style={styles.td}>{fileNumber}</td>

                    <td style={styles.td}>
                      <strong>{utilizedSessions}</strong>
                    </td>

                    <td style={styles.td}>{formatDate(lastSeen)}</td>

                    <td style={styles.td}>
                      {getTherapist(row)}
                    </td>

                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          ...getStatusStyle(activityStatus),
                        }}
                      >
                        {activityStatus}
                      </span>
                    </td>

                    <td style={styles.td}>
                      <div style={styles.specialityCell}>
                        <span>{speciality}</span>

                        {patientId && (
                          <button
                            type="button"
                            style={styles.openButton}
                            onClick={() =>
                              navigate(`/patients/${patientId}`)
                            }
                          >
                            Open File
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
          No patients found for this month.
        </div>
      )}

      <div style={styles.footerNote}>
        Activity status is based on qualifying utilized sessions for
        the selected month. Only walk-ins and appointments should count.
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e8eef7",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  cardTitle: {
    margin: 0,
    fontSize: "22px",
    color: "#0f172a",
    fontWeight: "800",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  monthFilter: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  monthLabel: {
    color: "#334155",
    fontSize: "13px",
    fontWeight: "700",
  },
  monthInput: {
    padding: "8px 10px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#0f172a",
    background: "#fff",
  },
  monthBadge: {
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #86efac",
    borderRadius: "999px",
    padding: "8px 12px",
    fontWeight: "700",
    fontSize: "13px",
  },
  tableWrap: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "950px",
    background: "#fff",
  },
  th: {
    textAlign: "left",
    padding: "14px 16px",
    background: "#f8fafc",
    color: "#334155",
    fontSize: "14px",
    fontWeight: "800",
    borderBottom: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "14px 16px",
    color: "#475569",
    fontSize: "14px",
    borderBottom: "1px solid #eef2f7",
    verticalAlign: "middle",
  },
  tdBold: {
    padding: "14px 16px",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: "700",
    borderBottom: "1px solid #eef2f7",
  },
  specialityCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  openButton: {
    background: "#0ea5e9",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "8px 12px",
    fontWeight: "700",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  statusBadge: {
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    display: "inline-block",
    whiteSpace: "nowrap",
  },
  statusHigh: {
    background: "#dcfce7",
    color: "#166534",
  },
  statusModerate: {
    background: "#dbeafe",
    color: "#1d4ed8",
  },
  statusLow: {
    background: "#fef3c7",
    color: "#92400e",
  },
  statusInactive: {
    background: "#e5e7eb",
    color: "#374151",
  },
  emptyState: {
    padding: "18px",
    borderRadius: "12px",
    background: "#f8fafc",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
  },
  footerNote: {
    marginTop: "12px",
    fontSize: "12px",
    color: "#64748b",
  },
};

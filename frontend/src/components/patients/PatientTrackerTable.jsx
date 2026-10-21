
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const STATUS_OPTIONS = [
  { value: "inactive", label: "Inactive" },
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" },
  { value: "with_another_therapist", label: "With Another Therapist" },
];

function getStatusLabel(status) {
  const value = String(status || "inactive").toLowerCase();
  const found = STATUS_OPTIONS.find(
    (item) => item.value === value || item.label.toLowerCase() === value
  );
  return found?.label || "Inactive";
}

function getStatusColors(status) {
  switch (getStatusLabel(status)) {
    case "High":
      return { background: "#dcfce7", color: "#166534", dot: "#16a34a" };
    case "Moderate":
      return { background: "#dbeafe", color: "#1d4ed8", dot: "#2563eb" };
    case "Low":
      return { background: "#fef3c7", color: "#92400e", dot: "#d97706" };
    case "With Another Therapist":
      return { background: "#f3e8ff", color: "#6b21a8", dot: "#9333ea" };
    default:
      return { background: "#f1f5f9", color: "#475569", dot: "#94a3b8" };
  }
}

function formatDate(value) {
  if (!value) return "-";
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

function normalizeMonth(value) {
  if (!value) return "";
  const match = String(value).match(/^(\d{4})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}` : "";
}

function getInitials(name) {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

function getSessions(patient) {
  const raw =
    patient?.utilized_sessions ??
    patient?.utilizedSessions ??
    patient?.sessions_used ??
    patient?.session_count ??
    patient?.sessions_count ??
    0;

  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function getSpeciality(patient) {
  const assignment =
    patient?.latest_assignment ||
    patient?.latestAssignment ||
    patient?.assignment ||
    {};

  const values = [
    patient?.speciality,
    patient?.specialty,
    patient?.speciality_name,
    patient?.specialty_name,
    patient?.speciality_display,
    patient?.specialty_display,
    patient?.assigned_speciality,
    patient?.assigned_specialty,
    patient?.department_name,
    patient?.department,
    patient?.service_name,
    assignment?.speciality,
    assignment?.specialty,
    assignment?.speciality_name,
    assignment?.specialty_name,
    assignment?.department,
    assignment?.department_name,
  ];

  const found = values.find(
    (value) =>
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ""
  );

  return found ? String(found).trim() : "-";
}

function getApiBaseUrl() {
  return String(axios.defaults.baseURL || "").replace(/\/+$/, "");
}

async function sendTrackerAction(payload) {
  const baseUrl = getApiBaseUrl();
  const url = /\/api$/i.test(baseUrl)
    ? `${baseUrl}/patients/tracker/`
    : `${baseUrl}/api/patients/tracker/`;

  const response = await axios.post(url, payload);
  return response.data;
}

export default function PatientTrackerTable({
  patients = [],
  title = "Patient Tracker",
  monthLabel = "",
  selectedMonth = "",
  onMonthChange,
  onRefresh,
}) {
  const navigate = useNavigate();

  const [busyAction, setBusyAction] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchName, setSearchName] = useState("");
  const [selectedSpeciality, setSelectedSpeciality] = useState("all");

  // Create a speciality list from the patients currently supplied to the table.
  const specialityOptions = useMemo(() => {
    return [...new Set(
      patients
        .map((patient) => getSpeciality(patient))
        .filter((speciality) => speciality !== "-")
    )].sort((a, b) => a.localeCompare(b));
  }, [patients]);

  // Apply both filters to the table.
  const filteredPatients = useMemo(() => {
    const search = searchName.trim().toLowerCase();

    return patients.filter((patient) => {
      const name = String(patient.name || "").toLowerCase();
      const speciality = getSpeciality(patient);

      const matchesName = !search || name.includes(search);
      const matchesSpeciality =
        selectedSpeciality === "all" ||
        speciality === selectedSpeciality;

      return matchesName && matchesSpeciality;
    });
  }, [patients, searchName, selectedSpeciality]);

  // Summary cards intentionally use all patients, not the filtered results.
  const summary = useMemo(() => {
    const activeStatuses = new Set(["low", "moderate", "high"]);

    return {
      totalPatients: patients.length,
      activePatients: patients.filter((patient) =>
        activeStatuses.has(String(patient.status || "").toLowerCase())
      ).length,
      inactivePatients: patients.filter(
        (patient) =>
          String(patient.status || "").toLowerCase() === "inactive"
      ).length,
      totalSessions: patients.reduce(
        (sum, patient) => sum + getSessions(patient),
        0
      ),
    };
  }, [patients]);

  const refreshTracker = async () => {
    if (typeof onRefresh === "function") {
      await onRefresh();
    }
  };

  const openPatientFile = (patient) => {
    if (patient?.id) {
      navigate(`/patients/${patient.id}`);
    }
  };

  const rolloverMonth = async () => {
    if (!selectedMonth) {
      setErrorMessage("Please select a month before running rollover.");
      setSuccessMessage("");
      return;
    }

    const confirmed = window.confirm(
      `Carry eligible patients from ${selectedMonth} into the next month? Patients marked Inactive or With Another Therapist will be excluded.`
    );

    if (!confirmed) return;

    setErrorMessage("");
    setSuccessMessage("");
    setBusyAction("rollover");

    try {
      const result = await sendTrackerAction({
        action: "rollover",
        month: selectedMonth,
      });

      setSuccessMessage(result?.message || "Monthly rollover completed.");
      await refreshTracker();
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.error ||
          "Monthly rollover failed. Please try again."
      );
    } finally {
      setBusyAction("");
    }
  };

  const summaryCards = [
    {
      label: "Total Patients",
      value: summary.totalPatients,
      icon: "♧",
      color: "#1d4ed8",
      background: "#eff6ff",
    },
    {
      label: "Active Patients",
      value: summary.activePatients,
      icon: "✓",
      color: "#047857",
      background: "#ecfdf5",
    },
    {
      label: "Utilized Sessions",
      value: summary.totalSessions,
      icon: "▤",
      color: "#6d28d9",
      background: "#f5f3ff",
    },
    {
      label: "Inactive Patients",
      value: summary.inactivePatients,
      icon: "!",
      color: "#b45309",
      background: "#fffbeb",
    },
  ];

  const clearFilters = () => {
    setSearchName("");
    setSelectedSpeciality("all");
  };

  return (
    <section style={styles.page}>
      <div style={styles.card}>
        <header style={styles.header}>
          <div style={styles.headingContent}>
            <div style={styles.eyebrow}>PATIENT MANAGEMENT</div>
            <h2 style={styles.title}>{title}</h2>
            <p style={styles.subtitle}>
              Monitor patient activity, utilized sessions, and follow-up
              status in one place.
            </p>
          </div>

          <div style={styles.headerRight}>
            {onMonthChange && (
              <label style={styles.monthFilter}>
                <span style={styles.monthLabel}>REPORTING MONTH</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(event) => onMonthChange(event.target.value)}
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
        </header>

        {errorMessage && (
          <div role="alert" style={styles.errorMessage}>
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div role="status" style={styles.successMessage}>
            {successMessage}
          </div>
        )}

        <div style={styles.summaryGrid}>
          {summaryCards.map((item) => (
            <div key={item.label} style={styles.summaryCard}>
              <div
                style={{
                  ...styles.summaryIcon,
                  color: item.color,
                  background: item.background,
                }}
              >
                {item.icon}
              </div>
              <div style={styles.summaryContent}>
                <span style={styles.summaryLabel}>{item.label}</span>
                <strong style={styles.summaryValue}>
                  {item.value.toLocaleString()}
                </strong>
              </div>
            </div>
          ))}
        </div>

        <div style={styles.tableHeading}>
          <div>
            <h3 style={styles.tableTitle}>Patient Records</h3>
            <p style={styles.tableSubtitle}>
              View patient details and open individual files.
            </p>
          </div>

          <div style={styles.headingActions}>
            <button
              type="button"
              style={{
                ...styles.rolloverButton,
                opacity: busyAction === "rollover" ? 0.65 : 1,
              }}
              onClick={rolloverMonth}
              disabled={busyAction === "rollover" || !selectedMonth}
            >
              <span aria-hidden="true">↻</span>
              {busyAction === "rollover" ? "Processing..." : "Monthly Rollover"}
            </button>
          </div>
        </div>

        {/* Patient name and speciality filters */}
        <div style={styles.filterPanel}>
          <label style={styles.filterField}>
            <span style={styles.filterLabel}>SEARCH PATIENT NAME</span>
            <div style={styles.searchInputWrap}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={styles.searchIcon}
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
              <input
                type="search"
                value={searchName}
                onChange={(event) => setSearchName(event.target.value)}
                placeholder="Type patient name..."
                style={styles.searchInput}
                aria-label="Search patient name"
              />
            </div>
          </label>

          <label style={styles.filterField}>
            <span style={styles.filterLabel}>FILTER BY SPECIALITY</span>
            <select
              value={selectedSpeciality}
              onChange={(event) => setSelectedSpeciality(event.target.value)}
              style={styles.specialitySelect}
              aria-label="Filter by speciality"
            >
              <option value="all">All Specialities</option>
              {specialityOptions.map((speciality) => (
                <option key={speciality} value={speciality}>
                  {speciality}
                </option>
              ))}
              {patients.some((patient) => getSpeciality(patient) === "-") && (
                <option value="-">Not Specified</option>
              )}
            </select>
          </label>

          <div style={styles.filterResult}>
            <span style={styles.resultNumber}>
              {filteredPatients.length}
            </span>
            <span>
              {filteredPatients.length === 1 ? "patient found" : "patients found"}
            </span>
          </div>

          {(searchName || selectedSpeciality !== "all") && (
            <button
              type="button"
              onClick={clearFilters}
              style={styles.clearFiltersButton}
            >
              Clear Filters
            </button>
          )}
        </div>

        {filteredPatients.length > 0 ? (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <colgroup>
                <col style={{ width: 390 }} />
                <col style={{ width: 155 }} />
                <col style={{ width: 145 }} />
                <col style={{ width: 165 }} />
                <col style={{ width: 170 }} />
                <col style={{ width: 125 }} />
                <col style={{ width: 135 }} />
              </colgroup>

              <thead>
                <tr>
                  <th style={{ ...styles.th, minWidth: 390 }}>PATIENT</th>
                  <th style={{ ...styles.th, minWidth: 155 }}>FILE NUMBER</th>
                  <th style={{ ...styles.th, minWidth: 145 }}>UTILIZED SESSIONS</th>
                  <th style={{ ...styles.th, minWidth: 165 }}>STATUS</th>
                  <th style={{ ...styles.th, minWidth: 170 }}>SPECIALITY</th>
                  <th style={{ ...styles.th, minWidth: 125 }}>LAST SEEN</th>
                  <th
                    style={{
                      ...styles.th,
                      minWidth: 135,
                      textAlign: "center",
                    }}
                  >
                    PATIENT FILE
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredPatients.map((patient, index) => {
                  const sessions = getSessions(patient);
                  const statusLabel = getStatusLabel(patient.status);
                  const statusColors = getStatusColors(patient.status);
                  const patientMonth = normalizeMonth(patient.month);
                  const displayMonth = normalizeMonth(selectedMonth);

                  const isNewEvaluation =
                    Boolean(patient.is_new_evaluation) &&
                    Boolean(patientMonth) &&
                    (!displayMonth || patientMonth === displayMonth);

                  const fileNumber =
                    patient.file_number || patient.patient_id || "-";

                  const speciality = getSpeciality(patient);
                  const lastSeen =
                    patient.last_seen_date || patient.latest_seen_date || null;
                  const progress = Math.min((sessions / 6) * 100, 100);

                  return (
                    <tr
                      key={patient.id ?? `${fileNumber}-${index}`}
                      style={styles.tr}
                    >
                      <td style={styles.patientTd}>
                        <div style={styles.patientCell}>
                          <div style={styles.avatar}>
                            {getInitials(patient.name)}
                          </div>
                          <div style={styles.patientInfo}>
                            <strong style={styles.patientName}>
                              {patient.name || "Unnamed patient"}
                            </strong>
                            <span
                              style={
                                isNewEvaluation
                                  ? styles.newBadge
                                  : styles.oldBadge
                              }
                            >
                              {isNewEvaluation ? "NEW EVALUATION" : "OLD"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.fileNumber}>
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <rect x="3" y="4" width="18" height="16" rx="3" />
                            <circle cx="8" cy="10" r="2" />
                            <path d="M5.5 16a2.5 2.5 0 0 1 5 0" />
                            <path d="M13 9h4" />
                            <path d="M13 13h4" />
                          </svg>
                          <span>{fileNumber}</span>
                        </span>
                      </td>

                      <td style={styles.td}>
                        <div style={styles.sessionsCell}>
                          <div style={styles.sessionsTop}>
                            <strong style={styles.sessionCount}>{sessions}</strong>
                            <span style={styles.sessionUnit}>
                              {sessions === 1 ? "session" : "sessions"}
                            </span>
                          </div>
                          <div
                            style={styles.progressTrack}
                            role="img"
                            aria-label={`${sessions} utilized sessions`}
                          >
                            <div
                              style={{
                                ...styles.progressFill,
                                width: `${progress}%`,
                                background:
                                  sessions >= 6
                                    ? "#059669"
                                    : sessions >= 3
                                      ? "#3b82f6"
                                      : sessions > 0
                                        ? "#d97706"
                                        : "#cbd5e1",
                              }}
                            />
                          </div>
                        </div>
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
                          {statusLabel}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span
                          style={styles.specialityText}
                          title={speciality !== "-" ? speciality : ""}
                        >
                          {speciality === "-" ? "Not Specified" : speciality}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.dateText}>{formatDate(lastSeen)}</span>
                      </td>

                      <td style={{ ...styles.td, textAlign: "center" }}>
                        <button
                          type="button"
                          style={styles.openButton}
                          onClick={() => openPatientFile(patient)}
                          disabled={!patient.id}
                          title={
                            patient.id
                              ? `Open file for ${patient.name || "patient"}`
                              : "Patient file unavailable"
                          }
                        >
                          <span style={styles.fileIcon} aria-hidden="true">
                            <svg
                              width="17"
                              height="17"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <path d="M14 2v6h6" />
                              <path d="M8 13h8" />
                              <path d="M8 17h5" />
                            </svg>
                          </span>
                          <span style={styles.openButtonText}>Open File</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>♧</div>
            <h3 style={styles.emptyTitle}>
              {patients.length === 0 ? "No patients found" : "No matching patients"}
            </h3>
            <p style={styles.emptyText}>
              {patients.length === 0
                ? "There are no patient records to display for this month. Try selecting another reporting month."
                : "No patients match your search and speciality filters. Try changing your search or clearing the filters."}
            </p>
            {(searchName || selectedSpeciality !== "all") && (
              <button
                type="button"
                onClick={clearFilters}
                style={styles.clearFiltersButton}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        <footer style={styles.footer}>
          <span style={styles.footerDot} />
          <span>
            Utilized sessions are monthly tracker counts, independent of
            appointment records. Status levels: Inactive = 0, Low = 1–2,
            Moderate = 3–5, High = 6 or more sessions.
          </span>
        </footer>
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
    padding: "clamp(16px, 2.5vw, 28px)",
    background: "#ffffff",
    border: "1px solid #e2eaf3",
    borderRadius: 20,
    boxShadow: "0 8px 28px rgba(15, 35, 65, 0.055)",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 20,
    paddingBottom: 22,
    borderBottom: "1px solid #edf2f7",
  },
  headingContent: { flex: "1 1 280px", minWidth: 0 },
  eyebrow: {
    marginBottom: 8,
    color: "#07856f",
    fontSize: 8,
    fontWeight: 850,
    letterSpacing: "1.4px",
  },
  title: {
    margin: 0,
    color: "#10243e",
    fontSize: "clamp(20px, 2.5vw, 26px)",
    fontWeight: 800,
    lineHeight: 1.3,
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#748398",
    fontSize: 11,
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
  monthFilter: { display: "grid", gap: 7 },
  monthLabel: {
    color: "#52647a",
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: "0.5px",
  },
  monthInput: {
    minHeight: 40,
    boxSizing: "border-box",
    padding: "8px 10px",
    border: "1px solid #d5e0ec",
    borderRadius: 10,
    background: "#ffffff",
    color: "#243b53",
    fontSize: 11,
    fontFamily: "inherit",
  },
  monthBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    minHeight: 22,
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid #ccefe0",
    background: "#e9f9f1",
    color: "#08784f",
    fontSize: 10,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  monthBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#10b981",
  },
  errorMessage: {
    padding: "10px 12px",
    border: "1px solid #fecaca",
    borderRadius: 10,
    background: "#fef2f2",
    color: "#b91c1c",
    fontSize: 10,
  },
  successMessage: {
    padding: "10px 12px",
    border: "1px solid #bbf7d0",
    borderRadius: 10,
    background: "#f0fdf4",
    color: "#166534",
    fontSize: 10,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 185px), 1fr))",
    gap: 14,
    minWidth: 0,
  },
  summaryCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    minWidth: 0,
    padding: "16px 14px",
    border: "1px solid #e8eef5",
    borderRadius: 15,
    background: "#ffffff",
    boxShadow: "0 3px 12px rgba(15, 23, 42, 0.025)",
  },
  summaryIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    flexShrink: 0,
    borderRadius: 14,
    fontSize: 22,
    fontWeight: 800,
  },
  summaryContent: { display: "grid", gap: 6, minWidth: 0 },
  summaryLabel: {
    color: "#718096",
    fontSize: 9,
    fontWeight: 700,
    lineHeight: 1.4,
  },
  summaryValue: {
    color: "#10243e",
    fontSize: 23,
    fontWeight: 850,
    lineHeight: 1.1,
    fontVariantNumeric: "tabular-nums",
  },
  tableHeading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 14,
  },
  tableTitle: {
    margin: 0,
    color: "#10243e",
    fontSize: 17,
    fontWeight: 800,
  },
  tableSubtitle: {
    margin: "5px 0 0",
    color: "#718096",
    fontSize: 10,
    lineHeight: 1.5,
  },
  headingActions: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  rolloverButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 38,
    padding: "9px 12px",
    border: "1px solid #c7d2fe",
    borderRadius: 10,
    background: "#eef2ff",
    color: "#3730a3",
    fontSize: 9,
    fontWeight: 800,
    fontFamily: "inherit",
    cursor: "pointer",
  },

  // Filter controls
  filterPanel: {
    display: "flex",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: 14,
    padding: 16,
    border: "1px solid #dfe7f1",
    borderRadius: 14,
    background: "#f8fafc",
  },
  filterField: {
    display: "grid",
    gap: 7,
    flex: "1 1 230px",
    minWidth: 190,
  },
  filterLabel: {
    color: "#52647a",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.4px",
  },
  searchInputWrap: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    minHeight: 44,
    boxSizing: "border-box",
    padding: "0 12px",
    border: "1px solid #cbd8e6",
    borderRadius: 10,
    background: "#ffffff",
  },
  searchIcon: {
    flexShrink: 0,
    color: "#64748b",
  },
  searchInput: {
    width: "100%",
    minWidth: 0,
    height: 42,
    padding: 0,
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#16334f",
    fontSize: 13,
    fontFamily: "inherit",
  },
  specialitySelect: {
    width: "100%",
    minHeight: 44,
    boxSizing: "border-box",
    padding: "9px 12px",
    border: "1px solid #cbd8e6",
    borderRadius: 10,
    background: "#ffffff",
    color: "#16334f",
    fontSize: 13,
    fontFamily: "inherit",
    cursor: "pointer",
  },
  filterResult: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    color: "#64748b",
    fontSize: 11,
    whiteSpace: "nowrap",
  },
  resultNumber: {
    color: "#17365d",
    fontSize: 17,
    fontWeight: 850,
    fontVariantNumeric: "tabular-nums",
  },
  clearFiltersButton: {
    minHeight: 38,
    padding: "8px 12px",
    border: "1px solid #cbd8e6",
    borderRadius: 9,
    background: "#ffffff",
    color: "#334e68",
    fontSize: 11,
    fontWeight: 750,
    fontFamily: "inherit",
    cursor: "pointer",
  },

  tableWrap: {
    width: "100%",
    minWidth: 0,
    overflowX: "auto",
    border: "1px solid #dfe7f1",
    borderRadius: 15,
    background: "#ffffff",
  },
  table: {
    width: "100%",
    minWidth: 1285,
    tableLayout: "fixed",
    borderCollapse: "separate",
    borderSpacing: 0,
    background: "#ffffff",
  },
  th: {
    position: "sticky",
    top: 0,
    padding: "13px 12px",
    textAlign: "left",
    background: "#f3f7fc",
    color: "#61738a",
    fontSize: 8,
    fontWeight: 850,
    letterSpacing: "0.5px",
    whiteSpace: "nowrap",
    borderBottom: "1px solid #dfe7f1",
  },
  tr: { background: "#ffffff" },
  td: {
    padding: "15px 12px",
    color: "#465970",
    fontSize: 10,
    verticalAlign: "middle",
    borderBottom: "1px solid #edf1f6",
    overflowWrap: "anywhere",
  },
  patientTd: {
    padding: "16px 14px",
    color: "#465970",
    fontSize: 10,
    verticalAlign: "middle",
    borderBottom: "1px solid #edf1f6",
  },
  patientCell: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    minWidth: 0,
  },
  avatar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 42,
    height: 42,
    flexShrink: 0,
    borderRadius: 12,
    background: "linear-gradient(135deg, #e0f2fe, #dbeafe)",
    color: "#075985",
    fontSize: 11,
    fontWeight: 850,
    border: "1px solid #cce7f7",
  },
  patientInfo: {
    display: "grid",
    justifyItems: "start",
    gap: 6,
    minWidth: 0,
    flex: 1,
  },
  patientName: {
    display: "block",
    width: "100%",
    color: "#16334f",
    fontSize: 12,
    fontWeight: 800,
    lineHeight: 1.6,
    overflowWrap: "anywhere",
    whiteSpace: "normal",
  },
  newBadge: {
    width: "fit-content",
    padding: "3px 6px",
    borderRadius: 6,
    background: "#fff7ed",
    color: "#c2410c",
    border: "1px solid #fed7aa",
    fontSize: 7,
    fontWeight: 850,
    letterSpacing: "0.25px",
  },
  oldBadge: {
    width: "fit-content",
    padding: "3px 6px",
    borderRadius: 6,
    background: "#f1f5f9",
    color: "#64748b",
    border: "1px solid #e2e8f0",
    fontSize: 7,
    fontWeight: 850,
    letterSpacing: "0.25px",
  },
  fileNumber: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    maxWidth: "100%",
    padding: "8px 9px",
    border: "1px solid #cfe2f7",
    borderRadius: 9,
    background: "#f0f7ff",
    color: "#174a7e",
    fontSize: 10,
    fontWeight: 800,
    lineHeight: 1.4,
    fontVariantNumeric: "tabular-nums",
    overflowWrap: "anywhere",
  },
  sessionsCell: { display: "grid", gap: 8, minWidth: 0 },
  sessionsTop: {
    display: "flex",
    alignItems: "baseline",
    gap: 5,
    flexWrap: "wrap",
  },
  sessionCount: {
    color: "#16334f",
    fontSize: 16,
    fontWeight: 850,
    lineHeight: 1.2,
    fontVariantNumeric: "tabular-nums",
  },
  sessionUnit: { color: "#94a3b8", fontSize: 8, fontWeight: 650 },
  progressTrack: {
    width: 90,
    maxWidth: "100%",
    height: 5,
    overflow: "hidden",
    borderRadius: 999,
    background: "#e9eef5",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 0.2s ease",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    width: "fit-content",
    maxWidth: "100%",
    padding: "7px 8px",
    borderRadius: 999,
    fontSize: 8,
    fontWeight: 800,
    whiteSpace: "normal",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    flexShrink: 0,
  },

  // Larger, clearer speciality text
  specialityText: {
    display: "block",
    maxWidth: "100%",
    color: "#334e68",
    fontSize: 12,
    fontWeight: 650,
    lineHeight: 1.6,
    overflowWrap: "anywhere",
  },
  dateText: {
    display: "inline-block",
    color: "#334e68",
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1.5,
    whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums",
  },
  openButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    minWidth: 110,
    minHeight: 40,
    padding: "7px 10px",
    border: "1px solid #1e3a5f",
    borderRadius: 9,
    background: "#17365d",
    color: "#ffffff",
    fontSize: 10,
    fontWeight: 800,
    fontFamily: "inherit",
    cursor: "pointer",
    textAlign: "center",
    boxShadow: "0 3px 8px rgba(23, 54, 93, 0.16)",
    transition: "background 0.2s ease, box-shadow 0.2s ease",
  },
  fileIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 22,
    height: 22,
    flexShrink: 0,
    color: "#ffffff",
  },
  openButtonText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: 800,
    lineHeight: 1.2,
    whiteSpace: "nowrap",
  },
  emptyState: {
    display: "grid",
    justifyItems: "center",
    gap: 10,
    padding: "38px 18px",
    border: "1px dashed #cbd8e6",
    borderRadius: 15,
    background: "#f8fafc",
    textAlign: "center",
  },
  emptyIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
    borderRadius: 16,
    background: "#e7f2fc",
    color: "#176b9b",
    fontSize: 26,
  },
  emptyTitle: {
    margin: 0,
    color: "#16334f",
    fontSize: 14,
    fontWeight: 800,
  },
  emptyText: {
    maxWidth: 380,
    margin: 0,
    color: "#718096",
    fontSize: 10,
    lineHeight: 1.7,
  },
  footer: {
    display: "flex",
    alignItems: "flex-start",
    gap: 9,
    paddingTop: 14,
    borderTop: "1px solid #edf2f7",
    color: "#718096",
    fontSize: 9,
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

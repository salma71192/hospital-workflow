
import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../api/api";

const INSURANCE_TYPES = ["Thiqa", "Daman", "Other"];

const COLORS = {
  Thiqa: "#2563eb",
  Daman: "#10b981",
  Other: "#64748b",
};

function getInsurance(patient) {
  const raw = String(
    patient?.insurance_provider ??
      patient?.insurance_company ??
      patient?.insurance ??
      patient?.payer ??
      patient?.insurance_type ??
      ""
  ).trim().toLowerCase();

  if (raw.includes("thiqa")) return "Thiqa";
  if (raw.includes("daman")) return "Daman";
  return "Other";
}

function getNumber(patient, fields) {
  for (const field of fields) {
    const value = patient?.[field];

    if (value !== null && value !== undefined && value !== "") {
      const number = Number(value);
      if (Number.isFinite(number) && number >= 0) return number;
    }
  }

  return 0;
}

function getApprovedSessions(patient) {
  return getNumber(patient, [
    "approved_sessions",
    "sessions_approved",
    "total_approved_sessions",
    "authorized_sessions",
    "sessions_authorized",
    "approved",
  ]);
}

function getUsedSessions(patient) {
  return getNumber(patient, [
    "sessions_taken",
    "sessions_used",
    "used_sessions",
    "utilized_sessions",
    "appointments_attended",
  ]);
}

function getPatientFileNumber(patient) {
  return (
    patient?.patient_file_number ??
    patient?.file_number ??
    patient?.patient_file_no ??
    patient?.file_no ??
    patient?.patient_number ??
    patient?.patient?.file_number ??
    "—"
  );
}

function getPatientName(patient) {
  return (
    patient?.patient_name ??
    patient?.full_name ??
    patient?.name ??
    patient?.patient?.name ??
    "Unnamed patient"
  );
}

function getPatientId(patient, index) {
  return String(
    patient?.id ??
      patient?.patient_id ??
      patient?.patient?.id ??
      `patient-${index}`
  );
}

function getMonthString() {
  const date = new Date();

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function getArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.patients)) return data.patients;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

const styles = {
  page: {
    display: "grid",
    gap: 22,
    minWidth: 0,
    color: "#16334f",
    fontFamily: "Inter, Arial, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 800,
    color: "#16334f",
  },
  subtitle: {
    margin: "7px 0 0",
    fontSize: 13,
    lineHeight: 1.6,
    color: "#64748b",
  },
  button: {
    padding: "10px 15px",
    border: "1px solid #d6deea",
    borderRadius: 10,
    background: "#fff",
    color: "#16334f",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  metrics: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 15,
  },
  metric: {
    textAlign: "left",
    padding: 18,
    border: "1px solid #e2e8f0",
    borderRadius: 15,
    background: "#fff",
    cursor: "pointer",
    minWidth: 0,
    fontFamily: "inherit",
    transition: "border-color 150ms ease, box-shadow 150ms ease",
  },
  metricLabel: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 800,
    color: "#16334f",
  },
  metricDetail: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 7,
  },
  panel: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 20,
    minWidth: 0,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 17,
    fontWeight: 800,
    color: "#16334f",
  },
  sectionSubtitle: {
    margin: "6px 0 20px",
    fontSize: 12,
    lineHeight: 1.5,
    color: "#64748b",
  },
  barRow: {
    display: "grid",
    gap: 8,
    marginBottom: 18,
  },
  barHeading: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    fontSize: 13,
    color: "#334155",
  },
  track: {
    height: 10,
    borderRadius: 999,
    background: "#edf2f7",
    overflow: "hidden",
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    fontSize: 13,
  },
  th: {
    padding: "13px 14px",
    background: "#f8fafc",
    color: "#475569",
    fontWeight: 700,
    borderBottom: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
  },
  td: {
    padding: 14,
    borderBottom: "1px solid #f1f5f9",
    color: "#475569",
    verticalAlign: "middle",
  },
  patientName: {
    color: "#16334f",
    fontWeight: 700,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  message: {
    padding: 22,
    borderRadius: 12,
    background: "#f8fafc",
    color: "#64748b",
    textAlign: "center",
    fontSize: 13,
  },
  error: {
    padding: 14,
    borderRadius: 12,
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    color: "#9f1239",
    fontSize: 13,
  },
};

export default function InsuranceUtilizationPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedInsurance, setSelectedInsurance] = useState("All");
  const [listExpanded, setListExpanded] = useState(false);

  const loadPatients = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        month: getMonthString(),
      });

      const response = await api.get(
        `patients/tracker/?${params.toString()}`
      );

      setPatients(getArray(response.data));
    } catch (err) {
      console.error("Failed to load insurance patient records:", err);
      console.error("Insurance patient API error:", err?.response?.data);

      setPatients([]);
      setError(
        "Patient records could not be loaded. Please check the tracker API and try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const records = useMemo(
    () =>
      patients.map((patient, index) => ({
        ...patient,
        _key: getPatientId(patient, index),
        _name: getPatientName(patient),
        _fileNumber: getPatientFileNumber(patient),
        _insurance: getInsurance(patient),
        _approved: getApprovedSessions(patient),
        _used: getUsedSessions(patient),
      })),
    [patients]
  );

  const summary = useMemo(() => {
    const groups = {
      Thiqa: { patients: 0, approved: 0, used: 0 },
      Daman: { patients: 0, approved: 0, used: 0 },
      Other: { patients: 0, approved: 0, used: 0 },
    };

    records.forEach((patient) => {
      const group = groups[patient._insurance];

      group.patients += 1;
      group.approved += patient._approved;
      group.used += patient._used;
    });

    const totalApproved = records.reduce(
      (sum, patient) => sum + patient._approved,
      0
    );

    const totalUsed = records.reduce(
      (sum, patient) => sum + patient._used,
      0
    );

    return {
      groups,
      totalPatients: records.length,
      totalApproved,
      totalUsed,
      utilization:
        totalApproved > 0
          ? (totalUsed / totalApproved) * 100
          : null,
    };
  }, [records]);

  const visiblePatients = useMemo(() => {
    if (selectedInsurance === "All") return records;

    return records.filter(
      (patient) => patient._insurance === selectedInsurance
    );
  }, [records, selectedInsurance]);

  const selectInsurance = (insurance) => {
    setSelectedInsurance(insurance);
    setListExpanded(true);
  };

  const totalShare = (count) =>
    summary.totalPatients > 0
      ? (count / summary.totalPatients) * 100
      : 0;

  const renderBar = (label, value, color, detail) => (
    <div style={styles.barRow} key={label}>
      <div style={styles.barHeading}>
        <span>{label}</span>
        <strong>{detail}</strong>
      </div>

      <div
        style={styles.track}
        role="img"
        aria-label={`${label}: ${value.toFixed(1)} percent`}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(Math.max(value, 0), 100)}%`,
            background: color,
            borderRadius: 999,
            transition: "width 250ms ease",
          }}
        />
      </div>
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Insurance &amp; Session Utilization
          </h1>

          <p style={styles.subtitle}>
            Review insurance distribution, approved sessions, and utilized
            sessions. Select a card to view its patient list.
          </p>
        </div>

        <button
          type="button"
          onClick={loadPatients}
          disabled={loading}
          style={{
            ...styles.button,
            opacity: loading ? 0.6 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div role="alert" style={styles.error}>
          {error}
        </div>
      )}

      {loading && patients.length === 0 && !error ? (
        <div style={styles.message}>Loading insurance records...</div>
      ) : (
        <>
          <div style={styles.metrics}>
            {INSURANCE_TYPES.map((insurance) => {
              const group = summary.groups[insurance];
              const selected = selectedInsurance === insurance;

              return (
                <button
                  type="button"
                  key={insurance}
                  onClick={() => selectInsurance(insurance)}
                  aria-pressed={selected}
                  style={{
                    ...styles.metric,
                    borderColor: selected
                      ? COLORS[insurance]
                      : "#e2e8f0",
                    boxShadow: selected
                      ? `0 0 0 2px ${COLORS[insurance]}20`
                      : "none",
                  }}
                >
                  <div style={styles.metricLabel}>
                    {insurance} patients
                  </div>

                  <div style={styles.metricValue}>
                    {group.patients.toLocaleString()}
                  </div>

                  <div style={styles.metricDetail}>
                    {totalShare(group.patients).toFixed(1)}% of all patients
                  </div>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => selectInsurance("All")}
              aria-pressed={selectedInsurance === "All"}
              style={{
                ...styles.metric,
                borderColor:
                  selectedInsurance === "All"
                    ? "#16334f"
                    : "#e2e8f0",
                boxShadow:
                  selectedInsurance === "All"
                    ? "0 0 0 2px #16334f20"
                    : "none",
              }}
            >
              <div style={styles.metricLabel}>Overall utilization</div>

              <div style={styles.metricValue}>
                {summary.utilization === null
                  ? "—"
                  : `${summary.utilization.toFixed(1)}%`}
              </div>

              <div style={styles.metricDetail}>
                {summary.totalUsed.toLocaleString()} used of{" "}
                {summary.totalApproved.toLocaleString()} approved sessions
              </div>
            </button>
          </div>

          <section style={styles.panel}>
            <h2 style={styles.sectionTitle}>
              Patient distribution by insurance
            </h2>

            <p style={styles.sectionSubtitle}>
              Select any card above to filter the patient list below.
            </p>

            {INSURANCE_TYPES.map((insurance) =>
              renderBar(
                insurance,
                totalShare(summary.groups[insurance].patients),
                COLORS[insurance],
                `${summary.groups[insurance].patients} patients · ${totalShare(
                  summary.groups[insurance].patients
                ).toFixed(1)}%`
              )
            )}

            <h2 style={{ ...styles.sectionTitle, marginTop: 28 }}>
              Session utilization by insurance
            </h2>

            <p style={styles.sectionSubtitle}>
              Utilization is sessions used divided by approved sessions.
              Values above 100% are capped visually at 100%.
            </p>

            {INSURANCE_TYPES.map((insurance) => {
              const group = summary.groups[insurance];

              const utilization =
                group.approved > 0
                  ? (group.used / group.approved) * 100
                  : null;

              return renderBar(
                `${insurance} utilization`,
                utilization ?? 0,
                COLORS[insurance],
                utilization === null
                  ? "No approved-session data"
                  : `${group.used} / ${group.approved} · ${utilization.toFixed(
                      1
                    )}%`
              );
            })}
          </section>

          <section style={styles.panel}>
            <div style={styles.tableHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Patient List</h2>

                <p style={{ ...styles.sectionSubtitle, marginBottom: 0 }}>
                  {selectedInsurance === "All"
                    ? "Showing patients across all insurance categories."
                    : `Showing patients with ${selectedInsurance} insurance.`}{" "}
                  {visiblePatients.length} patient
                  {visiblePatients.length === 1 ? "" : "s"}.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setListExpanded((expanded) => !expanded)
                }
                aria-expanded={listExpanded}
                style={styles.button}
              >
                {listExpanded ? "Collapse list ▲" : "Expand list ▼"}
              </button>
            </div>

            {listExpanded &&
              (visiblePatients.length === 0 ? (
                <div style={styles.message}>
                  No patients found for this selection.
                </div>
              ) : (
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Patient Name</th>
                        <th style={styles.th}>Patient File Number</th>
                        <th style={styles.th}>Insurance Type</th>
                        <th style={styles.th}>Approved Sessions</th>
                        <th style={styles.th}>Used Sessions</th>
                        <th style={styles.th}>Utilization</th>
                      </tr>
                    </thead>

                    <tbody>
                      {visiblePatients.map((patient) => {
                        const utilization =
                          patient._approved > 0
                            ? (patient._used / patient._approved) * 100
                            : null;

                        return (
                          <tr key={patient._key}>
                            <td style={styles.td}>
                              <strong style={styles.patientName}>
                                {patient._name}
                              </strong>
                            </td>

                            <td style={styles.td}>
                              {patient._fileNumber}
                            </td>

                            <td style={styles.td}>
                              <span
                                style={{
                                  ...styles.badge,
                                  color: COLORS[patient._insurance],
                                  background: `${COLORS[patient._insurance]}15`,
                                }}
                              >
                                {patient._insurance}
                              </span>
                            </td>

                            <td style={styles.td}>
                              {patient._approved}
                            </td>

                            <td style={styles.td}>
                              {patient._used}
                            </td>

                            <td style={styles.td}>
                              {utilization === null
                                ? "—"
                                : `${utilization.toFixed(1)}%`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
          </section>
        </>
      )}

      <p style={{ ...styles.subtitle, marginTop: -8 }}>
        Records are loaded from the existing Patient Tracker endpoint.
        Insurance and session totals depend on the fields returned by that API.
      </p>
    </div>
  );
}

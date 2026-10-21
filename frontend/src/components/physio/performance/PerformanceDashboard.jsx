import React, { useCallback, useEffect, useState } from "react";
import api from "../../../api/api";
import EstimatedTargetCard from "./EstimatedTargetCard";
import PatientStatusChart from "./PatientStatusChart";
import InsuranceUtilizationChart from "./InsuranceUtilizationChart";
const COLORS = {
  navy: "#17365d",
  text: "#243b5a",
  muted: "#7185a3",
  border: "#dce6f2",
  white: "#ffffff",
  blue: "#3268f5",
  blueLight: "#eff6ff",
  blueBorder: "#d6e7ff",
  purple: "#8b32ed",
  purpleLight: "#f7f1ff",
  purpleBorder: "#e8d4ff",
  orange: "#e76a16",
  orangeLight: "#fff7ed",
  orangeBorder: "#ffd8ad",
  green: "#059669",
  greenLight: "#ecfdf5",
};
const styles = {
  page: {
    display: "grid",
    gap: 24,
    minWidth: 0,
    width: "100%",
    boxSizing: "border-box",
    color: COLORS.text,
    fontFamily: "Inter, Arial, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 18,
  },
  headingGroup: {
    display: "grid",
    gap: 8,
    minWidth: 0,
  },
  eyebrow: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    justifySelf: "start",
    padding: "7px 13px",
    borderRadius: 9,
    background: "#eee8ff",
    color: "#7435db",
    fontSize: 11,
    fontWeight: 850,
    letterSpacing: "0.8px",
    textTransform: "uppercase",
  },
  heading: {
    margin: 0,
    color: COLORS.navy,
    fontSize: 28,
    fontWeight: 850,
    letterSpacing: "-0.7px",
    lineHeight: 1.25,
  },
  subtitle: {
    margin: 0,
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 1.7,
    maxWidth: 720,
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  refreshButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    minHeight: 42,
    padding: "10px 17px",
    border: `1px solid ${COLORS.purpleBorder}`,
    borderRadius: 24,
    background: COLORS.purpleLight,
    color: COLORS.purple,
    fontSize: 13,
    fontWeight: 800,
    whiteSpace: "nowrap",
    transition: "opacity 0.2s ease",
  },
  filterCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 18,
    padding: "18px 22px",
    background: COLORS.white,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 16,
    boxShadow: "0 8px 25px rgba(31, 55, 89, 0.035)",
    boxSizing: "border-box",
    minWidth: 0,
  },
  filterIntro: {
    display: "flex",
    alignItems: "center",
    gap: 13,
    minWidth: 0,
  },
  filterIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 45,
    height: 45,
    borderRadius: 12,
    background: COLORS.blueLight,
    color: COLORS.blue,
    flexShrink: 0,
  },
  filterTitle: {
    margin: 0,
    color: COLORS.navy,
    fontSize: 15,
    fontWeight: 850,
  },
  filterSubtitle: {
    margin: "5px 0 0",
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 1.5,
  },
  filterControls: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  filterLabel: {
    display: "block",
    marginBottom: 6,
    color: COLORS.text,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.4px",
    textTransform: "uppercase",
  },
  monthInput: {
    minHeight: 43,
    minWidth: 175,
    padding: "9px 12px",
    border: `1px solid ${COLORS.blueBorder}`,
    borderRadius: 10,
    background: "#f8fbff",
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: 750,
    fontFamily: "inherit",
    outlineColor: COLORS.blue,
    boxSizing: "border-box",
  },
  monthBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 39,
    padding: "8px 13px",
    borderRadius: 24,
    background: COLORS.purpleLight,
    color: COLORS.purple,
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  targetBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 18,
    padding: "23px 24px",
    border: `1px solid ${COLORS.blueBorder}`,
    borderRadius: 17,
    background: "linear-gradient(110deg, #eff6ff 0%, #f5f3ff 100%)",
    boxSizing: "border-box",
    minWidth: 0,
  },
  targetLeft: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    minWidth: 0,
  },
  targetIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 55,
    height: 55,
    borderRadius: 14,
    background: "#4938d4",
    color: "#ffffff",
    fontSize: 26,
    flexShrink: 0,
  },
  targetLabel: {
    color: "#596ba2",
    fontSize: 12,
    fontWeight: 850,
    letterSpacing: "0.8px",
    textTransform: "uppercase",
    marginBottom: 7,
  },
  targetValue: {
    color: COLORS.navy,
    fontSize: 24,
    lineHeight: 1.35,
    fontWeight: 850,
  },
  targetBadge: {
    padding: "10px 15px",
    borderRadius: 24,
    border: "1px solid #cdd7ff",
    background: "#ffffff",
    color: "#4938d4",
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  error: {
    padding: 16,
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    borderRadius: 13,
    color: "#9f1239",
    fontSize: 13,
    lineHeight: 1.7,
  },
  loadingPanel: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 19,
    background: COLORS.white,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 15,
    color: COLORS.muted,
    fontSize: 13,
    boxShadow: "0 8px 25px rgba(31, 55, 89, 0.035)",
  },
  loadingDot: {
    width: 9,
    height: 9,
    borderRadius: "50%",
    background: COLORS.purple,
    flexShrink: 0,
  },
  sectionHeading: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 15,
  },
  sectionTitle: {
    margin: 0,
    color: COLORS.navy,
    fontSize: 18,
    fontWeight: 850,
  },
  sectionSubtitle: {
    margin: "6px 0 0",
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 1.65,
  },
  sectionBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 13px",
    borderRadius: 24,
    background: COLORS.purpleLight,
    color: COLORS.purple,
    fontSize: 11,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  targetSection: {
    display: "grid",
    gap: 13,
    minWidth: 0,
  },
  chartSection: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    gap: 22,
    alignItems: "start",
    minWidth: 0,
  },
  chartWrapper: {
    minWidth: 0,
    width: "100%",
  },
  footer: {
    padding: "14px 17px",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    background: "#f8fafc",
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 1.75,
  },
};
function getLocalMonthString(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
  ].join("-");
}
function shiftMonth(month, amount) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + amount, 1);
  return getLocalMonthString(date);
}
function getMonthDateRange(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  return {
    start_date: `${month}-01`,
    end_date: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
}
function getMonthLabel(month) {
  if (!month) return "";
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthNumber - 1, 1));
}
function getArray(data, key) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.[key]) ? data[key] : [];
}
function getTherapistId(item) {
  return (
    item?.therapist_id ??
    item?.therapist?.id ??
    item?.assigned_therapist_id ??
    item?.physio_id ??
    item?.physiotherapist_id ??
    item?.user_id ??
    item?.assigned_to?.id ??
    null
  );
}
function belongsToTherapist(item, therapistId) {
  if (therapistId == null) return true;
  const id = getTherapistId(item);
  // Retain records without an exposed therapist ID because the
  // endpoint may already be scoped to the selected therapist.
  return id == null || String(id) === String(therapistId);
}
function getCategory(item) {
  return String(
    item?.category ??
      item?.category_label ??
      item?.visit_type ??
      item?.registration_type ??
      item?.appointment_type ??
      ""
  )
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}
const EVALUATION_CATEGORIES = [
  "initial_evaluation",
  "initial_eval",
  "evaluation",
  "eval",
];
function isEvaluation(item) {
  const category = getCategory(item);
  if (EVALUATION_CATEGORIES.includes(category)) return true;
  return (
    item?.is_evaluation === true ||
    item?.initial_evaluation === true ||
    item?.is_initial_evaluation === true
  );
}
function getTrackerTherapistId(item) {
  return (
    item?.therapist_id ??
    item?.therapist?.id ??
    item?.assigned_therapist_id ??
    item?.physio_id ??
    item?.physiotherapist_id ??
    item?.user_id ??
    item?.assigned_to?.id ??
    null
  );
}
function filterTrackerPatients(patients, therapistId) {
  if (therapistId == null || patients.length === 0) {
    return patients;
  }
  const hasTherapistInformation = patients.some(
    (patient) => getTrackerTherapistId(patient) != null
  );
  // Some tracker endpoints do not expose therapist assignment IDs.
  if (!hasTherapistInformation) return patients;
  return patients.filter((patient) => {
    const id = getTrackerTherapistId(patient);
    return id != null && String(id) === String(therapistId);
  });
}
export default function PerformanceDashboard({ user, actingAs }) {
  const [selectedMonth, setSelectedMonth] = useState(
    () => getLocalMonthString()
  );
  const currentMonth = selectedMonth;
  const previousMonth = shiftMonth(currentMonth, -1);
  const selectedTherapistId = actingAs?.id ?? user?.id ?? null;
  const [currentAssignments, setCurrentAssignments] = useState([]);
  const [previousAssignments, setPreviousAssignments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const loadPerformanceData = useCallback(async () => {
    if (!currentMonth) return;
    setLoading(true);
    setError("");
    try {
      const currentRange = getMonthDateRange(currentMonth);
      const previousRange = getMonthDateRange(previousMonth);
      const currentParams = new URLSearchParams(currentRange);
      const previousParams = new URLSearchParams(previousRange);
      const trackerParams = new URLSearchParams({
        month: currentMonth,
      });
      const [
        currentResponse,
        previousResponse,
        trackerResponse,
      ] = await Promise.all([
        api.get(
          `reception/assignments/?${currentParams.toString()}`
        ),
        api.get(
          `reception/assignments/?${previousParams.toString()}`
        ),
        api.get(
          `patients/tracker/?${trackerParams.toString()}`
        ),
      ]);
      const currentRows = getArray(
        currentResponse.data,
        "assignments"
      );
      const previousRows = getArray(
        previousResponse.data,
        "assignments"
      );
      const trackerPatients = getArray(
        trackerResponse.data,
        "patients"
      );
      const trackerRows =
        trackerPatients.length > 0
          ? trackerPatients
          : getArray(trackerResponse.data, "results");
      setCurrentAssignments(
        currentRows.filter((item) =>
          belongsToTherapist(item, selectedTherapistId)
        )
      );
      setPreviousAssignments(
        previousRows.filter((item) =>
          belongsToTherapist(item, selectedTherapistId)
        )
      );
      setPatients(
        filterTrackerPatients(
          trackerRows,
          selectedTherapistId
        )
      );
    } catch (err) {
      console.error(
        "Failed to load performance dashboard:",
        err
      );
      console.error(
        "Performance dashboard API error:",
        err?.response?.data
      );
      setCurrentAssignments([]);
      setPreviousAssignments([]);
      setPatients([]);
      setError(
        "Performance data could not be loaded. Please check the API responses and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [
    currentMonth,
    previousMonth,
    selectedTherapistId,
  ]);
  useEffect(() => {
    loadPerformanceData();
  }, [loadPerformanceData]);
  const currentEvaluations =
    currentAssignments.filter(isEvaluation).length;
  const previousEvaluations =
    previousAssignments.filter(isEvaluation).length;
  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headingGroup}>
          <span style={styles.eyebrow}>PERFORMANCE REPORT</span>
          <h2 style={styles.heading}>
            Performance Dashboard
          </h2>
          <p style={styles.subtitle}>
            Your evaluation activity, target progress, patient status,
            and insurance session utilization.
          </p>
        </div>
        <div style={styles.headerActions}>
          <span style={styles.monthBadge}>
            {getMonthLabel(currentMonth)}
          </span>
          <button
            type="button"
            onClick={loadPerformanceData}
            disabled={loading}
            style={{
              ...styles.refreshButton,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 7v5h-5" />
              <path d="M4 17v-5h5" />
              <path d="M5.6 9a7 7 0 0 1 11.6-2L20 12" />
              <path d="M4 12l2.8 5a7 7 0 0 0 11.6-2" />
            </svg>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>
      {/* Month filter */}
      <section style={styles.filterCard} aria-label="Report filters">
        <div style={styles.filterIntro}>
          <div style={styles.filterIcon} aria-hidden="true">
            <svg
              width="23"
              height="23"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M16 3v4M8 3v4M3 11h18" />
            </svg>
          </div>
          <div>
            <h3 style={styles.filterTitle}>Report Period</h3>
            <p style={styles.filterSubtitle}>
              Select a month to view its performance and utilization data.
            </p>
          </div>
        </div>
        <div style={styles.filterControls}>
          <div>
            <label htmlFor="performance-month" style={styles.filterLabel}>
              Select month
            </label>
            <input
              id="performance-month"
              type="month"
              value={selectedMonth}
              onChange={(event) => {
                if (event.target.value) {
                  setSelectedMonth(event.target.value);
                }
              }}
              style={styles.monthInput}
            />
          </div>
        </div>
      </section>
      {error && (
        <div role="alert" style={styles.error}>
          {error}
        </div>
      )}
      {/* Monthly evaluation summary */}
      <section style={styles.targetSection}>
        <div style={styles.targetBanner}>
          <div style={styles.targetLeft}>
            <div style={styles.targetIcon}>✦</div>
            <div>
              <div style={styles.targetLabel}>
                EVALUATION PERFORMANCE
              </div>
              <div style={styles.targetValue}>
                {getMonthLabel(currentMonth)}
              </div>
            </div>
          </div>
          <span style={styles.targetBadge}>Monthly overview</span>
        </div>
        <div style={styles.sectionHeading}>
          <div>
            <h3 style={styles.sectionTitle}>Estimated Target</h3>
            <p style={styles.sectionSubtitle}>
              Evaluation activity and patient data for the selected
              reporting month.
            </p>
          </div>
          <span style={styles.sectionBadge}>
            {loading ? "Loading data" : "Report summary"}
          </span>
        </div>
        <div style={{ minWidth: 0 }}>
          <EstimatedTargetCard
            currentMonth={getMonthLabel(currentMonth)}
            previousMonth={getMonthLabel(previousMonth)}
            currentEvaluations={currentEvaluations}
            previousEvaluations={previousEvaluations}
            patients={patients}
          />
        </div>
      </section>
      {loading && (
        <div style={styles.loadingPanel} role="status">
          <span style={styles.loadingDot} />
          Loading performance information for {getMonthLabel(currentMonth)}...
        </div>
      )}
      {/* Patient and insurance reports */}
      <section style={styles.chartSection}>
        <div style={styles.chartWrapper}>
          <div style={styles.sectionHeading}>
            <div>
              <h3 style={styles.sectionTitle}>Patient Status</h3>
              <p style={styles.sectionSubtitle}>
                Patient distribution and status overview for the selected month.
              </p>
            </div>
            <span
              style={{
                ...styles.sectionBadge,
                background: COLORS.blueLight,
                color: COLORS.blue,
              }}
            >
              Patient report
            </span>
          </div>
          <PatientStatusChart
            patients={patients}
            loading={loading}
          />
        </div>
        <div style={styles.chartWrapper}>
          <InsuranceUtilizationChart
            patients={patients}
            loading={loading}
          />
        </div>
      </section>
      <footer style={styles.footer}>
        <strong style={{ color: COLORS.navy }}>
          Reporting period:
        </strong>{" "}
        {getMonthLabel(currentMonth)}. Evaluation totals are calculated
        from assignment records returned by the API. Patient status and
        insurance utilization use the selected month's tracker data.
      </footer>
    </div>
  );
}
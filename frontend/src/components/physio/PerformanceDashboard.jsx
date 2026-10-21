
import React, { useCallback, useEffect, useState } from "react";
import api from "../../api/api";
import EstimatedTargetCard from "./performance/EstimatedTargetCard";
import PatientStatusChart from "./performance/PatientStatusChart";
import InsuranceUtilizationChart from "./performance/InsuranceUtilizationChart";

const styles = {
  page: {
    display: "grid",
    gap: 20,
    minWidth: 0,
  },
  heading: {
    margin: 0,
    color: "#142d4e",
    fontSize: 24,
    fontWeight: 850,
  },
  subtitle: {
    margin: "7px 0 0",
    color: "#64748b",
    fontSize: 14,
    lineHeight: 1.6,
  },
  targetGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 18,
    minWidth: 0,
  },
  chartGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
    gap: 18,
    minWidth: 0,
    alignItems: "start",
  },
  panel: {
    padding: 18,
    background: "#ffffff",
    border: "1px solid #e5eaf1",
    borderRadius: 14,
    color: "#334155",
    fontSize: 14,
  },
  error: {
    padding: 14,
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    borderRadius: 12,
    color: "#9f1239",
    fontSize: 14,
  },
  button: {
    minHeight: 40,
    padding: "9px 15px",
    border: "1px solid #d6deea",
    borderRadius: 10,
    background: "#ffffff",
    color: "#142d4e",
    fontWeight: 750,
    cursor: "pointer",
  },
  topRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
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

  // If the record contains no therapist field, leave it in place.
  // The endpoint may already be scoped to the logged-in therapist.
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

function getInsuranceTherapistId(item) {
  return (
    item?.therapist_id ??
    item?.therapist?.id ??
    item?.assigned_therapist_id ??
    item?.physio_id ??
    item?.physiotherapist_id ??
    item?.user_id ??
    null
  );
}

function filterTrackerPatients(patients, therapistId) {
  if (therapistId == null || patients.length === 0) {
    return patients;
  }

  const hasTherapistInformation = patients.some(
    (patient) => getInsuranceTherapistId(patient) != null
  );

  // Do not discard tracker rows if the endpoint does not expose assignment IDs.
  if (!hasTherapistInformation) return patients;

  return patients.filter((patient) => {
    const id = getInsuranceTherapistId(patient);
    return id != null && String(id) === String(therapistId);
  });
}

export default function PerformanceDashboard({ user, actingAs }) {
  const currentMonth = getLocalMonthString();
  const previousMonth = shiftMonth(currentMonth, -1);
  const selectedTherapistId = actingAs?.id ?? user?.id ?? null;

  const [currentAssignments, setCurrentAssignments] = useState([]);
  const [previousAssignments, setPreviousAssignments] = useState([]);
  const [patients, setPatients] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPerformanceData = useCallback(async () => {
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

      const [currentResponse, previousResponse, trackerResponse] =
        await Promise.all([
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
      const trackerRows = getArray(
        trackerResponse.data,
        "patients"
      );

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
        filterTrackerPatients(trackerRows, selectedTherapistId)
      );
    } catch (err) {
      console.error("Failed to load performance dashboard:", err);
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
  }, [currentMonth, previousMonth, selectedTherapistId]);

  useEffect(() => {
    loadPerformanceData();
  }, [loadPerformanceData]);

  const currentEvaluations = currentAssignments.filter(isEvaluation).length;
  const previousEvaluations = previousAssignments.filter(isEvaluation).length;

  return (
    <div style={styles.page}>
      <div style={styles.topRow}>
        <div>
          <h2 style={styles.heading}>Performance Dashboard</h2>
          <p style={styles.subtitle}>
            Evaluation-based target, patient status, insurance distribution,
            and session utilization.
          </p>
        </div>

        <button
          type="button"
          onClick={loadPerformanceData}
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

      <div style={styles.targetGrid}>
        <EstimatedTargetCard
          currentMonth={getMonthLabel(currentMonth)}
          previousMonth={getMonthLabel(previousMonth)}
          currentEvaluations={currentEvaluations}
          previousEvaluations={previousEvaluations}
        />
      </div>

      {loading && (
        <div style={styles.panel}>
          Loading performance information...
        </div>
      )}

      <div style={styles.chartGrid}>
        <PatientStatusChart
          patients={patients}
          loading={loading}
        />

        <InsuranceUtilizationChart
          patients={patients}
          loading={loading}
        />
      </div>
    </div>
  );
}

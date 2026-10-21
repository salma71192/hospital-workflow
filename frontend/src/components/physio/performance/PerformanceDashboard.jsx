import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../api/api";

import EstimatedTargetCard from "./performance/EstimatedTargetCard";
import PatientStatusChart from "./performance/PatientStatusChart";
import InsuranceUtilizationChart from "./performance/InsuranceUtilizationChart";

function getLocalMonthString(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
  ].join("-");
}

function getPreviousMonth(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 2, 1);

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
    null
  );
}

function belongsToTherapist(item, therapistId) {
  if (therapistId == null) return false;

  const id = getTherapistId(item);

  return id != null && String(id) === String(therapistId);
}

function getCategory(item) {
  return String(item?.category ?? item?.category_label ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function isInitialEvaluation(item) {
  return [
    "initial_evaluation",
    "initial_eval",
    "evaluation",
    "eval",
  ].includes(getCategory(item));
}

function getMonthLabel(month) {
  const [year, monthNumber] = month.split("-").map(Number);

  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthNumber - 1, 1));
}

export default function PerformanceDashboard({ user, actingAs }) {
  const currentMonth = useMemo(() => getLocalMonthString(), []);
  const previousMonth = useMemo(
    () => getPreviousMonth(currentMonth),
    [currentMonth]
  );

  const selectedTherapistId = actingAs?.id ?? user?.id ?? null;

  const [currentEvaluations, setCurrentEvaluations] = useState(0);
  const [previousEvaluations, setPreviousEvaluations] = useState(0);
  const [patients, setPatients] = useState([]);

  const [loadingEvaluations, setLoadingEvaluations] = useState(true);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [error, setError] = useState("");

  const loadPerformanceData = useCallback(async () => {
    setLoadingEvaluations(true);
    setLoadingPatients(true);
    setError("");

    const currentRange = getMonthDateRange(currentMonth);
    const previousRange = getMonthDateRange(previousMonth);

    try {
      const [currentRes, previousRes] = await Promise.all([
        api.get("reception/assignments/", {
          params: currentRange,
        }),
        api.get("reception/assignments/", {
          params: previousRange,
        }),
      ]);

      const currentRows = getArray(currentRes.data, "assignments").filter(
        (item) => belongsToTherapist(item, selectedTherapistId)
      );

      const previousRows = getArray(previousRes.data, "assignments").filter(
        (item) => belongsToTherapist(item, selectedTherapistId)
      );

      setCurrentEvaluations(currentRows.filter(isInitialEvaluation).length);
      setPreviousEvaluations(
        previousRows.filter(isInitialEvaluation).length
      );
    } catch (err) {
      console.error("Failed to load performance evaluations:", err);
      setCurrentEvaluations(0);
      setPreviousEvaluations(0);
      setError(
        err?.response?.data?.error ||
          "Could not load evaluation totals. Please refresh and try again."
      );
    } finally {
      setLoadingEvaluations(false);
    }

    try {
      const res = await api.get("patients/tracker/", {
        params: { month: currentMonth },
      });

      const rows = getArray(res.data, "patients");

      setPatients(
        rows.filter((item) =>
          belongsToTherapist(item, selectedTherapistId)
        )
      );
    } catch (err) {
      console.error("Failed to load performance patient records:", err);
      setPatients([]);
      setError((previous) =>
        previous ||
        err?.response?.data?.error ||
        "Could not load patient status and insurance data."
      );
    } finally {
      setLoadingPatients(false);
    }
  }, [currentMonth, previousMonth, selectedTherapistId]);

  useEffect(() => {
    loadPerformanceData();
  }, [loadPerformanceData]);

  const styles = {
    page: {
      display: "grid",
      gap: 20,
      width: "100%",
      minWidth: 0,
      fontFamily: "Inter, Arial, sans-serif",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 16,
    },
    title: {
      color: "#16334f",
      fontSize: 28,
      fontWeight: 850,
      margin: 0,
    },
    subtitle: {
      color: "#64748b",
      fontSize: 13,
      lineHeight: 1.6,
      marginTop: 7,
    },
    button: {
      border: "1px solid #dbe4ee",
      borderRadius: 10,
      padding: "10px 15px",
      background: "#ffffff",
      color: "#243b53",
      fontSize: 13,
      fontWeight: 750,
      cursor: "pointer",
    },
    charts: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
      gap: 20,
      alignItems: "start",
    },
    error: {
      border: "1px solid #fecaca",
      background: "#fff1f2",
      color: "#b42318",
      borderRadius: 12,
      padding: 14,
      fontSize: 13,
      lineHeight: 1.5,
    },
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Performance</h1>
          <div style={styles.subtitle}>
            Evaluation-based target, patient status, insurance distribution,
            and session utilization.
          </div>
        </div>

        <button
          type="button"
          onClick={loadPerformanceData}
          disabled={loadingEvaluations || loadingPatients}
          style={{
            ...styles.button,
            opacity:
              loadingEvaluations || loadingPatients ? 0.65 : 1,
          }}
        >
          {loadingEvaluations || loadingPatients
            ? "Refreshing..."
            : "↻ Refresh data"}
        </button>
      </header>

      {error ? (
        <div role="alert" style={styles.error}>
          {error}
        </div>
      ) : null}

      {loadingEvaluations ? (
        <div>Loading evaluation totals...</div>
      ) : (
        <EstimatedTargetCard
          currentMonth={getMonthLabel(currentMonth)}
          previousMonth={getMonthLabel(previousMonth)}
          currentEvaluations={currentEvaluations}
          previousEvaluations={previousEvaluations}
        />
      )}

      <div style={styles.charts}>
        <PatientStatusChart
          patients={patients}
          loading={loadingPatients}
        />

        <InsuranceUtilizationChart
          patients={patients}
          loading={loadingPatients}
        />
      </div>
    </div>
  );
}
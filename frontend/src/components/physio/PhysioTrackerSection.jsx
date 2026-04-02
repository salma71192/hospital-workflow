import React from "react";
import DashboardNotice from "../common/DashboardNotice";
import PatientSearchBar from "../patients/PatientSearchBar";
import PatientTrackerTable from "../patients/PatientTrackerTable";

export default function PhysioTrackerSection({
  trackerMonth,
  setTrackerMonth,
  patientSearch,
  setPatientSearch,
  loadTracker,
  patients = [],
  patientError = "",
}) {
  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Monthly Follow-up Tracker</h2>

      <div style={styles.filtersRow}>
        <div style={styles.monthField}>
          <label style={styles.label}>Month</label>
          <input
            type="month"
            value={trackerMonth}
            onChange={(e) => {
              setTrackerMonth(e.target.value);
              loadTracker(e.target.value, patientSearch);
            }}
            style={styles.input}
          />
        </div>

        <div style={styles.searchWrap}>
          <PatientSearchBar
            value={patientSearch}
            onChange={setPatientSearch}
            onSubmit={(e) => {
              e.preventDefault();
              loadTracker(trackerMonth, patientSearch);
            }}
            onClear={() => {
              setPatientSearch("");
              loadTracker(trackerMonth, "");
            }}
          />
        </div>
      </div>

      {patientError ? (
        <DashboardNotice type="error">{patientError}</DashboardNotice>
      ) : (
        <PatientTrackerTable
          patients={patients}
          title="Therapist Monthly Tracker"
          monthLabel={trackerMonth}
        />
      )}
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
    border: "1px solid #d9f1e5",
    display: "grid",
    gap: "18px",
  },
  cardTitle: {
    margin: 0,
    fontSize: "22px",
    color: "#0f172a",
    fontWeight: "800",
  },
  filtersRow: {
    display: "grid",
    gap: "16px",
  },
  monthField: {
    maxWidth: "220px",
    display: "grid",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  input: {
    padding: "13px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box",
  },
  searchWrap: {
    minWidth: 0,
  },
};
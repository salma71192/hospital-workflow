
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
  const handleMonthChange = (event) => {
    const month = event.target.value;

    setTrackerMonth(month);

    if (typeof loadTracker === "function") {
      loadTracker(month, patientSearch);
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();

    if (typeof loadTracker === "function") {
      loadTracker(trackerMonth, patientSearch);
    }
  };

  const handleClearSearch = () => {
    setPatientSearch("");

    if (typeof loadTracker === "function") {
      loadTracker(trackerMonth, "");
    }
  };

  return (
    <div className="physio-tracker-page" style={styles.page}>
      <section style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerText}>
            <div style={styles.eyebrow}>
              PATIENT MANAGEMENT
            </div>

            <h2 style={styles.cardTitle}>
              Monthly Follow-up Tracker
            </h2>

            <p style={styles.subtitle}>
              Review and search patient follow-ups for the selected month.
            </p>
          </div>

          <div style={styles.headerIcon} aria-hidden="true">
            <svg
              width="27"
              height="27"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="17" rx="3" />
              <path d="M16 2v4M8 2v4M3 10h18" />
              <path d="m8 15 2 2 5-5" />
            </svg>
          </div>
        </div>

        {/* Filters */}
        <section style={styles.filterPanel}>
          <div style={styles.filterHeading}>
            <div style={styles.filterIcon} aria-hidden="true">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 5h16M7 12h10m-7 7h4" />
              </svg>
            </div>

            <div>
              <h3 style={styles.filterTitle}>
                Tracker Filters
              </h3>

              <p style={styles.filterDescription}>
                Select a month or search for a patient.
              </p>
            </div>
          </div>

          <div
            className="physio-tracker-filters"
            style={styles.filtersRow}
          >
            {/* Month filter */}
            <div style={styles.monthField}>
              <label
                htmlFor="physio-tracker-month"
                style={styles.label}
              >
                <span style={styles.labelIcon} aria-hidden="true">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="17" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                </span>

                Month
              </label>

              <input
                id="physio-tracker-month"
                type="month"
                value={trackerMonth || ""}
                onChange={handleMonthChange}
                style={styles.input}
              />
            </div>

            {/* Patient search */}
            <div style={styles.searchWrap}>
              <div style={styles.label}>
                <span style={styles.labelIcon} aria-hidden="true">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-4-4" />
                  </svg>
                </span>

                Search Patients
              </div>

              <PatientSearchBar
                value={patientSearch}
                onChange={setPatientSearch}
                onSubmit={handleSearch}
                onClear={handleClearSearch}
              />
            </div>
          </div>
        </section>

        {/* Error or tracker table */}
        {patientError ? (
          <div style={styles.noticeWrap}>
            <DashboardNotice type="error">
              {patientError}
            </DashboardNotice>
          </div>
        ) : (
          <div style={styles.tableSection}>
            <div style={styles.tableHeader}>
              <div>
                <h3 style={styles.tableTitle}>
                  Therapist Monthly Tracker
                </h3>

                <p style={styles.tableSubtitle}>
                  Patient follow-up records
                  {trackerMonth ? ` · ${trackerMonth}` : ""}
                </p>
              </div>

              <div style={styles.recordBadge}>
                {patients.length}{" "}
                {patients.length === 1 ? "record" : "records"}
              </div>
            </div>

            <div style={styles.tableWrap}>
              <PatientTrackerTable
                patients={patients}
                title="Therapist Monthly Tracker"
                monthLabel={trackerMonth}
              />
            </div>
          </div>
        )}
      </section>

      {/* Responsive filter layout */}
      <style>
        {`
          @media (max-width: 700px) {
            .physio-tracker-filters {
              grid-template-columns: minmax(0, 1fr) !important;
            }

            .physio-tracker-page {
              width: 100%;
            }
          }
        `}
      </style>
    </div>
  );
}

const styles = {
  page: {
    display: "grid",
    gap: 20,
    minWidth: 0,
    width: "100%",
    fontFamily: "Inter, Arial, sans-serif",
    boxSizing: "border-box",
  },

  card: {
    minWidth: 0,
    display: "grid",
    gap: 22,
    padding: "clamp(16px, 3vw, 26px)",
    background: "#ffffff",
    border: "1px solid #e0eaf4",
    borderRadius: 20,
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 16,
    paddingBottom: 20,
    borderBottom: "1px solid #edf2f7",
  },

  headerText: {
    minWidth: 0,
    flex: "1 1 250px",
  },

  eyebrow: {
    marginBottom: 8,
    color: "#07856f",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "1.3px",
  },

  cardTitle: {
    margin: 0,
    color: "#10243e",
    fontSize: "clamp(21px, 3vw, 27px)",
    lineHeight: 1.3,
    fontWeight: 800,
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#718096",
    fontSize: 13,
    lineHeight: 1.6,
  },

  headerIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: 54,
    height: 54,
    borderRadius: 16,
    color: "#087f8c",
    background: "#e8f7fa",
    border: "1px solid #d5eff3",
  },

  filterPanel: {
    display: "grid",
    gap: 20,
    padding: "clamp(15px, 2.5vw, 22px)",
    background: "#f5f9fd",
    border: "1px solid #e2ebf5",
    borderRadius: 16,
    minWidth: 0,
    boxSizing: "border-box",
  },

  filterHeading: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },

  filterIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 38,
    height: 38,
    flexShrink: 0,
    color: "#176b87",
    background: "#e3f2fa",
    borderRadius: 11,
  },

  filterTitle: {
    margin: 0,
    color: "#16334f",
    fontSize: 16,
    fontWeight: 800,
  },

  filterDescription: {
    margin: "4px 0 0",
    color: "#718096",
    fontSize: 12,
    lineHeight: 1.5,
  },

  filtersRow: {
    display: "grid",
    gridTemplateColumns: "minmax(190px, 0.7fr) minmax(260px, 1.3fr)",
    alignItems: "start",
    gap: 18,
    minWidth: 0,
  },

  monthField: {
    display: "grid",
    gap: 9,
    minWidth: 0,
  },

  label: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    color: "#40556d",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.2px",
  },

  labelIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#647b92",
  },

  input: {
    display: "block",
    width: "100%",
    minWidth: 0,
    minHeight: 45,
    boxSizing: "border-box",
    padding: "11px 13px",
    border: "1px solid #d4e0ec",
    borderRadius: 10,
    outlineColor: "#07856f",
    background: "#ffffff",
    color: "#243b53",
    fontSize: 14,
    fontFamily: "inherit",
    boxShadow: "0 2px 5px rgba(15, 23, 42, 0.02)",
  },

  searchWrap: {
    display: "grid",
    gap: 9,
    minWidth: 0,
  },

  tableSection: {
    display: "grid",
    gap: 16,
    minWidth: 0,
  },

  tableHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    minWidth: 0,
  },

  tableTitle: {
    margin: 0,
    color: "#10243e",
    fontSize: 19,
    fontWeight: 800,
    lineHeight: 1.4,
  },

  tableSubtitle: {
    margin: "5px 0 0",
    color: "#718096",
    fontSize: 12,
    lineHeight: 1.5,
  },

  recordBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    borderRadius: 999,
    background: "#e9f9f1",
    border: "1px solid #ccefe0",
    color: "#08784f",
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  tableWrap: {
    minWidth: 0,
    width: "100%",
    overflowX: "auto",
  },

  noticeWrap: {
    minWidth: 0,
  },
};


import React, { useEffect, useState } from "react";

export default function PatientSearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder = "Search Patient File",
  searchLabel = "Search",
  clearLabel = "Clear",

  // Optional props for controlling search results
  results = [],
  selectedPatient = null,
  onSelectPatient,
  onOpenNewFile,
  loading = false,
  searched = false,
}) {
  const [showResults, setShowResults] = useState(false);

  const hasSelectedPatient = Boolean(selectedPatient);
  const hasResults = Array.isArray(results) && results.length > 0;
  const showNoRecord =
    searched &&
    !loading &&
    !hasSelectedPatient &&
    !hasResults;

  useEffect(() => {
    if (hasSelectedPatient) {
      setShowResults(false);
    }
  }, [hasSelectedPatient]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (loading || hasSelectedPatient) return;

    setShowResults(true);

    if (typeof onSubmit === "function") {
      onSubmit(event);
    }
  };

  const handleClear = () => {
    setShowResults(false);

    if (typeof onClear === "function") {
      onClear();
    }
  };

  const handleSelectPatient = (patient) => {
    setShowResults(false);

    if (typeof onSelectPatient === "function") {
      onSelectPatient(patient);
    }
  };

  const getPatientName = (patient) =>
    patient.full_name ||
    patient.name ||
    patient.patient_name ||
    "Unnamed patient";

  const getPatientNumber = (patient) =>
    patient.file_number ||
    patient.hospital_file_number ||
    patient.patient_number ||
    patient.mrn ||
    patient.id ||
    "";

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <span style={styles.eyebrow}>RECEPTION TEAM</span>

          <h2 style={styles.title}>Search Patient File</h2>

          <p style={styles.subtitle}>
            Find an existing patient by name or hospital file number.
          </p>
        </div>

        <span style={styles.headerBadge}>
          <span style={styles.badgeIcon}>✓</span>
          Patient Lookup
        </span>
      </div>

      {hasSelectedPatient ? (
        <div style={styles.selectedPatient}>
          <div style={styles.selectedIcon}>✓</div>

          <div style={styles.selectedInfo}>
            <span style={styles.selectedLabel}>
              PATIENT SELECTED
            </span>

            <strong style={styles.selectedName}>
              {getPatientName(selectedPatient)}
            </strong>

            {getPatientNumber(selectedPatient) && (
              <span style={styles.selectedNumber}>
                File No. {getPatientNumber(selectedPatient)}
              </span>
            )}
          </div>

          <button
            type="button"
            style={styles.changeButton}
            onClick={handleClear}
          >
            Change
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={styles.searchRow}>
          <div style={styles.inputWrapper}>
            <span style={styles.searchIcon} aria-hidden="true">
              ⌕
            </span>

            <input
              type="text"
              name="patient_search"
              placeholder={placeholder}
              value={value ?? ""}
              onChange={(event) => {
                setShowResults(false);
                onChange(event.target.value);
              }}
              style={styles.input}
              aria-label="Search Patient File"
              autoComplete="off"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            style={{
              ...styles.primaryButton,
              ...(loading ? styles.disabledButton : {}),
            }}
            disabled={loading || !String(value ?? "").trim()}
          >
            {loading ? (
              <>
                <span style={styles.spinner} />
                Searching...
              </>
            ) : (
              <>
                <span style={styles.buttonIcon}>⌕</span>
                {searchLabel}
              </>
            )}
          </button>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={handleClear}
            disabled={loading}
          >
            <span style={styles.clearIcon}>×</span>
            {clearLabel}
          </button>
        </form>
      )}

      {/* Search results appear only while the user is searching.
          Selecting a patient hides this entire section. */}
      {!hasSelectedPatient &&
        showResults &&
        searched &&
        !loading &&
        hasResults && (
          <div style={styles.resultsSection}>
            <div style={styles.resultsHeader}>
              <span style={styles.resultsTitle}>
                Matching Patient Records
              </span>

              <span style={styles.resultsCount}>
                {results.length} found
              </span>
            </div>

            <div style={styles.resultsList}>
              {results.map((patient) => (
                <button
                  type="button"
                  key={patient.id}
                  style={styles.resultItem}
                  onClick={() => handleSelectPatient(patient)}
                >
                  <span style={styles.resultAvatar}>
                    {getPatientName(patient)
                      .charAt(0)
                      .toUpperCase()}
                  </span>

                  <span style={styles.resultInfo}>
                    <strong style={styles.resultName}>
                      {getPatientName(patient)}
                    </strong>

                    <span style={styles.resultNumber}>
                      File No. {getPatientNumber(patient) || "N/A"}
                    </span>
                  </span>

                  <span style={styles.selectLabel}>
                    Select →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

      {/* Show the new-file option only when a search completed
          without finding a matching patient. */}
      {!hasSelectedPatient && showResults && showNoRecord && (
        <div style={styles.noRecordBox}>
          <div style={styles.noRecordIcon}>⌕</div>

          <div style={styles.noRecordContent}>
            <strong style={styles.noRecordTitle}>
              No patient record found
            </strong>

            <p style={styles.noRecordText}>
              No matching record was found. You can open a new patient
              file if this patient has not been registered before.
            </p>

            <button
              type="button"
              style={styles.newFileButton}
              onClick={() => {
                if (typeof onOpenNewFile === "function") {
                  onOpenNewFile(value);
                }
              }}
            >
              <span>＋</span>
              Open New Patient File
            </button>
          </div>
        </div>
      )}

      <div style={styles.footer}>
        <div style={styles.tip}>
          <span style={styles.tipIcon}>i</span>

          <span>
            {hasSelectedPatient
              ? "Patient selected. Search results have been hidden."
              : "Enter a patient name or file number to find a record."}
          </span>
        </div>

        <span style={styles.footerBadge}>
          <span style={styles.statusDot} />
          Existing Patient Records
        </span>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "#FFFFFF",
    borderRadius: "18px",
    boxShadow: "0 8px 25px rgba(15, 23, 42, 0.06)",
    border: "1px solid #E2E8F0",
    padding: "clamp(16px, 3vw, 26px)",
    display: "grid",
    gap: "20px",
    width: "100%",
    boxSizing: "border-box",
    minWidth: 0,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "14px",
  },

  eyebrow: {
    display: "inline-block",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.09em",
    color: "#0F766E",
    background: "#F0FDFA",
    border: "1px solid #CCFBF1",
    borderRadius: "7px",
    padding: "6px 10px",
    marginBottom: "10px",
  },

  title: {
    margin: "0 0 7px",
    fontSize: "clamp(21px, 3vw, 26px)",
    fontWeight: 800,
    color: "#1E293B",
  },

  subtitle: {
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.7,
    color: "#64748B",
  },

  headerBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 11px",
    borderRadius: "10px",
    background: "#F0FDFA",
    border: "1px solid #CCFBF1",
    color: "#0F766E",
    fontSize: "11px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  badgeIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "22px",
    height: "22px",
    borderRadius: "7px",
    background: "#0F766E",
    color: "#FFFFFF",
    fontSize: "12px",
  },

  searchRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto auto",
    gap: "10px",
    alignItems: "stretch",
    width: "100%",
    minWidth: 0,
  },

  inputWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
    padding: "0 12px",
    background: "#FFFFFF",
    border: "1px solid #CBD5E1",
    borderRadius: "10px",
    boxSizing: "border-box",
  },

  searchIcon: {
    color: "#64748B",
    fontSize: "25px",
    lineHeight: 1,
    flexShrink: 0,
  },

  input: {
    flex: 1,
    minWidth: 0,
    width: "100%",
    padding: "13px 0",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#1E293B",
    fontSize: "14px",
    boxSizing: "border-box",
  },

  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    background: "#0F766E",
    color: "#FFFFFF",
    border: "1px solid #0F766E",
    borderRadius: "10px",
    padding: "12px 17px",
    fontSize: "13px",
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  disabledButton: {
    opacity: 0.6,
    cursor: "not-allowed",
  },

  buttonIcon: {
    fontSize: "19px",
    lineHeight: 1,
  },

  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    background: "#FFFFFF",
    color: "#475569",
    border: "1px solid #CBD5E1",
    borderRadius: "10px",
    padding: "12px 15px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  clearIcon: {
    fontSize: "20px",
    lineHeight: 1,
  },

  resultsSection: {
    border: "1px solid #DCE7E8",
    borderRadius: "12px",
    overflow: "hidden",
    background: "#FFFFFF",
  },

  resultsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    padding: "12px 14px",
    background: "#F8FAFC",
    borderBottom: "1px solid #E2E8F0",
  },

  resultsTitle: {
    color: "#334155",
    fontSize: "13px",
    fontWeight: 800,
  },

  resultsCount: {
    color: "#0F766E",
    background: "#CCFBF1",
    borderRadius: "20px",
    padding: "4px 8px",
    fontSize: "10px",
    fontWeight: 800,
  },

  resultsList: {
    display: "grid",
  },

  resultItem: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    width: "100%",
    minWidth: 0,
    padding: "12px 14px",
    background: "#FFFFFF",
    border: "none",
    borderBottom: "1px solid #F1F5F9",
    textAlign: "left",
    cursor: "pointer",
    boxSizing: "border-box",
  },

  resultAvatar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    flexShrink: 0,
    borderRadius: "10px",
    background: "#CCFBF1",
    color: "#0F766E",
    fontWeight: 800,
  },

  resultInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
    minWidth: 0,
  },

  resultName: {
    color: "#1E293B",
    fontSize: "13px",
    overflowWrap: "anywhere",
  },

  resultNumber: {
    color: "#64748B",
    fontSize: "11px",
  },

  selectLabel: {
    color: "#0F766E",
    fontSize: "12px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  selectedPatient: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px",
    borderRadius: "12px",
    background: "#F0FDFA",
    border: "1px solid #99F6E4",
    minWidth: 0,
  },

  selectedIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "34px",
    height: "34px",
    flexShrink: 0,
    borderRadius: "10px",
    background: "#0F766E",
    color: "#FFFFFF",
    fontSize: "17px",
    fontWeight: 800,
  },

  selectedInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
    minWidth: 0,
  },

  selectedLabel: {
    color: "#0F766E",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.7px",
  },

  selectedName: {
    color: "#134E4A",
    fontSize: "14px",
    overflowWrap: "anywhere",
  },

  selectedNumber: {
    color: "#64748B",
    fontSize: "11px",
  },

  changeButton: {
    background: "#FFFFFF",
    color: "#0F766E",
    border: "1px solid #99F6E4",
    borderRadius: "8px",
    padding: "8px 11px",
    fontSize: "12px",
    fontWeight: 800,
    cursor: "pointer",
    flexShrink: 0,
  },

  noRecordBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "13px",
    padding: "16px",
    borderRadius: "12px",
    border: "1px solid #FDE68A",
    background: "#FFFBEB",
  },

  noRecordIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    flexShrink: 0,
    borderRadius: "10px",
    background: "#FEF3C7",
    color: "#92400E",
    fontSize: "23px",
  },

  noRecordContent: {
    flex: 1,
    minWidth: 0,
  },

  noRecordTitle: {
    color: "#92400E",
    fontSize: "14px",
    fontWeight: 800,
  },

  noRecordText: {
    margin: "6px 0 13px",
    color: "#92400E",
    fontSize: "12px",
    lineHeight: 1.6,
  },

  newFileButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    background: "#0F766E",
    color: "#FFFFFF",
    border: "1px solid #0F766E",
    borderRadius: "9px",
    padding: "10px 13px",
    fontSize: "12px",
    fontWeight: 800,
    cursor: "pointer",
  },

  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    paddingTop: "14px",
    borderTop: "1px solid #F1F5F9",
  },

  tip: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#64748B",
    fontSize: "11px",
    lineHeight: 1.6,
  },

  tipIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background: "#CCFBF1",
    color: "#0F766E",
    fontSize: "11px",
    fontWeight: 800,
    fontStyle: "italic",
  },

  footerBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    background: "#F0FDFA",
    border: "1px solid #CCFBF1",
    color: "#0F766E",
    borderRadius: "20px",
    padding: "6px 10px",
    fontSize: "10px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  statusDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#14B8A6",
  },

  spinner: {
    width: "13px",
    height: "13px",
    border: "2px solid rgba(255,255,255,0.4)",
    borderTopColor: "#FFFFFF",
    borderRadius: "50%",
    display: "inline-block",
    animation: "patientSearchSpin 0.8s linear infinite",
  },
};

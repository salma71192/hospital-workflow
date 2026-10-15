import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
export default function UnifiedPatientSearch({
  title = "Search Patient",
  placeholder = "Search by patient name or ID",
  minChars = 1,
  debounceMs = 350,
  onSelectPatient,
  actionLabel = "Select",
  getActionLabel,
  secondaryActionLabel,
  onSecondarySelectPatient,
  showOpenFile = true,
  emptyText = "Start typing to search patients.",
  noResultsText = "No patients found.",
  initialValue = "",
  disabledPatientIds = [],
  disabledActionLabel = "Unavailable",
  onRegisterNew,
  registerButtonLabel = "Open New File",
}) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasTyped, setHasTyped] = useState(Boolean(initialValue));
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    const term = searchTerm.trim();
    if (!term || term.length < minChars) {
      requestIdRef.current += 1;
      setResults([]);
      setLoading(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const currentRequestId = ++requestIdRef.current;
      try {
        setLoading(true);
        const res = await api.get(
          `patients/?search=${encodeURIComponent(term)}`
        );
        if (currentRequestId !== requestIdRef.current) return;
        setResults(res.data.patients || []);
      } catch (err) {
        if (currentRequestId !== requestIdRef.current) return;
        setResults([]);
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, debounceMs);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm, minChars, debounceMs]);
  const trimmedSearch = searchTerm.trim();
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.headerIcon}>⌕</div>
          <div style={styles.headerText}>
            <h2 style={styles.cardTitle}>{title}</h2>
            <p style={styles.subtitle}>
              Find a patient record or create a new patient file.
            </p>
          </div>
          <div style={styles.headerBadge}>PATIENTS</div>
        </div>
        <div style={styles.searchSection}>
          <label style={styles.label}>Patient name or ID</label>
          <div style={styles.inputWrapper}>
            <span style={styles.searchIcon}>⌕</span>
            <input
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setHasTyped(true);
              }}
              style={styles.input}
              aria-label="Search patients by name or ID"
            />
            {trimmedSearch && (
              <button
                type="button"
                style={styles.clearButton}
                onClick={() => {
                  setSearchTerm("");
                  setResults([]);
                  setHasTyped(false);
                }}
                aria-label="Clear patient search"
              >
                ×
              </button>
            )}
          </div>
          <div style={styles.searchHint}>
            <span style={styles.hintDot} />
            Results update automatically as you type.
          </div>
        </div>
        <div style={styles.registerPanel}>
          <div style={styles.registerInfo}>
            <div style={styles.registerIcon}>＋</div>
            <div>
              <div style={styles.registerTitle}>New patient?</div>
              <div style={styles.registerDescription}>
                Create a new file if the patient is not registered yet.
              </div>
            </div>
          </div>
          <button
            type="button"
            style={{
              ...styles.registerButton,
              ...(!onRegisterNew ? styles.disabledButton : {}),
            }}
            onClick={() => {
              if (onRegisterNew) onRegisterNew();
            }}
            disabled={!onRegisterNew}
          >
            <span>＋</span> {registerButtonLabel}
          </button>
        </div>
        <div style={styles.resultsHeader}>
          <div style={styles.resultsTitle}>Patient Records</div>
          <div style={styles.resultsCount}>
            {loading
              ? "Searching..."
              : `${results.length} ${
                  results.length === 1 ? "record" : "records"
                }`}
          </div>
        </div>
        {loading && (
          <div style={styles.statusCard}>
            <span style={styles.loadingDot} />
            Searching patient records...
          </div>
        )}
        {!loading && !trimmedSearch && (
          <div style={styles.emptyCard}>
            <div style={styles.emptyIcon}>⌕</div>
            <div style={styles.emptyTitle}>Ready to search</div>
            <div style={styles.emptyDescription}>{emptyText}</div>
          </div>
        )}
        {!loading &&
          trimmedSearch.length < minChars &&
          trimmedSearch.length > 0 && (
            <div style={styles.statusCard}>
              Please enter at least {minChars} character
              {minChars === 1 ? "" : "s"}.
            </div>
          )}
        {!loading &&
          trimmedSearch.length >= minChars &&
          hasTyped &&
          results.length === 0 && (
            <div style={styles.emptyCard}>
              <div style={styles.emptyIcon}>!</div>
              <div style={styles.emptyTitle}>No matching patients</div>
              <div style={styles.emptyDescription}>{noResultsText}</div>
              {onRegisterNew && (
                <div style={styles.emptyRegisterNote}>
                  You can use “{registerButtonLabel}” above to continue.
                </div>
              )}
            </div>
          )}
        {!loading && results.length > 0 && (
          <div style={styles.resultsList}>
            {results.map((patient) => {
              const isDisabled = disabledPatientIds.includes(patient.id);
              return (
                <div
                  key={patient.id}
                  style={{
                    ...styles.resultRow,
                    ...(isDisabled ? styles.disabledRow : {}),
                  }}
                >
                  <div style={styles.patientInfo}>
                    <div style={styles.avatar}>
                      {(patient.name || "P")
                        .trim()
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div style={styles.patientDetails}>
                      <div style={styles.patientName}>
                        {patient.name || "Unnamed patient"}
                      </div>
                      <div style={styles.patientMeta}>
                        <span style={styles.idBadge}>
                          ID: {patient.patient_id || patient.id}
                        </span>
                        {isDisabled && (
                          <span style={styles.unavailableBadge}>
                            Unavailable
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={styles.actionButtons}>
                    {showOpenFile && (
                      <button
                        type="button"
                        style={styles.openButton}
                        onClick={() => navigate(`/patients/${patient.id}`)}
                      >
                        <span>↗</span> Open File
                      </button>
                    )}
                    {onSecondarySelectPatient && (
                      <button
                        type="button"
                        style={{
                          ...styles.secondaryButton,
                          ...(isDisabled ? styles.disabledAction : {}),
                        }}
                        disabled={isDisabled}
                        onClick={() => {
                          if (!isDisabled) {
                            onSecondarySelectPatient(patient);
                          }
                        }}
                      >
                        {secondaryActionLabel || "Secondary"}
                      </button>
                    )}
                    <button
                      type="button"
                      style={{
                        ...styles.selectButton,
                        ...(isDisabled ? styles.disabledAction : {}),
                      }}
                      disabled={isDisabled}
                      onClick={() => {
                        if (!isDisabled && onSelectPatient) {
                          onSelectPatient(patient);
                        }
                      }}
                    >
                      {isDisabled
                        ? disabledActionLabel
                        : getActionLabel
                        ? getActionLabel(patient)
                        : actionLabel}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div style={styles.footer}>
          <span style={styles.footerDot} />
          Patient search and record access
        </div>
      </div>
    </div>
  );
}
const styles = {
  page: {
    width: "100%",
    boxSizing: "border-box",
    padding: "8px 0",
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: "#172554",
  },
  card: {
    background: "#ffffff",
    borderRadius: "24px",
    border: "1px solid #e1eaf8",
    boxShadow: "0 14px 40px rgba(30, 64, 175, 0.08)",
    padding: "clamp(16px, 3vw, 28px)",
    boxSizing: "border-box",
    width: "100%",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    flexWrap: "wrap",
    marginBottom: "28px",
  },
  headerIcon: {
    width: "54px",
    height: "54px",
    borderRadius: "17px",
    background: "linear-gradient(135deg, #2563eb, #7c3aed)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "35px",
    fontWeight: "700",
    flexShrink: 0,
    boxShadow: "0 7px 18px rgba(79, 70, 229, 0.22)",
  },
  headerText: {
    flex: "1 1 180px",
    minWidth: 0,
  },
  cardTitle: {
    margin: 0,
    fontSize: "clamp(22px, 3vw, 29px)",
    fontWeight: "800",
    letterSpacing: "-0.7px",
    color: "#172554",
  },
  subtitle: {
    margin: "6px 0 0",
    fontSize: "14px",
    lineHeight: 1.5,
    color: "#64748b",
  },
  headerBadge: {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #dbeafe",
    borderRadius: "30px",
    padding: "8px 12px",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "0.8px",
  },
  searchSection: {
    marginBottom: "22px",
  },
  label: {
    display: "block",
    marginBottom: "9px",
    color: "#334155",
    fontSize: "14px",
    fontWeight: "750",
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    border: "1px solid #cbdcf5",
    borderRadius: "15px",
    padding: "0 14px",
    background: "#f8fbff",
    boxSizing: "border-box",
    width: "100%",
    minHeight: "54px",
    transition: "border-color 0.2s ease",
  },
  searchIcon: {
    color: "#2563eb",
    fontSize: "27px",
    fontWeight: "700",
    flexShrink: 0,
  },
  input: {
    flex: 1,
    minWidth: 0,
    border: "none",
    outline: "none",
    background: "transparent",
    padding: "15px 0",
    fontSize: "15px",
    color: "#0f172a",
    boxSizing: "border-box",
  },
  clearButton: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    border: "none",
    background: "#e2e8f0",
    color: "#475569",
    fontSize: "23px",
    lineHeight: 1,
    cursor: "pointer",
    flexShrink: 0,
  },
  searchHint: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    marginTop: "9px",
    fontSize: "12px",
    color: "#64748b",
  },
  hintDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#22c55e",
  },
  registerPanel: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    padding: "18px",
    marginBottom: "28px",
    border: "1px solid #c7f0df",
    borderRadius: "18px",
    background: "linear-gradient(120deg, #f0fdf4 0%, #ecfeff 100%)",
  },
  registerInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flex: "1 1 180px",
  },
  registerIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    background: "#d1fae5",
    color: "#047857",
    fontSize: "27px",
    fontWeight: "700",
    flexShrink: 0,
  },
  registerTitle: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#065f46",
  },
  registerDescription: {
    marginTop: "4px",
    fontSize: "12px",
    lineHeight: 1.5,
    color: "#477568",
  },
  registerButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    border: "none",
    borderRadius: "12px",
    padding: "13px 17px",
    background: "linear-gradient(135deg, #059669, #047857)",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 5px 12px rgba(5, 150, 105, 0.18)",
  },
  disabledButton: {
    opacity: 0.55,
    cursor: "not-allowed",
    boxShadow: "none",
  },
  resultsHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "10px",
    paddingBottom: "14px",
    marginBottom: "14px",
    borderBottom: "1px solid #e8eef7",
  },
  resultsTitle: {
    fontSize: "17px",
    fontWeight: "800",
    color: "#172554",
  },
  resultsCount: {
    padding: "6px 11px",
    borderRadius: "30px",
    background: "#eef2ff",
    color: "#4338ca",
    fontSize: "12px",
    fontWeight: "800",
  },
  statusCard: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "17px",
    borderRadius: "14px",
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    color: "#64748b",
    fontSize: "14px",
  },
  loadingDot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    background: "#6366f1",
    flexShrink: 0,
  },
  emptyCard: {
    textAlign: "center",
    padding: "30px 16px",
    borderRadius: "17px",
    background: "linear-gradient(135deg, #f8faff, #f5f3ff)",
    border: "1px dashed #d5d9f4",
  },
  emptyIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 12px",
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    background: "#e0e7ff",
    color: "#4f46e5",
    fontSize: "27px",
    fontWeight: "800",
  },
  emptyTitle: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#312e81",
  },
  emptyDescription: {
    marginTop: "7px",
    fontSize: "13px",
    lineHeight: 1.6,
    color: "#64748b",
  },
  emptyRegisterNote: {
    marginTop: "10px",
    fontSize: "12px",
    color: "#047857",
    fontWeight: "700",
  },
  resultsList: {
    display: "grid",
    gap: "12px",
  },
  resultRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "15px",
    padding: "16px",
    border: "1px solid #e3eaf5",
    borderRadius: "17px",
    background: "#ffffff",
    boxShadow: "0 3px 10px rgba(15, 23, 42, 0.025)",
  },
  disabledRow: {
    background: "#f8fafc",
    borderColor: "#cbd5e1",
    opacity: 0.85,
  },
  patientInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flex: "1 1 190px",
    minWidth: 0,
  },
  avatar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "46px",
    height: "46px",
    borderRadius: "15px",
    background: "linear-gradient(135deg, #dbeafe, #ede9fe)",
    color: "#4338ca",
    fontSize: "19px",
    fontWeight: "800",
    flexShrink: 0,
  },
  patientDetails: {
    display: "grid",
    gap: "7px",
    minWidth: 0,
  },
  patientName: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#172554",
    overflowWrap: "anywhere",
  },
  patientMeta: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "7px",
  },
  idBadge: {
    display: "inline-block",
    background: "#f1f5f9",
    color: "#475569",
    borderRadius: "7px",
    padding: "5px 8px",
    fontSize: "11px",
    fontWeight: "750",
  },
  unavailableBadge: {
    display: "inline-block",
    background: "#fee2e2",
    color: "#b91c1c",
    borderRadius: "7px",
    padding: "5px 8px",
    fontSize: "11px",
    fontWeight: "750",
  },
  actionButtons: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
  },
  openButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    border: "1px solid #bae6fd",
    borderRadius: "10px",
    padding: "10px 13px",
    background: "#e0f2fe",
    color: "#0369a1",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
  },
  secondaryButton: {
    border: "none",
    borderRadius: "10px",
    padding: "10px 13px",
    background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
  },
  selectButton: {
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
  },
  disabledAction: {
    background: "#cbd5e1",
    color: "#64748b",
    cursor: "not-allowed",
    boxShadow: "none",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "23px",
    paddingTop: "15px",
    borderTop: "1px solid #edf2f8",
    color: "#94a3b8",
    fontSize: "11px",
  },
  footerDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#10b981",
  },
};
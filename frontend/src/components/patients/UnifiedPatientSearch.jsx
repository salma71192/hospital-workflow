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
  showOpenFile = false,
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
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const term = searchTerm.trim();

    if (!term || term.length < minChars) {
      setResults([]);
      setLoading(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const currentRequestId = ++requestIdRef.current;

      try {
        setLoading(true);
        setHasTyped(true);

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
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm, minChars, debounceMs]);

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>{title}</h2>

      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setHasTyped(true);
        }}
        style={styles.input}
      />

      {loading && <div style={styles.helperText}>Searching...</div>}

      {!loading && !searchTerm.trim() && (
        <div style={styles.helperText}>{emptyText}</div>
      )}

      {!loading && searchTerm.trim() && hasTyped && results.length === 0 && (
        <div style={styles.noResultsCard}>
          <div style={styles.helperText}>{noResultsText}</div>

          {onRegisterNew ? (
            <button
              type="button"
              style={styles.registerButton}
              onClick={onRegisterNew}
            >
              {registerButtonLabel}
            </button>
          ) : null}
        </div>
      )}

      {results.length > 0 && (
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
                  <div style={styles.patientName}>{patient.name}</div>
                  <div style={styles.patientId}>ID: {patient.patient_id}</div>
                </div>

                <div style={styles.actionButtons}>
                  {showOpenFile ? (
                    <button
                      type="button"
                      style={styles.openButton}
                      onClick={() => navigate(`/patients/${patient.id}`)}
                    >
                      Open File
                    </button>
                  ) : null}

                  {onSecondarySelectPatient ? (
                    <button
                      type="button"
                      style={styles.secondaryButton}
                      disabled={isDisabled}
                      onClick={() => {
                        if (isDisabled) return;
                        onSecondarySelectPatient(patient);
                      }}
                    >
                      {secondaryActionLabel || "Secondary"}
                    </button>
                  ) : null}

                  <button
                    type="button"
                    style={{
                      ...styles.selectButton,
                      ...(isDisabled ? styles.selectButtonDisabled : {}),
                    }}
                    disabled={isDisabled}
                    onClick={() => {
                      if (isDisabled) return;
                      onSelectPatient && onSelectPatient(patient);
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
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: "22px",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e8eef7",
    padding: "24px",
  },
  cardTitle: {
    margin: "0 0 18px 0",
    fontSize: "28px",
    fontWeight: "800",
    color: "#0f172a",
  },
  input: {
    padding: "13px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box",
    marginBottom: "14px",
  },
  helperText: {
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: "12px",
    padding: "14px",
  },
  noResultsCard: {
    display: "grid",
    gap: "10px",
  },
  registerButton: {
    width: "fit-content",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  resultsList: {
    display: "grid",
    gap: "12px",
    marginTop: "10px",
  },
  resultRow: {
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "14px 16px",
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
    alignItems: "center",
    background: "#fff",
  },
  disabledRow: {
    background: "#f8fafc",
    borderColor: "#cbd5e1",
  },
  patientInfo: {
    display: "grid",
    gap: "4px",
  },
  patientName: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a",
  },
  patientId: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: "600",
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  openButton: {
    background: "#0ea5e9",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  secondaryButton: {
    background: "#7c3aed",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  selectButton: {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  selectButtonDisabled: {
    background: "#94a3b8",
    cursor: "not-allowed",
  },
};
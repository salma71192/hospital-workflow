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
  showOpenFile = true,
  emptyText = "Start typing to search patients.",
  noResultsText = "No patients found.",
  initialValue = "",
  disabledPatientIds = [],
  disabledActionLabel = "Already Assigned Today",
  getExtraBadgeText,
  onRegisterNew,
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

          {onRegisterNew && (
            <button
              type="button"
              style={styles.registerButton}
              onClick={onRegisterNew}
            >
              Register New Patient
            </button>
          )}
        </div>
      )}

      {results.length > 0 && (
        <div style={styles.resultsList}>
          {results.map((patient) => {
            const isDisabled = disabledPatientIds.includes(patient.id);
            const extraBadgeText = getExtraBadgeText
              ? getExtraBadgeText(patient)
              : "";

            return (
              <div
                key={patient.id}
                style={{
                  ...styles.resultCard,
                  ...(isDisabled ? styles.disabledCard : {}),
                }}
              >
                <div style={styles.infoBlock}>
                  <div style={styles.resultTopRow}>
                    <div style={styles.resultName}>{patient.name}</div>

                    {extraBadgeText ? (
                      <span style={{ ...styles.statusBadge, ...styles.badgeBlue }}>
                        {extraBadgeText}
                      </span>
                    ) : null}

                    {renderStatusBadge(patient)}
                  </div>

                  <div style={styles.resultMeta}>ID: {patient.patient_id}</div>

                  {"current_approval_number" in patient && (
                    <div style={styles.resultMeta}>
                      Approval: {patient.current_approval_number || "-"}
                    </div>
                  )}

                  {"approved_sessions" in patient && (
                    <div style={styles.resultMeta}>
                      Approved Sessions: {patient.approved_sessions ?? 0}
                    </div>
                  )}

                  {"sessions_taken" in patient && (
                    <div style={styles.resultMeta}>
                      Utilized Sessions: {patient.sessions_taken ?? 0}
                    </div>
                  )}

                  {"approved_sessions" in patient && "sessions_taken" in patient && (
                    <div style={styles.resultMeta}>
                      Remaining Sessions:{" "}
                      {Math.max(
                        Number(patient.approved_sessions || 0) -
                          Number(patient.sessions_taken || 0),
                        0
                      )}
                    </div>
                  )}

                  {"approval_expiry_date" in patient && (
                    <div style={styles.resultMeta}>
                      Expiry Date: {patient.approval_expiry_date || "-"}
                    </div>
                  )}
                </div>

                <div style={styles.actionButtons}>
                  {showOpenFile && (
                    <button
                      type="button"
                      style={styles.openButton}
                      onClick={() => navigate(`/patients/${patient.id}`)}
                    >
                      Open File
                    </button>
                  )}

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

function renderStatusBadge(patient) {
  const today = new Date().toISOString().split("T")[0];
  const approved = Number(patient.approved_sessions || 0);
  const used = Number(patient.sessions_taken || 0);
  const remaining = approved - used;

  const expired =
    patient.approval_expiry_date && patient.approval_expiry_date < today;

  const status =
    expired ? "expired" : remaining <= 2 && approved > 0 ? "low" : "ok";

  return (
    <span
      style={{
        ...styles.statusBadge,
        ...(status === "expired"
          ? styles.badgeRed
          : status === "low"
          ? styles.badgeYellow
          : styles.badgeGreen),
      }}
    >
      {status.toUpperCase()}
    </span>
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
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
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
  resultCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
    alignItems: "flex-start",
    background: "#fff",
  },
  disabledCard: {
    background: "#f8fafc",
    borderColor: "#bfdbfe",
  },
  infoBlock: {
    flex: 1,
    minWidth: "240px",
  },
  resultTopRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "6px",
  },
  resultName: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#0f172a",
  },
  resultMeta: {
    color: "#64748b",
    fontSize: "14px",
    marginBottom: "4px",
  },
  actionButtons: {
    display: "flex",
    gap: "10px",
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
  statusBadge: {
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    display: "inline-block",
  },
  badgeGreen: {
    background: "#dcfce7",
    color: "#166534",
  },
  badgeYellow: {
    background: "#fef3c7",
    color: "#92400e",
  },
  badgeRed: {
    background: "#fee2e2",
    color: "#b91c1c",
  },
  badgeBlue: {
    background: "#dbeafe",
    color: "#1d4ed8",
  },
};
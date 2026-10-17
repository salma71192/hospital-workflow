
import React from "react";
import { useNavigate } from "react-router-dom";

export default function PatientSearchPanel({
  searchTerm,
  setSearchTerm,
  onSearch,
  searchResults = [],
  onSelectPatient,
  actionLabel = "Assign",
}) {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerIcon}>
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
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
              <path d="M8 11h6M11 8v6" />
            </svg>
          </div>

          <div style={styles.headerText}>
            <h2 style={styles.cardTitle}>Search Patient</h2>
            <p style={styles.subtitle}>
              Find a patient by name or patient ID.
            </p>
          </div>

          <div style={styles.headerBadge}>
            <span style={styles.headerBadgeDot} />
            Patient Records
          </div>
        </div>

        {/* Search form */}
        <form onSubmit={onSearch} style={styles.formRow}>
          <div style={styles.inputWrapper}>
            <span style={styles.searchIcon}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
            </span>

            <input
              type="text"
              placeholder="Enter patient name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <button type="submit" style={styles.primaryButton}>
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
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
            Search
          </button>
        </form>

        {/* Results heading */}
        {searchResults.length > 0 && (
          <div style={styles.resultsHeader}>
            <div>
              <h3 style={styles.resultsTitle}>Search Results</h3>
              <p style={styles.resultsSubtitle}>
                Select a patient to continue.
              </p>
            </div>

            <span style={styles.resultsCount}>
              {searchResults.length}{" "}
              {searchResults.length === 1 ? "patient" : "patients"}
            </span>
          </div>
        )}

        {/* Results */}
        {searchResults.length > 0 ? (
          <div style={styles.resultsList}>
            {searchResults.map((patient) => {
              const approved = Number(patient.approved_sessions || 0);
              const utilized = Number(patient.sessions_taken || 0);
              const remaining = Math.max(approved - utilized, 0);

              const expired =
                patient.approval_expiry_date &&
                patient.approval_expiry_date < today;

              const status = expired
                ? "expired"
                : remaining <= 2 && approved > 0
                ? "low"
                : "ok";

              const statusStyle =
                status === "expired"
                  ? styles.badgeRed
                  : status === "low"
                  ? styles.badgeYellow
                  : styles.badgeGreen;

              const statusLabel =
                status === "expired"
                  ? "Expired"
                  : status === "low"
                  ? "Low Sessions"
                  : "Active";

              return (
                <div
                  key={patient.id}
                  style={{
                    ...styles.resultCard,
                    ...(expired ? styles.expiredCard : {}),
                  }}
                >
                  <div style={styles.patientAccent} />

                  <div style={styles.infoBlock}>
                    <div style={styles.resultTopRow}>
                      <div style={styles.patientAvatar}>
                        {String(patient.name || "P")
                          .trim()
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div style={styles.patientHeading}>
                        <div style={styles.resultName}>
                          {patient.name || "Unnamed Patient"}
                        </div>
                        <div style={styles.patientId}>
                          Patient ID: {patient.patient_id || "-"}
                        </div>
                      </div>

                      <span
                        style={{
                          ...styles.statusBadge,
                          ...statusStyle,
                        }}
                      >
                        <span
                          style={{
                            ...styles.statusDot,
                            ...(status === "expired"
                              ? styles.dotRed
                              : status === "low"
                              ? styles.dotYellow
                              : styles.dotGreen),
                          }}
                        />
                        {statusLabel}
                      </span>
                    </div>

                    <div style={styles.detailsGrid}>
                      {"current_approval_number" in patient && (
                        <Detail
                          label="Approval Number"
                          value={patient.current_approval_number || "-"}
                        />
                      )}

                      {"approved_sessions" in patient && (
                        <Detail
                          label="Approved Sessions"
                          value={approved}
                        />
                      )}

                      {"sessions_taken" in patient && (
                        <Detail
                          label="Utilized Sessions"
                          value={utilized}
                        />
                      )}

                      {"approved_sessions" in patient &&
                        "sessions_taken" in patient && (
                          <Detail
                            label="Remaining Sessions"
                            value={remaining}
                            highlight={remaining <= 2 && approved > 0}
                          />
                        )}

                      {"approval_start_date" in patient && (
                        <Detail
                          label="Start Date"
                          value={patient.approval_start_date || "-"}
                        />
                      )}

                      {"approval_expiry_date" in patient && (
                        <Detail
                          label="Expiry Date"
                          value={patient.approval_expiry_date || "-"}
                          highlight={Boolean(expired)}
                        />
                      )}

                      {"taken_with" in patient && (
                        <Detail
                          label="Therapist Names"
                          value={patient.taken_with || "-"}
                        />
                      )}

                      {"current_future_appointments" in patient && (
                        <Detail
                          label="Appointments"
                          value={
                            patient.current_future_appointments || "-"
                          }
                        />
                      )}
                    </div>
                  </div>

                  <div style={styles.actionButtons}>
                    <button
                      type="button"
                      style={styles.openButton}
                      onClick={() =>
                        navigate(`/patients/${patient.id}`)
                      }
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#e0f2fe";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#f0f9ff";
                      }}
                    >
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      Open File
                    </button>

                    <button
                      type="button"
                      style={styles.selectButton}
                      onClick={() => {
                        if (!onSelectPatient) {
                          console.error("onSelectPatient is missing");
                          return;
                        }

                        onSelectPatient(patient);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "linear-gradient(135deg, #15803d, #166534)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "linear-gradient(135deg, #22c55e, #16a34a)";
                      }}
                    >
                      {actionLabel}
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
            </div>

            <h3 style={styles.emptyTitle}>Find a Patient</h3>

            <p style={styles.helperText}>
              Enter a patient name or ID above to search the records.
              If the patient is not found, you can register a new patient.
            </p>
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.footerDot} />
          Patient information is displayed from available records.
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, highlight = false }) {
  return (
    <div style={styles.detailItem}>
      <div style={styles.detailLabel}>{label}</div>
      <div
        style={{
          ...styles.detailValue,
          ...(highlight ? styles.highlightValue : {}),
        }}
      >
        {value}
      </div>
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    boxSizing: "border-box",
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: "#0f172a",
  },

  card: {
    width: "100%",
    boxSizing: "border-box",
    background: "#ffffff",
    borderRadius: "22px",
    boxShadow: "0 12px 35px rgba(15, 23, 42, 0.07)",
    border: "1px solid #e2e8f0",
    padding: "26px",
    overflow: "hidden",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    flexWrap: "wrap",
    marginBottom: "25px",
  },

  headerIcon: {
    width: "54px",
    height: "54px",
    minWidth: "54px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
    boxShadow: "0 7px 15px rgba(59, 130, 246, 0.22)",
  },

  headerText: {
    flex: 1,
    minWidth: "180px",
  },

  cardTitle: {
    margin: "0 0 5px",
    fontSize: "26px",
    lineHeight: 1.25,
    fontWeight: "800",
    letterSpacing: "-0.7px",
    color: "#0f172a",
  },

  subtitle: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.5,
  },

  headerBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "9px 12px",
    background: "#eff6ff",
    border: "1px solid #dbeafe",
    color: "#1d4ed8",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
  },

  headerBadgeDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#3b82f6",
  },

  formRow: {
    display: "flex",
    gap: "12px",
    alignItems: "stretch",
    marginBottom: "25px",
    flexWrap: "wrap",
  },

  inputWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    flex: "1 1 250px",
    minWidth: 0,
    padding: "0 15px",
    border: "1px solid #cbd5e1",
    borderRadius: "13px",
    background: "#ffffff",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },

  searchIcon: {
    display: "flex",
    alignItems: "center",
    color: "#94a3b8",
    flexShrink: 0,
  },

  input: {
    flex: 1,
    width: "100%",
    minWidth: 0,
    padding: "15px 0",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#0f172a",
    fontSize: "15px",
    boxSizing: "border-box",
  },

  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    padding: "14px 23px",
    border: "none",
    borderRadius: "13px",
    background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "750",
    cursor: "pointer",
    boxShadow: "0 5px 12px rgba(37, 99, 235, 0.2)",
    transition: "transform 0.2s, box-shadow 0.2s",
    flexShrink: 0,
  },

  resultsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    paddingBottom: "15px",
    marginBottom: "14px",
    borderBottom: "1px solid #e2e8f0",
  },

  resultsTitle: {
    margin: "0 0 4px",
    fontSize: "18px",
    fontWeight: "800",
    color: "#0f172a",
  },

  resultsSubtitle: {
    margin: 0,
    fontSize: "13px",
    color: "#64748b",
  },

  resultsCount: {
    background: "#eef2ff",
    color: "#4338ca",
    border: "1px solid #e0e7ff",
    borderRadius: "999px",
    padding: "7px 12px",
    fontSize: "12px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },

  resultsList: {
    display: "grid",
    gap: "14px",
  },

  resultCard: {
    position: "relative",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "18px",
    flexWrap: "wrap",
    padding: "20px",
    border: "1px solid #e2e8f0",
    borderRadius: "17px",
    background: "linear-gradient(145deg, #ffffff 0%, #fbfdff 100%)",
    boxShadow: "0 3px 10px rgba(15, 23, 42, 0.025)",
    transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
    overflow: "hidden",
  },

  patientAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "4px",
    background: "linear-gradient(180deg, #3b82f6, #6366f1)",
  },

  expiredCard: {
    border: "1px solid #fecaca",
    background: "linear-gradient(145deg, #fffafa 0%, #fff5f5 100%)",
  },

  infoBlock: {
    flex: "1 1 360px",
    minWidth: 0,
  },

  resultTopRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "19px",
  },

  patientAvatar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "46px",
    height: "46px",
    minWidth: "46px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #dbeafe, #e0e7ff)",
    color: "#3730a3",
    fontSize: "19px",
    fontWeight: "800",
  },

  patientHeading: {
    flex: "1 1 150px",
    minWidth: 0,
  },

  resultName: {
    fontSize: "17px",
    lineHeight: 1.4,
    fontWeight: "800",
    color: "#0f172a",
    overflowWrap: "anywhere",
  },

  patientId: {
    marginTop: "3px",
    fontSize: "13px",
    color: "#64748b",
    overflowWrap: "anywhere",
  },

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },

  statusDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    display: "inline-block",
  },

  dotGreen: {
    background: "#16a34a",
  },

  dotYellow: {
    background: "#d97706",
  },

  dotRed: {
    background: "#dc2626",
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

  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))",
    gap: "12px",
  },

  detailItem: {
    minWidth: 0,
    padding: "11px 12px",
    borderRadius: "11px",
    border: "1px solid #edf2f7",
    background: "#f8fafc",
    boxSizing: "border-box",
  },

  detailLabel: {
    marginBottom: "5px",
    color: "#64748b",
    fontSize: "11px",
    lineHeight: 1.4,
    fontWeight: "650",
  },

  detailValue: {
    color: "#1e293b",
    fontSize: "13px",
    lineHeight: 1.45,
    fontWeight: "750",
    overflowWrap: "anywhere",
  },

  highlightValue: {
    color: "#b91c1c",
  },

  actionButtons: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: "9px",
    flexWrap: "wrap",
    flexShrink: 0,
  },

  openButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "11px 14px",
    border: "1px solid #bae6fd",
    borderRadius: "11px",
    background: "#f0f9ff",
    color: "#0369a1",
    fontSize: "13px",
    fontWeight: "750",
    cursor: "pointer",
    transition: "background 0.2s",
  },

  selectButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "11px 15px",
    border: "none",
    borderRadius: "11px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "750",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(22, 163, 74, 0.16)",
    transition: "background 0.2s",
  },

  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "34px 20px",
    background: "linear-gradient(180deg, #f8fafc, #ffffff)",
    border: "1px dashed #cbd5e1",
    borderRadius: "16px",
  },

  emptyIcon: {
    width: "60px",
    height: "60px",
    borderRadius: "18px",
    background: "#eff6ff",
    color: "#3b82f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "14px",
  },

  emptyTitle: {
    margin: "0 0 8px",
    color: "#1e293b",
    fontSize: "17px",
    fontWeight: "800",
  },

  helperText: {
    maxWidth: "420px",
    margin: 0,
    color: "#64748b",
    fontSize: "13px",
    lineHeight: 1.7,
  },

  footer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "22px",
    paddingTop: "15px",
    borderTop: "1px solid #f1f5f9",
    color: "#94a3b8",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  footerDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#94a3b8",
    flexShrink: 0,
  },
};

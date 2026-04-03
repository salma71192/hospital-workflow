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
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Search Patient</h2>

      <form onSubmit={onSearch} style={styles.formRow}>
        <input
          type="text"
          placeholder="Search by patient name or ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.input}
          required
        />
        <button type="submit" style={styles.primaryButton}>
          Search
        </button>
      </form>

      {searchResults.length ? (
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

            return (
              <div
                key={patient.id}
                style={{
                  ...styles.resultCard,
                  ...(expired ? styles.expiredCard : {}),
                }}
              >
                <div style={styles.infoBlock}>
                  <div style={styles.resultTopRow}>
                    <div style={styles.resultName}>{patient.name}</div>

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
                  </div>

                  <div style={styles.resultMeta}>ID: {patient.patient_id}</div>

                  {"current_approval_number" in patient && (
                    <div style={styles.resultMeta}>
                      Approval: {patient.current_approval_number || "-"}
                    </div>
                  )}

                  {"approved_sessions" in patient && (
                    <div style={styles.resultMeta}>
                      Approved Sessions: {approved}
                    </div>
                  )}

                  {"sessions_taken" in patient && (
                    <div style={styles.resultMeta}>
                      Utilized Sessions: {utilized}
                    </div>
                  )}

                  {"approved_sessions" in patient && "sessions_taken" in patient && (
                    <div style={styles.resultMeta}>
                      Remaining Sessions: {remaining}
                    </div>
                  )}

                  {"approval_start_date" in patient && (
                    <div style={styles.resultMeta}>
                      Start Date: {patient.approval_start_date || "-"}
                    </div>
                  )}

                  {"approval_expiry_date" in patient && (
                    <div style={styles.resultMeta}>
                      Expiry Date: {patient.approval_expiry_date || "-"}
                    </div>
                  )}

                  {"taken_with" in patient && (
                    <div style={styles.resultMeta}>
                      Therapist Names: {patient.taken_with || "-"}
                    </div>
                  )}

                  {"current_future_appointments" in patient && (
                    <div style={styles.resultMeta}>
                      Appointments: {patient.current_future_appointments || "-"}
                    </div>
                  )}
                </div>

                <div style={styles.actionButtons}>
                  <button
                    type="button"
                    style={styles.openButton}
                    onClick={() => navigate(`/patients/${patient.id}`)}
                  >
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
                  >
                    {actionLabel}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={styles.helperText}>
          Search first. If patient is not found, register a new patient.
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
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "12px",
    alignItems: "center",
    marginBottom: "18px",
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
  primaryButton: {
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "13px 18px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },
  resultsList: {
    display: "grid",
    gap: "12px",
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
  expiredCard: {
    border: "2px solid #fecaca",
    background: "#fef2f2",
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
  helperText: {
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: "12px",
    padding: "14px",
  },
};
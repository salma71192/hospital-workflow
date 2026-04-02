import React from "react";
import { useNavigate } from "react-router-dom";

export default function PatientTrackerTable({
  patients = [],
  title = "Patient Tracker",
  monthLabel = "",
}) {
  const navigate = useNavigate();

  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <h2 style={styles.cardTitle}>{title}</h2>
        {monthLabel ? <div style={styles.monthBadge}>{monthLabel}</div> : null}
      </div>

      {patients.length ? (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Patient ID</th>
                <th style={styles.th}>Patient Name</th>
                <th style={styles.th}>Therapist</th>
                <th style={styles.th}>Approved Sessions</th>
                <th style={styles.th}>Utilized This Month</th>
                <th style={styles.th}>Approval No.</th>
                <th style={styles.th}>Latest Seen</th>
                <th style={styles.th}>Appointments</th>
                <th style={styles.th}>File</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((row) => (
                <tr key={row.id}>
                  <td style={styles.td}>{row.patient_id}</td>
                  <td style={styles.tdBold}>{row.name}</td>
                  <td style={styles.td}>{row.therapist_name || "-"}</td>
                  <td style={styles.td}>{row.approved_sessions ?? 0}</td>
                  <td style={styles.td}>{row.sessions_taken ?? 0}</td>
                  <td style={styles.td}>{row.current_approval_number || "-"}</td>
                  <td style={styles.td}>{row.latest_seen_date || "-"}</td>
                  <td style={styles.td}>
                    {row.current_future_appointments || "-"}
                  </td>
                  <td style={styles.td}>
                    <button
                      type="button"
                      style={styles.openButton}
                      onClick={() => navigate(`/patients/${row.id}`)}
                    >
                      Open File
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={styles.emptyState}>No patients found for this month.</div>
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
    border: "1px solid #e8eef7",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  cardTitle: {
    margin: 0,
    fontSize: "22px",
    color: "#0f172a",
    fontWeight: "800",
  },
  monthBadge: {
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #86efac",
    borderRadius: "999px",
    padding: "8px 12px",
    fontWeight: "700",
    fontSize: "13px",
  },
  tableWrap: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1200px",
    background: "#fff",
  },
  th: {
    textAlign: "left",
    padding: "14px 16px",
    background: "#f8fafc",
    color: "#334155",
    fontSize: "14px",
    fontWeight: "800",
    borderBottom: "1px solid #e2e8f0",
  },
  td: {
    padding: "14px 16px",
    color: "#475569",
    fontSize: "14px",
    borderBottom: "1px solid #eef2f7",
    verticalAlign: "top",
  },
  tdBold: {
    padding: "14px 16px",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: "700",
    borderBottom: "1px solid #eef2f7",
    verticalAlign: "top",
  },
  openButton: {
    background: "#0ea5e9",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "8px 12px",
    fontWeight: "700",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  emptyState: {
    padding: "18px",
    borderRadius: "12px",
    background: "#f8fafc",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
  },
};
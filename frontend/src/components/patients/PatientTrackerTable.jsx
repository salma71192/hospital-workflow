import React from "react";

export default function PatientTrackerTable({
  patients = [],
  title = "Patient Tracker",
}) {
  const rows = patients.map((patient) => ({
    ...patient,
    approvedSessions: Number(patient.current_approval_number) || 0,
    utilizedSessions: Number(patient.sessions_taken) || 0,
  }));

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>{title}</h2>

      {rows.length ? (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Patient ID</th>
                <th style={styles.th}>Patient Name</th>
                <th style={styles.th}>Approved Sessions</th>
                <th style={styles.th}>Utilized Sessions</th>
                <th style={styles.th}>Appointments</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td style={styles.td}>{row.patient_id}</td>
                  <td style={styles.tdBold}>{row.name}</td>
                  <td style={styles.td}>{row.approvedSessions}</td>
                  <td style={styles.td}>{row.utilizedSessions}</td>
                  <td style={styles.td}>
                    {row.current_future_appointments || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={styles.emptyState}>No patients found.</div>
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
  cardTitle: {
    margin: "0 0 18px 0",
    fontSize: "22px",
    color: "#0f172a",
    fontWeight: "800",
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
    minWidth: "760px",
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
  emptyState: {
    padding: "18px",
    borderRadius: "12px",
    background: "#f8fafc",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
  },
};
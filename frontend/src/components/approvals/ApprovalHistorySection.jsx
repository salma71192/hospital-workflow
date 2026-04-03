import React, { useEffect, useState } from "react";
import api from "../../api/api";

export default function ApprovalHistorySection() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await api.get("approvals/history/");
      setRows(res.data.history || []);
    } catch {
      setRows([]);
    }
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Approval History</h2>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Patient Name</th>
              <th style={styles.th}>Patient ID</th>
              <th style={styles.th}>Approval Date</th>
              <th style={styles.th}>Expiry Date</th>
              <th style={styles.th}>Approved Qty</th>
              <th style={styles.th}>Booked</th>
              <th style={styles.th}>Used</th>
              <th style={styles.th}>Remaining</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.patient_id}-${index}`}>
                <td style={styles.td}>{row.patient_name}</td>
                <td style={styles.td}>{row.patient_id}</td>
                <td style={styles.td}>{row.approval_date || "-"}</td>
                <td style={styles.td}>{row.expiry_date || "-"}</td>
                <td style={styles.td}>{row.approved_quantity}</td>
                <td style={styles.td}>{row.booked}</td>
                <td style={styles.td}>{row.used_sessions}</td>
                <td style={styles.td}>{row.remaining_sessions}</td>
                <td style={styles.td}>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "22px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
  },
  title: {
    margin: "0 0 14px 0",
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f172a",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "900px",
  },
  th: {
    textAlign: "left",
    padding: "12px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "13px",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #eef2f7",
    fontSize: "14px",
  },
};
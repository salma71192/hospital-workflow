import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

export default function ApprovalHistorySection({ onEditApproval }) {
  const navigate = useNavigate();
  const defaultMonth = new Date().toISOString().slice(0, 7);

  const [rows, setRows] = useState([]);
  const [month, setMonth] = useState(defaultMonth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadHistory(defaultMonth);
  }, []);

  const loadHistory = async (monthValue = month) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (monthValue) {
        params.append("month", monthValue);
      }

      const res = await api.get(`approvals/history/?${params.toString()}`);
      setRows(res.data.history || []);
    } catch (err) {
      setRows([]);
      setError(err?.response?.data?.error || "Failed to load approval history");
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    if (status === "Expired") return { ...styles.statusBadge, ...styles.statusRed };
    if (status === "Renewal Needed" || status === "Low Sessions") {
      return { ...styles.statusBadge, ...styles.statusYellow };
    }
    return { ...styles.statusBadge, ...styles.statusGreen };
  };

  return (
    <div style={styles.card}>
      <div style={styles.topBar}>
        <div>
          <div style={styles.eyebrow}>Tracker</div>
          <h2 style={styles.title}>Approval Tracker</h2>
          <div style={styles.subtext}>
            Monthly approval tracking for all approval agents.
          </div>
        </div>

        <div style={styles.filterBox}>
          <label style={styles.label}>Month</label>
          <div style={styles.filterRow}>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={styles.input}
            />
            <button
              type="button"
              onClick={() => loadHistory(month)}
              style={styles.filterButton}
            >
              Filter
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={styles.emptyState}>Loading approval tracker...</div>
      ) : error ? (
        <div style={styles.errorState}>{error}</div>
      ) : rows.length === 0 ? (
        <div style={styles.emptyState}>No approval records found for this month.</div>
      ) : (
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
                <th style={styles.th}>Action</th>
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
                  <td style={styles.td}>
                    <span style={getStatusStyle(row.status)}>{row.status}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actionButtons}>
                      <button
                        type="button"
                        style={styles.openButton}
                        onClick={() => navigate(`/patients/${row.patient_id_db}`)}
                      >
                        Open File
                      </button>

                      <button
                        type="button"
                        style={styles.editButton}
                        onClick={() =>
                          onEditApproval &&
                          onEditApproval({
                            id: row.patient_id_db,
                            name: row.patient_name,
                            patient_id: row.patient_id,
                            current_approval_number: row.authorization_number || "",
                            approval_start_date: row.approval_date || "",
                            approval_expiry_date: row.expiry_date || "",
                            approved_sessions: row.approved_quantity || 0,
                          })
                        }
                      >
                        Edit Approval
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
    display: "grid",
    gap: "16px",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
    alignItems: "end",
  },
  eyebrow: {
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#2563eb",
    marginBottom: "8px",
  },
  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
  },
  subtext: {
    marginTop: "6px",
    fontSize: "14px",
    color: "#64748b",
  },
  filterBox: {
    display: "grid",
    gap: "8px",
    minWidth: "260px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#475569",
  },
  filterRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "10px",
    alignItems: "center",
  },
  input: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    background: "#fff",
  },
  filterButton: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 16px",
    fontWeight: "700",
    cursor: "pointer",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1180px",
  },
  th: {
    textAlign: "left",
    padding: "12px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "13px",
    color: "#334155",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #eef2f7",
    fontSize: "14px",
    color: "#0f172a",
    verticalAlign: "middle",
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  statusBadge: {
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    display: "inline-block",
  },
  statusGreen: {
    background: "#dcfce7",
    color: "#166534",
  },
  statusYellow: {
    background: "#fef3c7",
    color: "#92400e",
  },
  statusRed: {
    background: "#fee2e2",
    color: "#b91c1c",
  },
  openButton: {
    background: "#0ea5e9",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "8px 12px",
    fontWeight: "700",
    cursor: "pointer",
  },
  editButton: {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "8px 12px",
    fontWeight: "700",
    cursor: "pointer",
  },
  emptyState: {
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: "12px",
    padding: "14px",
  },
  errorState: {
    color: "#b91c1c",
    fontSize: "14px",
    fontWeight: "600",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    padding: "14px",
  },
};
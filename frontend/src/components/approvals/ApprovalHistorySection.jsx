import React, { useEffect, useState } from "react";
import api from "../../api/api";

export default function ApprovalHistorySection({ onEditApproval }) {
  const defaultMonth = new Date().toISOString().slice(0, 7);

  const [rows, setRows] = useState([]);
  const [month, setMonth] = useState(defaultMonth);
  const [search, setSearch] = useState("");
  const [approvalType, setApprovalType] = useState("");
  const [selectedRowKey, setSelectedRowKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadHistory(defaultMonth, "", "");
  }, []);

  const loadHistory = async (
    monthValue = month,
    searchValue = search,
    approvalTypeValue = approvalType
  ) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (monthValue) {
        params.append("month", monthValue);
      }
      if (searchValue?.trim()) {
        params.append("search", searchValue.trim());
      }
      if (approvalTypeValue?.trim()) {
        params.append("approval_type", approvalTypeValue.trim());
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
    if (status === "Expired" || status === "Deleted") {
      return { ...styles.statusBadge, ...styles.statusRed };
    }
    if (status === "Renewal Needed" || status === "Low Sessions") {
      return { ...styles.statusBadge, ...styles.statusYellow };
    }
    return { ...styles.statusBadge, ...styles.statusGreen };
  };

  const formatApprovalType = (value) => {
    if (!value) return "-";
    if (value === "thiqa") return "Thiqa";
    if (value === "daman") return "Daman";
    return value;
  };

  const handleRowClick = (row, index) => {
    const rowKey = `${row.patient_id}-${index}`;
    setSelectedRowKey(rowKey);

    if (onEditApproval) {
      onEditApproval({
        id: row.patient_id_db,
        name: row.patient_name,
        patient_id: row.patient_id,
        current_approval_number: row.authorization_number || "",
        approval_start_date: row.approval_date || "",
        approval_expiry_date: row.expiry_date || "",
        approved_sessions: row.approved_quantity || 0,
        insurance_provider: row.approval_type || "thiqa",
      });
    }
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

        <div style={styles.filtersWrap}>
          <div style={styles.filterBox}>
            <label style={styles.label}>Month</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.filterBoxWide}>
            <label style={styles.label}>Search Patient</label>
            <input
              type="text"
              placeholder="Search by name, patient ID, or approval number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.filterBox}>
            <label style={styles.label}>Approval Type</label>
            <select
              value={approvalType}
              onChange={(e) => setApprovalType(e.target.value)}
              style={styles.input}
            >
              <option value="">All</option>
              <option value="thiqa">Thiqa</option>
              <option value="daman">Daman</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => loadHistory(month, search, approvalType)}
            style={styles.filterButton}
          >
            Filter
          </button>
        </div>
      </div>

      {loading ? (
        <div style={styles.emptyState}>Loading approval tracker...</div>
      ) : error ? (
        <div style={styles.errorState}>{error}</div>
      ) : rows.length === 0 ? (
        <div style={styles.emptyState}>
          No approval records found for this filter.
        </div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Patient Name</th>
                <th style={styles.th}>Patient ID</th>
                <th style={styles.th}>Approval No.</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Approval Date</th>
                <th style={styles.th}>Expiry Date</th>
                <th style={styles.th}>Approved Qty</th>
                <th style={styles.th}>Booked</th>
                <th style={styles.th}>Used</th>
                <th style={styles.th}>Remaining</th>
                <th style={styles.th}>CPT Count</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => {
                const rowKey = `${row.patient_id}-${index}`;
                const isActive = selectedRowKey === rowKey;

                return (
                  <tr
                    key={rowKey}
                    onClick={() => handleRowClick(row, index)}
                    style={{
                      ...styles.clickableRow,
                      ...(isActive ? styles.activeRow : {}),
                    }}
                  >
                    <td style={styles.td}>{row.patient_name}</td>
                    <td style={styles.td}>{row.patient_id}</td>
                    <td style={styles.td}>{row.authorization_number || "-"}</td>
                    <td style={styles.td}>
                      {formatApprovalType(row.approval_type)}
                    </td>
                    <td style={styles.td}>{row.approval_date || "-"}</td>
                    <td style={styles.td}>{row.expiry_date || "-"}</td>
                    <td style={styles.td}>{row.approved_quantity}</td>
                    <td style={styles.td}>{row.booked}</td>
                    <td style={styles.td}>{row.used_sessions}</td>
                    <td style={styles.td}>{row.remaining_sessions}</td>
                    <td style={styles.td}>{row.cpt_count ?? 0}</td>
                    <td style={styles.td}>
                      <span style={getStatusStyle(row.status)}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={styles.helperNote}>
            Click any row to open that patient’s approval information and edit it if needed.
          </div>
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
  filtersWrap: {
    display: "grid",
    gridTemplateColumns: "180px 320px 180px auto",
    gap: "10px",
    alignItems: "end",
  },
  filterBox: {
    display: "grid",
    gap: "8px",
    minWidth: "180px",
  },
  filterBoxWide: {
    display: "grid",
    gap: "8px",
    minWidth: "320px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#475569",
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
    height: "46px",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1380px",
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
  clickableRow: {
    cursor: "pointer",
    transition: "background 0.18s ease",
  },
  activeRow: {
    background: "#eff6ff",
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
  helperNote: {
    marginTop: "12px",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "600",
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
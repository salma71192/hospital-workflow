import React, { useEffect, useState } from "react";
import api from "../../api/api";

export default function PatientApprovalTimeline({ patientId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!patientId) {
      setRows([]);
      return;
    }

    loadTimeline();
  }, [patientId]);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      const res = await api.get(`approvals/patient-approval-timeline/${patientId}/`);
      setRows(res.data.timeline || []);
    } catch (err) {
      console.error("Failed to load approval timeline", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>Patient Timeline</div>
          <h3 style={styles.title}>Approval Timeline</h3>
        </div>
      </div>

      {loading ? (
        <div style={styles.emptyState}>Loading timeline...</div>
      ) : rows.length === 0 ? (
        <div style={styles.emptyState}>No approval history found for this patient.</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Approval No.</th>
                <th style={styles.th}>Approval Date</th>
                <th style={styles.th}>Expiry Date</th>
                <th style={styles.th}>Approved</th>
                <th style={styles.th}>Used</th>
                <th style={styles.th}>Remaining</th>
                <th style={styles.th}>CPT Codes</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td style={styles.td}>{row.authorization_number || "-"}</td>
                  <td style={styles.td}>{row.approval_date || "-"}</td>
                  <td style={styles.td}>{row.expiry_date || "-"}</td>
                  <td style={styles.td}>{row.approved_sessions ?? 0}</td>
                  <td style={styles.td}>{row.used_sessions ?? 0}</td>
                  <td style={styles.td}>{row.remaining_sessions ?? 0}</td>
                  <td style={styles.td}>
                    <div style={styles.codeWrap}>
                      {(row.approved_cpt_codes || []).length > 0
                        ? row.approved_cpt_codes.map((code) => (
                            <span key={code} style={styles.codeChip}>
                              {code}
                            </span>
                          ))
                        : "-"}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        ...(row.status === "Expired"
                          ? styles.badgeRed
                          : row.status === "Renewal Needed" || row.status === "Low Sessions"
                          ? styles.badgeYellow
                          : styles.badgeGreen),
                      }}
                    >
                      {row.status}
                    </span>
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
  },
  header: {
    marginBottom: "14px",
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
    fontSize: "20px",
    fontWeight: "800",
    color: "#0f172a",
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
    color: "#334155",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #eef2f7",
    fontSize: "14px",
    color: "#0f172a",
    verticalAlign: "top",
  },
  codeWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  codeChip: {
    padding: "4px 8px",
    borderRadius: "999px",
    background: "#e2e8f0",
    fontSize: "12px",
    fontWeight: "700",
  },
  badge: {
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
};
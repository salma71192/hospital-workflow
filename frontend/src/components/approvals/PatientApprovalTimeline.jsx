import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api";

export default function PatientApprovalTimeline({
  patientId,
  onSelectTimelineItem,
  refreshKey = 0,
}) {
  const [rows, setRows] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showChanges, setShowChanges] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadTimeline = async () => {
    if (!patientId) return;

    try {
      setLoading(true);
      setError("");

      const res = await api.get(
        `approvals/patient-approval-timeline/${patientId}/`
      );

      const timeline = res.data.timeline || [];
      setRows(timeline);

      if (timeline.length > 0) {
        const firstRow = timeline[0];
        setSelectedId(firstRow.id);
      } else {
        setSelectedId(null);
      }
    } catch (err) {
      setRows([]);
      setSelectedId(null);
      setError(err?.response?.data?.error || "Failed to load timeline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, [patientId, refreshKey]);

  const selectedIndex = useMemo(
    () => rows.findIndex((item) => String(item.id) === String(selectedId)),
    [rows, selectedId]
  );

  const selectedRow = useMemo(() => {
    if (selectedIndex < 0) return null;
    return rows[selectedIndex];
  }, [rows, selectedIndex]);

  const previousRow = useMemo(() => {
    if (selectedIndex < 0 || selectedIndex === rows.length - 1) return null;
    return rows[selectedIndex + 1];
  }, [rows, selectedIndex]);

  useEffect(() => {
    setShowChanges(false);
  }, [selectedId]);

  useEffect(() => {
    if (selectedRow && onSelectTimelineItem) {
      onSelectTimelineItem(selectedRow, previousRow);
    }
  }, [selectedRow, previousRow, onSelectTimelineItem]);

  const getChanges = (current, previous) => {
    if (!current) return [];

    const changes = [];
    const fields = [
      ["authorization_number", "Authorization Number"],
      ["start_date", "Start Date"],
      ["expiry_date", "Expiry Date"],
      ["approved_sessions", "Approved Sessions"],
      ["insurance_provider", "Approval Type"],
      ["approved_cpt_codes", "CPT Codes"],
      ["status", "Status"],
    ];

    fields.forEach(([key, label]) => {
      const currentValue = Array.isArray(current[key])
        ? current[key].join(", ")
        : current[key] ?? "";

      const previousValue = previous
        ? Array.isArray(previous[key])
          ? previous[key].join(", ")
          : previous[key] ?? ""
        : "";

      if (String(currentValue) !== String(previousValue)) {
        changes.push({
          label,
          from: previous ? previousValue || "-" : "-",
          to: currentValue || "-",
        });
      }
    });

    return changes;
  };

  const changes = getChanges(selectedRow, previousRow);

  const getStatusStyle = (status) => {
    if (status === "Deleted" || status === "Expired") {
      return { ...styles.badge, ...styles.badgeRed };
    }
    if (status === "Renewal Needed" || status === "Low Sessions") {
      return { ...styles.badge, ...styles.badgeYellow };
    }
    return { ...styles.badge, ...styles.badgeGreen };
  };

  const formatInsurance = (value) => {
    if (!value) return "-";
    if (String(value).toLowerCase() === "thiqa") return "Thiqa";
    if (String(value).toLowerCase() === "daman") return "Daman";
    return value;
  };

  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <div>
          <div style={styles.eyebrow}>Patient Timeline</div>
          <h2 style={styles.title}>Approval Timeline</h2>
        </div>

        <button type="button" style={styles.refreshButton} onClick={loadTimeline}>
          Refresh
        </button>
      </div>

      {loading ? (
        <div style={styles.emptyState}>Loading timeline...</div>
      ) : error ? (
        <div style={styles.errorState}>{error}</div>
      ) : rows.length === 0 ? (
        <div style={styles.emptyState}>No approval timeline found.</div>
      ) : (
        <>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Approval No.</th>
                  <th style={styles.th}>Approval Date</th>
                  <th style={styles.th}>Start Date</th>
                  <th style={styles.th}>Expiry Date</th>
                  <th style={styles.th}>Approved</th>
                  <th style={styles.th}>Used</th>
                  <th style={styles.th}>Remaining</th>
                  <th style={styles.th}>CPT Codes</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => {
                  const isSelected = String(selectedId) === String(row.id);

                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedId(row.id)}
                      style={{
                        ...styles.row,
                        ...(isSelected ? styles.rowActive : {}),
                      }}
                    >
                      <td style={styles.td}>{row.authorization_number || "-"}</td>
                      <td style={styles.td}>{row.approval_date || "-"}</td>
                      <td style={styles.td}>{row.start_date || "-"}</td>
                      <td style={styles.td}>{row.expiry_date || "-"}</td>
                      <td style={styles.td}>{row.approved_sessions}</td>
                      <td style={styles.td}>{row.used_sessions}</td>
                      <td style={styles.td}>{row.remaining_sessions}</td>
                      <td style={styles.td}>
                        <div style={styles.codeWrap}>
                          {(row.approved_cpt_codes || []).length > 0 ? (
                            row.approved_cpt_codes.map((code) => (
                              <span key={code} style={styles.codeChip}>
                                {code}
                              </span>
                            ))
                          ) : (
                            "-"
                          )}
                        </div>
                      </td>
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
          </div>

          {selectedRow && (
            <div style={styles.detailsCard}>
              <div style={styles.detailsHeader}>
                <h3 style={styles.detailsTitle}>Selected Approval Details</h3>
                <span style={getStatusStyle(selectedRow.status)}>
                  {selectedRow.status}
                </span>
              </div>

              <div style={styles.detailGrid}>
                <div>
                  <strong>Authorization:</strong>{" "}
                  {selectedRow.authorization_number || "-"}
                </div>
                <div>
                  <strong>Type:</strong>{" "}
                  {formatInsurance(selectedRow.insurance_provider)}
                </div>
                <div>
                  <strong>Approval Date:</strong>{" "}
                  {selectedRow.approval_date || "-"}
                </div>
                <div>
                  <strong>Start Date:</strong>{" "}
                  {selectedRow.start_date || "-"}
                </div>
                <div>
                  <strong>Expiry Date:</strong>{" "}
                  {selectedRow.expiry_date || "-"}
                </div>
                <div>
                  <strong>Approved Sessions:</strong>{" "}
                  {selectedRow.approved_sessions}
                </div>
                <div>
                  <strong>Used Sessions:</strong>{" "}
                  {selectedRow.used_sessions}
                </div>
                <div>
                  <strong>Remaining:</strong>{" "}
                  {selectedRow.remaining_sessions}
                </div>
                <div style={styles.fullWidth}>
                  <strong>CPT Codes:</strong>{" "}
                  {(selectedRow.approved_cpt_codes || []).join(", ") || "-"}
                </div>
              </div>

              <div style={styles.changesBlock}>
                <button
                  type="button"
                  style={styles.collapseButton}
                  onClick={() => setShowChanges((prev) => !prev)}
                >
                  <span style={styles.changesTitle}>Edit History</span>
                  <span style={styles.collapseIcon}>
                    {showChanges ? "−" : "+"}
                  </span>
                </button>

                {showChanges ? (
                  changes.length === 0 ? (
                    <div style={styles.helperText}>No recorded changes.</div>
                  ) : (
                    <div style={styles.changesList}>
                      {changes.map((change) => (
                        <div key={change.label} style={styles.changeItem}>
                          <div style={styles.changeLabel}>{change.label}</div>
                          <div style={styles.changeValues}>
                            <span style={styles.changeFrom}>{change.from}</span>
                            <span style={styles.arrow}>→</span>
                            <span style={styles.changeTo}>{change.to}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div style={styles.helperText}>
                    Click to view what was updated in this approval record.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
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
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  refreshButton: {
    background: "#e2e8f0",
    color: "#0f172a",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: "700",
    cursor: "pointer",
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
    minWidth: "980px",
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
    verticalAlign: "top",
    fontSize: "14px",
    color: "#0f172a",
  },
  row: {
    cursor: "pointer",
    transition: "background 0.18s ease",
  },
  rowActive: {
    background: "#eff6ff",
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
  detailsCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "16px",
    background: "#f8fafc",
    display: "grid",
    gap: "14px",
  },
  detailsHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  detailsTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "800",
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "10px",
    fontSize: "14px",
    color: "#0f172a",
  },
  fullWidth: {
    gridColumn: "1 / -1",
  },
  changesBlock: {
    display: "grid",
    gap: "10px",
  },
  collapseButton: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "12px 14px",
    cursor: "pointer",
    textAlign: "left",
  },
  changesTitle: {
    fontWeight: "800",
    fontSize: "15px",
    color: "#0f172a",
  },
  collapseIcon: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#334155",
    lineHeight: 1,
  },
  helperText: {
    color: "#64748b",
    fontSize: "14px",
  },
  changesList: {
    display: "grid",
    gap: "8px",
  },
  changeItem: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "10px 12px",
  },
  changeLabel: {
    fontWeight: "700",
    marginBottom: "4px",
  },
  changeValues: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  changeFrom: {
    color: "#b91c1c",
  },
  changeTo: {
    color: "#166534",
  },
  arrow: {
    color: "#64748b",
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
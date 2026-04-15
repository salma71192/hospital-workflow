import React from "react";

export default function RegistrationListSection({
  assignments = [],
  onEditAssignment,
  onCancelAssignment,
}) {
  return (
    <div style={styles.card}>
      <div style={styles.sectionHeader}>
        <div>
          <div style={styles.sectionTitle}>Registration List</div>
          <div style={styles.sectionSubtext}>
            Detailed filtered registrations
          </div>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div style={styles.emptyState}>No registrations found.</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Patient</th>
                <th style={styles.th}>File Number</th>
                <th style={styles.th}>Physio</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Created By</th>
                <th style={styles.th}>Notes</th>
                {(onEditAssignment || onCancelAssignment) && (
                  <th style={styles.th}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {assignments.map((item) => (
                <tr key={item.id}>
                  <td style={styles.tdBold}>{item.patient_name}</td>
                  <td style={styles.td}>{item.patient_file_id}</td>
                  <td style={styles.td}>{item.therapist_name}</td>
                  <td style={styles.td}>{item.assignment_date}</td>
                  <td style={styles.td}>
                    <span style={styles.categoryChip}>
                      {item.category_label || item.category || "-"}
                    </span>
                  </td>
                  <td style={styles.td}>{item.created_by_name || "-"}</td>
                  <td style={styles.td}>{item.notes || "-"}</td>

                  {(onEditAssignment || onCancelAssignment) && (
                    <td style={styles.td}>
                      <div style={styles.actions}>
                        {onEditAssignment ? (
                          <button
                            type="button"
                            style={styles.editBtn}
                            onClick={() => onEditAssignment(item)}
                          >
                            Edit
                          </button>
                        ) : null}

                        {onCancelAssignment ? (
                          <button
                            type="button"
                            style={styles.deleteBtn}
                            onClick={() => onCancelAssignment(item)}
                          >
                            Cancel
                          </button>
                        ) : null}
                      </div>
                    </td>
                  )}
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
    padding: "16px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.04)",
    display: "grid",
    gap: "14px",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    flexWrap: "wrap",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a",
  },
  sectionSubtext: {
    marginTop: "2px",
    fontSize: "13px",
    color: "#64748b",
  },
  tableWrap: {
    overflowX: "auto",
    border: "1px solid #eef2f7",
    borderRadius: "14px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1100px",
    background: "#fff",
  },
  th: {
    textAlign: "left",
    padding: "12px",
    background: "#fafafa",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "13px",
    color: "#475569",
    fontWeight: "800",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "14px",
    color: "#334155",
    verticalAlign: "top",
  },
  tdBold: {
    padding: "12px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "14px",
    color: "#0f172a",
    fontWeight: "700",
    verticalAlign: "top",
  },
  categoryChip: {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: "999px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    color: "#475569",
    fontSize: "12px",
    fontWeight: "700",
  },
  actions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  editBtn: {
    background: "#f8fafc",
    color: "#0369a1",
    border: "1px solid #dbeafe",
    borderRadius: "8px",
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "700",
  },
  deleteBtn: {
    background: "#fff7f7",
    color: "#b91c1c",
    border: "1px solid #fee2e2",
    borderRadius: "8px",
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "700",
  },
  emptyState: {
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
    background: "#fafafa",
    border: "1px dashed #d1d5db",
    borderRadius: "12px",
    padding: "14px",
  },
};
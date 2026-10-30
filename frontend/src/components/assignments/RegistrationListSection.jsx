
import React, { useState } from "react";

const normalizeRole = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const categoryColors = (value) => {
  const category = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (category.includes("walk_in")) {
    return {
      background: "#ecfdf5",
      color: "#047857",
      border: "#a7f3d0",
    };
  }

  if (category.includes("appointment")) {
    return {
      background: "#eff6ff",
      color: "#1d4ed8",
      border: "#bfdbfe",
    };
  }

  if (
    category.includes("initial_eval") ||
    category.includes("initial_evaluation")
  ) {
    return {
      background: "#f5f3ff",
      color: "#6d28d9",
      border: "#ddd6fe",
    };
  }

  if (
    category.includes("eligibility") ||
    category.includes("without")
  ) {
    return {
      background: "#fffbeb",
      color: "#b45309",
      border: "#fde68a",
    };
  }

  return {
    background: "#f1f5f9",
    color: "#475569",
    border: "#e2e8f0",
  };
};

export default function RegistrationListSection({
  assignments = [],
  onEditAssignment,
  onCancelAssignment,
  userRole = "",
  isAdmin: adminProp = false,
  isReception: receptionProp = false,
  user = null,
  currentUser = null,
  currentUserId,
}) {
  const [processingId, setProcessingId] = useState(null);

  const role = normalizeRole(
    userRole || user?.role || currentUser?.role || ""
  );

  const isAdmin =
    Boolean(adminProp) ||
    role === "admin" ||
    Boolean(user?.is_superuser) ||
    Boolean(currentUser?.is_superuser);

  const isReception =
    Boolean(receptionProp) ||
    [
      "reception",
      "receptionist",
      "reception_supervisor",
    ].includes(role);

  const safeAssignments = Array.isArray(assignments)
    ? assignments
    : [];

  const backendAllows = (value) => value === true;

  const handleEdit = async (item) => {
    if (!onEditAssignment || processingId !== null) {
      return;
    }

    try {
      setProcessingId(item.id);
      await onEditAssignment(item);
    } catch (error) {
      console.error(
        "Failed to open registration editor:",
        error
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (item) => {
    if (!onCancelAssignment || processingId !== null) {
      return;
    }

    const patientName = item.patient_name || "this patient";

    const confirmed = window.confirm(
      `Are you sure you want to cancel/delete the registration for ${patientName} on ${item.assignment_date || "the selected date"}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(item.id);
      await onCancelAssignment(item);
    } catch (error) {
      console.error(
        "Failed to cancel registration:",
        error
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        .registration-list-table {
          width: 100%;
          min-width: 1080px;
          border-collapse: separate;
          border-spacing: 0;
          background: #ffffff;
        }

        .registration-list-table thead th {
          position: sticky;
          top: 0;
          z-index: 2;
          background: #f8fafc;
        }

        .registration-list-table tbody tr {
          transition: background 140ms ease;
        }

        .registration-list-table tbody tr:hover {
          background: #f8fbff;
        }

        .registration-list-table tbody tr:last-child td {
          border-bottom: none;
        }

        .registration-list-scroll {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          overscroll-behavior-x: contain;
          border: 1px solid #e7ebf2;
          border-radius: 13px;
          -webkit-overflow-scrolling: touch;
        }

        .registration-list-scroll::-webkit-scrollbar {
          height: 8px;
        }

        .registration-list-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }

        .registration-list-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }

        .registration-list-action {
          transition:
            background 140ms ease,
            border-color 140ms ease,
            transform 140ms ease;
        }

        .registration-list-action:not(:disabled):hover {
          transform: translateY(-1px);
        }

        .registration-list-action:focus-visible {
          outline: 3px solid #93c5fd;
          outline-offset: 2px;
        }
      `}</style>

      {/* Section header */}
      <div style={styles.header}>
        <div style={styles.headingGroup}>
          <div style={styles.headingIcon}>▤</div>

          <div style={styles.headingText}>
            <h3 style={styles.title}>
              Registration List
            </h3>

            <p style={styles.subtitle}>
              Detailed registration records for the selected period.
            </p>
          </div>
        </div>

        <div style={styles.countBadge}>
          <span style={styles.countDot} />
          {safeAssignments.length}{" "}
          {safeAssignments.length === 1
            ? "registration"
            : "registrations"}
        </div>
      </div>

      {/* Empty state */}
      {safeAssignments.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>▤</div>

          <div style={styles.emptyTitle}>
            No registrations found
          </div>

          <p style={styles.emptyText}>
            Try changing your date range or filters to find
            registration records.
          </p>
        </div>
      ) : (
        <>
          <div style={styles.tableInfo}>
            <span>
              Showing{" "}
              <strong>{safeAssignments.length}</strong>{" "}
              registration records
            </span>

            <span style={styles.scrollHint}>
              Scroll horizontally to view all columns →
            </span>
          </div>

          <div className="registration-list-scroll">
            <table className="registration-list-table">
              <thead>
                <tr>
                  <th style={styles.th}>Patient</th>
                  <th style={styles.th}>File Number</th>
                  <th style={styles.th}>Physiotherapist</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Specialty</th>
                  <th style={styles.th}>Created By</th>
                  <th style={styles.thActions}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {safeAssignments.map((item) => {
                  const canEdit =
                    isAdmin ||
                    (isReception &&
                      (backendAllows(item.can_edit) ||
                        backendAllows(item.can_edit_today)));

                  const canDelete =
                    isAdmin ||
                    (isReception &&
                      (backendAllows(item.can_delete) ||
                        backendAllows(item.can_cancel_today)));

                  const showEdit =
                    Boolean(onEditAssignment) && canEdit;

                  const showDelete =
                    Boolean(onCancelAssignment) && canDelete;

                  const isProcessing =
                    processingId === item.id;

                  const category =
                    item.category_label ||
                    item.category ||
                    "-";

                  const categoryStyle =
                    categoryColors(category);

                  return (
                    <tr key={item.id}>
                      <td style={styles.patientCell}>
                        <div style={styles.patientName}>
                          {item.patient_name || "-"}
                        </div>

                        <div style={styles.patientMeta}>
                          Patient registration
                        </div>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.fileNumber}>
                          {item.patient_file_id || "-"}
                        </span>
                      </td>

                      <td style={styles.td}>
                        {item.therapist_name || "-"}
                      </td>

                      <td style={styles.td}>
                        <span style={styles.dateText}>
                          {item.assignment_date || "-"}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.categoryBadge,
                            background: categoryStyle.background,
                            color: categoryStyle.color,
                            borderColor: categoryStyle.border,
                          }}
                        >
                          <span
                            style={{
                              ...styles.categoryDot,
                              background: categoryStyle.color,
                            }}
                          />
                          {category}
                        </span>
                      </td>

                      <td style={styles.td}>
                        {item.speciality ||
                          item.specialty ||
                          "-"}
                      </td>

                      <td style={styles.td}>
                        {item.created_by_name || "-"}
                      </td>

                      <td style={styles.actionCell}>
                        <div style={styles.actions}>
                          {showEdit && (
                            <button
                              type="button"
                              className="registration-list-action"
                              style={{
                                ...styles.actionButton,
                                ...styles.editButton,
                              }}
                              disabled={isProcessing}
                              onClick={() => handleEdit(item)}
                              aria-label={`Edit registration ${item.id}`}
                              title="Edit registration"
                            >
                              <span style={styles.buttonIcon}>
                                ✎
                              </span>
                              Edit
                            </button>
                          )}

                          {showDelete && (
                            <button
                              type="button"
                              className="registration-list-action"
                              style={{
                                ...styles.actionButton,
                                ...styles.cancelButton,
                              }}
                              disabled={isProcessing}
                              onClick={() => handleCancel(item)}
                              aria-label={`Cancel registration ${item.id}`}
                              title="Cancel registration"
                            >
                              <span style={styles.buttonIcon}>
                                {isProcessing ? "…" : "×"}
                              </span>
                              {isProcessing
                                ? "Processing"
                                : "Cancel"}
                            </button>
                          )}

                          {!showEdit && !showDelete && (
                            <span style={styles.noActions}>
                              View only
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div style={styles.footer}>
        <span style={styles.footerDot} />
        Registration actions are controlled by your assigned
        permissions.
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "grid",
    gap: "16px",
    width: "100%",
    minWidth: 0,
    padding: 0,
    background: "#ffffff",
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: "#334155",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "14px",
  },

  headingGroup: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: 0,
  },

  headingIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    background: "#eff6ff",
    border: "1px solid #dbeafe",
    color: "#2563eb",
    fontSize: "23px",
    flexShrink: 0,
  },

  headingText: {
    minWidth: 0,
  },

  title: {
    margin: 0,
    color: "#172033",
    fontSize: "16px",
    fontWeight: 800,
    lineHeight: 1.45,
  },

  subtitle: {
    margin: "4px 0 0",
    color: "#7b8798",
    fontSize: "12px",
    lineHeight: 1.6,
  },

  countBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "9px 12px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    color: "#475569",
    fontSize: "11px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  countDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#0d9488",
    flexShrink: 0,
  },

  tableInfo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "8px",
    color: "#64748b",
    fontSize: "11px",
    lineHeight: 1.6,
  },

  scrollHint: {
    color: "#94a3b8",
    fontSize: "10px",
  },

  th: {
    textAlign: "left",
    padding: "14px 15px",
    borderBottom: "1px solid #e7ebf2",
    color: "#64748b",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.35px",
    whiteSpace: "nowrap",
  },

  thActions: {
    textAlign: "left",
    padding: "14px 15px",
    borderBottom: "1px solid #e7ebf2",
    color: "#64748b",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.35px",
    whiteSpace: "nowrap",
    minWidth: "160px",
  },

  td: {
    padding: "15px",
    borderBottom: "1px solid #f0f3f8",
    color: "#475569",
    fontSize: "12px",
    lineHeight: 1.7,
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  },

  patientCell: {
    padding: "15px",
    borderBottom: "1px solid #f0f3f8",
    verticalAlign: "middle",
    minWidth: "170px",
  },

  patientName: {
    color: "#172033",
    fontSize: "12px",
    lineHeight: 1.6,
    fontWeight: 800,
    overflowWrap: "anywhere",
  },

  patientMeta: {
    marginTop: "3px",
    color: "#94a3b8",
    fontSize: "10px",
    fontWeight: 500,
  },

  fileNumber: {
    display: "inline-block",
    padding: "4px 7px",
    borderRadius: "6px",
    background: "#f8fafc",
    border: "1px solid #e8edf3",
    color: "#475569",
    fontSize: "11px",
    fontWeight: 700,
  },

  dateText: {
    color: "#334155",
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
  },

  categoryBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    maxWidth: "220px",
    padding: "6px 9px",
    border: "1px solid",
    borderRadius: "8px",
    fontSize: "10px",
    lineHeight: 1.5,
    fontWeight: 800,
    whiteSpace: "normal",
  },

  categoryDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    flexShrink: 0,
  },

  actionCell: {
    padding: "12px 15px",
    borderBottom: "1px solid #f0f3f8",
    verticalAlign: "middle",
  },

  actions: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "nowrap",
  },

  actionButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    borderRadius: "8px",
    padding: "7px 9px",
    fontSize: "11px",
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace: "nowrap",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },

  editButton: {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
  },

  cancelButton: {
    background: "#fff1f2",
    color: "#be123c",
    border: "1px solid #fecdd3",
  },

  buttonIcon: {
    fontSize: "14px",
    lineHeight: 1,
    fontWeight: 800,
  },

  noActions: {
    display: "inline-block",
    padding: "6px 8px",
    borderRadius: "7px",
    background: "#f8fafc",
    color: "#94a3b8",
    fontSize: "10px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "42px 20px",
    textAlign: "center",
    border: "1px dashed #d7e0eb",
    borderRadius: "14px",
    background: "#fafcff",
  },

  emptyIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "52px",
    height: "52px",
    borderRadius: "15px",
    background: "#eff6ff",
    color: "#64748b",
    fontSize: "26px",
    marginBottom: "13px",
  },

  emptyTitle: {
    color: "#334155",
    fontSize: "14px",
    fontWeight: 800,
  },

  emptyText: {
    maxWidth: "320px",
    margin: "7px 0 0",
    color: "#94a3b8",
    fontSize: "12px",
    lineHeight: 1.8,
  },

  footer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    paddingTop: "13px",
    borderTop: "1px solid #edf1f6",
    color: "#94a3b8",
    fontSize: "10px",
    lineHeight: 1.7,
  },

  footerDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#94a3b8",
    flexShrink: 0,
  },
};

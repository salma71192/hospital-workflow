
import React, { useMemo, useState } from "react";

const APPROVAL_STATUSES = [
  "Approved",
  "Pending",
  "Rejected",
  "On Hold",
];

const STATUS_COLORS = {
  Approved: {
    background: "#dcfce7",
    color: "#166534",
    border: "#86efac",
  },
  Pending: {
    background: "#fef3c7",
    color: "#92400e",
    border: "#fcd34d",
  },
  Rejected: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "#fca5a5",
  },
  "On Hold": {
    background: "#e2e8f0",
    color: "#334155",
    border: "#cbd5e1",
  },
};

function normalizeStatus(value) {
  const normalized = String(value || "Pending")
    .trim()
    .toLowerCase();

  return (
    APPROVAL_STATUSES.find(
      (status) => status.toLowerCase() === normalized
    ) || "Pending"
  );
}

function StatusBadge({ status }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.Pending;

  return (
    <span
      style={{
        ...styles.badge,
        background: colors.background,
        color: colors.color,
        borderColor: colors.border,
      }}
    >
      {status}
    </span>
  );
}

export default function PatientApprovalTracker({
  patients = [],
  loading = false,
  canEdit = true,
  onStatusChange,
}) {
  const [approvalOverrides, setApprovalOverrides] = useState({});

  const patientRows = useMemo(() => {
    return patients.map((patient, index) => {
      const id =
        patient.id ??
        patient.patient_id ??
        patient.patientId ??
        patient.mrn ??
        `patient-${index}`;

      const originalApproval =
        patient.approval_status ??
        patient.approvalStatus ??
        patient.callcenter_approval_status ??
        patient.approval?.status ??
        "Pending";

      return {
        id: String(id),
        name:
          patient.patient_name ??
          patient.full_name ??
          patient.name ??
          patient.patient?.name ??
          "Unnamed patient",
        mrn:
          patient.mrn ??
          patient.medical_record_number ??
          patient.patient_number ??
          "",
        approvalStatus: normalizeStatus(
          Object.prototype.hasOwnProperty.call(
            approvalOverrides,
            String(id)
          )
            ? approvalOverrides[String(id)]
            : originalApproval
        ),
      };
    });
  }, [patients, approvalOverrides]);

  const counts = useMemo(() => {
    const result = Object.fromEntries(
      APPROVAL_STATUSES.map((status) => [status, 0])
    );

    patientRows.forEach((patient) => {
      result[patient.approvalStatus] += 1;
    });

    return result;
  }, [patientRows]);

  const handleStatusChange = (patient, nextStatus) => {
    setApprovalOverrides((previous) => ({
      ...previous,
      [patient.id]: nextStatus,
    }));

    if (typeof onStatusChange === "function") {
      onStatusChange({
        patientId: patient.id,
        status: nextStatus,
      });
    }
  };

  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Call Center Approvals</h2>
          <p style={styles.subtitle}>
            Review and update patient approval status.
          </p>
        </div>

        <div style={styles.totalBox}>
          <span style={styles.totalNumber}>
            {patientRows.length.toLocaleString()}
          </span>
          <span style={styles.totalLabel}>Patients</span>
        </div>
      </div>

      <div style={styles.summaryGrid}>
        {APPROVAL_STATUSES.map((status) => (
          <div key={status} style={styles.summaryItem}>
            <StatusBadge status={status} />
            <strong style={styles.summaryCount}>
              {counts[status]}
            </strong>
            <span style={styles.summaryLabel}>
              {status}
            </span>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={styles.message}>Loading patients...</div>
      ) : patientRows.length === 0 ? (
        <div style={styles.message}>
          No patient records available.
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Patient</th>
                <th style={styles.th}>MRN</th>
                <th style={styles.th}>Approval Status</th>
                <th style={styles.th}>Update Status</th>
              </tr>
            </thead>

            <tbody>
              {patientRows.map((patient) => (
                <tr key={patient.id}>
                  <td style={styles.td}>
                    <strong style={styles.patientName}>
                      {patient.name}
                    </strong>
                  </td>

                  <td style={styles.td}>
                    {patient.mrn || "—"}
                  </td>

                  <td style={styles.td}>
                    <StatusBadge status={patient.approvalStatus} />
                  </td>

                  <td style={styles.td}>
                    <select
                      value={patient.approvalStatus}
                      disabled={!canEdit}
                      onChange={(event) =>
                        handleStatusChange(
                          patient,
                          event.target.value
                        )
                      }
                      aria-label={`Approval status for ${patient.name}`}
                      style={{
                        ...styles.select,
                        ...(canEdit ? {} : styles.disabledSelect),
                      }}
                    >
                      {APPROVAL_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={styles.footerNote}>
        Frontend preview: status changes are temporary and are not
        saved to the server yet.
      </p>
    </section>
  );
}

const styles = {
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 22,
    boxShadow: "0 8px 26px rgba(15, 23, 42, 0.05)",
    minWidth: 0,
    fontFamily: "Inter, Arial, sans-serif",
    color: "#334155",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    color: "#16334f",
    fontSize: 20,
    fontWeight: 800,
  },

  subtitle: {
    margin: "7px 0 0",
    color: "#64748b",
    fontSize: 13,
    lineHeight: 1.5,
  },

  totalBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },

  totalNumber: {
    color: "#16334f",
    fontSize: 27,
    fontWeight: 800,
    lineHeight: 1.2,
  },

  totalLabel: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 3,
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(125px, 1fr))",
    gap: 12,
    margin: "24px 0",
  },

  summaryItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 14,
    minWidth: 0,
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid",
    borderRadius: 999,
    padding: "5px 10px",
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  summaryCount: {
    color: "#16334f",
    fontSize: 23,
    lineHeight: 1.2,
  },

  summaryLabel: {
    color: "#64748b",
    fontSize: 12,
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    fontSize: 13,
  },

  th: {
    padding: "13px 14px",
    background: "#f8fafc",
    color: "#475569",
    fontWeight: 700,
    borderBottom: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "14px",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "middle",
  },

  patientName: {
    color: "#16334f",
    fontWeight: 700,
  },

  select: {
    width: "100%",
    minWidth: 125,
    padding: "9px 10px",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    background: "#ffffff",
    color: "#334155",
    fontSize: 12,
    cursor: "pointer",
  },

  disabledSelect: {
    background: "#f1f5f9",
    color: "#94a3b8",
    cursor: "not-allowed",
  },

  message: {
    padding: 24,
    textAlign: "center",
    background: "#f8fafc",
    borderRadius: 12,
    color: "#64748b",
    fontSize: 13,
  },

  footerNote: {
    margin: "16px 0 0",
    color: "#94a3b8",
    fontSize: 11,
    lineHeight: 1.5,
  },
};

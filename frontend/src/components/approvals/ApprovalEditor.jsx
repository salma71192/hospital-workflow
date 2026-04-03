import React from "react";
import PatientSummaryCard from "../patients/PatientSummaryCard";

export default function ApprovalEditor({
  selectedPatient,
  approvalForm,
  setApprovalForm,
  billingCodes = [],
  onSubmit,
  onReloadPatient,
}) {
  if (!selectedPatient) {
    return <div style={styles.emptyState}>Select a patient first from search.</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.headerCard}>
        <div>
          <div style={styles.eyebrow}>Approval Management</div>
          <h2 style={styles.title}>Update Approval</h2>
          <div style={styles.subtext}>
            Review authorization details, sessions, approved CPT codes, and notes.
          </div>
        </div>
      </div>

      <div style={styles.patientCard}>
        <PatientSummaryCard
          patient={selectedPatient}
          onUpdate={onReloadPatient}
          actionLabel="Reload"
        />
      </div>

      <form onSubmit={onSubmit} style={styles.formCard}>
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Authorization Details</div>

          <div style={styles.formGrid}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Authorization Number</label>
              <input
                placeholder="Enter authorization number"
                value={approvalForm.authorization_number}
                onChange={(e) =>
                  setApprovalForm({
                    ...approvalForm,
                    authorization_number: e.target.value,
                  })
                }
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Approved Sessions</label>
              <input
                type="number"
                min="0"
                placeholder="Enter approved sessions"
                value={approvalForm.approved_sessions}
                onChange={(e) =>
                  setApprovalForm({
                    ...approvalForm,
                    approved_sessions: e.target.value,
                  })
                }
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Start Date</label>
              <input
                type="date"
                value={approvalForm.start_date}
                onChange={(e) =>
                  setApprovalForm({
                    ...approvalForm,
                    start_date: e.target.value,
                  })
                }
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Expiry Date</label>
              <input
                type="date"
                value={approvalForm.expiry_date}
                onChange={(e) =>
                  setApprovalForm({
                    ...approvalForm,
                    expiry_date: e.target.value,
                  })
                }
                style={styles.input}
              />
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>Approved CPT Codes</div>
          <div style={styles.sectionHint}>
            Click codes to add or remove them from this approval.
          </div>

          <div style={styles.codesWrap}>
            {billingCodes.map((code) => {
              const selected = approvalForm.approved_cpt_codes_text
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean)
                .includes(code.code);

              return (
                <button
                  key={code.id}
                  type="button"
                  onClick={() => {
                    let list = approvalForm.approved_cpt_codes_text
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean);

                    if (selected) {
                      list = list.filter((c) => c !== code.code);
                    } else {
                      list.push(code.code);
                    }

                    setApprovalForm({
                      ...approvalForm,
                      approved_cpt_codes_text: list.join(","),
                    });
                  }}
                  style={{
                    ...styles.codeChip,
                    ...(selected ? styles.codeChipActive : {}),
                  }}
                >
                  <span style={styles.codeChipCode}>{code.code}</span>
                  {code.description ? (
                    <span style={styles.codeChipDesc}>{code.description}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>Notes</div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Internal Notes</label>
            <textarea
              placeholder="Add notes about approval, payer comments, or follow-up needed"
              value={approvalForm.notes}
              onChange={(e) =>
                setApprovalForm({
                  ...approvalForm,
                  notes: e.target.value,
                })
              }
              style={styles.textarea}
            />
          </div>
        </div>

        <div style={styles.actionBar}>
          <button type="submit" style={styles.primary}>
            Save Approval
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  page: {
    display: "grid",
    gap: "16px",
  },
  headerCard: {
    background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)",
    border: "1px solid #dbeafe",
    borderRadius: "18px",
    padding: "22px",
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
    fontSize: "26px",
    fontWeight: "800",
    color: "#0f172a",
  },
  subtext: {
    marginTop: "6px",
    fontSize: "14px",
    color: "#64748b",
  },
  patientCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
  },
  formCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "22px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
    display: "grid",
    gap: "22px",
  },
  section: {
    display: "grid",
    gap: "12px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a",
  },
  sectionHint: {
    fontSize: "13px",
    color: "#64748b",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },
  fieldGroup: {
    display: "grid",
    gap: "8px",
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
    fontSize: "15px",
    background: "#fff",
    outline: "none",
  },
  textarea: {
    minHeight: "110px",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    resize: "vertical",
    outline: "none",
  },
  codesWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  codeChip: {
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    background: "#f8fafc",
    padding: "10px 12px",
    cursor: "pointer",
    display: "grid",
    gap: "3px",
    textAlign: "left",
  },
  codeChipActive: {
    background: "#2563eb",
    color: "#fff",
    borderColor: "#2563eb",
  },
  codeChipCode: {
    fontSize: "13px",
    fontWeight: "800",
  },
  codeChipDesc: {
    fontSize: "12px",
    opacity: 0.9,
  },
  actionBar: {
    display: "flex",
    justifyContent: "flex-end",
    paddingTop: "8px",
    borderTop: "1px solid #e2e8f0",
  },
  primary: {
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#fff",
    padding: "12px 20px",
    border: "none",
    borderRadius: "10px",
    fontWeight: "800",
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
};
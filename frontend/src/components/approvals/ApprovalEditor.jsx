import React, { useEffect, useState } from "react";
import PatientSummaryCard from "../patients/PatientSummaryCard";
import PatientApprovalTimeline from "./PatientApprovalTimeline";

const DEFAULT_CODES = [
  { code: "97140", default_sessions: 6 },
  { code: "97110", default_sessions: 6 },
  { code: "97026", default_sessions: 6 },
  { code: "94014", default_sessions: 6 },
];

const OPTIONAL_CODES = [
  { code: "97035", default_sessions: 6 },
  { code: "97112", default_sessions: 6 },
  { code: "97032", default_sessions: 6 },
  { code: "97530", default_sessions: 6 },
  { code: "90912", default_sessions: 6 },
  { code: "90913", default_sessions: 6 },
  { code: "97116", default_sessions: 6 },
  { code: "97016", default_sessions: 6 },
];

export default function ApprovalEditor({
  selectedPatient,
  approvalForm,
  setApprovalForm,
  onSubmit,
  onReloadPatient,
  onDeleteApproval,
  refreshTimelineKey = 0,
}) {
  const [isEditing, setIsEditing] = useState(false);

  if (!selectedPatient) {
    return (
      <div style={styles.emptyState}>
        Select a patient first from search.
      </div>
    );
  }

  const selectedCodes = (approvalForm.approved_cpt_codes_text || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  const hasExistingApproval = Boolean(
    selectedPatient?.current_approval_number ||
      approvalForm?.authorization_number
  );

  useEffect(() => {
    if (hasExistingApproval) {
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  }, [selectedPatient?.id, hasExistingApproval]);

  useEffect(() => {
    if (hasExistingApproval) {
      setIsEditing(false);
    }
  }, [refreshTimelineKey, hasExistingApproval]);

  const toggleCode = (code, defaultSessions = 6) => {
    if (!isEditing) return;

    let nextCodes = [...selectedCodes];

    if (nextCodes.includes(code)) {
      nextCodes = nextCodes.filter((c) => c !== code);
    } else {
      nextCodes.push(code);
    }

    setApprovalForm({
      ...approvalForm,
      approved_cpt_codes_text: nextCodes.join(","),
      approved_sessions:
        Number(approvalForm.approved_sessions || 0) > 0
          ? approvalForm.approved_sessions
          : defaultSessions,
    });
  };

  const addAllDefaultCodes = () => {
    if (!isEditing) return;

    const merged = [
      ...new Set([...selectedCodes, ...DEFAULT_CODES.map((x) => x.code)]),
    ];

    setApprovalForm({
      ...approvalForm,
      approved_cpt_codes_text: merged.join(","),
      approved_sessions:
        Number(approvalForm.approved_sessions || 0) > 0
          ? approvalForm.approved_sessions
          : 6,
    });
  };

  const handleSubmit = async (e) => {
    await onSubmit(e);
    setIsEditing(false);
  };

  const inputStyle = isEditing
    ? styles.input
    : { ...styles.input, ...styles.inputDisabled };

  return (
    <div style={styles.page}>
      <div style={styles.headerCard}>
        <div>
          <div style={styles.eyebrow}>Approval Management</div>
          <h2 style={styles.title}>
            {hasExistingApproval ? "Current Approval" : "Add New Approval"}
          </h2>
          <div style={styles.subtext}>
            Review approval details, inspect timeline records, and edit only when needed.
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

      <PatientApprovalTimeline
        patientId={selectedPatient.id}
        refreshKey={refreshTimelineKey}
      />

      <form onSubmit={handleSubmit} style={styles.formCard}>
        <div style={styles.sectionHeader}>
          <div>
            <div style={styles.sectionTitle}>Authorization Details</div>
            <div style={styles.sectionHint}>
              {isEditing
                ? "Editing is enabled. Review before saving."
                : "Fields are locked to avoid accidental changes."}
            </div>
          </div>

          {hasExistingApproval && !isEditing ? (
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => setIsEditing(true)}
            >
              Edit Approval
            </button>
          ) : null}
        </div>

        <div style={styles.infoBox}>
          Approval start date is set automatically when the approval is first added.
        </div>

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
              style={inputStyle}
              disabled={!isEditing}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Approved Sessions</label>
            <input
              type="number"
              min="0"
              value={approvalForm.approved_sessions}
              onChange={(e) =>
                setApprovalForm({
                  ...approvalForm,
                  approved_sessions: e.target.value,
                })
              }
              style={inputStyle}
              disabled={!isEditing}
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
              style={inputStyle}
              disabled={!isEditing}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Current Start Date</label>
            <input
              type="text"
              value={approvalForm.start_date || "Will be set automatically"}
              style={{ ...styles.input, ...styles.inputDisabled }}
              disabled
            />
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div>
              <div style={styles.sectionTitle}>Default CPT Codes</div>
              <div style={styles.sectionHint}>
                Add the 4 default codes at once or select individually.
              </div>
            </div>

            <button
              type="button"
              style={{
                ...styles.fillDefaultsButton,
                ...(!isEditing ? styles.disabledButton : {}),
              }}
              onClick={addAllDefaultCodes}
              disabled={!isEditing}
            >
              Fill 4 Default Codes
            </button>
          </div>

          <div style={styles.codesWrap}>
            {DEFAULT_CODES.map((item) => {
              const selected = selectedCodes.includes(item.code);

              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => toggleCode(item.code, item.default_sessions)}
                  disabled={!isEditing}
                  style={{
                    ...styles.codeChip,
                    ...(selected ? styles.codeChipActive : {}),
                    ...(!isEditing ? styles.codeChipDisabled : {}),
                  }}
                >
                  <span style={styles.codeChipCode}>{item.code}</span>
                  <span style={styles.codeChipDesc}>
                    {item.default_sessions} sessions
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>Additional CPT Codes</div>
          <div style={styles.sectionHint}>
            Optional extra codes you can add to the same approval.
          </div>

          <div style={styles.codesWrap}>
            {OPTIONAL_CODES.map((item) => {
              const selected = selectedCodes.includes(item.code);

              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => toggleCode(item.code, item.default_sessions)}
                  disabled={!isEditing}
                  style={{
                    ...styles.codeChip,
                    ...(selected ? styles.codeChipActive : {}),
                    ...(!isEditing ? styles.codeChipDisabled : {}),
                  }}
                >
                  <span style={styles.codeChipCode}>{item.code}</span>
                  <span style={styles.codeChipDesc}>
                    {item.default_sessions} sessions
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={styles.actionBar}>
          <div style={styles.leftActions}>
            {hasExistingApproval ? (
              <button
                type="button"
                style={styles.deleteButton}
                onClick={() =>
                  onDeleteApproval && onDeleteApproval(selectedPatient)
                }
              >
                Delete Approval
              </button>
            ) : null}
          </div>

          {isEditing ? (
            <button type="submit" style={styles.primary}>
              Save
            </button>
          ) : null}
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
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
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
  infoBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "14px",
    color: "#475569",
    fontWeight: "600",
  },
  fillDefaultsButton: {
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: "800",
    cursor: "pointer",
  },
  secondaryButton: {
    background: "#e2e8f0",
    color: "#0f172a",
    padding: "12px 20px",
    border: "none",
    borderRadius: "10px",
    fontWeight: "800",
    cursor: "pointer",
  },
  disabledButton: {
    background: "#cbd5e1",
    cursor: "not-allowed",
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
  inputDisabled: {
    background: "#f8fafc",
    color: "#64748b",
    cursor: "not-allowed",
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
  codeChipDisabled: {
    cursor: "not-allowed",
    opacity: 0.8,
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "8px",
    borderTop: "1px solid #e2e8f0",
  },
  leftActions: {
    display: "flex",
    gap: "10px",
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
  deleteButton: {
    background: "#dc2626",
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
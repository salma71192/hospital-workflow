import React, { useEffect, useMemo, useState } from "react";
import PatientSummaryCard from "../patients/PatientSummaryCard";
import PatientApprovalTimeline from "./PatientApprovalTimeline";
import BillingCodePresets from "./BillingCodePresets";

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

  const hasExistingApproval = Boolean(
    selectedPatient?.current_approval_number ||
      approvalForm?.authorization_number
  );

  const selectedCodes = useMemo(() => {
    return (approvalForm?.approved_cpt_codes_text || "")
      .split(",")
      .map((x) => String(x).trim().toUpperCase())
      .filter(Boolean);
  }, [approvalForm?.approved_cpt_codes_text]);

  const existingCodes = useMemo(() => {
    return selectedCodes.map((code) => ({ code }));
  }, [selectedCodes]);

  const remainingSessions = useMemo(() => {
    const approved = Number(approvalForm?.approved_sessions || 0);
    const used = Number(approvalForm?.used_sessions || 0);
    return Math.max(approved - used, 0);
  }, [approvalForm?.approved_sessions, approvalForm?.used_sessions]);

  useEffect(() => {
    if (!selectedPatient) return;
    setIsEditing(!hasExistingApproval);
  }, [selectedPatient?.id, hasExistingApproval]);

  useEffect(() => {
    if (!selectedPatient) return;
    if (hasExistingApproval) {
      setIsEditing(false);
    }
  }, [refreshTimelineKey, hasExistingApproval, selectedPatient?.id]);

  const updateCodes = (nextCodes) => {
    setApprovalForm({
      ...approvalForm,
      approved_cpt_codes_text: [...new Set(nextCodes)].join(","),
    });
  };

  const handlePickCode = (item) => {
    if (!isEditing) return;

    const code = String(item?.code || "").trim().toUpperCase();
    if (!code || selectedCodes.includes(code)) return;

    const nextCodes = [...selectedCodes, code];

    setApprovalForm({
      ...approvalForm,
      approved_cpt_codes_text: nextCodes.join(","),
      approved_sessions:
        Number(approvalForm?.approved_sessions || 0) > 0
          ? approvalForm.approved_sessions
          : item.default_sessions,
    });
  };

  const handleAddDefaultCodes = (missingDefaults) => {
    if (!isEditing) return;

    const newCodes = missingDefaults.map((x) =>
      String(x.code || "").trim().toUpperCase()
    );
    const merged = [...new Set([...selectedCodes, ...newCodes])];

    setApprovalForm({
      ...approvalForm,
      approved_cpt_codes_text: merged.join(","),
      approved_sessions:
        Number(approvalForm?.approved_sessions || 0) > 0
          ? approvalForm.approved_sessions
          : 6,
    });
  };

  const handleRemoveCode = (codeToRemove) => {
    if (!isEditing) return;
    updateCodes(selectedCodes.filter((code) => code !== codeToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(e);
    setIsEditing(false);
  };

  const inputStyle = isEditing
    ? styles.input
    : { ...styles.input, ...styles.inputDisabled };

  if (!selectedPatient) {
    return (
      <div style={styles.emptyState}>
        Select a patient first from search.
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.headerCard}>
        <div>
          <div style={styles.eyebrow}>Approval Management</div>
          <h2 style={styles.title}>
            {hasExistingApproval ? "Current Approval" : "Add New Approval"}
          </h2>
          <div style={styles.subtext}>
            Review approval details, inspect timeline records, and edit only
            when needed.
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
          Approval start date is set automatically when the approval is first
          added.
        </div>

        <div style={styles.formGrid}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Authorization Number</label>
            <input
              placeholder="Enter authorization number"
              value={approvalForm?.authorization_number || ""}
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
              value={approvalForm?.approved_sessions ?? 0}
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
            <label style={styles.label}>Used Sessions</label>
            <input
              type="number"
              min="0"
              value={approvalForm?.used_sessions ?? 0}
              onChange={(e) =>
                setApprovalForm({
                  ...approvalForm,
                  used_sessions: e.target.value,
                })
              }
              style={inputStyle}
              disabled={!isEditing}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Remaining Sessions</label>
            <input
              type="text"
              value={remainingSessions}
              style={{ ...styles.input, ...styles.inputDisabled }}
              disabled
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Expiry Date</label>
            <input
              type="date"
              value={approvalForm?.expiry_date || ""}
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
              value={approvalForm?.start_date || "Will be set automatically"}
              style={{ ...styles.input, ...styles.inputDisabled }}
              disabled
            />
          </div>
        </div>

        <div style={styles.infoBoxSoft}>
          Use Used Sessions only when you need to correct the recorded count manually.
        </div>

        <BillingCodePresets
          existingCodes={existingCodes}
          onPickCode={handlePickCode}
          onAddDefaultCodes={handleAddDefaultCodes}
          disabled={!isEditing}
        />

        <div style={styles.selectedCodesCard}>
          <div style={styles.sectionTitle}>Selected CPT Codes</div>
          {selectedCodes.length === 0 ? (
            <div style={styles.sectionHint}>No CPT codes selected yet.</div>
          ) : (
            <div style={styles.codesWrap}>
              {selectedCodes.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleRemoveCode(code)}
                  style={{
                    ...styles.codeChip,
                    ...styles.codeChipActive,
                    ...(isEditing ? {} : styles.codeChipDisabled),
                  }}
                  disabled={!isEditing}
                >
                  <span style={styles.codeChipCode}>{code}</span>
                  <span style={styles.codeChipDesc}>
                    {isEditing ? "Click to remove" : "Selected"}
                  </span>
                </button>
              ))}
            </div>
          )}
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
  infoBoxSoft: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "13px",
    color: "#92400e",
    fontWeight: "600",
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
  secondaryButton: {
    background: "#e2e8f0",
    color: "#0f172a",
    padding: "12px 20px",
    border: "none",
    borderRadius: "10px",
    fontWeight: "800",
    cursor: "pointer",
  },
  selectedCodesCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "18px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
    display: "grid",
    gap: "12px",
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
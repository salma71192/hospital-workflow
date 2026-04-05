import React, { useMemo } from "react";

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

export default function BillingCodePresets({
  existingCodes = [],
  onPickCode,
  onAddDefaultCodes,
  disabled = false,
}) {
  const normalizeCode = (value) => String(value || "").trim().toUpperCase();

  const existingSet = useMemo(() => {
    return new Set(
      existingCodes
        .map((item) => normalizeCode(item?.code))
        .filter(Boolean)
    );
  }, [existingCodes]);

  const missingDefaultCodes = useMemo(() => {
    return DEFAULT_CODES.filter((item) => !existingSet.has(normalizeCode(item.code)));
  }, [existingSet]);

  const handlePickCode = (item, exists) => {
    if (disabled || exists || !onPickCode) return;
    onPickCode(item);
  };

  const handleAddDefaultCodes = () => {
    if (disabled || !missingDefaultCodes.length || !onAddDefaultCodes) return;
    onAddDefaultCodes(missingDefaultCodes);
  };

  const renderCodeGrid = (items) => {
    return (
      <div style={styles.grid}>
        {items.map((item) => {
          const exists = existingSet.has(normalizeCode(item.code));

          return (
            <button
              key={item.code}
              type="button"
              onClick={() => handlePickCode(item, exists)}
              disabled={disabled || exists}
              title={
                exists
                  ? `${item.code} already added`
                  : disabled
                  ? "Editing is disabled"
                  : `Add ${item.code}`
              }
              style={{
                ...styles.codeButton,
                ...(exists || disabled ? styles.codeButtonDisabled : {}),
              }}
            >
              <span style={styles.codeText}>{item.code}</span>
              <span style={styles.codeMeta}>
                {exists ? "Added" : `${item.default_sessions} sessions`}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div
      style={{
        ...styles.card,
        ...(disabled ? styles.cardDisabled : {}),
      }}
    >
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>Quick Setup</div>
          <h3 style={styles.title}>CPT Code Presets</h3>
          <div style={styles.subtext}>
            Add the 4 default codes at once, or choose optional codes below.
          </div>
        </div>
      </div>

      <div style={styles.group}>
        <div style={styles.groupHeader}>
          <div style={styles.groupTitle}>Default 4 Codes</div>

          <button
            type="button"
            style={{
              ...styles.fillAllButton,
              ...(disabled || missingDefaultCodes.length === 0
                ? styles.disabledButton
                : {}),
            }}
            disabled={disabled || missingDefaultCodes.length === 0}
            onClick={handleAddDefaultCodes}
            title={
              disabled
                ? "Editing is disabled"
                : missingDefaultCodes.length === 0
                ? "All default codes are already added"
                : "Add all missing default CPT codes"
            }
          >
            {missingDefaultCodes.length === 0 ? "Defaults Added" : "Fill 4 Default Codes"}
          </button>
        </div>

        {renderCodeGrid(DEFAULT_CODES)}
      </div>

      <div style={styles.group}>
        <div style={styles.groupTitle}>Optional Additional Codes</div>
        {renderCodeGrid(OPTIONAL_CODES)}
      </div>
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
    gap: "18px",
  },
  cardDisabled: {
    opacity: 0.75,
  },
  header: {
    marginBottom: "4px",
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
  subtext: {
    marginTop: "6px",
    fontSize: "13px",
    color: "#64748b",
  },
  group: {
    display: "grid",
    gap: "10px",
  },
  groupHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  groupTitle: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#0f172a",
  },
  fillAllButton: {
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: "800",
    cursor: "pointer",
  },
  disabledButton: {
    background: "#94a3b8",
    cursor: "not-allowed",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: "10px",
  },
  codeButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    background: "#f8fafc",
    padding: "12px",
    cursor: "pointer",
    textAlign: "left",
    display: "grid",
    gap: "4px",
  },
  codeButtonDisabled: {
    background: "#e2e8f0",
    color: "#64748b",
    cursor: "not-allowed",
    opacity: 0.9,
  },
  codeText: {
    fontSize: "14px",
    fontWeight: "800",
  },
  codeMeta: {
    fontSize: "12px",
  },
};
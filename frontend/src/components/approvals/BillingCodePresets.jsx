import React from "react";

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
}) {
  const existingSet = new Set(existingCodes.map((item) => item.code));

  const missingDefaultCodes = DEFAULT_CODES.filter(
    (item) => !existingSet.has(item.code)
  );

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>Quick Setup</div>
          <h3 style={styles.title}>CPT Code Defaults</h3>
          <div style={styles.subtext}>
            Add the 4 default codes at once, or add optional codes below.
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
              ...(missingDefaultCodes.length === 0 ? styles.disabledButton : {}),
            }}
            disabled={missingDefaultCodes.length === 0}
            onClick={() => onAddDefaultCodes && onAddDefaultCodes(missingDefaultCodes)}
          >
            {missingDefaultCodes.length === 0
              ? "Defaults Added"
              : "Fill 4 Default Codes"}
          </button>
        </div>

        <div style={styles.grid}>
          {DEFAULT_CODES.map((item) => {
            const exists = existingSet.has(item.code);

            return (
              <button
                key={item.code}
                type="button"
                onClick={() => !exists && onPickCode(item)}
                disabled={exists}
                style={{
                  ...styles.codeButton,
                  ...(exists ? styles.codeButtonDisabled : {}),
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
      </div>

      <div style={styles.group}>
        <div style={styles.groupTitle}>Optional Additional Codes</div>

        <div style={styles.grid}>
          {OPTIONAL_CODES.map((item) => {
            const exists = existingSet.has(item.code);

            return (
              <button
                key={item.code}
                type="button"
                onClick={() => !exists && onPickCode(item)}
                disabled={exists}
                style={{
                  ...styles.codeButton,
                  ...(exists ? styles.codeButtonDisabled : {}),
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
  },
  codeText: {
    fontSize: "14px",
    fontWeight: "800",
  },
  codeMeta: {
    fontSize: "12px",
  },
};
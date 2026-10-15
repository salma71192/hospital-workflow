import React from "react";
export default function PatientSearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder = "Search Patient File",
  searchLabel = "Search",
  clearLabel = "Clear",
}) {
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <span style={styles.eyebrow}>RECEPTION TEAM</span>
          <h2 style={styles.title}>Search Patient File</h2>
          <p style={styles.subtitle}>
            Find an existing patient by name or hospital file number.
          </p>
        </div>
        <span style={styles.headerBadge}>
          <span style={styles.badgeIcon}>✓</span>
          Patient Lookup
        </span>
      </div>
      <form onSubmit={onSubmit} style={styles.searchRow}>
        <div style={styles.inputWrapper}>
          <span style={styles.searchIcon}>⌕</span>
          <input
            type="text"
            name="patient_search"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={styles.input}
            aria-label="Search Patient File"
          />
        </div>
        <button type="submit" style={styles.primaryButton}>
          <span style={styles.buttonIcon}>⌕</span>
          {searchLabel}
        </button>
        <button
          type="button"
          style={styles.secondaryButton}
          onClick={onClear}
        >
          <span style={styles.clearIcon}>×</span>
          {clearLabel}
        </button>
      </form>
      <div style={styles.footer}>
        <div style={styles.tip}>
          <span style={styles.tipIcon}>i</span>
          <span>Enter a patient name or file number to find a record.</span>
        </div>
        <span style={styles.footerBadge}>
          <span style={styles.statusDot} />
          Existing Patient Records
        </span>
      </div>
    </div>
  );
}
const styles = {
  card: {
    background: "#ffffff",
    borderRadius: "22px",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.07)",
    border: "1px solid #e3eaf5",
    padding: "clamp(18px, 3vw, 26px)",
    display: "grid",
    gap: "20px",
    width: "100%",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "14px",
  },
  eyebrow: {
    display: "inline-block",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "0.09em",
    color: "#2563eb",
    background: "#eff6ff",
    border: "1px solid #dbeafe",
    borderRadius: "8px",
    padding: "6px 10px",
    marginBottom: "11px",
  },
  title: {
    margin: "0 0 7px",
    fontSize: "clamp(21px, 3vw, 26px)",
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.7,
    color: "#64748b",
  },
  headerBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "9px 12px",
    borderRadius: "12px",
    background: "#f5f3ff",
    border: "1px solid #ddd6fe",
    color: "#6d28d9",
    fontSize: "11px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },
  badgeIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "22px",
    height: "22px",
    borderRadius: "7px",
    background: "#7c3aed",
    color: "#ffffff",
    fontSize: "12px",
  },
  searchRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto auto",
    gap: "10px",
    alignItems: "stretch",
    width: "100%",
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
    padding: "0 12px",
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    boxSizing: "border-box",
  },
  searchIcon: {
    color: "#64748b",
    fontSize: "26px",
    lineHeight: 1,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    minWidth: 0,
    width: "100%",
    padding: "13px 0",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#0f172a",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    padding: "12px 18px",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(37, 99, 235, 0.18)",
    whiteSpace: "nowrap",
  },
  buttonIcon: {
    fontSize: "19px",
    lineHeight: 1,
  },
  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    background: "#fff7ed",
    color: "#c2410c",
    border: "1px solid #fed7aa",
    borderRadius: "12px",
    padding: "12px 16px",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  clearIcon: {
    fontSize: "20px",
    lineHeight: 1,
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    paddingTop: "14px",
    borderTop: "1px solid #f1f5f9",
  },
  tip: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#64748b",
    fontSize: "11px",
    lineHeight: 1.6,
  },
  tipIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "11px",
    fontWeight: "800",
    fontStyle: "italic",
  },
  footerBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#15803d",
    borderRadius: "20px",
    padding: "6px 10px",
    fontSize: "10px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },
  statusDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#22c55e",
  },
};
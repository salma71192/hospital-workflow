import React from "react";

export default function PatientSearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder = "Search by patient name or ID",
  searchLabel = "Search",
  clearLabel = "Clear",
}) {
  return (
    <form onSubmit={onSubmit} style={styles.searchRow}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.input}
      />

      <button type="submit" style={styles.primaryButton}>
        {searchLabel}
      </button>

      <button type="button" style={styles.secondaryButton} onClick={onClear}>
        {clearLabel}
      </button>
    </form>
  );
}

const styles = {
  searchRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto auto",
    gap: "12px",
    alignItems: "center",
    marginBottom: "18px",
  },
  input: {
    padding: "13px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box",
  },
  primaryButton: {
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "13px 18px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },
  secondaryButton: {
    background: "#eef2f7",
    color: "#0f172a",
    border: "1px solid #d7e0ec",
    borderRadius: "12px",
    padding: "13px 18px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },
};
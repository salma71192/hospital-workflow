import React from "react";

export default function WaitingListSection({
  waitingList = [],
  onOpenWaitingList,
}) {
  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <div>
          <div style={styles.eyebrow}>Waiting List</div>
          <h2 style={styles.title}>Patient Waiting List</h2>
        </div>

        <div style={styles.countBadge}>{waitingList.length}</div>
      </div>

      <p style={styles.subtext}>
        Track patients waiting for earlier appointments or unavailable slots.
      </p>

      {waitingList.length === 0 ? (
        <div style={styles.emptyState}>No patients on waiting list.</div>
      ) : (
        <div style={styles.list}>
          {waitingList.slice(0, 5).map((item) => (
            <div key={item.id} style={styles.row}>
              <div>
                <div style={styles.name}>{item.patient_name}</div>
                <div style={styles.meta}>
                  {item.patient_id} • {item.preferred_date || "Any date"}
                </div>
              </div>

              <div style={styles.status}>
                {item.status || "Waiting"}
              </div>
            </div>
          ))}
        </div>
      )}

      <button type="button" style={styles.button} onClick={onOpenWaitingList}>
        Open Waiting List
      </button>
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
    gap: "14px",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },
  eyebrow: {
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#be185d",
  },
  title: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f172a",
  },
  countBadge: {
    minWidth: "42px",
    height: "42px",
    borderRadius: "999px",
    background: "#fdf2f8",
    color: "#be185d",
    display: "grid",
    placeItems: "center",
    fontWeight: "900",
    fontSize: "16px",
  },
  subtext: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
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
  list: {
    display: "grid",
    gap: "10px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "12px 14px",
  },
  name: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#0f172a",
  },
  meta: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#64748b",
    marginTop: "3px",
  },
  status: {
    fontSize: "12px",
    fontWeight: "800",
    color: "#be185d",
    background: "#fdf2f8",
    borderRadius: "999px",
    padding: "6px 10px",
    whiteSpace: "nowrap",
  },
  button: {
    background: "#be185d",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 16px",
    fontWeight: "800",
    cursor: "pointer",
  },
};
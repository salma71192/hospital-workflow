import React from "react";

export default function AlertPanel({
  title = "Alerts",
  items = [],
  emptyText = "No alerts right now.",
}) {
  return (
    <div style={styles.card}>
      <div style={styles.title}>{title}</div>

      {items.length ? (
        <div style={styles.list}>
          {items.map((item, index) => (
            <div
              key={index}
              style={{
                ...styles.item,
                ...(item.level === "danger"
                  ? styles.danger
                  : item.level === "warning"
                  ? styles.warning
                  : item.level === "success"
                  ? styles.success
                  : styles.info),
              }}
            >
              <div style={styles.itemHeader}>
                <span style={styles.badge}>
                  {item.level === "danger"
                    ? "Urgent"
                    : item.level === "warning"
                    ? "Warning"
                    : item.level === "success"
                    ? "Good"
                    : "Info"}
                </span>
              </div>

              <div style={styles.message}>{item.message}</div>

              {item.subtext ? (
                <div style={styles.subtext}>{item.subtext}</div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.empty}>{emptyText}</div>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e8eef7",
    display: "grid",
    gap: "14px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f172a",
  },
  list: {
    display: "grid",
    gap: "12px",
  },
  item: {
    borderRadius: "14px",
    padding: "14px",
    border: "1px solid transparent",
  },
  itemHeader: {
    marginBottom: "8px",
  },
  badge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
  },
  message: {
    fontSize: "15px",
    fontWeight: "700",
    marginBottom: "4px",
  },
  subtext: {
    fontSize: "13px",
    color: "#475569",
  },
  info: {
    background: "#eff6ff",
    borderColor: "#bfdbfe",
    color: "#1d4ed8",
  },
  warning: {
    background: "#fef3c7",
    borderColor: "#fcd34d",
    color: "#92400e",
  },
  danger: {
    background: "#fee2e2",
    borderColor: "#fecaca",
    color: "#b91c1c",
  },
  success: {
    background: "#dcfce7",
    borderColor: "#86efac",
    color: "#166534",
  },
  empty: {
    padding: "14px",
    borderRadius: "12px",
    background: "#f8fafc",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
    fontWeight: "600",
  },
};
import React from "react";

export default function DashboardNotice({
  type = "info",
  children,
}) {
  const typeStyles = variants[type] || variants.info;

  return (
    <div
      style={{
        ...styles.base,
        ...typeStyles,
      }}
    >
      {children}
    </div>
  );
}

const styles = {
  base: {
    borderRadius: "12px",
    padding: "14px 16px",
    fontWeight: "700",
  },
};

const variants = {
  success: {
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #86efac",
  },
  error: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
  },
  info: {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
  },
  warning: {
    background: "#fef3c7",
    color: "#92400e",
    border: "1px solid #fcd34d",
  },
  neutral: {
    background: "#f8fafc",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
  },
};
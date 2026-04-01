import React, { useState } from "react";

export default function DashboardLayout({
  title,
  subtitle,
  accent = "#2563eb",
  sidebarTitle = "Dashboard Menu",
  sidebarItems = [],
  activeSection,
  setActiveSection,
  onLogout,
  actingAs,
  actingAsName,
  onBackToAdmin,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {actingAs && onBackToAdmin && (
          <div style={styles.banner}>
            <span>Viewing as: {actingAsName}</span>
            <button style={styles.bannerButton} onClick={onBackToAdmin}>
              Back to Admin
            </button>
          </div>
        )}

        <div style={styles.topBar}>
          <div>
            <h1 style={{ ...styles.title, color: accent }}>{title}</h1>
            <p style={styles.subtitle}>{subtitle}</p>
          </div>

          <div style={styles.topActions}>
            <button
              style={styles.sidebarToggle}
              onClick={() => setSidebarOpen((prev) => !prev)}
            >
              {sidebarOpen ? "Hide Menu" : "Show Menu"}
            </button>

            <button style={styles.logoutButton} onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>

        <div
          style={{
            ...styles.layout,
            gridTemplateColumns: sidebarOpen ? "280px 1fr" : "1fr",
          }}
        >
          {sidebarOpen && (
            <aside style={styles.sidebar}>
              <div style={styles.sidebarTitle}>{sidebarTitle}</div>

              {sidebarItems.map((item) => (
                <button
                  key={item.key}
                  style={{
                    ...styles.sidebarButton,
                    ...(activeSection === item.key
                      ? styles.sidebarButtonActive
                      : {}),
                  }}
                  onClick={() => setActiveSection(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </aside>
          )}

          <main style={styles.content}>{children}</main>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f4f7fb 0%, #fbfdff 100%)",
    padding: "32px 20px",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: "1250px",
    margin: "0 auto",
  },
  banner: {
    background: "#fef3c7",
    border: "1px solid #fcd34d",
    color: "#92400e",
    padding: "12px 16px",
    borderRadius: "12px",
    marginBottom: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bannerButton: {
    background: "#92400e",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: "700",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "24px",
  },
  title: {
    margin: 0,
    fontSize: "34px",
    fontWeight: "800",
  },
  subtitle: {
    margin: "8px 0 0 0",
    color: "#64748b",
    fontSize: "16px",
  },
  topActions: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  sidebarToggle: {
    background: "#0f766e",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "12px 18px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  logoutButton: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "12px 18px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  layout: {
    display: "grid",
    gap: "22px",
    alignItems: "start",
  },
  sidebar: {
    background: "#ffffff",
    borderRadius: "22px",
    padding: "18px",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e8eef7",
    position: "sticky",
    top: "20px",
  },
  sidebarTitle: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "14px",
    padding: "4px 8px",
  },
  sidebarButton: {
    width: "100%",
    textAlign: "left",
    border: "none",
    background: "#f8fbff",
    color: "#0f172a",
    padding: "14px 14px",
    borderRadius: "14px",
    marginBottom: "10px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },
  sidebarButtonActive: {
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#fff",
    boxShadow: "0 10px 24px rgba(37, 99, 235, 0.22)",
  },
  content: {
    minWidth: 0,
    display: "grid",
    gap: "20px",
  },
};
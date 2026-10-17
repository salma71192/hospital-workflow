
import React, { useState } from "react";
import AdminSidebar from "./admin/AdminSidebar";
import "./DashboardLayout.css";

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
  useAdminSidebar = false,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="dashboard-layout">
      <div className="dashboard-layout__container">
        {actingAs && onBackToAdmin && (
          <div className="dashboard-layout__acting-banner">
            <span>Viewing as: {actingAsName}</span>
            <button
              type="button"
              className="dashboard-layout__back-button"
              onClick={onBackToAdmin}
            >
              Back to Admin
            </button>
          </div>
        )}

        <header className="dashboard-layout__header">
          <div className="dashboard-layout__heading">
            <h1
              className="dashboard-layout__title"
              style={{ "--dashboard-accent": accent }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="dashboard-layout__subtitle">{subtitle}</p>
            )}
          </div>

          <div className="dashboard-layout__actions">
            <button
              type="button"
              className="dashboard-layout__menu-toggle"
              onClick={() => setSidebarOpen((previous) => !previous)}
              aria-label={sidebarOpen ? "Collapse menu" : "Expand menu"}
              aria-expanded={sidebarOpen}
              title={sidebarOpen ? "Collapse menu" : "Expand menu"}
            >
              <span aria-hidden="true">☰</span>
            </button>

            {onLogout && (
              <button
                type="button"
                className="dashboard-layout__logout-button"
                onClick={onLogout}
              >
                Logout
              </button>
            )}
          </div>
        </header>

        <div
          className={`dashboard-layout__body ${
            sidebarOpen
              ? "dashboard-layout__body--sidebar-open"
              : "dashboard-layout__body--sidebar-closed"
          }`}
        >
          {sidebarOpen &&
            (useAdminSidebar ? (
              <AdminSidebar
                sidebarTitle={sidebarTitle}
                activeSection={activeSection}
                onSelect={setActiveSection}
              />
            ) : (
              <aside className="dashboard-layout__sidebar">
                <div className="dashboard-layout__sidebar-title">
                  {sidebarTitle}
                </div>

                <nav aria-label="Dashboard navigation">
                  {sidebarItems.map((item) => {
                    const isActive = activeSection === item.key;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        className={`dashboard-layout__sidebar-button ${
                          isActive
                            ? "dashboard-layout__sidebar-button--active"
                            : ""
                        }`}
                        onClick={() => setActiveSection(item.key)}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </aside>
            ))}

          <main className="dashboard-layout__content">{children}</main>
        </div>
      </div>
    </div>
  );
}


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

  const toggleSidebar = () => {
    setSidebarOpen((previous) => !previous);
  };

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
              <p className="dashboard-layout__subtitle">
                {subtitle}
              </p>
            )}
          </div>

          <div className="dashboard-layout__actions">
            {onLogout && (
              <button
                type="button"
                className="dashboard-layout__logout-button"
                onClick={onLogout}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M10 17l5-5-5-5" />
                  <path d="M15 12H3" />
                  <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
                </svg>
                <span>Logout</span>
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
          <aside
            className={`dashboard-layout__menu-shell ${
              sidebarOpen
                ? "dashboard-layout__menu-shell--open"
                : "dashboard-layout__menu-shell--closed"
            }`}
          >
            <div className="dashboard-layout__menu-toolbar">
              {sidebarOpen && (
                <span className="dashboard-layout__menu-toolbar-title">
                  {sidebarTitle}
                </span>
              )}

              <button
                type="button"
                className="dashboard-layout__menu-toggle"
                onClick={toggleSidebar}
                aria-label={
                  sidebarOpen ? "Collapse menu" : "Expand menu"
                }
                aria-expanded={sidebarOpen}
                title={
                  sidebarOpen ? "Collapse menu" : "Expand menu"
                }
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M9 4v16" />
                  {sidebarOpen ? (
                    <path d="m15 9-3 3 3 3" />
                  ) : (
                    <path d="m13 9 3 3-3 3" />
                  )}
                </svg>
              </button>
            </div>

            {sidebarOpen && (
              useAdminSidebar ? (
                <AdminSidebar
                  sidebarTitle={sidebarTitle}
                  activeSection={activeSection}
                  onSelect={setActiveSection}
                />
              ) : (
                <div className="dashboard-layout__standard-sidebar">
                  <nav aria-label="Dashboard navigation">
                    {sidebarItems.map((item) => {
                      const isActive =
                        activeSection === item.key;

                      return (
                        <button
                          key={item.key}
                          type="button"
                          className={`dashboard-layout__sidebar-button ${
                            isActive
                              ? "dashboard-layout__sidebar-button--active"
                              : ""
                          }`}
                          onClick={() =>
                            setActiveSection(item.key)
                          }
                          aria-current={
                            isActive ? "page" : undefined
                          }
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              )
            )}
          </aside>

          <main className="dashboard-layout__content">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

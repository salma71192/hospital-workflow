
import React from "react";
import SidebarCategory from "./SidebarCategory";
import adminMenuConfig from "./adminMenuConfig";
import "./AdminSidebar.css";
export default function AdminSidebar({
  activeSection,
  onSelect,
  sidebarTitle = "Hospital Workflow",
}) {
  return (
    <aside className="admin-sidebar">
      {/* Sidebar Header */}
      <div className="admin-sidebar__header">
        <div className="admin-sidebar__brand">
          <div className="admin-sidebar__logo">
            <span aria-hidden="true">✚</span>
          </div>

          <div className="admin-sidebar__brand-text">
            <h2>{sidebarTitle}</h2>
            <p>ADMINISTRATION</p>
          </div>
        </div>

        <div className="admin-sidebar__header-divider" />

        <div className="admin-sidebar__section-label">
          MANAGEMENT MENU
        </div>
      </div>

      {/* Navigation Categories */}
      <nav
        className="admin-sidebar__navigation"
        aria-label="Admin navigation"
      >
        {adminMenuConfig.map((category) => (
          <SidebarCategory
            key={category.key}
            category={category}
            activeSection={activeSection}
            onSelect={onSelect}
          />
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="admin-sidebar__footer">
        <span className="admin-sidebar__footer-indicator" />
        <span>Hospital Management System</span>
      </div>
    </aside>
  );
}

import React from "react";
import SidebarCategory from "./SidebarCategory";
import adminMenuConfig from "./adminMenuConfig";
import "./AdminSidebar.css";
export default function AdminSidebar({
  activeSection,
  onSelect,
  sidebarTitle = "Hospital Workflow",
}) {
  // Add Evaluation Tracker without modifying the original menu config.
  const menuConfig = React.useMemo(() => {
    const config = Array.isArray(adminMenuConfig)
      ? adminMenuConfig.map((category) => ({
          ...category,
          items: Array.isArray(category.items)
            ? [...category.items]
            : category.items,
        }))
      : [];
    const trackerExists = config.some((category) =>
      (category.items || []).some(
        (item) => item.key === "evaluation_tracker"
      )
    );
    if (!trackerExists) {
      const managementCategory = config.find(
        (category) =>
          Array.isArray(category.items) &&
          category.items.some((item) =>
            ["create", "manage", "users"].includes(item.key)
          )
      );
      const targetCategory = managementCategory || config[0];
      const trackerItem = {
        key: "evaluation_tracker",
        label: "Evaluation Tracker",
      };
      if (targetCategory) {
        if (!Array.isArray(targetCategory.items)) {
          targetCategory.items = [];
        }
        targetCategory.items.push(trackerItem);
      } else {
        config.push({
          key: "evaluation_tools",
          label: "Evaluation Tools",
          items: [trackerItem],
        });
      }
    }
    return config;
  }, []);
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
        {menuConfig.map((category) => (
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
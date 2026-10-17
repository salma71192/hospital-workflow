import React, { useMemo } from "react";
import SidebarCategory from "./SidebarCategory";
import adminMenuConfig from "./adminMenuConfig";
import "./AdminSidebar.css";
export default function AdminSidebar({
  activeSection,
  onSelect,
  sidebarTitle = "Hospital Workflow",
  sidebarItems = [],
}) {
  const menuConfig = useMemo(() => {
    // Preserve the original admin menu and its categorization.
    const originalMenu = Array.isArray(adminMenuConfig)
      ? adminMenuConfig
      : [];
    const config = originalMenu.map((category) => ({
      ...category,
      children: Array.isArray(category.children)
        ? category.children.map((item) => ({ ...item }))
        : [],
    }));
    // Merge additional dashboard items into their existing categories.
    const additionalItems = Array.isArray(sidebarItems)
      ? sidebarItems
      : [];
    additionalItems.forEach((category) => {
      const existingCategory = config.find(
        (item) => item.key === category.key
      );
      const children = Array.isArray(category.children)
        ? category.children
        : Array.isArray(category.items)
          ? category.items
          : [];
      if (existingCategory) {
        children.forEach((child) => {
          const alreadyExists = existingCategory.children.some(
            (item) => item.key === child.key
          );
          if (!alreadyExists) {
            existingCategory.children.push({ ...child });
          }
        });
      } else if (children.length > 0) {
        config.push({
          ...category,
          children: children.map((item) => ({ ...item })),
        });
      }
    });
    // Ensure the Evaluation Tracker remains in Rehab Management.
    const rehabCategory = config.find(
      (category) => category.key === "rehab_management"
    );
    if (rehabCategory) {
      const trackerExists = rehabCategory.children.some(
        (item) => item.key === "evaluation_tracker"
      );
      if (!trackerExists) {
        rehabCategory.children.push({
          key: "evaluation_tracker",
          label: "Evaluation Tracker",
        });
      }
    }
    return config;
  }, [sidebarItems]);
  return (
    <aside className="admin-sidebar">
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
      <div className="admin-sidebar__footer">
        <span className="admin-sidebar__footer-indicator" />
        <span>Hospital Management System</span>
      </div>
    </aside>
  );
}
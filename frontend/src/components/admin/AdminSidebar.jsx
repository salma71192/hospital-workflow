
import React from "react";
import SidebarCategory from "./SidebarCategory";
import adminMenuConfig from "./adminMenuConfig";

export default function AdminSidebar({
  activeSection,
  onSelect,
  sidebarTitle = "Admin Panel",
}) {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__header">
        <h2>{sidebarTitle}</h2>
        <p>Management</p>
      </div>

      <nav className="admin-sidebar__navigation" aria-label="Admin navigation">
        {adminMenuConfig.map((category) => (
          <SidebarCategory
            key={category.key}
            category={category}
            activeSection={activeSection}
            onSelect={onSelect}
          />
        ))}
      </nav>
    </aside>
  );
}



import React, { useState } from "react";

export default function SidebarCategory({
  category,
  activeSection,
  onSelect,
  defaultOpen = false,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const hasActiveChild = category.children?.some(
    (item) => item.key === activeSection
  );

  const expanded = isOpen || hasActiveChild;

  return (
    <div className="admin-sidebar-category">
      <button
        type="button"
        className={`admin-sidebar-category__trigger ${
          hasActiveChild ? "active" : ""
        }`}
        onClick={() => setIsOpen((previous) => !previous)}
        aria-expanded={expanded}
      >
        <span className="admin-sidebar-category__label">
          {category.icon && (
            <span className="admin-sidebar-category__icon">
              {category.icon === "users" && "👥"}
              {category.icon === "clipboard-list" && "📋"}
              {category.icon === "activity" && "📊"}
            </span>
          )}

          <span>{category.label}</span>
        </span>

        <span
          className={`admin-sidebar-category__chevron ${
            expanded ? "expanded" : ""
          }`}
          aria-hidden="true"
        >
          ›
        </span>
      </button>

      {expanded && (
        <div className="admin-sidebar-category__children">
          {category.children?.map((item) => (
            <button
              type="button"
              key={item.key}
              className={`admin-sidebar-category__item ${
                activeSection === item.key ? "active" : ""
              }`}
              onClick={() => onSelect(item.key)}
            >
              <span className="admin-sidebar-category__dot">
                {activeSection === item.key ? "●" : "○"}
              </span>

              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

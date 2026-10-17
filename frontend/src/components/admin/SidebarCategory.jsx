
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

  // Keep the active category expanded.
  const expanded = isOpen || hasActiveChild;

  const icons = {
    users: "♙",
    "clipboard-list": "▤",
    activity: "▥",
  };

  return (
    <div className="admin-sidebar-category">
      {/* Category Header */}
      <button
        type="button"
        className={`admin-sidebar-category__trigger ${
          hasActiveChild ? "active" : ""
        }`}
        onClick={() => setIsOpen((previous) => !previous)}
        aria-expanded={expanded}
        aria-controls={`sidebar-category-${category.key}`}
      >
        <span className="admin-sidebar-category__label">
          <span
            className="admin-sidebar-category__icon"
            aria-hidden="true"
          >
            {icons[category.icon] || "•"}
          </span>

          <span className="admin-sidebar-category__text">
            {category.label}
          </span>
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

      {/* Submenu Items */}
      <div
        id={`sidebar-category-${category.key}`}
        className={`admin-sidebar-category__children ${
          expanded ? "open" : "closed"
        }`}
        hidden={!expanded}
      >
        {category.children?.map((item) => {
          const isActive = activeSection === item.key;

          return (
            <button
              type="button"
              key={item.key}
              className={`admin-sidebar-category__item ${
                isActive ? "active" : ""
              }`}
              onClick={() => onSelect(item.key)}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className="admin-sidebar-category__dot"
                aria-hidden="true"
              >
                {isActive ? "●" : "○"}
              </span>

              <span className="admin-sidebar-category__item-text">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

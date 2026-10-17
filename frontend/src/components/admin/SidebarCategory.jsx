
import React, { useEffect, useId, useState } from "react";

const categoryIcons = {
  users: "♙",
  "clipboard-list": "▤",
  activity: "▥",
};

export default function SidebarCategory({
  category,
  activeSection,
  onSelect,
}) {
  const generatedId = useId();

  const categoryKey = category?.key || generatedId;
  const children = Array.isArray(category?.children)
    ? category.children
    : [];

  const hasActiveChild = children.some(
    (item) => item?.key === activeSection
  );

  const [isOpen, setIsOpen] = useState(
    Boolean(category?.defaultOpen || hasActiveChild)
  );

  useEffect(() => {
    if (hasActiveChild) {
      setIsOpen(true);
    }
  }, [hasActiveChild]);

  const expanded = isOpen;
  const submenuId = `sidebar-category-${categoryKey}`;

  const handleCategoryToggle = () => {
    setIsOpen((previous) => !previous);
  };

  const handleItemSelect = (item) => {
    if (!item?.key) return;

    if (typeof onSelect === "function") {
      onSelect(item.key);
    }

    // Keep the submenu open after selecting a child.
    setIsOpen(true);
  };

  return (
    <div className="admin-sidebar-category">
      <button
        type="button"
        className={`admin-sidebar-category__trigger ${
          hasActiveChild ? "active" : ""
        }`}
        onClick={handleCategoryToggle}
        aria-expanded={expanded}
        aria-controls={submenuId}
      >
        <span className="admin-sidebar-category__label">
          <span
            className="admin-sidebar-category__icon"
            aria-hidden="true"
          >
            {categoryIcons[category?.icon] || "•"}
          </span>

          <span className="admin-sidebar-category__text">
            {category?.label || "Menu"}
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

      <div
        id={submenuId}
        className={`admin-sidebar-category__children ${
          expanded ? "open" : "closed"
        }`}
        hidden={!expanded}
      >
        {children.map((item) => {
          if (!item?.key) return null;

          const isActive = activeSection === item.key;

          return (
            <button
              type="button"
              key={item.key}
              className={`admin-sidebar-category__item ${
                isActive ? "active" : ""
              }`}
              onClick={() => handleItemSelect(item)}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className="admin-sidebar-category__dot"
                aria-hidden="true"
              >
                {isActive ? "●" : "○"}
              </span>

              <span className="admin-sidebar-category__item-text">
                {item.label || "Untitled"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

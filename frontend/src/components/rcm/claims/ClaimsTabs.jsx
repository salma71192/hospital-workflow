
import React from "react";

export const CLAIM_TABS = [
  {
    id: "create",
    tabId: "create-claim-tab",
    icon: "+",
    title: "Create New Claim",
    subtitle: "Register a patient claim",
  },
  {
    id: "upload",
    tabId: "upload-claims-tab",
    icon: "⇧",
    title: "Upload Claims",
    subtitle: "Import Excel data",
  },
  {
    id: "history",
    tabId: "claim-history-tab",
    icon: "☷",
    title: "Claim History",
    subtitle: "Review and track claims",
  },
  {
    id: "alerts",
    tabId: "renewal-alerts-tab",
    icon: "◷",
    title: "Renewal Alerts",
    subtitle: "Track scheduled renewals",
  },
];

export default function ClaimsTabs({
  activeTab,
  isEditMode = false,
  onSelectTab,
}) {
  return (
    <nav
      className="claim-management-tabs-card"
      aria-label="Claim management sections"
    >
      <div
        className="claim-tab-bar"
        role="tablist"
        aria-label="Claim sections"
      >
        {CLAIM_TABS.map((tab) => {
          const active = activeTab === tab.id;
          const editing = tab.id === "create" && isEditMode;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={tab.tabId}
              aria-controls="claim-management-panel"
              aria-selected={active}
              className={`claim-tab ${active ? "active" : ""}`}
              onClick={() => onSelectTab(tab.id)}
            >
              <span className="claim-tab-icon" aria-hidden="true">
                {editing ? "✎" : tab.icon}
              </span>

              <span className="claim-tab-label">
                <span>
                  {editing ? "Edit Claim" : tab.title}
                </span>
                <small>
                  {editing
                    ? "Update existing claim"
                    : tab.subtitle}
                </small>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

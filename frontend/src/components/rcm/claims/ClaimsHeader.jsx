
import React from "react";

export default function ClaimsHeader({
  isEditMode = false,
  onBack,
}) {
  return (
    <header className="claim-management-header">
      <div className="claim-management-header-content">
        <div className="claim-management-topline">
          <span className="claim-management-topline-dot" />
          Revenue Cycle Management
        </div>

        <h1>Claims Management</h1>

        <p>
          Manage patient claims, register new claim records,
          upload Excel spreadsheets, and review claim history
          and scheduled renewals from one organized workspace.
        </p>

        <div className="claim-management-header-bottom">
          <div className="claim-management-header-note">
            Patient claims · Submission tracking · Renewal reminders
          </div>

          <button
            type="button"
            className="claim-back-button"
            onClick={onBack}
          >
            <span aria-hidden="true">←</span>
            {isEditMode
              ? "Back to Claim History"
              : "Back to Previous Page"}
          </button>
        </div>
      </div>
    </header>
  );
}


import React from "react";

export default function ClaimsContentHeading({
  activeTab,
  isEditMode = false,
  isRenewalMode = false,
}) {
  const pageConfig = {
    create: {
      title: isEditMode
        ? "Edit Claim"
        : isRenewalMode
          ? "Renew Existing Claim"
          : "New Claim Registration",
      description: isEditMode
        ? "Update the selected claim record and save your changes."
        : isRenewalMode
          ? "Review the existing claim details before submitting its renewal."
          : "Select a patient and complete the claim information.",
      tag: isEditMode
        ? "✎ EDIT CLAIM"
        : isRenewalMode
          ? "↻ RENEW CLAIM"
          : "＋ CREATE CLAIM",
    },
    upload: {
      title: "Upload Claims",
      description:
        "Upload, preview, and import claim approval details from Excel.",
      tag: "⇧ UPLOAD CLAIMS",
    },
    history: {
      title: "Claim History",
      description: "Search and review existing claim records.",
      tag: "☷ CLAIM RECORDS",
    },
    alerts: {
      title: "Renewal Alerts",
      description:
        "Review scheduled renewals and search claims by Claim ID.",
      tag: "◷ RENEWAL ALERTS",
    },
  };

  const config = pageConfig[activeTab] || pageConfig.create;

  return (
    <div className="claim-management-content-heading">
      <div>
        <h2>{config.title}</h2>
        <p>{config.description}</p>
      </div>

      <span className="claim-management-section-tag">
        {config.tag}
      </span>
    </div>
  );
}

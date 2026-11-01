
import React from "react";

export default function EditClaimBar({
  claim,
  claimId,
  onCancel,
}) {
  const reference =
    claim?.claimId ??
    claim?.claim_id_value ??
    claim?.claim_number ??
    claim?.claim_id ??
    claimId;

  return (
    <div className="claim-edit-bar">
      <div className="claim-edit-bar-info">
        <strong>Editing Existing Claim</strong>
        <span>Claim ID: {String(reference ?? "")}</span>
      </div>

      <button
        type="button"
        className="claim-upload-button claim-upload-secondary"
        onClick={onCancel}
      >
        Cancel Editing
      </button>
    </div>
  );
}

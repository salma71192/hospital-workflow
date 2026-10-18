
import React from "react";
import RegistrationTrackerSection from "../assignments/RegistrationTrackerSection";

export default function ReceptionRegistrationTracker({
  activeSection,
  mode,
  onChangeMode,
  assignments,
  agents,
  therapists,
  filter,
  setFilter,
  onApplyFilters,
  target,
  onChangeTarget,
  onEditAssignment,
  onCancelAssignment,
  userRole,
  isAdmin,
  isReception,
  currentUserId,
}) {
  if (activeSection !== "tracker") {
    return null;
  }

  return (
    <RegistrationTrackerSection
      mode={mode}
      onChangeMode={onChangeMode}
      assignments={assignments}
      agents={agents}
      therapists={therapists}
      filter={filter}
      setFilter={setFilter}
      onApplyFilters={onApplyFilters}
      target={target}
      onChangeTarget={onChangeTarget}
      onEditAssignment={onEditAssignment}
      onCancelAssignment={onCancelAssignment}
      userRole={userRole}
      isAdmin={isAdmin}
      isReception={isReception}
      currentUserId={currentUserId}
    />
  );
}

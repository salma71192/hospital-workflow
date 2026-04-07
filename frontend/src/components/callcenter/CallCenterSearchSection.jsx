import React from "react";
import UnifiedPatientSearch from "../patients/UnifiedPatientSearch";

export default function CallCenterSearchSection({
  onSelectPatient,
  onRegisterNew,
}) {
  return (
    <UnifiedPatientSearch
      title="Search Patient"
      placeholder="Search by patient name or file number"
      actionLabel="Book Appointment"
      onSelectPatient={onSelectPatient}
      emptyText="Start typing to search patients."
      noResultsText="No patients found. Register a new patient if needed."
      onRegisterNew={onRegisterNew}
    />
  );
}
import React from "react";
import TodayAssignmentsList from "../assignments/TodayAssignmentsList";

export default function ReceptionTodaySection({ assignments = [] }) {
  return (
    <TodayAssignmentsList
      assignments={assignments}
      title="Today's Assigned Patients"
    />
  );
}
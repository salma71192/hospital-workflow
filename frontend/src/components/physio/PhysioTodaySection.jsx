import React from "react";
import AssignmentProgressCard from "../AssignmentProgressCard";
import DashboardMetricInput from "../common/DashboardMetricInput";
import DashboardStatsGrid from "../common/DashboardStatsGrid";
import TodayAssignmentsList from "../assignments/TodayAssignmentsList";

export default function PhysioTodaySection({
  today,
  assignments = [],
  dailyTarget,
  setDailyTarget,
}) {
  return (
    <>
      <DashboardMetricInput
        label="Daily Target"
        value={dailyTarget}
        onChange={setDailyTarget}
        placeholder="Daily target"
      />

      <DashboardStatsGrid
        stats={[
          {
            label: "Today's Assignments",
            value: assignments.length,
          },
          {
            label: "Daily Target",
            value: dailyTarget,
          },
          {
            label: "Remaining",
            value: Math.max(Number(dailyTarget) - assignments.length, 0),
          },
        ]}
      />

      <AssignmentProgressCard
        title="Today's Assignments"
        count={assignments.length}
        target={dailyTarget}
        subtitle={today}
      />

      <TodayAssignmentsList
        assignments={assignments}
        title="Today's Assigned Patients"
      />
    </>
  );
}
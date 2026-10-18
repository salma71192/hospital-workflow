
import React from "react";

import LeaderboardSection from "../common/LeaderboardSection";
import RegistrationStatsSection from "../assignments/RegistrationStatsSection";
import EvaluationTrackerSection from "../assignments/EvaluationTrackerSection";

export default function ReceptionReports({
  activeSection,
  stats,
  leaderboard,
  leaderboardLoading,
  leaderboardError,
  onReloadLeaderboard,
  user,
  actingAs,
}) {
  if (activeSection === "stats") {
    return (
      <RegistrationStatsSection stats={stats} />
    );
  }

  if (activeSection === "leaderboard") {
    return (
      <LeaderboardSection
        title="Reception Leaderboard"
        rows={leaderboard}
        loading={leaderboardLoading}
        error={leaderboardError}
        onReload={onReloadLeaderboard}
      />
    );
  }

  if (activeSection === "evaluation_tracker") {
    return (
      <EvaluationTrackerSection
        user={user}
        actingAs={actingAs}
      />
    );
  }

  return null;
}

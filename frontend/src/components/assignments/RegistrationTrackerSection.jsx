import React, { useMemo } from "react";
import RegistrationTrackerFilters from "./RegistrationTrackerFilters";
import RegistrationMixSection from "./RegistrationMixSection";
import RegistrationListSection from "./RegistrationListSection";

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function getPercent(value, total) {
  if (!total) return 0;
  return Math.round((Number(value || 0) / Number(total)) * 100);
}

export default function RegistrationTrackerSection({
  mode = "today",
  onChangeMode,
  assignments = [],
  agents = [],
  therapists = [],
  filter,
  setFilter,
  onApplyFilters,
  onEditAssignment,
  onCancelAssignment,
}) {
  const today = getTodayString();

  const title = useMemo(() => {
    return mode === "monthly"
      ? "Monthly Registration Tracker"
      : "Same Day Registration Tracker";
  }, [mode]);

  const subtitle = useMemo(() => {
    return mode === "monthly"
      ? "View monthly registrations using shared filters."
      : "View same day registrations using shared filters.";
  }, [mode]);

  const stats = useMemo(() => {
    const total = assignments.length;

    const walkIn = assignments.filter((a) => a.category === "walk_in").length;

    const appointment = assignments.filter(
      (a) =>
        a.category === "appointment" ||
        a.category === "has_appointment" ||
        a.category === "has appointments"
    ).length;

    const initialEval = assignments.filter(
      (a) =>
        a.category === "initial_eval" ||
        a.category === "initial_evaluation"
    ).length;

    const noEligibility = assignments.filter(
      (a) =>
        a.category === "task_without_eligibility" ||
        a.category === "no_eligibility"
    ).length;

    const other = Math.max(
      total - walkIn - appointment - initialEval - noEligibility,
      0
    );

    return {
      total,
      walkIn,
      appointment,
      initialEval,
      noEligibility,
      other,
      walkInPct: getPercent(walkIn, total),
      appointmentPct: getPercent(appointment, total),
      initialEvalPct: getPercent(initialEval, total),
      noEligibilityPct: getPercent(noEligibility, total),
      otherPct: getPercent(other, total),
    };
  }, [assignments]);

  return (
    <div style={styles.page}>
      <RegistrationTrackerFilters
        mode={mode}
        onChangeMode={onChangeMode}
        title={title}
        subtitle={subtitle}
        today={today}
        filter={filter}
        setFilter={setFilter}
        agents={agents}
        therapists={therapists}
        onApplyFilters={onApplyFilters}
      />

      <RegistrationMixSection stats={stats} />

      <RegistrationListSection
        assignments={assignments}
        onEditAssignment={onEditAssignment}
        onCancelAssignment={onCancelAssignment}
      />
    </div>
  );
}

const styles = {
  page: {
    display: "grid",
    gap: "16px",
  },
};
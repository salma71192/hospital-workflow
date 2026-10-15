import React, { useMemo } from "react";
import RegistrationTrackerFilters from "./RegistrationTrackerFilters";
import RegistrationMixSection from "./RegistrationMixSection";
import RegistrationListSection from "./RegistrationListSection";
function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function getTodayString() {
  return formatLocalDate(new Date());
}
function getPercent(value, total) {
  if (!total) return 0;
  return Math.round(
    (Number(value || 0) / Number(total)) * 100
  );
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
  const title = useMemo(
    () =>
      mode === "monthly"
        ? "Registration History"
        : "Today's Registrations",
    [mode]
  );
  const subtitle = useMemo(
    () =>
      mode === "monthly"
        ? "Review registrations for your selected date range."
        : "Review registrations recorded for the selected day.",
    [mode]
  );
  const stats = useMemo(() => {
    const total = assignments.length;
    const walkIn = assignments.filter(
      (assignment) => assignment.category === "walk_in"
    ).length;
    const appointment = assignments.filter((assignment) =>
      [
        "appointment",
        "has_appointment",
        "has appointments",
      ].includes(assignment.category)
    ).length;
    const initialEval = assignments.filter((assignment) =>
      [
        "initial_eval",
        "initial_evaluation",
      ].includes(assignment.category)
    ).length;
    const noEligibility = assignments.filter((assignment) =>
      [
        "task_without_eligibility",
        "no_eligibility",
      ].includes(assignment.category)
    ).length;
    return {
      total,
      walkIn,
      appointment,
      initialEval,
      noEligibility,
      walkInPct: getPercent(walkIn, total),
      appointmentPct: getPercent(appointment, total),
      initialEvalPct: getPercent(initialEval, total),
      noEligibilityPct: getPercent(noEligibility, total),
    };
  }, [assignments]);
  const dateSummary = useMemo(() => {
    if (mode === "today") {
      return filter?.date || today;
    }
    const fromDate = filter?.from_date || "";
    const toDate = filter?.to_date || "";
    if (fromDate && toDate) {
      return `${fromDate} to ${toDate}`;
    }
    if (fromDate) return `From ${fromDate}`;
    if (toDate) return `Until ${toDate}`;
    return "Select a date range";
  }, [mode, filter?.date, filter?.from_date, filter?.to_date, today]);
  return (
    <div style={styles.page}>
      <div style={styles.headerCard}>
        <div style={styles.headerText}>
          <span style={styles.eyebrow}>
            RECEPTION WORKSPACE
          </span>
          <h2 style={styles.heading}>{title}</h2>
          <p style={styles.subtitle}>{subtitle}</p>
        </div>
        <div style={styles.dateBadge}>
          <span style={styles.dateLabel}>Selected period</span>
          <strong style={styles.dateValue}>{dateSummary}</strong>
        </div>
      </div>
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
      <div style={styles.summaryCard}>
        <div>
          <div style={styles.summaryLabel}>
            Total Registrations
          </div>
          <div style={styles.summaryNumber}>
            {stats.total}
          </div>
        </div>
        <div style={styles.summaryDetails}>
          <div style={styles.summaryItem}>
            <span style={styles.dotBlue} />
            <span>Appointments</span>
            <strong>{stats.appointment}</strong>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.dotGreen} />
            <span>Walk-ins</span>
            <strong>{stats.walkIn}</strong>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.dotPurple} />
            <span>Initial evaluations</span>
            <strong>{stats.initialEval}</strong>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.dotOrange} />
            <span>Without eligibility</span>
            <strong>{stats.noEligibility}</strong>
          </div>
        </div>
      </div>
      {stats.total > 0 && (
        <RegistrationMixSection stats={stats} />
      )}
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
    width: "100%",
    minWidth: 0,
  },
  headerCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "16px",
    padding: "22px",
    background: "linear-gradient(135deg, #eff6ff, #ffffff)",
    border: "1px solid #dbeafe",
    borderRadius: "18px",
  },
  headerText: {
    display: "grid",
    gap: "5px",
  },
  eyebrow: {
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "0.08em",
    color: "#2563eb",
  },
  heading: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    margin: 0,
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#64748b",
  },
  dateBadge: {
    display: "grid",
    gap: "5px",
    minWidth: "180px",
    maxWidth: "100%",
    padding: "12px 15px",
    background: "#ffffff",
    border: "1px solid #dbeafe",
    borderRadius: "12px",
  },
  dateLabel: {
    color: "#64748b",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  dateValue: {
    color: "#1e3a8a",
    fontSize: "13px",
    overflowWrap: "anywhere",
  },
  summaryCard: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "22px",
    padding: "20px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.04)",
  },
  summaryLabel: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#64748b",
  },
  summaryNumber: {
    marginTop: "5px",
    fontSize: "36px",
    lineHeight: 1.2,
    fontWeight: "900",
    color: "#1e3a8a",
  },
  summaryDetails: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
    flex: "1 1 420px",
    gap: "12px",
  },
  summaryItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "11px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    color: "#475569",
    fontSize: "12px",
    fontWeight: "600",
  },
  dotBlue: {
    width: "8px",
    height: "8px",
    flexShrink: 0,
    borderRadius: "50%",
    background: "#2563eb",
  },
  dotGreen: {
    width: "8px",
    height: "8px",
    flexShrink: 0,
    borderRadius: "50%",
    background: "#16a34a",
  },
  dotPurple: {
    width: "8px",
    height: "8px",
    flexShrink: 0,
    borderRadius: "50%",
    background: "#9333ea",
  },
  dotOrange: {
    width: "8px",
    height: "8px",
    flexShrink: 0,
    borderRadius: "50%",
    background: "#ea580c",
  },
};
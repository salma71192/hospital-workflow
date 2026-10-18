
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

function normalizeRole(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function normalizeCategory(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
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
  userRole = "",
  isAdmin: adminProp = false,
  isReception: receptionProp = false,
  currentUserId,
}) {
  const today = getTodayString();
  const normalizedRole = normalizeRole(userRole);

  // Keep permission handling based on the existing props and role.
  const isAdmin =
    Boolean(adminProp) || normalizedRole === "admin";

  const isReception =
    Boolean(receptionProp) ||
    [
      "reception",
      "receptionist",
      "reception_supervisor",
    ].includes(normalizedRole);

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
    const safeAssignments = Array.isArray(assignments)
      ? assignments
      : [];

    const total = safeAssignments.length;

    const walkIn = safeAssignments.filter((assignment) =>
      ["walk_in"].includes(
        normalizeCategory(assignment.category)
      )
    ).length;

    const appointment = safeAssignments.filter((assignment) =>
      [
        "appointment",
        "has_appointment",
        "has_appointments",
      ].includes(normalizeCategory(assignment.category))
    ).length;

    const initialEval = safeAssignments.filter((assignment) =>
      [
        "initial_eval",
        "initial_evaluation",
      ].includes(normalizeCategory(assignment.category))
    ).length;

    const noEligibility = safeAssignments.filter((assignment) =>
      [
        "task_without_eligibility",
        "no_eligibility",
      ].includes(normalizeCategory(assignment.category))
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

    if (fromDate) {
      return `From ${fromDate}`;
    }

    if (toDate) {
      return `Until ${toDate}`;
    }

    return "Select a date range";
  }, [
    mode,
    filter?.date,
    filter?.from_date,
    filter?.to_date,
    today,
  ]);

  const statCards = [
    {
      key: "appointment",
      label: "Appointments",
      value: stats.appointment,
      percentage: stats.appointmentPct,
      icon: "📅",
      cardStyle: styles.statCardBlue,
      iconStyle: styles.statIconBlue,
      percentageStyle: styles.statPercentBlue,
      progressStyle: styles.progressBlue,
    },
    {
      key: "walkIn",
      label: "Walk-ins",
      value: stats.walkIn,
      percentage: stats.walkInPct,
      icon: "🚶",
      cardStyle: styles.statCardGreen,
      iconStyle: styles.statIconGreen,
      percentageStyle: styles.statPercentGreen,
      progressStyle: styles.progressGreen,
    },
    {
      key: "initialEval",
      label: "Initial Evaluations",
      value: stats.initialEval,
      percentage: stats.initialEvalPct,
      icon: "🩺",
      cardStyle: styles.statCardPurple,
      iconStyle: styles.statIconPurple,
      percentageStyle: styles.statPercentPurple,
      progressStyle: styles.progressPurple,
    },
    {
      key: "noEligibility",
      label: "Without Eligibility",
      value: stats.noEligibility,
      percentage: stats.noEligibilityPct,
      icon: "⚠️",
      cardStyle: styles.statCardOrange,
      iconStyle: styles.statIconOrange,
      percentageStyle: styles.statPercentOrange,
      progressStyle: styles.progressOrange,
    },
  ];

  return (
    <div style={styles.page}>
      {/* Page heading */}
      <section style={styles.headerCard}>
        <div style={styles.headerText}>
          <div style={styles.eyebrow}>
            🏥 RECEPTION WORKSPACE
          </div>

          <h2 style={styles.heading}>{title}</h2>

          <p style={styles.subtitle}>{subtitle}</p>
        </div>

        <div style={styles.dateBadge}>
          <div style={styles.dateBadgeIcon}>📅</div>

          <div style={styles.dateBadgeContent}>
            <span style={styles.dateLabel}>
              Selected Period
            </span>

            <strong style={styles.dateValue}>
              {dateSummary}
            </strong>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section style={styles.filtersCard}>
        <div style={styles.sectionHeading}>
          <div style={styles.sectionIcon}>🔎</div>

          <div style={styles.sectionHeadingText}>
            <h3 style={styles.sectionTitle}>
              Registration Filters
            </h3>

            <p style={styles.sectionDescription}>
              Find registrations using dates and staff filters.
            </p>
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
      </section>

      {/* Summary */}
      <section style={styles.summaryCard}>
        <div style={styles.summaryTop}>
          <div style={styles.summaryHeading}>
            <div style={styles.summaryEyebrow}>
              📊 REGISTRATION OVERVIEW
            </div>

            <h3 style={styles.summaryTitle}>
              Registration Summary
            </h3>

            <p style={styles.summarySubtitle}>
              An overview of registrations in the selected period.
            </p>
          </div>

          <div style={styles.totalCard}>
            <div style={styles.totalIcon}>📋</div>

            <div style={styles.totalContent}>
              <div style={styles.totalLabel}>
                Total Registrations
              </div>

              <div style={styles.totalNumber}>
                {stats.total}
              </div>
            </div>
          </div>
        </div>

        <div style={styles.summaryDetails}>
          {statCards.map((card) => (
            <div key={card.key} style={card.cardStyle}>
              <div style={styles.statCardHeader}>
                <div style={card.iconStyle}>
                  {card.icon}
                </div>

                <span style={card.percentageStyle}>
                  {card.percentage}%
                </span>
              </div>

              <div style={styles.statLabel}>
                {card.label}
              </div>

              <div style={styles.statNumber}>
                {card.value}
              </div>

              <div
                style={styles.progressTrack}
                aria-label={`${card.label}: ${card.percentage}%`}
              >
                <div
                  style={{
                    ...card.progressStyle,
                    width: `${card.percentage}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div style={styles.summaryFooter}>
          <span style={styles.footerIcon}>💙</span>

          <span>
            Use these figures to monitor registration activity
            and support a smooth reception workflow.
          </span>
        </div>
      </section>

      {/* Registration mix */}
      {stats.total > 0 && (
        <section style={styles.contentCard}>
          <div style={styles.sectionHeading}>
            <div style={styles.sectionIcon}>📈</div>

            <div style={styles.sectionHeadingText}>
              <h3 style={styles.sectionTitle}>
                Registration Mix
              </h3>

              <p style={styles.sectionDescription}>
                Review how registrations are distributed by category.
              </p>
            </div>
          </div>

          <RegistrationMixSection stats={stats} />
        </section>
      )}

      {/* Registration records */}
      <section style={styles.contentCard}>
        <div style={styles.sectionHeading}>
          <div style={styles.sectionIcon}>🗂️</div>

          <div style={styles.sectionHeadingText}>
            <h3 style={styles.sectionTitle}>
              Registration Records
            </h3>

            <p style={styles.sectionDescription}>
              {isAdmin
                ? "Administrators can manage all registration records."
                : isReception
                ? "All registrations are visible. Reception can manage only their own registrations created today."
                : "Available actions depend on your permissions."}
            </p>
          </div>
        </div>

        <RegistrationListSection
          assignments={assignments}
          onEditAssignment={onEditAssignment}
          onCancelAssignment={onCancelAssignment}
          userRole={normalizedRole}
          isAdmin={isAdmin}
          isReception={isReception}
          currentUserId={currentUserId}
          today={today}
        />
      </section>
    </div>
  );
}

const styles = {
  page: {
    display: "grid",
    gap: "22px",
    width: "100%",
    minWidth: 0,
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: "#0f172a",
    boxSizing: "border-box",
  },
  headerCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "22px",
    padding: "clamp(20px, 3vw, 30px)",
    background:
      "linear-gradient(135deg, #eff6ff 0%, #ffffff 58%, #f0fdfa 100%)",
    border: "1px solid #dbeafe",
    borderRadius: "24px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04)",
    boxSizing: "border-box",
    minWidth: 0,
  },
  headerText: {
    display: "grid",
    gap: "9px",
    flex: "1 1 280px",
    minWidth: 0,
  },
  eyebrow: {
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "1.5px",
    color: "#0d9488",
  },
  heading: {
    margin: 0,
    fontSize: "clamp(23px, 3vw, 30px)",
    lineHeight: 1.3,
    fontWeight: "800",
    letterSpacing: "-0.6px",
    color: "#0f172a",
    overflowWrap: "anywhere",
  },
  subtitle: {
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.8,
    color: "#64748b",
    fontWeight: "500",
  },
  dateBadge: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flex: "0 1 auto",
    minWidth: 0,
    maxWidth: "100%",
    padding: "15px 17px",
    background: "rgba(255, 255, 255, 0.92)",
    border: "1px solid #dbeafe",
    borderRadius: "16px",
    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.04)",
    boxSizing: "border-box",
  },
  dateBadgeIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "13px",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "21px",
    flexShrink: 0,
  },
  dateBadgeContent: {
    display: "grid",
    gap: "6px",
    minWidth: 0,
  },
  dateLabel: {
    color: "#64748b",
    fontSize: "10px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.7px",
  },
  dateValue: {
    color: "#1e3a8a",
    fontSize: "12px",
    lineHeight: 1.6,
    overflowWrap: "anywhere",
  },
  filtersCard: {
    display: "grid",
    gap: "20px",
    padding: "clamp(18px, 2.5vw, 26px)",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "22px",
    boxShadow: "0 8px 26px rgba(15, 23, 42, 0.035)",
    minWidth: 0,
    boxSizing: "border-box",
  },
  sectionHeading: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    marginBottom: "4px",
    minWidth: 0,
  },
  sectionHeadingText: {
    minWidth: 0,
  },
  sectionIcon: {
    width: "43px",
    height: "43px",
    borderRadius: "14px",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    flexShrink: 0,
  },
  sectionTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: 1.4,
  },
  sectionDescription: {
    margin: "4px 0 0",
    fontSize: "12px",
    lineHeight: 1.7,
    color: "#64748b",
  },
  summaryCard: {
    display: "grid",
    gap: "25px",
    padding: "clamp(18px, 2.5vw, 28px)",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.045)",
    minWidth: 0,
    boxSizing: "border-box",
  },
  summaryTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "18px",
    minWidth: 0,
  },
  summaryHeading: {
    flex: "1 1 240px",
    minWidth: 0,
  },
  summaryEyebrow: {
    marginBottom: "7px",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "1.3px",
    color: "#0d9488",
  },
  summaryTitle: {
    margin: 0,
    fontSize: "21px",
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: 1.4,
  },
  summarySubtitle: {
    margin: "5px 0 0",
    fontSize: "12px",
    color: "#64748b",
    lineHeight: 1.7,
  },
  totalCard: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    padding: "15px 18px",
    background:
      "linear-gradient(135deg, #eff6ff 0%, #f0fdfa 100%)",
    border: "1px solid #dbeafe",
    borderRadius: "17px",
    flex: "0 1 auto",
    minWidth: 0,
    boxSizing: "border-box",
  },
  totalIcon: {
    width: "45px",
    height: "45px",
    borderRadius: "14px",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    flexShrink: 0,
  },
  totalContent: {
    minWidth: 0,
  },
  totalLabel: {
    fontSize: "11px",
    color: "#64748b",
    fontWeight: "700",
  },
  totalNumber: {
    marginTop: "4px",
    fontSize: "29px",
    lineHeight: 1.2,
    fontWeight: "900",
    color: "#1e3a8a",
  },
  summaryDetails: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
    gap: "14px",
    minWidth: 0,
  },
  statCardBlue: {
    display: "grid",
    gap: "12px",
    padding: "18px",
    background: "#f5f9ff",
    border: "1px solid #dbeafe",
    borderRadius: "18px",
    minWidth: 0,
    boxSizing: "border-box",
  },
  statCardGreen: {
    display: "grid",
    gap: "12px",
    padding: "18px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "18px",
    minWidth: 0,
    boxSizing: "border-box",
  },
  statCardPurple: {
    display: "grid",
    gap: "12px",
    padding: "18px",
    background: "#faf5ff",
    border: "1px solid #e9d5ff",
    borderRadius: "18px",
    minWidth: 0,
    boxSizing: "border-box",
  },
  statCardOrange: {
    display: "grid",
    gap: "12px",
    padding: "18px",
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    borderRadius: "18px",
    minWidth: 0,
    boxSizing: "border-box",
  },
  statCardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
  },
  statIconBlue: {
    width: "39px",
    height: "39px",
    borderRadius: "12px",
    background: "#dbeafe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "19px",
    flexShrink: 0,
  },
  statIconGreen: {
    width: "39px",
    height: "39px",
    borderRadius: "12px",
    background: "#dcfce7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "19px",
    flexShrink: 0,
  },
  statIconPurple: {
    width: "39px",
    height: "39px",
    borderRadius: "12px",
    background: "#f3e8ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "19px",
    flexShrink: 0,
  },
  statIconOrange: {
    width: "39px",
    height: "39px",
    borderRadius: "12px",
    background: "#ffedd5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "19px",
    flexShrink: 0,
  },
  statPercentBlue: {
    fontSize: "11px",
    fontWeight: "800",
    color: "#2563eb",
  },
  statPercentGreen: {
    fontSize: "11px",
    fontWeight: "800",
    color: "#15803d",
  },
  statPercentPurple: {
    fontSize: "11px",
    fontWeight: "800",
    color: "#7e22ce",
  },
  statPercentOrange: {
    fontSize: "11px",
    fontWeight: "800",
    color: "#c2410c",
  },
  statLabel: {
    fontSize: "12px",
    fontWeight: "700",
    lineHeight: 1.5,
    color: "#475569",
    overflowWrap: "anywhere",
  },
  statNumber: {
    marginTop: "-5px",
    fontSize: "31px",
    lineHeight: 1.2,
    fontWeight: "900",
    color: "#0f172a",
  },
  progressTrack: {
    height: "5px",
    borderRadius: "999px",
    background: "rgba(148, 163, 184, 0.2)",
    overflow: "hidden",
    marginTop: "2px",
  },
  progressBlue: {
    height: "100%",
    borderRadius: "999px",
    background: "#2563eb",
    transition: "width 0.3s ease",
  },
  progressGreen: {
    height: "100%",
    borderRadius: "999px",
    background: "#16a34a",
    transition: "width 0.3s ease",
  },
  progressPurple: {
    height: "100%",
    borderRadius: "999px",
    background: "#9333ea",
    transition: "width 0.3s ease",
  },
  progressOrange: {
    height: "100%",
    borderRadius: "999px",
    background: "#ea580c",
    transition: "width 0.3s ease",
  },
  summaryFooter: {
    display: "flex",
    alignItems: "flex-start",
    gap: "9px",
    paddingTop: "17px",
    borderTop: "1px solid #e8edf3",
    color: "#64748b",
    fontSize: "12px",
    lineHeight: 1.8,
  },
  footerIcon: {
    flexShrink: 0,
  },
  contentCard: {
    display: "grid",
    gap: "20px",
    padding: "clamp(18px, 2.5vw, 26px)",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "22px",
    boxShadow: "0 8px 26px rgba(15, 23, 42, 0.035)",
    minWidth: 0,
    boxSizing: "border-box",
  },
};

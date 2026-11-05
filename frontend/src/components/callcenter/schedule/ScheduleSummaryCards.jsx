
import React from "react";

const SUMMARY_CARDS = [
  {
    key: "total",
    label: "Total Booked",
    filter: "all",
    color: "#172b4d",
    background: "#f1f5f9",
  },
  {
    key: "confirmed",
    label: "Confirmed",
    filter: "confirmed",
    color: "#166534",
    background: "#dcfce7",
  },
  {
    key: "unconfirmed",
    label: "Unconfirmed",
    filter: "unconfirmed",
    color: "#92400e",
    background: "#fef3c7",
  },
  {
    key: "no_answer",
    label: "No Answer",
    filter: "no_answer",
    color: "#9a3412",
    background: "#ffedd5",
  },
  {
    key: "phone_off",
    label: "Phone Off",
    filter: "phone_off",
    color: "#475569",
    background: "#e2e8f0",
  },
  {
    key: "cancelled",
    label: "Cancelled",
    filter: "cancelled",
    color: "#991b1b",
    background: "#fee2e2",
  },
  {
    key: "rescheduled",
    label: "Rescheduled",
    filter: "rescheduled",
    color: "#1d4ed8",
    background: "#dbeafe",
  },
  {
    key: "evaluations",
    label: "Evaluations",
    filter: "evaluation",
    color: "#7e22ce",
    background: "#f3e8ff",
  },
];

export default function ScheduleSummaryCards({
  totals = {},
  activeFilter = "all",
  onFilterChange,
}) {
  const handleCardClick = (filter) => {
    if (typeof onFilterChange !== "function") {
      return;
    }

    onFilterChange(
      activeFilter === filter ? "all" : filter
    );
  };

  return (
    <div
      className="csu-stats"
      aria-label="Appointment summary"
    >
      {SUMMARY_CARDS.map((card) => {
        const count = Number(totals[card.key] ?? 0);
        const isActive = activeFilter === card.filter;
        const clickable =
          typeof onFilterChange === "function";

        return (
          <button
            key={card.key}
            type="button"
            className={`csu-stat csu-stat-button ${
              isActive ? "csu-stat-active" : ""
            }`}
            onClick={() =>
              handleCardClick(card.filter)
            }
            disabled={!clickable}
            aria-pressed={
              clickable ? isActive : undefined
            }
            title={
              clickable
                ? `Filter appointments: ${card.label}`
                : card.label
            }
            style={{
              borderLeft: `4px solid ${card.color}`,
              background: isActive
                ? card.background
                : "#ffffff",
              cursor: clickable
                ? "pointer"
                : "default",
              opacity: 1,
              textAlign: "left",
              transition:
                "background 0.2s ease, transform 0.2s ease",
            }}
          >
            <span
              style={{
                color: isActive
                  ? card.color
                  : "#64748b",
                fontWeight: 700,
              }}
            >
              {card.label}
            </span>

            <strong
              style={{
                color: card.color,
                fontSize: 27,
              }}
            >
              {Number.isFinite(count)
                ? count
                : 0}
            </strong>

            {clickable && (
              <small
                style={{
                  display: "block",
                  marginTop: 7,
                  fontSize: 10,
                  color: "#64748b",
                }}
              >
                {isActive
                  ? "Selected"
                  : "Click to filter"}
              </small>
            )}
          </button>
        );
      })}
    </div>
  );
}

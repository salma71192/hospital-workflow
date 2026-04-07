import React from "react";

export default function BookingWeekStrip({
  weekDates = [],
  selectedDate,
  onSelectDate,
}) {
  const formatDayName = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        weekday: "short",
      });
    } catch {
      return dateString;
    }
  };

  const formatDayNumber = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        day: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatMonth = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        month: "short",
      });
    } catch {
      return "";
    }
  };

  if (!weekDates.length) {
    return (
      <div style={styles.emptyState}>
        No available dates.
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.eyebrow}>Week Schedule</div>
        <div style={styles.title}>Choose Day</div>
      </div>

      <div style={styles.grid}>
        {weekDates.map((date) => {
          const isActive = selectedDate === date;

          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelectDate(date)}
              style={{
                ...styles.dayButton,
                ...(isActive ? styles.dayButtonActive : {}),
              }}
            >
              <div
                style={{
                  ...styles.dayName,
                  ...(isActive ? styles.dayNameActive : {}),
                }}
              >
                {formatDayName(date)}
              </div>

              <div
                style={{
                  ...styles.dayNumber,
                  ...(isActive ? styles.dayNumberActive : {}),
                }}
              >
                {formatDayNumber(date)}
              </div>

              <div
                style={{
                  ...styles.monthText,
                  ...(isActive ? styles.monthTextActive : {}),
                }}
              >
                {formatMonth(date)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "22px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
    display: "grid",
    gap: "16px",
  },
  header: {
    display: "grid",
    gap: "6px",
  },
  eyebrow: {
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#be185d",
  },
  title: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#0f172a",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
    gap: "10px",
  },
  dayButton: {
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: "14px",
    padding: "14px 10px",
    cursor: "pointer",
    display: "grid",
    gap: "4px",
    justifyItems: "center",
    textAlign: "center",
  },
  dayButtonActive: {
    background: "#fdf2f8",
    borderColor: "#be185d",
  },
  dayName: {
    fontSize: "12px",
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  dayNameActive: {
    color: "#be185d",
  },
  dayNumber: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: 1,
  },
  dayNumberActive: {
    color: "#be185d",
  },
  monthText: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#94a3b8",
  },
  monthTextActive: {
    color: "#9d174d",
  },
  emptyState: {
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: "12px",
    padding: "14px",
  },
};
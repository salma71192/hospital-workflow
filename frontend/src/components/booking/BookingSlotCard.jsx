import React from "react";

export default function BookingSlotCard({
  slot,
  isSelected = false,
  isDisabled = false,
  onClick,
}) {
  const bookingsCount = Number(slot?.bookings_count || 0);
  const status = slot?.status || "available";

  const isPast = status === "past";
  const isBlocked = status === "blocked" || bookingsCount >= 2;
  const isBookedOnce = !isPast && !isBlocked && bookingsCount === 1;
  const isAvailable = !isPast && !isBlocked && bookingsCount === 0;

  const finalDisabled = isDisabled || isBlocked || isPast;

  const getLabel = () => {
    if (isPast) return "Past";
    if (isBlocked) return "Full";
    if (isBookedOnce) return "1 / 2 booked";
    return "Available";
  };

  return (
    <button
      type="button"
      onClick={() => !finalDisabled && onClick?.(slot.time)}
      disabled={finalDisabled}
      style={{
        ...styles.card,
        ...(isAvailable ? styles.available : {}),
        ...(isBookedOnce ? styles.bookedOnce : {}),
        ...(isBlocked ? styles.blocked : {}),
        ...(isPast ? styles.past : {}),
        ...(isSelected && !finalDisabled ? styles.selected : {}),
      }}
    >
      <div style={styles.time}>{slot?.time || "-"}</div>
      <div style={styles.label}>{getLabel()}</div>
    </button>
  );
}

const styles = {
  card: {
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "12px",
    display: "grid",
    gap: "6px",
    textAlign: "center",
    cursor: "pointer",
    background: "#fff",
    minHeight: "74px",
  },
  time: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#0f172a",
  },
  label: {
    fontSize: "12px",
    fontWeight: "700",
  },
  available: {
    background: "#f0fdf4",
    borderColor: "#86efac",
    color: "#166534",
  },
  bookedOnce: {
    background: "#fffbeb",
    borderColor: "#fcd34d",
    color: "#92400e",
  },
  blocked: {
    background: "#f1f5f9",
    borderColor: "#cbd5e1",
    color: "#64748b",
    cursor: "not-allowed",
  },
  past: {
    background: "#e2e8f0",
    borderColor: "#94a3b8",
    color: "#475569",
    cursor: "not-allowed",
    opacity: 0.7,
  },
  selected: {
    outline: "2px solid #be185d",
    outlineOffset: "1px",
  },
};
import React, { useMemo } from "react";
import BookingSlotCard from "./BookingSlotCard";

export default function BookingSlotsBoard({
  slots = [],
  selectedTime = "",
  onSelectSlot,
}) {
  const { morningSlots, afternoonSlots, nightSlots, hasAnySlots } = useMemo(() => {
    const safeSlots = Array.isArray(slots) ? slots : [];

    const morningSlots = safeSlots.filter(
      (slot) => slot.time >= "08:00" && slot.time < "12:00"
    );

    const afternoonSlots = safeSlots.filter(
      (slot) => slot.time >= "12:00" && slot.time < "18:00"
    );

    const nightSlots = safeSlots.filter(
      (slot) => slot.time >= "18:00" && slot.time <= "22:00"
    );

    return {
      morningSlots,
      afternoonSlots,
      nightSlots,
      hasAnySlots:
        morningSlots.length > 0 ||
        afternoonSlots.length > 0 ||
        nightSlots.length > 0,
    };
  }, [slots]);

  if (!hasAnySlots) {
    return (
      <div style={styles.emptyState}>
        No slots available for the selected date.
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {morningSlots.length > 0 ? (
        <SlotSection
          title="Morning"
          slots={morningSlots}
          selectedTime={selectedTime}
          onSelectSlot={onSelectSlot}
        />
      ) : null}

      {afternoonSlots.length > 0 ? (
        <SlotSection
          title="Afternoon"
          slots={afternoonSlots}
          selectedTime={selectedTime}
          onSelectSlot={onSelectSlot}
        />
      ) : null}

      {nightSlots.length > 0 ? (
        <SlotSection
          title="Night"
          slots={nightSlots}
          selectedTime={selectedTime}
          onSelectSlot={onSelectSlot}
        />
      ) : null}
    </div>
  );
}

function SlotSection({ title, slots, selectedTime, onSelectSlot }) {
  const availableCount = useMemo(() => {
    return slots.filter(
      (slot) => slot.status !== "blocked" && slot.status !== "past"
    ).length;
  }, [slots]);

  return (
    <div style={styles.sectionCard}>
      <div style={styles.sectionHeader}>
        <div style={styles.sectionTitle}>{title}</div>
        <div style={styles.sectionMeta}>
          {availableCount} available / {slots.length}
        </div>
      </div>

      <div style={styles.grid}>
        {slots.map((slot) => {
          const isDisabled =
            slot.status === "blocked" || slot.status === "past";

          return (
            <BookingSlotCard
              key={slot.time}
              slot={slot}
              isSelected={selectedTime === slot.time}
              isDisabled={isDisabled}
              onClick={(time) => {
                if (isDisabled) return;
                onSelectSlot?.(time);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "grid",
    gap: "16px",
  },
  sectionCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "22px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
    display: "grid",
    gap: "14px",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a",
  },
  sectionMeta: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "999px",
    padding: "6px 10px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
    gap: "10px",
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
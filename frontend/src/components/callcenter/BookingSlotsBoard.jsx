import React, { useMemo } from "react";
import BookingSlotCard from "./BookingSlotCard";

export default function BookingSlotsBoard({
  slots = [],
  selectedTime = "",
  onSelectSlot,
}) {
  const { morningSlots, afternoonSlots, nightSlots } = useMemo(() => {
    const safeSlots = Array.isArray(slots) ? slots : [];

    return {
      morningSlots: safeSlots.filter(
        (slot) => slot.time >= "08:00" && slot.time < "12:00"
      ),
      afternoonSlots: safeSlots.filter(
        (slot) => slot.time >= "12:00" && slot.time < "18:00"
      ),
      nightSlots: safeSlots.filter(
        (slot) => slot.time >= "18:00" && slot.time <= "22:00"
      ),
    };
  }, [slots]);

  return (
    <div style={styles.page}>
      <SlotSection
        title="Morning"
        slots={morningSlots}
        selectedTime={selectedTime}
        onSelectSlot={onSelectSlot}
      />

      <SlotSection
        title="Afternoon"
        slots={afternoonSlots}
        selectedTime={selectedTime}
        onSelectSlot={onSelectSlot}
      />

      <SlotSection
        title="Night"
        slots={nightSlots}
        selectedTime={selectedTime}
        onSelectSlot={onSelectSlot}
      />
    </div>
  );
}

function SlotSection({ title, slots, selectedTime, onSelectSlot }) {
  return (
    <div style={styles.sectionCard}>
      <div style={styles.sectionHeader}>
        <div style={styles.sectionTitle}>{title}</div>
      </div>

      {slots.length === 0 ? (
        <div style={styles.emptyState}>No slots available.</div>
      ) : (
        <div style={styles.grid}>
          {slots.map((slot) => (
            <BookingSlotCard
              key={slot.time}
              slot={slot}
              isSelected={selectedTime === slot.time}
              onClick={onSelectSlot}
            />
          ))}
        </div>
      )}
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
export function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

export function getMonthString() {
  return new Date().toISOString().slice(0, 7);
}

export function getWeekDates(startDate = new Date()) {
  const days = [];
  const base = new Date(startDate);

  for (let i = 0; i < 7; i += 1) {
    const next = new Date(base);
    next.setDate(base.getDate() + i);
    days.push(next.toISOString().split("T")[0]);
  }

  return days;
}

export function generateTimeSlots() {
  const slots = [];

  for (let hour = 8; hour < 22; hour += 1) {
    slots.push(`${String(hour).padStart(2, "0")}:00`);
    slots.push(`${String(hour).padStart(2, "0")}:30`);
  }

  slots.push("22:00");
  return slots;
}
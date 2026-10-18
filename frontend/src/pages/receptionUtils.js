
export function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getTodayString() {
  return formatLocalDate(new Date());
}

export function getFirstDayOfMonthString() {
  const now = new Date();

  return formatLocalDate(
    new Date(now.getFullYear(), now.getMonth(), 1)
  );
}

export function getLastDayOfMonthString() {
  const now = new Date();

  return formatLocalDate(
    new Date(now.getFullYear(), now.getMonth() + 1, 0)
  );
}

export function normalizeRole(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export function isAdminUser(account) {
  const role = normalizeRole(account?.role);

  return role === "admin" || Boolean(account?.is_superuser);
}

export function isReceptionUser(account) {
  const role = normalizeRole(account?.role);

  return [
    "reception",
    "receptionist",
    "reception_supervisor",
  ].includes(role);
}

export function getApiError(err, fallback) {
  const data = err?.response?.data;

  if (typeof data?.error === "string") return data.error;
  if (typeof data?.detail === "string") return data.detail;
  if (typeof data === "string") return data;

  if (data && typeof data === "object") {
    return (
      Object.entries(data)
        .map(([field, value]) => {
          const detail = Array.isArray(value)
            ? value.join(", ")
            : typeof value === "string"
            ? value
            : JSON.stringify(value);

          return `${field}: ${detail}`;
        })
        .join(" | ") || fallback
    );
  }

  if (err?.message) return `${fallback}: ${err.message}`;

  return fallback;
}

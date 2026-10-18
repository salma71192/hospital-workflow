
export function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

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
  if (!account) return false;

  const role = normalizeRole(account.role);

  return role === "admin" || Boolean(account.is_superuser);
}

export function isReceptionUser(account) {
  if (!account) return false;

  const role = normalizeRole(account.role);

  return [
    "reception",
    "receptionist",
    "reception_supervisor",
  ].includes(role);
}

export function getApiError(
  err,
  fallback = "Something went wrong."
) {
  const data = err?.response?.data;

  if (typeof data === "string") return data;

  if (data?.detail) return data.detail;
  if (data?.error) return data.error;
  if (data?.message) return data.message;

  if (data && typeof data === "object") {
    for (const value of Object.values(data)) {
      if (Array.isArray(value) && value.length > 0) {
        return String(value[0]);
      }

      if (typeof value === "string") {
        return value;
      }
    }
  }

  return err?.message || fallback;
}

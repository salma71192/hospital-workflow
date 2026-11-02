
import api from "./api";

/**
 * Shared API functions for the therapist patient tracker.
 *
 * Used by:
 * - Call Center
 * - Rehab Manager
 * - CEO
 */

export async function loadTherapistTracker({
  therapistId,
  month,
}) {
  if (!therapistId) {
    throw new Error("Please select a therapist.");
  }

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || "")) {
    throw new Error("Please select a valid reporting month.");
  }

  const response = await api.get("patients/tracker/", {
    params: {
      month,
      therapist_id: therapistId,
    },
  });

  const data = response.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.patients)) return data.patients;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.rows)) return data.rows;

  throw new Error(
    "Unexpected response from the patient tracker API."
  );
}

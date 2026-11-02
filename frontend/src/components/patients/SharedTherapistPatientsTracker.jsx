
import React, { useCallback, useEffect, useMemo, useState } from "react";
import PatientTrackerTable from "./PatientTrackerTable";

/**
 * Shared tracker for:
 * - Call Center
 * - Rehab Manager
 * - CEO
 *
 * Props:
 * therapists: array of therapists
 * loadTracker: async ({ therapistId, month }) => patient records
 * role: "callcenter" | "rehab_manager" | "ceo"
 *
 * This component does not assume any backend endpoint.
 */

function getTherapistId(therapist) {
  return therapist.id ?? therapist.user_id ?? therapist.user?.id;
}

function getTherapistName(therapist) {
  const fullName =
    therapist.name ||
    therapist.full_name ||
    therapist.user?.full_name ||
    [
      therapist.first_name ?? therapist.user?.first_name,
      therapist.last_name ?? therapist.user?.last_name,
    ]
      .filter(Boolean)
      .join(" ");

  return (
    fullName ||
    therapist.username ||
    therapist.user?.username ||
    `Therapist ${getTherapistId(therapist)}`
  );
}

function getCurrentMonth() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
  ].join("-");
}

function extractPatients(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.patients)) return result.patients;
  if (Array.isArray(result?.results)) return result.results;

  throw new Error("The tracker API did not return a patient list.");
}

export default function SharedTherapistPatientsTracker({
  therapists = [],
  loadTracker,
  role = "callcenter",
}) {
  const [selectedTherapistId, setSelectedTherapistId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const therapistOptions = useMemo(() => {
    return therapists
      .filter((therapist) => getTherapistId(therapist) != null)
      .map((therapist) => ({
        id: String(getTherapistId(therapist)),
        name: getTherapistName(therapist),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [therapists]);

  const selectedTherapist = therapistOptions.find(
    (therapist) => therapist.id === selectedTherapistId
  );

  const refreshTracker = useCallback(() => {
    setRefreshKey((previous) => previous + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!selectedTherapistId || !selectedMonth) {
      setPatients([]);
      setError("");
      setLoading(false);
      return;
    }

    async function fetchPatients() {
      setLoading(true);
      setError("");
      setPatients([]);

      try {
        if (typeof loadTracker !== "function") {
          throw new Error("Tracker data loader is not configured.");
        }

        const result = await loadTracker({
          therapistId: selectedTherapistId,
          month: selectedMonth,
        });

        if (!cancelled) {
          setPatients(extractPatients(result));
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.error ||
              err?.message ||
              "Unable to load patient records."
          );
          setPatients([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPatients();

    return () => {
      cancelled = true;
    };
  }, [selectedTherapistId, selectedMonth, loadTracker, refreshKey]);

  const roleLabels = {
    callcenter: "Call Center",
    rehab_manager: "Rehab Manager",
    ceo: "CEO",
  };

  const monthLabel = selectedMonth
    ? new Date(`${selectedMonth}-01T12:00:00`).toLocaleDateString(
        "en-GB",
        {
          month: "long",
          year: "numeric",
        }
      )
    : "";

  return (
    <div style={styles.page}>
      <section style={styles.selectorCard}>
        <div style={styles.header}>
          <div>
            <span style={styles.eyebrow}>
              {roleLabels[role] || "Management"} Workspace
            </span>

            <h1 style={styles.title}>Patients Tracker</h1>

            <p style={styles.subtitle}>
              Select a therapist and reporting month to review
              patient activity and treatment utilization.
            </p>
          </div>

          <span style={styles.headerBadge}>
            Monthly Patient Monitoring
          </span>
        </div>

        <div style={styles.filterGrid}>
          <label style={styles.field}>
            <span style={styles.label}>SELECT THERAPIST</span>

            <select
              style={styles.input}
              value={selectedTherapistId}
              onChange={(event) =>
                setSelectedTherapistId(event.target.value)
              }
            >
              <option value="">Choose therapist...</option>

              {therapistOptions.map((therapist) => (
                <option key={therapist.id} value={therapist.id}>
                  {therapist.name}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.field}>
            <span style={styles.label}>REPORTING MONTH</span>

            <input
              type="month"
              style={styles.input}
              value={selectedMonth}
              onChange={(event) =>
                setSelectedMonth(event.target.value)
              }
            />
          </label>

          <button
            type="button"
            style={styles.refreshButton}
            disabled={!selectedTherapistId || loading}
            onClick={refreshTracker}
          >
            {loading ? "Loading..." : "↻ Refresh"}
          </button>
        </div>

        {selectedTherapist && (
          <div style={styles.selectionInfo}>
            <strong>{selectedTherapist.name}</strong>
            <span>·</span>
            <span>{monthLabel}</span>
            <span>·</span>
            <span>
              {loading ? "Loading records..." : `${patients.length} patients`}
            </span>
          </div>
        )}
      </section>

      {error && (
        <div role="alert" style={styles.error}>
          {error}
        </div>
      )}

      {!selectedTherapistId ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>♧</div>

          <h2 style={styles.emptyTitle}>Select a Therapist</h2>

          <p style={styles.emptyText}>
            Choose a therapist above to display their patient
            tracker for the selected month.
          </p>
        </div>
      ) : loading ? (
        <div style={styles.emptyState} role="status">
          <h2 style={styles.emptyTitle}>Loading Patient Tracker</h2>
          <p style={styles.emptyText}>
            Retrieving monthly patient records...
          </p>
        </div>
      ) : error ? null : (
        <PatientTrackerTable
          key={`${selectedTherapistId}-${selectedMonth}`}
          patients={patients}
          title={`${selectedTherapist?.name || "Therapist"} — Patient Tracker`}
          selectedMonth={selectedMonth}
          monthLabel={monthLabel}
          onMonthChange={setSelectedMonth}
          onRefresh={refreshTracker}
          readOnly
        />
      )}
    </div>
  );
}

const styles = {
  page: {
    display: "grid",
    gap: 22,
    width: "100%",
    minWidth: 0,
    fontFamily: "Inter, Arial, sans-serif",
  },
  selectorCard: {
    padding: "clamp(18px, 3vw, 28px)",
    background: "#fff",
    border: "1px solid #dce6f2",
    borderRadius: 18,
    display: "grid",
    gap: 24,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },
  eyebrow: {
    color: "#7435db",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    margin: "10px 0",
    color: "#17365d",
    fontSize: 27,
    fontWeight: 850,
  },
  subtitle: {
    margin: 0,
    color: "#7185a3",
    fontSize: 13,
    lineHeight: 1.7,
  },
  headerBadge: {
    padding: "10px 14px",
    background: "#f7f1ff",
    color: "#7435db",
    borderRadius: 24,
    fontSize: 11,
    fontWeight: 800,
  },
  filterGrid: {
    display: "flex",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: 15,
  },
  field: {
    flex: "1 1 220px",
    display: "grid",
    gap: 9,
  },
  label: {
    fontSize: 11,
    fontWeight: 800,
    color: "#243b5a",
    letterSpacing: 0.5,
  },
  input: {
    width: "100%",
    minHeight: 46,
    padding: "10px 13px",
    border: "1px solid #dce6f2",
    borderRadius: 11,
    background: "#f8fbff",
    color: "#17365d",
    fontSize: 13,
    boxSizing: "border-box",
  },
  refreshButton: {
    minHeight: 46,
    padding: "11px 20px",
    background: "#17365d",
    color: "#fff",
    border: 0,
    borderRadius: 11,
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },
  selectionInfo: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
    padding: "13px 16px",
    borderRadius: 11,
    background: "#eff6ff",
    color: "#17365d",
    fontSize: 12,
  },
  error: {
    padding: 16,
    borderRadius: 12,
    background: "#fff1f2",
    color: "#b91c1c",
    border: "1px solid #fecdd3",
  },
  emptyState: {
    display: "grid",
    justifyItems: "center",
    gap: 12,
    padding: "65px 20px",
    border: "1px dashed #dce6f2",
    borderRadius: 18,
    background: "#fff",
    textAlign: "center",
  },
  emptyIcon: {
    fontSize: 38,
    color: "#3268f5",
  },
  emptyTitle: {
    margin: 0,
    color: "#17365d",
    fontSize: 19,
  },
  emptyText: {
    margin: 0,
    maxWidth: 450,
    color: "#7185a3",
    fontSize: 13,
    lineHeight: 1.7,
  },
};

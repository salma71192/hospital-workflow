
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import api from "../api/api";
import PatientTrackerTable from "../components/patients/PatientTrackerTable";

/* =========================================================
   HELPERS
========================================================= */

function getCurrentMonth() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
  ].join("-");
}

function getErrorMessage(error, fallback) {
  const data = error?.response?.data;

  const message =
    data?.error ||
    data?.detail ||
    data?.message;

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  if (error?.message && !error?.response) {
    return error.message;
  }

  if (error?.response?.status === 403) {
    return (
      "You do not have permission to view this " +
      "physiotherapist's Patient Tracker."
    );
  }

  if (error?.response?.status === 401) {
    return "Your session has expired. Please log in again.";
  }

  if (error?.response?.status === 404) {
    return "The requested API endpoint was not found.";
  }

  return fallback;
}

function getTherapistId(therapist) {
  return (
    therapist?.id ??
    therapist?.user_id ??
    therapist?.user?.id ??
    null
  );
}

function getTherapistName(therapist) {
  if (!therapist) return "Unknown Therapist";

  const fullName = [
    therapist.first_name,
    therapist.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const nestedFullName = [
    therapist.user?.first_name,
    therapist.user?.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    fullName ||
    therapist.full_name ||
    therapist.name ||
    therapist.display_name ||
    nestedFullName ||
    therapist.username ||
    therapist.user?.username ||
    `Therapist ${getTherapistId(therapist) || ""}`
  );
}

function normalizeTherapists(data) {
  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data?.therapists)
        ? data.therapists
        : Array.isArray(data?.users)
          ? data.users
          : Array.isArray(data?.data)
            ? data.data
            : [];

  const uniqueTherapists = new Map();

  items.forEach((item) => {
    if (!item || typeof item !== "object") return;

    const therapistId = getTherapistId(item);

    if (
      therapistId === null ||
      therapistId === undefined ||
      therapistId === ""
    ) {
      return;
    }

    uniqueTherapists.set(String(therapistId), {
      ...item,
      id: therapistId,
    });
  });

  return Array.from(uniqueTherapists.values()).sort(
    (a, b) =>
      getTherapistName(a).localeCompare(
        getTherapistName(b)
      )
  );
}

function normalizeTrackerPatients(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.patients)) return data.patients;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.data)) return data.data;

  throw new Error(
    "The Patient Tracker API returned an unexpected response format."
  );
}

function getMonthLabel(selectedMonth) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(selectedMonth || "")) {
    return "";
  }

  const [year, month] = selectedMonth.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString(
    "en-GB",
    {
      month: "long",
      year: "numeric",
    }
  );
}

/* =========================================================
   ICONS
========================================================= */

function Icon({
  name,
  size = 20,
  color = "currentColor",
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      display: "block",
      flexShrink: 0,
    },
    "aria-hidden": true,
  };

  switch (name) {
    case "users":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );

    case "clipboard":
      return (
        <svg {...common}>
          <rect x="5" y="4" width="14" height="17" rx="2" />
          <path d="M9 4.5h6" />
          <path d="M9 10h6M9 14h6M9 18h4" />
        </svg>
      );

    case "refresh":
      return (
        <svg {...common}>
          <path d="M20 7v5h-5" />
          <path d="M4 17v-5h5" />
          <path d="M5.8 9A7 7 0 0 1 18 7l2 5" />
          <path d="M18.2 15A7 7 0 0 1 6 17l-2-5" />
        </svg>
      );

    case "arrow-left":
      return (
        <svg {...common}>
          <path d="M19 12H5" />
          <path d="m12 19-7-7 7-7" />
        </svg>
      );

    case "lock":
      return (
        <svg {...common}>
          <rect x="5" y="10" width="14" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      );

    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18" />
        </svg>
      );

    case "chevron-down":
      return (
        <svg {...common}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      );

    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "logout":
      return (
        <svg {...common}>
          <path d="M10 17l5-5-5-5" />
          <path d="M15 12H3" />
          <path d="M12 3h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-6" />
        </svg>
      );

    default:
      return null;
  }
}

/* =========================================================
   CALL CENTER PATIENT TRACKER
========================================================= */

export default function CallCenterPatientsTracker({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();

  // Month is controlled by the selector INSIDE
  // PatientTrackerTable, not by a second page-level input.
  const [selectedMonth, setSelectedMonth] = useState(
    getCurrentMonth
  );

  const [therapists, setTherapists] = useState([]);

  const [
    selectedTherapistId,
    setSelectedTherapistId,
  ] = useState("");

  const [patients, setPatients] = useState([]);

  const [
    loadingTherapists,
    setLoadingTherapists,
  ] = useState(true);

  const [
    loadingPatients,
    setLoadingPatients,
  ] = useState(false);

  const [therapistError, setTherapistError] = useState("");
  const [trackerError, setTrackerError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  /* =========================================================
     LOAD PHYSIOTHERAPISTS
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadTherapists() {
      setLoadingTherapists(true);
      setTherapistError("");

      try {
        const response = await api.get(
          "callcenter/therapists/"
        );

        if (cancelled) return;

        const therapistList = normalizeTherapists(
          response.data
        );

        setTherapists(therapistList);

        if (therapistList.length === 0) {
          setTherapistError(
            "No physiotherapists were returned by the " +
            "Call Center therapist API."
          );
        }
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Failed to load physiotherapists:",
          error
        );

        setTherapistError(
          getErrorMessage(
            error,
            "Unable to load physiotherapists. Please try again."
          )
        );

        setTherapists([]);
      } finally {
        if (!cancelled) {
          setLoadingTherapists(false);
        }
      }
    }

    loadTherapists();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =========================================================
     SELECTED THERAPIST
  ========================================================= */

  const selectedTherapist = useMemo(
    () =>
      therapists.find(
        (item) =>
          String(item.id) === String(selectedTherapistId)
      ) || null,
    [therapists, selectedTherapistId]
  );

  const monthLabel = useMemo(
    () => getMonthLabel(selectedMonth),
    [selectedMonth]
  );

  /* =========================================================
     LOAD SELECTED THERAPIST TRACKER
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadPatients() {
      setPatients([]);
      setTrackerError("");

      if (!selectedTherapistId) {
        setLoadingPatients(false);
        return;
      }

      if (
        !/^\d{4}-(0[1-9]|1[0-2])$/.test(
          selectedMonth || ""
        )
      ) {
        setLoadingPatients(false);
        setTrackerError(
          "Please select a valid reporting month."
        );
        return;
      }

      setLoadingPatients(true);

      try {
        const response = await api.get(
          "patients/tracker/",
          {
            params: {
              month: selectedMonth,
              therapist_id: selectedTherapistId,
            },
          }
        );

        if (cancelled) return;

        const data = response.data;

        const responseTherapistId =
          data && !Array.isArray(data)
            ? (
                data.therapist_id ??
                data.selected_therapist_id
              )
            : null;

        if (
          responseTherapistId !== null &&
          responseTherapistId !== undefined &&
          String(responseTherapistId) !==
            String(selectedTherapistId)
        ) {
          throw new Error(
            "The server returned data for a different physiotherapist."
          );
        }

        setPatients(
          normalizeTrackerPatients(data)
        );
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Failed to load Patient Tracker:",
          error
        );

        setPatients([]);

        setTrackerError(
          getErrorMessage(
            error,
            "Unable to load the selected physiotherapist's Patient Tracker."
          )
        );
      } finally {
        if (!cancelled) {
          setLoadingPatients(false);
        }
      }
    }

    loadPatients();

    return () => {
      cancelled = true;
    };
  }, [
    selectedTherapistId,
    selectedMonth,
    refreshKey,
  ]);

  /* =========================================================
     ACTIONS
  ========================================================= */

  const handleRefresh = useCallback(() => {
    setRefreshKey((previous) => previous + 1);
  }, []);

  const handleTherapistChange = (event) => {
    setSelectedTherapistId(event.target.value);
    setPatients([]);
    setTrackerError("");
  };

  const handleMonthChange = useCallback((month) => {
    setSelectedMonth(month);
    setPatients([]);
    setTrackerError("");
  }, []);

  const handleBack = () => {
    navigate("/callcenter");
  };

  const handleBackToAdmin = () => {
    onStopImpersonation?.();
    navigate("/admin");
  };

  const selectedTherapistName = selectedTherapist
    ? getTherapistName(selectedTherapist)
    : "";

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* ADMIN IMPERSONATION */}

        {actingAs && (
          <div style={styles.impersonation}>
            <div>
              <strong>Administrator Preview</strong>

              <p style={{ margin: "5px 0 0" }}>
                Viewing as {actingAs.username}
              </p>
            </div>

            <button
              type="button"
              onClick={handleBackToAdmin}
              style={styles.adminButton}
            >
              Back to Admin
            </button>
          </div>
        )}

        {/* PREMIUM PAGE HEADER */}

        <header style={styles.hero}>
          <div style={styles.heroTop}>
            <button
              type="button"
              onClick={handleBack}
              style={styles.heroBackButton}
            >
              <Icon name="arrow-left" size={16} />
              Back to Call Center
            </button>

            <button
              type="button"
              onClick={onLogout}
              style={styles.heroLogoutButton}
            >
              <Icon name="logout" size={16} />
              Logout
            </button>
          </div>

          <div style={styles.heroContent}>
            <div style={styles.heroIcon}>
              <Icon
                name="clipboard"
                size={27}
                color="#ffffff"
              />
            </div>

            <div style={styles.heroText}>
              <div style={styles.heroEyebrow}>
                CALL CENTER WORKSPACE
              </div>

              <h1 style={styles.heroTitle}>
                Patients Tracker
              </h1>

              <p style={styles.heroSubtitle}>
                Access physiotherapist patient records,
                monthly utilization, and activity status
                in one organized workspace.
              </p>
            </div>
          </div>

          <div style={styles.heroFooter}>
            <span style={styles.heroFooterItem}>
              <Icon name="users" size={15} />
              Physiotherapy Department
            </span>

            <span style={styles.heroFooterDivider} />

            <span style={styles.heroFooterItem}>
              <Icon name="lock" size={14} />
              Read-only access
            </span>
          </div>
        </header>

        {/* THERAPIST SELECTOR */}

        <section style={styles.selectorCard}>
          <div style={styles.selectorTop}>
            <div style={styles.selectorHeadingRow}>
              <div style={styles.selectorIcon}>
                <Icon
                  name="users"
                  size={21}
                  color="#2563eb"
                />
              </div>

              <div>
                <h2 style={styles.selectorTitle}>
                  Physiotherapist Selection
                </h2>

                <p style={styles.selectorDescription}>
                  Choose a physiotherapist to open their
                  individual Patient Tracker.
                </p>
              </div>
            </div>

            <span style={styles.therapistCount}>
              {therapists.length} Physiotherapists
            </span>
          </div>

          <div style={styles.selectorControls}>
            <label style={styles.field}>
              <span style={styles.label}>
                SELECT PHYSIOTHERAPIST
              </span>

              <div style={styles.selectWrapper}>
                <select
                  value={selectedTherapistId}
                  onChange={handleTherapistChange}
                  disabled={loadingTherapists}
                  style={styles.select}
                  aria-label="Select physiotherapist"
                >
                  <option value="">
                    {loadingTherapists
                      ? "Loading physiotherapists..."
                      : "Choose a physiotherapist"}
                  </option>

                  {therapists.map((therapist) => (
                    <option
                      key={therapist.id}
                      value={String(therapist.id)}
                    >
                      {getTherapistName(therapist)}
                    </option>
                  ))}
                </select>

                <span style={styles.selectChevron}>
                  <Icon
                    name="chevron-down"
                    size={17}
                    color="#64748b"
                  />
                </span>
              </div>
            </label>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={
                !selectedTherapistId ||
                loadingPatients
              }
              style={{
                ...styles.refreshButton,
                opacity:
                  !selectedTherapistId ||
                  loadingPatients
                    ? 0.55
                    : 1,
                cursor:
                  !selectedTherapistId ||
                  loadingPatients
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              <Icon
                name="refresh"
                size={17}
                color="#ffffff"
              />

              {loadingPatients
                ? "Loading..."
                : "Refresh Tracker"}
            </button>
          </div>

          {therapistError && (
            <div role="alert" style={styles.error}>
              {therapistError}
            </div>
          )}

          {trackerError && (
            <div role="alert" style={styles.error}>
              {trackerError}
            </div>
          )}
        </section>

        {/* SELECTED THERAPIST INFORMATION */}

        {selectedTherapist && (
          <section style={styles.selectedBanner}>
            <div style={styles.selectedIdentity}>
              <div style={styles.avatar}>
                {selectedTherapistName
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part.charAt(0))
                  .join("")
                  .toUpperCase()}
              </div>

              <div>
                <div style={styles.bannerLabel}>
                  CURRENTLY VIEWING
                </div>

                <h3 style={styles.bannerName}>
                  {selectedTherapistName}
                </h3>

                <div style={styles.bannerDescription}>
                  Physiotherapist Patient Tracker
                </div>
              </div>
            </div>

            <div style={styles.bannerMeta}>
              <span style={styles.activeBadge}>
                <Icon
                  name="check"
                  size={14}
                  color="#047857"
                />
                Selected
              </span>

              <span style={styles.monthBadge}>
                <Icon
                  name="calendar"
                  size={15}
                  color="#475569"
                />
                {monthLabel}
              </span>
            </div>
          </section>
        )}

        {/* PATIENT TRACKER */}

        {!selectedTherapistId ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <Icon
                name="users"
                size={32}
                color="#2563eb"
              />
            </div>

            <h3 style={styles.emptyTitle}>
              Select a Physiotherapist
            </h3>

            <p style={styles.emptyText}>
              Choose a physiotherapist above to view
              their Patient Tracker, monthly utilization,
              and patient activity.
            </p>
          </div>
        ) : loadingPatients ? (
          <div style={styles.emptyState}>
            <div style={styles.loadingSpinner} />

            <h3 style={styles.emptyTitle}>
              Loading Patient Tracker...
            </h3>

            <p style={styles.emptyText}>
              Retrieving records for{" "}
              {selectedTherapistName ||
                "the selected physiotherapist"}
              .
            </p>
          </div>
        ) : trackerError ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <Icon
                name="clipboard"
                size={30}
                color="#dc2626"
              />
            </div>

            <h3 style={styles.emptyTitle}>
              Patient Tracker Unavailable
            </h3>

            <p style={styles.emptyText}>
              Please review the error above.
            </p>
          </div>
        ) : (
          <PatientTrackerTable
            key={selectedTherapistId}
            patients={patients}
            title={
              selectedTherapist
                ? `${selectedTherapistName} — Patient Tracker`
                : "Patient Tracker"
            }
            selectedMonth={selectedMonth}
            monthLabel={monthLabel}
            onMonthChange={handleMonthChange}
            onRefresh={handleRefresh}
            readOnly={true}
          />
        )}

      </div>
    </div>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = {
  page: {
    minHeight: "100vh",
    padding: "24px 20px 48px",
    background: "#f4f7fb",
    color: "#243b5a",
    fontFamily: "Inter, Arial, sans-serif",
  },

  container: {
    width: "100%",
    maxWidth: 1450,
    margin: "0 auto",
  },

  /* HEADER */

  hero: {
    overflow: "hidden",
    marginBottom: 24,
    borderRadius: 22,
    background:
      "linear-gradient(115deg, #102b50 0%, #174578 58%, #2563a4 100%)",
    color: "#ffffff",
    boxShadow:
      "0 12px 30px rgba(15, 46, 85, 0.14)",
  },

  heroTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    padding: "19px 27px 0",
  },

  heroBackButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 9,
    padding: "10px 14px",
    border: "1px solid rgba(255,255,255,0.22)",
    borderRadius: 10,
    background: "rgba(255,255,255,0.10)",
    color: "#ffffff",
    fontSize: 12,
    fontWeight: 750,
    cursor: "pointer",
  },

  heroLogoutButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 9,
    padding: "10px 15px",
    border: "1px solid rgba(255,255,255,0.22)",
    borderRadius: 10,
    background: "rgba(255,255,255,0.10)",
    color: "#ffffff",
    fontSize: 12,
    fontWeight: 750,
    cursor: "pointer",
  },

  heroContent: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    padding: "34px 30px 32px",
    flexWrap: "wrap",
  },

  heroIcon: {
    width: 66,
    height: 66,
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    borderRadius: 19,
    background: "rgba(255,255,255,0.13)",
    border: "1px solid rgba(255,255,255,0.19)",
  },

  heroText: {
    flex: "1 1 300px",
  },

  heroEyebrow: {
    marginBottom: 9,
    color: "#a9d5ff",
    fontSize: 10,
    fontWeight: 850,
    letterSpacing: "1.7px",
  },

  heroTitle: {
    margin: "0 0 10px",
    color: "#ffffff",
    fontSize: "clamp(25px, 3vw, 35px)",
    fontWeight: 850,
    letterSpacing: "-0.7px",
  },

  heroSubtitle: {
    margin: 0,
    maxWidth: 670,
    color: "#d6e7fa",
    fontSize: 13,
    lineHeight: 1.9,
  },

  heroFooter: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
    padding: "15px 29px",
    background: "rgba(4,20,43,0.17)",
    borderTop: "1px solid rgba(255,255,255,0.11)",
  },

  heroFooterItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "#dcecff",
    fontSize: 11,
    fontWeight: 650,
  },

  heroFooterDivider: {
    height: 16,
    width: 1,
    background: "rgba(255,255,255,0.23)",
  },

  /* SELECTOR */

  selectorCard: {
    display: "grid",
    gap: 22,
    padding: 25,
    marginBottom: 20,
    border: "1px solid #e1e9f4",
    borderRadius: 18,
    background: "#ffffff",
    boxShadow:
      "0 5px 22px rgba(31,55,89,0.035)",
  },

  selectorTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 15,
    flexWrap: "wrap",
  },

  selectorHeadingRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    flex: "1 1 300px",
  },

  selectorIcon: {
    width: 47,
    height: 47,
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    borderRadius: 13,
    background: "#eff6ff",
    border: "1px solid #dbeafe",
  },

  selectorTitle: {
    margin: "0 0 6px",
    color: "#17365d",
    fontSize: 18,
    fontWeight: 850,
  },

  selectorDescription: {
    margin: 0,
    color: "#7185a3",
    fontSize: 12,
    lineHeight: 1.7,
  },

  therapistCount: {
    padding: "8px 13px",
    borderRadius: 30,
    background: "#f1f5f9",
    color: "#475569",
    fontSize: 11,
    fontWeight: 750,
    whiteSpace: "nowrap",
  },

  selectorControls: {
    display: "flex",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: 14,
  },

  field: {
    display: "grid",
    gap: 8,
    flex: "1 1 300px",
  },

  label: {
    color: "#475569",
    fontSize: 10,
    fontWeight: 850,
    letterSpacing: "0.9px",
  },

  selectWrapper: {
    position: "relative",
    width: "100%",
  },

  select: {
    width: "100%",
    minHeight: 49,
    padding: "11px 43px 11px 15px",
    border: "1px solid #d9e3f0",
    borderRadius: 11,
    background: "#f8fbff",
    color: "#17365d",
    fontSize: 13,
    fontWeight: 650,
    fontFamily: "inherit",
    appearance: "none",
    WebkitAppearance: "none",
    outlineColor: "#2563eb",
    boxSizing: "border-box",
    cursor: "pointer",
  },

  selectChevron: {
    position: "absolute",
    right: 15,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
  },

  refreshButton: {
    minHeight: 49,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "11px 20px",
    border: "1px solid #1d4ed8",
    borderRadius: 11,
    background: "#2563eb",
    color: "#ffffff",
    fontSize: 12,
    fontWeight: 800,
    fontFamily: "inherit",
    whiteSpace: "nowrap",
    cursor: "pointer",
  },

  /* SELECTED THERAPIST */

  selectedBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    flexWrap: "wrap",
    padding: "19px 23px",
    marginBottom: 22,
    border: "1px solid #dbe7f7",
    borderRadius: 16,
    background: "#ffffff",
    boxShadow:
      "0 4px 18px rgba(31,55,89,0.035)",
  },

  selectedIdentity: {
    display: "flex",
    alignItems: "center",
    gap: 15,
    minWidth: 0,
  },

  avatar: {
    width: 49,
    height: 49,
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    borderRadius: 14,
    background: "#e8f0ff",
    color: "#2563eb",
    fontSize: 17,
    fontWeight: 850,
  },

  bannerLabel: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: 850,
    letterSpacing: "0.9px",
  },

  bannerName: {
    margin: "5px 0",
    color: "#17365d",
    fontSize: 19,
    fontWeight: 850,
    overflowWrap: "anywhere",
  },

  bannerDescription: {
    color: "#7185a3",
    fontSize: 11,
  },

  bannerMeta: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },

  activeBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 12px",
    borderRadius: 30,
    background: "#ecfdf5",
    border: "1px solid #d1fae5",
    color: "#047857",
    fontSize: 11,
    fontWeight: 800,
  },

  monthBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "9px 13px",
    borderRadius: 30,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    color: "#475569",
    fontSize: 11,
    fontWeight: 800,
  },

  /* EMPTY AND LOADING STATES */

  emptyState: {
    display: "grid",
    justifyItems: "center",
    gap: 13,
    padding: "68px 20px",
    border: "1px dashed #dce6f2",
    borderRadius: 18,
    background: "#ffffff",
    textAlign: "center",
  },

  emptyIcon: {
    width: 70,
    height: 70,
    display: "grid",
    placeItems: "center",
    borderRadius: 20,
    background: "#eff6ff",
    marginBottom: 3,
  },

  emptyTitle: {
    margin: 0,
    color: "#17365d",
    fontSize: 19,
    fontWeight: 850,
  },

  emptyText: {
    margin: 0,
    maxWidth: 430,
    color: "#7185a3",
    fontSize: 13,
    lineHeight: 1.8,
  },

  loadingSpinner: {
    width: 35,
    height: 35,
    border: "4px solid #dbeafe",
    borderTopColor: "#2563eb",
    borderRadius: "50%",
    marginBottom: 10,
  },

  /* ERRORS */

  error: {
    padding: 14,
    border: "1px solid #fecdd3",
    borderRadius: 12,
    background: "#fff1f2",
    color: "#b91c1c",
    fontSize: 13,
    lineHeight: 1.7,
  },

  /* ADMIN PREVIEW */

  impersonation: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 15,
    flexWrap: "wrap",
    padding: 16,
    marginBottom: 20,
    border: "1px solid #fed7aa",
    borderRadius: 13,
    background: "#fff7ed",
  },

  adminButton: {
    padding: "10px 15px",
    border: 0,
    borderRadius: 10,
    background: "#9a3412",
    color: "#ffffff",
    cursor: "pointer",
  },
};

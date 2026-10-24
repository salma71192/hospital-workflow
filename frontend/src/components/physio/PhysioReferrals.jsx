import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "../../api/api";
import PhysioCreateReferral from "./PhysioCreateReferral";
import PhysioReferralHistory from "./PhysioReferralHistory";
const styles = {
  container: {
    display: "grid",
    gap: 22,
    minWidth: 0,
  },
  hero: {
    padding: 26,
    borderRadius: 18,
    color: "#ffffff",
    background:
      "linear-gradient(120deg, #16324f, #20566b, #07866f)",
  },
  heroTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
  },
  title: {
    margin: 0,
    fontSize: 26,
    fontWeight: 800,
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#e1edf5",
    fontSize: 14,
    lineHeight: 1.6,
  },
  refreshButton: {
    padding: "11px 16px",
    borderRadius: 10,
    border: "1px solid #ffffff55",
    background: "#ffffff20",
    color: "#ffffff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))",
    gap: 15,
  },
  statCard: {
    padding: 19,
    border: "1px solid #e2e8f0",
    borderRadius: 15,
    background: "#ffffff",
    boxShadow: "0 4px 16px rgba(15, 23, 42, 0.035)",
  },
  statLabel: {
    color: "#708196",
    fontSize: 12,
    fontWeight: 600,
  },
  statValue: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: 800,
  },
  error: {
    padding: 14,
    borderRadius: 10,
    color: "#b42332",
    background: "#fff0f1",
    border: "1px solid #fecdd3",
    fontSize: 13,
    lineHeight: 1.6,
  },
  physicianPanel: {
    padding: 14,
    border: "1px solid #dbeafe",
    borderRadius: 12,
    background: "#eff6ff",
    color: "#1e40af",
    fontSize: 13,
    lineHeight: 1.6,
  },
  physicianError: {
    padding: 14,
    border: "1px solid #fecaca",
    borderRadius: 12,
    background: "#fef2f2",
    color: "#991b1b",
    fontSize: 13,
    lineHeight: 1.6,
  },
  retryButton: {
    marginTop: 10,
    padding: "9px 13px",
    border: "1px solid #fca5a5",
    borderRadius: 8,
    background: "#ffffff",
    color: "#991b1b",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
};
function extractPhysicianList(data) {
  if (Array.isArray(data)) {
    return data;
  }
  if (!data || typeof data !== "object") {
    return [];
  }
  const possibleKeys = [
    "physicians",
    "doctors",
    "users",
    "results",
    "data",
  ];
  for (const key of possibleKeys) {
    if (Array.isArray(data[key])) {
      return data[key];
    }
  }
  return [];
}
function getPhysicianName(physician) {
  if (typeof physician === "string") {
    return physician.trim();
  }
  if (!physician || typeof physician !== "object") {
    return "";
  }
  const combinedName = [
    physician.first_name,
    physician.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  return String(
    physician.display_name ||
      physician.full_name ||
      physician.name ||
      combinedName ||
      physician.username ||
      ""
  ).trim();
}
function getPhysicianId(physician) {
  if (!physician || typeof physician !== "object") {
    return null;
  }
  // Prefer an explicitly supplied user ID because the
  // physician list comes from users/physicians/.
  const value =
    physician.user_id ??
    physician.id ??
    physician.pk;
  if (value === undefined || value === null || value === "") {
    return null;
  }
  return value;
}
function getPhysicianKey(physician) {
  const id = getPhysicianId(physician);
  if (id !== null) {
    return `id:${String(id)}`;
  }
  return `name:${getPhysicianName(physician).toLocaleLowerCase()}`;
}
function normalizePhysicians(list) {
  const unique = new Map();
  for (const physician of Array.isArray(list) ? list : []) {
    const name = getPhysicianName(physician);
    if (!name) {
      continue;
    }
    const id = getPhysicianId(physician);
    const key = getPhysicianKey(physician);
    if (!unique.has(key)) {
      unique.set(key, {
        ...(typeof physician === "object" && physician !== null
          ? physician
          : {}),
        id,
        user_id: id,
        display_name: name,
        name,
      });
    }
  }
  return Array.from(unique.values()).sort((a, b) =>
    getPhysicianName(a).localeCompare(getPhysicianName(b))
  );
}
function getPhysicianErrorMessage(error) {
  const status = error?.response?.status;
  const data = error?.response?.data;
  if (status === 401) {
    return "Your session may have expired. Please sign in again and retry loading physicians.";
  }
  if (status === 403) {
    return "Your account does not have permission to load the physician list.";
  }
  if (status === 404) {
    return 'The physician endpoint "users/physicians/" was not found. Check your Django URL configuration and API base URL.';
  }
  if (!error?.response) {
    return "Unable to connect to the server. Check your connection and try again.";
  }
  if (typeof data === "string" && data.trim()) {
    return data;
  }
  if (data && typeof data === "object") {
    for (const key of ["detail", "error", "message", "details"]) {
      const value = data[key];
      if (typeof value === "string" && value.trim()) {
        return value;
      }
      if (Array.isArray(value) && value.length > 0) {
        return value.map(String).join(", ");
      }
    }
    const firstError = Object.values(data).find(
      (value) =>
        typeof value === "string" ||
        (Array.isArray(value) && value.length > 0)
    );
    if (typeof firstError === "string") {
      return firstError;
    }
    if (Array.isArray(firstError)) {
      return firstError.map(String).join(", ");
    }
    return "The server rejected the physician request. Check the server response.";
  }
  return "Unable to load physicians from the server.";
}
export default function PhysioReferrals({
  patients = [],
  physicians = [],
  referrals = [],
  loading = false,
  saving = false,
  error = "",
  success = "",
  onCreateReferral,
  onUpdateStatus,
  onEditReferral,
  onDeleteReferral,
  onRefresh,
}) {
  const [fetchedPhysicians, setFetchedPhysicians] = useState([]);
  const [physiciansLoading, setPhysiciansLoading] = useState(false);
  const [physiciansError, setPhysiciansError] = useState("");
  const [physiciansLoaded, setPhysiciansLoaded] = useState(false);
  const [physicianRetry, setPhysicianRetry] = useState(0);
  const loadPhysicians = useCallback(async (cancelledRef) => {
    setPhysiciansLoading(true);
    setPhysiciansError("");
    try {
      const response = await api.get("users/physicians/");
      if (cancelledRef.cancelled) {
        return;
      }
      const list = normalizePhysicians(
        extractPhysicianList(response.data)
      );
      setFetchedPhysicians(list);
      setPhysiciansLoaded(true);
      if (list.length === 0) {
        setPhysiciansError(
          "The physician endpoint returned no usable physician records. Check the endpoint response and physician role filtering."
        );
      }
    } catch (requestError) {
      if (cancelledRef.cancelled) {
        return;
      }
      console.error(
        "Failed to load physicians for physiotherapy referrals:",
        requestError?.response?.status,
        requestError?.response?.data || requestError
      );
      setPhysiciansError(
        getPhysicianErrorMessage(requestError)
      );
      setPhysiciansLoaded(false);
    } finally {
      if (!cancelledRef.cancelled) {
        setPhysiciansLoading(false);
      }
    }
  }, []);
  useEffect(() => {
    const cancelledRef = { cancelled: false };
    loadPhysicians(cancelledRef);
    return () => {
      cancelledRef.cancelled = true;
    };
  }, [loadPhysicians, physicianRetry]);
  const availablePhysicians = useMemo(() => {
    return normalizePhysicians([
      ...physicians,
      ...fetchedPhysicians,
    ]);
  }, [physicians, fetchedPhysicians]);
  const awaitingCount = useMemo(() => {
    return referrals.filter((referral) => {
      return (
        String(referral.status || "awaiting").toLowerCase() ===
        "awaiting"
      );
    }).length;
  }, [referrals]);
  const completedCount = useMemo(() => {
    return referrals.filter((referral) => {
      return (
        String(referral.status || "").toLowerCase() ===
        "completed"
      );
    }).length;
  }, [referrals]);
  const stats = [
    {
      label: "Total referrals",
      value: referrals.length,
      color: "#3675c5",
    },
    {
      label: "Awaiting follow-up",
      value: awaitingCount,
      color: "#b96a13",
    },
    {
      label: "Completed referrals",
      value: completedCount,
      color: "#07866f",
    },
  ];
  const retryPhysicianFetch = () => {
    setPhysiciansError("");
    setPhysicianRetry((previous) => previous + 1);
  };
  return (
    <div style={styles.container}>
      <header style={styles.hero}>
        <div style={styles.heroTop}>
          <div>
            <h1 style={styles.title}>Physio Referrals</h1>
            <p style={styles.subtitle}>
              Create physician referrals and manage referral history
              and follow-up status.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRefresh?.()}
            disabled={loading || typeof onRefresh !== "function"}
            style={{
              ...styles.refreshButton,
              opacity:
                loading || typeof onRefresh !== "function" ? 0.6 : 1,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "Refreshing..." : "↻ Refresh records"}
          </button>
        </div>
      </header>
      <div style={styles.statsGrid}>
        {stats.map((stat) => (
          <div key={stat.label} style={styles.statCard}>
            <div style={styles.statLabel}>{stat.label}</div>
            <div
              style={{
                ...styles.statValue,
                color: stat.color,
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>
      {error ? (
        <div role="alert" style={styles.error}>
          {error}
        </div>
      ) : null}
      {physiciansLoading ? (
        <div role="status" style={styles.physicianPanel}>
          Loading physicians from the server...
        </div>
      ) : null}
      {!physiciansLoading && physiciansError ? (
        <div role="alert" style={styles.physicianError}>
          <div>{physiciansError}</div>
          <button
            type="button"
            onClick={retryPhysicianFetch}
            style={styles.retryButton}
          >
            Retry loading physicians
          </button>
        </div>
      ) : null}
      {!physiciansLoading &&
      !physiciansError &&
      physiciansLoaded &&
      availablePhysicians.length > 0 ? (
        <div style={styles.physicianPanel}>
          {availablePhysicians.length} physician option(s) available.
        </div>
      ) : null}
      <PhysioCreateReferral
        patients={patients}
        physicians={availablePhysicians}
        loading={loading || physiciansLoading}
        saving={saving}
        error=""
        success={success}
        onCreateReferral={onCreateReferral}
      />
      <PhysioReferralHistory
        referrals={referrals}
        physicians={availablePhysicians}
        loading={loading}
        saving={saving}
        error={error}
        success={success}
        onUpdateStatus={onUpdateStatus}
        onEditReferral={onEditReferral}
        onDeleteReferral={onDeleteReferral}
        onRefresh={onRefresh}
      />
    </div>
  );
}
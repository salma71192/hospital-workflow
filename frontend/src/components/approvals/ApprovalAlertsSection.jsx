import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api";

const ALERT_CONFIG = {
  expired: {
    title: "Expired Approvals",
    actionLabel: "Mark Renewed",
    resolutionAction: "renewed",
  },
  near_expiry: {
    title: "Near Expiry",
    actionLabel: "Call Center Notified",
    resolutionAction: "call_center_notified",
  },
  rejected: {
    title: "Rejected Approvals",
    actionLabel: "Patient Notified",
    resolutionAction: "patient_notified",
  },
};

export default function ApprovalAlertsSection({ onEditApproval }) {
  const [activeType, setActiveType] = useState("expired");
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [workingId, setWorkingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [selectedAlertId, setSelectedAlertId] = useState(null);

  useEffect(() => {
    loadAlerts(activeType);
  }, [activeType]);

  const loadAlerts = async (type) => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const res = await api.get(`approvals/alerts-list/?type=${type}`);
      setAlerts(res.data.alerts || []);
    } catch (err) {
      setAlerts([]);
      setError(err?.response?.data?.error || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return alerts;

    return alerts.filter((item) => {
      return (
        (item.patient_name || "").toLowerCase().includes(term) ||
        (item.patient_id || "").toLowerCase().includes(term)
      );
    });
  }, [alerts, search]);

  const handleResolve = async (alertId) => {
    const config = ALERT_CONFIG[activeType];
    if (!config) return;

    try {
      setWorkingId(alertId);
      setError("");
      setMessage("");

      await api.post(`approvals/alerts/${alertId}/resolve/`, {
        resolution_action: config.resolutionAction,
      });

      setAlerts((prev) => prev.filter((item) => item.id !== alertId));
      if (selectedAlertId === alertId) {
        setSelectedAlertId(null);
      }
      setMessage("Alert resolved successfully");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to resolve alert");
    } finally {
      setWorkingId(null);
    }
  };

  const handleOpenApproval = (item) => {
    setSelectedAlertId(item.id);

    if (onEditApproval) {
      onEditApproval({
        id: item.patient_id_db,
        name: item.patient_name,
        patient_id: item.patient_id,
      });
    }
  };

  const currentConfig = ALERT_CONFIG[activeType];

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <div style={styles.eyebrow}>Alerts Workflow</div>
            <h2 style={styles.title}>Approval Alerts</h2>
            <div style={styles.subtext}>
              Alerts stay visible until the correct action is completed.
            </div>
          </div>
        </div>

        <div style={styles.tabs}>
          {Object.entries(ALERT_CONFIG).map(([key, config]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveType(key)}
              style={{
                ...styles.tabButton,
                ...(activeType === key ? styles.tabButtonActive : {}),
              }}
            >
              {config.title}
            </button>
          ))}
        </div>

        <div style={styles.searchWrap}>
          <label style={styles.label}>Search Patient</label>
          <input
            type="text"
            placeholder="Search by patient name or patient ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.input}
          />
        </div>

        {message ? <div style={styles.successState}>{message}</div> : null}
        {error ? <div style={styles.errorState}>{error}</div> : null}

        {loading ? (
          <div style={styles.emptyState}>Loading alerts...</div>
        ) : filteredAlerts.length === 0 ? (
          <div style={styles.emptyState}>
            No open alerts in {currentConfig.title.toLowerCase()}.
          </div>
        ) : (
          <div style={styles.list}>
            {filteredAlerts.map((item) => {
              const isActive = selectedAlertId === item.id;

              return (
                <div
                  key={item.id}
                  style={{
                    ...styles.alertCard,
                    ...(isActive ? styles.alertCardActive : {}),
                  }}
                >
                  <button
                    type="button"
                    style={styles.alertMainButton}
                    onClick={() => handleOpenApproval(item)}
                  >
                    <div style={styles.alertInfo}>
                      <div style={styles.patientName}>{item.patient_name}</div>
                      <div style={styles.meta}>Patient ID: {item.patient_id}</div>
                      <div style={styles.meta}>
                        Created:{" "}
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString()
                          : "-"}
                      </div>
                      {item.notes ? (
                        <div style={styles.notes}>Notes: {item.notes}</div>
                      ) : null}
                    </div>
                  </button>

                  <button
                    type="button"
                    style={styles.resolveButton}
                    onClick={() => handleResolve(item.id)}
                    disabled={workingId === item.id}
                  >
                    {workingId === item.id
                      ? "Processing..."
                      : currentConfig.actionLabel}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "grid",
    gap: "16px",
  },
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "22px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
    display: "grid",
    gap: "16px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  eyebrow: {
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#2563eb",
    marginBottom: "8px",
  },
  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
  },
  subtext: {
    marginTop: "6px",
    fontSize: "14px",
    color: "#64748b",
  },
  tabs: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  tabButton: {
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    color: "#0f172a",
    padding: "10px 14px",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer",
  },
  tabButtonActive: {
    background: "#2563eb",
    color: "#fff",
    borderColor: "#2563eb",
  },
  searchWrap: {
    display: "grid",
    gap: "8px",
    maxWidth: "420px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#475569",
  },
  input: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    background: "#fff",
  },
  list: {
    display: "grid",
    gap: "12px",
  },
  alertCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
    alignItems: "center",
    background: "#f8fafc",
  },
  alertCardActive: {
    borderColor: "#2563eb",
    background: "#eff6ff",
  },
  alertMainButton: {
    border: "none",
    background: "transparent",
    padding: 0,
    margin: 0,
    cursor: "pointer",
    textAlign: "left",
    flex: 1,
    minWidth: "260px",
  },
  alertInfo: {
    display: "grid",
    gap: "6px",
  },
  patientName: {
    fontSize: "17px",
    fontWeight: "800",
    color: "#0f172a",
  },
  meta: {
    fontSize: "14px",
    color: "#475569",
  },
  notes: {
    fontSize: "14px",
    color: "#334155",
  },
  resolveButton: {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 16px",
    fontWeight: "800",
    cursor: "pointer",
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
  errorState: {
    color: "#b91c1c",
    fontSize: "14px",
    fontWeight: "600",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    padding: "14px",
  },
  successState: {
    color: "#166534",
    fontSize: "14px",
    fontWeight: "600",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "12px",
    padding: "14px",
  },
};

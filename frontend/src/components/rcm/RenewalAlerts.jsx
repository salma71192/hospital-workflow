
import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../api/api";

const C = {
  navy: "#172b4d",
  primary: "#4057cf",
  text: "#334155",
  muted: "#64748b",
  border: "#e5eaf1",
  background: "#f6f8fc",
  white: "#ffffff",
  green: "#15803d",
  greenBg: "#dcfce7",
  amber: "#b45309",
  amberBg: "#fef3c7",
  red: "#b91c1c",
  redBg: "#fee2e2",
};

const todayISO = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const currentMonth = () => todayISO().slice(0, 7);

const formatDate = (value) => {
  if (!value) return "—";
  const parts = String(value).slice(0, 10).split("-");
  if (parts.length !== 3) return value;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const getErrorMessage = (error) =>
  error?.response?.data?.error ||
  error?.response?.data?.detail ||
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

const getResults = (response) => {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.alerts)) return data.alerts;
  return [];
};

const getPatientName = (alert) =>
  alert.patientName ||
  alert.patient_name ||
  alert.patient?.name ||
  alert.patient?.full_name ||
  alert.patient?.patient_name ||
  "—";

const getFileNumber = (alert) =>
  alert.fileNumber ||
  alert.file_number ||
  alert.patient?.file_number ||
  alert.patient?.fileNumber ||
  "—";

const getClaimId = (alert) =>
  alert.claimId ||
  alert.claim_id_value ||
  alert.claim_id ||
  alert.claim?.claim_id ||
  "—";

const getRenewalDate = (alert) =>
  String(alert.renewalDate || alert.renewal_date || "").slice(0, 10);

export default function RenewalAlerts({ onRenewal }) {
  const [filterType, setFilterType] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [searchClaimId, setSearchClaimId] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = { all: "true" };

      if (filterType === "daily" && selectedDate) {
        params.date = selectedDate;
      } else if (filterType === "monthly" && selectedMonth) {
        params.month = selectedMonth;
      }

      if (searchClaimId.trim()) {
        params.claim_id = searchClaimId.trim();
      }

      const response = await api.get("rcm/renewal-alerts/", {
        params,
        withCredentials: true,
      });

      setAlerts(getResults(response));
    } catch (err) {
      setAlerts([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filterType, selectedDate, selectedMonth, searchClaimId, refreshKey]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const visibleAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const alertType = String(
        alert.alertType || alert.alert_type || "renewal"
      ).toLowerCase();

      // This screen focuses on renewal alerts, not rejection alerts.
      if (alertType !== "renewal") return false;

      if (filterType === "daily" && selectedDate) {
        if (getRenewalDate(alert) !== selectedDate) return false;
      }

      if (filterType === "monthly" && selectedMonth) {
        if (!getRenewalDate(alert).startsWith(selectedMonth)) return false;
      }

      if (searchClaimId.trim()) {
        if (
          !String(getClaimId(alert))
            .toLowerCase()
            .includes(searchClaimId.trim().toLowerCase())
        ) {
          return false;
        }
      }

      return true;
    });
  }, [alerts, filterType, selectedDate, selectedMonth, searchClaimId]);

  const handleRenewal = (alert) => {
    const renewalDate = getRenewalDate(alert);
    const today = todayISO();

    if (renewalDate !== today) {
      setNotice("Renewal is available only on the scheduled renewal date.");
      return;
    }

    if (
      String(alert.status || "Pending").toLowerCase() === "submitted"
    ) {
      setNotice("This renewal has already been submitted.");
      return;
    }

    if (typeof onRenewal !== "function") {
      setNotice(
        "The renewal form is not connected yet. The next step is to connect this button to Create Claim."
      );
      return;
    }

    setNotice("");
    onRenewal(alert);
  };

  const statusStyle = (status) => {
    const normalized = String(status || "Pending").toLowerCase();

    if (normalized === "submitted") {
      return { color: C.green, background: C.greenBg };
    }

    return { color: C.amber, background: C.amberBg };
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    background: C.white,
    color: C.text,
    fontSize: 14,
    boxSizing: "border-box",
  };

  const today = todayISO();

  return (
    <div
      style={{
        padding: 20,
        background: C.background,
        borderRadius: 12,
        color: C.text,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: C.navy, fontSize: 22 }}>
            Renewal Alerts
          </h2>
          <p style={{ margin: "6px 0 0", color: C.muted, fontSize: 13 }}>
            Review scheduled renewals and submit eligible renewals.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={loading}
          style={{
            padding: "10px 14px",
            border: "none",
            borderRadius: 8,
            color: C.white,
            background: C.primary,
            cursor: loading ? "wait" : "pointer",
            fontWeight: 600,
          }}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          padding: 16,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          background: C.white,
          marginBottom: 16,
        }}
      >
        <div>
          <label
            htmlFor="renewal-filter-type"
            style={{ display: "block", fontSize: 12, marginBottom: 6 }}
          >
            Filter
          </label>
          <select
            id="renewal-filter-type"
            value={filterType}
            onChange={(event) => setFilterType(event.target.value)}
            style={inputStyle}
          >
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
            <option value="all">All dates</option>
          </select>
        </div>

        {filterType === "daily" && (
          <div>
            <label
              htmlFor="renewal-date"
              style={{ display: "block", fontSize: 12, marginBottom: 6 }}
            >
              Renewal date
            </label>
            <input
              id="renewal-date"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              style={inputStyle}
            />
          </div>
        )}

        {filterType === "monthly" && (
          <div>
            <label
              htmlFor="renewal-month"
              style={{ display: "block", fontSize: 12, marginBottom: 6 }}
            >
              Renewal month
            </label>
            <input
              id="renewal-month"
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              style={inputStyle}
            />
          </div>
        )}

        <div>
          <label
            htmlFor="renewal-claim-search"
            style={{ display: "block", fontSize: 12, marginBottom: 6 }}
          >
            Search by Claim ID
          </label>
          <input
            id="renewal-claim-search"
            type="search"
            placeholder="Enter Claim ID"
            value={searchClaimId}
            onChange={(event) => setSearchClaimId(event.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {notice && (
        <div
          role="status"
          style={{
            padding: 12,
            marginBottom: 12,
            background: C.amberBg,
            color: C.amber,
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          {notice}
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            padding: 12,
            marginBottom: 12,
            background: C.redBg,
            color: C.red,
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 12,
          fontSize: 13,
          color: C.muted,
        }}
      >
        <span>{visibleAlerts.length} renewal alert(s)</span>
        <span>Today: {formatDate(today)}</span>
      </div>

      <div
        style={{
          overflowX: "auto",
          background: C.white,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 850,
            fontSize: 13,
          }}
        >
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              {[
                "Claim ID",
                "Patient",
                "File Number",
                "Renewal Date",
                "Status",
                "Action",
              ].map((heading) => (
                <th
                  key={heading}
                  style={{
                    padding: 12,
                    borderBottom: `1px solid ${C.border}`,
                    color: C.navy,
                    whiteSpace: "nowrap",
                  }}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {!loading && visibleAlerts.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: 24,
                    textAlign: "center",
                    color: C.muted,
                  }}
                >
                  No renewal alerts found for the selected filter.
                </td>
              </tr>
            )}

            {visibleAlerts.map((alert) => {
              const renewalDate = getRenewalDate(alert);
              const submitted =
                String(alert.status || "Pending").toLowerCase() ===
                "submitted";
              const isRenewalDay = renewalDate === today;
              const canRenew = isRenewalDay && !submitted;

              return (
                <tr key={alert.id}>
                  <td
                    style={{
                      padding: 12,
                      borderBottom: `1px solid ${C.border}`,
                      fontWeight: 600,
                    }}
                  >
                    {getClaimId(alert)}
                  </td>
                  <td
                    style={{
                      padding: 12,
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    {getPatientName(alert)}
                  </td>
                  <td
                    style={{
                      padding: 12,
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    {getFileNumber(alert)}
                  </td>
                  <td
                    style={{
                      padding: 12,
                      borderBottom: `1px solid ${C.border}`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDate(renewalDate)}
                  </td>
                  <td
                    style={{
                      padding: 12,
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        padding: "5px 9px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        ...statusStyle(alert.status),
                      }}
                    >
                      {alert.status || "Pending"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: 12,
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    <button
                      type="button"
                      disabled={!canRenew}
                      onClick={() => handleRenewal(alert)}
                      title={
                        submitted
                          ? "Already submitted"
                          : !isRenewalDay
                          ? "Available only on the renewal date"
                          : "Open renewal form"
                      }
                      style={{
                        padding: "8px 12px",
                        border: "none",
                        borderRadius: 7,
                        background: canRenew ? C.primary : "#e2e8f0",
                        color: canRenew ? C.white : "#64748b",
                        fontWeight: 600,
                        cursor: canRenew ? "pointer" : "not-allowed",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {submitted ? "Submitted" : "Renewal"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

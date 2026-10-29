
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
  red: "#b91c1c",
  redBg: "#fee2e2",
  orange: "#c2410c",
  orangeBg: "#fff7ed",
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

const getErrorMessage = (error) => {
  const data = error?.response?.data;

  if (typeof data === "string" && data.trim()) return data;

  if (data && typeof data === "object") {
    if (data.error) return data.error;
    if (data.detail) return data.detail;
    if (data.message) return data.message;

    const messages = Object.entries(data)
      .map(([key, value]) => {
        const description = Array.isArray(value)
          ? value.join(", ")
          : typeof value === "object" && value !== null
          ? JSON.stringify(value)
          : String(value);

        return `${key}: ${description}`;
      })
      .join(" · ");

    if (messages) return messages;
  }

  return error?.message || "Something went wrong. Please try again.";
};

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
  alert.patientFileNumber ||
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

const normalizeStatus = (value) =>
  String(value || "").trim().toLowerCase();

/*
 * The linked claim status takes priority over the alert status.
 * This supports both camelCase and snake_case API response fields.
 */
const getEffectiveStatus = (alert) =>
  alert.claim_status ||
  alert.claimStatus ||
  alert.claim?.status ||
  alert.renewal_status ||
  alert.renewalStatus ||
  alert.status ||
  "";

const isApproved = (alert) =>
  normalizeStatus(getEffectiveStatus(alert)) === "approved";

const isSubmitted = (alert) =>
  [
    "submitted",
    "submitted for review",
    "submitted for processing",
  ].includes(normalizeStatus(getEffectiveStatus(alert)));

const isRejected = (alert) =>
  ["rejected", "denied", "declined"].includes(
    normalizeStatus(getEffectiveStatus(alert))
  );

const getDisplayStatus = (alert) => {
  if (isApproved(alert)) return "Approved";
  if (isRejected(alert)) return "Rejected";
  if (isSubmitted(alert)) return "Submitted";

  const status = normalizeStatus(getEffectiveStatus(alert));

  if (status === "pending") return "Pending";

  return status
    ? status.charAt(0).toUpperCase() + status.slice(1)
    : "Pending";
};

const isPastDate = (date) => Boolean(date) && date < todayISO();

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
  const [openingAlertId, setOpeningAlertId] = useState(null);
  const [editingAlert, setEditingAlert] = useState(null);
  const [editedRenewalDate, setEditedRenewalDate] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingAlertId, setDeletingAlertId] = useState(null);

  const today = todayISO();

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

      if (alertType !== "renewal") return false;

      const renewalDate = getRenewalDate(alert);

      if (
        filterType === "daily" &&
        selectedDate &&
        renewalDate !== selectedDate
      ) {
        return false;
      }

      if (
        filterType === "monthly" &&
        selectedMonth &&
        !renewalDate.startsWith(selectedMonth)
      ) {
        return false;
      }

      if (searchClaimId.trim()) {
        const claimId = String(getClaimId(alert)).toLowerCase();

        if (!claimId.includes(searchClaimId.trim().toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [alerts, filterType, selectedDate, selectedMonth, searchClaimId]);

  const handleRefresh = () => {
    setNotice("");
    setError("");
    setRefreshKey((value) => value + 1);
  };

  const handleRenewal = async (alert) => {
    if (!isRejected(alert)) {
      setNotice("Only rejected claims can be renewed.");
      return;
    }

    const renewalDate = getRenewalDate(alert);

    if (!renewalDate) {
      setNotice("This renewal alert does not have a valid renewal date.");
      return;
    }

    if (openingAlertId !== null) return;

    if (typeof onRenewal !== "function") {
      setNotice("The renewal form is not connected to Create Claim.");
      return;
    }

    setError("");
    setNotice("");
    setOpeningAlertId(alert.id);

    try {
      await onRenewal({
        ...alert,
        alertId: alert.id,
        renewalAlertId: alert.id,
        claimPk: alert.claimPk || alert.claim_pk || alert.claim?.id,
        claimId: getClaimId(alert),
      });

      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setOpeningAlertId(null);
    }
  };

  const handleEdit = (alert) => {
    if (isApproved(alert)) {
      setNotice("Approved renewals cannot be edited.");
      return;
    }

    const renewalDate = getRenewalDate(alert);

    if (isPastDate(renewalDate)) {
      setNotice("Past renewal alerts cannot be edited.");
      return;
    }

    if (isSubmitted(alert)) {
      setNotice("Submitted renewals cannot be edited.");
      return;
    }

    setError("");
    setNotice("");
    setEditingAlert(alert);
    setEditedRenewalDate(renewalDate || today);
  };

  const handleSaveEdit = async (event) => {
    event.preventDefault();

    if (!editingAlert || savingEdit) return;

    if (isApproved(editingAlert)) {
      setError("Approved renewals cannot be edited.");
      setEditingAlert(null);
      return;
    }

    const currentDate = getRenewalDate(editingAlert);

    if (isPastDate(currentDate)) {
      setError("Past renewal alerts cannot be edited.");
      setEditingAlert(null);
      return;
    }

    if (isSubmitted(editingAlert)) {
      setError("Submitted renewals cannot be edited.");
      setEditingAlert(null);
      return;
    }

    if (!editedRenewalDate) {
      setError("Please select a renewal date.");
      return;
    }

    if (editedRenewalDate < today) {
      setError("The renewal date cannot be in the past.");
      return;
    }

    setSavingEdit(true);
    setError("");
    setNotice("");

    try {
      await api.patch(
        `rcm/renewal-alerts/${editingAlert.id}/`,
        { renewal_date: editedRenewalDate },
        { withCredentials: true }
      );

      setEditingAlert(null);
      setEditedRenewalDate("");
      setNotice("Renewal alert updated successfully.");
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (alert) => {
    if (isApproved(alert)) {
      setNotice("Approved renewals cannot be deleted.");
      return;
    }

    if (isSubmitted(alert)) {
      setNotice("Submitted renewals cannot be deleted.");
      return;
    }

    const renewalDate = getRenewalDate(alert);

    if (isPastDate(renewalDate)) {
      setNotice("Past renewal alerts cannot be deleted.");
      return;
    }

    if (deletingAlertId !== null) return;

    const confirmed = window.confirm(
      `Delete the renewal alert for Claim ID ${getClaimId(alert)}? The claim history will be preserved.`
    );

    if (!confirmed) return;

    setDeletingAlertId(alert.id);
    setError("");
    setNotice("");

    try {
      await api.delete(`rcm/renewal-alerts/${alert.id}/`, {
        withCredentials: true,
      });

      setAlerts((current) =>
        current.filter((item) => item.id !== alert.id)
      );

      if (editingAlert?.id === alert.id) {
        setEditingAlert(null);
      }

      setNotice("Renewal alert deleted successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingAlertId(null);
    }
  };

  const statusStyle = (status) => {
    if (status === "Approved" || status === "Submitted") {
      return { color: C.green, background: C.greenBg };
    }

    if (status === "Rejected") {
      return { color: C.red, background: C.redBg };
    }

    return { color: C.orange, background: C.orangeBg };
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

  const buttonStyle = {
    padding: "8px 11px",
    border: "none",
    borderRadius: 7,
    fontWeight: 600,
    fontSize: 12,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

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
            Review claim status and manage renewal alerts.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
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
            <option value="all">All Dates</option>
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
            background: "#eef2ff",
            color: C.primary,
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
            overflowWrap: "anywhere",
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
            minWidth: 1100,
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
                "Edit",
                "Delete",
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
                  colSpan={8}
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
              const displayStatus = getDisplayStatus(alert);
              const approved = isApproved(alert);
              const submitted = isSubmitted(alert);
              const rejected = isRejected(alert);
              const pastDate = isPastDate(renewalDate);
              const isOpening = openingAlertId === alert.id;
              const isDeleting = deletingAlertId === alert.id;

              const canRenew =
                rejected &&
                Boolean(renewalDate) &&
                !isOpening &&
                !isDeleting &&
                openingAlertId === null;

              const canEdit =
                !approved &&
                !submitted &&
                !pastDate &&
                !savingEdit &&
                !isDeleting;

              const canDelete =
                !approved &&
                !submitted &&
                !pastDate &&
                !isDeleting &&
                !savingEdit;

              /*
               * Explicit button labels:
               * Rejected -> Renew Claim
               * Submitted -> Submitted
               * Approved -> Approved
               * Other statuses -> Not Available
               */
              const actionLabel = isOpening
                ? "Opening..."
                : rejected
                ? "Renew Claim"
                : submitted
                ? "Submitted"
                : approved
                ? "Approved"
                : "Not Available";

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

                    {pastDate && !submitted && !approved && (
                      <div
                        style={{
                          marginTop: 4,
                          color: C.orange,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        Overdue
                      </div>
                    )}
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
                        whiteSpace: "nowrap",
                        ...statusStyle(displayStatus),
                      }}
                    >
                      {displayStatus}
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
                        rejected
                          ? "Open the renewal form for this rejected claim"
                          : `Claim status: ${displayStatus}`
                      }
                      style={{
                        ...buttonStyle,
                        background: canRenew ? C.primary : "#e2e8f0",
                        color: canRenew ? C.white : "#64748b",
                        cursor: canRenew ? "pointer" : "not-allowed",
                      }}
                    >
                      {actionLabel}
                    </button>
                  </td>

                  <td
                    style={{
                      padding: 12,
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    {canEdit ? (
                      <button
                        type="button"
                        onClick={() => handleEdit(alert)}
                        style={{
                          ...buttonStyle,
                          background: "#dbeafe",
                          color: "#1d4ed8",
                        }}
                      >
                        Edit
                      </button>
                    ) : (
                      <span
                        title={
                          approved
                            ? "Approved renewals cannot be edited"
                            : submitted
                            ? "Submitted renewals cannot be edited"
                            : "Past renewal alerts cannot be edited"
                        }
                        style={{ color: C.muted }}
                      >
                        —
                      </span>
                    )}
                  </td>

                  <td
                    style={{
                      padding: 12,
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    {canDelete ? (
                      <button
                        type="button"
                        disabled={!canDelete}
                        onClick={() => handleDelete(alert)}
                        title="Delete renewal alert"
                        style={{
                          ...buttonStyle,
                          background: C.redBg,
                          color: C.red,
                          cursor: "pointer",
                        }}
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </button>
                    ) : (
                      <span
                        title={
                          approved
                            ? "Approved renewals cannot be deleted"
                            : submitted
                            ? "Submitted renewals cannot be deleted"
                            : "Past renewal alerts cannot be deleted"
                        }
                        style={{
                          color: C.muted,
                          fontSize: 12,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Cannot delete
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {loading && (
        <div
          style={{
            padding: 16,
            textAlign: "center",
            color: C.muted,
            fontSize: 13,
          }}
        >
          Loading renewal alerts...
        </div>
      )}

      {editingAlert && (
        <div
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !savingEdit
            ) {
              setEditingAlert(null);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <form
            onSubmit={handleSaveEdit}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-renewal-title"
            style={{
              width: "100%",
              maxWidth: 440,
              background: C.white,
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
            }}
          >
            <h3
              id="edit-renewal-title"
              style={{ margin: "0 0 8px", color: C.navy }}
            >
              Edit Renewal Alert
            </h3>

            <p
              style={{
                margin: "0 0 18px",
                fontSize: 13,
                color: C.muted,
              }}
            >
              Claim ID: {getClaimId(editingAlert)}
              <br />
              Patient: {getPatientName(editingAlert)}
            </p>

            <label
              htmlFor="edit-renewal-date"
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Renewal date
            </label>

            <input
              id="edit-renewal-date"
              type="date"
              min={today}
              value={editedRenewalDate}
              onChange={(event) =>
                setEditedRenewalDate(event.target.value)
              }
              required
              style={inputStyle}
            />

            <p
              style={{
                fontSize: 12,
                color: C.muted,
                margin: "10px 0 20px",
              }}
            >
              Alerts dated today or in the future can be edited.
              Past, submitted, and approved alerts cannot be changed.
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <button
                type="button"
                disabled={savingEdit}
                onClick={() => setEditingAlert(null)}
                style={{
                  ...buttonStyle,
                  padding: "10px 14px",
                  background: "#e2e8f0",
                  color: C.text,
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  savingEdit ||
                  !editedRenewalDate ||
                  editedRenewalDate < today
                }
                style={{
                  ...buttonStyle,
                  padding: "10px 14px",
                  background: C.primary,
                  color: C.white,
                  cursor: savingEdit ? "wait" : "pointer",
                }}
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

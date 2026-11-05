
import React from "react";

export default function ScheduleHistory({
  filteredHistory,
  historyFilter,
  setHistoryFilter,
  historyQuery,
  setHistoryQuery,
  statusOptions,
  loadingHistory,
  openDetails,
  StatusBadge,
  TypeBadge,
  loadingAlerts,
  loadAlerts,
  alertsError,
  followUpAlerts,
  recordCallAttempt,
}) {
  return (
    <>
      <section className="csu-panel">
        <div className="csu-section-header">
          <h3>Appointment Status History</h3>

          <span className="csu-count">
            {filteredHistory.length} appointments
          </span>
        </div>

        <div className="csu-form-grid">
          <label>
            Filter by Status
            <select
              value={historyFilter}
              onChange={(e) => setHistoryFilter(e.target.value)}
            >
              <option value="all">All statuses</option>

              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Search Patient / File Number
            <input
              value={historyQuery}
              onChange={(e) => setHistoryQuery(e.target.value)}
              placeholder="Search..."
            />
          </label>
        </div>

        <div className="csu-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Patient</th>
                <th>File Number</th>
                <th>Status</th>
                <th>Type</th>
                <th>Details</th>
              </tr>
            </thead>

            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="csu-empty">
                    {loadingHistory
                      ? "Loading..."
                      : "No appointments found."}
                  </td>
                </tr>
              ) : (
                filteredHistory.map((row) => (
                  <tr key={row.localId}>
                    <td>{row.time}</td>
                    <td>{row.patient_name}</td>
                    <td>{row.file_number || "—"}</td>

                    <td>
                      <StatusBadge
                        status={row.confirmation_status}
                      />
                    </td>

                    <td>
                      <TypeBadge type={row.appointment_type} />
                    </td>

                    <td>
                      <button
                        type="button"
                        className="csu-secondary"
                        onClick={() => openDetails(row)}
                      >
                        View History
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="csu-panel">
        <div className="csu-section-header">
          <h3>Internal Call Center Alerts</h3>

          <button
            type="button"
            className="csu-secondary"
            disabled={loadingAlerts}
            onClick={loadAlerts}
          >
            {loadingAlerts ? "Loading..." : "Refresh"}
          </button>
        </div>

        <p className="csu-note">
          Unconfirmed, No Answer, and Phone Off appointments
          require follow-up calls. No SMS or WhatsApp messages
          are sent.
        </p>

        {alertsError && (
          <div className="csu-alert error">
            {alertsError}
          </div>
        )}

        {followUpAlerts.length === 0 ? (
          <div className="csu-empty-state">
            {loadingAlerts
              ? "Loading alerts..."
              : alertsError
              ? "Alerts could not be loaded."
              : "No pending follow-up alerts."}
          </div>
        ) : (
          <div className="csu-alert-list">
            {followUpAlerts.map((row) => (
              <div
                className="csu-alert-item"
                key={row.id || row.localId}
              >
                <div>
                  <strong>{row.patient_name}</strong>

                  <p>
                    {row.appointment_date || row.date || ""}
                    {" · "}
                    {row.time}
                    {" · "}
                    {row.therapist || ""}
                  </p>

                  <StatusBadge
                    status={row.confirmation_status}
                  />

                  <small>
                    Call attempts: {row.second_call_attempts}
                  </small>
                </div>

                <button
                  type="button"
                  className="csu-secondary"
                  onClick={() => recordCallAttempt(row)}
                >
                  Record Call Attempt
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

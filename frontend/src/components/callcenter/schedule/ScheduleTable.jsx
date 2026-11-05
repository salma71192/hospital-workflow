
import React from "react";

const COLORS = {
  confirmed: "#F1D84D",
  unconfirmed: "#D6B36A",
  no_answer: "#E7A65A",
  phone_off: "#9CA3AF",
  cancelled: "#D96A6A",
  rescheduled: "#72A8D8",
};

const label = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function ScheduleTable({
  appointments = [],
  busy = false,
  saving = false,
  changedCount = 0,
  loadedSchedule = false,
  saveAppointments,
  editAppointment,
  openDetails,
  removeDraftAppointment,
}) {
  const sorted = [...appointments].sort((a, b) =>
    (a.time || "99:99").localeCompare(b.time || "99:99")
  );

  const missingTime = appointments.filter(
    (row) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(row.time || "")
  ).length;

  return (
    <section className="csu-panel">
      <div className="csu-section-header">
        <h3>Therapist Appointments</h3>

        <button
          type="button"
          className="csu-primary"
          disabled={busy || !changedCount}
          onClick={saveAppointments}
        >
          {saving ? "Saving..." : `Save Changes (${changedCount})`}
        </button>
      </div>

      {missingTime > 0 && (
        <div className="csu-alert error">
          {missingTime} appointment(s) need a valid time.
        </div>
      )}

      <div className="csu-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Patient</th>
              <th>File Number</th>
              <th>Status</th>
              <th>Type</th>
              <th>Approval</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="csu-empty">
                  No appointments loaded.
                </td>
              </tr>
            ) : (
              sorted.map((row) => (
                <tr
                  key={row.localId || row.id}
                  style={{
                    borderLeft: `5px solid ${
                      COLORS[row.confirmation_status] || "#CBD5E1"
                    }`,
                  }}
                >
                  <td>{row.time || "Missing time"}</td>
                  <td>{row.patient_name}</td>
                  <td>{row.file_number || "Not matched"}</td>

                  <td>
                    <span
                      className="csu-status-badge"
                      style={{
                        background:
                          COLORS[row.confirmation_status] || "#E2E8F0",
                      }}
                    >
                      {label(row.confirmation_status)}
                    </span>
                  </td>

                  <td>
                    <span className={`csu-type ${row.appointment_type}`}>
                      {row.appointment_type === "evaluation"
                        ? "Evaluation"
                        : "Follow-up"}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`csu-approval-badge ${
                        row.approval_status || "pending"
                      }`}
                    >
                      {label(row.approval_status || "pending")}
                    </span>
                  </td>

                  <td>
                    <div className="csu-row-actions">
                      <button
                        type="button"
                        className="csu-secondary"
                        disabled={busy}
                        onClick={() => editAppointment?.(row)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="csu-secondary"
                        onClick={() => openDetails?.(row)}
                      >
                        Details
                      </button>

                      {row.isNew && (
                        <button
                          type="button"
                          className="csu-remove"
                          disabled={busy}
                          onClick={() => removeDraftAppointment?.(row)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {loadedSchedule && (
        <p className="csu-note">
          Existing appointments loaded from Django.
        </p>
      )}
    </section>
  );
}

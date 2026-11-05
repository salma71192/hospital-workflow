
import React from "react";

const STATUSES = [
  ["unconfirmed", "Unconfirmed"],
  ["confirmed", "Confirmed"],
  ["no_answer", "No Answer"],
  ["phone_off", "Phone Off"],
  ["cancelled", "Cancelled"],
  ["rescheduled", "Rescheduled"],
];

export default function AppointmentEditor({
  appointment,
  setAppointment,
  therapistName,
  date,
  saving = false,
  onFindPatient,
  onSave,
  onClose,
}) {
  if (!appointment) return null;

  const update = (field, value) => {
    const next = {
      ...appointment,
      [field]: value,
      isDirty: true,
    };

    if (field === "patient_name") {
      next.patient_id = null;
      next.file_number = "";
      next.matched = false;
    }

    if (
      field === "confirmation_status" &&
      value !== "rescheduled"
    ) {
      next.rescheduled_to_date = "";
      next.rescheduled_to_time = "";
    }

    setAppointment(next);
  };

  return (
    <div className="csu-modal-backdrop">
      <div
        className="csu-modal csu-modal-wide"
        role="dialog"
        aria-modal="true"
        aria-label="Edit appointment"
      >
        <div className="csu-section-header">
          <h3>
            {appointment.id
              ? "Edit Appointment"
              : "Create Appointment"}
          </h3>

          <button
            type="button"
            className="csu-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <p className="csu-note">
          Therapist: <strong>{therapistName}</strong>
          {" · "}
          Date: <strong>{date}</strong>
        </p>

        <div className="csu-editor-grid">
          <label>
            Patient Name
            <input
              value={appointment.patient_name || ""}
              disabled={saving}
              onChange={(e) =>
                update("patient_name", e.target.value)
              }
            />
          </label>

          <label>
            Hospital File Number
            <div className="csu-inline-input">
              <input
                value={appointment.file_number || ""}
                disabled
                placeholder="Not matched"
              />

              <button
                type="button"
                className="csu-secondary"
                disabled={saving}
                onClick={onFindPatient}
              >
                Find
              </button>
            </div>
          </label>

          <label>
            Appointment Time
            <input
              type="time"
              value={appointment.time || ""}
              disabled={saving}
              onChange={(e) =>
                update("time", e.target.value)
              }
            />
          </label>

          <label>
            Confirmation Status
            <select
              value={appointment.confirmation_status || "unconfirmed"}
              disabled={saving}
              onChange={(e) =>
                update("confirmation_status", e.target.value)
              }
            >
              {STATUSES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Appointment Type
            <select
              value={appointment.appointment_type || "followup"}
              disabled={saving}
              onChange={(e) =>
                update("appointment_type", e.target.value)
              }
            >
              <option value="followup">Follow-up</option>
              <option value="evaluation">Evaluation</option>
            </select>
          </label>

          <label>
            Source
            <input
              value={appointment.source || "manual"}
              disabled
            />
          </label>

          {appointment.confirmation_status === "rescheduled" && (
            <>
              <label>
                New Date
                <input
                  type="date"
                  value={appointment.rescheduled_to_date || ""}
                  disabled={saving}
                  onChange={(e) =>
                    update("rescheduled_to_date", e.target.value)
                  }
                />
              </label>

              <label>
                New Time
                <input
                  type="time"
                  value={appointment.rescheduled_to_time || ""}
                  disabled={saving}
                  onChange={(e) =>
                    update("rescheduled_to_time", e.target.value)
                  }
                />
              </label>
            </>
          )}

          <label className="csu-full-width">
            Notes
            <textarea
              rows={3}
              value={appointment.notes || ""}
              disabled={saving}
              onChange={(e) =>
                update("notes", e.target.value)
              }
            />
          </label>
        </div>

        <div className="csu-actions">
          <button
            type="button"
            className="csu-primary"
            disabled={saving}
            onClick={onSave}
          >
            Apply Changes
          </button>

          <button
            type="button"
            className="csu-secondary"
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>

        <p className="csu-note">
          Apply Changes updates the draft only.
          Select Save Changes to save to Django.
        </p>
      </div>
    </div>
  );
}


import React, { useMemo } from "react";
import {
  formatTime12,
  parseExcelTime,
} from "./excelImportRules";

// ============================================================
// CONFIGURATION
// ============================================================

const STATUS_INFO = {
  unconfirmed: {
    label: "Unconfirmed",
    icon: "◷",
  },
  confirmed: {
    label: "Confirmed",
    icon: "✓",
  },
  no_answer: {
    label: "No Answer",
    icon: "◷",
  },
  phone_off: {
    label: "Phone Off",
    icon: "◷",
  },
  cancelled: {
    label: "Cancelled",
    icon: "✕",
  },
  rescheduled: {
    label: "Rescheduled",
    icon: "↻",
  },
};

const APPROVAL_LABELS = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
  denied: "Denied",
  expired: "Expired",
  unknown: "Not Verified",
  not_verified: "Not Verified",
};

const pad = (value) =>
  String(value).padStart(2, "0");

const clean = (value) =>
  String(value ?? "").trim();

const label = (value) =>
  clean(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );

// ============================================================
// APPOINTMENT HELPERS
// ============================================================

function getTime(row) {
  return parseExcelTime(
    row.time ?? row.appointment_time
  );
}

function getStatus(row) {
  const status = clean(
    row.confirmation_status ||
      row.status ||
      "unconfirmed"
  ).toLowerCase();

  return STATUS_INFO[status]
    ? status
    : "unconfirmed";
}

// Do not infer claims approval from appointment
// confirmation or assign "approved" automatically.
//
// Prefer the approval status returned by Django.
// If no approval has been verified, show Not Verified.

function getApproval(row) {
  const candidates = [
    row.claim_approval_status,
    row.insurance_approval_status,
    row.approval_status,
  ];

  const actual = candidates.find(
    (value) =>
      value !== null &&
      value !== undefined &&
      clean(value) !== ""
  );

  if (actual === undefined) {
    return "unknown";
  }

  const normalized = clean(actual)
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  return normalized || "unknown";
}

function getTherapistName(
  row,
  therapistOptions = []
) {
  const rawTherapist =
    row.therapist ??
    row.therapist_id ??
    "";

  const directName =
    row.therapist_name ||
    row.physiotherapist_name ||
    row.assigned_therapist_name ||
    row.import_therapist ||
    row.excel_therapist_name ||
    "";

  if (
    rawTherapist &&
    typeof rawTherapist === "object"
  ) {
    const objectName =
      rawTherapist.full_name ||
      rawTherapist.label ||
      rawTherapist.name ||
      [
        rawTherapist.first_name,
        rawTherapist.last_name,
      ]
        .filter(Boolean)
        .join(" ");

    if (objectName) {
      return clean(objectName);
    }
  }

  const therapistId =
    typeof rawTherapist === "object"
      ? rawTherapist?.id ??
        rawTherapist?.value
      : rawTherapist;

  const matched = therapistOptions.find(
    (option) =>
      String(
        option.value ??
          option.id ??
          option.username ??
          ""
      ) === String(therapistId ?? "")
  );

  if (matched) {
    return clean(
      matched.label ||
        matched.full_name ||
        matched.name ||
        directName
    );
  }

  if (directName) {
    return clean(directName);
  }

  if (
    typeof therapistId === "string" &&
    therapistId.trim() &&
    !/^\d+$/.test(therapistId)
  ) {
    return therapistId.trim();
  }

  return "Unassigned";
}

function getAppointmentType(row) {
  return row.appointment_type ===
    "evaluation"
    ? "Evaluation"
    : "Follow-up";
}

// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  label: title,
  value,
  type,
  icon,
}) {
  return (
    <div
      className={`st-summary-card st-summary-${type}`}
    >
      <div className="st-summary-icon">
        {icon}
      </div>

      <div className="st-summary-content">
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

// ============================================================
// THERAPIST DISPLAY
// ============================================================

function TherapistDisplay({ name }) {
  const assigned =
    name !== "Unassigned";

  return (
    <div className="st-therapist">
      <span className="st-therapist-avatar">
        {assigned
          ? name.charAt(0).toUpperCase()
          : "?"}
      </span>

      <div className="st-therapist-content">
        <strong>{name}</strong>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ScheduleTable({
  appointments = [],
  therapistOptions = [],
  busy = false,
  saving = false,
  changedCount = 0,
  loadedSchedule = false,
  saveAppointments,
  editAppointment,
  openDetails,
  removeDraftAppointment,
}) {
  // ----------------------------------------------------------
  // SORT APPOINTMENTS
  // ----------------------------------------------------------

  const sorted = useMemo(() => {
    return [...appointments].sort(
      (a, b) => {
        const aTime =
          getTime(a) || "99:99";

        const bTime =
          getTime(b) || "99:99";

        return aTime.localeCompare(
          bTime
        );
      }
    );
  }, [appointments]);

  // ----------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------

  const summary = useMemo(() => {
    const count = (status) =>
      appointments.filter(
        (row) =>
          getStatus(row) === status
      ).length;

    return {
      total: appointments.length,
      confirmed: count("confirmed"),
      unconfirmed: count("unconfirmed"),
      rescheduled: count("rescheduled"),
      cancelled: count("cancelled"),
      no_answer: count("no_answer"),
      phone_off: count("phone_off"),

      missingTime:
        appointments.filter(
          (row) => !getTime(row)
        ).length,

      unassigned:
        appointments.filter(
          (row) =>
            getTherapistName(
              row,
              therapistOptions
            ) === "Unassigned"
        ).length,
    };
  }, [
    appointments,
    therapistOptions,
  ]);

  // ----------------------------------------------------------
  // SAVE
  // ----------------------------------------------------------

  const handleSave = () => {
    if (
      busy ||
      saving ||
      !changedCount ||
      typeof saveAppointments !==
        "function"
    ) {
      return;
    }

    // Parent handles the Django request.
    // Parent must clear appointments only
    // after all records save successfully.
    saveAppointments();
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section className="st-schedule">
      {/* HEADER */}

      <header className="st-header">
        <div className="st-heading-left">
          <div className="st-heading-icon">
            ▦
          </div>

          <div>
            <h2>
              Therapist Appointments
            </h2>

            <p>
              Manage appointments,
              confirmations, approvals
              and patient records
            </p>
          </div>
        </div>

        <div className="st-header-actions">
          <div className="st-header-pill">
            <span className="st-live-dot" />

            {summary.total} Appointments
          </div>

          <button
            type="button"
            className="st-save-button"
            disabled={
              busy ||
              saving ||
              !changedCount
            }
            onClick={handleSave}
          >
            {saving
              ? "Saving..."
              : `Save Changes (${changedCount})`}
          </button>
        </div>
      </header>

      {/* SUMMARY CARDS */}

      <div className="st-summary-grid">
        <SummaryCard
          label="Total Booked"
          value={summary.total}
          type="total"
          icon="▦"
        />

        <SummaryCard
          label="Confirmed"
          value={summary.confirmed}
          type="confirmed"
          icon="✓"
        />

        <SummaryCard
          label="Unconfirmed"
          value={summary.unconfirmed}
          type="unconfirmed"
          icon="◷"
        />

        <SummaryCard
          label="Rescheduled"
          value={summary.rescheduled}
          type="rescheduled"
          icon="↻"
        />

        <SummaryCard
          label="Cancelled"
          value={summary.cancelled}
          type="cancelled"
          icon="✕"
        />
      </div>

      {/* VALIDATION WARNINGS */}

      {summary.missingTime > 0 && (
        <div className="st-warning-banner">
          <span className="st-warning-icon">
            !
          </span>

          <div>
            <strong>
              {summary.missingTime} appointments
              need a valid time
            </strong>

            <p>
              Edit these appointments
              before saving.
            </p>
          </div>
        </div>
      )}

      {summary.unassigned > 0 && (
        <div className="st-warning-banner">
          <span className="st-warning-icon">
            !
          </span>

          <div>
            <strong>
              {summary.unassigned} appointments
              have no therapist assignment
            </strong>

            <p>
              Select a registered
              physiotherapist before saving.
            </p>
          </div>
        </div>
      )}

      {/* TABLE HEADING */}

      <div className="st-table-heading">
        <div>
          <h3>
            Appointment Schedule
          </h3>

          <span>
            Earliest appointments first
          </span>
        </div>

        <div className="st-sort-badge">
          ↑ Time: Earliest First
        </div>
      </div>

      {/* TABLE */}

      <div className="st-table-scroll">
        <table className="st-table">
          <thead>
            <tr>
              <th>
                Appointment Time
              </th>

              <th>
                Patient Details
              </th>

              <th>
                Therapist
              </th>

              <th>
                Confirmation Status
              </th>

              <th>
                Type
              </th>

              <th>
                Claims Approval
              </th>

              <th>
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="st-empty"
                >
                  No appointments loaded.
                </td>
              </tr>
            ) : (
              sorted.map(
                (row, index) => {
                  const time =
                    getTime(row);

                  const status =
                    getStatus(row);

                  const statusInfo =
                    STATUS_INFO[status];

                  const approval =
                    getApproval(row);

                  const therapistName =
                    getTherapistName(
                      row,
                      therapistOptions
                    );

                  return (
                    <tr
                      key={
                        row.localId ||
                        row.id ||
                        `${row.patient_name}-${index}`
                      }
                    >
                      {/* TIME */}

                      <td>
                        <div className="st-time-cell">
                          <span className="st-row-index">
                            {pad(index + 1)}
                          </span>

                          <span
                            className={
                              time
                                ? "st-time-value"
                                : "st-time-value st-time-missing"
                            }
                          >
                            <span className="st-clock-icon">
                              ◷
                            </span>

                            {time
                              ? formatTime12(
                                  time
                                )
                              : "Missing time"}
                          </span>
                        </div>
                      </td>

                      {/* PATIENT */}

                      <td>
                        <div className="st-patient">
                          <strong>
                            {row.patient_name ||
                              "Unnamed patient"}
                          </strong>

                          <span>
                            File No.{" "}
                            <b>
                              {row.file_number ||
                                "Not matched"}
                            </b>
                          </span>
                        </div>
                      </td>

                      {/* THERAPIST */}

                      <td>
                        <TherapistDisplay
                          name={
                            therapistName
                          }
                        />
                      </td>

                      {/* STATUS */}

                      <td>
                        <div
                          className={`st-status-wrapper st-status-${status}`}
                        >
                          <span className="st-status-icon">
                            {statusInfo.icon}
                          </span>

                          <strong>
                            {statusInfo.label}
                          </strong>
                        </div>
                      </td>

                      {/* TYPE */}

                      <td>
                        <span
                          className={`st-type ${
                            row.appointment_type ===
                            "evaluation"
                              ? "st-type-evaluation"
                              : "st-type-followup"
                          }`}
                        >
                          {getAppointmentType(
                            row
                          )}
                        </span>
                      </td>

                      {/* APPROVAL */}

                      <td>
                        <span
                          className={`st-approval st-approval-${approval}`}
                        >
                          <span className="st-approval-dot" />

                          {APPROVAL_LABELS[
                            approval
                          ] ||
                            label(approval)}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td>
                        <div className="st-row-actions">
                          <button
                            type="button"
                            className="st-action-edit"
                            disabled={busy}
                            onClick={() =>
                              editAppointment?.(
                                row
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="st-action-details"
                            onClick={() =>
                              openDetails?.(
                                row
                              )
                            }
                          >
                            Details
                          </button>

                          {row.isNew && (
                            <button
                              type="button"
                              className="st-action-remove"
                              disabled={busy}
                              onClick={() =>
                                removeDraftAppointment?.(
                                  row
                                )
                              }
                            >
                              ✕ Remove
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }
              )
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}

      <footer className="st-footer">
        <div className="st-footer-note">
          <strong>
            {changedCount > 0
              ? `${changedCount} unsaved changes`
              : "Appointment schedule"}
          </strong>

          <span>
            {loadedSchedule
              ? "Saved appointments are available in Django."
              : "Appointments are saved after selecting Save Changes."}
          </span>
        </div>

        <button
          type="button"
          className="st-footer-save"
          disabled={
            busy ||
            saving ||
            !changedCount
          }
          onClick={handleSave}
        >
          {saving
            ? "Saving..."
            : `Save Changes (${changedCount})`}
        </button>
      </footer>

      {/* STYLES */}

      <style>{`
        .st-schedule {
          --st-blue: #2563eb;
          --st-dark: #132341;
          --st-muted: #66758d;
          --st-border: #e5eaf3;
          background: #ffffff;
          border: 1px solid var(--st-border);
          border-radius: 20px;
          overflow: hidden;
          font-family: Inter, system-ui,
            -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
          box-shadow: 0 8px 35px
            rgba(28,49,92,.07);
        }

        .st-schedule * {
          box-sizing: border-box;
        }

        .st-header {
          padding: 25px 28px;
          background: linear-gradient(
            115deg,
            #132e6a 0%,
            #2456b8 60%,
            #3879e7 100%
          );
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .st-heading-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .st-heading-icon {
          display: grid;
          place-items: center;
          width: 48px;
          height: 48px;
          border-radius: 13px;
          background: rgba(255,255,255,.17);
          color: white;
          font-size: 27px;
          font-weight: 900;
        }

        .st-header h2 {
          margin: 0 0 5px;
          font-size: 23px;
          color: white;
          font-weight: 850;
          letter-spacing: -.6px;
        }

        .st-header p {
          margin: 0;
          font-size: 13px;
          color: #dce8ff;
          font-weight: 500;
        }

        .st-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .st-header-pill {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 10px 15px;
          border: 1px solid rgba(255,255,255,.25);
          border-radius: 999px;
          background: rgba(255,255,255,.16);
          color: white;
          font-size: 13px;
          font-weight: 800;
        }

        .st-live-dot {
          width: 9px;
          height: 9px;
          background: #6fffc4;
          border-radius: 50%;
          box-shadow: 0 0 0 4px
            rgba(111,255,196,.18);
        }

        .st-save-button {
          padding: 11px 17px;
          border: none;
          border-radius: 10px;
          background: white;
          color: #2457cb;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
        }

        .st-save-button:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .st-summary-grid {
          display: grid;
          grid-template-columns:
            repeat(5,minmax(0,1fr));
          gap: 13px;
          padding: 23px 25px;
          background: #f8faff;
        }

        .st-summary-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 15px 13px;
          border: 1px solid #e8edf6;
          border-radius: 14px;
          background: white;
          box-shadow: 0 3px 12px
            rgba(30,50,90,.035);
        }

        .st-summary-icon {
          width: 40px;
          height: 40px;
          border-radius: 11px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          font-size: 21px;
          font-weight: 900;
        }

        .st-summary-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .st-summary-content span {
          color: #687791;
          font-size: 11px;
          font-weight: 700;
        }

        .st-summary-content strong {
          color: #14233d;
          font-size: 25px;
          font-weight: 900;
        }

        .st-summary-total .st-summary-icon {
          background: #eaf0ff;
          color: #2457df;
        }

        .st-summary-confirmed .st-summary-icon {
          background: #d9fbea;
          color: #059669;
        }

        .st-summary-unconfirmed .st-summary-icon {
          background: #fff0d2;
          color: #e58b09;
        }

        .st-summary-rescheduled .st-summary-icon {
          background: #efe5ff;
          color: #7c3aed;
        }

        .st-summary-cancelled .st-summary-icon {
          background: #ffe4e8;
          color: #e11d48;
        }

        .st-warning-banner {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin: 20px 25px 0;
          padding: 15px;
          border-radius: 12px;
          background: #fff8e9;
          border: 1px solid #ffe1a4;
        }

        .st-warning-icon {
          display: grid;
          place-items: center;
          width: 27px;
          height: 27px;
          border-radius: 50%;
          background: #f59e0b;
          color: white;
          font-weight: 900;
          flex-shrink: 0;
        }

        .st-warning-banner strong {
          color: #995500;
          font-size: 13px;
          font-weight: 850;
        }

        .st-warning-banner p {
          margin: 5px 0 0;
          color: #a16d22;
          font-size: 12px;
          line-height: 1.5;
        }

        .st-table-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          padding: 21px 26px 15px;
        }

        .st-table-heading h3 {
          margin: 0 0 5px;
          font-size: 17px;
          font-weight: 850;
          color: #162641;
        }

        .st-table-heading span {
          font-size: 12px;
          color: #7b879b;
        }

        .st-sort-badge {
          padding: 8px 12px;
          border-radius: 8px;
          background: #eaf1ff;
          color: #2457cb;
          font-size: 11px;
          font-weight: 800;
        }

        .st-table-scroll {
          width: 100%;
          overflow-x: auto;
          padding: 0 22px 18px;
        }

        .st-table {
          width: 100%;
          min-width: 1200px;
          border-collapse: separate;
          border-spacing: 0;
        }

        .st-table thead th {
          padding: 14px 13px;
          text-align: left;
          background: #f0f5fd;
          color: #415575;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .55px;
          font-weight: 850;
          border-bottom: 2px solid #dfe8f7;
        }

        .st-table tbody td {
          padding: 15px 12px;
          border-bottom: 1px solid #edf1f7;
          vertical-align: middle;
        }

        .st-table tbody tr:nth-child(even) {
          background: #fafcff;
        }

        .st-table tbody tr:hover {
          background: #edf5ff;
        }

        .st-time-cell {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .st-row-index {
          display: grid;
          place-items: center;
          width: 25px;
          height: 25px;
          border-radius: 7px;
          background: #e8efff;
          color: #2457d8;
          font-size: 11px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .st-time-value {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 10px 12px;
          border-radius: 11px;
          background: #eef4ff;
          border: 1.5px solid #b9cffd;
          color: #174bb9;
          font-size: 13px;
          font-weight: 900;
          white-space: nowrap;
        }

        .st-time-missing {
          background: #fff1f2;
          border-color: #fecdd3;
          color: #be123c;
        }

        .st-clock-icon {
          font-size: 17px;
        }

        .st-patient {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .st-patient > strong {
          color: #172844;
          font-size: 13px;
          font-weight: 850;
        }

        .st-patient > span {
          color: #7a89a2;
          font-size: 11px;
          font-weight: 600;
        }

        .st-patient b {
          color: #3466c5;
          font-weight: 850;
        }

        .st-therapist {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 180px;
        }

        .st-therapist-avatar {
          display: grid;
          place-items: center;
          width: 32px;
          height: 32px;
          flex-shrink: 0;
          border-radius: 10px;
          background: #e9e5ff;
          color: #6542d3;
          font-weight: 900;
          font-size: 13px;
        }

        .st-therapist-content {
          display: flex;
          align-items: center;
          min-width: 0;
        }

        .st-therapist-content strong {
          color: #34445f;
          font-size: 12px;
          font-weight: 800;
        }

        .st-status-wrapper {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border-radius: 9px;
          padding: 10px 12px;
          border: 1px solid transparent;
          font-size: 12px;
          white-space: nowrap;
        }

        .st-status-icon {
          font-size: 16px;
          font-weight: 900;
        }

        .st-status-unconfirmed,
        .st-status-no_answer {
          background: #fff1d6;
          border-color: #ffdc9b;
          color: #a65b00;
        }

        .st-status-confirmed {
          background: #d9fae9;
          border-color: #a8edca;
          color: #087b4c;
        }

        .st-status-cancelled {
          background: #ffe3e9;
          border-color: #ffb9c8;
          color: #c41e49;
        }

        .st-status-rescheduled {
          background: #ece3ff;
          border-color: #d5c1ff;
          color: #6936bf;
        }

        .st-status-phone_off {
          background: #e2e8f0;
          border-color: #cbd5e1;
          color: #475569;
        }

        .st-type {
          display: inline-flex;
          align-items: center;
          padding: 8px 11px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 850;
          white-space: nowrap;
        }

        .st-type-evaluation {
          background: #e0e7ff;
          color: #4338ca;
        }

        .st-type-followup {
          background: #e0f2fe;
          color: #0369a1;
        }

        .st-approval {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border-radius: 999px;
          padding: 8px 12px;
          background: #eef2f7;
          color: #64748b;
          font-size: 11px;
          font-weight: 850;
          white-space: nowrap;
        }

        .st-approval-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: currentColor;
        }

        .st-approval-approved {
          background: #d9fae9;
          color: #047857;
        }

        .st-approval-pending {
          background: #fff0cc;
          color: #b77900;
        }

        .st-approval-rejected,
        .st-approval-denied,
        .st-approval-expired {
          background: #ffe3e9;
          color: #be123c;
        }

        .st-row-actions {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-wrap: wrap;
        }

        .st-row-actions button {
          border-radius: 9px;
          padding: 9px 12px;
          font-size: 11px;
          font-weight: 850;
          cursor: pointer;
          white-space: nowrap;
        }

        .st-action-edit {
          border: 1px solid #bfdbfe;
          background: #eff6ff;
          color: #1d4ed8;
        }

        .st-action-details {
          border: 1px solid #cbd5e1;
          background: white;
          color: #475569;
        }

        .st-action-remove {
          border: 1px solid #ffc5cf;
          background: #fff1f3;
          color: #d21f48;
        }

        .st-row-actions button:hover:not(:disabled) {
          filter: brightness(.96);
        }

        .st-row-actions button:disabled {
          opacity: .4;
          cursor: not-allowed;
        }

        .st-empty {
          text-align: center;
          padding: 35px !important;
          color: #94a3b8;
          font-size: 13px;
          font-weight: 700;
        }

        .st-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          flex-wrap: wrap;
          padding: 20px 25px;
          background: #f8faff;
          border-top: 1px solid #e7edf8;
        }

        .st-footer-note {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .st-footer-note strong {
          color: #213455;
          font-size: 13px;
          font-weight: 850;
        }

        .st-footer-note span {
          color: #7a89a1;
          font-size: 11px;
        }

        .st-footer-save {
          border: none;
          border-radius: 10px;
          padding: 12px 18px;
          background: linear-gradient(
            110deg,
            #2457d8,
            #387cf2
          );
          color: white;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
          box-shadow: 0 5px 13px
            rgba(37,99,235,.2);
        }

        .st-footer-save:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        @media (max-width: 1100px) {
          .st-summary-grid {
            grid-template-columns:
              repeat(3,minmax(0,1fr));
          }
        }

        @media (max-width: 650px) {
          .st-header {
            padding: 20px 16px;
          }

          .st-header h2 {
            font-size: 19px;
          }

          .st-summary-grid {
            grid-template-columns:
              repeat(2,minmax(0,1fr));
            padding: 15px;
          }

          .st-table-heading {
            padding: 18px 15px;
          }

          .st-table-scroll {
            padding: 0 10px 15px;
          }

          .st-footer {
            padding: 16px;
          }

          .st-footer-save {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}

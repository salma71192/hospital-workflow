
import React, { useMemo, useState } from "react";
import { parseExcelTime } from "./excelImportRules";

// ============================================================
// CONFIGURATION
// ============================================================

const STATUS_OPTIONS = [
  { value: "unconfirmed", label: "Unconfirmed" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rescheduled", label: "Rescheduled" },
];

const STATUS_INFO = {
  unconfirmed: {
    label: "Unconfirmed",
    icon: "◷",
  },
  confirmed: {
    label: "Confirmed",
    icon: "✓",
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

function getApproval(row) {
  const values = [
    row.claim_approval_status,
    row.insurance_approval_status,
    row.approval_status,
  ];

  const selected = values.find(
    (value) =>
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ""
  );

  return String(selected ?? "unknown")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function approvalLabel(value) {
  return (
    APPROVAL_LABELS[value] ||
    String(value)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      )
  );
}

// ============================================================
// TIME EDITOR
// ============================================================

function TimeEditor({
  value,
  onChange,
  disabled,
  label,
}) {
  const normalized = parseExcelTime(value);

  const valid =
    /^([01]\d|2[0-3]):[0-5]\d$/.test(
      normalized
    );

  const [hours, minutes] = valid
    ? normalized.split(":").map(Number)
    : [9, 0];

  const hour12 = pad(
    hours % 12 || 12
  );

  const period =
    hours >= 12 ? "PM" : "AM";

  const update = (
    hour,
    minute,
    meridiem
  ) => {
    const convertedHour =
      (Number(hour) % 12) +
      (meridiem === "PM" ? 12 : 0);

    onChange(
      `${pad(convertedHour)}:${pad(minute)}`
    );
  };

  return (
    <div className="sp-time-editor">
      <span
        className="sp-clock-icon"
        aria-hidden="true"
      >
        ◷
      </span>

      <select
        value={hour12}
        disabled={disabled}
        aria-label={`${label} hour`}
        onChange={(event) =>
          update(
            event.target.value,
            minutes,
            period
          )
        }
      >
        {Array.from(
          { length: 12 },
          (_, i) => pad(i + 1)
        ).map((hour) => (
          <option
            key={hour}
            value={hour}
          >
            {hour}
          </option>
        ))}
      </select>

      <span className="sp-time-colon">
        :
      </span>

      <select
        value={pad(minutes)}
        disabled={disabled}
        aria-label={`${label} minute`}
        onChange={(event) =>
          update(
            hour12,
            event.target.value,
            period
          )
        }
      >
        {Array.from(
          { length: 60 },
          (_, i) => pad(i)
        ).map((minute) => (
          <option
            key={minute}
            value={minute}
          >
            {minute}
          </option>
        ))}
      </select>

      <select
        className="sp-period-select"
        value={period}
        disabled={disabled}
        aria-label={`${label} AM or PM`}
        onChange={(event) =>
          update(
            hour12,
            minutes,
            event.target.value
          )
        }
      >
        <option value="AM">
          AM
        </option>

        <option value="PM">
          PM
        </option>
      </select>

      {!valid && (
        <span
          className="sp-time-error"
          title="Set a valid time"
        >
          !
        </span>
      )}
    </div>
  );
}

// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  label,
  value,
  type,
  icon,
}) {
  return (
    <div
      className={`sp-summary-card sp-summary-${type}`}
    >
      <div className="sp-summary-icon">
        {icon}
      </div>

      <div className="sp-summary-content">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function SchedulePreview({
  importPreview = [],
  importWarnings = [],
  importSkipped = 0,
  skippedRows,
  busy = false,
  therapistOptions = [],
  updateImportPreviewRow,
  removeImportPreviewRow,
  addPreviewToDraft,
  cancelPreview,
}) {
  const [
    showWarnings,
    setShowWarnings,
  ] = useState(false);

  // ----------------------------------------------------------
  // SORT ROWS
  // ----------------------------------------------------------

  const rows = useMemo(() => {
    return [...importPreview].sort(
      (a, b) => {
        const aTime =
          parseExcelTime(a.time) ||
          "99:99";

        const bTime =
          parseExcelTime(b.time) ||
          "99:99";

        return aTime.localeCompare(
          bTime
        );
      }
    );
  }, [importPreview]);

  // ----------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------

  const summary = useMemo(() => {
    const count = (status) =>
      rows.filter(
        (row) =>
          (
            row.confirmation_status ||
            "unconfirmed"
          ) === status
      ).length;

    return {
      total: rows.length,
      unconfirmed:
        count("unconfirmed"),
      confirmed:
        count("confirmed"),
      cancelled:
        count("cancelled"),
      rescheduled:
        count("rescheduled"),
    };
  }, [rows]);

  const skipped =
    skippedRows ?? importSkipped;

  // ----------------------------------------------------------
  // ACTIONS
  // ----------------------------------------------------------

  const update = (
    row,
    field,
    value
  ) => {
    updateImportPreviewRow?.(
      row.localId,
      field,
      value
    );
  };

  const remove = (row) => {
    removeImportPreviewRow?.(
      row.localId
    );
  };

  const handleAddToDraft = () => {
    if (
      busy ||
      rows.length === 0 ||
      typeof addPreviewToDraft !==
        "function"
    ) {
      return;
    }

    // The parent owns both tables.
    //
    // On successful draft creation, the
    // parent moves these appointments into
    // its appointments state and clears
    // importPreview.
    //
    // Clearing importPreview automatically
    // hides this component.

    addPreviewToDraft();
  };

  // ==========================================================
  // IMPORTANT:
  // HIDE PREVIEW AFTER ADDING TO DRAFT
  // ==========================================================

  // Do not keep this component visible
  // merely because warnings remain.
  //
  // The parent clears importPreview after
  // successfully adding the appointments
  // to the Therapist Appointments table.

  if (rows.length === 0) {
    return null;
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section className="sp-preview">
      {/* HEADER */}

      <header className="sp-header">
        <div className="sp-heading-left">
          <div className="sp-heading-icon">
            ▦
          </div>

          <div>
            <h2>
              Appointment Preview
            </h2>

            <p>
              Review, edit and organize
              imported appointments
            </p>
          </div>
        </div>

        <div className="sp-header-pill">
          <span className="sp-live-dot" />

          {summary.total} Appointments
        </div>
      </header>

      {/* SUMMARY CARDS */}

      <div className="sp-summary-grid">
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

      {/* TABLE HEADING */}

      <div className="sp-table-heading">
        <div>
          <h3>
            Imported Schedule
          </h3>

          <span>
            Earliest appointments first ·
            Edit times and status
          </span>
        </div>

        <div className="sp-sort-badge">
          ↑ Time: Earliest First
        </div>
      </div>

      {/* TABLE */}

      <div className="sp-table-scroll">
        <table className="sp-table">
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
                Claims Approval
              </th>

              <th>
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map(
              (row, index) => {
                const status =
                  row.confirmation_status ||
                  "unconfirmed";

                const approval =
                  getApproval(row);

                const statusInfo =
                  STATUS_INFO[status] ||
                  STATUS_INFO.unconfirmed;

                const selectedTherapist =
                  therapistOptions.find(
                    (option) =>
                      String(option.value) ===
                      String(
                        row.therapist_id ??
                        row.therapist ??
                        ""
                      )
                  );

                const therapistName =
                  selectedTherapist?.label ||
                  row.therapist_name ||
                  row.excel_therapist_name ||
                  "Unassigned";

                return (
                  <tr
                    key={
                      row.localId ||
                      `${row.patient_name}-${index}`
                    }
                  >
                    {/* TIME */}

                    <td>
                      <div className="sp-time-cell">
                        <span className="sp-row-index">
                          {pad(index + 1)}
                        </span>

                        <TimeEditor
                          value={row.time}
                          disabled={busy}
                          label={`Time for ${row.patient_name}`}
                          onChange={(value) =>
                            update(
                              row,
                              "time",
                              value
                            )
                          }
                        />
                      </div>
                    </td>

                    {/* PATIENT */}

                    <td>
                      <div className="sp-patient">
                        <strong>
                          {row.patient_name ||
                            "Unnamed patient"}
                        </strong>

                        <span>
                          File No.{" "}
                          <b>
                            {row.file_number ||
                              "—"}
                          </b>
                        </span>
                      </div>
                    </td>

                    {/* THERAPIST */}

                    <td>
                      <div className="sp-therapist">
                        <span className="sp-therapist-avatar">
                          {String(
                            therapistName
                          )
                            .trim()
                            .charAt(0)
                            .toUpperCase()}
                        </span>

                        <strong>
                          {therapistName}
                        </strong>
                      </div>
                    </td>

                    {/* STATUS */}

                    <td>
                      <div
                        className={`sp-status-wrapper sp-status-${status}`}
                      >
                        <span className="sp-status-icon">
                          {statusInfo.icon}
                        </span>

                        <select
                          value={status}
                          disabled={busy}
                          aria-label={`Confirmation for ${row.patient_name}`}
                          onChange={(event) =>
                            update(
                              row,
                              "confirmation_status",
                              event.target.value
                            )
                          }
                        >
                          {STATUS_OPTIONS.map(
                            (option) => (
                              <option
                                key={
                                  option.value
                                }
                                value={
                                  option.value
                                }
                              >
                                {option.label}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </td>

                    {/* APPROVAL */}

                    <td>
                      <span
                        className={`sp-approval sp-approval-${approval}`}
                      >
                        <span className="sp-approval-dot" />

                        {approvalLabel(
                          approval
                        )}
                      </span>
                    </td>

                    {/* ACTION */}

                    <td>
                      <button
                        type="button"
                        className="sp-remove-button"
                        disabled={
                          busy ||
                          typeof removeImportPreviewRow !==
                            "function"
                        }
                        onClick={() =>
                          remove(row)
                        }
                        aria-label={`Remove ${row.patient_name}`}
                      >
                        <span aria-hidden="true">
                          ✕
                        </span>

                        Remove
                      </button>
                    </td>
                  </tr>
                );
              }
            )}
          </tbody>
        </table>
      </div>

      {/* UNCONFIRMED ALERT */}

      {summary.unconfirmed > 0 && (
        <div className="sp-alert-banner">
          <span className="sp-alert-symbol">
            !
          </span>

          <div>
            <strong>
              {summary.unconfirmed} appointments
              require confirmation
            </strong>

            <p>
              Once saved, these appointments
              should appear in the Alerts
              tab for follow-up calls.
            </p>
          </div>
        </div>
      )}

      {/* IMPORT WARNINGS */}

      {importWarnings.length > 0 && (
        <div className="sp-warning-section">
          <button
            type="button"
            className="sp-warning-toggle"
            onClick={() =>
              setShowWarnings(
                (value) => !value
              )
            }
          >
            <span>
              Import Warnings (
              {importWarnings.length})
              {skipped > 0
                ? ` · ${skipped} skipped`
                : ""}
            </span>

            <span>
              {showWarnings
                ? "−"
                : "+"}
            </span>
          </button>

          {showWarnings && (
            <ul>
              {importWarnings
                .slice(0, 30)
                .map(
                  (
                    warning,
                    index
                  ) => (
                    <li
                      key={index}
                    >
                      {warning}
                    </li>
                  )
                )}
            </ul>
          )}
        </div>
      )}

      {/* FOOTER */}

      <footer className="sp-footer">
        <div className="sp-footer-note">
          <strong>
            Ready to import?
          </strong>

          <span>
            Add to Draft to move
            appointments into the
            Therapist Appointments table.
            Save Changes will save
            them permanently.
          </span>
        </div>

        <div className="sp-footer-actions">
          {cancelPreview && (
            <button
              type="button"
              className="sp-cancel-button"
              disabled={busy}
              onClick={
                cancelPreview
              }
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            className="sp-add-button"
            disabled={
              busy ||
              rows.length === 0 ||
              typeof addPreviewToDraft !==
                "function"
            }
            onClick={
              handleAddToDraft
            }
          >
            + Add {rows.length} to Draft
          </button>
        </div>
      </footer>

      {/* STYLES */}

      <style>{`
        .sp-preview {
          --sp-blue: #2563eb;
          --sp-dark: #132341;
          --sp-muted: #66758d;
          --sp-border: #e5eaf3;
          background: #ffffff;
          border: 1px solid var(--sp-border);
          border-radius: 20px;
          overflow: hidden;
          font-family: Inter, system-ui,
            -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
          box-shadow: 0 8px 35px
            rgba(28,49,92,.07);
        }

        .sp-preview * {
          box-sizing: border-box;
        }

        .sp-header {
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

        .sp-heading-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .sp-heading-icon {
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

        .sp-header h2 {
          margin: 0 0 5px;
          font-size: 23px;
          color: white;
          font-weight: 850;
          letter-spacing: -.6px;
        }

        .sp-header p {
          margin: 0;
          font-size: 13px;
          color: #dce8ff;
          font-weight: 500;
        }

        .sp-header-pill {
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

        .sp-live-dot {
          width: 9px;
          height: 9px;
          background: #6fffc4;
          border-radius: 50%;
          box-shadow: 0 0 0 4px
            rgba(111,255,196,.18);
        }

        .sp-summary-grid {
          display: grid;
          grid-template-columns:
            repeat(5,minmax(0,1fr));
          gap: 13px;
          padding: 23px 25px;
          background: #f8faff;
        }

        .sp-summary-card {
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

        .sp-summary-icon {
          width: 40px;
          height: 40px;
          border-radius: 11px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          font-size: 21px;
          font-weight: 900;
        }

        .sp-summary-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .sp-summary-content span {
          color: #687791;
          font-size: 11px;
          font-weight: 700;
        }

        .sp-summary-content strong {
          color: #14233d;
          font-size: 25px;
          font-weight: 900;
        }

        .sp-summary-total .sp-summary-icon {
          background: #eaf0ff;
          color: #2457df;
        }

        .sp-summary-confirmed .sp-summary-icon {
          background: #d9fbea;
          color: #059669;
        }

        .sp-summary-unconfirmed .sp-summary-icon {
          background: #fff0d2;
          color: #e58b09;
        }

        .sp-summary-rescheduled .sp-summary-icon {
          background: #efe5ff;
          color: #7c3aed;
        }

        .sp-summary-cancelled .sp-summary-icon {
          background: #ffe4e8;
          color: #e11d48;
        }

        .sp-table-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          padding: 21px 26px 15px;
        }

        .sp-table-heading h3 {
          margin: 0 0 5px;
          font-size: 17px;
          font-weight: 850;
          color: #162641;
        }

        .sp-table-heading span {
          font-size: 12px;
          color: #7b879b;
        }

        .sp-sort-badge {
          padding: 8px 12px;
          border-radius: 8px;
          background: #eaf1ff;
          color: #2457cb;
          font-size: 11px;
          font-weight: 800;
        }

        .sp-table-scroll {
          width: 100%;
          overflow-x: auto;
          padding: 0 22px 18px;
        }

        .sp-table {
          width: 100%;
          min-width: 980px;
          border-collapse: separate;
          border-spacing: 0;
        }

        .sp-table thead th {
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

        .sp-table tbody td {
          padding: 15px 12px;
          border-bottom: 1px solid #edf1f7;
          vertical-align: middle;
        }

        .sp-table tbody tr:nth-child(even) {
          background: #fafcff;
        }

        .sp-table tbody tr:hover {
          background: #edf5ff;
        }

        .sp-time-cell {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .sp-row-index {
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

        .sp-time-editor {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 5px 6px;
          border-radius: 11px;
          background: #eef4ff;
          border: 1.5px solid #b9cffd;
          color: #174bb9;
          white-space: nowrap;
        }

        .sp-time-editor:focus-within {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px
            rgba(37,99,235,.12);
        }

        .sp-clock-icon {
          font-size: 19px;
          padding: 0 3px;
          font-weight: 900;
        }

        .sp-time-editor select {
          appearance: none;
          -webkit-appearance: none;
          border: none;
          outline: none;
          background: transparent;
          padding: 5px 2px;
          font-size: 14px;
          font-weight: 900;
          color: #123c91;
          cursor: pointer;
          text-align: center;
          width: auto;
          min-width: 35px;
        }

        .sp-time-colon {
          font-size: 17px;
          font-weight: 900;
        }

        .sp-time-editor .sp-period-select {
          background: #285fd0;
          color: white;
          border-radius: 6px;
          padding: 7px 8px;
          font-size: 11px;
          margin-left: 4px;
        }

        .sp-time-error {
          color: #dc2626;
          font-weight: 900;
        }

        .sp-patient {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sp-patient > strong {
          color: #172844;
          font-size: 13px;
          font-weight: 850;
          line-height: 1.4;
        }

        .sp-patient > span {
          color: #7a89a2;
          font-size: 11px;
          font-weight: 600;
        }

        .sp-patient b {
          color: #3466c5;
          font-weight: 850;
        }

        .sp-therapist {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .sp-therapist-avatar {
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

        .sp-therapist strong {
          color: #34445f;
          font-size: 12px;
          font-weight: 750;
        }

        .sp-status-wrapper {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 9px;
          padding: 5px 9px;
          border: 1px solid transparent;
        }

        .sp-status-wrapper select {
          background: transparent;
          color: inherit;
          border: none;
          outline: none;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
          padding: 4px 2px;
          width: auto;
        }

        .sp-status-icon {
          font-size: 16px;
          font-weight: 900;
        }

        .sp-status-unconfirmed {
          background: #fff1d6;
          border-color: #ffdc9b;
          color: #a65b00;
        }

        .sp-status-confirmed {
          background: #d9fae9;
          border-color: #a8edca;
          color: #087b4c;
        }

        .sp-status-cancelled {
          background: #ffe3e9;
          border-color: #ffb9c8;
          color: #c41e49;
        }

        .sp-status-rescheduled {
          background: #ece3ff;
          border-color: #d5c1ff;
          color: #6936bf;
        }

        .sp-approval {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border-radius: 999px;
          padding: 8px 12px;
          background: #eef2f7;
          color: #64748b;
          font-size: 11px;
          font-weight: 850;
          text-transform: capitalize;
        }

        .sp-approval-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: currentColor;
        }

        .sp-approval-approved {
          background: #d9fae9;
          color: #047857;
        }

        .sp-approval-pending {
          background: #fff0cc;
          color: #b77900;
        }

        .sp-approval-rejected,
        .sp-approval-denied,
        .sp-approval-expired {
          background: #ffe3e9;
          color: #be123c;
        }

        .sp-remove-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 9px 12px;
          border: 1px solid #ffc5cf;
          border-radius: 9px;
          background: #fff1f3;
          color: #d21f48;
          font-size: 11px;
          font-weight: 850;
          cursor: pointer;
        }

        .sp-remove-button:hover:not(:disabled) {
          background: #ffdbe3;
        }

        .sp-remove-button:disabled {
          opacity: .4;
          cursor: not-allowed;
        }

        .sp-alert-banner {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin: 0 25px 22px;
          padding: 15px;
          border-radius: 12px;
          background: #fff8e9;
          border: 1px solid #ffe1a4;
        }

        .sp-alert-symbol {
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

        .sp-alert-banner strong {
          display: block;
          color: #995500;
          font-size: 13px;
          font-weight: 850;
        }

        .sp-alert-banner p {
          margin: 5px 0 0;
          color: #a16d22;
          font-size: 12px;
        }

        .sp-warning-section {
          margin: 0 25px 20px;
          border: 1px solid #ffd9a0;
          border-radius: 11px;
          overflow: hidden;
        }

        .sp-warning-toggle {
          display: flex;
          justify-content: space-between;
          width: 100%;
          padding: 12px 15px;
          background: #fff8eb;
          border: none;
          color: #a56600;
          font-weight: 800;
          cursor: pointer;
        }

        .sp-warning-section ul {
          margin: 0;
          padding: 12px 30px;
          color: #805e2d;
          font-size: 12px;
        }

        .sp-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          flex-wrap: wrap;
          padding: 20px 25px;
          background: #f8faff;
          border-top: 1px solid #e7edf8;
        }

        .sp-footer-note {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .sp-footer-note strong {
          color: #213455;
          font-size: 13px;
          font-weight: 850;
        }

        .sp-footer-note span {
          color: #7a89a1;
          font-size: 11px;
        }

        .sp-footer-actions {
          display: flex;
          gap: 10px;
        }

        .sp-cancel-button,
        .sp-add-button {
          border-radius: 10px;
          padding: 12px 18px;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
        }

        .sp-cancel-button {
          border: 1px solid #d7dfed;
          background: white;
          color: #53637d;
        }

        .sp-add-button {
          border: none;
          background: linear-gradient(
            110deg,
            #2457d8,
            #387cf2
          );
          color: white;
          box-shadow: 0 5px 13px
            rgba(37,99,235,.2);
        }

        .sp-add-button:hover:not(:disabled) {
          filter: brightness(1.07);
        }

        .sp-add-button:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        @media (max-width: 1100px) {
          .sp-summary-grid {
            grid-template-columns:
              repeat(3,minmax(0,1fr));
          }
        }

        @media (max-width: 650px) {
          .sp-header {
            padding: 20px 16px;
          }

          .sp-header h2 {
            font-size: 19px;
          }

          .sp-summary-grid {
            grid-template-columns:
              repeat(2,minmax(0,1fr));
            padding: 15px;
          }

          .sp-table-heading {
            padding: 18px 15px;
          }

          .sp-table-scroll {
            padding: 0 10px 15px;
          }

          .sp-footer {
            padding: 16px;
          }

          .sp-footer-actions {
            width: 100%;
          }

          .sp-add-button {
            flex: 1;
          }
        }
      `}</style>
    </section>
  );
}

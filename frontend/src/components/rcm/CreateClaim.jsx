
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/api";

/* =========================================================
   STYLES
========================================================= */

const styles = `
.create-claim-page {
  --cc-navy: #17365d;
  --cc-primary: #4057cf;
  --cc-primary-dark: #3349bd;
  --cc-text: #263b53;
  --cc-muted: #71829a;
  --cc-border: #dce5f0;
  --cc-green: #15803d;
  --cc-red: #b91c1c;

  max-width: 1450px;
  margin: 0 auto;
  padding: 24px 12px 40px;
  color: var(--cc-text);
  font-family: inherit;
}

.create-claim-page * {
  box-sizing: border-box;
}

.create-claim-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 25px;
}

.create-claim-title {
  margin: 0;
  font-size: clamp(26px, 3vw, 36px);
  font-weight: 800;
  letter-spacing: -0.7px;
  color: var(--cc-navy);
}

.create-claim-subtitle {
  margin: 9px 0 0;
  color: var(--cc-muted);
  line-height: 1.7;
  font-size: 14px;
  max-width: 760px;
}

.create-claim-header-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 13px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4057cf;
  font-size: 12px;
  font-weight: 800;
}

.create-claim-header-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #4057cf;
}

.create-claim-card {
  padding: clamp(18px, 2.2vw, 30px);
  margin-bottom: 20px;
  border: 1px solid var(--cc-border);
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 7px 25px rgba(35, 65, 110, 0.045);
}

.create-claim-section-heading {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-bottom: 25px;
  padding-bottom: 18px;
  border-bottom: 1px solid #edf1f7;
}

.create-claim-section-number {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 13px;
  background: #eef2ff;
  color: var(--cc-primary);
  font-weight: 800;
}

.create-claim-section-title {
  margin: 0;
  font-size: 19px;
  font-weight: 800;
  color: var(--cc-navy);
}

.create-claim-section-description {
  margin: 5px 0 0;
  color: var(--cc-muted);
  font-size: 13px;
  line-height: 1.6;
}

/* =========================================================
   FORM LAYOUT
========================================================= */

.create-claim-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 26px;
  row-gap: 23px;
}

.create-claim-field {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.create-claim-field-full {
  grid-column: 1 / -1;
}

.create-claim-label {
  display: block;
  margin-bottom: 9px;
  color: #344861;
  font-size: 13px;
  font-weight: 750;
  letter-spacing: 0.1px;
}

.create-claim-required {
  color: #e05252;
  margin-left: 3px;
}

/* =========================================================
   FIELD CONTAINERS
========================================================= */

.create-claim-control {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  min-height: 52px;
  border: 1px solid #d8e2f0;
  border-radius: 12px;
  background: #fafcff;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.create-claim-control:hover:not(.is-disabled) {
  border-color: #aabbd8;
  background: #fff;
}

.create-claim-control:focus-within {
  border-color: #5268d7;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(82, 104, 215, 0.1);
}

.create-claim-control.is-readonly,
.create-claim-control.is-disabled {
  background: #f1f5fa;
  border-color: #e0e7f0;
}

.create-claim-control-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 43px;
  flex: 0 0 43px;
  color: #8194b0;
}

.create-claim-control-icon svg {
  width: 18px;
  height: 18px;
  stroke-width: 1.8;
}

.create-claim-input,
.create-claim-select,
.create-claim-search-input,
.create-claim-textarea {
  display: block;
  width: 100%;
  min-width: 0;
  min-height: 50px;
  border: 0;
  outline: 0;
  background: transparent;
  color: #233b58;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
}

.create-claim-input,
.create-claim-select,
.create-claim-search-input {
  padding: 12px 15px;
}

.create-claim-control.has-icon .create-claim-input,
.create-claim-control.has-icon .create-claim-select,
.create-claim-control.has-icon .create-claim-search-input {
  padding-left: 0;
}

.create-claim-input::placeholder,
.create-claim-search-input::placeholder,
.create-claim-textarea::placeholder {
  color: #96a7c0;
  font-weight: 400;
  opacity: 1;
}

.create-claim-input:focus,
.create-claim-select:focus,
.create-claim-search-input:focus,
.create-claim-textarea:focus {
  outline: none;
}

.create-claim-input:read-only,
.create-claim-input:disabled,
.create-claim-select:disabled,
.create-claim-search-input:read-only {
  color: #60738b;
  cursor: default;
}

.create-claim-input[type="number"] {
  font-variant-numeric: tabular-nums;
}

/* =========================================================
   DATE FIELDS - CONSISTENT ON IPAD AND DESKTOP
========================================================= */

.create-claim-date-control {
  position: relative;
  width: 100%;
  min-width: 0;
}

.create-claim-date-control .create-claim-control {
  min-height: 52px;
}

.create-claim-date-display {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  min-height: 50px;
  padding: 12px 8px 12px 0;
  color: #233b58;
  font-size: 14px;
  font-weight: 500;
  pointer-events: none;
}

.create-claim-date-display.is-empty {
  color: #96a7c0;
  font-weight: 400;
}

.create-claim-date-control .create-claim-date-native {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  min-height: 50px;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
  -webkit-appearance: none;
  appearance: none;
}

.create-claim-date-control .create-claim-date-native:disabled {
  cursor: default;
}

.create-claim-date-control
.create-claim-date-native::-webkit-calendar-picker-indicator {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.create-claim-date-trailing {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 42px;
  width: 42px;
  color: #607caa;
  pointer-events: none;
}

.create-claim-date-trailing svg {
  width: 18px;
  height: 18px;
}

/* =========================================================
   SELECT AND TEXTAREA
========================================================= */

.create-claim-select {
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  padding-right: 12px;
}

.create-claim-select-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  flex: 0 0 42px;
  pointer-events: none;
  color: #7085a3;
}

.create-claim-select-arrow svg {
  width: 17px;
  height: 17px;
}

.create-claim-textarea-control {
  border: 1px solid #d8e2f0;
  border-radius: 12px;
  background: #fafcff;
  transition: border-color .2s, box-shadow .2s;
}

.create-claim-textarea-control:focus-within {
  border-color: #5268d7;
  box-shadow: 0 0 0 4px rgba(82,104,215,.1);
  background: #fff;
}

.create-claim-textarea {
  min-height: 110px;
  padding: 14px 16px;
  resize: vertical;
  line-height: 1.7;
}

.create-claim-form-note {
  margin-top: 8px;
  color: #8291a6;
  font-size: 12px;
  line-height: 1.6;
}

/* =========================================================
   SEARCH AND RESULTS
========================================================= */

.create-claim-search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 52px;
  padding-right: 7px;
  border: 1px solid #d8e2f0;
  border-radius: 12px;
  background: #fafcff;
  transition: border-color .2s, box-shadow .2s;
}

.create-claim-search-box:focus-within {
  border-color: #5268d7;
  box-shadow: 0 0 0 4px rgba(82,104,215,.1);
  background: #fff;
}

.create-claim-search-box .create-claim-search-input {
  flex: 1;
  min-width: 0;
  padding: 10px 5px 10px 0;
}

.create-claim-search-meta {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  color: #7a8ba2;
  font-size: 12px;
}

.create-claim-results {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 14px;
  padding: 13px;
  border: 1px solid #e0e8f3;
  border-radius: 14px;
  background: #f7f9fd;
}

.create-claim-results-heading {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  padding: 5px;
  color: #526985;
  font-size: 12px;
  font-weight: 800;
}

.create-claim-result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  padding: 14px;
  border: 1px solid #e0e7f1;
  border-radius: 12px;
  background: #fff;
}

.create-claim-result.selected {
  border-color: #7d8ee7;
  background: #f4f6ff;
}

.create-claim-patient-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1 1 230px;
  min-width: 0;
}

.create-claim-avatar {
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 14px;
  background: #e9edff;
  color: #3655c8;
  font-weight: 800;
}

.create-claim-patient-details {
  min-width: 0;
}

.create-claim-patient-name {
  margin: 0;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.create-claim-patient-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 7px 12px;
  margin-top: 7px;
  color: #71829a;
  font-size: 12px;
}

.create-claim-clinician-list {
  max-height: 240px;
  overflow-y: auto;
  margin-top: 9px;
  border: 1px solid #dce5f0;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 10px 25px rgba(30, 55, 100, 0.06);
}

.create-claim-clinician-option {
  display: block;
  width: 100%;
  padding: 13px 15px;
  border: 0;
  border-bottom: 1px solid #edf1f7;
  background: #fff;
  text-align: left;
  cursor: pointer;
  color: #263b53;
}

.create-claim-clinician-option:last-child {
  border-bottom: 0;
}

.create-claim-clinician-option:hover,
.create-claim-clinician-option.active {
  background: #eef2ff;
}

.create-claim-clinician-name {
  font-size: 13px;
  font-weight: 800;
}

.create-claim-clinician-role {
  margin-top: 4px;
  color: #71829a;
  font-size: 12px;
}

/* =========================================================
   BUTTONS
========================================================= */

.create-claim-result-actions,
.create-claim-selected-actions,
.create-claim-footer-actions {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
}

.create-claim-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 43px;
  padding: 10px 16px;
  border: 1px solid transparent;
  border-radius: 11px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: background .15s, transform .15s, border-color .15s;
}

.create-claim-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.create-claim-button:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.create-claim-button-primary {
  background: var(--cc-primary);
  color: #fff;
}

.create-claim-button-primary:hover:not(:disabled) {
  background: var(--cc-primary-dark);
}

.create-claim-button-secondary {
  background: #fff;
  color: #3e536e;
  border-color: #d5dfeb;
}

.create-claim-button-light {
  background: #eef2ff;
  color: #4057cf;
  border-color: #dce4ff;
}

.create-claim-button-small {
  min-height: 35px;
  padding: 7px 11px;
  font-size: 12px;
}

/* =========================================================
   SELECTED PATIENT
========================================================= */

.create-claim-selected {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 15px;
  flex-wrap: wrap;
  padding: 17px;
  margin-top: 17px;
  border: 1px solid #b8e8ca;
  border-radius: 14px;
  background: #f0fdf5;
}

.create-claim-selected-label {
  margin-bottom: 6px;
  color: #15803d;
  font-size: 12px;
  font-weight: 800;
}

.create-claim-selected-name {
  color: #166534;
  font-size: 17px;
  font-weight: 800;
}

.create-claim-selected-meta {
  margin-top: 6px;
  color: #4b7c5b;
  font-size: 12px;
}

.create-claim-empty {
  text-align: center;
  padding: 22px 14px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  background: #fff;
  color: #64748b;
  font-size: 14px;
}

/* =========================================================
   MESSAGES
========================================================= */

.create-claim-message {
  padding: 14px 16px;
  margin-bottom: 17px;
  border-radius: 11px;
  font-size: 14px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.create-claim-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}

.create-claim-success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.create-claim-info {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
}

/* =========================================================
   RENEWAL PANEL
========================================================= */

.create-claim-renewal-panel {
  grid-column: 1 / -1;
  padding: 20px;
  border: 1px solid #dbe5ff;
  border-radius: 15px;
  background: linear-gradient(135deg, #f8faff, #fff);
}

.create-claim-renewal-heading {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 18px;
}

.create-claim-renewal-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 12px;
  background: #e9edff;
  color: #4057cf;
  font-size: 21px;
}

.create-claim-renewal-title {
  margin: 0;
  color: #233e79;
  font-size: 16px;
  font-weight: 800;
}

.create-claim-renewal-description {
  margin: 5px 0 0;
  color: #71829a;
  font-size: 13px;
  line-height: 1.6;
}

.create-claim-checkbox-row {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 14px;
  border: 1px solid #dce5f0;
  border-radius: 11px;
  background: #fff;
  cursor: pointer;
}

.create-claim-checkbox-row input {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  accent-color: #4057cf;
  flex-shrink: 0;
}

.create-claim-checkbox-title {
  font-size: 13px;
  font-weight: 800;
  color: #334b68;
}

.create-claim-checkbox-description {
  margin-top: 4px;
  font-size: 12px;
  color: #71829a;
  line-height: 1.6;
}

/* =========================================================
   FOOTER
========================================================= */

.create-claim-form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  padding-top: 22px;
  margin-top: 26px;
  border-top: 1px solid #e8edf5;
}

.create-claim-footer-note {
  color: #7a8ba2;
  font-size: 12px;
  line-height: 1.6;
}

.create-claim-creator {
  margin-top: 8px;
  color: #4f6b5a;
}

/* =========================================================
   RESPONSIVE
========================================================= */

@media (max-width: 700px) {
  .create-claim-page {
    padding: 16px 6px 28px;
  }

  .create-claim-card {
    padding: 17px;
  }

  .create-claim-form-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 19px;
  }

  .create-claim-field-full,
  .create-claim-renewal-panel {
    grid-column: auto;
  }

  .create-claim-input,
  .create-claim-select,
  .create-claim-search-input {
    font-size: 16px;
  }

  .create-claim-result-actions,
  .create-claim-selected-actions,
  .create-claim-footer-actions {
    width: 100%;
  }

  .create-claim-result-actions .create-claim-button,
  .create-claim-selected-actions .create-claim-button,
  .create-claim-footer-actions .create-claim-button {
    flex: 1 1 auto;
  }

  .create-claim-form-footer {
    align-items: stretch;
    flex-direction: column;
  }
}
`;

/* =========================================================
   ICONS
========================================================= */

function ClaimIcon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  switch (name) {
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
      );

    case "file":
      return (
        <svg {...common}>
          <path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
          <path d="M14 3v6h5M9 14h6M9 18h6" />
        </svg>
      );

    case "hash":
      return (
        <svg {...common}>
          <path d="M5 9h14M4 15h14M11 3 7 21M17 3l-4 18" />
        </svg>
      );

    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      );

    case "shield":
      return (
        <svg {...common}>
          <path d="M12 2 20 6v6c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6l8-4Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );

    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M7 3v4M17 3v4M3 10h18" />
        </svg>
      );

    case "visits":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="17" rx="2" />
          <path d="M8 2v4M16 2v4M4 10h16M8 15h3M8 18h6" />
        </svg>
      );

    case "layers":
      return (
        <svg {...common}>
          <path d="m12 3 9 5-9 5-9-5 9-5Z" />
          <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
        </svg>
      );

    case "activity":
      return (
        <svg {...common}>
          <path d="M3 12h4l3-7 4 14 3-7h4" />
        </svg>
      );

    case "building":
      return (
        <svg {...common}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M10 21v-4h4v4" />
        </svg>
      );

    case "status":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 3 3 5-6" />
        </svg>
      );

    case "chevron":
      return (
        <svg {...common}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      );

    case "alert":
      return (
        <svg {...common}>
          <path d="M12 3 2 21h20L12 3Z" />
          <path d="M12 9v5M12 18h.01" />
        </svg>
      );

    default:
      return null;
  }
}

/* =========================================================
   REUSABLE FIELDS
========================================================= */

function ClaimTextField({
  id,
  label,
  icon = "file",
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly = false,
  disabled = false,
  required = false,
  min,
  step,
  note,
}) {
  return (
    <div className="create-claim-field">
      <label className="create-claim-label" htmlFor={id}>
        {label}
        {required && <span className="create-claim-required">*</span>}
      </label>

      <div
        className={[
          "create-claim-control",
          "has-icon",
          readOnly ? "is-readonly" : "",
          disabled ? "is-disabled" : "",
        ].join(" ")}
      >
        <span className="create-claim-control-icon">
          <ClaimIcon name={icon} />
        </span>

        <input
          id={id}
          className="create-claim-input"
          type={type}
          value={value ?? ""}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          disabled={disabled}
          required={required}
          min={min}
          step={step}
        />
      </div>

      {note && (
        <div className="create-claim-form-note">{note}</div>
      )}
    </div>
  );
}

function formatClaimDate(value) {
  if (!value) return "";

  const parts = String(value).slice(0, 10).split("-");
  if (parts.length !== 3) return value;

  const [year, month, day] = parts.map(Number);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return value;
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ClaimDateField({
  id,
  label,
  value,
  onChange,
  readOnly = false,
  min,
  note,
}) {
  return (
    <div className="create-claim-field">
      <label className="create-claim-label" htmlFor={id}>
        {label}
      </label>

      <div className="create-claim-date-control">
        <div
          className={[
            "create-claim-control",
            "has-icon",
            readOnly ? "is-readonly" : "",
          ].join(" ")}
        >
          <span className="create-claim-control-icon">
            <ClaimIcon name="calendar" />
          </span>

          <span
            className={`create-claim-date-display${
              value ? "" : " is-empty"
            }`}
          >
            {value ? formatClaimDate(value) : "Select date"}
          </span>

          <span className="create-claim-date-trailing">
            <ClaimIcon name="calendar" />
          </span>
        </div>

        <input
          id={id}
          className="create-claim-date-native"
          type="date"
          value={value || ""}
          min={min}
          onChange={onChange}
          disabled={readOnly}
          aria-label={label}
        />
      </div>

      {note && (
        <div className="create-claim-form-note">{note}</div>
      )}
    </div>
  );
}

function ClaimSelectField({
  id,
  label,
  value,
  onChange,
  disabled,
  options,
  required,
}) {
  return (
    <div className="create-claim-field">
      <label className="create-claim-label" htmlFor={id}>
        {label}
        {required && <span className="create-claim-required">*</span>}
      </label>

      <div
        className={`create-claim-control has-icon${
          disabled ? " is-disabled" : ""
        }`}
      >
        <span className="create-claim-control-icon">
          <ClaimIcon name="status" />
        </span>

        <select
          id={id}
          className="create-claim-select"
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <span className="create-claim-select-arrow">
          <ClaimIcon name="chevron" />
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   GENERAL HELPERS
========================================================= */

function hasValidId(value) {
  return (
    value !== null &&
    value !== undefined &&
    value !== ""
  );
}

function getPatientName(patient) {
  if (!patient) return "Unknown Patient";

  const name =
    patient.full_name ||
    patient.fullName ||
    patient.patient_name ||
    patient.patientName ||
    patient.name;

  if (name) return String(name);

  return (
    [
      patient.first_name || patient.firstName,
      patient.middle_name || patient.middleName,
      patient.last_name || patient.lastName,
    ]
      .filter(Boolean)
      .join(" ") || "Unknown Patient"
  );
}

function getPatientNumber(patient) {
  if (!patient) return "N/A";

  const fields = [
    "file_number",
    "fileNumber",
    "patient_file_number",
    "patientFileNumber",
    "medical_file_number",
    "medicalFileNumber",
    "patient_number",
    "patientNumber",
    "patient_no",
    "patientNo",
    "file_no",
    "fileNo",
    "mrn",
    "MRN",
    "mrn_number",
    "medical_record_number",
    "medicalRecordNumber",
    "medical_record_no",
    "registration_number",
    "registrationNumber",
    "hospital_number",
    "hospitalNumber",
    "patient_code",
    "patientCode",
    "patient_id",
    "patientId",
  ];

  const sources = [
    patient,
    patient.patient_details,
    patient.patientDetails,
    patient.demographics,
    patient.profile,
  ];

  for (const source of sources) {
    if (!source || typeof source !== "object") continue;

    for (const field of fields) {
      const value = source[field];

      if (
        value !== null &&
        value !== undefined &&
        typeof value !== "object" &&
        String(value).trim()
      ) {
        return String(value).trim();
      }
    }
  }

  return "N/A";
}

function getPatientPhone(patient) {
  return (
    patient?.phone ||
    patient?.phone_number ||
    patient?.phoneNumber ||
    patient?.mobile ||
    patient?.mobile_number ||
    patient?.mobileNumber ||
    ""
  );
}

function getPatientList(response) {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.patients)) return data.patients;

  return [];
}

function getUserList(response) {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.clinicians)) return data.clinicians;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.users)) return data.users;

  return [];
}

function getInitials(name) {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();
}

function getCreatorName(claim) {
  if (!claim) return "";

  const creator =
    claim.created_by_name ||
    claim.createdByName ||
    claim.creator_name ||
    claim.creatorName ||
    claim.created_by_display_name ||
    claim.createdByDisplayName ||
    claim.created_by_username ||
    claim.createdByUsername;

  if (creator && typeof creator !== "object") {
    return String(creator);
  }

  const user =
    claim.created_by ||
    claim.createdBy ||
    claim.creator ||
    claim.user;

  if (user && typeof user === "object") {
    return (
      user.display_name ||
      user.displayName ||
      user.full_name ||
      user.fullName ||
      user.name ||
      user.username ||
      user.email ||
      ""
    );
  }

  return "";
}

function getUserName(user) {
  return (
    user?.display_name ||
    user?.displayName ||
    user?.full_name ||
    user?.fullName ||
    user?.name ||
    user?.username ||
    user?.email ||
    ""
  );
}

function getUserRole(user) {
  const role =
    user?.role_name ??
    user?.roleName ??
    user?.role ??
    user?.profession ??
    user?.job_title ??
    user?.jobTitle ??
    user?.designation ??
    "";

  if (role && typeof role === "object") {
    return String(
      role.name ??
      role.title ??
      role.code ??
      ""
    );
  }

  return String(role);
}

function isEligibleClinician(user) {
  const role = getUserRole(user)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .trim();

  return (
    role === "physio" ||
    role.includes("physiotherapist") ||
    role.includes("physiotherapy") ||
    role.includes("physical therapist") ||
    role.includes("physician") ||
    role.includes("doctor") ||
    role.includes("medical practitioner")
  );
}

function getApiError(err) {
  const data = err?.response?.data;

  if (typeof data === "string") {
    if (/<!doctype html|<html|<body/i.test(data)) {
      return `Server request failed (HTTP ${
        err?.response?.status || "error"
      }). Please check the API endpoint.`;
    }

    return data.slice(0, 500);
  }

  if (data?.detail) return String(data.detail);
  if (data?.error) return String(data.error);
  if (data?.message) return String(data.message);

  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([key, value]) => {
        const message = Array.isArray(value)
          ? value.map(String).join(", ")
          : typeof value === "object" && value !== null
            ? JSON.stringify(value)
            : String(value);

        return `${key}: ${message}`;
      })
      .join(" · ");
  }

  if (err?.message === "Network Error") {
    return "Network error: the server could not be reached.";
  }

  return err?.message || "The request failed.";
}

/* =========================================================
   CLAIM HELPERS
========================================================= */

function getClaimDatabaseId(claim) {
  const id =
    claim?.id ??
    claim?.pk ??
    claim?.claim_pk ??
    claim?.claimPk ??
    claim?.database_id ??
    claim?.databaseId;

  return hasValidId(id) ? id : null;
}

function getClaimPatientId(claim) {
  const patient =
    claim?.patientId ??
    claim?.patient_id ??
    claim?.patient ??
    null;

  if (patient && typeof patient === "object") {
    return patient.id ?? patient.pk ?? null;
  }

  return patient;
}

function getAlertClaimId(alert) {
  return (
    alert?.claimId ??
    alert?.claim_id_value ??
    alert?.claim?.claimId ??
    alert?.claim?.claim_id ??
    ""
  );
}

function getAlertPatientId(alert) {
  const patient =
    alert?.patientId ??
    alert?.patient_id ??
    alert?.patient?.id ??
    alert?.claim?.patientId ??
    alert?.claim?.patient_id ??
    null;

  if (patient && typeof patient === "object") {
    return patient.id ?? patient.pk ?? null;
  }

  return patient;
}

function getAlertDate(alert) {
  return String(
    alert?.renewalDate ??
    alert?.renewal_date ??
    ""
  ).slice(0, 10);
}

function getLocalToday() {
  const now = new Date();

  const local = new Date(
    now.getTime() -
    now.getTimezoneOffset() * 60000
  );

  return local.toISOString().slice(0, 10);
}

function getClinicianId(claim) {
  const clinician =
    claim?.requestingClinician ??
    claim?.requesting_clinician ??
    null;

  if (clinician && typeof clinician === "object") {
    return String(
      clinician.id ??
      clinician.pk ??
      ""
    );
  }

  return clinician === null ? "" : String(clinician);
}

function getInitialForm(renewalAlert) {
  const existingClaim = renewalAlert?.claim ?? {};

  return {
    claimId: renewalAlert
      ? String(getAlertClaimId(renewalAlert))
      : "",

    status: renewalAlert ? "Submitted" : "Pending",

    rejectionReason: String(
      renewalAlert?.rejectionReason ??
      renewalAlert?.rejection_reason ??
      existingClaim?.rejection_reason ??
      ""
    ),

    renewalDate: renewalAlert
      ? getAlertDate(renewalAlert)
      : getLocalToday(),

    requestingClinician: getClinicianId(existingClaim),

    authorizationNumber: String(
      existingClaim?.authorizationNumber ??
      existingClaim?.authorization_number ??
      ""
    ),

    approvalDate:
      String(
        existingClaim?.approvalDate ??
        existingClaim?.approval_date ??
        ""
      ).slice(0, 10) || getLocalToday(),

    expirationDate:
      String(
        existingClaim?.expirationDate ??
        existingClaim?.expiration_date ??
        ""
      ).slice(0, 10) ||
      (renewalAlert ? "" : getLocalToday()),

    approvedVisits: String(
      existingClaim?.approvedVisits ??
      existingClaim?.approved_visits ??
      ""
    ),

    approvedUnits: String(
      existingClaim?.approvedUnits ??
      existingClaim?.approved_units ??
      ""
    ),

    approvedService: String(
      existingClaim?.approvedService ??
      existingClaim?.approved_service ??
      ""
    ),

    insurancePayer: String(
  existingClaim?.payer ??
  existingClaim?.insurance ??
  existingClaim?.insurancePayer ??
  existingClaim?.insurance_payer ??
  existingClaim?.insurance_company ??
  ""
),
  };
}

function getClaimForm(claim) {
  const rawStatus = String(
    claim?.status ?? "Pending"
  ).trim().toLowerCase();

  const statusMap = {
    pending: "Pending",
    submitted: "Submitted",
    approved: "Approved",
    rejected: "Rejected",
    denied: "Rejected",
  };

  return {
    claimId: String(
      claim?.claimId ??
      claim?.claim_id_value ??
      claim?.claim_id ??
      claim?.claim_number ??
      claim?.claimNumber ??
      ""
    ),

    status: statusMap[rawStatus] || "Pending",

    rejectionReason: String(
      claim?.rejectionReason ??
      claim?.rejection_reason ??
      ""
    ),

    renewalDate:
      String(
        claim?.renewalDate ??
        claim?.renewal_date ??
        ""
      ).slice(0, 10) || getLocalToday(),

    requestingClinician: getClinicianId(claim),

    authorizationNumber: String(
      claim?.authorizationNumber ??
      claim?.authorization_number ??
      ""
    ),

    approvalDate: String(
      claim?.approvalDate ??
      claim?.approval_date ??
      ""
    ).slice(0, 10),

    expirationDate: String(
      claim?.expirationDate ??
      claim?.expiration_date ??
      ""
    ).slice(0, 10),

    approvedVisits: String(
      claim?.approvedVisits ??
      claim?.approved_visits ??
      ""
    ),

    approvedUnits: String(
      claim?.approvedUnits ??
      claim?.approved_units ??
      ""
    ),

    approvedService: String(
      claim?.approvedService ??
      claim?.approved_service ??
      ""
    ),

    insurancePayer: String(
  claim?.payer ??
  claim?.insurance ??
  claim?.insurancePayer ??
  claim?.insurance_payer ??
  claim?.insurance_company ??
  ""
),
  };
}

function unwrapClaim(response) {
  const data = response?.data;
  return data?.claim ?? data;
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function CreateClaim({
  patient: initialPatient = null,
  editClaim: editClaimProp = null,
  editClaimId: editClaimIdProp = null,
  isEditMode: isEditModeProp = false,
  renewalAlert = null,
  onClose,
  onClaimCreated,
  onClaimUpdated,
  onCancelEdit,
  onRenewalUpdated,
  onCreateAlert,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const routeState = location.state;

  const routeEditClaim =
    routeState?.mode === "edit" &&
    routeState?.editClaim &&
    typeof routeState.editClaim === "object"
      ? routeState.editClaim
      : null;

  const candidateEditClaim =
    editClaimProp ??
    (isEditModeProp ? routeEditClaim : null);

  const candidateEditClaimId =
    editClaimIdProp ??
    (isEditModeProp ? routeState?.claimId : null) ??
    getClaimDatabaseId(candidateEditClaim);

  const isRenewalMode = Boolean(renewalAlert);

  const isEditing =
    !isRenewalMode &&
    hasValidId(candidateEditClaimId) &&
    (
      Boolean(candidateEditClaim) ||
      Boolean(isEditModeProp)
    );

  const editClaim = isEditing ? candidateEditClaim : null;
  const editClaimId = isEditing ? candidateEditClaimId : null;

  /* =========================================================
     STATE
  ========================================================= */

  const [patients, setPatients] = useState([]);
  const [users, setUsers] = useState([]);

  const [selectedPatient, setSelectedPatient] =
    useState(initialPatient);

  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);

  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [usersError, setUsersError] = useState("");

  const [clinicianSearch, setClinicianSearch] = useState("");
  const [showClinicianResults, setShowClinicianResults] =
    useState(false);

  const [loadingClaim, setLoadingClaim] = useState(false);
  const [claimLoadFailed, setClaimLoadFailed] = useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [createdClaim, setCreatedClaim] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [createRenewalAlert, setCreateRenewalAlert] =
    useState(false);

  const [loadedEditClaim, setLoadedEditClaim] =
    useState(null);

  const [patientDetailsChecked, setPatientDetailsChecked] =
    useState(false);

  const [form, setForm] = useState(() =>
    isEditing
      ? getClaimForm(editClaim)
      : getInitialForm(renewalAlert)
  );

  const currentEditClaim = loadedEditClaim ?? editClaim;

  /* =========================================================
     LOAD PATIENTS / USERS
  ========================================================= */

  useEffect(() => {
    let active = true;

    async function loadPatients() {
      setLoadingPatients(true);

      try {
        const response = await api.get("patients/", {
          withCredentials: true,
        });

        if (active) {
          setPatients(getPatientList(response));
        }
      } catch (err) {
        if (active) {
          setError(getApiError(err));
        }
      } finally {
        if (active) {
          setLoadingPatients(false);
        }
      }
    }

    async function loadUsers() {
      setLoadingUsers(true);
      setUsersError("");

      try {
        const response = await api.get(
          "users/clinicians/",
          { withCredentials: true }
        );

        if (active) {
          setUsers(getUserList(response));
          setUsersError("");
        }
      } catch (err) {
        if (active) {
          setUsers([]);
          setUsersError(
            "Unable to load clinicians. Please check your connection and try again."
          );
        }
      } finally {
        if (active) {
          setLoadingUsers(false);
        }
      }
    }

    async function loadCurrentUser() {
      try {
        const response = await api.get(
          "users/me/",
          { withCredentials: true }
        );

        if (active) {
          setCurrentUser(response?.data ?? null);
        }
      } catch {
        if (active) {
          setCurrentUser(null);
        }
      }
    }

    loadPatients();
    loadUsers();
    loadCurrentUser();

    return () => {
      active = false;
    };
  }, []);

  /* =========================================================
     INITIALIZE WHEN MODE CHANGES
  ========================================================= */

  useEffect(() => {
    setError("");
    setSuccess("");
    setCreatedClaim(null);

    setSearch("");
    setShowResults(false);

    setClinicianSearch("");
    setShowClinicianResults(false);

    setCreateRenewalAlert(false);
    setLoadedEditClaim(null);
    setClaimLoadFailed(false);

    if (isEditing) {
      setForm(getClaimForm(editClaim));
    } else {
      setForm(getInitialForm(renewalAlert));

      if (!isRenewalMode) {
        setSelectedPatient(initialPatient);
      }
    }
  }, [
    isEditing,
    editClaimId,
    editClaim,
    renewalAlert,
    initialPatient,
    isRenewalMode,
  ]);

  /* =========================================================
     LOAD EXISTING CLAIM
  ========================================================= */

  useEffect(() => {
    if (!isEditing) {
      setLoadingClaim(false);
      return;
    }

    let active = true;

    async function loadClaim() {
      setLoadingClaim(true);
      setClaimLoadFailed(false);

      try {
        const response = await api.get(
          `rcm/claims/${editClaimId}/`,
          { withCredentials: true }
        );

        if (!active) return;

        const claim = unwrapClaim(response);

        if (!claim || typeof claim !== "object") {
          throw new Error(
            "The claim details could not be loaded."
          );
        }

        setLoadedEditClaim(claim);
        setForm(getClaimForm(claim));
      } catch (err) {
        if (active) {
          setClaimLoadFailed(true);
          setError(
            "Unable to load the complete claim: " +
            getApiError(err)
          );
        }
      } finally {
        if (active) {
          setLoadingClaim(false);
        }
      }
    }

    loadClaim();

    return () => {
      active = false;
    };
  }, [isEditing, editClaimId]);

  /* =========================================================
     SELECT LINKED PATIENT
  ========================================================= */

  useEffect(() => {
    if (!isEditing && !isRenewalMode) {
      if (initialPatient) {
        const matched = patients.find(
          (item) =>
            String(item.id) ===
            String(initialPatient.id)
        );

        setSelectedPatient(matched ?? initialPatient);
      }

      return;
    }

    const source = isEditing
      ? currentEditClaim
      : renewalAlert;

    if (!source) return;

    const patientId = isEditing
      ? getClaimPatientId(source)
      : getAlertPatientId(source);

    const matchedPatient = patients.find(
      (item) =>
        String(item.id) === String(patientId)
    );

    const embeddedPatient =
      source.patient &&
      typeof source.patient === "object"
        ? source.patient
        : source.claim?.patient &&
          typeof source.claim.patient === "object"
          ? source.claim.patient
          : null;

    setSelectedPatient(
      matchedPatient ?? embeddedPatient ?? null
    );
  }, [
    patients,
    initialPatient,
    isEditing,
    isRenewalMode,
    currentEditClaim,
    renewalAlert,
  ]);

  /* =========================================================
     LOAD FULL PATIENT FILE NUMBER IF NEEDED
  ========================================================= */

  const selectedPatientId = selectedPatient?.id;
  const patientFileNumber = getPatientNumber(selectedPatient);

  useEffect(() => {
    if (
      !hasValidId(selectedPatientId) ||
      patientFileNumber !== "N/A" ||
      patientDetailsChecked
    ) {
      return;
    }

    let active = true;

    async function loadPatientDetails() {
      try {
        const response = await api.get(
          `patients/${selectedPatientId}/`,
          { withCredentials: true }
        );

        if (!active) return;

        const detail =
          response?.data?.patient ??
          response?.data;

        if (detail && typeof detail === "object") {
          setSelectedPatient((previous) => {
            if (
              String(previous?.id) !==
              String(selectedPatientId)
            ) {
              return previous;
            }

            return {
              ...previous,
              ...detail,
            };
          });
        }
      } catch {
        // Keep the original patient data.
      } finally {
        if (active) {
          setPatientDetailsChecked(true);
        }
      }
    }

    loadPatientDetails();

    return () => {
      active = false;
    };
  }, [
    selectedPatientId,
    patientFileNumber,
    patientDetailsChecked,
  ]);

  useEffect(() => {
    setPatientDetailsChecked(false);
  }, [selectedPatientId]);

  /* =========================================================
     SEARCH PATIENTS
  ========================================================= */

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return [];

    return patients
      .filter((patient) => {
        const values = [
          getPatientName(patient),
          getPatientNumber(patient),
          getPatientPhone(patient),
          patient?.national_id,
          patient?.nationalId,
          patient?.emirates_id,
          patient?.emiratesId,
          patient?.id,
        ];

        return values.some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(term)
        );
      })
      .slice(0, 10);
  }, [patients, search]);

  /* =========================================================
     SEARCH CLINICIANS
  ========================================================= */

  const clinicians = useMemo(() => {
    return users
      .filter(
        (user) =>
          hasValidId(user?.id ?? user?.pk) &&
          isEligibleClinician(user)
      )
      .sort((a, b) =>
        getUserName(a).localeCompare(
          getUserName(b)
        )
      );
  }, [users]);

  const filteredClinicians = useMemo(() => {
    const term = clinicianSearch.trim().toLowerCase();

    if (!term) return clinicians;

    return clinicians.filter((user) => {
      const text = [
        getUserName(user),
        getUserRole(user),
        user?.username,
        user?.email,
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(term);
    });
  }, [clinicians, clinicianSearch]);

  const selectedClinician = useMemo(() => {
    return (
      clinicians.find(
        (user) =>
          String(user.id ?? user.pk) ===
          String(form.requestingClinician)
      ) ?? null
    );
  }, [
    clinicians,
    form.requestingClinician,
  ]);

  /* =========================================================
     DERIVED VALUES
  ========================================================= */

  const isRejected = form.status === "Rejected";

  const renewalDate = getAlertDate(renewalAlert);

  const isRenewalDateToday =
    !isRenewalMode ||
    renewalDate === getLocalToday();

  const reminderStatus = String(
    renewalAlert?.renewal_status ??
    renewalAlert?.renewalStatus ??
    renewalAlert?.alert_status ??
    renewalAlert?.alertStatus ??
    renewalAlert?.status ??
    ""
  )
    .trim()
    .toLowerCase();

  const isAlreadySubmitted =
    reminderStatus === "submitted";

  const creatorName =
    getCreatorName(
      createdClaim?.claim ?? createdClaim
    ) ||
    getUserName(currentUser);

  /* =========================================================
     HANDLERS
  ========================================================= */

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleStatusChange(status) {
    setForm((current) => ({
      ...current,
      status,

      rejectionReason:
        status === "Rejected"
          ? current.rejectionReason
          : "",

      renewalDate:
        status === "Rejected"
          ? current.renewalDate
          : getLocalToday(),
    }));

    if (status !== "Rejected") {
      setCreateRenewalAlert(false);
    }
  }

  function selectPatient(patient) {
    if (isRenewalMode || isEditing) return;

    setSelectedPatient(patient);
    setSearch("");
    setShowResults(false);

    setError("");
    setSuccess("");
    setCreatedClaim(null);
  }

  function selectClinician(user) {
    if (isRenewalMode) return;

    const id = user.id ?? user.pk;

    updateForm(
      "requestingClinician",
      String(id)
    );

    setClinicianSearch("");
    setShowClinicianResults(false);
    setError("");
  }

  function openPatientFile(patient) {
    if (!hasValidId(patient?.id)) {
      setError(
        "This patient does not have a valid ID."
      );
      return;
    }

    navigate(`/patients/${patient.id}`);
  }

  function resetForm() {
    if (saving) return;

    setError("");
    setSuccess("");
    setCreatedClaim(null);

    setCreateRenewalAlert(false);
    setClinicianSearch("");
    setShowClinicianResults(false);

    if (isRenewalMode) {
      setForm(getInitialForm(renewalAlert));
    } else if (isEditing) {
      setForm(getClaimForm(currentEditClaim));
    } else {
      setForm(getInitialForm(null));
    }
  }

  function handleCancel() {
    if (saving) return;

    if (typeof onCancelEdit === "function") {
      onCancelEdit();
      return;
    }

    if (typeof onClose === "function") {
      onClose();
      return;
    }

    navigate("/rcm/claims", {
      replace: true,
      state: null,
    });
  }

  /* =========================================================
     VALIDATION
  ========================================================= */

  function validateClaim() {
    if (!hasValidId(selectedPatient?.id)) {
      return "Please select a valid patient before continuing.";
    }

    if (!form.claimId.trim()) {
      return "Please enter the claim number or reference.";
    }

    if (
      isEditing &&
      !hasValidId(editClaimId)
    ) {
      return "The claim database ID is missing.";
    }

    if (isEditing && claimLoadFailed) {
      return "The existing claim could not be loaded. Reopen it from Claim History.";
    }

    if (isRenewalMode) {
      if (!hasValidId(renewalAlert?.id)) {
        return "The renewal alert ID is missing.";
      }

      const linkedClaimId =
        renewalAlert.claimPk ??
        renewalAlert.claim_pk ??
        renewalAlert.claim?.id;

      if (!hasValidId(linkedClaimId)) {
        return "This renewal reminder is not linked to an existing claim.";
      }

      if (!isRenewalDateToday) {
        return "This claim can only be renewed on its scheduled renewal date.";
      }

      if (isAlreadySubmitted) {
        return "This renewal has already been submitted.";
      }

      return "";
    }

    if (
      form.requestingClinician &&
      !selectedClinician
    ) {
      return "Please select a valid requesting clinician from the user list.";
    }

    if (form.approvedVisits !== "") {
      const visits = Number(form.approvedVisits);

      if (
        !Number.isInteger(visits) ||
        visits < 0
      ) {
        return "Approved visits must be a non-negative whole number.";
      }
    }

    if (form.approvedUnits !== "") {
      const units = Number(form.approvedUnits);

      if (
        !Number.isInteger(units) ||
        units < 0
      ) {
        return "Approved units must be a non-negative whole number.";
      }
    }

    if (
      form.approvalDate &&
      form.expirationDate &&
      form.expirationDate < form.approvalDate
    ) {
      return "Expiration date cannot be earlier than approval date.";
    }

    if (
      isRejected &&
      !form.rejectionReason.trim()
    ) {
      return "Please enter the rejection reason.";
    }

    if (
      isRejected &&
      createRenewalAlert
    ) {
      if (!form.renewalDate) {
        return "Please select a renewal date.";
      }

      if (
        form.renewalDate < getLocalToday()
      ) {
        return "The renewal date cannot be in the past.";
      }

      if (
        typeof onCreateAlert !== "function"
      ) {
        return "Renewal alert creation is not connected.";
      }
    }

    return "";
  }

  /* =========================================================
     SAVE RENEWAL REMINDER
  ========================================================= */

  async function saveRenewalReminder(
    claim,
    claimPk
  ) {
    if (
      !isRejected ||
      !createRenewalAlert ||
      !form.renewalDate
    ) {
      return;
    }

    if (!hasValidId(claimPk)) {
      throw new Error(
        "The saved claim ID is missing. Cannot link its renewal reminder."
      );
    }

    await onCreateAlert({
      alertType: "renewal",
      patient: selectedPatient,
      patientId: selectedPatient.id,
      claim,
      claimPk,
      claimId: form.claimId.trim(),
      renewalDate: form.renewalDate,
      rejectionReason:
        form.rejectionReason.trim(),
      status: "Rejected",
    });
  }

  /* =========================================================
     SUBMIT
  ========================================================= */

  async function submitClaim(event) {
    event.preventDefault();

    if (saving || loadingClaim) return;

    setError("");
    setSuccess("");
    setCreatedClaim(null);

    const validationError = validateClaim();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      /* RENEW EXISTING CLAIM */

      if (isRenewalMode) {
        const claimPk =
          renewalAlert.claimPk ??
          renewalAlert.claim_pk ??
          renewalAlert.claim?.id;

        const response = await api.patch(
          `rcm/claims/${claimPk}/`,
          {
            status: "Submitted",
            alertId: renewalAlert.id,
            renewalAlertId: renewalAlert.id,
          },
          { withCredentials: true }
        );

        const claim = unwrapClaim(response);

        setCreatedClaim(claim);

        setSuccess(
          `Renewal for claim ${form.claimId.trim()} was submitted successfully.`
        );

        if (
          typeof onRenewalUpdated === "function"
        ) {
          await onRenewalUpdated(claim);
        }

        return;
      }

      /* CLAIM PAYLOAD */

      const payload = {
        patientId: selectedPatient.id,
        claimId: form.claimId.trim(),
        status: form.status,

        rejectionReason: isRejected
          ? form.rejectionReason.trim()
          : "",

        requestingClinician:
          form.requestingClinician
            ? Number(form.requestingClinician)
            : null,

        authorizationNumber:
          form.authorizationNumber.trim(),

        approvalDate:
          form.approvalDate || null,

        expirationDate:
          form.expirationDate || null,

        approvedVisits:
          form.approvedVisits === ""
            ? null
            : Number(form.approvedVisits),

        approvedUnits:
          form.approvedUnits === ""
            ? null
            : Number(form.approvedUnits),

        approvedService:
          form.approvedService.trim(),

        payer: form.insurancePayer.trim(),
      };

      /* EDIT EXISTING CLAIM */

      if (isEditing) {
        const response = await api.patch(
          `rcm/claims/${editClaimId}/`,
          payload,
          { withCredentials: true }
        );

        const claim = unwrapClaim(response);

        setCreatedClaim(claim);

        if (
          isRejected &&
          createRenewalAlert
        ) {
          try {
            await saveRenewalReminder(
              claim,
              editClaimId
            );
          } catch (alertError) {
            setSuccess(
              "Claim updated successfully."
            );

            setError(
              "The claim was updated, but its renewal reminder could not be created: " +
              getApiError(alertError)
            );

            return;
          }
        }

        setSuccess(
          isRejected && createRenewalAlert
            ? "Claim updated and renewal reminder created successfully."
            : "Claim updated successfully."
        );

        if (
          typeof onClaimUpdated === "function"
        ) {
          await onClaimUpdated(claim);
        } else if (
          typeof onClaimCreated === "function"
        ) {
          await onClaimCreated(claim);
        }

        return;
      }

      /* CREATE NEW CLAIM */

      const createPayload = {
        ...payload,

        renewalDate:
          isRejected && createRenewalAlert
            ? form.renewalDate || null
            : null,
      };

      const response = await api.post(
        "rcm/claims/",
        createPayload,
        { withCredentials: true }
      );

      const claim = unwrapClaim(response);

      setCreatedClaim(claim);

      if (
        isRejected &&
        createRenewalAlert
      ) {
        try {
          await saveRenewalReminder(
            claim,
            getClaimDatabaseId(claim)
          );
        } catch (alertError) {
          setSuccess(
            "Claim created successfully."
          );

          setError(
            "The claim was created, but its renewal reminder could not be saved: " +
            getApiError(alertError)
          );

          return;
        }
      }

      setSuccess(
        isRejected && createRenewalAlert
          ? "Rejected claim saved and renewal reminder created successfully."
          : "Claim created successfully."
      );

      setForm(getInitialForm(null));
      setCreateRenewalAlert(false);

      setClinicianSearch("");
      setShowClinicianResults(false);

      if (
        typeof onClaimCreated === "function"
      ) {
        await onClaimCreated(claim);
      }
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="create-claim-page">
      <style>{styles}</style>

      {/* HEADER */}

      <div className="create-claim-header">
        <div>
          <h1 className="create-claim-title">
            {isRenewalMode
              ? "Renew Existing Claim"
              : isEditing
                ? "Edit Claim"
                : "Create New Claim"}
          </h1>

          <p className="create-claim-subtitle">
            {isRenewalMode
              ? "Review the existing claim and submit its renewal."
              : isEditing
                ? "Update the existing claim and optionally schedule a renewal reminder if rejected."
                : "Enter the claim details. Rejected claims can have an optional renewal reminder."}
          </p>
        </div>

        <div className="create-claim-header-tag">
          <span className="create-claim-header-dot" />
          {isRenewalMode
            ? "Existing claim"
            : isEditing
              ? "Edit mode"
              : "RCM claim"}
        </div>

        {onClose && (
          <button
            type="button"
            className="create-claim-button create-claim-button-secondary"
            onClick={onClose}
          >
            ← Back
          </button>
        )}
      </div>

      {/* RENEWAL INFORMATION */}

      {isRenewalMode && (
        <div className="create-claim-message create-claim-info">
          <strong>Renewal submission</strong>

          <div>
            Existing Claim ID:{" "}
            <strong>
              {form.claimId || "—"}
            </strong>
          </div>

          <div>
            Scheduled renewal date:{" "}
            <strong>
              {renewalDate
                ? formatClaimDate(renewalDate)
                : "—"}
            </strong>
          </div>

          <div>
            The original claim reference will be preserved.
          </div>
        </div>
      )}

      {/* EDIT INFORMATION */}

      {isEditing && (
        <div className="create-claim-message create-claim-info">
          <strong>Editing Existing Claim</strong>

          <div>
            Claim Reference:{" "}
            <strong>
              {form.claimId || "—"}
            </strong>
          </div>

          <div>
            Updating this claim will not create a duplicate claim.
          </div>
        </div>
      )}

      {isEditing && loadingClaim && (
        <div className="create-claim-message create-claim-info">
          Loading existing claim details...
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div
          className="create-claim-message create-claim-error"
          role="alert"
        >
          <strong>
            Unable to complete request
          </strong>
          <div>{error}</div>
        </div>
      )}

      {/* SUCCESS */}

      {success && (
        <div
          className="create-claim-message create-claim-success"
          role="status"
        >
          <strong>{success}</strong>

          {creatorName && (
            <div className="create-claim-creator">
              Processed by:{" "}
              <strong>{creatorName}</strong>
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          SECTION 1 - PATIENT
      ===================================================== */}

      <section className="create-claim-card">
        <div className="create-claim-section-heading">
          <div className="create-claim-section-number">
            1
          </div>

          <div>
            <h2 className="create-claim-section-title">
              Select Patient
            </h2>

            <p className="create-claim-section-description">
              {isRenewalMode
                ? "The patient is linked to the existing claim."
                : isEditing
                  ? "The patient associated with this claim is shown below."
                  : "Search by patient name, file number, phone number, or patient ID."}
            </p>
          </div>
        </div>

        {/* PATIENT SEARCH */}

        {!isRenewalMode && !isEditing && (
          <>
            <label
              className="create-claim-label"
              htmlFor="claim-patient-search"
            >
              Search Patients
            </label>

            <div className="create-claim-search-box">
              <span className="create-claim-control-icon">
                <ClaimIcon name="search" />
              </span>

              <input
                id="claim-patient-search"
                className="create-claim-search-input"
                type="search"
                value={search}
                placeholder="Search name, file number, phone, or patient ID..."
                autoComplete="off"
                onFocus={() => {
                  if (search.trim()) {
                    setShowResults(true);
                  }
                }}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setShowResults(true);
                  setError("");
                }}
              />

              {search && (
                <button
                  type="button"
                  className="create-claim-button create-claim-button-secondary create-claim-button-small"
                  onClick={() => {
                    setSearch("");
                    setShowResults(false);
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            <div className="create-claim-search-meta">
              <span>
                {loadingPatients
                  ? "Loading patient records..."
                  : `${patients.length} patient records available`}
              </span>

              <span>
                Enter a search term to filter results.
              </span>
            </div>

            {showResults && search.trim() && (
              <div className="create-claim-results">
                <div className="create-claim-results-heading">
                  <span>
                    Matching patients
                  </span>

                  {!loadingPatients && (
                    <span>
                      {filteredPatients.length} results
                    </span>
                  )}
                </div>

                {loadingPatients ? (
                  <div className="create-claim-empty">
                    Loading patient records...
                  </div>
                ) : filteredPatients.length === 0 ? (
                  <div className="create-claim-empty">
                    No matching patients found.
                  </div>
                ) : (
                  filteredPatients.map((patient) => {
                    const name =
                      getPatientName(patient);

                    const isSelected =
                      String(selectedPatient?.id) ===
                      String(patient.id);

                    return (
                      <div
                        key={patient.id}
                        className={`create-claim-result${
                          isSelected ? " selected" : ""
                        }`}
                      >
                        <div className="create-claim-patient-info">
                          <div className="create-claim-avatar">
                            {getInitials(name)}
                          </div>

                          <div className="create-claim-patient-details">
                            <p className="create-claim-patient-name">
                              {name}
                            </p>

                            <div className="create-claim-patient-meta">
                              <span>
                                File No:{" "}
                                {getPatientNumber(patient)}
                              </span>

                              {getPatientPhone(patient) && (
                                <span>
                                  Phone:{" "}
                                  {getPatientPhone(patient)}
                                </span>
                              )}

                              {patient?.gender && (
                                <span>
                                  Gender:{" "}
                                  {patient.gender}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="create-claim-result-actions">
                          <button
                            type="button"
                            className="create-claim-button create-claim-button-primary"
                            onClick={() =>
                              selectPatient(patient)
                            }
                          >
                            {isSelected
                              ? "✓ Selected"
                              : "Select Patient"}
                          </button>

                          <button
                            type="button"
                            className="create-claim-button create-claim-button-secondary"
                            onClick={() =>
                              openPatientFile(patient)
                            }
                          >
                            Open Patient File ↗
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}

        {/* SELECTED PATIENT */}

        {selectedPatient && (
          <div className="create-claim-selected">
            <div>
              <div className="create-claim-selected-label">
                ✓ Patient selected
              </div>

              <div className="create-claim-selected-name">
                {getPatientName(selectedPatient)}
              </div>

              <div className="create-claim-selected-meta">
                File No:{" "}
                {getPatientNumber(selectedPatient)}

                {getPatientPhone(selectedPatient)
                  ? ` · Phone: ${getPatientPhone(selectedPatient)}`
                  : ""}
              </div>
            </div>

            <div className="create-claim-selected-actions">
              <button
                type="button"
                className="create-claim-button create-claim-button-secondary"
                onClick={() =>
                  openPatientFile(selectedPatient)
                }
              >
                Open Patient File ↗
              </button>

              {!isRenewalMode && !isEditing && (
                <button
                  type="button"
                  className="create-claim-button create-claim-button-light"
                  onClick={() => {
                    setSelectedPatient(null);
                    setSearch("");
                    setShowResults(false);
                    setError("");
                    setSuccess("");
                    setCreatedClaim(null);
                  }}
                >
                  Change Patient
                </button>
              )}
            </div>
          </div>
        )}

        {!selectedPatient &&
          !loadingPatients &&
          (isRenewalMode || isEditing) && (
            <div className="create-claim-empty">
              The patient associated with this claim could not be loaded.
              Verify the claim's patient ID.
            </div>
          )}
      </section>

      {/* =====================================================
          SECTION 2 - CLAIM DETAILS
      ===================================================== */}

      <section className="create-claim-card">
        <div className="create-claim-section-heading">
          <div className="create-claim-section-number">
            2
          </div>

          <div>
            <h2 className="create-claim-section-title">
              Claim Details
            </h2>

            <p className="create-claim-section-description">
              Record the claim reference, requesting clinician,
              authorization details, approval information, and status.
            </p>
          </div>
        </div>

        <form onSubmit={submitClaim}>
          <div className="create-claim-form-grid">

            {/* PATIENT FILE NUMBER */}

            <ClaimTextField
              id="claim-patient-file-number"
              label="Patient File Number"
              icon="file"
              value={
                selectedPatient
                  ? getPatientNumber(selectedPatient)
                  : ""
              }
              placeholder="Select a patient"
              readOnly
              note={
                selectedPatient &&
                getPatientNumber(selectedPatient) === "N/A"
                  ? "File number is not available in the patient record returned by the API."
                  : null
              }
            />

            {/* CLAIM REFERENCE */}

            <ClaimTextField
              id="claim-reference"
              label="Claim Number / Reference"
              icon="hash"
              value={form.claimId}
              onChange={(event) => {
                if (!isRenewalMode) {
                  updateForm(
                    "claimId",
                    event.target.value
                  );
                }
              }}
              placeholder="Enter claim number or reference"
              readOnly={isRenewalMode}
              required
            />

            {/* REQUESTING CLINICIAN */}

            <div className="create-claim-field create-claim-field-full">
              <label
                className="create-claim-label"
                htmlFor="claim-requesting-clinician"
              >
                Requesting Clinician
              </label>

              <div className="create-claim-search-box">
                <span className="create-claim-control-icon">
                  <ClaimIcon name="user" />
                </span>

                <input
                  id="claim-requesting-clinician"
                  className="create-claim-search-input"
                  type="search"
                  value={
                    isRenewalMode
                      ? selectedClinician
                        ? getUserName(selectedClinician)
                        : ""
                      : showClinicianResults
                        ? clinicianSearch
                        : selectedClinician
                          ? `${getUserName(selectedClinician)} — ${getUserRole(selectedClinician)}`
                          : clinicianSearch
                  }
                  placeholder={
                    loadingUsers
                      ? "Loading clinicians..."
                      : "Search physiotherapists or physicians..."
                  }
                  readOnly={isRenewalMode}
                  disabled={
                    loadingUsers ||
                    Boolean(usersError)
                  }
                  autoComplete="off"
                  onFocus={() => {
                    if (!isRenewalMode) {
                      setClinicianSearch("");
                      setShowClinicianResults(true);
                    }
                  }}
                  onChange={(event) => {
                    setClinicianSearch(
                      event.target.value
                    );
                    setShowClinicianResults(true);
                  }}
                />

                {!isRenewalMode &&
                  form.requestingClinician && (
                    <button
                      type="button"
                      className="create-claim-button create-claim-button-secondary create-claim-button-small"
                      onClick={() => {
                        updateForm(
                          "requestingClinician",
                          ""
                        );
                        setClinicianSearch("");
                        setShowClinicianResults(false);
                      }}
                    >
                      Clear
                    </button>
                  )}
              </div>

              {usersError && (
                <div
                  className="create-claim-form-note"
                  style={{ color: "#b91c1c" }}
                >
                  {usersError}
                </div>
              )}

              {!usersError &&
                !loadingUsers &&
                clinicians.length === 0 && (
                  <div className="create-claim-form-note">
                    No physiotherapists or physicians were found.
                    Check their assigned user roles.
                  </div>
                )}

              {!isRenewalMode &&
                showClinicianResults &&
                !loadingUsers &&
                !usersError && (
                  <div className="create-claim-clinician-list">
                    {filteredClinicians.length === 0 ? (
                      <div className="create-claim-empty">
                        No matching clinicians found.
                      </div>
                    ) : (
                      filteredClinicians.map((user) => {
                        const userId =
                          user.id ?? user.pk;

                        const active =
                          String(
                            form.requestingClinician
                          ) === String(userId);

                        return (
                          <button
                            key={userId}
                            type="button"
                            className={`create-claim-clinician-option${
                              active ? " active" : ""
                            }`}
                            onClick={() =>
                              selectClinician(user)
                            }
                          >
                            <div className="create-claim-clinician-name">
                              {getUserName(user)}
                            </div>

                            <div className="create-claim-clinician-role">
                              {getUserRole(user)}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}

              <div className="create-claim-form-note">
                Select a registered physiotherapist or physician.
              </div>
            </div>

            {/* AUTHORIZATION NUMBER */}

            <ClaimTextField
              id="claim-authorization-number"
              label="Authorization Number"
              icon="shield"
              value={form.authorizationNumber}
              onChange={(event) =>
                updateForm(
                  "authorizationNumber",
                  event.target.value
                )
              }
              placeholder="Enter authorization number"
              readOnly={isRenewalMode}
            />

            {/* APPROVAL DATE */}

            <ClaimDateField
              id="claim-approval-date"
              label="Approval Date"
              value={form.approvalDate}
              onChange={(event) =>
                updateForm(
                  "approvalDate",
                  event.target.value
                )
              }
              readOnly={isRenewalMode}
            />

            {/* EXPIRATION DATE */}

            <ClaimDateField
              id="claim-expiration-date"
              label="Expiration Date"
              value={form.expirationDate}
              min={form.approvalDate || undefined}
              onChange={(event) =>
                updateForm(
                  "expirationDate",
                  event.target.value
                )
              }
              readOnly={isRenewalMode}
            />

            {/* APPROVED VISITS */}

            <ClaimTextField
              id="claim-approved-visits"
              label="Approved Visits"
              icon="visits"
              type="number"
              min="0"
              step="1"
              value={form.approvedVisits}
              onChange={(event) =>
                updateForm(
                  "approvedVisits",
                  event.target.value
                )
              }
              placeholder="Enter number of approved visits"
              readOnly={isRenewalMode}
            />

            {/* APPROVED UNITS */}

            <ClaimTextField
              id="claim-approved-units"
              label="Approved Units"
              icon="layers"
              type="number"
              min="0"
              step="1"
              value={form.approvedUnits}
              onChange={(event) =>
                updateForm(
                  "approvedUnits",
                  event.target.value
                )
              }
              placeholder="Enter number of approved units"
              readOnly={isRenewalMode}
            />

            {/* APPROVED SERVICE */}

            <ClaimTextField
              id="claim-approved-service"
              label="Approved Service"
              icon="activity"
              value={form.approvedService}
              onChange={(event) =>
                updateForm(
                  "approvedService",
                  event.target.value
                )
              }
              placeholder="e.g. Physiotherapy"
              readOnly={isRenewalMode}
            />

            {/* INSURANCE / PAYER */}

            <ClaimTextField
              id="claim-insurance-payer"
              label="Insurance / Payer"
              icon="building"
              value={form.insurancePayer}
              onChange={(event) =>
                updateForm(
                  "insurancePayer",
                  event.target.value
                )
              }
              placeholder="Enter insurance company or payer"
              readOnly={isRenewalMode}
            />

            {/* CLAIM STATUS */}

            <ClaimSelectField
              id="claim-status"
              label="Claim Status"
              value={form.status}
              onChange={(event) =>
                handleStatusChange(
                  event.target.value
                )
              }
              disabled={isRenewalMode}
              required
              options={[
                {
                  value: "Pending",
                  label: "Pending",
                },
                {
                  value: "Submitted",
                  label: "Submitted",
                },
                {
                  value: "Approved",
                  label: "Approved",
                },
                {
                  value: "Rejected",
                  label: "Rejected",
                },
              ]}
            />

            {/* REJECTION REASON */}

            {isRejected && !isRenewalMode && (
              <div className="create-claim-field create-claim-field-full">
                <label
                  className="create-claim-label"
                  htmlFor="claim-rejection-reason"
                >
                  Rejection Reason
                  <span className="create-claim-required">
                    *
                  </span>
                </label>

                <div className="create-claim-textarea-control">
                  <textarea
                    id="claim-rejection-reason"
                    className="create-claim-textarea"
                    value={form.rejectionReason}
                    onChange={(event) =>
                      updateForm(
                        "rejectionReason",
                        event.target.value
                      )
                    }
                    placeholder="Explain why the claim was rejected..."
                    required
                  />
                </div>
              </div>
            )}

            {/* RENEWAL REMINDER */}

            {isRejected && !isRenewalMode && (
              <div className="create-claim-renewal-panel">
                <div className="create-claim-renewal-heading">
                  <div className="create-claim-renewal-icon">
                    ↻
                  </div>

                  <div>
                    <h3 className="create-claim-renewal-title">
                      Renewal Reminder
                    </h3>

                    <p className="create-claim-renewal-description">
                      {isEditing
                        ? "Optionally add a renewal reminder to this existing rejected claim."
                        : "Optionally create a renewal reminder for this rejected claim."}
                      {" "}
                      The claim remains Rejected until
                      the renewal is submitted.
                    </p>
                  </div>
                </div>

                <div className="create-claim-form-grid">
                  <div className="create-claim-field-full">
                    <ClaimDateField
                      id="claim-renewal-date"
                      label="Renewal Date"
                      value={form.renewalDate}
                      min={getLocalToday()}
                      onChange={(event) =>
                        updateForm(
                          "renewalDate",
                          event.target.value
                        )
                      }
                      note="Select today or a future date. This date is used only when the reminder checkbox is selected."
                    />
                  </div>

                  <div className="create-claim-field create-claim-field-full">
                    <label className="create-claim-checkbox-row">
                      <input
                        type="checkbox"
                        checked={createRenewalAlert}
                        onChange={(event) => {
                          const checked =
                            event.target.checked;

                          setCreateRenewalAlert(
                            checked
                          );

                          if (
                            checked &&
                            !form.renewalDate
                          ) {
                            updateForm(
                              "renewalDate",
                              getLocalToday()
                            );
                          }
                        }}
                      />

                      <span>
                        <span className="create-claim-checkbox-title">
                          Create renewal reminder
                        </span>

                        <div className="create-claim-checkbox-description">
                          {createRenewalAlert
                            ? form.renewalDate
                              ? `A reminder will be created for ${formatClaimDate(form.renewalDate)}.`
                              : "Please select a renewal date."
                            : "Optional. Check this box to create a reminder."}
                        </div>
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* EXISTING RENEWAL DATE */}

            {isRenewalMode && (
              <div className="create-claim-field-full">
                <ClaimDateField
                  id="renewal-readonly-date"
                  label="Scheduled Renewal Date"
                  value={renewalDate}
                  readOnly
                  note="The scheduled date comes from the existing reminder."
                />
              </div>
            )}

            {/* ORIGINAL REJECTION REASON */}

            {isRenewalMode &&
              form.rejectionReason && (
                <div className="create-claim-field create-claim-field-full">
                  <label
                    className="create-claim-label"
                    htmlFor="renewal-rejection-reason"
                  >
                    Original Rejection Reason
                  </label>

                  <div className="create-claim-textarea-control">
                    <textarea
                      id="renewal-rejection-reason"
                      className="create-claim-textarea"
                      value={form.rejectionReason}
                      readOnly
                    />
                  </div>
                </div>
              )}
          </div>

          {/* FORM FOOTER */}

          <div className="create-claim-form-footer">
            <div className="create-claim-footer-note">
              {isRenewalMode
                ? "The existing claim is updated after successful renewal submission."
                : isEditing
                  ? "Update the existing claim. An optional renewal reminder can be created for rejected claims."
                  : "Create a new claim with an optional renewal reminder."}
            </div>

            <div className="create-claim-footer-actions">
              <button
                type="button"
                className="create-claim-button create-claim-button-secondary"
                onClick={resetForm}
                disabled={saving || loadingClaim}
              >
                {isRenewalMode
                  ? "Reset Details"
                  : isEditing
                    ? "Reset Changes"
                    : "Reset Form"}
              </button>

              {isEditing && (
                <button
                  type="button"
                  className="create-claim-button create-claim-button-secondary"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                className="create-claim-button create-claim-button-primary"
                disabled={
                  saving ||
                  loadingPatients ||
                  loadingClaim ||
                  claimLoadFailed ||
                  !selectedPatient
                }
              >
                {saving
                  ? isEditing
                    ? "Updating Claim..."
                    : "Saving..."
                  : isRenewalMode
                    ? "Submit Renewal"
                    : isEditing
                      ? "Update Claim"
                      : "Create Claim"}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

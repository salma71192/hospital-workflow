import React, { useState } from "react";
import PatientAutocompleteFilter from "../booking/PatientAutocompleteFilter";
function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function getDateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return getLocalDateString(date);
}
function getMonthStart() {
  const date = new Date();
  date.setDate(1);
  return getLocalDateString(date);
}
function getMonthEnd() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1, 0);
  return getLocalDateString(date);
}
export default function RegistrationTrackerFilters({
  mode,
  onChangeMode,
  title,
  subtitle,
  today,
  filter,
  setFilter,
  agents = [],
  therapists = [],
  onApplyFilters,
}) {
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const updateFilter = (key, value) => {
    setFilter((prev) => ({
      ...prev,
      [key]: value,
    }));
  };
  const applyPreset = (preset) => {
    const currentToday = today || getLocalDateString();
    let nextMode;
    let nextFilters = { ...filter };
    if (preset === "today") {
      nextMode = "today";
      nextFilters.date = currentToday;
    } else if (preset === "week") {
      nextMode = "monthly";
      nextFilters.from_date = getDateOffset(-6);
      nextFilters.to_date = currentToday;
    } else if (preset === "month") {
      nextMode = "monthly";
      nextFilters.from_date = getMonthStart();
      nextFilters.to_date = getMonthEnd();
    } else {
      return;
    }
    // Update the visible controls.
    setFilter((prev) => ({
      ...prev,
      ...nextFilters,
    }));
    // Apply the exact new filter values, not stale state.
    onChangeMode?.(nextMode);
    onApplyFilters?.(nextFilters, nextMode);
  };
  const clearExtraFilters = () => {
    setFilter((prev) => ({
      ...prev,
      user_id: "all",
      therapist_id: "all",
      patient: "",
    }));
  };
  const isExtraFilterActive =
    (filter.user_id && filter.user_id !== "all") ||
    (filter.therapist_id && filter.therapist_id !== "all") ||
    Boolean(filter.patient);
  return (
    <section style={styles.card}>
      <div style={styles.headerRow}>
        <div style={styles.heading}>
          <div style={styles.eyebrow}>Registration Tracker</div>
          <h2 style={styles.title}>{title}</h2>
          <p style={styles.subtext}>{subtitle}</p>
        </div>
        <div style={styles.modeButtons}>
          <button
            type="button"
            style={{
              ...styles.modeBtn,
              ...(mode === "today" ? styles.modeBtnActive : {}),
            }}
            onClick={() => onChangeMode?.("today")}
          >
            Same Day
          </button>
          <button
            type="button"
            style={{
              ...styles.modeBtn,
              ...(mode === "monthly" ? styles.modeBtnActive : {}),
            }}
            onClick={() => onChangeMode?.("monthly")}
          >
            Date Range
          </button>
        </div>
      </div>
      <div style={styles.presetSection}>
        <span style={styles.presetLabel}>Quick date range</span>
        <div style={styles.presetButtons}>
          <button
            type="button"
            style={styles.presetButton}
            onClick={() => applyPreset("today")}
          >
            Today
          </button>
          <button
            type="button"
            style={styles.presetButton}
            onClick={() => applyPreset("week")}
          >
            Last 7 Days
          </button>
          <button
            type="button"
            style={styles.presetButton}
            onClick={() => applyPreset("month")}
          >
            This Month
          </button>
        </div>
      </div>
      <div style={styles.dateSection}>
        {mode === "today" ? (
          <div style={styles.dateField}>
            <label style={styles.label} htmlFor="registration-date">
              Registration Date
            </label>
            <input
              id="registration-date"
              type="date"
              value={filter.date || today || ""}
              onChange={(e) => updateFilter("date", e.target.value)}
              style={styles.input}
            />
          </div>
        ) : (
          <>
            <div style={styles.dateField}>
              <label style={styles.label} htmlFor="registration-from-date">
                From Date
              </label>
              <input
                id="registration-from-date"
                type="date"
                value={filter.from_date || ""}
                onChange={(e) => updateFilter("from_date", e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.dateField}>
              <label style={styles.label} htmlFor="registration-to-date">
                To Date
              </label>
              <input
                id="registration-to-date"
                type="date"
                value={filter.to_date || ""}
                min={filter.from_date || undefined}
                onChange={(e) => updateFilter("to_date", e.target.value)}
                style={styles.input}
              />
            </div>
          </>
        )}
      </div>
      <div style={styles.actionsRow}>
        <button
          type="button"
          style={styles.primaryButton}
          onClick={() => onApplyFilters?.(filter, mode)}
        >
          Apply Filters
        </button>
        <button
          type="button"
          style={styles.secondaryButton}
          onClick={() => setShowMoreFilters((prev) => !prev)}
          aria-expanded={showMoreFilters}
        >
          {showMoreFilters ? "Hide More Filters" : "More Filters"}
          {isExtraFilterActive ? " •" : ""}
        </button>
      </div>
      {showMoreFilters && (
        <div style={styles.moreFilters}>
          <div style={styles.moreFiltersHeader}>
            <div>
              <div style={styles.moreFiltersTitle}>Additional Filters</div>
              <div style={styles.moreFiltersSubtitle}>
                Narrow results by user, physiotherapist, or patient.
              </div>
            </div>
            <button
              type="button"
              style={styles.clearButton}
              onClick={clearExtraFilters}
            >
              Clear
            </button>
          </div>
          <div style={styles.filterGrid}>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="registration-user">
                User
              </label>
              <select
                id="registration-user"
                value={filter.user_id || "all"}
                onChange={(e) => updateFilter("user_id", e.target.value)}
                style={styles.input}
              >
                <option value="all">All Users</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={String(agent.id)}>
                    {agent.name || agent.username}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="registration-therapist">
                Physiotherapist
              </label>
              <select
                id="registration-therapist"
                value={filter.therapist_id || "all"}
                onChange={(e) => updateFilter("therapist_id", e.target.value)}
                style={styles.input}
              >
                <option value="all">All Physiotherapists</option>
                {therapists.map((therapist) => (
                  <option key={therapist.id} value={String(therapist.id)}>
                    {therapist.name || therapist.username}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.patientFilter}>
              <PatientAutocompleteFilter
                value={filter.patient || ""}
                onChange={(value) => updateFilter("patient", value)}
                label="Patient"
                placeholder="Search patient name or file number"
              />
            </div>
          </div>
          <div style={styles.bottomActions}>
            <button
              type="button"
              style={styles.primaryButton}
              onClick={() => onApplyFilters?.(filter, mode)}
            >
              Apply All Filters
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
const styles = {
  card: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "20px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.04)",
    display: "grid",
    gap: "18px",
    minWidth: 0,
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
  },
  heading: {
    display: "grid",
    gap: "5px",
    minWidth: 0,
  },
  eyebrow: {
    fontSize: "11px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.09em",
    color: "#64748b",
  },
  title: {
    margin: 0,
    fontSize: "23px",
    lineHeight: 1.3,
    fontWeight: "800",
    color: "#0f172a",
  },
  subtext: {
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.5,
    color: "#64748b",
  },
  modeButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  modeBtn: {
    background: "#ffffff",
    color: "#475569",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "10px 13px",
    fontWeight: "700",
    fontSize: "13px",
    cursor: "pointer",
  },
  modeBtnActive: {
    background: "#eff6ff",
    color: "#1d4ed8",
    borderColor: "#93c5fd",
  },
  presetSection: {
    display: "grid",
    gap: "9px",
  },
  presetLabel: {
    fontSize: "12px",
    fontWeight: "800",
    color: "#475569",
  },
  presetButtons: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  presetButton: {
    background: "#f8fafc",
    color: "#334155",
    border: "1px solid #e2e8f0",
    borderRadius: "9px",
    padding: "9px 13px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },
  dateSection: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "12px",
  },
  dateField: {
    display: "grid",
    gap: "7px",
    minWidth: 0,
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "800",
    color: "#475569",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    minWidth: 0,
    padding: "11px 12px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    color: "#0f172a",
    background: "#ffffff",
    outline: "none",
  },
  actionsRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
  },
  primaryButton: {
    background: "#0f172a",
    color: "#ffffff",
    border: "1px solid #0f172a",
    borderRadius: "10px",
    padding: "11px 17px",
    fontWeight: "800",
    fontSize: "13px",
    cursor: "pointer",
  },
  secondaryButton: {
    background: "#ffffff",
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "11px 15px",
    fontWeight: "700",
    fontSize: "13px",
    cursor: "pointer",
  },
  moreFilters: {
    display: "grid",
    gap: "16px",
    padding: "16px",
    borderRadius: "14px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },
  moreFiltersHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  moreFiltersTitle: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#0f172a",
  },
  moreFiltersSubtitle: {
    marginTop: "4px",
    fontSize: "12px",
    lineHeight: 1.5,
    color: "#64748b",
  },
  clearButton: {
    background: "#ffffff",
    color: "#475569",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px",
    alignItems: "start",
  },
  fieldGroup: {
    display: "grid",
    gap: "7px",
    minWidth: 0,
  },
  patientFilter: {
    minWidth: 0,
  },
  bottomActions: {
    display: "flex",
    justifyContent: "flex-end",
  },
};
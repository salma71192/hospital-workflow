import React from "react";
import PatientAutocompleteFilter from "../booking/PatientAutocompleteFilter";

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
  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <div>
          <div style={styles.eyebrow}>Registration Tracker</div>
          <div style={styles.title}>{title}</div>
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
            Whole Month
          </button>
        </div>
      </div>

      <div style={styles.subtext}>{subtitle}</div>

      <div style={styles.filterGrid}>
        {mode === "today" ? (
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Date</label>
            <input
              type="date"
              value={filter.date || today}
              onChange={(e) =>
                setFilter((prev) => ({
                  ...prev,
                  date: e.target.value,
                }))
              }
              style={styles.input}
            />
          </div>
        ) : (
          <>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>From Date</label>
              <input
                type="date"
                value={filter.from_date || ""}
                onChange={(e) =>
                  setFilter((prev) => ({
                    ...prev,
                    from_date: e.target.value,
                  }))
                }
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>To Date</label>
              <input
                type="date"
                value={filter.to_date || ""}
                onChange={(e) =>
                  setFilter((prev) => ({
                    ...prev,
                    to_date: e.target.value,
                  }))
                }
                style={styles.input}
              />
            </div>
          </>
        )}

        <div style={styles.fieldGroup}>
          <label style={styles.label}>User</label>
          <select
            value={filter.user_id || "all"}
            onChange={(e) =>
              setFilter((prev) => ({
                ...prev,
                user_id: e.target.value,
              }))
            }
            style={styles.input}
          >
            <option value="all">All</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name || agent.username}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Physio</label>
          <select
            value={filter.therapist_id || "all"}
            onChange={(e) =>
              setFilter((prev) => ({
                ...prev,
                therapist_id: e.target.value,
              }))
            }
            style={styles.input}
          >
            <option value="all">All</option>
            {therapists.map((therapist) => (
              <option key={therapist.id} value={therapist.id}>
                {therapist.name || therapist.username}
              </option>
            ))}
          </select>
        </div>

        <PatientAutocompleteFilter
          value={filter.patient || ""}
          onChange={(value) =>
            setFilter((prev) => ({
              ...prev,
              patient: value,
            }))
          }
          label="Patient"
          placeholder="Search patient name or file number"
        />

        <div style={styles.fieldGroupEnd}>
          <button
            type="button"
            style={styles.primaryButton}
            onClick={onApplyFilters}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "16px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.04)",
    display: "grid",
    gap: "14px",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
  },
  eyebrow: {
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#64748b",
  },
  title: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
  },
  subtext: {
    fontSize: "14px",
    color: "#64748b",
  },
  modeButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  modeBtn: {
    background: "#fff",
    color: "#475569",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  modeBtnActive: {
    background: "#f8fafc",
    color: "#0f172a",
    borderColor: "#94a3b8",
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
    alignItems: "end",
  },
  fieldGroup: {
    display: "grid",
    gap: "8px",
  },
  fieldGroupEnd: {
    display: "flex",
    alignItems: "end",
  },
  label: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#475569",
  },
  input: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    background: "#fff",
    outline: "none",
  },
  primaryButton: {
    background: "#0f172a",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    fontWeight: "800",
    cursor: "pointer",
    width: "100%",
  },
};
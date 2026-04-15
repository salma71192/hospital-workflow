import React, { useMemo } from "react";
import PatientAutocompleteFilter from "../booking/PatientAutocompleteFilter";

function getTodayString() {
  return new Date().toLocaleDateString("en-CA");
}

export default function RegistrationTrackerSection({
  mode = "today",
  onChangeMode,
  assignments = [],
  agents = [],
  therapists = [],
  filter,
  setFilter,
  onApplyFilters,
  onEditAssignment,
  onCancelAssignment,
}) {
  const today = getTodayString();

  const title = useMemo(() => {
    if (mode === "monthly") return "Whole Month Registration Tracker";
    return "Same Day Registration Tracker";
  }, [mode]);

  const subtitle = useMemo(() => {
    if (mode === "monthly") {
      return "View registrations for a month range with shared filters.";
    }
    return "View registrations for the selected day with shared filters.";
  }, [mode]);

  return (
    <div style={styles.page}>
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
                  {agent.username || agent.name}
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
                  {therapist.username || therapist.name}
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

      <div style={styles.card}>
        <div style={styles.sectionTitle}>{title}</div>

        {assignments.length === 0 ? (
          <div style={styles.emptyState}>No registrations found.</div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Patient</th>
                  <th style={styles.th}>File Number</th>
                  <th style={styles.th}>Physio</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Created By</th>
                  <th style={styles.th}>Notes</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {assignments.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>{item.patient_name}</td>
                    <td style={styles.td}>{item.patient_file_id}</td>
                    <td style={styles.td}>{item.therapist_name}</td>
                    <td style={styles.td}>{item.assignment_date}</td>
                    <td style={styles.td}>
                      {item.category_label || item.category || "-"}
                    </td>
                    <td style={styles.td}>{item.created_by_name || "-"}</td>
                    <td style={styles.td}>{item.notes || "-"}</td>
                    <td style={styles.td}>
                      <div style={styles.actions}>
                        {item.can_edit_today ? (
                          <button
                            type="button"
                            style={styles.editBtn}
                            onClick={() =>
                              onEditAssignment && onEditAssignment(item)
                            }
                          >
                            Edit
                          </button>
                        ) : (
                          <button
                            type="button"
                            style={styles.disabledBtn}
                            disabled
                          >
                            Edit
                          </button>
                        )}

                        {item.can_cancel_today ? (
                          <button
                            type="button"
                            style={styles.deleteBtn}
                            onClick={() =>
                              onCancelAssignment && onCancelAssignment(item)
                            }
                          >
                            Cancel
                          </button>
                        ) : (
                          <button
                            type="button"
                            style={styles.disabledBtn}
                            disabled
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "grid",
    gap: "16px",
  },
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "22px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
    display: "grid",
    gap: "16px",
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
    color: "#1e3a8a",
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
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: "800",
    cursor: "pointer",
  },
  modeBtnActive: {
    background: "#eff6ff",
    color: "#1d4ed8",
    borderColor: "#1d4ed8",
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
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    background: "#fff",
    outline: "none",
  },
  primaryButton: {
    background: "#1d4ed8",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    fontWeight: "800",
    cursor: "pointer",
    width: "100%",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1100px",
  },
  th: {
    textAlign: "left",
    padding: "12px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "13px",
    color: "#334155",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #eef2f7",
    fontSize: "14px",
    color: "#0f172a",
    verticalAlign: "top",
  },
  actions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  editBtn: {
    background: "#0ea5e9",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "700",
  },
  deleteBtn: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "700",
  },
  disabledBtn: {
    background: "#cbd5e1",
    color: "#64748b",
    border: "none",
    borderRadius: "8px",
    padding: "6px 10px",
    cursor: "not-allowed",
    fontSize: "12px",
    fontWeight: "700",
  },
  emptyState: {
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: "12px",
    padding: "14px",
  },
};
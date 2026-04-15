import React, { useMemo, useState } from "react";
import PatientAutocompleteFilter from "../booking/PatientAutocompleteFilter";
import BookingTargetStats from "../booking/BookingTargetStats";

function getPercent(value, total) {
  if (!total) return 0;
  return Math.round((Number(value || 0) / Number(total)) * 100);
}

export default function RegistrationTrackerSection({
  assignments = [],
  agents = [],
  therapists = [],
  filter,
  setFilter,
  onApplyFilters,
  defaultOpen = true,
  target = 0,
  onChangeTarget,
}) {
  const [open, setOpen] = useState(defaultOpen);

  const stats = useMemo(() => {
    const total = assignments.length;

    const walkIn = assignments.filter((a) => a.category === "walk_in").length;

    const appointment = assignments.filter(
      (a) =>
        a.category === "appointment" ||
        a.category === "has_appointment" ||
        a.category === "has appointments"
    ).length;

    const initialEval = assignments.filter(
      (a) =>
        a.category === "initial_eval" ||
        a.category === "initial_evaluation"
    ).length;

    const noEligibility = assignments.filter(
      (a) =>
        a.category === "task_without_eligibility" ||
        a.category === "no_eligibility"
    ).length;

    const other = Math.max(
      total - walkIn - appointment - initialEval - noEligibility,
      0
    );

    return {
      total,
      walkIn,
      appointment,
      initialEval,
      noEligibility,
      other,
      walkInPct: getPercent(walkIn, total),
      appointmentPct: getPercent(appointment, total),
      initialEvalPct: getPercent(initialEval, total),
      noEligibilityPct: getPercent(noEligibility, total),
      otherPct: getPercent(other, total),
    };
  }, [assignments]);

  return (
    <div style={styles.wrap}>
      <button
        type="button"
        style={styles.collapseHeader}
        onClick={() => setOpen((prev) => !prev)}
      >
        <div>
          <div style={styles.eyebrow}>Registration Tracker</div>
          <div style={styles.title}>Registration Tracker</div>
        </div>
        <div style={styles.chevron}>{open ? "−" : "+"}</div>
      </button>

      {open ? (
        <div style={styles.page}>
          <div style={styles.card}>
            <div style={styles.subtext}>
              Filter registrations by date range, user, patient, or physio.
            </div>

            <div style={styles.filterGrid}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>From Date</label>
                <input
                  type="date"
                  value={filter.from_date}
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
                  value={filter.to_date}
                  onChange={(e) =>
                    setFilter((prev) => ({
                      ...prev,
                      to_date: e.target.value,
                    }))
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>User</label>
                <select
                  value={filter.user_id}
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
                  value={filter.therapist_id}
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

          <BookingTargetStats
            title="Registration Target"
            target={target}
            actual={assignments.length}
            onChangeTarget={onChangeTarget}
          />

          <div style={styles.card}>
            <div style={styles.sectionTitle}>Registration Mix</div>

            <div style={styles.statsGrid}>
              <StatCard
                label="Total Registrations"
                value={stats.total}
                percent={100}
              />
              <StatCard
                label="Walk In"
                value={stats.walkIn}
                percent={stats.walkInPct}
              />
              <StatCard
                label="Has Appointment"
                value={stats.appointment}
                percent={stats.appointmentPct}
              />
              <StatCard
                label="Initial Eval"
                value={stats.initialEval}
                percent={stats.initialEvalPct}
              />
              <StatCard
                label="Task Without Eligibility"
                value={stats.noEligibility}
                percent={stats.noEligibilityPct}
              />
              <StatCard
                label="Other"
                value={stats.other}
                percent={stats.otherPct}
              />
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.sectionTitle}>Registration List</div>

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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ label, value, percent }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.percentText}>{percent}% of total</div>
      <div style={styles.track}>
        <div style={{ ...styles.fill, width: `${percent}%` }} />
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    display: "grid",
    gap: "12px",
  },
  collapseHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    textAlign: "left",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "18px 22px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
    cursor: "pointer",
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
  chevron: {
    fontSize: "26px",
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: 1,
  },
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
  subtext: {
    fontSize: "14px",
    color: "#64748b",
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
    background: "#1e3a8a",
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
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
  },
  statCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "14px",
    display: "grid",
    gap: "8px",
  },
  statLabel: {
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
    color: "#64748b",
  },
  statValue: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
  },
  percentText: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#475569",
  },
  track: {
    width: "100%",
    height: "10px",
    borderRadius: "999px",
    background: "#e2e8f0",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: "999px",
    background: "#1e3a8a",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "980px",
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
import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import DashboardStatsGrid from "../common/DashboardStatsGrid";

export default function TodayAssignmentsList({
  assignments = [],
  title = "Today's Assignment List",
  onEditAssignment,
  onCancelAssignment,
}) {
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredAssignments = useMemo(() => {
    if (categoryFilter === "all") return assignments;
    return assignments.filter((item) => item.category === categoryFilter);
  }, [assignments, categoryFilter]);

  const stats = useMemo(() => {
    const total = filteredAssignments.length;
    const appointment = filteredAssignments.filter(
      (item) => item.category === "appointment"
    ).length;
    const walkIn = filteredAssignments.filter(
      (item) => item.category === "walk_in"
    ).length;
    const initialEvaluation = filteredAssignments.filter(
      (item) => item.category === "initial_evaluation"
    ).length;
    const noEligibility = filteredAssignments.filter(
      (item) => item.category === "task_without_eligibility"
    ).length;

    return [
      { label: "Total", value: total },
      { label: "Appointment", value: appointment },
      { label: "Walk In", value: walkIn },
      { label: "Initial Eval", value: initialEvaluation },
      { label: "No Eligibility", value: noEligibility },
    ];
  }, [filteredAssignments]);

  const handleExportExcel = () => {
    const rows = filteredAssignments.map((item) => ({
      Patient: item.patient_name,
      Patient_ID: item.patient_file_id,
      Therapist: item.therapist_name,
      Date: item.assignment_date,
      Category: item.category_label || item.category || "-",
      Created_By: item.created_by_name || "-",
      Notes: item.notes || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "TodayAssignments");
    XLSX.writeFile(workbook, "today_assignments.xlsx");
  };

  return (
    <div style={styles.card}>
      <div style={styles.topRow}>
        <h2 style={styles.cardTitle}>{title}</h2>

        <div style={styles.actions}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={styles.select}
          >
            <option value="all">All Categories</option>
            <option value="appointment">Has Appointment</option>
            <option value="walk_in">Walk In</option>
            <option value="initial_evaluation">Initial Evaluation</option>
            <option value="task_without_eligibility">
              Task Without Eligibility
            </option>
          </select>

          <button style={styles.exportButton} onClick={handleExportExcel}>
            Export Excel
          </button>
        </div>
      </div>

      <DashboardStatsGrid stats={stats} />

      {filteredAssignments.length ? (
        <div style={styles.list}>
          {filteredAssignments.map((item) => (
            <div key={item.id} style={styles.cardItem}>
              <div>
                <div style={styles.patient}>{item.patient_name}</div>
                <div style={styles.meta}>
                  Patient ID: {item.patient_file_id}
                </div>
                <div style={styles.categoryBadge}>
                  {item.category_label || item.category || "-"}
                </div>
              </div>

              <div>
                <div style={styles.therapist}>
                  Therapist: {item.therapist_name}
                </div>
                <div style={styles.meta}>
                  Date: {item.assignment_date}
                </div>
                <div style={styles.meta}>
                  Created By: {item.created_by_name || "-"}
                </div>
                {item.notes ? (
                  <div style={styles.meta}>Notes: {item.notes}</div>
                ) : null}

                <div style={styles.buttonRow}>
                  {item.can_edit_today && onEditAssignment ? (
                    <button
                      type="button"
                      style={styles.editButton}
                      onClick={() => onEditAssignment(item)}
                    >
                      Edit
                    </button>
                  ) : null}

                  {item.can_cancel_today && onCancelAssignment ? (
                    <button
                      type="button"
                      style={styles.cancelButton}
                      onClick={() => onCancelAssignment(item)}
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.empty}>No assignments for selected category.</div>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
    display: "grid",
    gap: "18px",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: "22px",
    fontWeight: "800",
    margin: 0,
  },
  actions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  select: {
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    background: "#fff",
  },
  exportButton: {
    background: "#166534",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 16px",
    fontWeight: "700",
    cursor: "pointer",
  },
  list: {
    display: "grid",
    gap: "12px",
  },
  cardItem: {
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
  },
  patient: {
    fontWeight: "800",
    fontSize: "16px",
    marginBottom: "6px",
  },
  therapist: {
    fontWeight: "700",
    color: "#1d4ed8",
    marginBottom: "6px",
  },
  meta: {
    fontSize: "14px",
    color: "#64748b",
  },
  categoryBadge: {
    marginTop: "8px",
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#e0f2fe",
    color: "#0369a1",
    fontSize: "12px",
    fontWeight: "800",
  },
  buttonRow: {
    display: "flex",
    gap: "10px",
    marginTop: "12px",
    flexWrap: "wrap",
  },
  editButton: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "8px 12px",
    fontWeight: "700",
    cursor: "pointer",
  },
  cancelButton: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "8px 12px",
    fontWeight: "700",
    cursor: "pointer",
  },
  empty: {
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "10px",
    color: "#64748b",
  },
};
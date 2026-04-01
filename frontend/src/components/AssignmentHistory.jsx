import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import api from "../api/api";
import DashboardNotice from "./common/DashboardNotice";
import DashboardStatsGrid from "./common/DashboardStatsGrid";

export default function AssignmentHistory({
  title = "Assignment History",
  currentUser,
  actingAs,
}) {
  const today = new Date().toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      });

      if (
        actingAs &&
        (currentUser?.is_superuser || currentUser?.role === "admin")
      ) {
        params.append("viewed_user_id", String(actingAs.id));
        params.append("viewed_user_role", String(actingAs.role || ""));
      }

      const res = await api.get(`reception/assignments/?${params.toString()}`);
      setAssignments(res.data.assignments || []);
    } catch (err) {
      setError("Failed to load assignment history");
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [startDate, endDate, actingAs, currentUser]);

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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Assignments");

    const filename = `assignment_history_${startDate}_to_${endDate}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>{title}</h2>

      <div style={styles.filters}>
        <div style={styles.field}>
          <label style={styles.label}>Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={styles.input}
          >
            <option value="all">All</option>
            <option value="appointment">Has Appointment</option>
            <option value="walk_in">Walk In</option>
            <option value="initial_evaluation">Initial Evaluation</option>
            <option value="task_without_eligibility">
              Task Without Eligibility
            </option>
          </select>
        </div>

        <button style={styles.button} onClick={loadHistory}>
          Refresh
        </button>

        <button style={styles.exportButton} onClick={handleExportExcel}>
          Export Excel
        </button>
      </div>

      {error && <DashboardNotice type="error">{error}</DashboardNotice>}

      <DashboardStatsGrid stats={stats} />

      {loading && <div style={styles.loading}>Loading...</div>}

      {!loading && filteredAssignments.length > 0 && (
        <div style={styles.list}>
          {filteredAssignments.map((item) => (
            <div key={item.id} style={styles.card}>
              <div style={styles.left}>
                <div style={styles.patient}>{item.patient_name}</div>
                <div style={styles.meta}>
                  Patient ID: {item.patient_file_id}
                </div>

                <div style={styles.categoryBadge}>
                  {item.category_label || item.category || "-"}
                </div>
              </div>

              <div style={styles.right}>
                <div style={styles.meta}>
                  Therapist: {item.therapist_name}
                </div>

                <div style={styles.meta}>Date: {item.assignment_date}</div>

                <div style={styles.meta}>
                  Created By: {item.created_by_name || "-"}
                </div>

                {item.notes && (
                  <div style={styles.meta}>Notes: {item.notes}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredAssignments.length === 0 && !error && (
        <div style={styles.empty}>No assignments found for selected range.</div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    background: "#fff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
    display: "grid",
    gap: "18px",
  },

  title: {
    fontSize: "22px",
    fontWeight: "800",
    margin: 0,
  },

  filters: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    alignItems: "end",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    minWidth: "180px",
  },

  label: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
  },

  input: {
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    background: "#fff",
  },

  button: {
    background: "#1d4ed8",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 16px",
    fontWeight: "700",
    cursor: "pointer",
    height: "42px",
  },

  exportButton: {
    background: "#166534",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 16px",
    fontWeight: "700",
    cursor: "pointer",
    height: "42px",
  },

  list: {
    display: "grid",
    gap: "12px",
  },

  card: {
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
  },

  left: {
    minWidth: "200px",
  },

  right: {
    minWidth: "200px",
  },

  patient: {
    fontWeight: "800",
    fontSize: "16px",
    marginBottom: "6px",
  },

  meta: {
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "4px",
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

  empty: {
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "10px",
    color: "#64748b",
  },

  loading: {
    color: "#64748b",
    fontWeight: "600",
  },
};
import React, { useEffect, useState } from "react";
import api from "../api/api";

export default function AssignmentHistory({ title = "Assignment History" }) {
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [startDate, setStartDate] = useState(sevenDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState("");

  const loadHistory = async (start = startDate, end = endDate) => {
    setError("");
    try {
      const res = await api.get(
        `reception/assignments/?start_date=${start}&end_date=${end}`
      );
      setAssignments(res.data.assignments || []);
    } catch (err) {
      setError("Failed to load assignment history");
    }
  };

  useEffect(() => {
    loadHistory(sevenDaysAgo, today);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadHistory(startDate, endDate);
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>{title}</h2>

      <form onSubmit={handleSearch} style={styles.filterRow}>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={styles.input}
          required
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={styles.input}
          required
        />

        <button type="submit" style={styles.primaryButton}>
          Show History
        </button>
      </form>

      {error && <div style={styles.errorBox}>{error}</div>}

      {assignments.length > 0 ? (
        <div style={styles.assignmentList}>
          {assignments.map((item) => (
            <div key={item.id} style={styles.assignmentCard}>
              <div>
                <div style={styles.assignmentPatient}>{item.patient_name}</div>
                <div style={styles.assignmentMeta}>
                  Patient ID: {item.patient_file_id}
                </div>
                <div style={styles.assignmentMeta}>
                  Therapist: {item.therapist_name}
                </div>
              </div>

              <div>
                <div style={styles.assignmentMeta}>
                  Date: {item.assignment_date}
                </div>
                <div style={styles.assignmentMeta}>
                  Created By: {item.created_by_name || "-"}
                </div>
                {item.notes ? (
                  <div style={styles.assignmentMeta}>Notes: {item.notes}</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.emptyState}>
          No assignments found in this date range.
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: "22px",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e8eef7",
    padding: "24px",
  },
  cardTitle: {
    margin: "0 0 18px 0",
    fontSize: "28px",
    fontWeight: "800",
    color: "#0f172a",
  },
  filterRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr auto",
    gap: "12px",
    alignItems: "center",
    marginBottom: "18px",
  },
  input: {
    padding: "13px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box",
  },
  primaryButton: {
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "13px 18px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },
  errorBox: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    padding: "14px 16px",
    marginBottom: "16px",
    fontWeight: "700",
  },
  assignmentList: {
    display: "grid",
    gap: "12px",
  },
  assignmentCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
  },
  assignmentPatient: {
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: "6px",
    fontSize: "17px",
  },
  assignmentMeta: {
    color: "#64748b",
    fontSize: "14px",
    marginBottom: "4px",
  },
  emptyState: {
    padding: "18px",
    borderRadius: "12px",
    background: "#f8fafc",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
    fontWeight: "600",
  },
};
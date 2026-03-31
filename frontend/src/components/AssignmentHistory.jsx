import React, { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import AssignmentProgressCard from "./AssignmentProgressCard";

export default function AssignmentHistory({
  title = "Assignment History",
  currentUser,
}) {
  const today = new Date().toISOString().split("T")[0];
  const firstDayOfMonth = `${today.slice(0, 7)}-01`;
  const isAdmin =
    currentUser?.is_superuser || currentUser?.role === "admin";

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [monthlyTarget, setMonthlyTarget] = useState(100);

  const [selectedUserType, setSelectedUserType] = useState("reception");
  const [selectedUserId, setSelectedUserId] = useState("");

  const [receptionists, setReceptionists] = useState([]);
  const [therapists, setTherapists] = useState([]);

  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;

    const loadFilters = async () => {
      try {
        const res = await api.get("reception/staff-filters/");
        setReceptionists(res.data.receptionists || []);
        setTherapists(res.data.therapists || []);
      } catch (err) {
        console.error("Failed to load staff filters", err);
      }
    };

    loadFilters();
  }, [isAdmin]);

  const totalAssignments = useMemo(() => assignments.length, [assignments]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");

    if (isAdmin && !selectedUserId) {
      setAssignments([]);
      setHasSearched(true);
      setError("Please select one user first.");
      return;
    }

    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      });

      if (isAdmin && selectedUserId) {
        if (selectedUserType === "reception") {
          params.append("created_by_id", selectedUserId);
        } else {
          params.append("therapist_id", selectedUserId);
        }
      }

      const res = await api.get(`reception/assignments/?${params.toString()}`);
      setAssignments(res.data.assignments || []);
      setHasSearched(true);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load assignment history");
      setAssignments([]);
      setHasSearched(true);
    }
  };

  const currentOptions =
    selectedUserType === "reception" ? receptionists : therapists;

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>{title}</h2>

      <form onSubmit={handleSearch} style={styles.filterGrid}>
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

        <input
          type="number"
          min="1"
          value={monthlyTarget}
          onChange={(e) => setMonthlyTarget(e.target.value)}
          style={styles.input}
          placeholder="Target"
        />

        {isAdmin && (
          <select
            value={selectedUserType}
            onChange={(e) => {
              setSelectedUserType(e.target.value);
              setSelectedUserId("");
            }}
            style={styles.input}
          >
            <option value="reception">Reception</option>
            <option value="physio">Physio</option>
          </select>
        )}

        {isAdmin && (
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            style={styles.input}
          >
            <option value="">Select one user</option>
            {currentOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.username}
              </option>
            ))}
          </select>
        )}

        <button type="submit" style={styles.primaryButton}>
          Show History
        </button>
      </form>

      <div style={styles.summaryWrap}>
        <AssignmentProgressCard
          title="Selected User Statistics"
          count={totalAssignments}
          target={monthlyTarget}
          subtitle={`${startDate} to ${endDate}`}
        />
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {!hasSearched ? (
        <div style={styles.emptyState}>
          Select dates and one user, then click Show History.
        </div>
      ) : assignments.length > 0 ? (
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
          No assignments found for the selected user/date filters.
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
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
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
  summaryWrap: {
    marginBottom: "18px",
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
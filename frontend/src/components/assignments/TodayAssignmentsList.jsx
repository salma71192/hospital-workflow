import React from "react";

export default function TodayAssignmentsList({ assignments = [] }) {
  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Today's Assignment List</h2>

      {assignments.length ? (
        <div style={styles.list}>
          {assignments.map((item) => (
            <div key={item.id} style={styles.cardItem}>
              <div>
                <div style={styles.patient}>{item.patient_name}</div>
                <div style={styles.meta}>
                  Patient ID: {item.patient_file_id}
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
                {item.notes && (
                  <div style={styles.meta}>Notes: {item.notes}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.empty}>No assignments for today.</div>
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
  },
  cardTitle: {
    fontSize: "22px",
    fontWeight: "800",
    marginBottom: "18px",
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
  empty: {
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "10px",
    color: "#64748b",
  },
};
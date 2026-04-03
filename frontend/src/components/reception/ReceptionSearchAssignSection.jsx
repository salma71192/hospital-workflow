import React from "react";
import PatientSummaryCard from "../patients/PatientSummaryCard";

export default function ReceptionSearchAssignSection({
  search,
  setSearch,
  handleSearch,
  therapists = [],
  selectedTherapist,
  setSelectedTherapist,
  category,
  setCategory,
  patients = [],
  handleAssign,
}) {
  return (
    <>
      <div style={styles.card}>
        <h2 style={styles.title}>Search & Assign Patient</h2>

        <div style={styles.row}>
          <input
            placeholder="Search patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.input}
          />

          <button onClick={handleSearch} style={styles.button}>
            Search
          </button>
        </div>

        <div style={styles.row}>
          <select
            value={selectedTherapist}
            onChange={(e) => setSelectedTherapist(e.target.value)}
            style={styles.input}
          >
            <option value="">Select Therapist</option>
            {therapists.map((t) => (
              <option key={t.id} value={t.id}>
                {t.username}
              </option>
            ))}
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={styles.input}
          >
            <option value="appointment">Appointment</option>
            <option value="walk_in">Walk In</option>
            <option value="initial_evaluation">Initial Evaluation</option>
            <option value="task_without_eligibility">No Eligibility</option>
          </select>
        </div>
      </div>

      <div style={styles.grid}>
        {patients.map((patient) => (
          <PatientSummaryCard
            key={patient.id}
            patient={patient}
            actionLabel="Assign"
            onAction={handleAssign}
          />
        ))}
      </div>
    </>
  );
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "20px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
  },
  title: {
    marginBottom: "12px",
    fontSize: "20px",
    fontWeight: "700",
  },
  row: {
    display: "flex",
    gap: "10px",
    marginBottom: "10px",
    flexWrap: "wrap",
  },
  input: {
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    flex: 1,
    minWidth: "220px",
  },
  button: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "16px",
  },
};
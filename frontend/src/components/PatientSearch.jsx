import React, { useState } from "react";
import api from "../api/api";

export default function PatientSearch() {
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const url = search
        ? `patients/?search=${encodeURIComponent(search)}`
        : "patients/";
      const res = await api.get(url);
      setPatients(res.data.patients || []);
    } catch (err) {
      setError("Failed to search patients");
    }
  };

  const handleClear = () => {
    setSearch("");
    setPatients([]);
    setError("");
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Search Patient Files</h2>

      <form onSubmit={handleSearch} style={styles.searchForm}>
        <input
          type="text"
          placeholder="Search by patient name or ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.input}
        />
        <button type="submit" style={styles.primaryButton}>
          Search
        </button>
        <button type="button" style={styles.secondaryButton} onClick={handleClear}>
          Clear
        </button>
      </form>

      {error && <p style={styles.error}>{error}</p>}

      {patients.length ? (
        <div style={styles.patientList}>
          {patients.map((patient) => (
            <div key={patient.id} style={styles.patientCard}>
              <div style={styles.patientName}>{patient.name}</div>
              <div style={styles.patientMeta}>Patient ID: {patient.patient_id}</div>
              <div style={styles.patientMeta}>
                Current Approval Number: {patient.current_approval_number || "-"}
              </div>
              <div style={styles.patientMeta}>
                Sessions Taken: {patient.sessions_taken ?? 0}
              </div>
              <div style={styles.patientMeta}>
                Taken With: {patient.taken_with || "-"}
              </div>
              <div style={styles.patientMeta}>
                Current / Future Appointments: {patient.current_future_appointments || "-"}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.emptyState}>Search to view patient files.</div>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
    marginBottom: "20px",
  },
  cardTitle: {
    margin: "0 0 18px 0",
    fontSize: "24px",
    color: "#0f172a",
  },
  searchForm: {
    display: "grid",
    gridTemplateColumns: "1fr auto auto",
    gap: "12px",
    alignItems: "center",
    marginBottom: "18px",
  },
  input: {
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
  },
  primaryButton: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  secondaryButton: {
    background: "#e2e8f0",
    color: "#0f172a",
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  error: {
    color: "#dc2626",
    marginTop: "14px",
    fontWeight: "600",
  },
  patientList: {
    display: "grid",
    gap: "12px",
  },
  patientCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "16px",
  },
  patientName: {
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "8px",
    fontSize: "18px",
  },
  patientMeta: {
    color: "#64748b",
    fontSize: "14px",
    marginBottom: "6px",
  },
  emptyState: {
    padding: "18px",
    borderRadius: "12px",
    background: "#f8fafc",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
  },
};
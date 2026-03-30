import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function PatientSearch() {
  const navigate = useNavigate();

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
    <div style={styles.wrapper}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.cardTitle}>Search Patient Files</h2>
          <p style={styles.subText}>
            Search by patient name or patient ID, then open the full file.
          </p>
        </div>
      </div>

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
        <div style={styles.grid}>
          {patients.map((patient) => (
            <div
              key={patient.id}
              style={styles.patientCard}
              onClick={() => navigate(`/patients/${patient.id}`)}
            >
              <div style={styles.topLine}>
                <div>
                  <div style={styles.patientName}>{patient.name}</div>
                  <div style={styles.patientId}>ID: {patient.patient_id}</div>
                </div>
                <div style={styles.openBadge}>Open File</div>
              </div>

              <div style={styles.infoGrid}>
                <div style={styles.infoBox}>
                  <span style={styles.infoLabel}>Approval</span>
                  <span style={styles.infoValue}>
                    {patient.current_approval_number || "-"}
                  </span>
                </div>

                <div style={styles.infoBox}>
                  <span style={styles.infoLabel}>Sessions</span>
                  <span style={styles.infoValue}>
                    {patient.sessions_taken ?? 0}
                  </span>
                </div>

                <div style={styles.infoBoxWide}>
                  <span style={styles.infoLabel}>Taken With</span>
                  <span style={styles.infoValue}>
                    {patient.taken_with || "-"}
                  </span>
                </div>

                <div style={styles.infoBoxWide}>
                  <span style={styles.infoLabel}>Appointments</span>
                  <span style={styles.infoValue}>
                    {patient.current_future_appointments || "-"}
                  </span>
                </div>
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
  wrapper: {
    background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
    borderRadius: "22px",
    padding: "26px",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e8eef7",
    marginBottom: "22px",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "18px",
  },
  cardTitle: {
    margin: 0,
    fontSize: "28px",
    color: "#0f172a",
    fontWeight: "700",
  },
  subText: {
    margin: "8px 0 0 0",
    color: "#64748b",
    fontSize: "14px",
  },
  searchForm: {
    display: "grid",
    gridTemplateColumns: "1fr auto auto",
    gap: "12px",
    alignItems: "center",
    marginBottom: "20px",
  },
  input: {
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid #d7e0ec",
    fontSize: "15px",
    outline: "none",
    background: "#f8fbff",
  },
  primaryButton: {
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "14px",
    padding: "14px 18px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(37, 99, 235, 0.22)",
  },
  secondaryButton: {
    background: "#eef2f7",
    color: "#0f172a",
    border: "1px solid #d7e0ec",
    borderRadius: "14px",
    padding: "14px 18px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },
  error: {
    color: "#dc2626",
    marginTop: "6px",
    marginBottom: "16px",
    fontWeight: "600",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "16px",
  },
  patientCard: {
    border: "1px solid #e5edf7",
    borderRadius: "18px",
    padding: "18px",
    cursor: "pointer",
    background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
    boxShadow: "0 8px 22px rgba(15, 23, 42, 0.05)",
    transition: "transform 0.18s ease, box-shadow 0.18s ease",
  },
  topLine: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "16px",
  },
  patientName: {
    fontWeight: "800",
    color: "#0f172a",
    fontSize: "20px",
    marginBottom: "4px",
  },
  patientId: {
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
  },
  openBadge: {
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
  },
  infoBox: {
    background: "#f8fbff",
    border: "1px solid #e6edf7",
    borderRadius: "14px",
    padding: "12px",
    display: "grid",
    gap: "6px",
  },
  infoBoxWide: {
    gridColumn: "1 / -1",
    background: "#f8fbff",
    border: "1px solid #e6edf7",
    borderRadius: "14px",
    padding: "12px",
    display: "grid",
    gap: "6px",
  },
  infoLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  infoValue: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
    lineHeight: 1.45,
  },
  emptyState: {
    padding: "22px",
    borderRadius: "16px",
    background: "#f8fafc",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
    textAlign: "center",
    fontWeight: "600",
  },
};
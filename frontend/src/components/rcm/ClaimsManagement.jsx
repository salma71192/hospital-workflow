
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import CreateClaim from "./CreateClaim";

const styles = {
  page: {
    padding: 24,
    background: "#f6f8fc",
    minHeight: "100vh",
    color: "#183450",
    fontFamily: "Arial, sans-serif",
  },
  heading: { fontSize: 27, fontWeight: 700, marginBottom: 8 },
  subtitle: { color: "#64748b", marginBottom: 26 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 20,
    maxWidth: 950,
  },
  card: {
    background: "#fff",
    border: "1px solid #e5eaf1",
    borderRadius: 14,
    padding: 26,
    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.04)",
  },
  button: {
    background: "#4057cf",
    color: "#fff",
    border: 0,
    borderRadius: 8,
    padding: "11px 17px",
    cursor: "pointer",
    fontWeight: 600,
  },
  secondary: {
    background: "#fff",
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    padding: "10px 15px",
    cursor: "pointer",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: 12,
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    margin: "12px 0",
  },
  tableWrap: { overflowX: "auto", background: "#fff", borderRadius: 12 },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 650 },
  cell: {
    padding: 13,
    borderBottom: "1px solid #e5eaf1",
    textAlign: "left",
    fontSize: 14,
  },
};

function getPatientName(patient) {
  return (
    patient.name ||
    patient.full_name ||
    patient.patient_name ||
    [patient.first_name, patient.last_name].filter(Boolean).join(" ") ||
    "Unnamed patient"
  );
}

function getPatientNumber(patient) {
  return (
    patient.patient_id ||
    patient.file_number ||
    patient.mrn ||
    patient.id ||
    "—"
  );
}

export default function ClaimsManagement() {
  const navigate = useNavigate();
  const [view, setView] = useState("home");
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (view !== "search") return;

    const searchText = query.trim();

    if (!searchText) {
      setPatients([]);
      setError("");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(
          `patients/?search=${encodeURIComponent(searchText)}`,
          { signal: controller.signal }
        );

        const data = response.data;
        const results = Array.isArray(data)
          ? data
          : data.results || data.patients || [];

        setPatients(results);
      } catch (err) {
        if (err.code !== "ERR_CANCELED" && err.name !== "CanceledError") {
          setError(
            err.response?.data?.detail ||
              "Unable to search patients. Please try again."
          );
          setPatients([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, view]);

  function returnHome() {
    setSelectedPatient(null);
    setQuery("");
    setPatients([]);
    setError("");
    setView("home");
  }

  if (selectedPatient) {
    return (
      <div style={styles.page}>
        <button style={styles.secondary} onClick={() => setSelectedPatient(null)}>
          ← Back to patient search
        </button>
        <div style={{ marginTop: 20 }}>
          <CreateClaim
            key={selectedPatient.id}
            patient={selectedPatient}
            onClose={() => setSelectedPatient(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {view === "home" && (
        <>
          <div style={styles.heading}>Claims Management</div>
          <div style={styles.subtitle}>
            Create claims and review previously saved claims.
          </div>

          <div style={styles.grid}>
            <section style={styles.card}>
              <div style={{ fontSize: 30, marginBottom: 15 }}>＋</div>
              <h2 style={{ fontSize: 20, margin: "0 0 10px" }}>
                Create Claim
              </h2>
              <p style={{ color: "#64748b", lineHeight: 1.6 }}>
                Search for a patient, select their record, and enter claim
                details.
              </p>
              <button
                style={styles.button}
                onClick={() => setView("search")}
              >
                Create Claim →
              </button>
            </section>

            <section style={styles.card}>
              <div style={{ fontSize: 30, marginBottom: 15 }}>▤</div>
              <h2 style={{ fontSize: 20, margin: "0 0 10px" }}>
                Claim History
              </h2>
              <p style={{ color: "#64748b", lineHeight: 1.6 }}>
                View saved claims, their current statuses, rejection reasons,
                and creation dates.
              </p>
              <button
                style={styles.button}
                onClick={() => navigate("/rcm/claim-history")}
              >
                View Claim History →
              </button>
            </section>
          </div>
        </>
      )}

      {view === "search" && (
        <>
          <button style={styles.secondary} onClick={returnHome}>
            ← Back to Claims Management
          </button>

          <div style={{ ...styles.heading, marginTop: 24 }}>
            Create Claim
          </div>
          <div style={styles.subtitle}>
            Search for a patient and select the correct record.
          </div>

          <section style={styles.card}>
            <label htmlFor="patient-search">
              <strong>Search patients</strong>
            </label>
            <input
              id="patient-search"
              style={styles.input}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Enter patient name, file number, or ID..."
            />

            {loading && <p>Searching patients...</p>}
            {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

            {!loading && query.trim() && !error && patients.length === 0 && (
              <p style={{ color: "#64748b" }}>No matching patients found.</p>
            )}

            {patients.map((patient) => (
              <div
                key={patient.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 16,
                  flexWrap: "wrap",
                  padding: "15px 0",
                  borderBottom: "1px solid #e5eaf1",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {getPatientName(patient)}
                  </div>
                  <div style={{ color: "#64748b", fontSize: 13, marginTop: 5 }}>
                    File number: {getPatientNumber(patient)}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    style={styles.secondary}
                    onClick={() => navigate(`/patients/${patient.id}`)}
                  >
                    Open File
                  </button>
                  <button
                    style={styles.button}
                    onClick={() => setSelectedPatient(patient)}
                  >
                    Select Patient
                  </button>
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}

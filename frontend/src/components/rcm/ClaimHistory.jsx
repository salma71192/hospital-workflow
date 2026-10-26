
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

const styles = {
  page: {
    padding: 24,
    background: "#f6f8fc",
    minHeight: "100vh",
    color: "#183450",
    fontFamily: "Arial, sans-serif",
  },
  button: {
    padding: "10px 15px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    background: "#fff",
    cursor: "pointer",
  },
  input: {
    padding: 11,
    width: "100%",
    maxWidth: 400,
    boxSizing: "border-box",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
  },
  tableWrap: {
    marginTop: 20,
    overflowX: "auto",
    background: "#fff",
    border: "1px solid #e5eaf1",
    borderRadius: 12,
  },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 760 },
  cell: {
    padding: 13,
    textAlign: "left",
    borderBottom: "1px solid #e5eaf1",
    fontSize: 14,
  },
};

function patientName(claim) {
  const patient = claim.patient_details || claim.patient;
  if (patient && typeof patient === "object") {
    return (
      patient.name ||
      patient.full_name ||
      patient.patient_name ||
      [patient.first_name, patient.last_name].filter(Boolean).join(" ") ||
      `Patient ${patient.id || ""}`
    );
  }
  return claim.patient_name || `Patient ${claim.patient_id || patient || ""}`;
}

function statusColor(status) {
  const value = String(status || "").toLowerCase();
  if (value === "approved") return "#15803d";
  if (value === "rejected") return "#b91c1c";
  return "#a16207";
}

export default function ClaimHistory() {
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadClaims() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("rcm/claims/");
        const data = response.data;
        const results = Array.isArray(data)
          ? data
          : data.results || data.claims || [];

        if (active) setClaims(results);
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.detail ||
              "Unable to load claim history. Check the RCM claims API."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadClaims();
    return () => {
      active = false;
    };
  }, []);

  const filteredClaims = claims.filter((claim) => {
    const name = patientName(claim).toLowerCase();
    const claimId = String(claim.claim_id || "").toLowerCase();
    const searchText = search.toLowerCase();
    const matchesSearch =
      name.includes(searchText) || claimId.includes(searchText);
    const matchesStatus =
      statusFilter === "All" ||
      String(claim.status || "").toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div style={styles.page}>
      <button
        style={styles.button}
        onClick={() => navigate("/rcm/claims")}
      >
        ← Back to Claims Management
      </button>

      <h1 style={{ fontSize: 27, marginBottom: 8, marginTop: 24 }}>
        Claim History
      </h1>
      <p style={{ color: "#64748b", marginBottom: 24 }}>
        View and search claims saved in the system.
      </p>

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          style={styles.input}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search patient or claim ID..."
        />

        <select
          style={{ ...styles.input, maxWidth: 180 }}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="All">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>

        <button
          style={styles.button}
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      </div>

      {loading && <p>Loading claims...</p>}
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

      {!loading && !error && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                {[
                  "Claim ID",
                  "Patient",
                  "Status",
                  "Rejection Reason",
                  "Created Date",
                ].map((heading) => (
                  <th key={heading} style={styles.cell}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredClaims.map((claim) => (
                <tr key={claim.id}>
                  <td style={styles.cell}>{claim.claim_id || "—"}</td>
                  <td style={styles.cell}>{patientName(claim)}</td>
                  <td style={styles.cell}>
                    <span
                      style={{
                        color: statusColor(claim.status),
                        fontWeight: 700,
                      }}
                    >
                      {claim.status || "Pending"}
                    </span>
                  </td>
                  <td style={styles.cell}>
                    {claim.rejection_reason || "—"}
                  </td>
                  <td style={styles.cell}>
                    {claim.created_at
                      ? new Date(claim.created_at).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}

              {filteredClaims.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{ ...styles.cell, textAlign: "center", padding: 28 }}
                  >
                    No claims found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

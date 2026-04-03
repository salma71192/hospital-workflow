import React, { useState } from "react";
import api from "../api/api";
import DashboardLayout from "../components/DashboardLayout";
import PatientSummaryCard from "../components/patients/PatientSummaryCard";
import AlertPanel from "../components/common/AlertPanel";

export default function ApprovalsDashboard({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    approval_number: "",
    start_date: "",
    expiry_date: "",
    approved_sessions: "",
    cpt_codes: "",
  });

  // ================================
  // SEARCH PATIENT
  // ================================
  const handleSearch = async () => {
    try {
      const res = await api.get(`/patients/?search=${search}`);
      setSearchResults(res.data || []);
    } catch (err) {
      console.error("Search failed", err);
    }
  };

  // ================================
  // SELECT PATIENT
  // ================================
  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);

    setForm({
      approval_number: patient.current_approval_number || "",
      start_date: patient.approval_start_date || "",
      expiry_date: patient.approval_expiry_date || "",
      approved_sessions: patient.approved_sessions || "",
      cpt_codes: patient.approved_cpt_codes?.join(",") || "",
    });
  };

  // ================================
  // UPDATE APPROVAL
  // ================================
  const handleSubmit = async () => {
    if (!selectedPatient) return;

    try {
      await api.put(`/patients/${selectedPatient.id}/`, {
        current_approval_number: form.approval_number,
        approval_start_date: form.start_date,
        approval_expiry_date: form.expiry_date,
        approved_sessions: form.approved_sessions,
        approved_cpt_codes: form.cpt_codes.split(",").map((c) => c.trim()),
      });

      setMessage("✅ Approval updated successfully");

      // refresh search results
      handleSearch();
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to update approval");
    }
  };

  // ================================
  // ALERTS (example)
  // ================================
  const alerts = [
    {
      level: "warning",
      message: "Check patients with low remaining sessions",
    },
    {
      level: "danger",
      message: "Some approvals may be expired",
    },
  ];

  return (
    <DashboardLayout
      title="Approvals Dashboard"
      subtitle={`Welcome ${user?.username || ""}`}
      sidebarTitle="Approvals"
      sidebarItems={[
        { key: "search", label: "Search Patient" },
      ]}
      activeSection="search"
      setActiveSection={() => {}}
      onLogout={onLogout}
      actingAs={actingAs}
      onBackToAdmin={onStopImpersonation}
    >
      {/* ================= ALERTS ================= */}
      <AlertPanel title="Alerts" items={alerts} />

      {/* ================= SEARCH ================= */}
      <div style={styles.card}>
        <h2 style={styles.title}>Search Patient</h2>

        <div style={styles.row}>
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.input}
          />

          <button onClick={handleSearch} style={styles.button}>
            Search
          </button>
        </div>
      </div>

      {/* ================= RESULTS ================= */}
      <div style={styles.grid}>
        {searchResults.map((patient) => (
          <PatientSummaryCard
            key={patient.id}
            patient={patient}
            actionLabel="Update Approval"
            onAction={handleSelectPatient}
          />
        ))}
      </div>

      {/* ================= FORM ================= */}
      {selectedPatient && (
        <div style={styles.card}>
          <h2 style={styles.title}>
            Update Approval – {selectedPatient.name}
          </h2>

          <div style={styles.formGrid}>
            <input
              placeholder="Approval Number"
              value={form.approval_number}
              onChange={(e) =>
                setForm({ ...form, approval_number: e.target.value })
              }
              style={styles.input}
            />

            <input
              type="date"
              value={form.start_date}
              onChange={(e) =>
                setForm({ ...form, start_date: e.target.value })
              }
              style={styles.input}
            />

            <input
              type="date"
              value={form.expiry_date}
              onChange={(e) =>
                setForm({ ...form, expiry_date: e.target.value })
              }
              style={styles.input}
            />

            <input
              type="number"
              placeholder="Approved Sessions"
              value={form.approved_sessions}
              onChange={(e) =>
                setForm({ ...form, approved_sessions: e.target.value })
              }
              style={styles.input}
            />

            <input
              placeholder="CPT Codes (comma separated)"
              value={form.cpt_codes}
              onChange={(e) =>
                setForm({ ...form, cpt_codes: e.target.value })
              }
              style={styles.input}
            />
          </div>

          <button onClick={handleSubmit} style={styles.primaryButton}>
            Save Approval
          </button>

          {message && <div style={styles.message}>{message}</div>}
        </div>
      )}
    </DashboardLayout>
  );
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
    marginBottom: "20px",
  },
  title: {
    marginBottom: "12px",
    fontSize: "20px",
    fontWeight: "700",
  },
  row: {
    display: "flex",
    gap: "10px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },
  formGrid: {
    display: "grid",
    gap: "10px",
  },
  input: {
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    width: "100%",
  },
  button: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: "pointer",
  },
  primaryButton: {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    marginTop: "10px",
    cursor: "pointer",
    fontWeight: "700",
  },
  message: {
    marginTop: "10px",
    fontWeight: "600",
  },
};
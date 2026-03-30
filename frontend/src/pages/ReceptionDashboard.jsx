import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function ReceptionDashboard({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    patient_id: "",
  });

  const [patients, setPatients] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchPatients = async () => {
    try {
      const res = await api.get("patients/");
      setPatients(res.data.patients || []);
    } catch (err) {
      console.error("Failed to load patients", err);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleBackToAdmin = () => {
    onStopImpersonation();
    navigate("/admin");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await api.post("patients/", formData);
      setMessage(res.data.message || "Patient registered successfully");
      setFormData({
        name: "",
        patient_id: "",
      });
      fetchPatients();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to register patient");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {actingAs && (
          <div style={styles.banner}>
            <span>Viewing as: {user?.username}</span>
            <button style={styles.bannerButton} onClick={handleBackToAdmin}>
              Back to Admin
            </button>
          </div>
        )}

        <div style={styles.topBar}>
          <div>
            <h1 style={styles.title}>Reception Dashboard</h1>
            <p style={styles.subtitle}>
              Welcome, {user?.username || "Reception User"}
            </p>
          </div>

          <button style={styles.logoutButton} onClick={onLogout}>
            Logout
          </button>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Register Patient</h2>

          <form onSubmit={handleRegisterPatient} style={styles.form}>
            <input
              type="text"
              name="name"
              placeholder="Patient Name"
              value={formData.name}
              onChange={handleChange}
              style={styles.input}
              required
            />

            <input
              type="text"
              name="patient_id"
              placeholder="Patient ID"
              value={formData.patient_id}
              onChange={handleChange}
              style={styles.input}
              required
            />

            <button type="submit" style={styles.primaryButton}>
              Register Patient
            </button>
          </form>

          {message && <p style={styles.success}>{message}</p>}
          {error && <p style={styles.error}>{error}</p>}
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Registered Patients</h2>

          {patients.length ? (
            <div style={styles.patientList}>
              {patients.map((patient) => (
                <div key={patient.id} style={styles.patientCard}>
                  <div>
                    <div style={styles.patientName}>{patient.name}</div>
                    <div style={styles.patientMeta}>
                      Patient ID: {patient.patient_id}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>No patients registered yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #eef4ff 0%, #f8fbff 100%)",
    padding: "32px 20px",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  banner: {
    background: "#fef3c7",
    border: "1px solid #fcd34d",
    color: "#92400e",
    padding: "12px 16px",
    borderRadius: "10px",
    marginBottom: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bannerButton: {
    background: "#92400e",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    cursor: "pointer",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "28px",
  },
  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: "700",
    color: "#1e3a8a",
  },
  subtitle: {
    margin: "8px 0 0 0",
    color: "#475569",
    fontSize: "16px",
  },
  logoutButton: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
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
  form: {
    display: "grid",
    gap: "14px",
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
  success: {
    color: "#166534",
    marginTop: "14px",
    fontWeight: "600",
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
    marginBottom: "6px",
  },
  patientMeta: {
    color: "#64748b",
    fontSize: "14px",
  },
  emptyState: {
    padding: "18px",
    borderRadius: "12px",
    background: "#f8fafc",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
  },
};
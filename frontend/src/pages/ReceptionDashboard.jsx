import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import PatientSearch from "../components/PatientSearch";

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
    current_approval_number: "",
    sessions_taken: "",
    taken_with: "",
    current_future_appointments: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

  const handleCreatePatientFile = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await api.post("patients/", formData);
      setMessage(res.data.message || "Patient file created successfully");
      setFormData({
        name: "",
        patient_id: "",
        current_approval_number: "",
        sessions_taken: "",
        taken_with: "",
        current_future_appointments: "",
      });
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to create patient file");
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
          <h2 style={styles.cardTitle}>Create Patient File</h2>

          <form onSubmit={handleCreatePatientFile} style={styles.form}>
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

            <input
              type="text"
              name="current_approval_number"
              placeholder="Current Approval Number"
              value={formData.current_approval_number}
              onChange={handleChange}
              style={styles.input}
            />

            <input
              type="number"
              name="sessions_taken"
              placeholder="Sessions Taken"
              value={formData.sessions_taken}
              onChange={handleChange}
              style={styles.input}
            />

            <input
              type="text"
              name="taken_with"
              placeholder="Taken With"
              value={formData.taken_with}
              onChange={handleChange}
              style={styles.input}
            />

            <textarea
              name="current_future_appointments"
              placeholder="Current / Future Appointments"
              value={formData.current_future_appointments}
              onChange={handleChange}
              style={styles.textarea}
            />

            <button type="submit" style={styles.primaryButton}>
              Create Patient File
            </button>
          </form>

          {message && <p style={styles.success}>{message}</p>}
          {error && <p style={styles.error}>{error}</p>}
        </div>

        <PatientSearch />
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
  textarea: {
    minHeight: "90px",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    resize: "vertical",
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
};
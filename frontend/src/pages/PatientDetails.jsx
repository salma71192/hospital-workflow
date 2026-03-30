import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

export default function PatientDetails({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`patients/?search=${id}`)
      .then((res) => {
        const found = res.data.patients.find((p) => p.id === Number(id));
        setPatient(found);
      })
      .catch(() => setError("Failed to load patient"));
  }, [id]);

  const handleBack = () => {
    navigate(-1);
  };

  if (error) return <p>{error}</p>;
  if (!patient) return <p style={{ padding: 20 }}>Loading patient...</p>;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <button onClick={handleBack} style={styles.backButton}>
          ← Back
        </button>

        <h1 style={styles.title}>Patient File</h1>

        <div style={styles.card}>
          <div style={styles.item}><strong>Name:</strong> {patient.name}</div>
          <div style={styles.item}><strong>ID:</strong> {patient.patient_id}</div>
          <div style={styles.item}>
            <strong>Approval:</strong> {patient.current_approval_number || "-"}
          </div>
          <div style={styles.item}>
            <strong>Sessions Taken:</strong> {patient.sessions_taken}
          </div>
          <div style={styles.item}>
            <strong>Taken With:</strong> {patient.taken_with || "-"}
          </div>
          <div style={styles.item}>
            <strong>Appointments:</strong> {patient.current_future_appointments || "-"}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f6f8",
    padding: "32px",
  },
  container: {
    maxWidth: "800px",
    margin: "0 auto",
  },
  title: {
    fontSize: "28px",
    marginBottom: "20px",
  },
  card: {
    background: "#fff",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
  },
  item: {
    marginBottom: "12px",
    fontSize: "16px",
  },
  backButton: {
    marginBottom: "16px",
    padding: "8px 12px",
    cursor: "pointer",
  },
};
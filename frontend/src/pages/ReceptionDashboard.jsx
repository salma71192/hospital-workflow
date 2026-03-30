import React, { useEffect, useState } from "react";
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

  const today = new Date().toISOString().split("T")[0];

  const [patientForm, setPatientForm] = useState({
    name: "",
    patient_id: "",
    current_approval_number: "",
    sessions_taken: "",
    taken_with: "",
    current_future_appointments: "",
  });

  const [assignmentForm, setAssignmentForm] = useState({
    patient_id: "",
    therapist_id: "",
    assignment_date: today,
    notes: "",
  });

  const [patients, setPatients] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleBackToAdmin = () => {
    onStopImpersonation();
    navigate("/admin");
  };

  const loadPatients = async () => {
    try {
      const res = await api.get("patients/");
      setPatients(res.data.patients || []);
    } catch (err) {
      console.error("Failed to load patients", err);
    }
  };

  const loadTherapists = async () => {
    try {
      const res = await api.get("reception/therapists/");
      setTherapists(res.data.therapists || []);
    } catch (err) {
      console.error("Failed to load therapists", err);
    }
  };

  const loadAssignments = async (dateValue = today) => {
    try {
      const res = await api.get(`reception/assignments/?date=${dateValue}`);
      setAssignments(res.data.assignments || []);
    } catch (err) {
      console.error("Failed to load assignments", err);
    }
  };

  useEffect(() => {
    loadPatients();
    loadTherapists();
    loadAssignments(today);
  }, []);

  const handlePatientChange = (e) => {
    const { name, value } = e.target;
    setPatientForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAssignmentChange = (e) => {
    const { name, value } = e.target;
    setAssignmentForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreatePatientFile = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await api.post("patients/", patientForm);
      setMessage(res.data.message || "Patient file created successfully");
      setPatientForm({
        name: "",
        patient_id: "",
        current_approval_number: "",
        sessions_taken: "",
        taken_with: "",
        current_future_appointments: "",
      });
      loadPatients();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to create patient file");
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await api.post("reception/assignments/", assignmentForm);
      setMessage(res.data.message || "Patient assigned successfully");
      setAssignmentForm({
        patient_id: "",
        therapist_id: "",
        assignment_date: today,
        notes: "",
      });
      loadAssignments(today);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to assign patient");
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
              value={patientForm.name}
              onChange={handlePatientChange}
              style={styles.input}
              required
            />

            <input
              type="text"
              name="patient_id"
              placeholder="Patient ID"
              value={patientForm.patient_id}
              onChange={handlePatientChange}
              style={styles.input}
              required
            />

            <input
              type="text"
              name="current_approval_number"
              placeholder="Current Approval Number"
              value={patientForm.current_approval_number}
              onChange={handlePatientChange}
              style={styles.input}
            />

            <input
              type="number"
              name="sessions_taken"
              placeholder="Sessions Taken"
              value={patientForm.sessions_taken}
              onChange={handlePatientChange}
              style={styles.input}
            />

            <input
              type="text"
              name="taken_with"
              placeholder="Taken With"
              value={patientForm.taken_with}
              onChange={handlePatientChange}
              style={styles.input}
            />

            <textarea
              name="current_future_appointments"
              placeholder="Current / Future Appointments"
              value={patientForm.current_future_appointments}
              onChange={handlePatientChange}
              style={styles.textarea}
            />

            <button type="submit" style={styles.primaryButton}>
              Create Patient File
            </button>
          </form>

          {message && <p style={styles.success}>{message}</p>}
          {error && <p style={styles.error}>{error}</p>}
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Assign Patient to Therapist</h2>

          <form onSubmit={handleCreateAssignment} style={styles.form}>
            <select
              name="patient_id"
              value={assignmentForm.patient_id}
              onChange={handleAssignmentChange}
              style={styles.input}
              required
            >
              <option value="">Select Patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} - {patient.patient_id}
                </option>
              ))}
            </select>

            <select
              name="therapist_id"
              value={assignmentForm.therapist_id}
              onChange={handleAssignmentChange}
              style={styles.input}
              required
            >
              <option value="">Select Therapist</option>
              {therapists.map((therapist) => (
                <option key={therapist.id} value={therapist.id}>
                  {therapist.username}
                </option>
              ))}
            </select>

            <input
              type="date"
              name="assignment_date"
              value={assignmentForm.assignment_date}
              onChange={handleAssignmentChange}
              style={styles.input}
              required
            />

            <textarea
              name="notes"
              placeholder="Notes"
              value={assignmentForm.notes}
              onChange={handleAssignmentChange}
              style={styles.textarea}
            />

            <button type="submit" style={styles.primaryButton}>
              Assign Patient
            </button>
          </form>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Today&apos;s Assignments</h2>

          {assignments.length ? (
            <div style={styles.assignmentList}>
              {assignments.map((item) => (
                <div key={item.id} style={styles.assignmentCard}>
                  <div style={styles.assignmentMain}>
                    <div style={styles.assignmentPatient}>{item.patient_name}</div>
                    <div style={styles.assignmentMeta}>
                      Patient ID: {item.patient_file_id}
                    </div>
                  </div>

                  <div style={styles.assignmentSide}>
                    <div style={styles.assignmentTherapist}>
                      Therapist: {item.therapist_name}
                    </div>
                    <div style={styles.assignmentMeta}>
                      Date: {item.assignment_date}
                    </div>
                    {item.notes ? (
                      <div style={styles.assignmentMeta}>Notes: {item.notes}</div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>No assignments for today.</div>
          )}
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
  assignmentList: {
    display: "grid",
    gap: "12px",
  },
  assignmentCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
  },
  assignmentMain: {
    minWidth: "220px",
  },
  assignmentSide: {
    minWidth: "220px",
  },
  assignmentPatient: {
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "6px",
    fontSize: "18px",
  },
  assignmentTherapist: {
    fontWeight: "700",
    color: "#1d4ed8",
    marginBottom: "6px",
  },
  assignmentMeta: {
    color: "#64748b",
    fontSize: "14px",
    marginBottom: "4px",
  },
  emptyState: {
    padding: "18px",
    borderRadius: "12px",
    background: "#f8fafc",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
  },
};
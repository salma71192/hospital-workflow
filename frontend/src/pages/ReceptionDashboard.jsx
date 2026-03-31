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
  const today = new Date().toISOString().split("T")[0];

  const [openSection, setOpenSection] = useState("search");

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

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

  const [therapists, setTherapists] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleBackToAdmin = () => {
    onStopImpersonation();
    navigate("/admin");
  };

  const toggleSection = (sectionName) => {
    setOpenSection((prev) => (prev === sectionName ? "" : sectionName));
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
    loadTherapists();
    loadAssignments(today);
  }, []);

  const handleSearchPatient = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setSelectedPatient(null);

    try {
      const url = searchTerm
        ? `patients/?search=${encodeURIComponent(searchTerm)}`
        : "patients/";
      const res = await api.get(url);
      const patients = res.data.patients || [];
      setSearchResults(patients);

      if (patients.length > 0) {
        setMessage("Patient found. You can open file or assign to therapist.");
      } else {
        setMessage("Patient not found. Please register new patient.");
        setOpenSection("register");
      }
    } catch (err) {
      setError("Failed to search patient");
    }
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setAssignmentForm((prev) => ({
      ...prev,
      patient_id: patient.id,
    }));
    setOpenSection("assign");
    setMessage(`Selected ${patient.name} for assignment.`);
    setError("");
  };

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
      const createdPatient = res.data.patient;

      setMessage(res.data.message || "Patient file created successfully");
      setError("");

      setPatientForm({
        name: "",
        patient_id: "",
        current_approval_number: "",
        sessions_taken: "",
        taken_with: "",
        current_future_appointments: "",
      });

      if (createdPatient) {
        setSelectedPatient(createdPatient);
        setAssignmentForm((prev) => ({
          ...prev,
          patient_id: createdPatient.id,
        }));
        setOpenSection("assign");
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to create patient file");
      setMessage("");
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await api.post("reception/assignments/", assignmentForm);
      setMessage(res.data.message || "Patient assigned successfully");
      setError("");

      setAssignmentForm({
        patient_id: "",
        therapist_id: "",
        assignment_date: today,
        notes: "",
      });

      setSelectedPatient(null);
      setSearchResults([]);
      setSearchTerm("");
      loadAssignments(today);
      setOpenSection("today");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to assign patient");
      setMessage("");
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

        {message && <div style={styles.successBox}>{message}</div>}
        {error && <div style={styles.errorBox}>{error}</div>}

        <SectionCard
          title="1. Search Patient"
          isOpen={openSection === "search"}
          onToggle={() => toggleSection("search")}
        >
          <form onSubmit={handleSearchPatient} style={styles.formRow}>
            <input
              type="text"
              placeholder="Search by patient name or ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.input}
              required
            />
            <button type="submit" style={styles.primaryButton}>
              Search
            </button>
          </form>

          {searchResults.length > 0 ? (
            <div style={styles.resultsList}>
              {searchResults.map((patient) => (
                <div key={patient.id} style={styles.resultCard}>
                  <div>
                    <div style={styles.resultName}>{patient.name}</div>
                    <div style={styles.resultMeta}>
                      ID: {patient.patient_id}
                    </div>
                    <div style={styles.resultMeta}>
                      Approval: {patient.current_approval_number || "-"}
                    </div>
                    <div style={styles.resultMeta}>
                      Sessions: {patient.sessions_taken ?? 0}
                    </div>
                    <div style={styles.resultMeta}>
                      Taken With: {patient.taken_with || "-"}
                    </div>
                    <div style={styles.resultMeta}>
                      Appointments: {patient.current_future_appointments || "-"}
                    </div>
                  </div>

                  <div style={styles.actionButtons}>
                    <button
                      style={styles.openButton}
                      onClick={() => navigate(`/patients/${patient.id}`)}
                    >
                      Open File
                    </button>

                    <button
                      style={styles.selectButton}
                      onClick={() => handleSelectPatient(patient)}
                    >
                      Assign
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.helperText}>
              Search first. If no patient is found, open the registration section.
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="2. Register New Patient"
          isOpen={openSection === "register"}
          onToggle={() => toggleSection("register")}
        >
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
              Register Patient
            </button>
          </form>
        </SectionCard>

        <SectionCard
          title="3. Assign Patient to Therapist"
          isOpen={openSection === "assign"}
          onToggle={() => toggleSection("assign")}
        >
          {selectedPatient ? (
            <div style={styles.selectedPatientBox}>
              <strong>Selected Patient:</strong> {selectedPatient.name} (
              {selectedPatient.patient_id})
            </div>
          ) : (
            <div style={styles.helperText}>
              Select a patient from search results first, or register a new one.
            </div>
          )}

          <form onSubmit={handleCreateAssignment} style={styles.form}>
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

            <button
              type="submit"
              style={styles.primaryButton}
              disabled={!assignmentForm.patient_id}
            >
              Assign Patient
            </button>
          </form>
        </SectionCard>

        <SectionCard
          title="4. Today's Assignments"
          isOpen={openSection === "today"}
          onToggle={() => toggleSection("today")}
        >
          {assignments.length > 0 ? (
            <div style={styles.assignmentList}>
              {assignments.map((item) => (
                <div key={item.id} style={styles.assignmentCard}>
                  <div>
                    <div style={styles.assignmentPatient}>{item.patient_name}</div>
                    <div style={styles.assignmentMeta}>
                      Patient ID: {item.patient_file_id}
                    </div>
                  </div>

                  <div>
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
        </SectionCard>
      </div>
    </div>
  );
}

function SectionCard({ title, isOpen, onToggle, children }) {
  return (
    <div style={styles.card}>
      <button style={styles.sectionHeader} onClick={onToggle}>
        <span>{title}</span>
        <span style={styles.chevron}>{isOpen ? "−" : "+"}</span>
      </button>

      {isOpen && <div style={styles.sectionBody}>{children}</div>}
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
    borderRadius: "12px",
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
    fontWeight: "700",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "24px",
  },
  title: {
    margin: 0,
    fontSize: "34px",
    fontWeight: "800",
    color: "#1e3a8a",
  },
  subtitle: {
    margin: "8px 0 0 0",
    color: "#64748b",
    fontSize: "16px",
  },
  logoutButton: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "12px 18px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  successBox: {
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #86efac",
    borderRadius: "12px",
    padding: "14px 16px",
    marginBottom: "16px",
    fontWeight: "700",
  },
  errorBox: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    padding: "14px 16px",
    marginBottom: "16px",
    fontWeight: "700",
  },
  card: {
    background: "#fff",
    borderRadius: "20px",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
    marginBottom: "18px",
    overflow: "hidden",
    border: "1px solid #e8eef7",
  },
  sectionHeader: {
    width: "100%",
    background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
    border: "none",
    padding: "20px 22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "20px",
    fontWeight: "800",
    color: "#0f172a",
    cursor: "pointer",
    textAlign: "left",
  },
  chevron: {
    fontSize: "28px",
    lineHeight: 1,
    color: "#2563eb",
  },
  sectionBody: {
    padding: "0 22px 22px 22px",
  },
  form: {
    display: "grid",
    gap: "14px",
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "12px",
    alignItems: "center",
  },
  input: {
    padding: "13px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    background: "#fff",
  },
  textarea: {
    minHeight: "90px",
    padding: "13px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    resize: "vertical",
  },
  primaryButton: {
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "13px 18px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },
  helperText: {
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: "12px",
    padding: "14px",
  },
  selectedPatientBox: {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    borderRadius: "12px",
    padding: "14px",
    marginBottom: "14px",
    fontWeight: "700",
  },
  resultsList: {
    display: "grid",
    gap: "12px",
  },
  resultCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  resultName: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: "6px",
  },
  resultMeta: {
    color: "#64748b",
    fontSize: "14px",
    marginBottom: "4px",
  },
  actionButtons: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  openButton: {
    background: "#0ea5e9",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  selectButton: {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: "700",
    cursor: "pointer",
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
  assignmentPatient: {
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: "6px",
    fontSize: "17px",
  },
  assignmentTherapist: {
    fontWeight: "800",
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
    fontWeight: "600",
  },
};
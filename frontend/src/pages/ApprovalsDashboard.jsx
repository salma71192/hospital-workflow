import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import DashboardLayout from "../components/DashboardLayout";
import DashboardNotice from "../components/common/DashboardNotice";
import PatientSearchPanel from "../components/patients/PatientSearchPanel";
import PatientRegisterForm from "../components/patients/PatientRegisterForm";

export default function ApprovalsDashboard({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("search");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

  const [approvalForm, setApprovalForm] = useState({
    insurance_provider: "thiqa",
    authorization_number: "",
    start_date: "",
    expiry_date: "",
    approved_sessions: 0,
    approved_cpt_codes_text: "",
    notes: "",
  });

  const [billingCodes, setBillingCodes] = useState([]);
  const [billingForm, setBillingForm] = useState({
    insurance_provider: "thiqa",
    code: "",
    description: "",
    amount: "",
  });

  const handleBackToAdmin = () => {
    onStopImpersonation();
    navigate("/admin");
  };

  const loadBillingCodes = async () => {
    try {
      const res = await api.get("approvals/billing-codes/?provider=thiqa");
      setBillingCodes(res.data.codes || []);
    } catch {
      setBillingCodes([]);
    }
  };

  useEffect(() => {
    loadBillingCodes();
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
        setMessage("Patient found.");
      } else {
        setMessage("Patient not found. Please register new patient.");
      }
    } catch {
      setError("Failed to search patient");
    }
  };

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setActiveSection("approval");
    setMessage(`Selected ${patient.name}`);
    setError("");

    try {
      const res = await api.get(`approvals/patient-approval/${patient.id}/`);
      const approval = res.data.approval || {};

      setApprovalForm({
        insurance_provider: approval.insurance_provider || "thiqa",
        authorization_number: approval.authorization_number || "",
        start_date: approval.start_date || "",
        expiry_date: approval.expiry_date || "",
        approved_sessions: approval.approved_sessions || 0,
        approved_cpt_codes_text: (approval.approved_cpt_codes || []).join(", "),
        notes: approval.notes || "",
      });
    } catch {
      setError("Failed to load patient approval");
    }
  };

  const handleCreatePatientFile = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await api.post("patients/", patientForm);
      const createdPatient = res.data.patient;

      setPatientForm({
        name: "",
        patient_id: "",
        current_approval_number: "",
        sessions_taken: "",
        taken_with: "",
        current_future_appointments: "",
      });

      if (createdPatient) {
        await handleSelectPatient(createdPatient);
      }

      setMessage(res.data.message || "Patient file created successfully");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to create patient");
    }
  };

  const handleSaveApproval = async (e) => {
    e.preventDefault();

    if (!selectedPatient) {
      setError("Select a patient first");
      return;
    }

    setMessage("");
    setError("");

    try {
      const approved_cpt_codes = approvalForm.approved_cpt_codes_text
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

      const payload = {
        insurance_provider: approvalForm.insurance_provider,
        authorization_number: approvalForm.authorization_number,
        start_date: approvalForm.start_date,
        expiry_date: approvalForm.expiry_date,
        approved_sessions: approvalForm.approved_sessions,
        approved_cpt_codes,
        notes: approvalForm.notes,
      };

      const res = await api.post(
        `approvals/patient-approval/${selectedPatient.id}/`,
        payload
      );

      setMessage(res.data.message || "Approval updated successfully");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to save approval");
    }
  };

  const handleSaveBillingCode = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await api.post("approvals/billing-codes/", billingForm);

      setBillingForm({
        insurance_provider: "thiqa",
        code: "",
        description: "",
        amount: "",
      });

      await loadBillingCodes();
      setMessage(res.data.message || "Billing code saved successfully");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to save billing code");
    }
  };

  return (
    <DashboardLayout
      title="Approvals Dashboard"
      subtitle={`Welcome, ${actingAs?.username || user?.username}`}
      accent="#1d4ed8"
      sidebarTitle="Approvals Panel"
      sidebarItems={[
        { key: "search", label: "Search Patient" },
        { key: "register", label: "Register Patient" },
        { key: "approval", label: "Update Approval" },
        { key: "billing", label: "Thiqa Billing Codes" },
      ]}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      onLogout={onLogout}
      actingAs={actingAs}
      actingAsName={actingAs?.username}
      onBackToAdmin={handleBackToAdmin}
    >
      {message && <DashboardNotice type="success">{message}</DashboardNotice>}
      {error && <DashboardNotice type="error">{error}</DashboardNotice>}

      {activeSection === "search" && (
        <PatientSearchPanel
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onSearch={handleSearchPatient}
          searchResults={searchResults}
          onSelectPatient={handleSelectPatient}
        />
      )}

      {activeSection === "register" && (
        <PatientRegisterForm
          patientForm={patientForm}
          setPatientForm={setPatientForm}
          onSubmit={handleCreatePatientFile}
        />
      )}

      {activeSection === "approval" && (
        <div style={styles.card}>
          <h2 style={styles.title}>Update Approval</h2>

          {selectedPatient ? (
            <div style={styles.selectedBox}>
              <strong>{selectedPatient.name}</strong> ({selectedPatient.patient_id})
              <button
                type="button"
                style={styles.openButton}
                onClick={() => navigate(`/patients/${selectedPatient.id}`)}
              >
                Open Patient File
              </button>
            </div>
          ) : (
            <div style={styles.infoBox}>Search and select a patient first.</div>
          )}

          <form onSubmit={handleSaveApproval} style={styles.form}>
            <select
              value={approvalForm.insurance_provider}
              onChange={(e) =>
                setApprovalForm({ ...approvalForm, insurance_provider: e.target.value })
              }
              style={styles.input}
            >
              <option value="thiqa">Thiqa</option>
            </select>

            <input
              type="text"
              placeholder="Authorization Number"
              value={approvalForm.authorization_number}
              onChange={(e) =>
                setApprovalForm({ ...approvalForm, authorization_number: e.target.value })
              }
              style={styles.input}
            />

            <input
              type="date"
              value={approvalForm.start_date}
              onChange={(e) =>
                setApprovalForm({ ...approvalForm, start_date: e.target.value })
              }
              style={styles.input}
            />

            <input
              type="date"
              value={approvalForm.expiry_date}
              onChange={(e) =>
                setApprovalForm({ ...approvalForm, expiry_date: e.target.value })
              }
              style={styles.input}
            />

            <input
              type="number"
              min="0"
              placeholder="Approved Sessions"
              value={approvalForm.approved_sessions}
              onChange={(e) =>
                setApprovalForm({ ...approvalForm, approved_sessions: e.target.value })
              }
              style={styles.input}
            />

            <input
              type="text"
              placeholder="Approved CPT Codes (comma separated)"
              value={approvalForm.approved_cpt_codes_text}
              onChange={(e) =>
                setApprovalForm({
                  ...approvalForm,
                  approved_cpt_codes_text: e.target.value,
                })
              }
              style={styles.input}
            />

            <textarea
              placeholder="Notes"
              value={approvalForm.notes}
              onChange={(e) =>
                setApprovalForm({ ...approvalForm, notes: e.target.value })
              }
              style={styles.textarea}
            />

            <button type="submit" style={styles.primaryButton}>
              Save Approval
            </button>
          </form>
        </div>
      )}

      {activeSection === "billing" && (
        <div style={styles.card}>
          <h2 style={styles.title}>Thiqa Billing Codes</h2>

          <form onSubmit={handleSaveBillingCode} style={styles.form}>
            <input
              type="text"
              placeholder="Code"
              value={billingForm.code}
              onChange={(e) =>
                setBillingForm({ ...billingForm, code: e.target.value })
              }
              style={styles.input}
            />

            <input
              type="text"
              placeholder="Description"
              value={billingForm.description}
              onChange={(e) =>
                setBillingForm({ ...billingForm, description: e.target.value })
              }
              style={styles.input}
            />

            <input
              type="number"
              step="0.01"
              placeholder="Amount"
              value={billingForm.amount}
              onChange={(e) =>
                setBillingForm({ ...billingForm, amount: e.target.value })
              }
              style={styles.input}
            />

            <button type="submit" style={styles.primaryButton}>
              Save Billing Code
            </button>
          </form>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Code</th>
                  <th style={styles.th}>Description</th>
                  <th style={styles.th}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {billingCodes.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>{item.code}</td>
                    <td style={styles.td}>{item.description}</td>
                    <td style={styles.td}>{item.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e8eef7",
    display: "grid",
    gap: "16px",
  },
  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
  },
  selectedBox: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
    borderRadius: "12px",
    padding: "14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  infoBox: {
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    color: "#64748b",
    borderRadius: "12px",
    padding: "14px",
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
    fontWeight: "700",
    cursor: "pointer",
  },
  tableWrap: {
    overflowX: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "600px",
  },
  th: {
    textAlign: "left",
    padding: "12px 14px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
  },
  td: {
    padding: "12px 14px",
    borderBottom: "1px solid #eef2f7",
  },
};
import { useEffect, useState } from "react";
import api from "../../api/api";

export default function useApprovalsDashboard() {
  const [activeSection, setActiveSection] = useState("search");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [alerts, setAlerts] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [refreshTimelineKey, setRefreshTimelineKey] = useState(0);

  const [patientForm, setPatientForm] = useState({
    name: "",
    patient_id: "",
  });

  const [approvalForm, setApprovalForm] = useState({
    insurance_provider: "thiqa",
    authorization_number: "",
    start_date: "",
    expiry_date: "",
    approved_sessions: 0,
    used_sessions: 0,
    approved_cpt_codes_text: "",
  });

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const res = await api.get("approvals/alerts/");
      setAlerts(res.data.alerts || []);
    } catch {
      setAlerts([]);
    }
  };

  const handleSelectPatient = async (patient) => {
    setMessage("");
    setError("");
    setSelectedPatient(patient);
    setActiveSection("approval");

    try {
      const res = await api.get(`approvals/patient-approval/${patient.id}/`);
      const approval = res.data.approval || {};

      setApprovalForm({
        insurance_provider:
          approval.insurance_provider || patient.insurance_provider || "thiqa",
        authorization_number:
          approval.authorization_number ||
          patient.current_approval_number ||
          "",
        start_date: approval.start_date || patient.approval_start_date || "",
        expiry_date: approval.expiry_date || patient.approval_expiry_date || "",
        approved_sessions:
          approval.approved_sessions ?? patient.approved_sessions ?? 0,
        used_sessions: patient.sessions_taken ?? 0,
        approved_cpt_codes_text: (
          approval.approved_cpt_codes ||
          patient.approved_cpt_codes ||
          []
        ).join(","),
      });
    } catch {
      setError("Failed to load approval");
    }
  };

  const handleCreatePatientFile = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const patientPayload = {
        name: patientForm.name,
        patient_id: patientForm.patient_id,
      };

      const res = await api.post("patients/", patientPayload);
      const patient = res.data.patient;

      if (patient && patientForm.authorization_number) {
        await api.post(`approvals/patient-approval/${patient.id}/`, {
          insurance_provider: "thiqa",
          authorization_number: patientForm.authorization_number,
          expiry_date: patientForm.approval_expiry_date,
          approved_sessions: Number(patientForm.approved_sessions || 0),
          used_sessions: 0,
          approved_cpt_codes: [],
        });
      }

      setPatientForm({
        name: "",
        patient_id: "",
        authorization_number: "",
        approval_start_date: "",
        approval_expiry_date: "",
        approved_sessions: 6,
      });

      if (patient) {
        await handleSelectPatient(patient);
      }

      setRefreshTimelineKey((prev) => prev + 1);
      setMessage("Patient created successfully");
      await loadAlerts();
    } catch (err) {
      setError(err?.response?.data?.error || "Create failed");
    }
  };

  const handleSaveApproval = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!selectedPatient) {
      setError("Select patient first");
      return;
    }

    try {
      const hadExistingApproval = Boolean(
        selectedPatient?.current_approval_number
      );

      const payload = {
        insurance_provider: approvalForm.insurance_provider,
        authorization_number: approvalForm.authorization_number,
        expiry_date: approvalForm.expiry_date,
        approved_sessions: Number(approvalForm.approved_sessions || 0),
        used_sessions: Number(approvalForm.used_sessions || 0),
        approved_cpt_codes: (approvalForm.approved_cpt_codes_text || "")
          .split(",")
          .map((x) => x.trim().toUpperCase())
          .filter(Boolean),
      };

      await api.post(`approvals/patient-approval/${selectedPatient.id}/`, payload);

      setMessage(
        hadExistingApproval
          ? "Approval updated successfully"
          : "Approval added successfully"
      );

      await loadAlerts();

      const refreshedPatient = {
        ...selectedPatient,
        insurance_provider: payload.insurance_provider,
        current_approval_number: payload.authorization_number,
        approval_expiry_date: payload.expiry_date,
        approved_sessions: payload.approved_sessions,
        approved_cpt_codes: payload.approved_cpt_codes,
        sessions_taken: payload.used_sessions,
      };

      setSelectedPatient(refreshedPatient);
      setRefreshTimelineKey((prev) => prev + 1);
      await handleSelectPatient(refreshedPatient);
      setActiveSection("approval");
    } catch (err) {
      setError(err?.response?.data?.error || "Save failed");
    }
  };

  const handleDeleteApproval = async (patient) => {
    if (!patient?.id) return;

    const confirmed = window.confirm(
      `Delete current approval for ${patient.name}?`
    );
    if (!confirmed) return;

    try {
      setMessage("");
      setError("");

      await api.delete(`approvals/patient-approval/${patient.id}/`);
      await loadAlerts();

      const refreshedPatient = {
        ...patient,
        insurance_provider: "thiqa",
        current_approval_number: "",
        approval_start_date: "",
        approval_expiry_date: "",
        approved_sessions: 0,
        approved_cpt_codes: [],
        sessions_taken: 0,
      };

      setSelectedPatient(refreshedPatient);
      setApprovalForm({
        insurance_provider: "thiqa",
        authorization_number: "",
        start_date: "",
        expiry_date: "",
        approved_sessions: 0,
        used_sessions: 0,
        approved_cpt_codes_text: "",
      });

      setRefreshTimelineKey((prev) => prev + 1);
      setMessage("Approval deleted successfully");
      setActiveSection("approval");
    } catch (err) {
      setError(err?.response?.data?.error || "Delete failed");
    }
  };

  return {
    activeSection,
    setActiveSection,
    message,
    error,
    alerts,
    selectedPatient,
    patientForm,
    setPatientForm,
    approvalForm,
    setApprovalForm,
    refreshTimelineKey,
    handleSelectPatient,
    handleCreatePatientFile,
    handleSaveApproval,
    handleDeleteApproval,
  };
}
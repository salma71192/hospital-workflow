import { useEffect, useState } from "react";
import api from "../../api/api";

export default function useApprovalsDashboard() {
  const [activeSection, setActiveSection] = useState("search");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [alerts, setAlerts] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [patientForm, setPatientForm] = useState({
    name: "",
    patient_id: "",
    authorization_number: "",
    approval_start_date: "",
    approval_expiry_date: "",
    approved_sessions: 6,
  });

  const [approvalForm, setApprovalForm] = useState({
    insurance_provider: "thiqa",
    authorization_number: "",
    start_date: "",
    expiry_date: "",
    approved_sessions: 0,
    approved_cpt_codes_text: "",
  });

  const [billingCodes, setBillingCodes] = useState([]);

  useEffect(() => {
    loadBillingCodes();
    loadAlerts();
  }, []);

  const loadBillingCodes = async () => {
    try {
      const res = await api.get("approvals/billing-codes/?provider=thiqa");
      setBillingCodes(res.data.codes || []);
    } catch {
      setBillingCodes([]);
    }
  };

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
        start_date:
          approval.start_date || patient.approval_start_date || "",
        expiry_date:
          approval.expiry_date || patient.approval_expiry_date || "",
        approved_sessions:
          approval.approved_sessions ?? patient.approved_sessions ?? 0,
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
          start_date: patientForm.approval_start_date,
          expiry_date: patientForm.approval_expiry_date,
          approved_sessions: Number(patientForm.approved_sessions || 0),
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

      setMessage("Patient created successfully");
      loadAlerts();
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
      const hadExistingApproval = Boolean(selectedPatient?.current_approval_number);

      const payload = {
        insurance_provider: approvalForm.insurance_provider,
        authorization_number: approvalForm.authorization_number,
        start_date: approvalForm.start_date,
        expiry_date: approvalForm.expiry_date,
        approved_sessions: Number(approvalForm.approved_sessions || 0),
        approved_cpt_codes: (approvalForm.approved_cpt_codes_text || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      };

      await api.post(`approvals/patient-approval/${selectedPatient.id}/`, payload);

      setMessage(
        hadExistingApproval
          ? "Approval updated successfully"
          : "Approval added successfully"
      );

      loadAlerts();

      setSelectedPatient((prev) =>
        prev
          ? {
              ...prev,
              insurance_provider: payload.insurance_provider,
              current_approval_number: payload.authorization_number,
              approval_start_date: payload.start_date,
              approval_expiry_date: payload.expiry_date,
              approved_sessions: payload.approved_sessions,
              approved_cpt_codes: payload.approved_cpt_codes,
            }
          : prev
      );

      setApprovalForm((prev) => ({
        ...prev,
        insurance_provider: payload.insurance_provider,
        authorization_number: payload.authorization_number,
        start_date: payload.start_date,
        expiry_date: payload.expiry_date,
        approved_sessions: payload.approved_sessions,
        approved_cpt_codes_text: payload.approved_cpt_codes.join(","),
      }));
    } catch (err) {
      setError(err?.response?.data?.error || "Save failed");
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
    billingCodes,
    handleSelectPatient,
    handleCreatePatientFile,
    handleSaveApproval,
  };
}
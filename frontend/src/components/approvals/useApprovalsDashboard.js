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
        insurance_provider: approval.insurance_provider || "thiqa",
        authorization_number: approval.authorization_number || "",
        start_date: approval.start_date || "",
        expiry_date: approval.expiry_date || "",
        approved_sessions: approval.approved_sessions || 0,
        approved_cpt_codes_text: (approval.approved_cpt_codes || []).join(","),
        notes: approval.notes || "",
      });
    } catch {
      setError("Failed to load approval");
    }
  };

  const handleCreatePatientFile = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("patients/", patientForm);
      const patient = res.data.patient;

      setPatientForm({
        name: "",
        patient_id: "",
        current_approval_number: "",
        sessions_taken: "",
        taken_with: "",
        current_future_appointments: "",
      });

      if (patient) {
        await handleSelectPatient(patient);
      }

      setMessage("Patient created");
      loadAlerts();
    } catch {
      setError("Create failed");
    }
  };

  const handleSaveApproval = async (e) => {
    e.preventDefault();

    if (!selectedPatient) {
      setError("Select patient first");
      return;
    }

    try {
      await api.post(`approvals/patient-approval/${selectedPatient.id}/`, {
        insurance_provider: approvalForm.insurance_provider,
        authorization_number: approvalForm.authorization_number,
        start_date: approvalForm.start_date,
        expiry_date: approvalForm.expiry_date,
        approved_sessions: Number(approvalForm.approved_sessions || 0),
        approved_cpt_codes: approvalForm.approved_cpt_codes_text
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        notes: approvalForm.notes,
      });

      setMessage("Approval saved");
      loadAlerts();

      setSelectedPatient((prev) =>
        prev
          ? {
              ...prev,
              current_approval_number: approvalForm.authorization_number,
              approval_start_date: approvalForm.start_date,
              approval_expiry_date: approvalForm.expiry_date,
              approved_sessions: Number(approvalForm.approved_sessions || 0),
              approved_cpt_codes: approvalForm.approved_cpt_codes_text
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean),
            }
          : prev
      );
    } catch {
      setError("Save failed");
    }
  };

  const handleSaveBillingCode = async (e) => {
    e.preventDefault();

    try {
      await api.post("approvals/billing-codes/", billingForm);

      setBillingForm({
        insurance_provider: "thiqa",
        code: "",
        description: "",
        amount: "",
      });

      loadBillingCodes();
      setMessage("Billing saved");
    } catch {
      setError("Billing failed");
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
    billingForm,
    setBillingForm,
    handleSelectPatient,
    handleCreatePatientFile,
    handleSaveApproval,
    handleSaveBillingCode,
  };
}
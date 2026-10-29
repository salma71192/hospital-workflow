
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/api";

const styles = `
.create-claim-page {
  --cc-navy: #17365d;
  --cc-primary: #4057cf;
  --cc-primary-dark: #3349bd;
  --cc-text: #263b53;
  --cc-muted: #71829a;
  --cc-border: #dce5f0;
  --cc-bg: #f5f8fd;
  --cc-green: #15803d;
  --cc-red: #b91c1c;
  max-width: 1450px;
  margin: 0 auto;
  padding: 24px 12px 40px;
  color: var(--cc-text);
  font-family: inherit;
}
.create-claim-page * { box-sizing: border-box; }
.create-claim-header {
  display: flex; justify-content: space-between; align-items: center;
  gap: 16px; flex-wrap: wrap; margin-bottom: 25px;
}
.create-claim-title {
  margin: 0; font-size: clamp(26px, 3vw, 36px);
  font-weight: 800; letter-spacing: -.7px; color: var(--cc-navy);
}
.create-claim-subtitle {
  margin: 9px 0 0; color: var(--cc-muted); line-height: 1.7;
  font-size: 14px; max-width: 760px;
}
.create-claim-header-tag {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 9px 13px; border-radius: 999px; background: #eef2ff;
  color: #4057cf; font-size: 12px; font-weight: 800;
}
.create-claim-header-dot {
  width: 7px; height: 7px; border-radius: 50%; background: #4057cf;
}
.create-claim-card {
  padding: clamp(18px, 2.2vw, 30px); margin-bottom: 20px;
  border: 1px solid var(--cc-border); border-radius: 18px;
  background: #fff; box-shadow: 0 7px 25px rgba(35,65,110,.045);
}
.create-claim-section-heading {
  display: flex; align-items: center; gap: 13px;
  margin-bottom: 23px; padding-bottom: 17px;
  border-bottom: 1px solid #edf1f7;
}
.create-claim-section-number {
  width: 43px; height: 43px; display: flex;
  align-items: center; justify-content: center; flex-shrink: 0;
  border-radius: 13px; background: #eef2ff;
  color: var(--cc-primary); font-weight: 800;
}
.create-claim-section-title {
  margin: 0; font-size: 19px; font-weight: 800; color: var(--cc-navy);
}
.create-claim-section-description {
  margin: 5px 0 0; color: var(--cc-muted);
  font-size: 13px; line-height: 1.6;
}
.create-claim-label {
  display: block; margin-bottom: 8px; color: #334b68;
  font-size: 13px; font-weight: 800;
}
.create-claim-form-grid {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 21px 24px;
}
.create-claim-field { min-width: 0; }
.create-claim-field-full { grid-column: 1 / -1; }
.create-claim-input, .create-claim-select, .create-claim-textarea,
.create-claim-search-input {
  width: 100%; min-height: 48px; padding: 12px 14px;
  border: 1px solid #d4deeb; border-radius: 10px;
  background: #fff; color: #203b5c; font: inherit; font-size: 14px;
  outline: none; transition: border-color .15s, box-shadow .15s;
}
.create-claim-input:focus, .create-claim-select:focus,
.create-claim-textarea:focus, .create-claim-search-input:focus {
  border-color: #536cda; box-shadow: 0 0 0 3px rgba(83,108,218,.12);
}
.create-claim-input:read-only, .create-claim-select:disabled {
  background: #f4f7fb; color: #526780; cursor: default;
}
.create-claim-textarea { min-height: 100px; resize: vertical; }
.create-claim-form-note {
  margin-top: 7px; color: #7a8ba2; font-size: 12px; line-height: 1.6;
}
.create-claim-search-box {
  display: flex; align-items: center; gap: 10px;
  padding: 5px 10px; border: 1px solid #d4deeb;
  border-radius: 12px; background: #f8faff;
}
.create-claim-search-box .create-claim-search-input {
  min-width: 0; border: 0; background: transparent; box-shadow: none;
}
.create-claim-search-meta {
  display: flex; justify-content: space-between; flex-wrap: wrap;
  gap: 8px; margin-top: 10px; color: #7a8ba2; font-size: 12px;
}
.create-claim-results {
  display: flex; flex-direction: column; gap: 10px;
  margin-top: 14px; padding: 13px; border: 1px solid #e0e8f3;
  border-radius: 14px; background: #f7f9fd;
}
.create-claim-results-heading {
  display: flex; justify-content: space-between; gap: 10px;
  flex-wrap: wrap; padding: 5px; color: #526985;
  font-size: 12px; font-weight: 800;
}
.create-claim-result {
  display: flex; align-items: center; justify-content: space-between;
  gap: 14px; flex-wrap: wrap; padding: 14px;
  border: 1px solid #e0e7f1; border-radius: 12px; background: #fff;
}
.create-claim-result.selected { border-color: #7d8ee7; background: #f4f6ff; }
.create-claim-patient-info {
  display: flex; align-items: center; gap: 12px;
  flex: 1 1 230px; min-width: 0;
}
.create-claim-avatar {
  width: 46px; height: 46px; display: flex; align-items: center;
  justify-content: center; flex-shrink: 0; border-radius: 14px;
  background: #e9edff; color: #3655c8; font-weight: 800;
}
.create-claim-patient-details { min-width: 0; }
.create-claim-patient-name { margin: 0; font-weight: 800; overflow-wrap: anywhere; }
.create-claim-patient-meta {
  display: flex; flex-wrap: wrap; gap: 7px 12px;
  margin-top: 7px; color: #71829a; font-size: 12px;
}
.create-claim-result-actions, .create-claim-selected-actions,
.create-claim-footer-actions {
  display: flex; align-items: center; gap: 9px; flex-wrap: wrap;
}
.create-claim-button {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 7px; min-height: 42px; padding: 10px 15px;
  border: 1px solid transparent; border-radius: 10px;
  font-size: 13px; font-weight: 800; cursor: pointer;
  transition: background .15s, transform .15s, border-color .15s;
}
.create-claim-button:hover:not(:disabled) { transform: translateY(-1px); }
.create-claim-button:disabled { opacity: .55; cursor: not-allowed; }
.create-claim-button-primary { background: var(--cc-primary); color: #fff; }
.create-claim-button-primary:hover:not(:disabled) { background: var(--cc-primary-dark); }
.create-claim-button-secondary {
  background: #fff; color: #3e536e; border-color: #d5dfeb;
}
.create-claim-button-light {
  background: #eef2ff; color: #4057cf; border-color: #dce4ff;
}
.create-claim-selected {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 15px; flex-wrap: wrap; padding: 17px; margin-top: 17px;
  border: 1px solid #b8e8ca; border-radius: 14px; background: #f0fdf5;
}
.create-claim-selected-label {
  margin-bottom: 6px; color: #15803d; font-size: 12px; font-weight: 800;
}
.create-claim-selected-name { color: #166534; font-size: 17px; font-weight: 800; }
.create-claim-selected-meta { margin-top: 6px; color: #4b7c5b; font-size: 12px; }
.create-claim-empty {
  text-align: center; padding: 22px 14px; border: 1px dashed #cbd5e1;
  border-radius: 12px; background: #fff; color: #64748b; font-size: 14px;
}
.create-claim-message {
  padding: 14px 16px; margin-bottom: 17px; border-radius: 11px;
  font-size: 14px; line-height: 1.7; overflow-wrap: anywhere;
}
.create-claim-error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }
.create-claim-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
.create-claim-info { background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; }
.create-claim-renewal-panel {
  grid-column: 1 / -1; padding: 20px; border: 1px solid #dbe5ff;
  border-radius: 15px; background: linear-gradient(135deg, #f8faff, #fff);
}
.create-claim-renewal-heading {
  display: flex; align-items: flex-start; gap: 12px; margin-bottom: 18px;
}
.create-claim-renewal-icon {
  display: flex; align-items: center; justify-content: center;
  width: 42px; height: 42px; flex-shrink: 0; border-radius: 12px;
  background: #e9edff; color: #4057cf; font-size: 21px;
}
.create-claim-renewal-title { margin: 0; color: #233e79; font-size: 16px; font-weight: 800; }
.create-claim-renewal-description {
  margin: 5px 0 0; color: #71829a; font-size: 13px; line-height: 1.6;
}
.create-claim-checkbox-row {
  display: flex; align-items: flex-start; gap: 11px; padding: 14px;
  border: 1px solid #dce5f0; border-radius: 11px; background: #fff; cursor: pointer;
}
.create-claim-checkbox-row input {
  width: 18px; height: 18px; margin-top: 2px;
  accent-color: #4057cf; flex-shrink: 0;
}
.create-claim-checkbox-title { font-size: 13px; font-weight: 800; color: #334b68; }
.create-claim-checkbox-description {
  margin-top: 4px; font-size: 12px; color: #71829a; line-height: 1.6;
}
.create-claim-form-footer {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 14px; padding-top: 22px; margin-top: 23px;
  border-top: 1px solid #e8edf5;
}
.create-claim-footer-note { color: #7a8ba2; font-size: 12px; line-height: 1.6; }
.create-claim-creator { margin-top: 8px; color: #4f6b5a; }
.create-claim-date-chip {
  display: inline-flex; align-items: center; gap: 7px; padding: 8px 11px;
  border-radius: 9px; background: #eef2ff; color: #4057cf;
  font-size: 12px; font-weight: 800;
}
@media(max-width:700px) {
  .create-claim-page { padding: 16px 6px 28px; }
  .create-claim-form-grid { grid-template-columns: minmax(0,1fr); gap: 17px; }
  .create-claim-field-full, .create-claim-renewal-panel { grid-column: auto; }
  .create-claim-card { padding: 17px; }
  .create-claim-result-actions, .create-claim-selected-actions,
  .create-claim-footer-actions { width: 100%; }
  .create-claim-result-actions .create-claim-button,
  .create-claim-selected-actions .create-claim-button,
  .create-claim-footer-actions .create-claim-button { flex: 1 1 auto; }
  .create-claim-form-footer { align-items: stretch; flex-direction: column; }
}
`;

function getPatientName(patient) {
  if (!patient) return "Unknown Patient";

  const name =
    patient.full_name ||
    patient.fullName ||
    patient.patient_name ||
    patient.patientName ||
    patient.name;

  if (name) return String(name);

  return [
    patient.first_name || patient.firstName,
    patient.middle_name || patient.middleName,
    patient.last_name || patient.lastName,
  ]
    .filter(Boolean)
    .join(" ") || "Unknown Patient";
}

function getPatientNumber(patient) {
  return (
    patient?.file_number ||
    patient?.fileNumber ||
    patient?.patient_number ||
    patient?.patientNumber ||
    patient?.mrn ||
    patient?.medical_record_number ||
    patient?.medicalRecordNumber ||
    patient?.id ||
    "N/A"
  );
}

function getPatientPhone(patient) {
  return (
    patient?.phone ||
    patient?.phone_number ||
    patient?.phoneNumber ||
    patient?.mobile ||
    patient?.mobile_number ||
    patient?.mobileNumber ||
    ""
  );
}

function getPatientList(response) {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.patients)) return data.patients;
  return [];
}

function getInitials(name) {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();
}

function getCreatorName(claim) {
  if (!claim) return "";

  const creator =
    claim.created_by_name ||
    claim.createdByName ||
    claim.creator_name ||
    claim.creatorName ||
    claim.created_by_display_name ||
    claim.createdByDisplayName ||
    claim.created_by_username ||
    claim.createdByUsername;

  if (creator && typeof creator !== "object") return String(creator);

  const user =
    claim.created_by ||
    claim.createdBy ||
    claim.creator ||
    claim.user;

  if (user && typeof user === "object") {
    return (
      user.display_name ||
      user.displayName ||
      user.full_name ||
      user.fullName ||
      user.name ||
      user.username ||
      user.email ||
      ""
    );
  }

  return "";
}

function getUserName(user) {
  return (
    user?.display_name ||
    user?.displayName ||
    user?.full_name ||
    user?.fullName ||
    user?.name ||
    user?.username ||
    user?.email ||
    ""
  );
}

function getApiError(err) {
  const data = err?.response?.data;
  if (typeof data === "string") return data;
  if (data?.detail) return String(data.detail);
  if (data?.error) return String(data.error);
  if (data?.message) return String(data.message);

  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([key, value]) => {
        const message = Array.isArray(value)
          ? value.map(String).join(", ")
          : typeof value === "object" && value !== null
            ? JSON.stringify(value)
            : String(value);
        return `${key}: ${message}`;
      })
      .join(" · ");
  }

  if (err?.message === "Network Error") {
    return "Network error: the server could not be reached. Check the backend and CORS settings.";
  }

  return err?.message || "The request failed. Please check the information and try again.";
}

function getAlertClaimId(alert) {
  return (
    alert?.claimId ||
    alert?.claim_id_value ||
    alert?.claim?.claimId ||
    alert?.claim?.claim_id ||
    ""
  );
}

function getAlertPatientId(alert) {
  return (
    alert?.patientId ||
    alert?.patient_id ||
    alert?.patient?.id ||
    alert?.claim?.patientId ||
    alert?.claim?.patient_id ||
    null
  );
}

function getAlertDate(alert) {
  return String(alert?.renewalDate || alert?.renewal_date || "").slice(0, 10);
}

function getLocalToday() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function getInitialForm(renewalAlert) {
  return {
    claimId: renewalAlert ? getAlertClaimId(renewalAlert) : "",
    status: renewalAlert ? "Submitted" : "Pending",
    rejectionReason:
      renewalAlert?.rejectionReason ||
      renewalAlert?.rejection_reason ||
      renewalAlert?.claim?.rejection_reason ||
      "",
    renewalDate: renewalAlert ? getAlertDate(renewalAlert) : getLocalToday(),
  };
}

function getClaimDatabaseId(claim) {
  const id =
    claim?.id ??
    claim?.pk ??
    claim?.claim_pk ??
    claim?.claimPk ??
    claim?.database_id ??
    claim?.databaseId;

  return id === undefined || id === null || id === "" ? null : id;
}

function unwrapClaim(response) {
  const data = response?.data;
  return data?.claim || data;
}

function getClaimForm(claim) {
  const rawStatus = String(claim?.status || "Pending").trim().toLowerCase();

  const statusMap = {
    pending: "Pending",
    submitted: "Submitted",
    approved: "Approved",
    rejected: "Rejected",
    denied: "Rejected",
  };

  return {
    claimId: String(
      claim?.claimId ??
      claim?.claim_id ??
      claim?.claim_id_value ??
      claim?.claim_number ??
      claim?.claimNumber ??
      ""
    ),
    status: statusMap[rawStatus] || "Pending",
    rejectionReason: String(
      claim?.rejectionReason ?? claim?.rejection_reason ?? ""
    ),
    renewalDate: String(
      claim?.renewalDate ?? claim?.renewal_date ?? ""
    ).slice(0, 10) || getLocalToday(),
  };
}

export default function CreateClaim({
  patient: initialPatient,
  editClaim: editClaimProp = null,
  editClaimId: editClaimIdProp = null,
  renewalAlert = null,
  onClose,
  onClaimCreated,
  onRenewalUpdated,
  onCreateAlert,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state;

  const isRenewalMode = Boolean(renewalAlert);

  const editClaim =
    !isRenewalMode &&
    (editClaimProp ||
      (routeState?.mode === "edit" &&
      routeState?.editClaim &&
      typeof routeState.editClaim === "object"
        ? routeState.editClaim
        : null));

  const isEditing = !isRenewalMode && Boolean(editClaim);

  const editClaimId = isEditing
    ? editClaimIdProp ??
      routeState?.claimId ??
      getClaimDatabaseId(editClaim)
    : null;

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(initialPatient || null);
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdClaim, setCreatedClaim] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [createRenewalAlert, setCreateRenewalAlert] = useState(false);

  const [form, setForm] = useState(() =>
    isEditing && editClaim
      ? getClaimForm(editClaim)
      : getInitialForm(renewalAlert)
  );

  useEffect(() => {
    let active = true;

    async function loadPatients() {
      setLoadingPatients(true);

      try {
        const response = await api.get("patients/", {
          withCredentials: true,
        });

        if (!active) return;

        const patientList = getPatientList(response);
        setPatients(patientList);

        if (renewalAlert) {
          const patientId = getAlertPatientId(renewalAlert);
          const matchedPatient = patientList.find(
            (item) => String(item.id) === String(patientId)
          );

          if (matchedPatient) {
            setSelectedPatient(matchedPatient);
          } else if (
            renewalAlert.patient &&
            typeof renewalAlert.patient === "object"
          ) {
            setSelectedPatient(renewalAlert.patient);
          }
        } else if (isEditing && editClaim) {
          const claimPatient =
            editClaim.patient && typeof editClaim.patient === "object"
              ? editClaim.patient
              : null;

          const patientId =
            editClaim.patientId ??
            editClaim.patient_id ??
            editClaim.patient?.id;

          const matchedPatient = patientList.find(
            (item) => String(item.id) === String(patientId)
          );

          setSelectedPatient(matchedPatient || claimPatient || null);
        } else if (initialPatient) {
          const matchedPatient = patientList.find(
            (item) => String(item.id) === String(initialPatient.id)
          );
          setSelectedPatient(matchedPatient || initialPatient);
        } else {
          setSelectedPatient(null);
        }
      } catch (err) {
        if (active) setError(getApiError(err));
      } finally {
        if (active) setLoadingPatients(false);
      }
    }

    async function loadCurrentUser() {
      try {
        const response = await api.get("users/me/", {
          withCredentials: true,
        });
        if (active) setCurrentUser(response?.data || null);
      } catch {
        if (active) setCurrentUser(null);
      }
    }

    loadPatients();
    loadCurrentUser();

    return () => {
      active = false;
    };
  }, [initialPatient, renewalAlert, isEditing, editClaim]);

  useEffect(() => {
    setError("");
    setSuccess("");
    setCreatedClaim(null);
    setSearch("");
    setShowResults(false);
    setCreateRenewalAlert(false);

    if (isEditing && editClaim) {
      setForm(getClaimForm(editClaim));

      const claimPatient =
        editClaim.patient && typeof editClaim.patient === "object"
          ? editClaim.patient
          : null;

      if (claimPatient) setSelectedPatient(claimPatient);
      return;
    }

    setForm(getInitialForm(renewalAlert));

    if (!renewalAlert) {
      setSelectedPatient(initialPatient || null);
    }
  }, [location.key, renewalAlert, initialPatient, isEditing, editClaim]);

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];

    return patients
      .filter((patient) => {
        const values = [
          getPatientName(patient),
          getPatientNumber(patient),
          getPatientPhone(patient),
          patient?.national_id,
          patient?.nationalId,
          patient?.emirates_id,
          patient?.emiratesId,
          patient?.id,
        ];

        return values.some((value) =>
          String(value ?? "").toLowerCase().includes(term)
        );
      })
      .slice(0, 10);
  }, [patients, search]);

  const isRejected = form.status === "Rejected";
  const renewalDate = getAlertDate(renewalAlert);
  const isRenewalDateToday =
    !isRenewalMode || renewalDate === getLocalToday();

  const reminderStatus = String(
    renewalAlert?.renewal_status ??
    renewalAlert?.renewalStatus ??
    renewalAlert?.alert_status ??
    renewalAlert?.alertStatus ??
    renewalAlert?.status ??
    ""
  ).trim().toLowerCase();

  const isAlreadySubmitted = reminderStatus === "submitted";

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleStatusChange(status) {
    setForm((current) => ({
      ...current,
      status,
      rejectionReason: status === "Rejected" ? current.rejectionReason : "",
      renewalDate: status === "Rejected" ? current.renewalDate : getLocalToday(),
    }));

    if (status !== "Rejected") {
      setCreateRenewalAlert(false);
    }
  }

  function handleRenewalDateChange(value) {
    setForm((current) => ({ ...current, renewalDate: value }));
    setCreateRenewalAlert(Boolean(value));
  }

  function selectPatient(patient) {
    if (isRenewalMode || isEditing) return;

    setSelectedPatient(patient);
    setSearch("");
    setShowResults(false);
    setError("");
    setSuccess("");
    setCreatedClaim(null);
  }

  function openPatientFile(patient) {
    if (!patient?.id) {
      setError("This patient does not have a valid ID to open the patient file.");
      return;
    }

    navigate(`/patients/${patient.id}`);
  }

  function resetForm() {
    setError("");
    setSuccess("");
    setCreatedClaim(null);

    if (isRenewalMode) {
      setForm(getInitialForm(renewalAlert));
      return;
    }

    if (isEditing && editClaim) {
      setForm(getClaimForm(editClaim));
      return;
    }

    setForm(getInitialForm(null));
    setCreateRenewalAlert(false);
  }

  async function submitClaim(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setCreatedClaim(null);

    if (!selectedPatient?.id) {
      setError("Please select a valid patient before continuing.");
      return;
    }

    if (!form.claimId.trim()) {
      setError("Please enter the claim number or reference.");
      return;
    }

    if (isEditing && (editClaimId === null || editClaimId === "")) {
      setError(
        "The database ID for this claim is missing. Reopen the claim from Claim History and try again."
      );
      return;
    }

    if (isRenewalMode) {
      if (!renewalAlert?.id) {
        setError("The renewal alert ID is missing. Reopen the alert and try again.");
        return;
      }

      const linkedClaimId =
        renewalAlert.claimPk ??
        renewalAlert.claim_pk ??
        renewalAlert.claim?.id;

      if (!linkedClaimId) {
        setError(
          "This renewal reminder is not linked to an existing claim. Link it to its claim before resubmitting."
        );
        return;
      }

      if (!isRenewalDateToday) {
        setError("This claim can only be renewed on its scheduled renewal date.");
        return;
      }

      if (isAlreadySubmitted) {
        setError("This renewal has already been submitted.");
        return;
      }
    } else {
      if (isRejected && !form.rejectionReason.trim()) {
        setError("Please enter the rejection reason.");
        return;
      }

      if (form.renewalDate && form.renewalDate < getLocalToday()) {
        setError("The renewal date cannot be in the past.");
        return;
      }

      if (
        !isEditing &&
        isRejected &&
        createRenewalAlert &&
        typeof onCreateAlert !== "function"
      ) {
        setError("Renewal alert creation is not connected. Check the parent alert handler.");
        return;
      }
    }

    setSaving(true);

    try {
      if (isRenewalMode) {
        const claimPk =
          renewalAlert.claimPk ??
          renewalAlert.claim_pk ??
          renewalAlert.claim?.id;

        const response = await api.patch(
          `rcm/claims/${claimPk}/`,
          {
            status: "Submitted",
            alertId: renewalAlert.id,
            renewalAlertId: renewalAlert.id,
          },
          { withCredentials: true }
        );

        const claim = unwrapClaim(response);
        setCreatedClaim(claim);
        setSuccess(
          `Renewal for claim ${form.claimId.trim()} was submitted successfully.`
        );

        if (typeof onRenewalUpdated === "function") {
          await onRenewalUpdated(claim);
        }

        return;
      }

      const payload = {
        patientId: selectedPatient.id,
        claimId: form.claimId.trim(),
        status: form.status,
        rejectionReason: form.rejectionReason.trim(),
        renewalDate: isRejected && createRenewalAlert
          ? form.renewalDate || null
          : null,
      };

      const response = isEditing
        ? await api.patch(`rcm/claims/${editClaimId}/`, payload, {
            withCredentials: true,
          })
        : await api.post("rcm/claims/", payload, {
            withCredentials: true,
          });

      const claim = unwrapClaim(response);
      setCreatedClaim(claim);

      if (
        !isEditing &&
        isRejected &&
        createRenewalAlert &&
        form.renewalDate
      ) {
        await onCreateAlert({
          alertType: "renewal",
          patient: selectedPatient,
          claim,
          claimId: form.claimId.trim(),
          renewalDate: form.renewalDate,
          rejectionReason: form.rejectionReason.trim(),
          status: "Rejected",
        });
      }

      if (isEditing) {
        setSuccess("Claim updated successfully.");

        if (typeof onClaimCreated === "function") {
          await onClaimCreated(claim);
        }

        navigate("/rcm/claims", { replace: true, state: null });
      } else {
        setSuccess(
          isRejected && createRenewalAlert && form.renewalDate
            ? "Rejected claim saved and renewal reminder created successfully."
            : "Claim created successfully."
        );

        setForm(getInitialForm(null));
        setCreateRenewalAlert(false);

        if (typeof onClaimCreated === "function") {
          await onClaimCreated(claim);
        }
      }
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  const creatorName =
    getCreatorName(createdClaim?.claim || createdClaim) ||
    getUserName(currentUser);

  return (
    <div className="create-claim-page">
      <style>{styles}</style>

      <div className="create-claim-header">
        <div>
          <h1 className="create-claim-title">
            {isRenewalMode
              ? "Renew Existing Claim"
              : isEditing
                ? "Edit Claim"
                : "Create New Claim"}
          </h1>
          <p className="create-claim-subtitle">
            {isRenewalMode
              ? "Review the existing claim and submit its renewal."
              : isEditing
                ? "Update the selected claim without creating a duplicate."
                : "Enter the claim details. If the claim is rejected, you can schedule one renewal reminder."}
          </p>
        </div>

        <div className="create-claim-header-tag">
          <span className="create-claim-header-dot" />
          {isRenewalMode ? "Existing claim" : isEditing ? "Edit mode" : "RCM claim"}
        </div>

        {onClose && (
          <button
            type="button"
            className="create-claim-button create-claim-button-secondary"
            onClick={onClose}
          >
            ← Back
          </button>
        )}
      </div>

      {isRenewalMode && (
        <div className="create-claim-message create-claim-info" role="status">
          <strong>Renewal submission</strong>
          <br />
          Existing Claim ID: <strong>{form.claimId || "—"}</strong>
          <br />
          Scheduled renewal date: <strong>{renewalDate || "—"}</strong>
          <br />
          The original claim reference will be preserved. The server should
          confirm a successful submission before marking the reminder Submitted.
        </div>
      )}

      {isEditing && (
        <div className="create-claim-message create-claim-info" role="status">
          You are editing an existing claim. Saving changes will update this
          claim rather than create a new record.
        </div>
      )}

      {error && (
        <div className="create-claim-message create-claim-error" role="alert">
          <strong>Unable to save</strong>
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div className="create-claim-message create-claim-success" role="status">
          <strong>{success}</strong>
          {creatorName && (
            <div className="create-claim-creator">
              Processed by: <strong>{creatorName}</strong>
            </div>
          )}
        </div>
      )}

      <section className="create-claim-card">
        <div className="create-claim-section-heading">
          <div className="create-claim-section-number">1</div>
          <div>
            <h2 className="create-claim-section-title">Select Patient</h2>
            <p className="create-claim-section-description">
              {isRenewalMode
                ? "The patient is taken from the existing claim."
                : isEditing
                  ? "The patient linked to this claim is shown below."
                  : "Search by patient name, file number, phone number, or patient ID."}
            </p>
          </div>
        </div>

        {!isRenewalMode && !isEditing && (
          <>
            <label className="create-claim-label" htmlFor="claim-patient-search">
              Search patients
            </label>
            <div className="create-claim-search-box">
              <span aria-hidden="true">⌕</span>
              <input
                id="claim-patient-search"
                className="create-claim-search-input"
                type="search"
                value={search}
                placeholder="Type a name, file number, phone, or patient ID..."
                autoComplete="off"
                onFocus={() => {
                  if (search.trim()) setShowResults(true);
                }}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setShowResults(true);
                  setError("");
                }}
              />
              {search && (
                <button
                  type="button"
                  className="create-claim-button create-claim-button-secondary"
                  onClick={() => {
                    setSearch("");
                    setShowResults(false);
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            <div className="create-claim-search-meta">
              <span>
                {loadingPatients
                  ? "Loading patient records..."
                  : `${patients.length} patient record${patients.length === 1 ? "" : "s"} available`}
              </span>
              <span>Enter a search term to filter results.</span>
            </div>

            {showResults && search.trim() && (
              <div className="create-claim-results">
                <div className="create-claim-results-heading">
                  <span>Matching patients</span>
                  {!loadingPatients && (
                    <span>
                      {filteredPatients.length} result{filteredPatients.length === 1 ? "" : "s"}
                    </span>
                  )}
                </div>

                {loadingPatients ? (
                  <div className="create-claim-empty">Loading patient records...</div>
                ) : filteredPatients.length === 0 ? (
                  <div className="create-claim-empty">
                    No matching patients found. Try another search term.
                  </div>
                ) : (
                  filteredPatients.map((patient) => {
                    const name = getPatientName(patient);
                    const isSelected =
                      String(selectedPatient?.id) === String(patient.id);

                    return (
                      <div
                        className={`create-claim-result${isSelected ? " selected" : ""}`}
                        key={patient.id}
                      >
                        <div className="create-claim-patient-info">
                          <div className="create-claim-avatar">{getInitials(name)}</div>
                          <div className="create-claim-patient-details">
                            <p className="create-claim-patient-name">{name}</p>
                            <div className="create-claim-patient-meta">
                              <span>File No: {getPatientNumber(patient)}</span>
                              {getPatientPhone(patient) && (
                                <span>Phone: {getPatientPhone(patient)}</span>
                              )}
                              {patient?.gender && <span>Gender: {patient.gender}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="create-claim-result-actions">
                          <button
                            type="button"
                            className="create-claim-button create-claim-button-primary"
                            onClick={() => selectPatient(patient)}
                          >
                            {isSelected ? "✓ Selected" : "Select Patient"}
                          </button>
                          <button
                            type="button"
                            className="create-claim-button create-claim-button-secondary"
                            onClick={() => openPatientFile(patient)}
                          >
                            Open Patient File ↗
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}

        {selectedPatient && (
          <div className="create-claim-selected">
            <div>
              <div className="create-claim-selected-label">✓ Patient selected</div>
              <div className="create-claim-selected-name">
                {getPatientName(selectedPatient)}
              </div>
              <div className="create-claim-selected-meta">
                File No: {getPatientNumber(selectedPatient)}
                {getPatientPhone(selectedPatient)
                  ? ` · Phone: ${getPatientPhone(selectedPatient)}`
                  : ""}
              </div>
            </div>
            <div className="create-claim-selected-actions">
              <button
                type="button"
                className="create-claim-button create-claim-button-secondary"
                onClick={() => openPatientFile(selectedPatient)}
              >
                Open Patient File ↗
              </button>
              {!isRenewalMode && !isEditing && (
                <button
                  type="button"
                  className="create-claim-button create-claim-button-light"
                  onClick={() => {
                    setSelectedPatient(null);
                    setSearch("");
                    setShowResults(false);
                    setError("");
                    setSuccess("");
                    setCreatedClaim(null);
                  }}
                >
                  Change Patient
                </button>
              )}
            </div>
          </div>
        )}

        {!selectedPatient && !loadingPatients && (isRenewalMode || isEditing) && (
          <div className="create-claim-empty">
            The patient associated with this claim could not be loaded. Verify
            the claim's patient ID and try again.
          </div>
        )}
      </section>

      <section className="create-claim-card">
        <div className="create-claim-section-heading">
          <div className="create-claim-section-number">2</div>
          <div>
            <h2 className="create-claim-section-title">Claim Details</h2>
            <p className="create-claim-section-description">
              Record the claim reference and current status. Renewal reminders
              are optional and only available for rejected claims.
            </p>
          </div>
        </div>

        <form onSubmit={submitClaim}>
          <div className="create-claim-form-grid">
            <div className="create-claim-field">
              <label className="create-claim-label" htmlFor="claim-reference">
                Claim Number / Reference *
              </label>
              <input
                id="claim-reference"
                className="create-claim-input"
                type="text"
                value={form.claimId}
                onChange={(event) => {
                  if (!isRenewalMode) updateForm("claimId", event.target.value);
                }}
                placeholder="Enter claim number or reference"
                readOnly={isRenewalMode}
                required
              />
              <div className="create-claim-form-note">
                {isRenewalMode
                  ? "The original Claim ID cannot be changed during renewal."
                  : "Enter the reference used by your RCM team."}
              </div>
            </div>

            <div className="create-claim-field">
              <label className="create-claim-label" htmlFor="claim-status">
                Claim Status *
              </label>
              <select
                id="claim-status"
                className="create-claim-select"
                value={form.status}
                disabled={isRenewalMode}
                onChange={(event) => handleStatusChange(event.target.value)}
                required
              >
                <option value="Pending">Pending</option>
                <option value="Submitted">Submitted</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
              <div className="create-claim-form-note">
                {isRenewalMode
                  ? "Submitting a renewal updates the existing claim to Submitted."
                  : "Select Rejected to display the renewal reminder settings."}
              </div>
            </div>

            {isRejected && !isRenewalMode && (
              <div className="create-claim-field create-claim-field-full">
                <label className="create-claim-label" htmlFor="claim-rejection-reason">
                  Rejection Reason *
                </label>
                <textarea
                  id="claim-rejection-reason"
                  className="create-claim-textarea"
                  value={form.rejectionReason}
                  onChange={(event) => updateForm("rejectionReason", event.target.value)}
                  placeholder="Explain why the claim was rejected..."
                  required
                />
                <div className="create-claim-form-note">
                  This reason is recorded for the rejected claim.
                </div>
              </div>
            )}

            {isRejected && !isRenewalMode && !isEditing && (
              <div className="create-claim-renewal-panel">
                <div className="create-claim-renewal-heading">
                  <div className="create-claim-renewal-icon">↻</div>
                  <div>
                    <h3 className="create-claim-renewal-title">Renewal Reminder</h3>
                    <p className="create-claim-renewal-description">
                      Add one optional reminder for the RCM team. The claim remains
                      Rejected until the renewal is actually submitted.
                    </p>
                  </div>
                </div>

                <div className="create-claim-form-grid">
                  <div className="create-claim-field create-claim-field-full">
                    <label className="create-claim-label" htmlFor="claim-renewal-date">
                      Renewal Date
                    </label>
                    <input
                      id="claim-renewal-date"
                      className="create-claim-input"
                      type="date"
                      value={form.renewalDate}
                      min={getLocalToday()}
                      onChange={(event) => handleRenewalDateChange(event.target.value)}
                    />
                    <div className="create-claim-form-note">
                      The calendar starts at today. Select today or a future date.
                    </div>
                  </div>

                  <div className="create-claim-field create-claim-field-full">
                    <label className="create-claim-checkbox-row">
                      <input
                        type="checkbox"
                        checked={createRenewalAlert}
                        onChange={(event) => {
                          const checked = event.target.checked;
                          setCreateRenewalAlert(checked);
                          if (checked && !form.renewalDate) {
                            updateForm("renewalDate", getLocalToday());
                          }
                        }}
                      />
                      <span>
                        <span className="create-claim-checkbox-title">
                          Create renewal reminder
                        </span>
                        <div className="create-claim-checkbox-description">
                          {form.renewalDate
                            ? `Schedule a reminder for ${form.renewalDate}.`
                            : "Enable this option to schedule a renewal reminder."}
                        </div>
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {isRenewalMode && (
              <div className="create-claim-field create-claim-field-full">
                <label className="create-claim-label" htmlFor="renewal-readonly-date">
                  Scheduled Renewal Date
                </label>
                <input
                  id="renewal-readonly-date"
                  className="create-claim-input"
                  type="date"
                  value={renewalDate}
                  readOnly
                />
                <div className="create-claim-form-note">
                  The scheduled date comes from the reminder and cannot be changed here.
                </div>
              </div>
            )}

            {isRenewalMode && form.rejectionReason && (
              <div className="create-claim-field create-claim-field-full">
                <label className="create-claim-label" htmlFor="renewal-rejection-reason">
                  Original Rejection Reason
                </label>
                <textarea
                  id="renewal-rejection-reason"
                  className="create-claim-textarea"
                  value={form.rejectionReason}
                  readOnly
                />
              </div>
            )}
          </div>

          <div className="create-claim-form-footer">
            <div className="create-claim-footer-note">
              {isRenewalMode
                ? "The existing claim and reminder are updated only after the server accepts the submission."
                : isEditing
                  ? "Your changes will be saved to the existing claim."
                  : "Only one renewal reminder option is available. Scheduling is optional."}
            </div>

            <div className="create-claim-footer-actions">
              <button
                type="button"
                className="create-claim-button create-claim-button-secondary"
                onClick={resetForm}
                disabled={saving}
              >
                {isRenewalMode
                  ? "Reset Details"
                  : isEditing
                    ? "Reset Changes"
                    : "Reset Form"}
              </button>

              <button
                type="submit"
                className="create-claim-button create-claim-button-primary"
                disabled={saving || loadingPatients}
              >
                {saving
                  ? "Saving..."
                  : isRenewalMode
                    ? "Submit Renewal"
                    : isEditing
                      ? "Save Changes"
                      : "Create Claim"}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "../../api/api";

const EXTERNAL_REFERRAL = "External Referral";
const LAST_THERAPIST_KEY = "hospital_workflow_last_therapist_id";
const CLAIMS_ENDPOINT = "rcm/claims/";

const CATEGORIES = [
  { value: "appointment", label: "Appointment" },
  { value: "walk_in", label: "Walk-in" },
  { value: "cash", label: "Cash" },
  { value: "task_without_eligibility", label: "Task Without Eligibility" },
  { value: "initial_evaluation", label: "Initial Evaluation" },
];

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getRememberedTherapistId() {
  try {
    return localStorage.getItem(LAST_THERAPIST_KEY) || "";
  } catch {
    return "";
  }
}

function normalizeRole(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getPhysicianName(physician) {
  if (typeof physician === "string") return physician.trim();
  if (!physician || typeof physician !== "object") return "";

  return String(
    physician.name ??
      physician.display_name ??
      physician.full_name ??
      physician.username ??
      ""
  ).trim();
}

function normalizePhysicianList(list) {
  const byName = new Map();

  for (const physician of Array.isArray(list) ? list : []) {
    const name = getPhysicianName(physician);
    if (!name) continue;

    const key = name.toLowerCase().trim();
    if (!byName.has(key)) byName.set(key, name);
  }

  return Array.from(byName.values()).sort((a, b) =>
    a.localeCompare(b)
  );
}

function isExternalPhysician(value) {
  const physician = String(value || "").trim().toLowerCase();

  return (
    physician === EXTERNAL_REFERRAL.toLowerCase() ||
    physician.startsWith(`${EXTERNAL_REFERRAL.toLowerCase()}:`)
  );
}

function extractPhysicianList(data) {
  if (Array.isArray(data)) return data;

  for (const key of ["physicians", "doctors", "users", "results", "data"]) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return [];
}

function getErrorMessage(error) {
  const status = error?.response?.status;
  const data = error?.response?.data;

  if (status === 401) {
    return "The physician request was unauthorized. Please sign in again and retry.";
  }

  if (status === 403) {
    return "Your account does not have permission to access the physician list.";
  }

  if (status === 404) {
    return "The physician endpoint was not found. Check the Django URL configuration and API base URL.";
  }

  if (data && typeof data === "object") {
    return (
      data.detail ||
      data.error ||
      data.message ||
      error?.message ||
      "Could not load physicians."
    );
  }

  return error?.message || "Could not load physicians.";
}

/* CLAIM HELPERS */

function extractClaims(data) {
  if (Array.isArray(data)) return data;

  for (const key of ["claims", "results", "items"]) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  if (data?.data && typeof data.data === "object") {
    return extractClaims(data.data);
  }

  return [];
}

function getPatientIdFromClaim(claim) {
  const patient =
    claim?.patient ??
    claim?.patient_details ??
    claim?.patientDetails ??
    claim?.patient_data ??
    claim?.patientData;

  const id =
    claim?.patient_id ??
    claim?.patientId ??
    patient?.id ??
    patient?.patient_id ??
    patient?.patientId;

  return id === null || id === undefined ? "" : String(id);
}

function getClaimStatusValue(claim) {
  return (
    claim?.status ??
    claim?.claim_status ??
    claim?.claimStatus ??
    claim?.approval_status ??
    claim?.approvalStatus ??
    claim?.approval_state ??
    claim?.approval?.status ??
    ""
  );
}

function normalizeApprovalStatus(value) {
  if (value === null || value === undefined) return "";

  const status = String(value)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (["approved", "approve", "accepted"].includes(status)) {
    return "approved";
  }

  if (["submitted", "submit"].includes(status)) {
    return "submitted";
  }

  if (["rejected", "reject", "denied", "declined"].includes(status)) {
    return "rejected";
  }

  if (
    ["pending", "awaiting_approval", "under_review", "in_review"].includes(
      status
    )
  ) {
    return "pending";
  }

  return "";
}

function getApprovalStatus(source) {
  if (!source || typeof source !== "object") return "";

  const candidates = [
    source.approval_status,
    source.approvalStatus,
    source.approval_state,
    source.approval?.status,
  ];

  for (const value of candidates) {
    const normalized = normalizeApprovalStatus(value);
    if (normalized) return normalized;
  }

  return "";
}

function getStatusLabel(status) {
  switch (status) {
    case "approved":
      return "Approved";
    case "submitted":
      return "Submitted";
    case "rejected":
      return "Rejected";
    case "pending":
      return "Pending";
    default:
      return "Approved";
  }
}

/* COMPONENT */

export default function PatientAssignmentForm({
  selectedPatient,
  assignmentForm = {},
  setAssignmentForm,
  therapists = [],
  physicians = [],
  onSubmit,
  onCancelEdit,
  editingAssignmentId = null,
  savingAssignment = false,
  loading = false,
  userRole = "",
  role = "",
  user = null,
  selectedAssignment = null,
}) {
  const [therapistSearch, setTherapistSearch] = useState("");
  const [therapistMenuOpen, setTherapistMenuOpen] = useState(false);

  const [fetchedPhysicians, setFetchedPhysicians] = useState([]);
  const [physiciansLoading, setPhysiciansLoading] = useState(false);
  const [physiciansError, setPhysiciansError] = useState("");
  const [physicianRetry, setPhysicianRetry] = useState(0);
  const [physiciansLoaded, setPhysiciansLoaded] = useState(false);

  const [claims, setClaims] = useState([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimsError, setClaimsError] = useState("");
  const [claimsRetry, setClaimsRetry] = useState(0);

  const isBusy = Boolean(loading || savingAssignment);

  const effectiveRole = normalizeRole(
    userRole ||
      role ||
      user?.role ||
      user?.user_role ||
      user?.user_type ||
      ""
  );

  const isAdmin = effectiveRole === "admin";
  const isEditing = Boolean(editingAssignmentId);
  const isEvaluation =
    assignmentForm.category === "initial_evaluation";

  const assignmentDate =
    assignmentForm.assignment_date || getTodayDate();

  const storedPhysician = String(
    assignmentForm.referring_physician || ""
  ).trim();

  const isExternalReferral = isExternalPhysician(storedPhysician);

  const currentPhysician = isExternalReferral
    ? EXTERNAL_REFERRAL
    : storedPhysician;

  const patientName =
    selectedPatient?.full_name ||
    selectedPatient?.name ||
    selectedPatient?.patient_name ||
    "No patient selected";

  /* LOAD CLAIMS */

  useEffect(() => {
    let cancelled = false;

    async function loadClaims() {
      setClaimsLoading(true);
      setClaimsError("");

      try {
        const response = await api.get(CLAIMS_ENDPOINT);

        if (cancelled) return;

        setClaims(extractClaims(response.data));
      } catch (error) {
        if (cancelled) return;

        console.error("Failed to fetch claims:", error);
        setClaims([]);

        setClaimsError(
          error?.response?.status === 404
            ? "Claims endpoint not found."
            : "Could not load claim status."
        );
      } finally {
        if (!cancelled) setClaimsLoading(false);
      }
    }

    if (selectedPatient?.id) {
      loadClaims();
    } else {
      setClaims([]);
      setClaimsLoading(false);
      setClaimsError("");
    }

    return () => {
      cancelled = true;
    };
  }, [selectedPatient?.id, claimsRetry]);

  const matchingClaim = useMemo(() => {
    if (!selectedPatient?.id || !Array.isArray(claims)) return null;

    const patientId = String(selectedPatient.id);

    const patientClaims = claims.filter(
      (claim) => getPatientIdFromClaim(claim) === patientId
    );

    if (!patientClaims.length) return null;

    return (
      patientClaims.find((claim) =>
        normalizeApprovalStatus(getClaimStatusValue(claim))
      ) || patientClaims[0]
    );
  }, [claims, selectedPatient?.id]);

  const approvalStatus = useMemo(
    () =>
      getApprovalStatus(selectedAssignment) ||
      getApprovalStatus(selectedPatient) ||
      getApprovalStatus(assignmentForm) ||
      normalizeApprovalStatus(getClaimStatusValue(matchingClaim)) ||
      "approved",
    [selectedAssignment, selectedPatient, assignmentForm, matchingClaim]
  );

  /* THERAPISTS */

  const therapistLabel = useCallback(
    (therapist) =>
      therapist?.display_name ||
      therapist?.full_name ||
      therapist?.name ||
      therapist?.username ||
      `Therapist ${therapist?.id ?? ""}`,
    []
  );

  const selectedTherapist = useMemo(
    () =>
      therapists.find(
        (therapist) =>
          String(therapist.id) === String(assignmentForm.therapist_id)
      ),
    [therapists, assignmentForm.therapist_id]
  );

  const selectedVisitUnderTherapist = useMemo(
    () =>
      therapists.find(
        (therapist) =>
          String(therapist.id) ===
          String(assignmentForm.visit_under_therapist_id || "")
      ),
    [therapists, assignmentForm.visit_under_therapist_id]
  );

  const additionalTherapistIds = useMemo(
    () =>
      Array.isArray(assignmentForm.additional_therapist_ids)
        ? assignmentForm.additional_therapist_ids.map(String)
        : [],
    [assignmentForm.additional_therapist_ids]
  );

  /* LOAD PHYSICIANS */

  useEffect(() => {
    if (!isEvaluation) {
      setPhysiciansLoading(false);
      setPhysiciansError("");
      return undefined;
    }

    let cancelled = false;

    async function loadPhysicians() {
      setPhysiciansLoading(true);
      setPhysiciansError("");
      setPhysiciansLoaded(false);

      try {
        const response = await api.get("users/physicians/");

        if (cancelled) return;

        const list = normalizePhysicianList(
          extractPhysicianList(response.data)
        );

        setFetchedPhysicians(list);
        setPhysiciansLoaded(true);

        if (!list.length) {
          setPhysiciansError(
            "The server returned no physicians. You can still select External Referral."
          );
        }
      } catch (error) {
        if (cancelled) return;

        console.error("Failed to fetch physicians:", error);
        setPhysiciansError(getErrorMessage(error));
      } finally {
        if (!cancelled) setPhysiciansLoading(false);
      }
    }

    loadPhysicians();

    return () => {
      cancelled = true;
    };
  }, [isEvaluation, physicianRetry]);

  const availablePhysicians = useMemo(() => {
    const parentList = normalizePhysicianList(physicians);
    const fetchedList = normalizePhysicianList(fetchedPhysicians);

    const savedPhysician =
      currentPhysician && !isExternalReferral
        ? [currentPhysician]
        : [];

    return normalizePhysicianList([
      ...parentList,
      ...fetchedList,
      ...savedPhysician,
    ]);
  }, [
    physicians,
    fetchedPhysicians,
    currentPhysician,
    isExternalReferral,
  ]);

  /* DEFAULT THERAPIST */

  useEffect(() => {
    if (
      isEditing ||
      assignmentForm.therapist_id ||
      therapists.length === 0 ||
      typeof setAssignmentForm !== "function"
    ) {
      return;
    }

    const rememberedId = getRememberedTherapistId();

    const rememberedTherapist = therapists.find(
      (therapist) => String(therapist.id) === String(rememberedId)
    );

    if (rememberedTherapist) {
      setAssignmentForm((previous) => ({
        ...previous,
        therapist_id: String(rememberedTherapist.id),
      }));
    }
  }, [
    isEditing,
    therapists,
    assignmentForm.therapist_id,
    setAssignmentForm,
  ]);

  useEffect(() => {
    if (selectedTherapist && !therapistMenuOpen) {
      setTherapistSearch(therapistLabel(selectedTherapist));
    }
  }, [selectedTherapist, therapistMenuOpen, therapistLabel]);

  /* DEFAULT DATE */

  useEffect(() => {
    if (
      !assignmentForm.assignment_date &&
      typeof setAssignmentForm === "function"
    ) {
      setAssignmentForm((previous) => ({
        ...previous,
        assignment_date: previous.assignment_date || getTodayDate(),
      }));
    }
  }, [assignmentForm.assignment_date, setAssignmentForm]);

  const filteredTherapists = useMemo(() => {
    const query = therapistSearch.trim().toLowerCase();

    return therapists.filter((therapist) =>
      therapistLabel(therapist).toLowerCase().includes(query)
    );
  }, [therapists, therapistSearch, therapistLabel]);

  /* FIELD HANDLERS */

  const updateField = (field, value) => {
    if (typeof setAssignmentForm !== "function") return;

    setAssignmentForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const chooseTherapist = (therapist) => {
    const therapistId = String(therapist.id);

    setTherapistSearch(therapistLabel(therapist));
    setTherapistMenuOpen(false);

    setAssignmentForm((previous) => ({
      ...previous,
      therapist_id: therapistId,
      additional_therapist_ids: (
        previous.additional_therapist_ids || []
      ).filter((id) => String(id) !== therapistId),
    }));

    try {
      localStorage.setItem(LAST_THERAPIST_KEY, therapistId);
    } catch {
      // Browser storage is optional.
    }
  };

  const handleCategoryChange = (event) => {
    const category = event.target.value;

    setAssignmentForm((previous) => ({
      ...previous,
      category,
      referring_physician:
        category === "initial_evaluation"
          ? previous.referring_physician || ""
          : "",
      external_referring_physician: "",
    }));

    if (category === "initial_evaluation") {
      setPhysiciansError("");
    }
  };

  const handlePhysicianChange = (event) => {
    const selectedName = String(event.target.value || "").trim();

    setAssignmentForm((previous) => ({
      ...previous,
      referring_physician: isExternalPhysician(selectedName)
        ? EXTERNAL_REFERRAL
        : selectedName,
      external_referring_physician: "",
    }));
  };

  const handleDateChange = (event) => {
    if (!isAdmin) return;
    updateField("assignment_date", event.target.value);
  };

  const retryPhysicianFetch = useCallback(() => {
    setPhysiciansError("");
    setPhysicianRetry((previous) => previous + 1);
  }, []);

  const retryClaimsFetch = useCallback(() => {
    setClaimsError("");
    setClaimsRetry((previous) => previous + 1);
  }, []);

  /* SUBMIT */

  const handleSubmit = (event) => {
    event.preventDefault();

    if (isBusy) return;

    if (!selectedPatient?.id) {
      alert("Please select a patient first.");
      return;
    }

    if (!assignmentForm.therapist_id) {
      alert("Please select a physiotherapist.");
      return;
    }

    if (!assignmentDate) {
      alert("Please select the assignment date.");
      return;
    }

    if (isAdmin && assignmentDate > getTodayDate()) {
      alert("The assignment date cannot be in the future.");
      return;
    }

    const visitNumber = Number(assignmentForm.visit_number);

    if (!Number.isInteger(visitNumber) || visitNumber < 1) {
      alert("Please enter a valid visit number.");
      return;
    }

    const physicianForSubmission = isExternalPhysician(
      assignmentForm.referring_physician
    )
      ? EXTERNAL_REFERRAL
      : String(assignmentForm.referring_physician || "").trim();

    if (isEvaluation && !physicianForSubmission) {
      alert("Please select the referring physician.");
      return;
    }

    const additionalIds = additionalTherapistIds
      .filter(
        (id) => id !== String(assignmentForm.therapist_id)
      )
      .slice(0, 1);

    const submissionForm = {
      ...assignmentForm,
      patient_id: selectedPatient.id,
      therapist_id: String(assignmentForm.therapist_id),
      category: assignmentForm.category || "appointment",
      assignment_date: assignmentDate,
      visit_number: visitNumber,

      visit_record: String(assignmentForm.visit_record || "").trim(),
      visit_under_therapist_id: assignmentForm.visit_under_therapist_id
        ? String(assignmentForm.visit_under_therapist_id)
        : "",

      referring_physician: isEvaluation
        ? physicianForSubmission
        : "",
      external_referring_physician: "",

      additional_therapist_ids: additionalIds,
      with_another_therapist: additionalIds.length > 0,
    };

    if (typeof onSubmit !== "function") {
      console.error("PatientAssignmentForm: onSubmit callback is missing.");

      alert(
        "Unable to save because the assignment submit handler is not configured."
      );

      return;
    }

    onSubmit(event, submissionForm);
  };

  const selectedCategory =
    CATEGORIES.find(
      (category) => category.value === assignmentForm.category
    )?.label || "Appointment";

  const statusClass = `status-${approvalStatus || "approved"}`;

  /* UI */

  return (
    <form
      className="pa-workspace"
      onSubmit={handleSubmit}
      onClick={(event) => {
        if (!event.target.closest("[data-therapist-autocomplete]")) {
          setTherapistMenuOpen(false);
        }
      }}
    >
      <style>{`
        .pa-workspace {
          --pa-navy: #142B4A;
          --pa-blue: #3156C8;
          --pa-indigo: #6654D9;
          --pa-teal: #078B83;
          --pa-text: #263B55;
          --pa-muted: #71829A;
          --pa-border: #D8E1EF;
          display: grid;
          grid-template-columns: minmax(0,1fr) 285px;
          gap: 20px;
          width: 100%;
          align-items: start;
          color: var(--pa-text);
          font-family: Inter, "Segoe UI", Arial, sans-serif;
          font-size: 13px;
          font-weight: 500;
        }

        .pa-workspace * {
          box-sizing: border-box;
        }

        .pa-main {
          min-width: 0;
          padding: 27px;
          background: #FFFFFF;
          border: 1px solid #DCE5F2;
          border-radius: 19px;
          box-shadow: 0 8px 30px rgba(23,43,77,.055);
        }

        .pa-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 23px;
        }

        .pa-eyebrow {
          color: #405ACB;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.4px;
          margin-bottom: 8px;
        }

        .pa-heading {
          color: var(--pa-navy);
          font-size: 25px;
          font-weight: 850;
          letter-spacing: -.7px;
          margin: 0;
        }

        .pa-subheading {
          margin: 7px 0 0;
          color: #75849A;
          font-size: 12px;
          font-weight: 500;
          line-height: 1.6;
        }

        .pa-header-icon {
          display: grid;
          place-items: center;
          width: 49px;
          height: 49px;
          border-radius: 15px;
          background: linear-gradient(135deg,#3156C8,#8069E8);
          color: white;
          font-size: 25px;
          font-weight: 800;
          flex-shrink: 0;
          box-shadow: 0 7px 18px rgba(64,87,207,.24);
        }

        .pa-patient {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 16px;
          margin-bottom: 26px;
          background: linear-gradient(110deg,#EAF0FF,#F4F6FF 65%,#E9F8F5);
          border: 1px solid #D7E2FA;
          border-radius: 14px;
          min-width: 0;
        }

        .pa-patient-avatar {
          display: grid;
          place-items: center;
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          border-radius: 13px;
          color: #3156C8;
          background: #DCE6FF;
          font-size: 21px;
          font-weight: 900;
        }

        .pa-patient-info {
          flex: 1;
          min-width: 0;
        }

        .pa-small-label {
          display: block;
          color: #64789A;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1px;
          margin-bottom: 5px;
        }

        .pa-patient-name {
          color: #172F55;
          font-size: 15px;
          font-weight: 850;
          overflow-wrap: anywhere;
        }

        .pa-patient-meta {
          color: #71829A;
          font-size: 11px;
          font-weight: 600;
          margin-top: 4px;
        }

        .pa-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border: 1px solid;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 850;
          white-space: nowrap;
        }

        .pa-badge::before {
          content: "";
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: currentColor;
        }

        .pa-badge.status-approved {
          color: #15803D;
          background: #F0FDF4;
          border-color: #BBF7D0;
        }

        .pa-badge.status-pending {
          color: #A16207;
          background: #FFFBEB;
          border-color: #FDE68A;
        }

        .pa-badge.status-submitted {
          color: #1D4ED8;
          background: #EFF6FF;
          border-color: #BFDBFE;
        }

        .pa-badge.status-rejected {
          color: #BE123C;
          background: #FFF1F2;
          border-color: #FECDD3;
        }

        .pa-section-heading {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 25px 0 18px;
        }

        .pa-section-icon {
          display: grid;
          place-items: center;
          width: 36px;
          height: 36px;
          border-radius: 11px;
          background: linear-gradient(135deg,#E8EEFF,#E8E7FF);
          color: #4057CF;
          font-size: 12px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .pa-section-title {
          color: #1D3557;
          font-size: 14px;
          font-weight: 900;
        }

        .pa-section-subtitle {
          margin-top: 4px;
          color: #8290A5;
          font-size: 11px;
          font-weight: 500;
        }

        .pa-grid {
          display: grid;
          grid-template-columns: repeat(2,minmax(0,1fr));
          gap: 15px;
        }

        .pa-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 17px;
          min-width: 0;
        }

        .pa-label {
          color: #253D5C;
          font-size: 12px;
          font-weight: 850;
          letter-spacing: .1px;
        }

        .pa-required {
          color: #E11D48;
          font-weight: 900;
        }

        .pa-input,
        .pa-select,
        .pa-textarea {
          display: block;
          width: 100%;
          min-width: 0;
          padding: 12px 13px;
          border: 1.5px solid #CDD9EB;
          border-radius: 10px;
          background: #F4F7FC;
          color: #1E3656;
          font-family: inherit;
          font-size: 13px;
          font-weight: 650;
          transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
        }

        .pa-input::placeholder,
        .pa-textarea::placeholder {
          color: #91A0B5;
          font-weight: 500;
        }

        .pa-input:hover,
        .pa-select:hover,
        .pa-textarea:hover {
          border-color: #9EAFD0;
          background: #F9FBFF;
        }

        .pa-input:focus,
        .pa-select:focus,
        .pa-textarea:focus {
          outline: none;
          border-color: #5269D5;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(64,87,207,.13);
        }

        .pa-input:disabled,
        .pa-select:disabled,
        .pa-textarea:disabled {
          opacity: .65;
          cursor: not-allowed;
        }

        .pa-locked {
          background: #EEF2F7;
          color: #64748B;
          cursor: not-allowed;
        }

        .pa-helper {
          color: #8492A7;
          font-size: 10px;
          font-weight: 550;
          line-height: 1.5;
          margin: 0;
        }

        .pa-autocomplete {
          position: relative;
          min-width: 0;
        }

        .pa-search-icon {
          position: absolute;
          right: 13px;
          top: 10px;
          color: #5269D5;
          font-size: 19px;
          pointer-events: none;
        }

        .pa-dropdown {
          position: absolute;
          z-index: 60;
          top: calc(100% + 5px);
          left: 0;
          right: 0;
          max-height: 220px;
          overflow-y: auto;
          border: 1px solid #D4DEEF;
          border-radius: 11px;
          background: white;
          box-shadow: 0 12px 30px rgba(23,43,77,.15);
        }

        .pa-option {
          display: flex;
          align-items: center;
          gap: 9px;
          width: 100%;
          padding: 11px 12px;
          border: 0;
          border-bottom: 1px solid #EDF1F7;
          background: white;
          color: #334155;
          text-align: left;
          font-family: inherit;
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
        }

        .pa-option:hover {
          background: #F0F4FF;
        }

        .pa-option-avatar {
          display: grid;
          place-items: center;
          width: 29px;
          height: 29px;
          border-radius: 9px;
          background: #E5EAFF;
          color: #4057CF;
          font-weight: 900;
        }

        .pa-option-name {
          flex: 1;
          min-width: 0;
        }

        .pa-notice {
          padding: 13px;
          border-radius: 10px;
          background: #FFFBEB;
          border: 1px solid #FDE68A;
          color: #92400E;
          font-size: 11px;
          font-weight: 650;
          margin-bottom: 15px;
        }

        .pa-error {
          padding: 12px;
          border: 1px solid #FECACA;
          background: #FEF2F2;
          border-radius: 9px;
          color: #B91C1C;
          font-size: 11px;
          font-weight: 600;
          line-height: 1.5;
        }

        .pa-retry {
          display: inline-block;
          border: 0;
          background: transparent;
          color: #4057CF;
          font-family: inherit;
          font-size: 11px;
          font-weight: 850;
          text-decoration: underline;
          cursor: pointer;
        }

        .pa-notes {
          margin-top: 7px;
          padding: 15px;
          background: #F1F5FB;
          border: 1px solid #DCE5F2;
          border-radius: 12px;
        }

        .pa-notes-title {
          color: #263D5C;
          font-size: 12px;
          font-weight: 900;
          margin-bottom: 11px;
        }

        .pa-actions {
          display: flex;
          gap: 11px;
          margin-top: 24px;
        }

        .pa-save {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 9px;
          flex: 1;
          padding: 14px 16px;
          border: 0;
          border-radius: 11px;
          background: linear-gradient(110deg,#3156C8,#6654D9);
          color: white;
          font-family: inherit;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 6px 16px rgba(64,87,207,.23);
          transition: .18s ease;
        }

        .pa-save:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 9px 20px rgba(64,87,207,.3);
        }

        .pa-save:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .pa-cancel {
          padding: 12px 16px;
          border: 1.5px solid #D3DDEB;
          border-radius: 10px;
          background: #F8FAFD;
          color: #475569;
          font-family: inherit;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .pa-sidebar {
          position: sticky;
          top: 15px;
          overflow: hidden;
          border-radius: 18px;
          background: #192D50;
          color: white;
          box-shadow: 0 12px 30px rgba(23,43,77,.15);
        }

        .pa-side-top {
          padding: 22px;
          background:
            radial-gradient(circle at 95% 5%,rgba(113,135,255,.35),transparent 42%),
            linear-gradient(145deg,#243D70,#192D50);
        }

        .pa-side-icon {
          display: grid;
          place-items: center;
          width: 40px;
          height: 40px;
          margin-bottom: 17px;
          border: 1px solid rgba(255,255,255,.17);
          border-radius: 12px;
          background: rgba(255,255,255,.1);
          color: #C7D2FE;
          font-size: 19px;
        }

        .pa-side-title {
          margin: 0;
          font-size: 18px;
          font-weight: 900;
          letter-spacing: -.3px;
        }

        .pa-side-subtitle {
          margin: 7px 0 0;
          color: #B8C6DD;
          font-size: 11px;
          font-weight: 500;
          line-height: 1.6;
        }

        .pa-side-content {
          padding: 19px 21px 21px;
        }

        .pa-summary-item {
          padding: 12px 0;
          border-bottom: 1px solid rgba(255,255,255,.11);
        }

        .pa-summary-label {
          display: block;
          color: #AABAD2;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .9px;
          margin-bottom: 6px;
        }

        .pa-summary-value {
          color: #FFFFFF;
          font-size: 12px;
          font-weight: 750;
          overflow-wrap: anywhere;
        }

        .pa-summary-muted {
          color: #AABAD2;
          font-size: 11px;
          font-weight: 500;
        }

        .pa-summary-number {
          color: #FFFFFF;
          font-size: 29px;
          font-weight: 900;
          letter-spacing: -1px;
        }

        .pa-side-footer {
          display: flex;
          gap: 8px;
          align-items: flex-start;
          padding: 12px;
          margin-top: 16px;
          border: 1px solid rgba(167,190,255,.2);
          border-radius: 9px;
          background: rgba(91,119,199,.13);
          color: #C9D5EA;
          font-size: 10px;
          font-weight: 600;
          line-height: 1.5;
        }

        .pa-footer {
          color: #9AA6B8;
          text-align: center;
          font-size: 10px;
          font-weight: 600;
          margin: 14px 0 0;
        }

        .pa-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,.4);
          border-top-color: white;
          border-radius: 50%;
          animation: paSpin .8s linear infinite;
        }

        @keyframes paSpin {
          to { transform: rotate(360deg); }
        }

        .pa-workspace button:focus-visible {
          outline: 3px solid rgba(99,102,241,.3);
          outline-offset: 2px;
        }

        @media (max-width: 900px) {
          .pa-workspace {
            grid-template-columns: minmax(0,1fr) 245px;
            gap: 13px;
          }
          .pa-main {
            padding: 19px;
          }
        }

        @media (max-width: 700px) {
          .pa-workspace {
            grid-template-columns: minmax(0,1fr);
          }
          .pa-sidebar {
            position: static;
          }
          .pa-side-content {
            display: grid;
            grid-template-columns: repeat(2,minmax(0,1fr));
            gap: 0 15px;
          }
          .pa-side-footer {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 460px) {
          .pa-grid {
            grid-template-columns: minmax(0,1fr);
            gap: 0;
          }
          .pa-main {
            padding: 15px;
          }
          .pa-header {
            align-items: flex-start;
          }
          .pa-heading {
            font-size: 21px;
          }
          .pa-patient {
            flex-wrap: wrap;
          }
          .pa-actions {
            flex-direction: column;
          }
          .pa-cancel {
            width: 100%;
          }
        }
      `}</style>

      {/* FORM */}

      <div className="pa-main">
        <div className="pa-header">
          <div>
            <div className="pa-eyebrow">
              PATIENT MANAGEMENT / WORKSPACE
            </div>

            <h2 className="pa-heading">
              {isEditing ? "Edit Assignment" : "Create Assignment"}
            </h2>

            <p className="pa-subheading">
              {isEditing
                ? "Review and update the patient assignment details."
                : "Assign the patient to the appropriate physiotherapy service."}
            </p>
          </div>

          <div className="pa-header-icon">
            {isEditing ? "✎" : "＋"}
          </div>
        </div>

        {/* PATIENT */}

        {selectedPatient ? (
          <div className="pa-patient">
            <div className="pa-patient-avatar">♙</div>

            <div className="pa-patient-info">
              <span className="pa-small-label">SELECTED PATIENT</span>

              <div className="pa-patient-name">{patientName}</div>

              {selectedPatient.patient_id && (
                <div className="pa-patient-meta">
                  File No: {selectedPatient.patient_id}
                </div>
              )}

              {claimsError && !claimsLoading && (
                <div
                  className="pa-patient-meta"
                  style={{ color: "#B91C1C" }}
                >
                  {claimsError}{" "}
                  <button
                    type="button"
                    className="pa-retry"
                    onClick={retryClaimsFetch}
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>

            <span className={`pa-badge ${statusClass}`}>
              {getStatusLabel(approvalStatus)}
            </span>
          </div>
        ) : (
          <div className="pa-notice">
            Select a patient before saving the assignment.
          </div>
        )}

        {/* ASSIGNMENT DETAILS */}

        <div className="pa-section-heading">
          <div className="pa-section-icon">01</div>
          <div>
            <div className="pa-section-title">Assignment details</div>
            <div className="pa-section-subtitle">
              Enter the assignment date and responsible therapists.
            </div>
          </div>
        </div>

        {/* DATE */}

        <div className="pa-field">
          <label className="pa-label" htmlFor="assignment_date">
            Date of Assignment <span className="pa-required">*</span>
          </label>

          <input
            id="assignment_date"
            className={`pa-input ${!isAdmin ? "pa-locked" : ""}`}
            type="date"
            value={assignmentDate}
            onChange={handleDateChange}
            required
            disabled={isBusy || !isAdmin}
            max={getTodayDate()}
            readOnly={!isAdmin}
          />

          <p className="pa-helper">
            {!isAdmin
              ? "This date is read-only."
              : "Select today or a previous assignment date."}
          </p>
        </div>

        {/* PRIMARY PHYSIOTHERAPIST */}

        <div className="pa-field">
          <label className="pa-label">
            Physiotherapist <span className="pa-required">*</span>
          </label>

          <div
            className="pa-autocomplete"
            data-therapist-autocomplete
          >
            <input
              className="pa-input"
              style={{ paddingRight: 35 }}
              type="text"
              value={
                therapistMenuOpen
                  ? therapistSearch
                  : selectedTherapist
                    ? therapistLabel(selectedTherapist)
                    : therapistSearch
              }
              onFocus={() => {
                setTherapistSearch("");
                setTherapistMenuOpen(true);
              }}
              onChange={(event) => {
                setTherapistSearch(event.target.value);
                setTherapistMenuOpen(true);
                updateField("therapist_id", "");
              }}
              placeholder="Search physiotherapist..."
              autoComplete="off"
              aria-label="Search physiotherapist"
              aria-expanded={therapistMenuOpen}
              disabled={isBusy}
            />

            <span className="pa-search-icon">⌕</span>

            {therapistMenuOpen && !isBusy && (
              <div className="pa-dropdown" role="listbox">
                {filteredTherapists.length ? (
                  filteredTherapists.map((therapist) => {
                    const selected =
                      String(therapist.id) ===
                      String(assignmentForm.therapist_id);

                    return (
                      <button
                        type="button"
                        key={therapist.id}
                        className="pa-option"
                        style={
                          selected
                            ? { background: "#EEF2FF", color: "#4338CA" }
                            : {}
                        }
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => chooseTherapist(therapist)}
                        role="option"
                        aria-selected={selected}
                      >
                        <span className="pa-option-avatar">
                          {therapistLabel(therapist)
                            .charAt(0)
                            .toUpperCase()}
                        </span>

                        <span className="pa-option-name">
                          {therapistLabel(therapist)}
                        </span>

                        {selected && <strong>✓</strong>}
                      </button>
                    );
                  })
                ) : (
                  <div className="pa-option">
                    No physiotherapists found.
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedTherapist && (
            <p className="pa-helper">
              Selected: {therapistLabel(selectedTherapist)}
            </p>
          )}
        </div>

        {/* VISIT UNDER */}

        <div className="pa-field">
          <label className="pa-label" htmlFor="visit_under_therapist">
            Visit Record
          </label>

          <select
            id="visit_under_therapist"
            className="pa-select"
            value={assignmentForm.visit_under_therapist_id || ""}
            onChange={(event) =>
              updateField(
                "visit_under_therapist_id",
                event.target.value
              )
            }
            disabled={isBusy}
          >
            <option value="">Select physiotherapist</option>

            {therapists.map((therapist) => (
              <option key={therapist.id} value={String(therapist.id)}>
                {therapistLabel(therapist)}
              </option>
            ))}
          </select>

          <p className="pa-helper">
            Select the physiotherapist under whom this visit is recorded.
          </p>
        </div>

        {/* CATEGORY AND VISIT NUMBER */}

        <div className="pa-grid">
          <div className="pa-field">
            <label className="pa-label">
              Assignment Type <span className="pa-required">*</span>
            </label>

            <select
              className="pa-select"
              value={assignmentForm.category || "appointment"}
              onChange={handleCategoryChange}
              required
              disabled={isBusy}
            >
              {CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div className="pa-field">
            <label className="pa-label">
              Visit Number <span className="pa-required">*</span>
            </label>

            <input
              className="pa-input"
              type="number"
              min="1"
              step="1"
              value={assignmentForm.visit_number ?? 1}
              onChange={(event) =>
                updateField("visit_number", event.target.value)
              }
              required
              disabled={isBusy}
            />
          </div>
        </div>

        {/* REFERRAL INFORMATION */}

        {isEvaluation && (
          <>
            <div className="pa-section-heading">
              <div className="pa-section-icon">02</div>
              <div>
                <div className="pa-section-title">
                  Referral information
                </div>
                <div className="pa-section-subtitle">
                  Select the referring physician.
                </div>
              </div>
            </div>

            <div className="pa-field">
              <label
                className="pa-label"
                htmlFor="referring_physician"
              >
                Referring Physician <span className="pa-required">*</span>
              </label>

              <select
                id="referring_physician"
                className="pa-select"
                value={currentPhysician}
                onChange={handlePhysicianChange}
                required
                disabled={isBusy}
              >
                <option value="">Select physician</option>

                {availablePhysicians.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}

                <option value={EXTERNAL_REFERRAL}>
                  {EXTERNAL_REFERRAL}
                </option>
              </select>

              {physiciansLoading && (
                <p className="pa-helper">Loading physicians...</p>
              )}

              {!physiciansLoading && physiciansError && (
                <div className="pa-error" role="alert">
                  {physiciansError}
                  <br />
                  <button
                    type="button"
                    className="pa-retry"
                    onClick={retryPhysicianFetch}
                    disabled={isBusy}
                  >
                    Retry loading physicians
                  </button>
                </div>
              )}

              {!physiciansLoading &&
                !physiciansError &&
                physiciansLoaded &&
                availablePhysicians.length > 0 && (
                  <p className="pa-helper" style={{ color: "#15803D" }}>
                    {availablePhysicians.length} physician option(s) available.
                  </p>
                )}
            </div>
          </>
        )}

        {/* NOTES */}

        <div className="pa-notes">
          <div className="pa-notes-title">
            Additional Notes · Optional
          </div>

          <div className="pa-field" style={{ marginBottom: 0 }}>
            <textarea
              className="pa-textarea"
              value={assignmentForm.notes || ""}
              onChange={(event) =>
                updateField("notes", event.target.value)
              }
              placeholder="Add any additional assignment notes..."
              rows={3}
              disabled={isBusy}
            />
          </div>
        </div>

        {/* ACTIONS */}

        <div className="pa-actions">
          <button
            type="submit"
            className="pa-save"
            disabled={isBusy || !selectedPatient?.id}
          >
            {isBusy ? (
              <>
                <span className="pa-spinner" />
                {isEditing ? "Updating..." : "Saving..."}
              </>
            ) : (
              <>
                {isEditing ? "Update Assignment" : "Save Assignment"}
                <span>→</span>
              </>
            )}
          </button>

          {isEditing && typeof onCancelEdit === "function" && (
            <button
              type="button"
              className="pa-cancel"
              onClick={onCancelEdit}
              disabled={isBusy}
            >
              Cancel
            </button>
          )}
        </div>

        <p className="pa-footer">
          Please verify the assignment details before saving.
        </p>
      </div>

      {/* RIGHT SIDE: LIVE SUMMARY */}

      <aside className="pa-sidebar">
        <div className="pa-side-top">
          <div className="pa-side-icon">✦</div>

          <h3 className="pa-side-title">Assignment Summary</h3>

          <p className="pa-side-subtitle">
            Review the selected patient and assignment information.
          </p>
        </div>

        <div className="pa-side-content">
          <div className="pa-summary-item">
            <span className="pa-summary-label">PATIENT</span>
            <div className="pa-summary-value">
              {selectedPatient ? patientName : "Not selected"}
            </div>

            {selectedPatient?.patient_id && (
              <div
                className="pa-summary-muted"
                style={{ marginTop: 4 }}
              >
                File No: {selectedPatient.patient_id}
              </div>
            )}
          </div>

          <div className="pa-summary-item">
            <span className="pa-summary-label">APPROVAL STATUS</span>
            <span className={`pa-badge ${statusClass}`}>
              {getStatusLabel(approvalStatus)}
            </span>
          </div>

          <div className="pa-summary-item">
            <span className="pa-summary-label">ASSIGNMENT TYPE</span>
            <div className="pa-summary-value">
              {selectedCategory}
            </div>
          </div>

          <div className="pa-summary-item">
            <span className="pa-summary-label">VISIT NUMBER</span>
            <div className="pa-summary-number">
              {assignmentForm.visit_number || "1"}
            </div>
          </div>

          <div className="pa-summary-item">
            <span className="pa-summary-label">PHYSIOTHERAPIST</span>
            <div className="pa-summary-value">
              {selectedTherapist
                ? therapistLabel(selectedTherapist)
                : "Not selected"}
            </div>
          </div>

          <div className="pa-summary-item">
            <span className="pa-summary-label">VISIT UNDER</span>
            <div className="pa-summary-value">
              {selectedVisitUnderTherapist
                ? therapistLabel(selectedVisitUnderTherapist)
                : "Not selected"}
            </div>
          </div>

          <div className="pa-summary-item">
            <span className="pa-summary-label">ASSIGNMENT DATE</span>
            <div className="pa-summary-value">{assignmentDate}</div>
          </div>

          {isEvaluation && (
            <div className="pa-summary-item">
              <span className="pa-summary-label">
                REFERRING PHYSICIAN
              </span>
              <div className="pa-summary-value">
                {currentPhysician || "Not selected"}
              </div>
            </div>
          )}

          <div className="pa-side-footer">
            <span>🔒</span>
            <span>
              Assignment date access is controlled by user role.
            </span>
          </div>
        </div>
      </aside>
    </form>
  );
}
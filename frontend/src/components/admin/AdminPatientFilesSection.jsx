
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../../api/api";

const C = {
  navy: "#153866",
  primary: "#2875ee",
  text: "#334155",
  muted: "#7186a5",
  border: "#e1eaf5",
  green: "#07876e",
  greenBg: "#ddf7ee",
  orange: "#c2410c",
  orangeBg: "#fff4e8",
  red: "#e23c50",
  redBg: "#fff1f2",
  blueBg: "#e3f0ff",
  purple: "#7044d6",
  white: "#ffffff",
};

const styles = {
  page: {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    padding: "clamp(8px, 2vw, 20px)",
    borderRadius: 20,
    color: C.navy,
    background:
      "radial-gradient(circle at 0% 0%, #e0f2fe 0, transparent 28%), radial-gradient(circle at 100% 100%, #dbeafe 0, transparent 30%), #f4f8fd",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  shell: {
    width: "100%",
    maxWidth: 1600,
    margin: "0 auto",
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: "0 16px 42px rgba(24,64,116,.10)",
  },
  hero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 20,
    padding: "clamp(23px, 3.5vw, 36px)",
    color: C.white,
    background:
      "linear-gradient(120deg,#153e75 0%,#20579c 55%,#174578 100%)",
  },
  heroContent: {
    display: "flex",
    alignItems: "flex-start",
    gap: 18,
    flex: "1 1 400px",
    minWidth: 0,
  },
  heroIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: 58,
    height: 58,
    borderRadius: 16,
    background: "rgba(255,255,255,.12)",
    border: "1px solid rgba(255,255,255,.3)",
    fontSize: 28,
  },
  eyebrow: {
    display: "inline-block",
    marginBottom: 9,
    color: "#c7e5ff",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: ".15em",
  },
  title: {
    margin: 0,
    fontSize: "clamp(24px,3vw,34px)",
    lineHeight: 1.2,
    fontWeight: 800,
    color: C.white,
  },
  heroDescription: {
    maxWidth: 650,
    margin: "10px 0 0",
    color: "#e2efff",
    fontSize: 13,
    lineHeight: 1.8,
  },
  heroActions: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  heroBadge: {
    padding: "10px 14px",
    borderRadius: 30,
    background: "#0eaa87",
    color: C.white,
    fontSize: 12,
    fontWeight: 800,
  },
  content: {
    display: "grid",
    gap: 22,
    padding: "clamp(15px,2.8vw,28px)",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
    gap: 15,
  },
  summaryCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: "19px 18px",
    minWidth: 0,
  },
  summaryIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: 47,
    height: 47,
    borderRadius: 14,
    fontSize: 22,
    fontWeight: 800,
  },
  summaryLabel: {
    color: C.muted,
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 6,
  },
  summaryValue: {
    color: C.navy,
    fontSize: 27,
    lineHeight: 1.1,
    fontWeight: 850,
  },
  card: {
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 17,
    padding: "clamp(16px,2.5vw,25px)",
    minWidth: 0,
    boxShadow: "0 4px 15px rgba(15,52,94,.035)",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 15,
  },
  sectionHeading: {
    display: "flex",
    alignItems: "center",
    gap: 13,
    minWidth: 0,
  },
  sectionIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: 47,
    height: 47,
    borderRadius: 14,
    background: "#e3f0ff",
    color: C.primary,
    fontSize: 22,
  },
  sectionTitle: {
    margin: 0,
    color: C.navy,
    fontSize: 19,
    fontWeight: 800,
  },
  subtitle: {
    margin: "6px 0 0",
    color: C.muted,
    fontSize: 12,
    lineHeight: 1.7,
  },
  toolbar: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
    margin: "23px 0 18px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #c6d7ee",
    borderRadius: 11,
    padding: "12px 14px",
    fontSize: 13,
    lineHeight: 1.5,
    color: C.navy,
    background: C.white,
    minHeight: 46,
    fontFamily: "inherit",
  },
  search: { flex: "1 1 280px", minWidth: 160 },
  filter: { flex: "0 1 190px", minWidth: 150 },
  tableWrap: {
    width: "100%",
    overflowX: "auto",
    border: `1px solid ${C.border}`,
    borderRadius: 13,
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    minWidth: 900,
    textAlign: "left",
  },
  th: {
    padding: 15,
    fontSize: 10,
    fontWeight: 800,
    color: "#617796",
    background: "#f0f6fd",
    borderBottom: `1px solid ${C.border}`,
    textTransform: "uppercase",
    letterSpacing: ".07em",
    whiteSpace: "nowrap",
  },
  td: {
    padding: 15,
    fontSize: 12,
    borderBottom: "1px solid #edf2f8",
    verticalAlign: "middle",
    color: C.text,
  },
  patientName: {
    color: C.navy,
    fontSize: 13,
    fontWeight: 800,
  },
  fileNumber: {
    display: "inline-flex",
    padding: "5px 9px",
    borderRadius: 7,
    background: "#f0f6fd",
    color: "#315a88",
    fontSize: 12,
    fontWeight: 750,
  },
  button: {
    border: "1px solid #d4e0ef",
    background: C.white,
    color: "#315071",
    borderRadius: 10,
    padding: "10px 13px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 750,
    fontFamily: "inherit",
  },
  primaryButton: {
    border: "1px solid #2875ee",
    background: "linear-gradient(135deg,#2875ee,#4053d6)",
    color: C.white,
    borderRadius: 11,
    padding: "12px 18px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 800,
    fontFamily: "inherit",
  },
  dangerButton: {
    border: "1px solid #fecdd3",
    background: C.redBg,
    color: C.red,
    borderRadius: 10,
    padding: "10px 13px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 750,
    fontFamily: "inherit",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
    padding: "7px 11px",
    fontSize: 11,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  message: {
    borderRadius: 12,
    padding: "13px 16px",
    fontSize: 13,
    lineHeight: 1.6,
  },
  empty: {
    padding: 45,
    textAlign: "center",
    color: C.muted,
    fontSize: 13,
    lineHeight: 1.7,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(min(100%,230px),1fr))",
    gap: 20,
    marginTop: 26,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 9,
    minWidth: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: 800,
    color: "#315071",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
    marginTop: 25,
    paddingTop: 20,
    borderTop: `1px solid ${C.border}`,
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(min(100%,220px),1fr))",
    gap: 15,
    marginTop: 24,
  },
  detailItem: {
    padding: 17,
    background: "#f7faff",
    border: "1px solid #e5edf8",
    borderRadius: 13,
    minWidth: 0,
  },
  detailLabel: {
    color: C.muted,
    fontSize: 11,
    fontWeight: 750,
    marginBottom: 8,
  },
  detailValue: {
    color: C.navy,
    fontSize: 14,
    fontWeight: 750,
    overflowWrap: "anywhere",
  },
  bottomBar: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 11,
    padding: "15px 19px",
    borderRadius: 13,
    border: "1px solid #d5f1eb",
    background: "linear-gradient(110deg,#f0fbf8,#f2fafb)",
    color: "#276c79",
    fontSize: 12,
    fontWeight: 750,
  },
  menuWrap: {
    position: "relative",
    display: "inline-block",
  },
  menuButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    minWidth: 112,
    border: "1px solid #c7d9f2",
    borderRadius: 10,
    padding: "10px 12px",
    background: C.white,
    color: C.navy,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 800,
    fontFamily: "inherit",
  },
  menu: {
    position: "absolute",
    zIndex: 20,
    right: 0,
    top: "calc(100% + 7px)",
    width: 220,
    padding: 6,
    border: "1px solid #dce6f3",
    borderRadius: 13,
    background: C.white,
    boxShadow: "0 15px 35px rgba(21,56,102,.18)",
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    boxSizing: "border-box",
    border: 0,
    borderRadius: 8,
    padding: "11px 10px",
    background: C.white,
    color: C.navy,
    cursor: "pointer",
    textAlign: "left",
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "inherit",
  },
  menuDivider: {
    height: 1,
    background: "#e9eff7",
    margin: "5px 3px",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    background: "rgba(15,35,65,.48)",
    backdropFilter: "blur(3px)",
  },
  modal: {
    width: "100%",
    maxWidth: 460,
    maxHeight: "90vh",
    overflowY: "auto",
    boxSizing: "border-box",
    padding: 25,
    borderRadius: 19,
    background: C.white,
    boxShadow: "0 25px 80px rgba(15,35,65,.28)",
  },
  modalIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
    borderRadius: 14,
    marginBottom: 17,
    fontSize: 22,
  },
};

const getPatientName = (p) =>
  p?.name || p?.full_name || p?.patient_name || "";

const getFileNumber = (p) =>
  p?.patient_id ?? p?.file_number ?? p?.file_no ?? "";

const getInsurance = (p) =>
  p?.insurance_provider ?? p?.insurance ?? "";

const getGender = (p) => p?.gender || "";

const isArchived = (p) =>
  Boolean(p?.is_archived ?? p?.archived ?? false);

const getPatientFromResponse = (data) =>
  data?.patient || data?.data?.patient || data?.data || data;

const getErrorMessage = (err, fallback) => {
  const data = err?.response?.data;

  if (typeof data === "string" && data.trim()) return data;
  if (data?.detail) return data.detail;
  if (data?.error) return data.error;
  if (data?.message) return data.message;

  if (data && typeof data === "object") {
    const messages = Object.entries(data)
      .map(([key, value]) => {
        const valueText = Array.isArray(value)
          ? value.join(", ")
          : typeof value === "string"
            ? value
            : JSON.stringify(value);

        return `${key}: ${valueText}`;
      })
      .filter(Boolean);

    if (messages.length) return messages.join(" | ");
  }

  return fallback;
};

function StatusBadge({ archived }) {
  return (
    <span
      style={{
        ...styles.badge,
        background: archived ? C.orangeBg : C.greenBg,
        color: archived ? C.orange : C.green,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: archived ? C.orange : C.green,
          marginRight: 7,
        }}
      />
      {archived ? "Archived" : "Active"}
    </span>
  );
}

function GenderBadge({ gender }) {
  if (!gender) {
    return <span style={{ color: "#94a3b8" }}>Not specified</span>;
  }

  return (
    <span
      style={{
        ...styles.badge,
        background: C.blueBg,
        color: "#2058d3",
      }}
    >
      {gender}
    </span>
  );
}

function SummaryCard({ label, value, accent, icon, iconBg }) {
  return (
    <div style={styles.summaryCard}>
      <div
        style={{
          ...styles.summaryIcon,
          background: iconBg,
          color: accent,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={styles.summaryLabel}>{label}</div>
        <div style={{ ...styles.summaryValue, color: accent }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ icon, title, subtitle }) {
  return (
    <div style={styles.sectionHeading}>
      <div style={styles.sectionIcon}>{icon}</div>
      <div>
        <h3 style={styles.sectionTitle}>{title}</h3>
        {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
      </div>
    </div>
  );
}

function DetailItem({ label, children }) {
  return (
    <div style={styles.detailItem}>
      <div style={styles.detailLabel}>{label}</div>
      <div style={styles.detailValue}>{children || "—"}</div>
    </div>
  );
}

export default function AdminPatientFilesSection() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [view, setView] = useState("table");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [deleteFileNumber, setDeleteFileNumber] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    patient_id: "",
    insurance_provider: "",
    gender: "",
  });

  const fetchPatients = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) {
      setLoading(true);
      setError("");
    }

    try {
      const response = await api.get("patients/?include_archived=true");
      const data = response.data;

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.patients)
          ? data.patients
          : Array.isArray(data?.results)
            ? data.results
            : Array.isArray(data?.data)
              ? data.data
              : [];

      setPatients(list);
      return list;
    } catch (err) {
      console.error(
        "Failed to load patient files:",
        err?.response?.data || err
      );

      if (!quiet) {
        setError(
          getErrorMessage(
            err,
            "Failed to load patient files. Please try again."
          )
        );
      }

      return null;
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;

      if (confirmation && !actionLoading) {
        setConfirmation(null);
        setDeleteFileNumber("");
      } else if (!confirmation) {
        setOpenMenuId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () =>
      window.removeEventListener("keydown", handleKeyDown);
  }, [confirmation, actionLoading]);

  const activeCount = useMemo(
    () => patients.filter((p) => !isArchived(p)).length,
    [patients]
  );

  const archivedCount = useMemo(
    () => patients.filter(isArchived).length,
    [patients]
  );

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();

    return patients.filter((patient) => {
      const archived = isArchived(patient);

      if (statusFilter === "active" && archived) return false;
      if (statusFilter === "archived" && !archived) return false;
      if (!query) return true;

      return [
        getPatientName(patient),
        getFileNumber(patient),
        getInsurance(patient),
        getGender(patient),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [patients, search, statusFilter]);

  const resetMessages = () => {
    setError("");
    setMessage("");
  };

  const returnToTable = () => {
    setView("table");
    setSelectedPatient(null);
    setEditingPatient(null);
    setFormData({
      name: "",
      patient_id: "",
      insurance_provider: "",
      gender: "",
    });
  };

  const handleViewPatient = (patient) => {
    resetMessages();
    setOpenMenuId(null);
    setSelectedPatient(patient);
    setEditingPatient(null);
    setView("details");
  };

  const handleEditPatient = (patient) => {
    resetMessages();
    setOpenMenuId(null);
    setSelectedPatient(null);
    setEditingPatient(patient);
    setFormData({
      name: getPatientName(patient),
      patient_id: String(getFileNumber(patient)),
      insurance_provider: getInsurance(patient),
      gender: getGender(patient),
    });
    setView("edit");
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const requestConfirmation = (type, patient) => {
    setOpenMenuId(null);
    resetMessages();
    setDeleteFileNumber("");

    setConfirmation({
      type,
      patient,
    });
  };

  const handleSavePatient = async (event) => {
    event.preventDefault();

    if (!editingPatient?.id || saving) return;

    const name = String(formData.name || "").trim();
    const patientId = String(formData.patient_id || "").trim();
    const insurance = String(
      formData.insurance_provider || ""
    ).trim();
    const gender = String(formData.gender || "").trim();

    if (!name || !patientId) {
      setError("Patient Name and File Number are required.");
      setMessage("");
      return;
    }

    setSaving(true);
    resetMessages();

    const payload = {
      name,
      patient_id: patientId,
      insurance_provider: insurance,
      gender,
    };

    try {
      const response = await api.put(
        `patients/${editingPatient.id}/`,
        payload
      );

      const responsePatient = getPatientFromResponse(response.data);

      const updatedPatient = {
        ...editingPatient,
        ...(responsePatient &&
        typeof responsePatient === "object"
          ? responsePatient
          : {}),
        ...payload,
        id: editingPatient.id,
      };

      setPatients((previous) =>
        previous.map((patient) =>
          String(patient.id) === String(editingPatient.id)
            ? { ...patient, ...updatedPatient }
            : patient
        )
      );

      returnToTable();
      setMessage("Patient file updated successfully.");

      await fetchPatients({ quiet: true });
    } catch (err) {
      console.error(
        "Failed to update patient file:",
        err?.response?.data || err
      );

      setError(
        getErrorMessage(
          err,
          "Failed to update patient file. Please try again."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const executeConfirmedAction = async () => {
    if (!confirmation || actionLoading) return;

    const { type, patient } = confirmation;

    if (!patient?.id) {
      setError("Unable to identify this patient record.");
      setConfirmation(null);
      return;
    }

    if (type === "delete") {
      const enteredFileNumber = String(deleteFileNumber).trim();
      const expectedFileNumber = String(getFileNumber(patient)).trim();

      if (!enteredFileNumber) {
        setError(
          "Enter the patient's exact file number to confirm deletion."
        );
        return;
      }

      if (enteredFileNumber !== expectedFileNumber) {
        setError(
          "The file number does not match. Enter the exact file number shown for this patient."
        );
        return;
      }
    }

    setActionLoading(true);
    resetMessages();

    try {
      if (type === "archive" || type === "restore") {
        const nextArchived = type === "archive";

        const response = await api.post(`patients/${patient.id}/`, {
          action: nextArchived ? "archive" : "restore",
        });

        const responsePatient = getPatientFromResponse(response.data);

        setPatients((previous) =>
          previous.map((item) =>
            String(item.id) === String(patient.id)
              ? {
                  ...item,
                  ...(responsePatient &&
                  typeof responsePatient === "object"
                    ? responsePatient
                    : {}),
                  is_archived: nextArchived,
                  archived: nextArchived,
                }
              : item
          )
        );

        setMessage(
          nextArchived
            ? "Patient file archived successfully."
            : "Patient file restored successfully."
        );
      } else if (type === "delete") {
        // Preserve the backend's exact-file-number confirmation.
        await api.delete(`patients/${patient.id}/`, {
          data: {
            confirm: String(deleteFileNumber).trim(),
          },
        });

        setPatients((previous) =>
          previous.filter(
            (item) => String(item.id) !== String(patient.id)
          )
        );

        if (
          selectedPatient &&
          String(selectedPatient.id) === String(patient.id)
        ) {
          returnToTable();
        }

        setMessage("Patient file deleted successfully.");
      }

      setConfirmation(null);
      setDeleteFileNumber("");

      // Refresh only after the backend confirms the action.
      await fetchPatients({ quiet: true });
    } catch (err) {
      console.error(
        `Failed to ${type} patient:`,
        err?.response?.data || err
      );

      setError(
        getErrorMessage(
          err,
          type === "delete"
            ? "The backend rejected deletion. Check linked records and the server response."
            : `Failed to ${type} patient. Please check the backend response.`
        )
      );
    } finally {
      setActionLoading(false);
    }
  };

  const confirmationDetails = useMemo(() => {
    if (!confirmation) return null;

    const { type, patient } = confirmation;
    const name = getPatientName(patient) || "Unnamed patient";

    if (type === "archive") {
      return {
        title: "Archive patient?",
        description:
          `Archive ${name}? This retains the record if the backend supports archiving.`,
        confirmLabel: "Archive patient",
        color: C.orange,
        background: C.orangeBg,
        icon: "▣",
      };
    }

    if (type === "restore") {
      return {
        title: "Restore patient?",
        description: `Restore ${name} to the active patient list?`,
        confirmLabel: "Restore patient",
        color: C.green,
        background: C.greenBg,
        icon: "✓",
      };
    }

    return {
      title: "Delete patient?",
      description:
        `To permanently delete ${name}, enter the exact file number shown below. This action cannot normally be undone.`,
      confirmLabel: "Delete permanently",
      color: C.red,
      background: C.redBg,
      icon: "!",
    };
  }, [confirmation]);

  const menuItemStyle = (color = C.navy) => ({
    ...styles.menuItem,
    color,
  });

  return (
    <section style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.hero}>
          <div style={styles.heroContent}>
            <div style={styles.heroIcon} aria-hidden="true">
              <svg
                viewBox="0 0 48 48"
                width="36"
                height="36"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="19" cy="13" r="8" />
                <path d="M5 39v-3c0-7 6-12 14-12" />
                <path d="M34 23v18M25 32h18" />
              </svg>
            </div>

            <div style={{ minWidth: 0 }}>
              <span style={styles.eyebrow}>ADMINISTRATION TEAM</span>
              <h2 style={styles.title}>Patient Management</h2>
              <p style={styles.heroDescription}>
                Manage patient files, review registration details,
                and keep patient information accurate and organized.
              </p>
            </div>
          </div>

          <div style={styles.heroActions}>
            <span style={styles.heroBadge}>＋ Patient Files</span>
            <button
              type="button"
              style={{
                ...styles.button,
                background: "rgba(255,255,255,.10)",
                color: C.white,
                borderColor: "rgba(255,255,255,.35)",
              }}
              onClick={() => {
                resetMessages();
                fetchPatients();
              }}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>
          </div>
        </header>

        <div style={styles.content}>
          {error && (
            <div
              role="alert"
              style={{
                ...styles.message,
                background: C.redBg,
                color: C.red,
                border: "1px solid #fecdd3",
              }}
            >
              <strong>Action failed:</strong> {error}
            </div>
          )}

          {message && (
            <div
              role="status"
              style={{
                ...styles.message,
                background: C.greenBg,
                color: C.green,
                border: "1px solid #a7f3d0",
              }}
            >
              ✓ {message}
            </div>
          )}

          {view === "table" && (
            <>
              <div style={styles.summaryGrid}>
                <SummaryCard
                  label="Total Patients"
                  value={patients.length}
                  accent={C.primary}
                  icon="▤"
                  iconBg="#e3f0ff"
                />
                <SummaryCard
                  label="Active Patients"
                  value={activeCount}
                  accent={C.green}
                  icon="✓"
                  iconBg={C.greenBg}
                />
                <SummaryCard
                  label="Archived Patients"
                  value={archivedCount}
                  accent={C.orange}
                  icon="▣"
                  iconBg={C.orangeBg}
                />
              </div>

              <div style={styles.card}>
                <div style={styles.sectionHeader}>
                  <SectionHeading
                    icon="▤"
                    title="Patient Files"
                    subtitle="Search, view, edit, archive, or restore patient records."
                  />
                  <span
                    style={{
                      ...styles.badge,
                      background: C.blueBg,
                      color: "#2058d3",
                    }}
                  >
                    {filteredPatients.length} records
                  </span>
                </div>

                <div style={styles.toolbar}>
                  <input
                    type="search"
                    aria-label="Search patients"
                    placeholder="⌕  Search name, file number, insurance, gender..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    style={{ ...styles.input, ...styles.search }}
                  />

                  <select
                    aria-label="Filter patient status"
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value)
                    }
                    style={{ ...styles.input, ...styles.filter }}
                  >
                    <option value="all">All patients</option>
                    <option value="active">Active only</option>
                    <option value="archived">Archived only</option>
                  </select>
                </div>

                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Patient Name</th>
                        <th style={styles.th}>File Number</th>
                        <th style={styles.th}>Insurance</th>
                        <th style={styles.th}>Gender</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={6} style={styles.empty}>
                            Loading patient files...
                          </td>
                        </tr>
                      ) : filteredPatients.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={styles.empty}>
                            <div style={{ fontSize: 30, marginBottom: 10 }}>
                              ◌
                            </div>
                            <strong style={{ color: C.navy }}>
                              No patient files found
                            </strong>
                            <p>
                              Try another search term or change the status filter.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredPatients.map((patient) => {
                          const archived = isArchived(patient);
                          const patientName =
                            getPatientName(patient) || "Unnamed patient";

                          return (
                            <tr key={patient.id}>
                              <td style={styles.td}>
                                <button
                                  type="button"
                                  onClick={() => handleViewPatient(patient)}
                                  style={{
                                    ...styles.patientName,
                                    border: 0,
                                    padding: 0,
                                    background: "transparent",
                                    cursor: "pointer",
                                    textAlign: "left",
                                    fontFamily: "inherit",
                                  }}
                                >
                                  {patientName}
                                </button>
                              </td>

                              <td style={styles.td}>
                                <span style={styles.fileNumber}>
                                  {getFileNumber(patient) || "—"}
                                </span>
                              </td>

                              <td style={styles.td}>
                                {getInsurance(patient) || "—"}
                              </td>

                              <td style={styles.td}>
                                <GenderBadge gender={getGender(patient)} />
                              </td>

                              <td style={styles.td}>
                                <StatusBadge archived={archived} />
                              </td>

                              <td style={styles.td}>
                                <div style={styles.menuWrap}>
                                  <button
                                    type="button"
                                    aria-haspopup="menu"
                                    aria-expanded={
                                      String(openMenuId) ===
                                      String(patient.id)
                                    }
                                    aria-label={`Open actions for ${patientName}`}
                                    style={styles.menuButton}
                                    disabled={actionLoading || saving}
                                    onClick={() => {
                                      resetMessages();
                                      setOpenMenuId((current) =>
                                        String(current) ===
                                        String(patient.id)
                                          ? null
                                          : patient.id
                                      );
                                    }}
                                  >
                                    <span>Actions</span>
                                    <span aria-hidden="true">⋮</span>
                                  </button>

                                  {String(openMenuId) ===
                                    String(patient.id) && (
                                    <div role="menu" style={styles.menu}>
                                      <button
                                        type="button"
                                        role="menuitem"
                                        style={menuItemStyle()}
                                        onClick={() =>
                                          handleViewPatient(patient)
                                        }
                                      >
                                        <span>◉</span>
                                        <span>View details</span>
                                      </button>

                                      <button
                                        type="button"
                                        role="menuitem"
                                        style={menuItemStyle("#2875ee")}
                                        onClick={() =>
                                          handleEditPatient(patient)
                                        }
                                      >
                                        <span>✎</span>
                                        <span>Edit patient</span>
                                      </button>

                                      <div style={styles.menuDivider} />

                                      <button
                                        type="button"
                                        role="menuitem"
                                        style={menuItemStyle(
                                          archived ? C.green : C.orange
                                        )}
                                        onClick={() =>
                                          requestConfirmation(
                                            archived ? "restore" : "archive",
                                            patient
                                          )
                                        }
                                      >
                                        <span>{archived ? "↻" : "▣"}</span>
                                        <span>
                                          {archived
                                            ? "Restore patient"
                                            : "Archive patient"}
                                        </span>
                                      </button>

                                      <div style={styles.menuDivider} />

                                      <button
                                        type="button"
                                        role="menuitem"
                                        style={menuItemStyle(C.red)}
                                        onClick={() =>
                                          requestConfirmation("delete", patient)
                                        }
                                      >
                                        <span>⌫</span>
                                        <span>Delete patient</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 10,
                    marginTop: 16,
                    color: C.muted,
                    fontSize: 11,
                  }}
                >
                  <span>
                    Showing {filteredPatients.length} of {patients.length} patient files
                  </span>
                  <span>Patient information management</span>
                </div>
              </div>
            </>
          )}

          {view === "edit" && editingPatient && (
            <div style={styles.card}>
              <div style={styles.sectionHeader}>
                <SectionHeading
                  icon="✎"
                  title="Edit Patient"
                  subtitle="Update patient information and save your changes."
                />
                <StatusBadge archived={isArchived(editingPatient)} />
              </div>

              <form onSubmit={handleSavePatient}>
                <div style={styles.formGrid}>
                  <div style={styles.field}>
                    <label style={styles.label} htmlFor="edit-patient-name">
                      Patient Name *
                    </label>
                    <input
                      id="edit-patient-name"
                      name="name"
                      type="text"
                      autoComplete="off"
                      value={formData.name}
                      onChange={handleInputChange}
                      style={styles.input}
                      required
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label} htmlFor="edit-file-number">
                      File Number *
                    </label>
                    <input
                      id="edit-file-number"
                      name="patient_id"
                      type="text"
                      autoComplete="off"
                      value={formData.patient_id}
                      onChange={handleInputChange}
                      style={styles.input}
                      required
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label} htmlFor="edit-insurance">
                      Insurance Provider
                    </label>
                    <input
                      id="edit-insurance"
                      name="insurance_provider"
                      type="text"
                      autoComplete="off"
                      value={formData.insurance_provider}
                      onChange={handleInputChange}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label} htmlFor="edit-gender">
                      Gender
                    </label>
                    <select
                      id="edit-gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      style={styles.input}
                    >
                      <option value="">Select gender</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={styles.actions}>
                  <button
                    type="submit"
                    style={{
                      ...styles.primaryButton,
                      opacity: saving ? 0.7 : 1,
                      cursor: saving ? "wait" : "pointer",
                    }}
                    disabled={saving}
                  >
                    {saving ? "Saving changes..." : "✓ Save Changes"}
                  </button>

                  <button
                    type="button"
                    style={styles.button}
                    onClick={() => {
                      resetMessages();
                      returnToTable();
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {view === "details" && selectedPatient && (
            <div style={styles.card}>
              <div style={styles.sectionHeader}>
                <SectionHeading
                  icon="▤"
                  title="Patient Details"
                  subtitle="Review the patient file information."
                />
                <StatusBadge archived={isArchived(selectedPatient)} />
              </div>

              <div style={styles.detailGrid}>
                <DetailItem label="Patient Name">
                  {getPatientName(selectedPatient)}
                </DetailItem>
                <DetailItem label="File Number">
                  {getFileNumber(selectedPatient)}
                </DetailItem>
                <DetailItem label="Insurance Provider">
                  {getInsurance(selectedPatient)}
                </DetailItem>
                <DetailItem label="Gender">
                  <GenderBadge gender={getGender(selectedPatient)} />
                </DetailItem>
                <DetailItem label="Patient Status">
                  <StatusBadge archived={isArchived(selectedPatient)} />
                </DetailItem>
              </div>

              <div style={styles.actions}>
                <button
                  type="button"
                  style={styles.primaryButton}
                  onClick={() => handleEditPatient(selectedPatient)}
                >
                  ✎ Edit Patient
                </button>

                <button
                  type="button"
                  style={styles.button}
                  onClick={() => {
                    resetMessages();
                    returnToTable();
                  }}
                >
                  ← Back to Patients
                </button>
              </div>
            </div>
          )}

          <div style={styles.bottomBar}>
            <span style={{ fontSize: 19, color: C.green }}>✓</span>
            <span>Patient File Management</span>
            <span>•</span>
            <span>Administration Dashboard</span>
          </div>
        </div>
      </div>

      {confirmation && confirmationDetails && (
        <div
          style={styles.overlay}
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !actionLoading
            ) {
              setConfirmation(null);
              setDeleteFileNumber("");
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="patient-action-title"
            aria-describedby="patient-action-description"
            style={styles.modal}
          >
            <div
              style={{
                ...styles.modalIcon,
                color: confirmationDetails.color,
                background: confirmationDetails.background,
              }}
            >
              {confirmationDetails.icon}
            </div>

            <h3
              id="patient-action-title"
              style={{
                margin: "0 0 10px",
                color: C.navy,
                fontSize: 21,
                fontWeight: 850,
              }}
            >
              {confirmationDetails.title}
            </h3>

            <p
              id="patient-action-description"
              style={{
                margin: "0 0 22px",
                color: "#5b6f89",
                fontSize: 13,
                lineHeight: 1.8,
                overflowWrap: "anywhere",
              }}
            >
              {confirmationDetails.description}
            </p>

            {confirmation.type === "delete" && (
              <>
                <div
                  style={{
                    padding: 12,
                    marginBottom: 15,
                    borderRadius: 10,
                    background: C.redBg,
                    color: "#9f2535",
                    fontSize: 12,
                    lineHeight: 1.6,
                  }}
                >
                  <strong>Patient file number:</strong>{" "}
                  {String(getFileNumber(confirmation.patient) || "—")}
                  <p style={{ margin: "8px 0 0" }}>
                    Type this number exactly in the field below to confirm
                    permanent deletion.
                  </p>
                </div>

                <div style={{ ...styles.field, marginBottom: 20 }}>
                  <label
                    style={styles.label}
                    htmlFor="confirm-delete-file-number"
                  >
                    Enter exact file number *
                  </label>
                  <input
                    id="confirm-delete-file-number"
                    type="text"
                    autoComplete="off"
                    value={deleteFileNumber}
                    onChange={(event) => {
                      setDeleteFileNumber(event.target.value);
                      setError("");
                    }}
                    placeholder="Enter the patient's file number"
                    style={styles.input}
                    disabled={actionLoading}
                  />
                </div>

                <div
                  style={{
                    padding: 12,
                    marginBottom: 20,
                    borderRadius: 10,
                    background: "#fff7ed",
                    color: "#9a3412",
                    fontSize: 12,
                    lineHeight: 1.6,
                  }}
                >
                  Deletion may be rejected if appointments, treatment
                  records, or other linked data exist. Archive the patient
                  instead if their history must be retained.
                </div>
              </>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <button
                type="button"
                style={styles.button}
                disabled={actionLoading}
                onClick={() => {
                  setConfirmation(null);
                  setDeleteFileNumber("");
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                style={{
                  ...(confirmation.type === "delete"
                    ? styles.dangerButton
                    : styles.primaryButton),
                  background:
                    confirmation.type === "delete"
                      ? C.redBg
                      : confirmation.type === "archive"
                        ? C.orange
                        : C.green,
                  color:
                    confirmation.type === "delete" ? C.red : C.white,
                  borderColor:
                    confirmation.type === "delete"
                      ? "#fecdd3"
                      : "transparent",
                  opacity: actionLoading ? 0.65 : 1,
                  cursor: actionLoading ? "wait" : "pointer",
                }}
                disabled={
                  actionLoading ||
                  (confirmation.type === "delete" &&
                    String(deleteFileNumber).trim() !==
                      String(getFileNumber(confirmation.patient)).trim())
                }
                onClick={executeConfirmedAction}
              >
                {actionLoading
                  ? "Processing..."
                  : confirmationDetails.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

import React, { useCallback, useEffect, useState } from "react";
import api from "../../api/api";
const emptyForm = {
  name: "",
  patient_id: "",
  current_approval_number: "",
  approval_start_date: "",
  approval_expiry_date: "",
  approved_sessions: 0,
  sessions_taken: 0,
  taken_with: "",
  current_future_appointments: "",
  insurance_provider: "",
  approved_cpt_codes: [],
};
const styles = {
  page: { width: "100%", color: "#1f2937" },
  toolbar: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    fontSize: 14,
    background: "#fff",
    color: "#111827",
  },
  select: {
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    background: "#fff",
    color: "#111827",
  },
  button: {
    padding: "9px 13px",
    border: "none",
    borderRadius: 7,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
  },
  primary: { background: "#1e3a8a", color: "#fff" },
  secondary: { background: "#e2e8f0", color: "#1e293b" },
  warning: { background: "#fef3c7", color: "#92400e" },
  danger: { background: "#fee2e2", color: "#991b1b" },
  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },
  label: {
    display: "block",
    marginBottom: 6,
    fontWeight: 600,
    fontSize: 13,
    color: "#374151",
  },
  tableWrap: { width: "100%", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    textAlign: "left",
    padding: 12,
    background: "#f1f5f9",
    borderBottom: "1px solid #cbd5e1",
    whiteSpace: "nowrap",
  },
  td: {
    padding: 12,
    borderBottom: "1px solid #e5e7eb",
    verticalAlign: "top",
  },
  message: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 14,
    fontSize: 14,
  },
};
function getErrorMessage(error, fallback) {
  const data = error?.response?.data;
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.detail === "string") return data.detail;
  if (typeof data?.message === "string") return data.message;
  if (error?.response?.status) {
    return `${fallback} (HTTP ${error.response.status})`;
  }
  return fallback;
}
function getPatientFromResponse(data) {
  return data?.patient || data;
}
function normalizePatientId(value) {
  return String(value ?? "").trim().replace(/\s+/g, "").toLowerCase();
}
function toFormData(patient = {}) {
  return {
    name: patient.name || "",
    patient_id: patient.patient_id || "",
    current_approval_number: patient.current_approval_number || "",
    approval_start_date: patient.approval_start_date || "",
    approval_expiry_date: patient.approval_expiry_date || "",
    approved_sessions: patient.approved_sessions ?? 0,
    sessions_taken: patient.sessions_taken ?? 0,
    taken_with: patient.taken_with || "",
    current_future_appointments:
      patient.current_future_appointments ?? "",
    insurance_provider: patient.insurance_provider || "",
    approved_cpt_codes: Array.isArray(patient.approved_cpt_codes)
      ? patient.approved_cpt_codes
      : [],
  };
}
function Field({ label, children }) {
  return (
    <div>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}
export default function AdminPatientFilesSection() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("active");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [mode, setMode] = useState("list");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let url = "patients/";
      if (view === "archived") {
        url += "?archived=true";
      } else if (view === "all") {
        url += "?include_archived=true";
      }
      const response = await api.get(url);
      const rows = response.data?.patients || [];
      const normalizedSearch = search.trim().toLowerCase();
      const filteredRows = normalizedSearch
        ? rows.filter((patient) => {
            const name = String(patient.name || "").toLowerCase();
            const patientId = normalizePatientId(patient.patient_id);
            const entered = normalizePatientId(normalizedSearch);
            return (
              name.includes(normalizedSearch) ||
              patientId.includes(entered) ||
              String(patient.id || "").includes(normalizedSearch)
            );
          })
        : rows;
      setPatients(filteredRows);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load patient files."));
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [search, view]);
  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);
  const clearNotices = () => {
    setMessage("");
    setError("");
  };
  const handleOpen = async (patient) => {
    clearNotices();
    setLoading(true);
    try {
      const response = await api.get(`patients/${patient.id}/`);
      const fullPatient = getPatientFromResponse(response.data);
      setSelectedPatient(fullPatient);
      setFormData(toFormData(fullPatient));
      setMode("details");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to open this patient file."));
    } finally {
      setLoading(false);
    }
  };
  const handleEdit = async (patient) => {
    clearNotices();
    setLoading(true);
    try {
      const response = await api.get(`patients/${patient.id}/`);
      const fullPatient = getPatientFromResponse(response.data);
      setSelectedPatient(fullPatient);
      setFormData(toFormData(fullPatient));
      setMode("edit");
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to load patient details for editing.")
      );
    } finally {
      setLoading(false);
    }
  };
  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };
  const handleSave = async (event) => {
    event.preventDefault();
    if (!selectedPatient) return;
    clearNotices();
    if (!formData.name.trim() || !formData.patient_id.trim()) {
      setError("Patient name and patient ID are required.");
      return;
    }
    const approvedSessions = Number(formData.approved_sessions);
    const sessionsTaken = Number(formData.sessions_taken);
    if (
      !Number.isInteger(approvedSessions) ||
      !Number.isInteger(sessionsTaken) ||
      approvedSessions < 0 ||
      sessionsTaken < 0
    ) {
      setError(
        "Approved sessions and sessions taken must be non-negative whole numbers."
      );
      return;
    }
    const payload = {
      ...formData,
      name: formData.name.trim(),
      patient_id: formData.patient_id.trim(),
      approved_sessions: approvedSessions,
      sessions_taken: sessionsTaken,
      approved_cpt_codes: formData.approved_cpt_codes,
    };
    setSaving(true);
    try {
      const response = await api.put(
        `patients/${selectedPatient.id}/`,
        payload
      );
      const updatedPatient = getPatientFromResponse(response.data);
      setSelectedPatient(updatedPatient);
      setFormData(toFormData(updatedPatient));
      setMessage(
        response.data?.message || "Patient file updated successfully."
      );
      setMode("details");
      await fetchPatients();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to save patient changes."));
    } finally {
      setSaving(false);
    }
  };
  const handleArchiveRestore = async (patient) => {
    clearNotices();
    const archived = Boolean(patient.is_archived);
    const action = archived ? "restore" : "archive";
    const actionLabel = archived ? "restore" : "archive";
    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabel} the patient file for "${patient.name}" (${patient.patient_id})?`
    );
    if (!confirmed) return;
    setLoading(true);
    try {
      const response = await api.post(`patients/${patient.id}/`, {
        action,
      });
      setMessage(
        response.data?.message ||
          `Patient file ${actionLabel}d successfully.`
      );
      if (selectedPatient?.id === patient.id) {
        setSelectedPatient(getPatientFromResponse(response.data));
        setMode("details");
      }
      await fetchPatients();
    } catch (err) {
      setError(
        getErrorMessage(err, `Unable to ${actionLabel} patient file.`)
      );
    } finally {
      setLoading(false);
    }
  };
  const handlePermanentDelete = async (patient) => {
    clearNotices();
    const patientFileNumber = String(patient.patient_id ?? "").trim();
    if (!patientFileNumber) {
      setError(
        "Cannot delete this file because its patient file number is missing. Refresh the list and try again."
      );
      return;
    }
    const enteredId = window.prompt(
      `Permanent deletion cannot be undone.\n\nPatient: ${patient.name}\nFile number: ${patientFileNumber}\n\nEnter the patient file number to continue:`
    );
    if (enteredId === null) return;
    // The backend validates the confirmation against its stored record.
    // Do not reject the user's entry using a separate frontend comparison.
    const finalConfirm = window.confirm(
      `Are you sure you want to permanently delete "${patient.name}" (${patientFileNumber})?\n\nThis action cannot be undone.`
    );
    if (!finalConfirm) return;
    setLoading(true);
    try {
      const response = await api.delete(`patients/${patient.id}/`, {
        data: {
          confirm: enteredId.trim(),
        },
      });
      setMessage(
        response.data?.message || "Patient file permanently deleted."
      );
      if (selectedPatient?.id === patient.id) {
        setSelectedPatient(null);
        setFormData(emptyForm);
        setMode("list");
      }
      await fetchPatients();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to permanently delete this patient file. If appointments are linked, archive the file instead."
        )
      );
    } finally {
      setLoading(false);
    }
  };
  const backToList = () => {
    setSelectedPatient(null);
    setFormData(emptyForm);
    setMode("list");
    clearNotices();
  };
  const renderPatientActions = (patient) => (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        minWidth: 220,
      }}
    >
      <button
        type="button"
        style={{ ...styles.button, ...styles.primary }}
        onClick={() => handleOpen(patient)}
        disabled={loading}
      >
        Open
      </button>
      <button
        type="button"
        style={{ ...styles.button, ...styles.secondary }}
        onClick={() => handleEdit(patient)}
        disabled={loading}
      >
        Edit
      </button>
      <button
        type="button"
        style={{ ...styles.button, ...styles.warning }}
        onClick={() => handleArchiveRestore(patient)}
        disabled={loading}
      >
        {patient.is_archived ? "Restore" : "Archive"}
      </button>
      <button
        type="button"
        style={{ ...styles.button, ...styles.danger }}
        onClick={() => handlePermanentDelete(patient)}
        disabled={loading}
        title="Permanent deletion may be blocked when linked records exist"
      >
        Delete
      </button>
    </div>
  );
  const renderNotices = () => (
    <>
      {message && (
        <div
          role="status"
          style={{
            ...styles.message,
            background: "#dcfce7",
            color: "#166534",
          }}
        >
          {message}
        </div>
      )}
      {error && (
        <div
          role="alert"
          style={{
            ...styles.message,
            background: "#fee2e2",
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      )}
    </>
  );
  const renderPatientDetails = () => {
    if (!selectedPatient) return null;
    const detailRows = [
      ["Patient name", selectedPatient.name],
      ["Patient file number", selectedPatient.patient_id],
      ["Current approval number", selectedPatient.current_approval_number],
      ["Approval start date", selectedPatient.approval_start_date],
      ["Approval expiry date", selectedPatient.approval_expiry_date],
      ["Approved sessions", selectedPatient.approved_sessions],
      ["Sessions taken", selectedPatient.sessions_taken],
      ["Taken with", selectedPatient.taken_with],
      [
        "Current/future appointments",
        selectedPatient.current_future_appointments,
      ],
      ["Insurance provider", selectedPatient.insurance_provider],
      [
        "Approved CPT codes",
        Array.isArray(selectedPatient.approved_cpt_codes)
          ? selectedPatient.approved_cpt_codes.join(", ")
          : "",
      ],
      ["Registered by", selectedPatient.registered_by],
      ["Registered by role", selectedPatient.registered_by_role],
      ["Created at", selectedPatient.created_at],
      ["Registered at", selectedPatient.registered_at],
      [
        "File status",
        selectedPatient.is_archived ? "Archived" : "Active",
      ],
      ["Archived at", selectedPatient.archived_at],
    ];
    return (
      <div style={styles.card}>
        <h3 style={{ marginTop: 0 }}>Patient File Details</h3>
        <div style={styles.grid}>
          {detailRows.map(([label, value]) => (
            <div key={label}>
              <div style={styles.label}>{label}</div>
              <div style={{ overflowWrap: "anywhere" }}>
                {value === null || value === undefined || value === ""
                  ? "—"
                  : String(value)}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 20,
          }}
        >
          <button
            type="button"
            style={{ ...styles.button, ...styles.secondary }}
            onClick={backToList}
          >
            Back to Patient Files
          </button>
          <button
            type="button"
            style={{ ...styles.button, ...styles.primary }}
            onClick={() => {
              setFormData(toFormData(selectedPatient));
              setMode("edit");
              clearNotices();
            }}
          >
            Edit Patient
          </button>
          <button
            type="button"
            style={{ ...styles.button, ...styles.warning }}
            onClick={() => handleArchiveRestore(selectedPatient)}
            disabled={loading}
          >
            {selectedPatient.is_archived
              ? "Restore Patient"
              : "Archive Patient"}
          </button>
          <button
            type="button"
            style={{ ...styles.button, ...styles.danger }}
            onClick={() => handlePermanentDelete(selectedPatient)}
            disabled={loading}
          >
            Permanently Delete
          </button>
        </div>
      </div>
    );
  };
  const renderEditForm = () => (
    <div style={styles.card}>
      <h3 style={{ marginTop: 0 }}>Edit Patient File</h3>
      <form onSubmit={handleSave}>
        <div style={styles.grid}>
          <Field label="Patient Name *">
            <input
              style={styles.input}
              name="name"
              value={formData.name}
              onChange={handleFieldChange}
              required
            />
          </Field>
          <Field label="Patient File Number *">
            <input
              style={styles.input}
              name="patient_id"
              value={formData.patient_id}
              onChange={handleFieldChange}
              required
            />
          </Field>
          <Field label="Current Approval Number">
            <input
              style={styles.input}
              name="current_approval_number"
              value={formData.current_approval_number}
              onChange={handleFieldChange}
            />
          </Field>
          <Field label="Approval Start Date">
            <input
              style={styles.input}
              type="date"
              name="approval_start_date"
              value={formData.approval_start_date}
              onChange={handleFieldChange}
            />
          </Field>
          <Field label="Approval Expiry Date">
            <input
              style={styles.input}
              type="date"
              name="approval_expiry_date"
              value={formData.approval_expiry_date}
              onChange={handleFieldChange}
            />
          </Field>
          <Field label="Approved Sessions">
            <input
              style={styles.input}
              type="number"
              min="0"
              step="1"
              name="approved_sessions"
              value={formData.approved_sessions}
              onChange={handleFieldChange}
            />
          </Field>
          <Field label="Sessions Taken">
            <input
              style={styles.input}
              type="number"
              min="0"
              step="1"
              name="sessions_taken"
              value={formData.sessions_taken}
              onChange={handleFieldChange}
            />
          </Field>
          <Field label="Taken With">
            <input
              style={styles.input}
              name="taken_with"
              value={formData.taken_with}
              onChange={handleFieldChange}
            />
          </Field>
          <Field label="Current/Future Appointments">
            <input
              style={styles.input}
              type="number"
              min="0"
              step="1"
              name="current_future_appointments"
              value={formData.current_future_appointments}
              onChange={handleFieldChange}
            />
          </Field>
          <Field label="Insurance Provider">
            <input
              style={styles.input}
              name="insurance_provider"
              value={formData.insurance_provider}
              onChange={handleFieldChange}
            />
          </Field>
          <Field label="Approved CPT Codes">
            <input
              style={styles.input}
              value={formData.approved_cpt_codes.join(", ")}
              onChange={(event) => {
                const codes = event.target.value
                  .split(",")
                  .map((code) => code.trim())
                  .filter(Boolean);
                setFormData((previous) => ({
                  ...previous,
                  approved_cpt_codes: codes,
                }));
              }}
              placeholder="97110, 97140, 97530"
            />
          </Field>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 20,
          }}
        >
          <button
            type="submit"
            style={{ ...styles.button, ...styles.primary }}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            style={{ ...styles.button, ...styles.secondary }}
            onClick={() => {
              setFormData(toFormData(selectedPatient));
              setMode("details");
              clearNotices();
            }}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
  return (
    <div style={styles.page}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ margin: "0 0 6px" }}>Patient Files</h2>
        <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>
          Search, open, edit, archive, restore, or manage patient files.
        </p>
      </div>
      {renderNotices()}
      {mode !== "list" && (
        <div style={{ marginBottom: 14 }}>
          <button
            type="button"
            style={{ ...styles.button, ...styles.secondary }}
            onClick={backToList}
          >
            ← Back to Patient Files
          </button>
        </div>
      )}
      {mode === "details" && renderPatientDetails()}
      {mode === "edit" && renderEditForm()}
      {mode === "list" && (
        <>
          <div style={styles.toolbar}>
            <input
              style={{
                ...styles.input,
                flex: "1 1 260px",
                maxWidth: 480,
              }}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search patient name, file number, or record ID..."
              aria-label="Search patient files"
            />
            <select
              style={styles.select}
              value={view}
              onChange={(event) => setView(event.target.value)}
              aria-label="Patient file status"
            >
              <option value="active">Active Files</option>
              <option value="archived">Archived Files</option>
              <option value="all">All Files</option>
            </select>
            <button
              type="button"
              style={{ ...styles.button, ...styles.primary }}
              onClick={fetchPatients}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
          <div style={styles.card}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 14,
              }}
            >
              <h3 style={{ margin: 0 }}>
                {view === "active"
                  ? "Active Patient Files"
                  : view === "archived"
                  ? "Archived Patient Files"
                  : "All Patient Files"}
              </h3>
              <span style={{ color: "#64748b", fontSize: 13 }}>
                {patients.length} record{patients.length === 1 ? "" : "s"}
              </span>
            </div>
            {loading && patients.length === 0 ? (
              <p>Loading patient files...</p>
            ) : patients.length === 0 ? (
              <p style={{ color: "#64748b" }}>
                No patient files found.
              </p>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Patient Name</th>
                      <th style={styles.th}>File Number</th>
                      <th style={styles.th}>Insurance</th>
                      <th style={styles.th}>Approved Sessions</th>
                      <th style={styles.th}>Sessions Taken</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((patient) => (
                      <tr key={patient.id}>
                        <td style={styles.td}>
                          <strong>{patient.name}</strong>
                        </td>
                        <td style={styles.td}>{patient.patient_id}</td>
                        <td style={styles.td}>
                          {patient.insurance_provider || "—"}
                        </td>
                        <td style={styles.td}>
                          {patient.approved_sessions ?? 0}
                        </td>
                        <td style={styles.td}>
                          {patient.sessions_taken ?? 0}
                        </td>
                        <td style={styles.td}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 8px",
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 600,
                              background: patient.is_archived
                                ? "#fef3c7"
                                : "#dcfce7",
                              color: patient.is_archived
                                ? "#92400e"
                                : "#166534",
                            }}
                          >
                            {patient.is_archived ? "Archived" : "Active"}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {renderPatientActions(patient)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
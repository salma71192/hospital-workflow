import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";

export default function EditPatientFile({ user, actingAs }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const currentUser = actingAs || user;

  const canEditPatientFile = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.is_superuser) return true;

    const role = (currentUser.role || "").toLowerCase();

    return [
      "admin",
      "reception",
      "reception_supervisor",
      "approvals",
      "callcenter",
      "callcenter_supervisor",
    ].includes(role);
  }, [currentUser]);

  const [form, setForm] = useState({
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
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadPatient();
  }, [id]);

  const loadPatient = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const res = await api.get(`patients/${id}/`);
      const patient = res.data.patient || null;

      if (!patient) {
        setError("Patient not found");
        return;
      }

      setForm({
        name: patient.name || "",
        patient_id: patient.patient_id || "",
        current_approval_number: patient.current_approval_number || "",
        approval_start_date: patient.approval_start_date || "",
        approval_expiry_date: patient.approval_expiry_date || "",
        approved_sessions: patient.approved_sessions ?? 0,
        sessions_taken: patient.sessions_taken ?? 0,
        taken_with: patient.taken_with || "",
        current_future_appointments: patient.current_future_appointments || "",
        insurance_provider: patient.insurance_provider || "",
      });
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load patient file");
    } finally {
      setLoading(false);
    }
  };

  const remainingSessions = Math.max(
    Number(form.approved_sessions || 0) - Number(form.sessions_taken || 0),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canEditPatientFile) {
      setError("You are not allowed to edit patient files");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        name: form.name.trim(),
        patient_id: form.patient_id.trim(),
        current_approval_number: (form.current_approval_number || "").trim(),
        approval_start_date: form.approval_start_date || "",
        approval_expiry_date: form.approval_expiry_date || "",
        approved_sessions: Number(form.approved_sessions || 0),
        sessions_taken: Number(form.sessions_taken || 0),
        taken_with: (form.taken_with || "").trim(),
        current_future_appointments: form.current_future_appointments || "",
        insurance_provider: (form.insurance_provider || "").trim().toLowerCase(),
      };

      await api.put(`patients/${id}/`, payload);

      setMessage("Patient file updated successfully");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to update patient file");
    } finally {
      setSaving(false);
    }
  };

  if (!canEditPatientFile) {
    return (
      <div style={styles.page}>
        <div style={styles.wrapper}>
          <button style={styles.backButton} onClick={() => navigate(-1)}>
            Back
          </button>
          <div style={styles.errorBox}>You are not allowed to edit patient files.</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.wrapper}>
          <div style={styles.infoBox}>Loading patient file...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrapper}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.title}>Edit Patient File</h1>
            <p style={styles.subtitle}>
              Update patient information, sessions, and workflow details
            </p>
          </div>

          <div style={styles.topActions}>
            <button style={styles.secondaryButton} onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        </div>

        {message ? <div style={styles.successBox}>{message}</div> : null}
        {error ? <div style={styles.errorBox}>{error}</div> : null}

        <form onSubmit={handleSubmit} style={styles.formCard}>
          <div style={styles.sectionTitle}>Basic Information</div>

          <div style={styles.formGrid}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Patient Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>File Number</label>
              <input
                type="text"
                value={form.patient_id}
                onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.sectionTitle}>Approval Information</div>

          <div style={styles.formGrid}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Insurance Provider</label>
              <select
                value={form.insurance_provider}
                onChange={(e) =>
                  setForm({ ...form, insurance_provider: e.target.value })
                }
                style={styles.input}
              >
                <option value="">Select provider</option>
                <option value="thiqa">Thiqa</option>
                <option value="daman">Daman</option>
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Authorization Number</label>
              <input
                type="text"
                value={form.current_approval_number}
                onChange={(e) =>
                  setForm({ ...form, current_approval_number: e.target.value })
                }
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Approval Start Date</label>
              <input
                type="date"
                value={form.approval_start_date}
                onChange={(e) =>
                  setForm({ ...form, approval_start_date: e.target.value })
                }
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Approval Expiry Date</label>
              <input
                type="date"
                value={form.approval_expiry_date}
                onChange={(e) =>
                  setForm({ ...form, approval_expiry_date: e.target.value })
                }
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Approved Sessions</label>
              <input
                type="number"
                min="0"
                value={form.approved_sessions}
                onChange={(e) =>
                  setForm({ ...form, approved_sessions: e.target.value })
                }
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Used Sessions</label>
              <input
                type="number"
                min="0"
                value={form.sessions_taken}
                onChange={(e) =>
                  setForm({ ...form, sessions_taken: e.target.value })
                }
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Remaining Sessions</label>
              <input
                type="text"
                value={remainingSessions}
                style={{ ...styles.input, ...styles.inputDisabled }}
                disabled
              />
            </div>
          </div>

          <div style={styles.sectionTitle}>Workflow Details</div>

          <div style={styles.formGrid}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Taken With</label>
              <input
                type="text"
                value={form.taken_with}
                onChange={(e) => setForm({ ...form, taken_with: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Current / Future Appointments</label>
            <textarea
              value={form.current_future_appointments}
              onChange={(e) =>
                setForm({ ...form, current_future_appointments: e.target.value })
              }
              style={styles.textarea}
            />
          </div>

          <div style={styles.actionBar}>
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>

            <button type="submit" style={styles.primaryButton} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f3f7fb 0%, #fbfdff 100%)",
    padding: "32px 20px",
  },
  wrapper: {
    maxWidth: "1100px",
    margin: "0 auto",
    display: "grid",
    gap: "20px",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
  },
  topActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: "34px",
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    margin: "8px 0 0 0",
    color: "#64748b",
    fontSize: "15px",
  },
  formCard: {
    background: "#fff",
    borderRadius: "20px",
    padding: "24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
    display: "grid",
    gap: "20px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#1d4ed8",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },
  fieldGroup: {
    display: "grid",
    gap: "8px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#475569",
  },
  input: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    background: "#fff",
    outline: "none",
  },
  inputDisabled: {
    background: "#f8fafc",
    color: "#64748b",
    cursor: "not-allowed",
  },
  textarea: {
    minHeight: "100px",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    background: "#fff",
    resize: "vertical",
    outline: "none",
  },
  actionBar: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    flexWrap: "wrap",
    paddingTop: "8px",
    borderTop: "1px solid #e2e8f0",
  },
  primaryButton: {
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    fontWeight: "800",
    cursor: "pointer",
  },
  secondaryButton: {
    background: "#e2e8f0",
    color: "#0f172a",
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    fontWeight: "700",
    cursor: "pointer",
  },
  infoBox: {
    background: "#f8fafc",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
    borderRadius: "12px",
    padding: "16px",
    fontWeight: "700",
  },
  successBox: {
    background: "#f0fdf4",
    color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: "12px",
    padding: "16px",
    fontWeight: "700",
  },
  errorBox: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    padding: "16px",
    fontWeight: "700",
  },
};
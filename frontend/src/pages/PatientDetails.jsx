import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";

export default function PatientDetails({ user, actingAs }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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

  const loadPatient = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`patients/${id}/`);
      setPatient(res.data.patient || null);
    } catch {
      setError("Failed to load patient file");
      setPatient(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatient();
  }, [id]);

  const approved = Number(patient?.approved_sessions || 0);
  const used = Number(patient?.sessions_taken || 0);
  const remaining = Math.max(approved - used, 0);

  const today = new Date().toISOString().split("T")[0];

  const status =
    patient?.approval_expiry_date &&
    patient.approval_expiry_date < today
      ? "Expired"
      : approved > 0 && remaining <= 2
      ? "Low Sessions"
      : "Active";

  const formatRole = (role) => {
    if (!role) return "-";
    return role
      .replaceAll("_", " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatDate = (value) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const handleEditPatientFile = () => {
    navigate(`/patients/${id}/edit`);
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.wrapper}>
          <div style={styles.infoBox}>Loading patient file...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.wrapper}>
          <button style={styles.backButton} onClick={() => navigate(-1)}>
            Back
          </button>
          <div style={styles.errorBox}>{error}</div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div style={styles.page}>
        <div style={styles.wrapper}>
          <button style={styles.backButton} onClick={() => navigate(-1)}>
            Back
          </button>
          <div style={styles.infoBox}>Patient not found.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrapper}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.title}>Patient File</h1>
            <p style={styles.subtitle}>Complete patient overview and tracking</p>
          </div>

          <div style={styles.topActions}>
            {canEditPatientFile && (
              <button style={styles.editButton} onClick={handleEditPatientFile}>
                Edit Patient File
              </button>
            )}
            <button style={styles.backButton} onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        </div>

        <div style={styles.heroCard}>
          <div>
            <div style={styles.patientName}>{patient.name}</div>
            <div style={styles.patientId}>File Number: {patient.patient_id}</div>
          </div>

          <span
            style={{
              ...styles.badge,
              ...(status === "Expired"
                ? styles.badgeRed
                : status === "Low Sessions"
                ? styles.badgeYellow
                : styles.badgeGreen),
            }}
          >
            {status}
          </span>
        </div>

        <div style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Approved</div>
            <div style={styles.summaryValue}>{approved}</div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Used</div>
            <div style={styles.summaryValue}>{used}</div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Remaining</div>
            <div style={styles.summaryValue}>{remaining}</div>
          </div>
        </div>

        <div style={styles.grid}>
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>Approval Details</div>
            <Field label="Insurance" value={patient.insurance_provider} />
            <Field label="Authorization" value={patient.current_approval_number} />
            <Field label="Start Date" value={patient.approval_start_date} />
            <Field label="Expiry Date" value={patient.approval_expiry_date} />

            <div style={styles.fieldBlock}>
              <span style={styles.label}>CPT Codes</span>
              <div style={styles.chipsWrap}>
                {patient.approved_cpt_codes?.length ? (
                  patient.approved_cpt_codes.map((code, i) => (
                    <span key={i} style={styles.chip}>
                      {code}
                    </span>
                  ))
                ) : (
                  <span style={styles.muted}>No codes</span>
                )}
              </div>
            </div>
          </div>

          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>Physio</div>
            <Field label="Sessions Used" value={patient.sessions_taken} />
            <Field label="Therapist" value={patient.taken_with} />
          </div>

          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>Appointments</div>
            <div style={styles.largeValue}>
              {patient.current_future_appointments || "-"}
            </div>
          </div>

          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>Registration</div>
            <Field label="Registered By" value={patient.registered_by} />
            <Field label="Role" value={formatRole(patient.registered_by_role)} />
            <Field
              label="Registered At"
              value={formatDate(patient.registered_at || patient.created_at)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div style={styles.fieldRow}>
      <span style={styles.label}>{label}</span>
      <span style={styles.value}>{value || "-"}</span>
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
  heroCard: {
    background: "#fff",
    borderRadius: "20px",
    padding: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    border: "1px solid #e8eef7",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
  },
  patientName: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: "8px",
  },
  patientId: {
    fontSize: "16px",
    color: "#475569",
    fontWeight: "600",
  },
  badge: {
    padding: "8px 12px",
    borderRadius: "999px",
    fontWeight: "800",
    fontSize: "12px",
  },
  badgeGreen: {
    background: "#dcfce7",
    color: "#166534",
  },
  badgeYellow: {
    background: "#fef3c7",
    color: "#92400e",
  },
  badgeRed: {
    background: "#fee2e2",
    color: "#991b1b",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
  },
  summaryCard: {
    background: "#fff",
    padding: "16px",
    borderRadius: "14px",
    textAlign: "center",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
  },
  summaryLabel: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: "700",
  },
  summaryValue: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f172a",
    marginTop: "4px",
  },
  grid: {
    display: "grid",
    gap: "20px",
  },
  sectionCard: {
    background: "#fff",
    padding: "20px",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    display: "grid",
    gap: "12px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
  },
  sectionHeader: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#1d4ed8",
  },
  fieldRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
    paddingBottom: "10px",
    borderBottom: "1px solid #eef2f7",
  },
  label: {
    color: "#64748b",
    fontWeight: "700",
    fontSize: "14px",
  },
  value: {
    fontWeight: "700",
    color: "#0f172a",
    fontSize: "14px",
    textAlign: "right",
  },
  fieldBlock: {
    display: "grid",
    gap: "8px",
  },
  chipsWrap: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  chip: {
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "4px 8px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
  },
  muted: {
    color: "#94a3b8",
    fontWeight: "600",
    fontSize: "14px",
  },
  largeValue: {
    background: "#f8fafc",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    color: "#0f172a",
    fontWeight: "700",
    whiteSpace: "pre-wrap",
  },
  backButton: {
    background: "#2563eb",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontWeight: "700",
  },
  editButton: {
    background: "#16a34a",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontWeight: "700",
  },
  infoBox: {
    background: "#f8fafc",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
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
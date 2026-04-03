import React, { useState } from "react";
import api from "../../api/api";
import BillingCodePresets from "./BillingCodePresets";

export default function BillingCodesSection({
  billingForm,
  setBillingForm,
  billingCodes = [],
  onSubmit,
  reloadCodes,
}) {
  const [editingId, setEditingId] = useState(null);

  const resetForm = () => {
    setEditingId(null);
    setBillingForm((prev) => ({
      ...prev,
      code: "",
      default_sessions: 6,
    }));
  };

  const handlePickPreset = (item) => {
    setEditingId(null);
    setBillingForm((prev) => ({
      ...prev,
      code: item.code,
      default_sessions: item.default_sessions,
    }));
  };

  const handleAddDefaultCodes = async (codes) => {
    try {
      for (const item of codes) {
        await api.post("approvals/billing-codes/", {
          insurance_provider: "thiqa",
          code: item.code,
          default_sessions: item.default_sessions,
        });
      }

      if (reloadCodes) {
        await reloadCodes();
      }
    } catch (err) {
      console.error("Failed to add default codes", err);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setBillingForm((prev) => ({
      ...prev,
      code: item.code,
      default_sessions: item.default_sessions,
    }));
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this CPT code?");
    if (!confirmed) return;

    try {
      await api.delete("approvals/billing-codes/", {
        data: { id },
      });

      if (editingId === id) {
        resetForm();
      }

      if (reloadCodes) {
        await reloadCodes();
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const wrappedSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(e);
    resetForm();
  };

  return (
    <div style={styles.page}>
      <BillingCodePresets
        existingCodes={billingCodes}
        onPickCode={handlePickPreset}
        onAddDefaultCodes={handleAddDefaultCodes}
      />

      <div style={styles.card}>
        <div style={styles.eyebrow}>Manage CPT Defaults</div>
        <h2 style={styles.title}>
          {editingId ? "Edit CPT Code" : "Add CPT Code"}
        </h2>
        <div style={styles.subtext}>
          Save CPT code defaults with editable session counts.
        </div>

        <form onSubmit={wrappedSubmit} style={styles.form}>
          <div style={styles.formGrid}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>CPT Code</label>
              <input
                placeholder="Enter CPT code"
                value={billingForm.code}
                onChange={(e) =>
                  setBillingForm({ ...billingForm, code: e.target.value })
                }
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Default Sessions</label>
              <input
                type="number"
                min="0"
                placeholder="Enter default sessions"
                value={billingForm.default_sessions ?? 6}
                onChange={(e) =>
                  setBillingForm({
                    ...billingForm,
                    default_sessions: e.target.value,
                  })
                }
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.actionBar}>
            {editingId ? (
              <button
                type="button"
                style={styles.secondary}
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            ) : null}

            <button type="submit" style={styles.primary}>
              {editingId ? "Update CPT Code" : "Save CPT Code"}
            </button>
          </div>
        </form>
      </div>

      <div style={styles.listCard}>
        <div style={styles.listTitle}>Available CPT Codes</div>

        {billingCodes.length === 0 ? (
          <div style={styles.emptyState}>
            No CPT codes added yet. Use the default 4 codes button or add one manually.
          </div>
        ) : (
          <div style={styles.billingList}>
            {billingCodes.map((item) => (
              <div key={item.id} style={styles.billingCard}>
                <div style={styles.billingCode}>{item.code}</div>
                <div style={styles.billingSessions}>
                  Default Sessions: {item.default_sessions}
                </div>

                <div style={styles.rowActions}>
                  <button
                    type="button"
                    style={styles.editBtn}
                    onClick={() => handleEdit(item)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    style={styles.deleteBtn}
                    onClick={() => handleDelete(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "grid",
    gap: "16px",
  },
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "22px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
  },
  eyebrow: {
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#2563eb",
    marginBottom: "8px",
  },
  title: {
    margin: "0 0 6px 0",
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
  },
  subtext: {
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "14px",
  },
  form: {
    display: "grid",
    gap: "18px",
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
  },
  actionBar: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    paddingTop: "8px",
    borderTop: "1px solid #e2e8f0",
  },
  primary: {
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#fff",
    padding: "12px 20px",
    border: "none",
    borderRadius: "10px",
    fontWeight: "800",
    cursor: "pointer",
  },
  secondary: {
    background: "#e2e8f0",
    color: "#0f172a",
    padding: "12px 20px",
    border: "none",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer",
  },
  listCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "22px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
  },
  listTitle: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: "14px",
  },
  emptyState: {
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: "12px",
    padding: "14px",
  },
  billingList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "12px",
  },
  billingCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "12px",
    background: "#f8fafc",
    display: "grid",
    gap: "8px",
  },
  billingCode: {
    fontWeight: "800",
    color: "#0f172a",
  },
  billingSessions: {
    fontSize: "14px",
    color: "#166534",
    fontWeight: "700",
  },
  rowActions: {
    display: "flex",
    gap: "8px",
  },
  editBtn: {
    background: "#0ea5e9",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "8px 10px",
    cursor: "pointer",
  },
  deleteBtn: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "8px 10px",
    cursor: "pointer",
  },
};
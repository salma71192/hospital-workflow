import React from "react";
import CPTCodeSelector from "./CPTCodeSelector";

export default function ApprovalForm({
  form,
  setForm,
  billingCodes,
  onSubmit,
}) {
  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Update Approval</h2>

      <input
        placeholder="Authorization Number"
        value={form.authorization_number}
        onChange={(e) =>
          setForm({ ...form, authorization_number: e.target.value })
        }
        style={styles.input}
      />

      <input
        type="date"
        value={form.start_date}
        onChange={(e) =>
          setForm({ ...form, start_date: e.target.value })
        }
        style={styles.input}
      />

      <input
        type="date"
        value={form.expiry_date}
        onChange={(e) =>
          setForm({ ...form, expiry_date: e.target.value })
        }
        style={styles.input}
      />

      <input
        type="number"
        placeholder="Approved Sessions"
        value={form.approved_sessions}
        onChange={(e) =>
          setForm({ ...form, approved_sessions: e.target.value })
        }
        style={styles.input}
      />

      {/* 🔥 CPT SELECTOR */}
      <CPTCodeSelector
        codes={billingCodes}
        selectedCodes={form.approved_cpt_codes}
        setSelectedCodes={(codes) =>
          setForm({ ...form, approved_cpt_codes: codes })
        }
      />

      <button onClick={onSubmit} style={styles.button}>
        Save Approval
      </button>
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "16px",
    marginTop: "16px",
  },
  title: { fontWeight: "800", marginBottom: "10px" },
  input: {
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    marginBottom: "10px",
    width: "100%",
  },
  button: {
    background: "#16a34a",
    color: "#fff",
    padding: "10px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    width: "100%",
  },
};
import React from "react";

export default function BillingCodesSection({
  billingForm,
  setBillingForm,
  billingCodes = [],
  onSubmit,
}) {
  return (
    <div style={styles.page}>
      <div style={styles.headerCard}>
        <div>
          <div style={styles.eyebrow}>Billing Setup</div>
          <h2 style={styles.title}>Billing Codes</h2>
          <div style={styles.subtext}>
            Add or update insurance CPT billing codes and amounts.
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <form onSubmit={onSubmit} style={styles.form}>
          <div style={styles.formGrid}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Code</label>
              <input
                placeholder="Enter code"
                value={billingForm.code}
                onChange={(e) =>
                  setBillingForm({ ...billingForm, code: e.target.value })
                }
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Description</label>
              <input
                placeholder="Enter description"
                value={billingForm.description}
                onChange={(e) =>
                  setBillingForm({
                    ...billingForm,
                    description: e.target.value,
                  })
                }
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Amount</label>
              <input
                placeholder="Enter amount"
                value={billingForm.amount}
                onChange={(e) =>
                  setBillingForm({ ...billingForm, amount: e.target.value })
                }
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.actionBar}>
            <button type="submit" style={styles.primary}>
              Save Billing Code
            </button>
          </div>
        </form>
      </div>

      <div style={styles.listCard}>
        <div style={styles.listTitle}>Saved Codes</div>

        <div style={styles.billingList}>
          {billingCodes.map((item) => (
            <div key={item.id} style={styles.billingCard}>
              <div style={styles.billingCode}>{item.code}</div>
              <div style={styles.billingDesc}>{item.description}</div>
              <div style={styles.billingAmount}>{item.amount}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "grid",
    gap: "16px",
  },
  headerCard: {
    background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)",
    border: "1px solid #dbeafe",
    borderRadius: "18px",
    padding: "22px",
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
    margin: 0,
    fontSize: "26px",
    fontWeight: "800",
    color: "#0f172a",
  },
  subtext: {
    marginTop: "6px",
    fontSize: "14px",
    color: "#64748b",
  },
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "22px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
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
  },
  billingCode: {
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: "4px",
  },
  billingDesc: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "6px",
  },
  billingAmount: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#166534",
  },
};
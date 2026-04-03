import React from "react";

export default function CreateUserForm({
  formData,
  setFormData,
  roles = [],
  roleLabels = {},
  onSubmit,
}) {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Create New User</h2>

      <form onSubmit={onSubmit} style={styles.form}>
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          style={styles.input}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          style={styles.input}
          required
        />

        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          style={styles.input}
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {roleLabels[role] || role}
            </option>
          ))}
        </select>

        <label style={styles.checkboxRow}>
          <input
            type="checkbox"
            name="is_superuser"
            checked={formData.is_superuser}
            onChange={handleChange}
          />
          Make this user Django superuser
        </label>

        <button type="submit" style={styles.button}>
          Create User
        </button>
      </form>
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e8eef7",
  },
  cardTitle: {
    margin: "0 0 18px 0",
    fontSize: "24px",
    color: "#0f172a",
    fontWeight: "800",
  },
  form: {
    display: "grid",
    gap: "14px",
  },
  input: {
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#334155",
    fontWeight: "600",
  },
  button: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },
};
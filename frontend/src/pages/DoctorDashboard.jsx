import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function AdminDashboard({ user, onLogout, onActAsUser }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "admin",
    is_superuser: false,
  });

  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("admin");

  const roles = [
    "admin",
    "physio",
    "reception",
    "visitor",
    "doctor",
    "rcm",
    "callcenter",
  ];

  const roleLabels = {
    admin: "Admin",
    physio: "Physio",
    reception: "Reception",
    visitor: "Visitors",
    doctor: "Doctor",
    rcm: "RCM",
    callcenter: "Call Center",
    no_role: "No Role",
  };

  const roleRoutes = {
    admin: "/admin",
    physio: "/physio",
    reception: "/reception",
    visitor: "/visitors",
    doctor: "/doctor",
    rcm: "/rcm",
    callcenter: "/callcenter",
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("users/list-users/");
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const groupedUsers = useMemo(() => {
    const groups = {
      admin: [],
      reception: [],
      physio: [],
      doctor: [],
      rcm: [],
      callcenter: [],
      visitor: [],
      no_role: [],
    };

    users.forEach((item) => {
      if (groups[item.role]) {
        groups[item.role].push(item);
      } else {
        groups.no_role.push(item);
      }
    });

    return groups;
  }, [users]);

  const categoryOrder = [
    "admin",
    "reception",
    "physio",
    "doctor",
    "rcm",
    "callcenter",
    "visitor",
    "no_role",
  ];

  const visibleUsers = groupedUsers[activeCategory] || [];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await api.post("users/create-user/", formData);
      setMessage(res.data.message || "User created successfully");
      setFormData({
        username: "",
        password: "",
        role: "admin",
        is_superuser: false,
      });
      fetchUsers();
      setActiveCategory(formData.role || "admin");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to create user");
    }
  };

  const handleActAsUser = (selectedUser) => {
    onActAsUser(selectedUser);
    const route = selectedUser.is_superuser
      ? "/admin"
      : roleRoutes[selectedUser.role] || "/admin";
    navigate(route);
  };

  const renderUserCard = (item) => (
    <div key={item.id} style={styles.userCard}>
      <div>
        <div style={styles.userName}>{item.username}</div>
        <div style={styles.userMeta}>
          Role: {item.role || "No role"}
          {item.is_superuser ? " • Superuser" : ""}
        </div>
      </div>

      <button style={styles.viewButton} onClick={() => handleActAsUser(item)}>
        Open as User
      </button>
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.title}>Admin Dashboard</h1>
            <p style={styles.subtitle}>Welcome, {user?.username}</p>
          </div>

          <button style={styles.logoutButton} onClick={onLogout}>
            Logout
          </button>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Create New User</h2>

          <form onSubmit={handleCreateUser} style={styles.form}>
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
                  {roleLabels[role]}
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

          {message && <p style={styles.success}>{message}</p>}
          {error && <p style={styles.error}>{error}</p>}
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Users by Category</h2>

          <div style={styles.tabsWrap}>
            {categoryOrder.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                style={{
                  ...styles.tabButton,
                  ...(activeCategory === category ? styles.activeTabButton : {}),
                }}
              >
                {roleLabels[category]} ({groupedUsers[category]?.length || 0})
              </button>
            ))}
          </div>

          <div style={styles.tabPanel}>
            <h3 style={styles.sectionTitle}>{roleLabels[activeCategory]}</h3>

            {visibleUsers.length ? (
              <div style={styles.userGrid}>{visibleUsers.map(renderUserCard)}</div>
            ) : (
              <div style={styles.emptyState}>No users in this category.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f3f6ff 0%, #f9fbff 100%)",
    padding: "32px 20px",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "28px",
  },
  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: "700",
    color: "#1e3a8a",
  },
  subtitle: {
    margin: "8px 0 0 0",
    color: "#475569",
    fontSize: "16px",
  },
  logoutButton: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  card: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
    marginBottom: "20px",
  },
  cardTitle: {
    margin: "0 0 18px 0",
    fontSize: "24px",
    color: "#0f172a",
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
  },
  button: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  success: {
    color: "#166534",
    marginTop: "14px",
    fontWeight: "600",
  },
  error: {
    color: "#dc2626",
    marginTop: "14px",
    fontWeight: "600",
  },
  tabsWrap: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "20px",
  },
  tabButton: {
    background: "#e2e8f0",
    color: "#334155",
    border: "none",
    borderRadius: "999px",
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  activeTabButton: {
    background: "#1d4ed8",
    color: "#fff",
  },
  tabPanel: {
    marginTop: "8px",
  },
  sectionTitle: {
    margin: "0 0 14px 0",
    fontSize: "20px",
    color: "#1e293b",
  },
  userGrid: {
    display: "grid",
    gap: "12px",
  },
  userCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "16px",
  },
  userName: {
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "6px",
  },
  userMeta: {
    color: "#64748b",
    fontSize: "14px",
  },
  viewButton: {
    background: "#1d4ed8",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  emptyState: {
    padding: "18px",
    borderRadius: "12px",
    background: "#f8fafc",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
  },
};
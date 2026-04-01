import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import DashboardLayout from "../components/DashboardLayout";
import AssignmentHistory from "../components/AssignmentHistory";

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
  const [activeSection, setActiveSection] = useState("manage");
  const [activeCategory, setActiveCategory] = useState(
    localStorage.getItem("activeCategory") || "admin"
  );

  const roles = [
    "admin",
    "approvals",
    "physio",
    "reception",
    "reception_supervisor",
    "visitor",
    "visitor_ceo",
    "doctor",
    "rcm",
    "callcenter",
    "callcenter_supervisor",
  ];

  const roleLabels = {
    admin: "Admin",
    approvals: "Approvals",
    physio: "Physio",
    reception: "Reception",
    reception_supervisor: "Reception Supervisor",
    visitor: "Visitors",
    visitor_ceo: "Visitor CEO",
    doctor: "Doctor",
    rcm: "RCM",
    callcenter: "Call Center",
    callcenter_supervisor: "Call Center Supervisor",
    no_role: "No Role",
  };

  const roleRoutes = {
    admin: "/admin",
    approvals: "/approvals",
    physio: "/physio",
    reception: "/reception",
    reception_supervisor: "/reception-supervisor",
    visitor: "/visitors",
    visitor_ceo: "/visitor-ceo",
    doctor: "/doctor",
    rcm: "/rcm",
    callcenter: "/callcenter",
    callcenter_supervisor: "/callcenter-supervisor",
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
      approvals: [],
      reception: [],
      reception_supervisor: [],
      physio: [],
      doctor: [],
      rcm: [],
      callcenter: [],
      callcenter_supervisor: [],
      visitor: [],
      visitor_ceo: [],
      no_role: [],
    };

    users.forEach((item) => {
      if (groups[item.role]) groups[item.role].push(item);
      else groups.no_role.push(item);
    });

    return groups;
  }, [users]);

  const categoryOrder = [
    "admin",
    "approvals",
    "reception",
    "reception_supervisor",
    "physio",
    "doctor",
    "rcm",
    "callcenter",
    "callcenter_supervisor",
    "visitor",
    "visitor_ceo",
    "no_role",
  ];

  const visibleUsers = groupedUsers[activeCategory] ?? [];

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    localStorage.setItem("activeCategory", category);
  };

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
      setError("");
      setFormData({
        username: "",
        password: "",
        role: "admin",
        is_superuser: false,
      });
      await fetchUsers();
      setActiveSection("manage");
      setActiveCategory(formData.role);
      localStorage.setItem("activeCategory", formData.role);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to create user");
      setMessage("");
    }
  };

  const handleActAsUser = (selectedUser) => {
    onActAsUser(selectedUser);
    navigate(
      selectedUser.is_superuser
        ? "/admin"
        : roleRoutes[selectedUser.role] || "/admin"
    );
  };

  const handleRoleUpdate = async (userId, newRole, newIsSuperuser) => {
    try {
      const res = await api.put(`users/update-user/${userId}/`, {
        role: newRole,
        is_superuser: newIsSuperuser,
      });
      setMessage(res.data.message || "User updated successfully");
      setError("");
      await fetchUsers();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to update user");
      setMessage("");
    }
  };

  const handleDeleteUser = async (userId, username) => {
    const confirmed = window.confirm(`Delete user "${username}"?`);
    if (!confirmed) return;

    try {
      const res = await api.delete(`users/delete-user/${userId}/`);
      setMessage(res.data.message || "User deleted successfully");
      setError("");
      await fetchUsers();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to delete user");
      setMessage("");
    }
  };

  return (
    <DashboardLayout
      title="Admin Dashboard"
      subtitle={`Welcome, ${user?.username}`}
      accent="#1e3a8a"
      sidebarTitle="Admin Panel"
      sidebarItems={[
        { key: "create", label: "Create New User" },
        { key: "manage", label: "Manage Users" },
        { key: "history", label: "History" },
      ]}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      onLogout={onLogout}
    >
      {message && <div style={styles.successBox}>{message}</div>}
      {error && <div style={styles.errorBox}>{error}</div>}

      {activeSection === "create" && (
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
        </div>
      )}

      {activeSection === "manage" && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Manage Users</h2>

          <div style={styles.tabsWrap}>
            {categoryOrder.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                style={{
                  ...styles.tabButton,
                  ...(activeCategory === category ? styles.activeTabButton : {}),
                }}
              >
                {roleLabels[category]} ({groupedUsers[category]?.length || 0})
              </button>
            ))}
          </div>

          {visibleUsers.length ? (
            <div style={styles.userGrid}>
              {visibleUsers.map((item) => (
                <div key={item.id} style={styles.userCard}>
                  <div style={styles.userInfo}>
                    <div style={styles.userName}>{item.username}</div>
                    <div style={styles.userMeta}>
                      Role: {item.role || "No role"}
                      {item.is_superuser ? " • Superuser" : ""}
                    </div>
                  </div>

                  <div style={styles.actionsWrap}>
                    <select
                      value={item.role || ""}
                      onChange={(e) =>
                        handleRoleUpdate(item.id, e.target.value, item.is_superuser)
                      }
                      style={styles.smallSelect}
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {roleLabels[role]}
                        </option>
                      ))}
                    </select>

                    <label style={styles.smallCheckboxRow}>
                      <input
                        type="checkbox"
                        checked={!!item.is_superuser}
                        onChange={(e) =>
                          handleRoleUpdate(item.id, item.role, e.target.checked)
                        }
                      />
                      Superuser
                    </label>

                    <button
                      style={styles.viewButton}
                      onClick={() => handleActAsUser(item)}
                    >
                      Open as User
                    </button>

                    <button
                      style={styles.deleteButton}
                      onClick={() => handleDeleteUser(item.id, item.username)}
                      disabled={item.username === user?.username}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>No users in this category.</div>
          )}
        </div>
      )}

      {activeSection === "history" && (
        <AssignmentHistory
          title="Admin Assignment History"
          currentUser={user}
        />
      )}
    </DashboardLayout>
  );
}

const styles = {
  successBox: {
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #86efac",
    borderRadius: "12px",
    padding: "14px 16px",
    fontWeight: "700",
  },
  errorBox: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    padding: "14px 16px",
    fontWeight: "700",
  },
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
    fontWeight: "700",
    cursor: "pointer",
  },
  activeTabButton: {
    background: "#1d4ed8",
    color: "#fff",
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
    flexWrap: "wrap",
  },
  userInfo: {
    minWidth: "180px",
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
  actionsWrap: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  smallSelect: {
    padding: "8px 10px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
  },
  smallCheckboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px",
    color: "#334155",
  },
  viewButton: {
    background: "#1d4ed8",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  deleteButton: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: "700",
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
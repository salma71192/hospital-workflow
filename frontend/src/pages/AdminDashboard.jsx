import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import AssignmentHistory from "../components/AssignmentHistory";

export default function AdminDashboard({ user, onLogout, onActAsUser }) {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("create_user");

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "admin",
    is_superuser: false,
  });

  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
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

  const visibleUsers = groupedUsers[activeCategory] ?? groupedUsers.admin ?? [];

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
      localStorage.setItem("activeCategory", formData.role);
      setActiveCategory(formData.role);
      setActiveSection("manage_users");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to create user");
      setMessage("");
    }
  };

  const handleActAsUser = (selectedUser) => {
    onActAsUser(selectedUser);
    const route = selectedUser.is_superuser
      ? "/admin"
      : roleRoutes[selectedUser.role] || "/admin";
    navigate(route);
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

  const renderUserCard = (item) => (
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
          type="button"
          style={styles.viewButton}
          onClick={() => handleActAsUser(item)}
        >
          Open as User
        </button>

        <button
          type="button"
          style={styles.deleteButton}
          onClick={() => handleDeleteUser(item.id, item.username)}
          disabled={item.username === user?.username}
        >
          Delete
        </button>
      </div>
    </div>
  );

  const sidebarItems = [
    { key: "create_user", label: "Create User" },
    { key: "manage_users", label: "Manage Users" },
    { key: "history", label: "Assignment History" },
  ];

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

        {message && <div style={styles.successBox}>{message}</div>}
        {error && <div style={styles.errorBox}>{error}</div>}

        <div style={styles.layout}>
          <aside style={styles.sidebar}>
            <div style={styles.sidebarTitle}>Admin Menu</div>

            {sidebarItems.map((item) => (
              <button
                key={item.key}
                style={{
                  ...styles.sidebarButton,
                  ...(activeSection === item.key ? styles.sidebarButtonActive : {}),
                }}
                onClick={() => setActiveSection(item.key)}
              >
                {item.label}
              </button>
            ))}
          </aside>

          <main style={styles.content}>
            {activeSection === "create_user" && (
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

            {activeSection === "manage_users" && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Users by Category</h2>

                <div style={styles.tabsWrap}>
                  {categoryOrder.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryChange(category)}
                      style={{
                        ...styles.tabButton,
                        ...(activeCategory === category
                          ? styles.activeTabButton
                          : {}),
                      }}
                    >
                      {roleLabels[category]} ({groupedUsers[category]?.length || 0})
                    </button>
                  ))}
                </div>

                <div style={styles.tabPanel}>
                  <h3 style={styles.sectionTitle}>{roleLabels[activeCategory]}</h3>

                  {visibleUsers.length ? (
                    <div style={styles.userGrid}>
                      {visibleUsers.map(renderUserCard)}
                    </div>
                  ) : (
                    <div style={styles.emptyState}>
                      No users in this category.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === "history" && (
              <AssignmentHistory
                title="Admin Assignment History"
                currentUser={user}
              />
            )}
          </main>
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
    maxWidth: "1280px",
    margin: "0 auto",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "24px",
  },
  title: {
    margin: 0,
    fontSize: "34px",
    fontWeight: "800",
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
    borderRadius: "12px",
    padding: "12px 18px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  successBox: {
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #86efac",
    borderRadius: "12px",
    padding: "14px 16px",
    marginBottom: "16px",
    fontWeight: "700",
  },
  errorBox: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    padding: "14px 16px",
    marginBottom: "16px",
    fontWeight: "700",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "280px 1fr",
    gap: "22px",
    alignItems: "start",
  },
  sidebar: {
    background: "#ffffff",
    borderRadius: "22px",
    padding: "18px",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e8eef7",
    position: "sticky",
    top: "20px",
  },
  sidebarTitle: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "14px",
    padding: "4px 8px",
  },
  sidebarButton: {
    width: "100%",
    textAlign: "left",
    border: "none",
    background: "#f8fbff",
    color: "#0f172a",
    padding: "14px 14px",
    borderRadius: "14px",
    marginBottom: "10px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },
  sidebarButtonActive: {
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#fff",
    boxShadow: "0 10px 24px rgba(37, 99, 235, 0.22)",
  },
  content: {
    minWidth: 0,
  },
  card: {
    background: "#ffffff",
    borderRadius: "22px",
    padding: "24px",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e8eef7",
  },
  cardTitle: {
    margin: "0 0 18px 0",
    fontSize: "28px",
    color: "#0f172a",
    fontWeight: "800",
  },
  form: {
    display: "grid",
    gap: "14px",
  },
  input: {
    padding: "13px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#334155",
    fontWeight: "600",
  },
  button: {
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "13px 18px",
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
  tabPanel: {
    marginTop: "8px",
  },
  sectionTitle: {
    margin: "0 0 14px 0",
    fontSize: "20px",
    color: "#1e293b",
    fontWeight: "800",
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
    borderRadius: "14px",
    padding: "16px",
    flexWrap: "wrap",
  },
  userInfo: {
    minWidth: "180px",
  },
  userName: {
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: "6px",
    fontSize: "17px",
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
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
  },
  smallCheckboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px",
    color: "#334155",
    fontWeight: "600",
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
    fontWeight: "600",
  },
};
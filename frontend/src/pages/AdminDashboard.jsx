import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import DashboardLayout from "../components/DashboardLayout";
import AssignmentHistory from "../components/AssignmentHistory";
import CreateUserForm from "../components/users/CreateUserForm";
import ManageUsersPanel from "../components/users/ManageUsersPanel";

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

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    localStorage.setItem("activeCategory", category);
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
        <CreateUserForm
          formData={formData}
          setFormData={setFormData}
          roles={roles}
          roleLabels={roleLabels}
          onSubmit={handleCreateUser}
        />
      )}

      {activeSection === "manage" && (
        <ManageUsersPanel
          users={users}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          groupedUsers={groupedUsers}
          categoryOrder={categoryOrder}
          roleLabels={roleLabels}
          roles={roles}
          currentUsername={user?.username}
          onRoleUpdate={handleRoleUpdate}
          onDeleteUser={handleDeleteUser}
          onActAsUser={handleActAsUser}
        />
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
};
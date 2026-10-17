import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import DashboardLayout from "../components/DashboardLayout";
import DashboardNotice from "../components/common/DashboardNotice";
import AdminCreateSection from "../components/admin/AdminCreateSection";
import AdminManageSection from "../components/admin/AdminManageSection";
import AdminStatisticsSection from "../components/admin/AdminStatisticsSection";
import AdminRegistrationTrackerSection from "../components/admin/AdminRegistrationTrackerSection";
export default function AdminDashboard({
  user,
  onLogout,
  onActAsUser,
}) {
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
    () => localStorage.getItem("activeCategory") || "admin"
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
      setError("");
    } catch (err) {
      console.error("Failed to load users:", err);
      setError(
        err?.response?.data?.error ||
          `Failed to load users (HTTP ${
            err?.response?.status || "network error"
          }).`
      );
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
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    localStorage.setItem("activeCategory", category);
  };
  const handleSectionChange = (section) => {
    setActiveSection(section);
    setMessage("");
    setError("");
  };
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const res = await api.post("users/create-user/", formData);
      setMessage(res.data.message || "User created successfully");
      const createdRole = formData.role;
      setFormData({
        username: "",
        password: "",
        role: "admin",
        is_superuser: false,
      });
      await fetchUsers();
      setActiveSection("manage");
      handleCategoryChange(createdRole);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          `Failed to create user (HTTP ${
            err?.response?.status || "network error"
          }).`
      );
      setMessage("");
    }
  };
  const handleActAsUser = (selectedUser) => {
    if (!onActAsUser) return;
    onActAsUser(selectedUser);
    navigate(
      selectedUser.is_superuser
        ? "/admin"
        : roleRoutes[selectedUser.role] || "/admin"
    );
  };
  const handleRoleUpdate = async (
    userId,
    newRole,
    newIsSuperuser
  ) => {
    setMessage("");
    setError("");
    try {
      const res = await api.put(`users/update-user/${userId}/`, {
        role: newRole,
        is_superuser: newIsSuperuser,
      });
      setMessage(res.data.message || "User updated successfully");
      await fetchUsers();
    } catch (err) {
      setError(
        err?.response?.data?.error || "Failed to update user"
      );
      setMessage("");
      throw err;
    }
  };
  const handleDeleteUser = async (userId, username) => {
    const confirmed = window.confirm(
      `Delete user "${username}"?`
    );
    if (!confirmed) return;
    setMessage("");
    setError("");
    try {
      const res = await api.delete(
        `users/delete-user/${userId}/`
      );
      setMessage(
        res.data.message || "User deleted successfully"
      );
      await fetchUsers();
    } catch (err) {
      setError(
        err?.response?.data?.error || "Failed to delete user"
      );
      setMessage("");
    }
  };
  const renderPlaceholder = (heading, description) => (
    <section
      style={{
        width: "100%",
        minWidth: 0,
        margin: 0,
        padding: "24px",
        boxSizing: "border-box",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
      }}
    >
      <h2 style={{ marginTop: 0, color: "#1e3a8a" }}>
        {heading}
      </h2>
      <p style={{ color: "#64748b", lineHeight: 1.7 }}>
        {description}
      </p>
      <p style={{ color: "#64748b", fontSize: "14px" }}>
        This section still needs to be connected to its
        existing page or backend functionality.
      </p>
    </section>
  );
  return (
    <DashboardLayout
      title="Admin Dashboard"
      subtitle={`Welcome, ${user?.username || ""}`}
      accent="#1e3a8a"
      sidebarTitle="Admin Panel"
      sidebarItems={[
        { key: "create", label: "Create New User" },
        { key: "manage", label: "Manage Users" },
        { key: "statistics", label: "Rehab Statistics" },
        {
          key: "registration_tracker",
          label: "Registration History",
        },
      ]}
      activeSection={activeSection}
      setActiveSection={handleSectionChange}
      onLogout={onLogout}
      useAdminSidebar={true}
    >
      <div
        style={{
          display: "block",
          width: "100%",
          minWidth: 0,
          margin: 0,
          padding: "24px",
          boxSizing: "border-box",
        }}
      >
        {message && (
          <DashboardNotice type="success">
            {message}
          </DashboardNotice>
        )}
        {error && (
          <DashboardNotice type="error">
            {error}
          </DashboardNotice>
        )}
        {activeSection === "create" && (
          <AdminCreateSection
            formData={formData}
            setFormData={setFormData}
            roles={roles}
            roleLabels={roleLabels}
            onSubmit={handleCreateUser}
          />
        )}
        {activeSection === "manage" && (
          <AdminManageSection
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
        {activeSection === "statistics" && (
          <AdminStatisticsSection />
        )}
        {activeSection === "registration_tracker" && (
          <AdminRegistrationTrackerSection />
        )}
        {activeSection === "add_patient" &&
          renderPlaceholder(
            "Add New Patient",
            "This area will provide access to the patient entry function."
          )}
        {activeSection === "register_patient" &&
          renderPlaceholder(
            "Register New Patient",
            "This area will provide access to the reception registration workflow."
          )}
        {activeSection === "evaluations" &&
          renderPlaceholder(
            "Evaluations",
            "This area will provide access to rehabilitation evaluations."
          )}
      </div>
    </DashboardLayout>
  );
}
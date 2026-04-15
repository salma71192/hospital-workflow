import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

import DashboardLayout from "../components/DashboardLayout";
import DashboardNotice from "../components/common/DashboardNotice";
import AssignmentHistory from "../components/AssignmentHistory";

import AdminCreateSection from "../components/admin/AdminCreateSection";
import AdminManageSection from "../components/admin/AdminManageSection";
import AdminStatisticsSection from "../components/admin/AdminStatisticsSection";

export default function AdminDashboard({ user, onLogout, onActAsUser }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "admin",
    is_superuser: false,
  });

  const [users, setUsers] = useState([]);
  const [todayStats, setTodayStats] = useState(null);

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

  const loadTodayStatistics = async () => {
    try {
      const res = await api.get("callcenter/bookings/today-statistics/");
      setTodayStats({
        rows: res.data.rows || [],
        totals: res.data.totals || null,
      });
    } catch (err) {
      console.error("Failed to load today statistics", err);
      setTodayStats(null);
    }
  };

  useEffect(() => {
    fetchUsers();
    loadTodayStatistics();
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

      const createdRole = formData.role;

      setFormData({
        username: "",
        password: "",
        role: "admin",
        is_superuser: false,
      });

      await fetchUsers();
      setActiveSection("manage");
      setActiveCategory(createdRole);
      localStorage.setItem("activeCategory", createdRole);
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
        { key: "statistics", label: "Statistics Tracker" },
        { key: "history", label: "History" },
      ]}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      onLogout={onLogout}
    >
      {message ? <DashboardNotice type="success">{message}</DashboardNotice> : null}
      {error ? <DashboardNotice type="error">{error}</DashboardNotice> : null}

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
        <AdminStatisticsSection stats={todayStats} />
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
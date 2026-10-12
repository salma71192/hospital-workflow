
import React, { useState } from "react";

export default function ManageUsersPanel({
  users = [],
  activeCategory,
  onCategoryChange,
  groupedUsers = {},
  categoryOrder = [],
  roleLabels = {},
  roles = [],
  currentUsername,
  onRoleUpdate,
  onDeleteUser,
  onActAsUser,
  onEditUser,
  onSetUserActive,
  onChangeUserPassword,
}) {
  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState({
    username: "",
    role: "",
    is_superuser: false,
  });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  const categoryUsers = groupedUsers[activeCategory] ?? users;

  const visibleUsers = categoryUsers.filter((user) => {
    if (statusFilter === "active") {
      return user.is_active !== false;
    }

    if (statusFilter === "inactive") {
      return user.is_active === false;
    }

    return true;
  });

  const startEditing = (item) => {
    setEditingUserId(item.id);
    setEditForm({
      username: item.username || "",
      role: item.role || "",
      is_superuser: !!item.is_superuser,
    });
    setNewPassword("");
    setEditError("");
  };

  const cancelEditing = () => {
    setEditingUserId(null);
    setEditForm({
      username: "",
      role: "",
      is_superuser: false,
    });
    setNewPassword("");
    setEditError("");
    setSaving(false);
    setPasswordSaving(false);
  };

  const handleSave = async (item) => {
    const username = editForm.username.trim();

    if (!username) {
      setEditError("Username cannot be empty.");
      return;
    }

    if (!editForm.role) {
      setEditError("Please select a role.");
      return;
    }

    if (typeof onEditUser !== "function") {
      setEditError(
        "The save handler is not connected. Check AdminDashboard.jsx."
      );
      return;
    }

    setSaving(true);
    setEditError("");

    try {
      await onEditUser(item.id, {
        username,
        role: editForm.role,
        is_superuser: editForm.is_superuser,
      });

      cancelEditing();
    } catch (error) {
      setEditError(
        error?.response?.data?.error ||
          error?.message ||
          "Could not save changes. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item) => {
    if (typeof onSetUserActive !== "function") {
      setEditError(
        "Account status handler is not connected. Update AdminDashboard.jsx and AdminManageSection.jsx."
      );
      return;
    }

    const nextStatus = item.is_active === false;

    if (
      !nextStatus &&
      item.username === currentUsername
    ) {
      setEditError("You cannot deactivate your own account.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to ${
        nextStatus ? "activate" : "deactivate"
      } the account "${item.username}"?`
    );

    if (!confirmed) return;

    setEditError("");

    try {
      await onSetUserActive(item.id, nextStatus);
    } catch (error) {
      setEditError(
        error?.response?.data?.error ||
          error?.message ||
          "Could not update account status."
      );
    }
  };

  const handlePasswordChange = async (item) => {
    if (!newPassword) {
      setEditError("Please enter a new password.");
      return;
    }

    if (typeof onChangeUserPassword !== "function") {
      setEditError(
        "Password handler is not connected. Update AdminDashboard.jsx and AdminManageSection.jsx."
      );
      return;
    }

    setPasswordSaving(true);
    setEditError("");

    try {
      await onChangeUserPassword(item.id, newPassword);
      setNewPassword("");
    } catch (error) {
      setEditError(
        error?.response?.data?.error ||
          error?.message ||
          "Could not change the password."
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  const countUsers = (category) =>
    (groupedUsers[category] ?? []).filter((user) => {
      if (statusFilter === "active") {
        return user.is_active !== false;
      }

      if (statusFilter === "inactive") {
        return user.is_active === false;
      }

      return true;
    }).length;

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Manage Users</h2>

      {/* User categories */}
      <div style={styles.tabsWrap}>
        {categoryOrder.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onCategoryChange(category)}
            style={{
              ...styles.tabButton,
              ...(activeCategory === category
                ? styles.activeTabButton
                : {}),
            }}
          >
            {roleLabels[category] || category} (
            {countUsers(category)})
          </button>
        ))}
      </div>

      {/* Account status filters */}
      <div style={styles.filterWrap}>
        {[
          { value: "active", label: "Active Users" },
          { value: "inactive", label: "Inactive Users" },
          { value: "all", label: "All Users" },
        ].map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatusFilter(filter.value)}
            style={{
              ...styles.filterButton,
              ...(statusFilter === filter.value
                ? styles.activeFilterButton
                : {}),
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {visibleUsers.length > 0 ? (
        <div style={styles.userGrid}>
          {visibleUsers.map((item) => {
            const isEditing = editingUserId === item.id;
            const isActive = item.is_active !== false;

            return (
              <div key={item.id} style={styles.userCard}>
                <div style={styles.userInfo}>
                  {isEditing ? (
                    <div style={styles.editFields}>
                      <label style={styles.fieldLabel}>
                        Username
                        <input
                          type="text"
                          value={editForm.username}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              username: e.target.value,
                            }))
                          }
                          style={styles.textInput}
                          autoComplete="off"
                        />
                      </label>

                      <label style={styles.fieldLabel}>
                        Role
                        <select
                          value={editForm.role}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              role: e.target.value,
                            }))
                          }
                          style={styles.smallSelect}
                        >
                          {roles.map((role) => (
                            <option key={role} value={role}>
                              {roleLabels[role] || role}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label style={styles.smallCheckboxRow}>
                        <input
                          type="checkbox"
                          checked={editForm.is_superuser}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              is_superuser: e.target.checked,
                            }))
                          }
                        />
                        Superuser
                      </label>

                      <div style={styles.statusRow}>
                        <span style={styles.fieldLabel}>
                          Account Status
                        </span>

                        <span
                          style={{
                            ...styles.statusBadge,
                            ...(isActive
                              ? styles.activeStatusBadge
                              : styles.inactiveStatusBadge),
                          }}
                        >
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <button
                        type="button"
                        style={
                          isActive
                            ? styles.deleteButton
                            : styles.activateButton
                        }
                        onClick={() => handleToggleActive(item)}
                      >
                        {isActive
                          ? "Deactivate Account"
                          : "Activate Account"}
                      </button>

                      <div style={styles.passwordSection}>
                        <div style={styles.sectionTitle}>
                          Change Password
                        </div>

                        <label style={styles.fieldLabel}>
                          New Password
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) =>
                              setNewPassword(e.target.value)
                            }
                            style={styles.textInput}
                            placeholder="Enter a new password"
                            autoComplete="new-password"
                          />
                        </label>

                        <button
                          type="button"
                          style={{
                            ...styles.passwordButton,
                            ...(passwordSaving
                              ? styles.disabledButton
                              : {}),
                          }}
                          onClick={() =>
                            handlePasswordChange(item)
                          }
                          disabled={passwordSaving}
                        >
                          {passwordSaving
                            ? "Updating Password..."
                            : "Change Password"}
                        </button>
                      </div>

                      {editError ? (
                        <div role="alert" style={styles.errorText}>
                          {editError}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <>
                      <div style={styles.userName}>
                        {item.username}
                        {item.is_active === false
                          ? " (Inactive)"
                          : ""}
                      </div>

                      <div style={styles.userMeta}>
                        Role:{" "}
                        {roleLabels[item.role] ||
                          item.role ||
                          "No role"}
                        {item.is_superuser ? " • Superuser" : ""}
                      </div>

                      <div style={styles.statusRow}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            ...(isActive
                              ? styles.activeStatusBadge
                              : styles.inactiveStatusBadge),
                          }}
                        >
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div style={styles.actionsWrap}>
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        style={{
                          ...styles.saveButton,
                          ...(saving ? styles.disabledButton : {}),
                        }}
                        onClick={() => handleSave(item)}
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>

                      <button
                        type="button"
                        style={styles.cancelButton}
                        onClick={cancelEditing}
                        disabled={saving || passwordSaving}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        style={styles.editButton}
                        onClick={() => startEditing(item)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        style={styles.viewButton}
                        onClick={() => onActAsUser?.(item)}
                      >
                        Open as User
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={styles.emptyState}>
          No {statusFilter === "all" ? "" : statusFilter + " "}users
          in this category.
        </div>
      )}
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
  tabsWrap: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "16px",
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
  filterWrap: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "20px",
  },
  filterButton: {
    background: "#f1f5f9",
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "9px 12px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },
  activeFilterButton: {
    background: "#0f766e",
    color: "#fff",
    borderColor: "#0f766e",
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
    flex: "1 1 220px",
  },
  userName: {
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "6px",
    overflowWrap: "anywhere",
  },
  userMeta: {
    color: "#64748b",
    fontSize: "14px",
  },
  editFields: {
    display: "grid",
    gap: "12px",
    width: "100%",
    maxWidth: "360px",
  },
  fieldLabel: {
    display: "grid",
    gap: "6px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#334155",
  },
  textInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "9px 10px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
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
    background: "#fff",
  },
  smallCheckboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px",
    color: "#334155",
  },
  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  statusBadge: {
    display: "inline-block",
    borderRadius: "999px",
    padding: "5px 10px",
    fontSize: "12px",
    fontWeight: "700",
  },
  activeStatusBadge: {
    color: "#166534",
    background: "#dcfce7",
  },
  inactiveStatusBadge: {
    color: "#991b1b",
    background: "#fee2e2",
  },
  passwordSection: {
    display: "grid",
    gap: "10px",
    padding: "12px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
  },
  sectionTitle: {
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: "800",
  },
  editButton: {
    background: "#0f766e",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  saveButton: {
    background: "#15803d",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  cancelButton: {
    background: "#e2e8f0",
    color: "#334155",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: "700",
    cursor: "pointer",
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
  activateButton: {
    background: "#15803d",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  passwordButton: {
    background: "#4338ca",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  disabledButton: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  errorText: {
    color: "#b91c1c",
    fontSize: "13px",
    lineHeight: "1.4",
  },
  emptyState: {
    padding: "18px",
    borderRadius: "12px",
    background: "#f8fafc",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
  },
};

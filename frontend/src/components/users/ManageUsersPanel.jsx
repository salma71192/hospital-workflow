
import React, { useMemo, useState } from "react";

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
  const [successMessage, setSuccessMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  const categoryUsers = groupedUsers[activeCategory] ?? users;

  const visibleUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return categoryUsers
      .filter((user) => {
        const isActive = user.is_active !== false;

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && isActive) ||
          (statusFilter === "inactive" && !isActive);

        const matchesSearch =
          !query ||
          (user.username || "").toLowerCase().includes(query) ||
          (user.email || "").toLowerCase().includes(query) ||
          (roleLabels[user.role] || user.role || "")
            .toLowerCase()
            .includes(query);

        return matchesStatus && matchesSearch;
      })
      .sort((a, b) =>
        (a.username || "").localeCompare(b.username || "", undefined, {
          sensitivity: "base",
        })
      );
  }, [categoryUsers, statusFilter, searchTerm, roleLabels]);

  const clearMessages = () => {
    setEditError("");
    setSuccessMessage("");
  };

  const startEditing = (item) => {
    clearMessages();
    setEditingUserId(item.id);
    setEditForm({
      username: item.username || "",
      role: item.role || "",
      is_superuser: !!item.is_superuser,
    });
    setNewPassword("");
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
  };

  const handleSave = async (item) => {
    const username = editForm.username.trim();

    clearMessages();

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

    try {
      await onEditUser(item.id, {
        username,
        role: editForm.role,
        is_superuser: editForm.is_superuser,
      });

      // Reset the form before showing the success message.
      cancelEditing();
      setSuccessMessage("User changes saved successfully.");
    } catch (error) {
      setEditError(
        error?.response?.data?.error ||
          error?.response?.data?.detail ||
          error?.message ||
          "Could not save changes. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item) => {
    clearMessages();

    if (typeof onSetUserActive !== "function") {
      setEditError(
        "Account status handler is not connected. Check AdminDashboard.jsx and AdminManageSection.jsx."
      );
      return;
    }

    const nextStatus = item.is_active === false;

    if (!nextStatus && item.username === currentUsername) {
      setEditError("You cannot deactivate your own account.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to ${
        nextStatus ? "activate" : "deactivate"
      } the account "${item.username}"?`
    );

    if (!confirmed) return;

    try {
      await onSetUserActive(item.id, nextStatus);
      setSuccessMessage(
        `Account "${item.username}" ${
          nextStatus ? "activated" : "deactivated"
        } successfully.`
      );
    } catch (error) {
      setEditError(
        error?.response?.data?.error ||
          error?.response?.data?.detail ||
          error?.message ||
          "Could not update account status."
      );
    }
  };

  const handlePasswordChange = async (item) => {
    clearMessages();

    if (!newPassword.trim()) {
      setEditError("Please enter a new password.");
      return;
    }

    if (typeof onChangeUserPassword !== "function") {
      setEditError(
        "Password handler is not connected. Check AdminDashboard.jsx and AdminManageSection.jsx."
      );
      return;
    }

    setPasswordSaving(true);

    try {
      await onChangeUserPassword(item.id, newPassword);
      setNewPassword("");
      setSuccessMessage(
        `Password changed successfully for "${item.username}".`
      );
    } catch (error) {
      setEditError(
        error?.response?.data?.error ||
          error?.response?.data?.detail ||
          error?.message ||
          "Could not change the password."
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  const countUsers = (category) =>
    (groupedUsers[category] ?? []).filter((user) => {
      if (statusFilter === "active") return user.is_active !== false;
      if (statusFilter === "inactive") return user.is_active === false;
      return true;
    }).length;

  const activeCount = categoryUsers.filter(
    (user) => user.is_active !== false
  ).length;

  const inactiveCount = categoryUsers.length - activeCount;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>ADMINISTRATION</div>
          <h2 style={styles.pageTitle}>Manage Users</h2>
          <p style={styles.subtitle}>
            Search accounts, manage roles, and control user access.
          </p>
        </div>

        <div style={styles.totalBadge}>
          <span style={styles.totalNumber}>{categoryUsers.length}</span>
          <span style={styles.totalLabel}>Accounts</span>
        </div>
      </div>

      {successMessage && (
        <div role="status" style={styles.successBanner}>
          <span style={styles.messageIcon}>✓</span>
          <span>{successMessage}</span>
          <button
            type="button"
            aria-label="Dismiss success message"
            onClick={() => setSuccessMessage("")}
            style={styles.dismissButton}
          >
            ×
          </button>
        </div>
      )}

      {editError && (
        <div role="alert" style={styles.errorBanner}>
          <span style={styles.messageIcon}>!</span>
          <span>{editError}</span>
          <button
            type="button"
            aria-label="Dismiss error message"
            onClick={() => setEditError("")}
            style={styles.dismissButton}
          >
            ×
          </button>
        </div>
      )}

      {/* Role/category dropdown and search */}
      <div style={styles.toolbar}>
        <div style={styles.controlGroup}>
          <label htmlFor="user-role-filter" style={styles.label}>
            Filter by role
          </label>
          <select
            id="user-role-filter"
            value={activeCategory || ""}
            onChange={(event) => onCategoryChange?.(event.target.value)}
            style={styles.select}
          >
            {categoryOrder.map((category) => (
              <option key={category} value={category}>
                {roleLabels[category] || category} (
                {countUsers(category)})
              </option>
            ))}
          </select>
        </div>

        <div style={styles.searchGroup}>
          <label htmlFor="user-search" style={styles.label}>
            Search users
          </label>
          <div style={styles.searchBox}>
            <span aria-hidden="true" style={styles.searchIcon}>
              ⌕
            </span>
            <input
              id="user-search"
              type="search"
              placeholder="Search username, email, or role..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              style={styles.searchInput}
            />
            {searchTerm && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchTerm("")}
                style={styles.clearSearchButton}
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status filter */}
      <div style={styles.filterPanel}>
        <div style={styles.filterHeading}>Account status</div>
        <div style={styles.filterButtons}>
          {[
            {
              value: "active",
              label: "Active",
              count: activeCount,
            },
            {
              value: "inactive",
              label: "Inactive",
              count: inactiveCount,
            },
            {
              value: "all",
              label: "All users",
              count: categoryUsers.length,
            },
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
              <span
                style={{
                  ...styles.filterCount,
                  ...(statusFilter === filter.value
                    ? styles.activeFilterCount
                    : {}),
                }}
              >
                {filter.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={styles.resultsBar}>
        <span>
          Showing <strong>{visibleUsers.length}</strong> of{" "}
          <strong>{categoryUsers.length}</strong> users
        </span>
        <span style={styles.sortNote}>Sorted alphabetically</span>
      </div>

      {visibleUsers.length > 0 ? (
        <div style={styles.userGrid}>
          {visibleUsers.map((item) => {
            const isEditing = editingUserId === item.id;
            const isActive = item.is_active !== false;

            return (
              <article key={item.id} style={styles.userCard}>
                <div style={styles.userCardHeader}>
                  <div style={styles.avatar}>
                    {(item.username || "?").charAt(0).toUpperCase()}
                  </div>

                  <div style={styles.userIdentity}>
                    <div style={styles.userName}>
                      {item.username || "Unnamed user"}
                    </div>
                    {item.email && (
                      <div style={styles.userEmail}>{item.email}</div>
                    )}
                    <div style={styles.badgeRow}>
                      <span style={styles.roleBadge}>
                        {roleLabels[item.role] || item.role || "No role"}
                      </span>
                      {item.is_superuser && (
                        <span style={styles.superuserBadge}>
                          Superuser
                        </span>
                      )}
                      <span
                        style={{
                          ...styles.statusBadge,
                          ...(isActive
                            ? styles.activeStatusBadge
                            : styles.inactiveStatusBadge),
                        }}
                      >
                        <span style={styles.statusDot} />
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div style={styles.editPanel}>
                    <div style={styles.editPanelTitle}>
                      Edit account details
                    </div>

                    <div style={styles.formGrid}>
                      <label style={styles.fieldLabel}>
                        Username
                        <input
                          type="text"
                          value={editForm.username}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              username: event.target.value,
                            }))
                          }
                          style={styles.input}
                          autoComplete="off"
                        />
                      </label>

                      <label style={styles.fieldLabel}>
                        Role
                        <select
                          value={editForm.role}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              role: event.target.value,
                            }))
                          }
                          style={styles.select}
                        >
                          {roles.map((role) => (
                            <option key={role} value={role}>
                              {roleLabels[role] || role}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label style={styles.checkboxRow}>
                      <input
                        type="checkbox"
                        checked={editForm.is_superuser}
                        onChange={(event) =>
                          setEditForm((prev) => ({
                            ...prev,
                            is_superuser: event.target.checked,
                          }))
                        }
                      />
                      <span>
                        <strong>Superuser privileges</strong>
                        <small style={styles.helperText}>
                          Grants elevated administrative access.
                        </small>
                      </span>
                    </label>

                    <div style={styles.statusManagement}>
                      <div>
                        <div style={styles.fieldLabel}>Account status</div>
                        <div style={styles.helperText}>
                          Use the button to activate or deactivate this account.
                        </div>
                      </div>

                      <button
                        type="button"
                        style={
                          isActive
                            ? styles.dangerButton
                            : styles.activateButton
                        }
                        onClick={() => handleToggleActive(item)}
                      >
                        {isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>

                    <div style={styles.passwordSection}>
                      <div style={styles.editPanelTitle}>
                        Change password
                      </div>

                      <label style={styles.fieldLabel}>
                        New password
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(event) =>
                            setNewPassword(event.target.value)
                          }
                          style={styles.input}
                          placeholder="Enter a new password"
                          autoComplete="new-password"
                        />
                      </label>

                      <div>
                        <button
                          type="button"
                          style={{
                            ...styles.passwordButton,
                            ...(passwordSaving ? styles.disabledButton : {}),
                          }}
                          onClick={() => handlePasswordChange(item)}
                          disabled={passwordSaving}
                        >
                          {passwordSaving
                            ? "Updating password..."
                            : "Update password"}
                        </button>
                      </div>
                    </div>

                    <div style={styles.formActions}>
                      <button
                        type="button"
                        style={{
                          ...styles.saveButton,
                          ...(saving ? styles.disabledButton : {}),
                        }}
                        onClick={() => handleSave(item)}
                        disabled={saving || passwordSaving}
                      >
                        {saving ? "Saving..." : "Save changes"}
                      </button>

                      <button
                        type="button"
                        style={styles.cancelButton}
                        onClick={cancelEditing}
                        disabled={saving || passwordSaving}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {!isEditing && (
                  <div style={styles.cardActions}>
                    <button
                      type="button"
                      style={styles.editButton}
                      onClick={() => startEditing(item)}
                    >
                      Edit user
                    </button>

                    <button
                      type="button"
                      style={styles.viewButton}
                      onClick={() => onActAsUser?.(item)}
                    >
                      Open as user
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>⌕</div>
          <h3 style={styles.emptyTitle}>No users found</h3>
          <p style={styles.emptyText}>
            Try another search term or change the role and status filters.
          </p>
          {(searchTerm || statusFilter !== "active") && (
            <button
              type="button"
              style={styles.resetButton}
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    display: "grid",
    gap: "20px",
    color: "#0f172a",
    fontFamily: "inherit",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
  },
  eyebrow: {
    color: "#2563eb",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "1.4px",
    marginBottom: "7px",
  },
  pageTitle: {
    margin: "0 0 7px",
    fontSize: "26px",
    fontWeight: "800",
    letterSpacing: "-0.6px",
  },
  subtitle: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.5,
  },
  totalBadge: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 16px",
    border: "1px solid #dbeafe",
    borderRadius: "12px",
    background: "#eff6ff",
  },
  totalNumber: {
    fontSize: "25px",
    lineHeight: 1,
    fontWeight: "800",
    color: "#1d4ed8",
  },
  totalLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#1e40af",
  },
  successBanner: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 14px",
    border: "1px solid #bbf7d0",
    borderRadius: "10px",
    background: "#f0fdf4",
    color: "#166534",
    fontSize: "14px",
  },
  errorBanner: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 14px",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    background: "#fef2f2",
    color: "#991b1b",
    fontSize: "14px",
  },
  messageIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    fontWeight: "800",
  },
  dismissButton: {
    marginLeft: "auto",
    border: "none",
    background: "transparent",
    color: "inherit",
    cursor: "pointer",
    fontSize: "20px",
    lineHeight: 1,
  },
  toolbar: {
    display: "grid",
    gridTemplateColumns: "minmax(190px, 0.7fr) minmax(260px, 1.5fr)",
    gap: "16px",
    padding: "18px",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    background: "#fff",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
  },
  controlGroup: {
    display: "grid",
    gap: "7px",
    alignContent: "start",
  },
  searchGroup: {
    display: "grid",
    gap: "7px",
    alignContent: "start",
  },
  label: {
    display: "block",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "700",
  },
  select: {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    padding: "11px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "9px",
    background: "#fff",
    color: "#0f172a",
    fontSize: "14px",
    outlineColor: "#93c5fd",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    minWidth: 0,
    padding: "0 11px",
    border: "1px solid #cbd5e1",
    borderRadius: "9px",
    background: "#fff",
  },
  searchIcon: {
    color: "#64748b",
    fontSize: "23px",
    lineHeight: 1,
  },
  searchInput: {
    width: "100%",
    minWidth: 0,
    padding: "11px 0",
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "14px",
    color: "#0f172a",
  },
  clearSearchButton: {
    border: "none",
    background: "transparent",
    color: "#64748b",
    cursor: "pointer",
    fontSize: "20px",
  },
  filterPanel: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
    padding: "14px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    background: "#f8fafc",
  },
  filterHeading: {
    color: "#334155",
    fontSize: "13px",
    fontWeight: "700",
  },
  filterButtons: {
    display: "flex",
    gap: "7px",
    flexWrap: "wrap",
  },
  filterButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "7px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    background: "#fff",
    color: "#475569",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
  },
  activeFilterButton: {
    borderColor: "#2563eb",
    background: "#eff6ff",
    color: "#1d4ed8",
  },
  filterCount: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "20px",
    height: "20px",
    padding: "0 3px",
    borderRadius: "6px",
    background: "#f1f5f9",
    color: "#475569",
    fontSize: "11px",
    fontWeight: "800",
  },
  activeFilterCount: {
    background: "#dbeafe",
    color: "#1d4ed8",
  },
  resultsBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    flexWrap: "wrap",
    color: "#64748b",
    fontSize: "13px",
  },
  sortNote: {
    color: "#94a3b8",
    fontSize: "12px",
  },
  userGrid: {
    display: "grid",
    gap: "12px",
  },
  userCard: {
    minWidth: 0,
    padding: "18px",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    background: "#fff",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.025)",
  },
  userCardHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "13px",
  },
  avatar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: "43px",
    height: "43px",
    borderRadius: "12px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "17px",
    fontWeight: "800",
  },
  userIdentity: {
    minWidth: 0,
    flex: 1,
  },
  userName: {
    marginBottom: "4px",
    color: "#0f172a",
    fontSize: "15px",
    fontWeight: "800",
    overflowWrap: "anywhere",
  },
  userEmail: {
    marginBottom: "10px",
    color: "#64748b",
    fontSize: "13px",
    overflowWrap: "anywhere",
  },
  badgeRow: {
    display: "flex",
    gap: "7px",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: "9px",
  },
  roleBadge: {
    padding: "5px 9px",
    borderRadius: "7px",
    background: "#f1f5f9",
    color: "#334155",
    fontSize: "12px",
    fontWeight: "700",
  },
  superuserBadge: {
    padding: "5px 9px",
    borderRadius: "7px",
    background: "#f3e8ff",
    color: "#7e22ce",
    fontSize: "12px",
    fontWeight: "700",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "5px 9px",
    borderRadius: "7px",
    fontSize: "12px",
    fontWeight: "700",
  },
  activeStatusBadge: {
    background: "#dcfce7",
    color: "#166534",
  },
  inactiveStatusBadge: {
    background: "#fee2e2",
    color: "#991b1b",
  },
  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "currentColor",
  },
  cardActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "16px",
    paddingTop: "14px",
    borderTop: "1px solid #f1f5f9",
  },
  editButton: {
    padding: "9px 13px",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },
  viewButton: {
    padding: "9px 13px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "#fff",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },
  editPanel: {
    display: "grid",
    gap: "16px",
    marginTop: "18px",
    padding: "18px",
    border: "1px solid #dbeafe",
    borderRadius: "12px",
    background: "#f8fbff",
  },
  editPanelTitle: {
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: "800",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "14px",
  },
  fieldLabel: {
    display: "grid",
    gap: "7px",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "700",
  },
  input: {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    padding: "10px 11px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "#fff",
    color: "#0f172a",
    fontSize: "14px",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "9px",
    color: "#334155",
    fontSize: "13px",
  },
  helperText: {
    display: "block",
    marginTop: "4px",
    color: "#64748b",
    fontSize: "12px",
    lineHeight: 1.5,
    fontWeight: "400",
  },
  statusManagement: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    padding: "13px",
    border: "1px solid #e2e8f0",
    borderRadius: "9px",
    background: "#fff",
  },
  dangerButton: {
    padding: "9px 12px",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    background: "#fef2f2",
    color: "#b91c1c",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },
  activateButton: {
    padding: "9px 12px",
    border: "1px solid #bbf7d0",
    borderRadius: "8px",
    background: "#f0fdf4",
    color: "#166534",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },
  passwordSection: {
    display: "grid",
    gap: "12px",
    padding: "14px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    background: "#fff",
  },
  passwordButton: {
    padding: "9px 13px",
    border: "1px solid #c7d2fe",
    borderRadius: "8px",
    background: "#eef2ff",
    color: "#4338ca",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },
  formActions: {
    display: "flex",
    gap: "9px",
    flexWrap: "wrap",
    paddingTop: "4px",
  },
  saveButton: {
    padding: "10px 15px",
    border: "1px solid #15803d",
    borderRadius: "8px",
    background: "#15803d",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },
  cancelButton: {
    padding: "10px 15px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "#fff",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },
  disabledButton: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  emptyState: {
    display: "grid",
    justifyItems: "center",
    gap: "9px",
    padding: "40px 20px",
    border: "1px dashed #cbd5e1",
    borderRadius: "14px",
    background: "#f8fafc",
    textAlign: "center",
  },
  emptyIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "46px",
    height: "46px",
    borderRadius: "50%",
    background: "#e2e8f0",
    color: "#475569",
    fontSize: "27px",
  },
  emptyTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "16px",
  },
  emptyText: {
    maxWidth: "360px",
    margin: 0,
    color: "#64748b",
    fontSize: "13px",
    lineHeight: 1.6,
  },
  resetButton: {
    marginTop: "6px",
    padding: "9px 13px",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },
};


import React, { useMemo, useState } from "react";

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "9px 11px",
  border: "1px solid #d1d5db",
  borderRadius: "7px",
  fontSize: "14px",
  background: "#fff",
};

const buttonStyle = {
  padding: "8px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "7px",
  background: "#fff",
  cursor: "pointer",
  fontSize: "13px",
};

const primaryButtonStyle = {
  ...buttonStyle,
  color: "#fff",
  background: "#2563eb",
  borderColor: "#2563eb",
};

const cardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "16px",
  background: "#fff",
};

function getRole(user) {
  return user?.role || (user?.is_superuser ? "admin" : "user");
}

function getRoleLabel(role) {
  return String(role || "user")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getUsername(user) {
  return user?.username || user?.email || `User ${user?.id ?? ""}`;
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

export default function ManageUsersPanel({
  users = [],
  roles = [],
  currentUser,
  currentUserId,
  onEditUser,
  onDeleteUser,
  onSetUserActive,
  onChangeUserPassword,
  onRoleUpdate,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");

  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState({
    username: "",
    role: "user",
    is_superuser: false,
    is_active: true,
  });

  const [passwordUserId, setPasswordUserId] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const roleOptions = useMemo(() => {
    const values = new Set(
      roles
        .map((role) =>
          typeof role === "string" ? role : role?.value || role?.name
        )
        .filter(Boolean)
    );

    users.forEach((user) => values.add(getRole(user)));

    return [...values].sort((a, b) =>
      getRoleLabel(a).localeCompare(getRoleLabel(b))
    );
  }, [roles, users]);

  const roleCounts = useMemo(() => {
    const counts = { all: users.length };

    users.forEach((user) => {
      const role = getRole(user);
      counts[role] = (counts[role] || 0) + 1;
    });

    return counts;
  }, [users]);

  const filteredUsers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return [...users]
      .filter((user) => {
        const matchesSearch =
          !search ||
          getUsername(user).toLowerCase().includes(search) ||
          String(user?.email || "").toLowerCase().includes(search);

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && Boolean(user?.is_active)) ||
          (statusFilter === "inactive" && !user?.is_active);

        const matchesRole =
          selectedRole === "all" || getRole(user) === selectedRole;

        return matchesSearch && matchesStatus && matchesRole;
      })
      .sort((a, b) =>
        getUsername(a).localeCompare(getUsername(b), undefined, {
          sensitivity: "base",
        })
      );
  }, [users, searchTerm, statusFilter, selectedRole]);

  function clearMessages() {
    setSuccessMessage("");
    setErrorMessage("");
  }

  function startEditing(user) {
    clearMessages();
    setEditingUserId(user.id);
    setEditForm({
      username: user.username || "",
      role: getRole(user),
      is_superuser: Boolean(user.is_superuser),
      is_active: Boolean(user.is_active),
    });
  }

  function cancelEditing() {
    setEditingUserId(null);
    setEditForm({
      username: "",
      role: "user",
      is_superuser: false,
      is_active: true,
    });
  }

  function handleFormChange(event) {
    const { name, value, type, checked } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSave(user) {
    clearMessages();

    const username = editForm.username.trim();

    if (!username) {
      setErrorMessage("Username is required.");
      return;
    }

    if (typeof onEditUser !== "function") {
      setErrorMessage("The user profile update handler is not configured.");
      return;
    }

    const statusChanged =
      Boolean(user.is_active) !== Boolean(editForm.is_active);

    const isCurrentUser =
      String(user.id) === String(currentUserId ?? currentUser?.id);

    if (statusChanged && isCurrentUser && !editForm.is_active) {
      setErrorMessage("You cannot deactivate your own account.");
      return;
    }

    setSaving(true);

    try {
      await onEditUser(user.id, {
        username,
        role: editForm.role,
        is_superuser: Boolean(editForm.is_superuser),
      });

      if (statusChanged) {
        if (typeof onSetUserActive !== "function") {
          throw new Error(
            "The account-status update handler is not configured."
          );
        }

        await onSetUserActive(user.id, Boolean(editForm.is_active));
      }

      // Reset the form first so the success message is not cleared.
      cancelEditing();
      setSuccessMessage("User changes saved successfully.");
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Unable to save the user changes.")
      );
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(user) {
    clearMessages();

    if (!newPassword.trim()) {
      setErrorMessage("Please enter a new password.");
      return;
    }

    if (typeof onChangeUserPassword !== "function") {
      setErrorMessage("The password-change handler is not configured.");
      return;
    }

    setChangingPassword(true);

    try {
      await onChangeUserPassword(user.id, newPassword);

      setNewPassword("");
      setPasswordUserId(null);
      setSuccessMessage("Password changed successfully.");
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Unable to change the password.")
      );
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleToggleStatus(user) {
    clearMessages();

    const isCurrentUser =
      String(user.id) === String(currentUserId ?? currentUser?.id);

    if (isCurrentUser && user.is_active) {
      setErrorMessage("You cannot deactivate your own account.");
      return;
    }

    if (typeof onSetUserActive !== "function") {
      setErrorMessage("The account-status update handler is not configured.");
      return;
    }

    try {
      await onSetUserActive(user.id, !user.is_active);
      setSuccessMessage(
        `Account ${user.is_active ? "deactivated" : "activated"} successfully.`
      );
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Unable to update the account status.")
      );
    }
  }

  return (
    <section style={{ display: "grid", gap: "18px" }}>
      <div>
        <h2 style={{ margin: "0 0 6px", fontSize: "22px" }}>
          Manage Users
        </h2>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
          Search accounts, organize users by role, and manage account settings.
        </p>
      </div>

      {successMessage && (
        <div
          role="status"
          style={{
            padding: "11px 14px",
            borderRadius: "7px",
            color: "#166534",
            background: "#dcfce7",
            border: "1px solid #bbf7d0",
          }}
        >
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          style={{
            padding: "11px 14px",
            borderRadius: "7px",
            color: "#991b1b",
            background: "#fee2e2",
            border: "1px solid #fecaca",
          }}
        >
          {errorMessage}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          style={{
            ...buttonStyle,
            ...(selectedRole === "all"
              ? primaryButtonStyle
              : {}),
          }}
          onClick={() => setSelectedRole("all")}
        >
          All Roles ({roleCounts.all || 0})
        </button>

        {roleOptions.map((role) => (
          <button
            key={role}
            type="button"
            style={{
              ...buttonStyle,
              ...(selectedRole === role ? primaryButtonStyle : {}),
            }}
            onClick={() => setSelectedRole(role)}
          >
            {getRoleLabel(role)} ({roleCounts[role] || 0})
          </button>
        ))}
      </div>

      <div
        style={{
          ...cardStyle,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
        }}
      >
        <div>
          <label
            htmlFor="user-search"
            style={{
              display: "block",
              marginBottom: "6px",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Search users
          </label>
          <input
            id="user-search"
            type="search"
            placeholder="Search by username or email"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label
            htmlFor="user-status-filter"
            style={{
              display: "block",
              marginBottom: "6px",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Account status
          </label>
          <select
            id="user-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={inputStyle}
          >
            <option value="all">All accounts</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>
      </div>

      <div style={{ color: "#6b7280", fontSize: "13px" }}>
        Showing {filteredUsers.length} of {users.length} users. Users are
        sorted alphabetically by username.
      </div>

      {filteredUsers.length === 0 ? (
        <div style={{ ...cardStyle, color: "#6b7280" }}>
          No users match your search or selected filters.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {filteredUsers.map((user) => {
            const isEditing = editingUserId === user.id;
            const isChangingPassword = passwordUserId === user.id;

            return (
              <article key={user.id} style={cardStyle}>
                {!isEditing ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "14px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: "1 1 220px" }}>
                      <h3
                        style={{
                          margin: "0 0 5px",
                          fontSize: "16px",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {getUsername(user)}
                      </h3>

                      {user.email && (
                        <p
                          style={{
                            margin: "0 0 9px",
                            color: "#6b7280",
                            fontSize: "13px",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {user.email}
                        </p>
                      )}

                      <div
                        style={{
                          display: "flex",
                          gap: "7px",
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "20px",
                            background: "#eff6ff",
                            color: "#1d4ed8",
                            fontSize: "12px",
                          }}
                        >
                          {getRoleLabel(getRole(user))}
                        </span>

                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "20px",
                            background: user.is_active
                              ? "#dcfce7"
                              : "#fee2e2",
                            color: user.is_active ? "#166534" : "#991b1b",
                            fontSize: "12px",
                          }}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </span>

                        {user.is_superuser && (
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: "20px",
                              background: "#f3e8ff",
                              color: "#6b21a8",
                              fontSize: "12px",
                            }}
                          >
                            Superuser
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "7px",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        type="button"
                        style={buttonStyle}
                        onClick={() => startEditing(user)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        style={buttonStyle}
                        onClick={() => {
                          clearMessages();
                          setPasswordUserId(
                            isChangingPassword ? null : user.id
                          );
                          setNewPassword("");
                        }}
                      >
                        {isChangingPassword ? "Cancel Password" : "Change Password"}
                      </button>

                      <button
                        type="button"
                        style={buttonStyle}
                        onClick={() => handleToggleStatus(user)}
                      >
                        {user.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      handleSave(user);
                    }}
                    style={{ display: "grid", gap: "13px" }}
                  >
                    <h3 style={{ margin: 0, fontSize: "16px" }}>
                      Edit {getUsername(user)}
                    </h3>

                    <div>
                      <label
                        htmlFor={`username-${user.id}`}
                        style={{
                          display: "block",
                          marginBottom: "5px",
                          fontSize: "13px",
                          fontWeight: 600,
                        }}
                      >
                        Username
                      </label>
                      <input
                        id={`username-${user.id}`}
                        name="username"
                        value={editForm.username}
                        onChange={handleFormChange}
                        required
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`role-${user.id}`}
                        style={{
                          display: "block",
                          marginBottom: "5px",
                          fontSize: "13px",
                          fontWeight: 600,
                        }}
                      >
                        Role
                      </label>
                      <select
                        id={`role-${user.id}`}
                        name="role"
                        value={editForm.role}
                        onChange={handleFormChange}
                        style={inputStyle}
                      >
                        {roleOptions.map((role) => (
                          <option key={role} value={role}>
                            {getRoleLabel(role)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor={`status-${user.id}`}
                        style={{
                          display: "block",
                          marginBottom: "5px",
                          fontSize: "13px",
                          fontWeight: 600,
                        }}
                      >
                        Account status
                      </label>
                      <select
                        id={`status-${user.id}`}
                        name="is_active"
                        value={String(editForm.is_active)}
                        onChange={(event) =>
                          setEditForm((previous) => ({
                            ...previous,
                            is_active: event.target.value === "true",
                          }))
                        }
                        style={inputStyle}
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                      <p
                        style={{
                          margin: "5px 0 0",
                          fontSize: "12px",
                          color: "#6b7280",
                        }}
                      >
                        Status changes will apply only after you click Save.
                      </p>
                    </div>

                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "14px",
                      }}
                    >
                      <input
                        type="checkbox"
                        name="is_superuser"
                        checked={editForm.is_superuser}
                        onChange={handleFormChange}
                      />
                      Superuser privileges
                    </label>

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        type="submit"
                        disabled={saving}
                        style={{
                          ...primaryButtonStyle,
                          opacity: saving ? 0.65 : 1,
                        }}
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>

                      <button
                        type="button"
                        disabled={saving}
                        style={buttonStyle}
                        onClick={() => {
                          cancelEditing();
                          clearMessages();
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {isChangingPassword && !isEditing && (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      handlePasswordChange(user);
                    }}
                    style={{
                      marginTop: "16px",
                      paddingTop: "14px",
                      borderTop: "1px solid #e5e7eb",
                      display: "grid",
                      gap: "10px",
                    }}
                  >
                    <label
                      htmlFor={`password-${user.id}`}
                      style={{ fontSize: "13px", fontWeight: 600 }}
                    >
                      New password
                    </label>
                    <input
                      id={`password-${user.id}`}
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="Enter a new password"
                      required
                      style={inputStyle}
                    />

                    <div>
                      <button
                        type="submit"
                        disabled={changingPassword}
                        style={{
                          ...primaryButtonStyle,
                          opacity: changingPassword ? 0.65 : 1,
                        }}
                      >
                        {changingPassword ? "Changing..." : "Save Password"}
                      </button>
                    </div>
                  </form>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

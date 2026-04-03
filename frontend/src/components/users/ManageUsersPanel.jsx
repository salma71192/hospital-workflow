import React from "react";

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
}) {
  const visibleUsers = groupedUsers[activeCategory] ?? [];

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Manage Users</h2>

      <div style={styles.tabsWrap}>
        {categoryOrder.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            style={{
              ...styles.tabButton,
              ...(activeCategory === category ? styles.activeTabButton : {}),
            }}
          >
            {roleLabels[category] || category} ({groupedUsers[category]?.length || 0})
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
                    onRoleUpdate(item.id, e.target.value, item.is_superuser)
                  }
                  style={styles.smallSelect}
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {roleLabels[role] || role}
                    </option>
                  ))}
                </select>

                <label style={styles.smallCheckboxRow}>
                  <input
                    type="checkbox"
                    checked={!!item.is_superuser}
                    onChange={(e) =>
                      onRoleUpdate(item.id, item.role, e.target.checked)
                    }
                  />
                  Superuser
                </label>

                <button
                  style={styles.viewButton}
                  onClick={() => onActAsUser(item)}
                >
                  Open as User
                </button>

                <button
                  style={styles.deleteButton}
                  onClick={() => onDeleteUser(item.id, item.username)}
                  disabled={item.username === currentUsername}
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
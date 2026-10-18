
import React from "react";
import ManageUsersPanel from "../users/ManageUsersPanel";

export default function AdminManageSection({
  users = [],
  activeCategory,
  onCategoryChange,
  groupedUsers,
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
  const handleEditUser = (...args) => {
    if (typeof onEditUser !== "function") {
      console.error("onEditUser handler is not connected.");
      return false;
    }

    return onEditUser(...args);
  };

  const handleSetUserActive = (...args) => {
    if (typeof onSetUserActive !== "function") {
      console.error("onSetUserActive handler is not connected.");
      return false;
    }

    return onSetUserActive(...args);
  };

  const handleChangeUserPassword = (...args) => {
    if (typeof onChangeUserPassword !== "function") {
      console.error(
        "onChangeUserPassword handler is not connected."
      );
      return false;
    }

    return onChangeUserPassword(...args);
  };

  return (
    <ManageUsersPanel
      users={users}
      activeCategory={activeCategory}
      onCategoryChange={onCategoryChange}
      groupedUsers={groupedUsers}
      categoryOrder={categoryOrder}
      roleLabels={roleLabels}
      roles={roles}
      currentUsername={currentUsername}
      onRoleUpdate={onRoleUpdate}
      onDeleteUser={onDeleteUser}
      onActAsUser={onActAsUser}
      onEditUser={handleEditUser}
      onSetUserActive={handleSetUserActive}
      onChangeUserPassword={handleChangeUserPassword}
    />
  );
}

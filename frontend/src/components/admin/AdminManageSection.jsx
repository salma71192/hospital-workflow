import React from "react";
import ManageUsersPanel from "../users/ManageUsersPanel";

export default function AdminManageSection({
  users,
  activeCategory,
  onCategoryChange,
  groupedUsers,
  categoryOrder,
  roleLabels,
  roles,
  currentUsername,
  onRoleUpdate,
  onDeleteUser,
  onActAsUser,
}) {
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
    />
  );
}
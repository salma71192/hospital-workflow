import React from "react";
import CreateUserForm from "../users/CreateUserForm";

export default function AdminCreateSection({
  formData,
  setFormData,
  roles,
  roleLabels,
  onSubmit,
}) {
  return (
    <CreateUserForm
      formData={formData}
      setFormData={setFormData}
      roles={roles}
      roleLabels={roleLabels}
      onSubmit={onSubmit}
    />
  );
}
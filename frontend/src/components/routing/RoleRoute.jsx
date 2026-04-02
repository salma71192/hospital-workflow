import React from "react";
import ProtectedRoute from "./ProtectedRoute";

export default function RoleRoute({
  currentUser,
  isAdmin,
  allowedRoles = [],
  children,
}) {
  const isAllowed =
    !!currentUser && (isAdmin || allowedRoles.includes(currentUser.role));

  return <ProtectedRoute isAllowed={isAllowed}>{children}</ProtectedRoute>;
}
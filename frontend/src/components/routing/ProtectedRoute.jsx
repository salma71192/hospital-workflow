import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ isAllowed, children }) {
  if (!isAllowed) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
import React from "react";
import api from "../api/api";

export default function LogoutButton() {
  const handleLogout = async () => {
    try {
      await api.post("logout/"); // call Django logout API
      window.location.href = "/login"; // redirect to login
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <button className="logout" onClick={handleLogout}>
      Logout
    </button>
  );
}
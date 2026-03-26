import React from "react";
import { useNavigate } from "react-router-dom";

export default function Sidebar({ user }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    // TODO: call logout API
    alert("Logged out");
    navigate("/login");
  };

  return (
    <div
      style={{
        width: "250px",
        background: "#2c3e50",
        color: "white",
        padding: "20px",
      }}
    >
      <h2>{user.role === "reception" ? "Reception" : "Physio"} Panel</h2>
      <p>Welcome, {user.username}!</p>

      {user.role === "reception" && (
        <>
          <button onClick={() => navigate("/reception")}>Dashboard</button>
        </>
      )}

      {user.role === "physio" && (
        <>
          <button onClick={() => navigate("/physio")}>Dashboard</button>
        </>
      )}

      <button
        onClick={handleLogout}
        style={{ background: "red", color: "white", marginTop: "20px" }}
      >
        Logout
      </button>
    </div>
  );
}
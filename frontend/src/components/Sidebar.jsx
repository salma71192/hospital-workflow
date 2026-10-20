```jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Sidebar({ user }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    // TODO: call logout API
    alert("Logged out");
    navigate("/login");
  };

  const buttonStyle = {
    display: "block",
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    textAlign: "left",
    cursor: "pointer",
    border: "none",
    borderRadius: "5px",
  };

  return (
    <div
      style={{
        width: "250px",
        minHeight: "100vh",
        boxSizing: "border-box",
        background: "#2c3e50",
        color: "white",
        padding: "20px",
      }}
    >
      <h2>
        {user.role === "reception" ? "Reception" : "Physio"} Panel
      </h2>

      <p>Welcome, {user.username}!</p>

      {user.role === "reception" && (
        <button
          style={buttonStyle}
          onClick={() => navigate("/reception")}
        >
          Dashboard
        </button>
      )}

      {user.role === "physio" && (
        <>
          <button
            style={buttonStyle}
            onClick={() => navigate("/physio")}
          >
            Dashboard
          </button>

          <button
            style={buttonStyle}
            onClick={() => navigate("/physio/evaluation-tracker")}
          >
            Evaluation Tracker
          </button>

          <button
            style={buttonStyle}
            onClick={() => navigate("/physio/leaderboard")}
          >
            Leaderboard
          </button>
        </>
      )}

      <button
        onClick={handleLogout}
        style={{
          ...buttonStyle,
          background: "red",
          color: "white",
          marginTop: "20px",
        }}
      >
        Logout
      </button>
    </div>
  );
}
```
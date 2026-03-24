import React from "react";
import LogoutButton from "./LogoutButton";

export default function Sidebar({ onSelectPanel, user }) {
  return (
    <div className="sidebar">
      <h2>Reception</h2>
      <p className="welcome">Welcome, {user.username}!</p>
      <button onClick={() => onSelectPanel("dashboard")}>Dashboard</button>
      <button onClick={() => onSelectPanel("search")}>Search Patient</button>
      <button onClick={() => onSelectPanel("register")}>Register Patient</button>
      <LogoutButton />
    </div>
  );
}
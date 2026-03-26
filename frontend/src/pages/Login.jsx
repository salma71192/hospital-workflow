import React, { useState } from "react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("reception");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(username, role);
  };

  return (
    <div style={{ padding: "50px" }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <br />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="reception">Reception</option>
          <option value="physio">Physio</option>
        </select>
        <br />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
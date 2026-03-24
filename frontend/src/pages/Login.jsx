import { useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("users/login/", { username, password });

      if (res.data.success) {
        // ROLE-BASED REDIRECT
        if (res.data.is_superuser) navigate("/admin-panel");
        else if (res.data.role === "reception") navigate("/reception");
        else if (res.data.role === "physiotherapist") navigate("/physio");
        else if (res.data.role === "callcenter") navigate("/callcenter");
        else if (res.data.role === "approvals") navigate("/approvals");
        else if (res.data.role === "rcm") navigate("/rcm");
        else navigate("/visitors");
      }
    } catch (err) {
      alert("Invalid credentials");
    }
  };

  return (
    <div>
      <h1>Hospital Login</h1>
      <form onSubmit={handleLogin}>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
import { useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      alert("Please enter username and password");
      return;
    }

    try {
      const res = await api.post("users/login/", { username, password });

      if (res.data.success) {
        // ROLE-BASED REDIRECT
        const role = res.data.role;
        if (res.data.is_superuser) navigate("/admin");
        else if (role === "reception") navigate("/reception");
        else if (role === "physiotherapist") navigate("/physio");
        else if (role === "callcenter") navigate("/callcenter");
        else if (role === "approvals") navigate("/approvals");
        else if (role === "rcm") navigate("/rcm");
        else navigate("/visitors");
      } else {
        alert("Invalid credentials");
      }
    } catch (err) {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="login-container">
      <h1>Hospital Login</h1>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
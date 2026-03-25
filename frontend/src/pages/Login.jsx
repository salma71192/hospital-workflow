// src/pages/Login.jsx
import { useState } from "react";
import api from "../api/api"; // Axios instance
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("users/login/", { username, password });

      if (res.data.success) {
        // Role-based redirect
        if (res.data.is_superuser) {
          navigate("/admin-panel");
        } else if (res.data.role === "reception") {
          navigate("/reception");
        } else if (res.data.role === "physiotherapist") {
          navigate("/physio");
        } else if (res.data.role === "callcenter") {
          navigate("/callcenter");
        } else if (res.data.role === "approvals") {
          navigate("/approvals");
        } else if (res.data.role === "rcm") {
          navigate("/rcm");
        } else if (res.data.role === "visitors") {
          navigate("/visitors");
        } else {
          navigate("/"); // fallback
        }
      } else {
        setError("Invalid credentials");
      }
    } catch (err) {
      console.error(err);
      setError("Invalid credentials or server error");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Hospital Login</h1>
        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          <button type="submit" style={styles.button}>Login</button>
          {error && <p style={styles.error}>{error}</p>}
        </form>
      </div>
    </div>
  );
}

// Simple inline styles
const styles = {
  container: {
    display: "flex",
    height: "100vh",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f5f5",
  },
  card: {
    padding: "40px",
    borderRadius: "8px",
    background: "#fff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    width: "300px",
    textAlign: "center",
  },
  title: {
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  input: {
    padding: "10px",
    marginBottom: "15px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "16px",
  },
  button: {
    padding: "10px",
    borderRadius: "4px",
    border: "none",
    background: "#1abc9c",
    color: "#fff",
    fontSize: "16px",
    cursor: "pointer",
  },
  error: {
    color: "red",
    marginTop: "10px",
    fontSize: "14px",
  },
};
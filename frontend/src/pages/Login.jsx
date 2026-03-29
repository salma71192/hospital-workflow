import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("users/login/", {
        username,
        password,
      });

      if (res.data.success) {
        const userData = {
          username: res.data.username,
          role: res.data.role,
          is_superuser: res.data.is_superuser,
        };

        onLogin(userData);

        if (res.data.is_superuser) {
          navigate("/reception");
        } else if (res.data.role === "reception") {
          navigate("/reception");
        } else if (res.data.role === "physio") {
          navigate("/physio");
        } else {
          navigate("/login");
        }
      } else {
        setError("Wrong credentials");
      }
    } catch (err) {
      setError("Wrong credentials");
    }
  };

  return (
    <div style={styles.page}>
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

          <button type="submit" style={styles.button}>
            Login
          </button>

          {error && <p style={styles.error}>{error}</p>}
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f4f6f8",
  },
  card: {
    width: "360px",
    background: "#fff",
    padding: "32px",
    borderRadius: "12px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  },
  title: {
    textAlign: "center",
    marginBottom: "24px",
    color: "#2c3e50",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "15px",
  },
  button: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#1abc9c",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
  },
  error: {
    color: "red",
    margin: 0,
    textAlign: "center",
  },
};
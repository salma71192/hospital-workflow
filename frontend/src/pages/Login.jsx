import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("users/login/", {
        username,
        password,
      });

      const userData = res.data;

      onLogin(userData);

      // Role routing
      const role = userData.role;

      if (userData.is_superuser || role === "admin") {
        navigate("/admin");
      } else if (role === "approvals") {
        navigate("/approvals");
      } else if (role === "reception") {
        navigate("/reception");
      } else if (role === "reception_supervisor") {
        navigate("/reception-supervisor");
      } else if (role === "physio") {
        navigate("/physio");
      } else if (role === "doctor") {
        navigate("/doctor");
      } else if (role === "rcm") {
        navigate("/rcm");
      } else if (role === "callcenter") {
        navigate("/callcenter");
      } else if (role === "callcenter_supervisor") {
        navigate("/callcenter-supervisor");
      } else if (role === "visitor") {
        navigate("/visitors");
      } else if (role === "visitor_ceo") {
        navigate("/visitor-ceo");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Hospital System</h1>
        <p style={styles.subtitle}>Sign in to continue</p>

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

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          {error && <div style={styles.error}>{error}</div>}
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
    background: "linear-gradient(135deg, #eff6ff, #ffffff)",
  },
  card: {
    width: "380px",
    background: "#fff",
    padding: "32px",
    borderRadius: "16px",
    boxShadow: "0 20px 40px rgba(15, 23, 42, 0.08)",
    display: "grid",
    gap: "16px",
  },
  title: {
    textAlign: "center",
    margin: 0,
    fontSize: "26px",
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    textAlign: "center",
    fontSize: "14px",
    color: "#64748b",
  },
  form: {
    display: "grid",
    gap: "14px",
  },
  input: {
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    outline: "none",
  },
  button: {
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },
  error: {
    background: "#fee2e2",
    color: "#b91c1c",
    padding: "10px",
    borderRadius: "8px",
    textAlign: "center",
    fontSize: "14px",
  },
};
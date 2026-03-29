import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import api from "./api/api";
import Login from "./pages/Login";
import ReceptionDashboard from "./pages/ReceptionDashboard";
import PhysioDashboard from "./pages/PhysioDashboard";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("users/me/")
      .then((res) => {
        setUser(res.data);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleLogin = async (username, password) => {
    const res = await api.post("users/login/", { username, password });
    setUser(res.data);
    return res.data;
  };

  const handleLogout = async () => {
    try {
      await api.post("users/logout/");
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setUser(null);
    }
  };

  const isPhysio = user?.role === "physio" || user?.role === "physiotherapist";
  const isReception = user?.role === "reception";

  const getHomeRoute = () => {
    if (!user) return "/login";
    if (user.is_superuser) return "/reception";
    if (isPhysio) return "/physio";
    if (isReception) return "/reception";
    return "/login";
  };

  if (loading) {
    return <div style={{ padding: "20px" }}>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to={getHomeRoute()} replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />

        <Route
          path="/physio"
          element={
            user && (isPhysio || user.is_superuser) ? (
              <PhysioDashboard user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/reception"
          element={
            user && (isReception || user.is_superuser) ? (
              <ReceptionDashboard user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="/" element={<Navigate to={getHomeRoute()} replace />} />
        <Route path="*" element={<Navigate to={getHomeRoute()} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
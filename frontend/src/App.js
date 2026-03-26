import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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

  if (loading) {
    return <div style={{ padding: "30px" }}>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLogin={setUser} />} />

        <Route
          path="/reception"
          element={
            user ? (
              user.role === "reception" || user.is_superuser ? (
                <ReceptionDashboard user={user} />
              ) : (
                <Navigate to={getDashboardPath(user)} />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/physio"
          element={
            user ? (
              user.role === "physiotherapist" || user.is_superuser ? (
                <PhysioDashboard user={user} />
              ) : (
                <Navigate to={getDashboardPath(user)} />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/"
          element={
            user ? <Navigate to={getDashboardPath(user)} /> : <Navigate to="/login" />
          }
        />

        <Route path="*" element={<h2>404 - Page not found</h2>} />
      </Routes>
    </Router>
  );
}

function getDashboardPath(user) {
  if (!user) return "/login";
  if (user.is_superuser) return "/admin-panel";
  if (user.role === "reception") return "/reception";
  if (user.role === "physiotherapist") return "/physio";
  if (user.role === "callcenter") return "/callcenter";
  if (user.role === "approvals") return "/approvals";
  if (user.role === "rcm") return "/rcm";
  if (user.role === "visitors") return "/visitors";
  return "/login";
}

export default App;
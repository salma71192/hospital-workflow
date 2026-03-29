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
import AdminDashboard from "./pages/AdminDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import RcmDashboard from "./pages/RcmDashboard";
import CallCenterDashboard from "./pages/CallCenterDashboard";
import VisitorsDashboard from "./pages/VisitorsDashboard";

function App() {
  const [user, setUser] = useState(null); // real logged-in user
  const [actingAs, setActingAs] = useState(null); // selected user from admin
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

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await api.post("users/logout/");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
      setActingAs(null);
      window.location.href = "/login";
    }
  };

  const stopImpersonation = () => {
    setActingAs(null);
  };

  const currentUser = actingAs || user;
  const isAdmin = user && (user.is_superuser || user.role === "admin");

  if (loading) {
    return <div style={{ padding: "20px" }}>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />

        <Route
          path="/admin"
          element={
            isAdmin ? (
              <AdminDashboard
                user={user}
                onLogout={handleLogout}
                onActAsUser={setActingAs}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/reception"
          element={
            currentUser && (currentUser.role === "reception" || isAdmin) ? (
              <ReceptionDashboard
                user={currentUser}
                onLogout={handleLogout}
                actingAs={actingAs}
                onStopImpersonation={stopImpersonation}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/physio"
          element={
            currentUser && (currentUser.role === "physio" || isAdmin) ? (
              <PhysioDashboard
                user={currentUser}
                onLogout={handleLogout}
                actingAs={actingAs}
                onStopImpersonation={stopImpersonation}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/doctor"
          element={
            currentUser && (currentUser.role === "doctor" || isAdmin) ? (
              <DoctorDashboard
                user={currentUser}
                onLogout={handleLogout}
                actingAs={actingAs}
                onStopImpersonation={stopImpersonation}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/rcm"
          element={
            currentUser && (currentUser.role === "rcm" || isAdmin) ? (
              <RcmDashboard
                user={currentUser}
                onLogout={handleLogout}
                actingAs={actingAs}
                onStopImpersonation={stopImpersonation}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/callcenter"
          element={
            currentUser && (currentUser.role === "callcenter" || isAdmin) ? (
              <CallCenterDashboard
                user={currentUser}
                onLogout={handleLogout}
                actingAs={actingAs}
                onStopImpersonation={stopImpersonation}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/visitors"
          element={
            currentUser && (currentUser.role === "visitor" || isAdmin) ? (
              <VisitorsDashboard
                user={currentUser}
                onLogout={handleLogout}
                actingAs={actingAs}
                onStopImpersonation={stopImpersonation}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
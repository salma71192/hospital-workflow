import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import api from "./api/api";

import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import ReceptionDashboard from "./pages/ReceptionDashboard";
import ReceptionSupervisorDashboard from "./pages/ReceptionSupervisorDashboard";
import PhysioDashboard from "./pages/PhysioDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import RcmDashboard from "./pages/RcmDashboard";
import CallCenterDashboard from "./pages/CallCenterDashboard";
import CallCenterSupervisorDashboard from "./pages/CallCenterSupervisorDashboard";
import VisitorsDashboard from "./pages/VisitorsDashboard";
import VisitorCeoDashboard from "./pages/VisitorCeoDashboard";
import ApprovalsDashboard from "./pages/ApprovalsDashboard";
import PatientDetails from "./pages/PatientDetails";

import ProtectedRoute from "./components/routing/ProtectedRoute";
import RoleRoute from "./components/routing/RoleRoute";

function App() {
  const [user, setUser] = useState(null);
  const [actingAs, setActingAs] = useState(null);
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
    setActingAs(null);
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
  const isAdmin = !!(user && (user.is_superuser || user.role === "admin"));

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
            <ProtectedRoute isAllowed={isAdmin}>
              <AdminDashboard
                user={user}
                onLogout={handleLogout}
                onActAsUser={setActingAs}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/approvals"
          element={
            <RoleRoute
              currentUser={currentUser}
              isAdmin={isAdmin}
              allowedRoles={["approvals"]}
            >
              <ApprovalsDashboard
                user={currentUser}
                onLogout={handleLogout}
                actingAs={actingAs}
                onStopImpersonation={stopImpersonation}
              />
            </RoleRoute>
          }
        />

        <Route
          path="/reception"
          element={
            <RoleRoute
              currentUser={currentUser}
              isAdmin={isAdmin}
              allowedRoles={["reception"]}
            >
              <ReceptionDashboard
                user={currentUser}
                onLogout={handleLogout}
                actingAs={actingAs}
                onStopImpersonation={stopImpersonation}
              />
            </RoleRoute>
          }
        />

        <Route
          path="/reception-supervisor"
          element={
            <RoleRoute
              currentUser={currentUser}
              isAdmin={isAdmin}
              allowedRoles={["reception_supervisor"]}
            >
              <ReceptionSupervisorDashboard
                user={currentUser}
                onLogout={handleLogout}
                actingAs={actingAs}
                onStopImpersonation={stopImpersonation}
              />
            </RoleRoute>
          }
        />

        <Route
          path="/physio"
          element={
            <RoleRoute
              currentUser={currentUser}
              isAdmin={isAdmin}
              allowedRoles={["physio"]}
            >
              <PhysioDashboard
                user={currentUser}
                onLogout={handleLogout}
                actingAs={actingAs}
                onStopImpersonation={stopImpersonation}
              />
            </RoleRoute>
          }
        />

        <Route
          path="/doctor"
          element={
            <RoleRoute
              currentUser={currentUser}
              isAdmin={isAdmin}
              allowedRoles={["doctor"]}
            >
              <DoctorDashboard
                user={currentUser}
                onLogout={handleLogout}
                actingAs={actingAs}
                onStopImpersonation={stopImpersonation}
              />
            </RoleRoute>
          }
        />

        <Route
          path="/rcm"
          element={
            <RoleRoute
              currentUser={currentUser}
              isAdmin={isAdmin}
              allowedRoles={["rcm"]}
            >
              <RcmDashboard
                user={currentUser}
                onLogout={handleLogout}
                actingAs={actingAs}
                onStopImpersonation={stopImpersonation}
              />
            </RoleRoute>
          }
        />

        <Route
          path="/callcenter"
          element={
            <RoleRoute
              currentUser={currentUser}
              isAdmin={isAdmin}
              allowedRoles={["callcenter"]}
            >
              <CallCenterDashboard
                user={currentUser}
                onLogout={handleLogout}
                actingAs={actingAs}
                onStopImpersonation={stopImpersonation}
              />
            </RoleRoute>
          }
        />

        <Route
          path="/callcenter-supervisor"
          element={
            <RoleRoute
              currentUser={currentUser}
              isAdmin={isAdmin}
              allowedRoles={["callcenter_supervisor"]}
            >
              <CallCenterSupervisorDashboard
                user={currentUser}
                onLogout={handleLogout}
                actingAs={actingAs}
                onStopImpersonation={stopImpersonation}
              />
            </RoleRoute>
          }
        />

        <Route
          path="/visitors"
          element={
            <RoleRoute
              currentUser={currentUser}
              isAdmin={isAdmin}
              allowedRoles={["visitor"]}
            >
              <VisitorsDashboard
                user={currentUser}
                onLogout={handleLogout}
                actingAs={actingAs}
                onStopImpersonation={stopImpersonation}
              />
            </RoleRoute>
          }
        />

        <Route
          path="/visitor-ceo"
          element={
            <RoleRoute
              currentUser={currentUser}
              isAdmin={isAdmin}
              allowedRoles={["visitor_ceo"]}
            >
              <VisitorCeoDashboard
                user={currentUser}
                onLogout={handleLogout}
                actingAs={actingAs}
                onStopImpersonation={stopImpersonation}
              />
            </RoleRoute>
          }
        />

        <Route
          path="/patients/:id"
          element={
            <ProtectedRoute isAllowed={!!currentUser}>
              <PatientDetails
                user={currentUser}
                onLogout={handleLogout}
                actingAs={actingAs}
                onStopImpersonation={stopImpersonation}
              />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
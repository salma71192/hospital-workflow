import React, { useEffect, useState, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import api from "./api/api";

// pages
import Login from "./pages/Login";
import PatientDetails from "./pages/PatientDetails";
import EditPatientFile from "./pages/EditPatientFile";

// routing helpers
import ProtectedRoute from "./components/routing/ProtectedRoute";
import RoleRoute from "./components/routing/RoleRoute";

// routes config
import { dashboardRoutes } from "./routes/routesConfig";

function App() {
  const [user, setUser] = useState(null);
  const [actingAs, setActingAs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("users/me/")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
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
      <Suspense fallback={<div style={{ padding: 20 }}>Loading page...</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/login" element={<Login onLogin={handleLogin} />} />

          {dashboardRoutes.map((route) => {
            const Component = route.component;

            if (route.adminOnly) {
              return (
                <Route
                  key={route.path}
                  path={route.path}
                  element={
                    <ProtectedRoute isAllowed={isAdmin}>
                      <Component
                        user={user}
                        onLogout={handleLogout}
                        onActAsUser={setActingAs}
                      />
                    </ProtectedRoute>
                  }
                />
              );
            }

            return (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <RoleRoute
                    currentUser={currentUser}
                    isAdmin={isAdmin}
                    allowedRoles={route.roles}
                  >
                    <Component
                      user={currentUser}
                      onLogout={handleLogout}
                      actingAs={actingAs}
                      onStopImpersonation={stopImpersonation}
                    />
                  </RoleRoute>
                }
              />
            );
          })}

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

          <Route
            path="/patients/:id/edit"
            element={
              <ProtectedRoute isAllowed={!!currentUser}>
                <EditPatientFile
                  user={currentUser}
                  actingAs={actingAs}
                  onLogout={handleLogout}
                  onStopImpersonation={stopImpersonation}
                />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
import React, { useEffect, useState, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import api from "./api/api";
import Login from "./pages/Login";
import PatientDetails from "./pages/PatientDetails";
import EditPatientFile from "./pages/EditPatientFile";
import ReceptionHome from "./pages/ReceptionHome";
import ReceptionRegistrationWorkspace from "./pages/ReceptionRegistrationWorkspace";
import ReceptionBookingWorkspace from "./pages/ReceptionBookingWorkspace";
import RehabDashboard from "./RehabDashboard";
import ClaimsManagement from "./pages/ClaimsManagement";
import ClaimHistory from "./components/rcm/ClaimHistory";
import ProtectedRoute from "./components/routing/ProtectedRoute";
import RoleRoute from "./components/routing/RoleRoute";
import { dashboardRoutes } from "./routes/routesConfig";
function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}
function getDashboardPath(user) {
  if (!user) return "/login";
  const role = normalizeRole(user.role);
  if (user.is_superuser || role === "admin") {
    return (
      dashboardRoutes.find((route) => route.adminOnly)?.path || "/admin"
    );
  }
  const matchingRoute = dashboardRoutes.find(
    (route) =>
      !route.adminOnly &&
      Array.isArray(route.roles) &&
      route.roles.some(
        (allowedRole) => normalizeRole(allowedRole) === role
      )
  );
  return matchingRoute?.path || null;
}
function AppContent() {
  const [user, setUser] = useState(null);
  const [actingAs, setActingAs] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  useEffect(() => {
    let mounted = true;
    api
      .get("users/me/")
      .then((response) => {
        if (!mounted) return;
        const authenticatedUser = response.data;
        if (
          authenticatedUser &&
          authenticatedUser.id &&
          authenticatedUser.username
        ) {
          setUser(authenticatedUser);
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        if (mounted) setUser(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);
  const handleLogin = (userData) => {
    if (!userData) return;
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
    }
  };
  const handleStopImpersonation = () => {
    setActingAs(null);
  };
  const currentUser = actingAs || user;
  const isAdmin = Boolean(
    user &&
      (user.is_superuser || normalizeRole(user.role) === "admin")
  );
  const dashboardPath = getDashboardPath(currentUser);
  if (loading) {
    return <div style={{ padding: 20 }}>Loading...</div>;
  }
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading page...</div>}>
      <Routes>
        {/* Home */}
        <Route
          path="/"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : dashboardPath ? (
              <Navigate to={dashboardPath} replace />
            ) : (
              <div style={{ padding: 20 }}>
                <h3>No dashboard configured for this account</h3>
                <p>
                  Your account role is "{user.role || "not assigned"}".
                  Please contact the administrator.
                </p>
                <button onClick={handleLogout}>Log out</button>
              </div>
            )
          }
        />
        {/* Login */}
        <Route
          path="/login"
          element={
            user ? (
              dashboardPath ? (
                <Navigate to={dashboardPath} replace />
              ) : (
                <div style={{ padding: 20 }}>
                  <h3>No dashboard configured for this account</h3>
                  <button onClick={handleLogout}>Log out</button>
                </div>
              )
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        {/* Existing dashboard routes */}
        {dashboardRoutes.map((route) => {
          const Component = route.component;
          if (!Component) return null;
          if (route.adminOnly) {
            return (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <ProtectedRoute isAllowed={Boolean(user && isAdmin)}>
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
                    onStopImpersonation={handleStopImpersonation}
                  />
                </RoleRoute>
              }
            />
          );
        })}
        {/* Physiotherapy Follow-Up Dashboard */}
        <Route
          path="/physio/followup"
          element={
            <RoleRoute
              currentUser={currentUser}
              isAdmin={isAdmin}
              allowedRoles={["physio"]}
            >
              <RehabDashboard
                user={currentUser}
                onLogout={handleLogout}
                actingAs={actingAs}
                onStopImpersonation={handleStopImpersonation}
                onBack={() => window.history.back()}
              />
            </RoleRoute>
          }
        />
        {/* RCM Claims Management: Search and Create */}
        <Route
          path="/rcm/claims"
          element={
            <RoleRoute
              currentUser={currentUser}
              isAdmin={isAdmin}
              allowedRoles={["rcm"]}
            >
              <ClaimsManagement
                user={currentUser}
                onLogout={handleLogout}
                actingAs={actingAs}
                onStopImpersonation={handleStopImpersonation}
              />
            </RoleRoute>
          }
        />
        {/* RCM Claim History */}
        <Route
          path="/rcm/claim-history"
          element={
            <RoleRoute
              currentUser={currentUser}
              isAdmin={isAdmin}
              allowedRoles={["rcm"]}
            >
              <ClaimHistory
                user={currentUser}
                onLogout={handleLogout}
                actingAs={actingAs}
                onStopImpersonation={handleStopImpersonation}
              />
            </RoleRoute>
          }
        />
        {/* Reception Home */}
        <Route
          path="/reception"
          element={
            <RoleRoute
              currentUser={currentUser}
              isAdmin={isAdmin}
              allowedRoles={["reception", "reception_supervisor"]}
            >
              <ReceptionHome
                user={currentUser}
                onLogout={handleLogout}
                actingAs={actingAs}
                onStopImpersonation={handleStopImpersonation}
              />
            </RoleRoute>
          }
        />
        {/* Reception Registration */}
        <Route
          path="/reception/registration"
          element={
            <RoleRoute
              currentUser={currentUser}
              isAdmin={isAdmin}
              allowedRoles={["reception", "reception_supervisor"]}
            >
              <ReceptionRegistrationWorkspace
                user={currentUser}
                onLogout={handleLogout}
                actingAs={actingAs}
                onStopImpersonation={handleStopImpersonation}
              />
            </RoleRoute>
          }
        />
        {/* Reception Booking */}
        <Route
          path="/reception/booking"
          element={
            <RoleRoute
              currentUser={currentUser}
              isAdmin={isAdmin}
              allowedRoles={["reception", "reception_supervisor"]}
            >
              <ReceptionBookingWorkspace
                user={currentUser}
                onLogout={handleLogout}
                actingAs={actingAs}
                onStopImpersonation={handleStopImpersonation}
              />
            </RoleRoute>
          }
        />
        {/* Patient Details */}
        <Route
          path="/patients/:id"
          element={
            <ProtectedRoute isAllowed={Boolean(currentUser)}>
              <PatientDetails
                user={currentUser}
                onLogout={handleLogout}
                actingAs={actingAs}
                onStopImpersonation={handleStopImpersonation}
              />
            </ProtectedRoute>
          }
        />
        {/* Edit Patient */}
        <Route
          path="/patients/:id/edit"
          element={
            <ProtectedRoute isAllowed={Boolean(currentUser)}>
              <EditPatientFile
                user={currentUser}
                actingAs={actingAs}
                onLogout={handleLogout}
                onStopImpersonation={handleStopImpersonation}
              />
            </ProtectedRoute>
          }
        />
        {/* Fallback */}
        <Route
          path="*"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : dashboardPath ? (
              <Navigate to={dashboardPath} replace />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </Suspense>
  );
}
export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
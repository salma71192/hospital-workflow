
import React, { useEffect, useState, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
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

import CallCenterPatientsTracker from "./pages/CallCenterPatientsTracker";

// Independent therapist schedule workspace
import CallCenterScheduleUpload from "./components/callcenter/CallCenterScheduleUpload";

/* =========================================================
   HELPERS
========================================================= */

function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

function getDashboardPath(user) {
  if (!user) return "/login";

  const role = normalizeRole(user.role);

  if (user.is_superuser || role === "admin") {
    return (
      dashboardRoutes.find((route) => route.adminOnly)?.path ||
      "/admin"
    );
  }

  const matchingRoute = dashboardRoutes.find(
    (route) =>
      !route.adminOnly &&
      Array.isArray(route.roles) &&
      route.roles.some(
        (allowedRole) =>
          normalizeRole(allowedRole) === role
      )
  );

  return matchingRoute?.path || null;
}

/* =========================================================
   THERAPIST SCHEDULE WORKSPACE

   Separate from the existing Booking Module.

   The schedule component is mounted here independently.
   Booking routes and booking data are not modified.
========================================================= */

function CallCenterSchedulesWorkspace({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const [therapists, setTherapists] = useState([]);
  const [loadingTherapists, setLoadingTherapists] =
    useState(true);
  const [therapistsError, setTherapistsError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadTherapists() {
      try {
        setLoadingTherapists(true);
        setTherapistsError("");

        const response = await api.get(
          "physio/schedule/therapists/"
        );

        if (!mounted) return;

        const data = response.data;

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data?.therapists)
          ? data.therapists
          : [];

        setTherapists(list);
      } catch (error) {
        console.error(
          "Unable to load schedule therapists:",
          error
        );

        if (mounted) {
          setTherapistsError(
            "Unable to load the therapist list. Please refresh or try again."
          );
        }
      } finally {
        if (mounted) {
          setLoadingTherapists(false);
        }
      }
    }

    loadTherapists();

    return () => {
      mounted = false;
    };
  }, []);

  const displayName =
    actingAs?.first_name ||
    actingAs?.username ||
    user?.first_name ||
    user?.username ||
    "Call Center Team";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#334155",
        padding: "28px 20px",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          <div>
            <button
              type="button"
              onClick={() => {
                window.location.assign("/callcenter");
              }}
              style={{
                background: "transparent",
                border: 0,
                color: "#be185d",
                fontWeight: 700,
                cursor: "pointer",
                padding: "8px 0",
              }}
            >
              ← Call Center Home
            </button>

            <h1
              style={{
                margin: "10px 0 6px",
                color: "#172b4d",
                fontSize: 28,
              }}
            >
              Therapist Daily Schedules
            </h1>

            <p
              style={{
                margin: 0,
                color: "#64748b",
                lineHeight: 1.6,
              }}
            >
              Welcome, {displayName}. Upload Concepts
              screenshots, review appointments, match
              patients, and manage daily schedules.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {actingAs && (
              <button
                type="button"
                onClick={() => {
                  onStopImpersonation?.();
                  window.location.assign("/admin");
                }}
                style={{
                  padding: "10px 14px",
                  background: "#fff7ed",
                  color: "#9a3412",
                  border: "1px solid #fed7aa",
                  borderRadius: 10,
                  cursor: "pointer",
                }}
              >
                Back to Admin
              </button>
            )}

            <button
              type="button"
              onClick={onLogout}
              style={{
                padding: "10px 14px",
                background: "#fff",
                color: "#dc2626",
                border: "1px solid #fecaca",
                borderRadius: 10,
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </header>

        {therapistsError && (
          <div
            role="alert"
            style={{
              padding: 14,
              marginBottom: 16,
              borderRadius: 12,
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#991b1b",
            }}
          >
            {therapistsError}
          </div>
        )}

        {loadingTherapists ? (
          <div
            style={{
              padding: 24,
              background: "#fff",
              borderRadius: 14,
              border: "1px solid #e2e8f0",
            }}
          >
            Loading therapists...
          </div>
        ) : (
          <CallCenterScheduleUpload
            therapists={therapists}
          />
        )}
      </div>
    </div>
  );
}

/* =========================================================
   MAIN APPLICATION
========================================================= */

function AppContent() {
  const [user, setUser] = useState(null);
  const [actingAs, setActingAs] = useState(null);
  const [loading, setLoading] = useState(true);

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
      (user.is_superuser ||
        normalizeRole(user.role) === "admin")
  );

  const dashboardPath = getDashboardPath(currentUser);

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        Loading...
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div style={{ padding: 20 }}>
          Loading page...
        </div>
      }
    >
      <Routes>

        {/* =================================================
            HOME
        ================================================= */}

        <Route
          path="/"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : dashboardPath ? (
              <Navigate to={dashboardPath} replace />
            ) : (
              <div style={{ padding: 20 }}>
                <h3>
                  No dashboard configured for this account
                </h3>

                <p>
                  Your account role is "
                  {user.role || "not assigned"}".
                  Please contact the administrator.
                </p>

                <button
                  type="button"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </div>
            )
          }
        />

        {/* =================================================
            LOGIN
        ================================================= */}

        <Route
          path="/login"
          element={
            user ? (
              dashboardPath ? (
                <Navigate
                  to={dashboardPath}
                  replace
                />
              ) : (
                <div style={{ padding: 20 }}>
                  <h3>
                    No dashboard configured for this account
                  </h3>

                  <button
                    type="button"
                    onClick={handleLogout}
                  >
                    Log out
                  </button>
                </div>
              )
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />

        {/* =================================================
            EXISTING DASHBOARD ROUTES

            Includes any Booking Module route already
            registered in dashboardRoutes.

            These routes remain unchanged.
        ================================================= */}

        {dashboardRoutes.map((route) => {
          const Component = route.component;

          if (!Component) return null;

          if (route.adminOnly) {
            return (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <ProtectedRoute
                    isAllowed={Boolean(user && isAdmin)}
                  >
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
                    onStopImpersonation={
                      handleStopImpersonation
                    }
                  />
                </RoleRoute>
              }
            />
          );
        })}

        {/* =================================================
            PHYSIOTHERAPY FOLLOW-UP DASHBOARD
        ================================================= */}

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
                onStopImpersonation={
                  handleStopImpersonation
                }
                onBack={() => window.history.back()}
              />
            </RoleRoute>
          }
        />

        {/* =================================================
            CALL CENTER PATIENT TRACKER
        ================================================= */}

        <Route
          path="/callcenter/patients-tracker"
          element={
            <RoleRoute
              currentUser={currentUser}
              isAdmin={isAdmin}
              allowedRoles={["callcenter", "call_center"]}
            >
              <CallCenterPatientsTracker
                user={currentUser}
                onLogout={handleLogout}
                actingAs={actingAs}
                onStopImpersonation={
                  handleStopImpersonation
                }
              />
            </RoleRoute>
          }
        />

        {/* =================================================
            NEW: THERAPIST SCHEDULES

            Independent from the Booking Module.

            Call Center Home:
              /callcenter/schedules

            Component:
              CallCenterScheduleUpload

            Backend:
              /api/physio/schedule/
        ================================================= */}

        <Route
          path="/callcenter/schedules"
          element={
            <RoleRoute
              currentUser={currentUser}
              isAdmin={isAdmin}
              allowedRoles={["callcenter", "call_center"]}
            >
              <CallCenterSchedulesWorkspace
                user={currentUser}
                onLogout={handleLogout}
                actingAs={actingAs}
                onStopImpersonation={
                  handleStopImpersonation
                }
              />
            </RoleRoute>
          }
        />

        {/* =================================================
            RCM CLAIMS MANAGEMENT
        ================================================= */}

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
                onStopImpersonation={
                  handleStopImpersonation
                }
              />
            </RoleRoute>
          }
        />

        {/* =================================================
            RCM CLAIM HISTORY
        ================================================= */}

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
                onStopImpersonation={
                  handleStopImpersonation
                }
              />
            </RoleRoute>
          }
        />

        {/* =================================================
            RECEPTION HOME
        ================================================= */}

        <Route
          path="/reception"
          element={
            <RoleRoute
              currentUser={currentUser}
              isAdmin={isAdmin}
              allowedRoles={[
                "reception",
                "reception_supervisor",
              ]}
            >
              <ReceptionHome
                user={currentUser}
                onLogout={handleLogout}
                actingAs={actingAs}
                onStopImpersonation={
                  handleStopImpersonation
                }
              />
            </RoleRoute>
          }
        />

        {/* =================================================
            RECEPTION REGISTRATION
        ================================================= */}

        <Route
          path="/reception/registration"
          element={
            <RoleRoute
              currentUser={currentUser}
              isAdmin={isAdmin}
              allowedRoles={[
                "reception",
                "reception_supervisor",
              ]}
            >
              <ReceptionRegistrationWorkspace
                user={currentUser}
                onLogout={handleLogout}
                actingAs={actingAs}
                onStopImpersonation={
                  handleStopImpersonation
                }
              />
            </RoleRoute>
          }
        />

        {/* =================================================
            RECEPTION BOOKING
        ================================================= */}

        <Route
          path="/reception/booking"
          element={
            <RoleRoute
              currentUser={currentUser}
              isAdmin={isAdmin}
              allowedRoles={[
                "reception",
                "reception_supervisor",
              ]}
            >
              <ReceptionBookingWorkspace
                user={currentUser}
                onLogout={handleLogout}
                actingAs={actingAs}
                onStopImpersonation={
                  handleStopImpersonation
                }
              />
            </RoleRoute>
          }
        />

        {/* =================================================
            PATIENT DETAILS
        ================================================= */}

        <Route
          path="/patients/:id"
          element={
            <ProtectedRoute
              isAllowed={Boolean(currentUser)}
            >
              <PatientDetails
                user={currentUser}
                onLogout={handleLogout}
                actingAs={actingAs}
                onStopImpersonation={
                  handleStopImpersonation
                }
              />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            EDIT PATIENT
        ================================================= */}

        <Route
          path="/patients/:id/edit"
          element={
            <ProtectedRoute
              isAllowed={Boolean(currentUser)}
            >
              <EditPatientFile
                user={currentUser}
                actingAs={actingAs}
                onLogout={handleLogout}
                onStopImpersonation={
                  handleStopImpersonation
                }
              />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            FALLBACK
        ================================================= */}

        <Route
          path="*"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : dashboardPath ? (
              <Navigate
                to={dashboardPath}
                replace
              />
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

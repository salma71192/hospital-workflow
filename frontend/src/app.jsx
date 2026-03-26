import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Pages
import ReceptionDashboard from "./pages/ReceptionDashboard";
import PhysioDashboard from "./pages/PhysioDashboard";
import Login from "./pages/Login";

// Dummy login function for demo
function fakeLogin(username, role) {
  return { username, role }; // role: 'reception' | 'physio'
}

function App() {
  const [user, setUser] = useState(null);

  // Handle login from Login page
  const handleLogin = (username, role) => {
    const loggedInUser = fakeLogin(username, role);
    setUser(loggedInUser);
  };

  return (
    <Router>
      <Routes>
        {/* Login page */}
        <Route
          path="/login"
          element={<Login onLogin={handleLogin} />}
        />

        {/* Redirect "/" to login if not logged in */}
        <Route
          path="/"
          element={!user ? <Navigate to="/login" /> : <Navigate to={`/${user.role}`} />}
        />

        {/* Reception dashboard */}
        <Route
          path="/reception"
          element={
            user && user.role === "reception" ? (
              <ReceptionDashboard user={user} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Physio dashboard */}
        <Route
          path="/physio"
          element={
            user && user.role === "physio" ? (
              <PhysioDashboard user={user} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Catch-all for unknown routes */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
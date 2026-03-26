import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import ReceptionDashboard from "./pages/ReceptionDashboard";
import PhysioDashboard from "./pages/PhysioDashboard";
import Login from "./pages/Login";

function App() {
  // In a real app, you'd check auth token
  const [user, setUser] = useState(null); // null = not logged in

  return (
    <Router>
      <Routes>
        {/* Login route */}
        <Route path="/login" element={<Login onLogin={setUser} />} />

        {/* Protected routes */}
        <Route
          path="/reception"
          element={user ? <ReceptionDashboard user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/physio"
          element={user ? <PhysioDashboard user={user} /> : <Navigate to="/login" />}
        />

        {/* Default route */}
        <Route
          path="/"
          element={<Navigate to={user ? "/reception" : "/login"} />}
        />

        {/* Catch-all */}
        <Route path="*" element={<h2>404 - Page not found</h2>} />
      </Routes>
    </Router>
  );
}

export default App;
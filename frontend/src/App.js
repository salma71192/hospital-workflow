import React, { useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";

// Pages
import Dashboard from "./pages/DashboardLayout";
import ReceptionDashboard from "./pages/ReceptionDashboard";
import PhysioDashboard from "./pages/PhysioDashboard";
import SearchPatient from "./pages/SearchPatient";
import RegisterPatient from "./pages/RegisterPatient";

// Components
import Sidebar from "./components/Sidebar";

function App() {
  const [panel, setPanel] = useState("dashboard");

  // Example user (replace with real login API)
  const user = { username: "ReceptionUser", role: "reception" };

  const renderPanel = () => {
    if (user.role === "reception") {
      if (panel === "dashboard") return <ReceptionDashboard user={user} />;
      if (panel === "search") return <SearchPatient user={user} />;
      if (panel === "register") return <RegisterPatient user={user} />;
    } else if (user.role === "physio") {
      return <PhysioDashboard user={user} />;
    }
    return <div>Unauthorized</div>;
  };

  return (
    <Router>
      <div style={{ display: "flex", height: "100vh" }}>
        <Sidebar onSelectPanel={setPanel} user={user} />
        <div style={{ flex: 1, padding: "30px", overflowY: "auto" }}>
          {renderPanel()}
        </div>
      </div>
    </Router>
  );
}

export default App;
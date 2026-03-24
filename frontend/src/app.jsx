import React, { useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import SearchPatient from "./pages/SearchPatient";
import RegisterPatient from "./pages/RegisterPatient";

function App() {
  const [panel, setPanel] = useState("dashboard");
  const user = { username: "ReceptionUser" }; // replace with real login API later

  const renderPanel = () => {
    if (panel === "dashboard") return <Dashboard />;
    if (panel === "search") return <SearchPatient />;
    if (panel === "register") return <RegisterPatient />;
  };

  return (
    <Router>
      <div className="container" style={{ display: "flex", height: "100vh" }}>
        <Sidebar onSelectPanel={setPanel} user={user} />
        <div className="content" style={{ flex: 1, padding: "30px", overflowY: "auto" }}>
          {renderPanel()}
        </div>
      </div>
    </Router>
  );
}

export default App;
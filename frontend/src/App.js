import { BrowserRouter, Routes, Route } from "react-router-dom";
import Reception from "./pages/Reception";
import Login from "./pages/Login";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />        {/* ✅ ADD THIS */}
        <Route path="/login" element={<Login />} />
        <Route path="/reception" element={<Reception />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Reception from './pages/Reception';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reception" element={<Reception />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
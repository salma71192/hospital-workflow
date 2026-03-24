import { useState } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

export default function Reception() {
  const [activePanel, setActivePanel] = useState('dashboard');
  const [patientsToday, setPatientsToday] = useState(0);
  const [patientsMonth, setPatientsMonth] = useState(0);

  const [fullName, setFullName] = useState('');
  const [fileNumber, setFileNumber] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();

  // Logout
  const handleLogout = async () => {
    await api.post('users/logout/');
    navigate('/login');
  };

  // Create patient
  const handleCreatePatient = async (e) => {
    e.preventDefault();

    try {
      await api.post('patients/create/', {
        full_name: fullName,
        file_number: fileNumber,
      });

      alert('Patient created');
      setFullName('');
      setFileNumber('');
    } catch (err) {
      alert('Error creating patient');
    }
  };

  // Search patient
  const handleSearch = async (e) => {
    e.preventDefault();
    navigate(`/search?q=${searchQuery}`);
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>

      {/* Sidebar */}
      <div style={{ width: '250px', background: '#2c3e50', color: 'white', padding: '20px' }}>
        <h2>Reception</h2>
        <p>Welcome!</p>

        <button onClick={() => setActivePanel('dashboard')}>Dashboard</button>
        <button onClick={() => setActivePanel('search')}>Search Patient</button>
        <button onClick={() => setActivePanel('register')}>Register Patient</button>

        <button onClick={handleLogout} style={{ background: 'red', color: 'white', marginTop: '20px' }}>
          Logout
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '30px' }}>

        {/* Dashboard */}
        {activePanel === 'dashboard' && (
          <div>
            <h1>Dashboard</h1>
            <p>Patients today: {patientsToday}</p>
            <p>Patients this month: {patientsMonth}</p>
          </div>
        )}

        {/* Search */}
        {activePanel === 'search' && (
          <div>
            <h2>Search Patient</h2>
            <form onSubmit={handleSearch}>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name or File Number"
              />
              <button type="submit">Search</button>
            </form>
          </div>
        )}

        {/* Register */}
        {activePanel === 'register' && (
          <div>
            <h2>Register Patient</h2>
            <form onSubmit={handleCreatePatient}>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name"
                required
              />
              <br /><br />
              <input
                value={fileNumber}
                onChange={(e) => setFileNumber(e.target.value)}
                placeholder="File Number"
                required
              />
              <br /><br />
              <button type="submit">Create Patient</button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
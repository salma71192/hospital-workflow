import { useState, useEffect } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

export default function Reception({ physios = [] }) {
  const [user, setUser] = useState(null);
  const [activePanel, setActivePanel] = useState('dashboard');

  const [patientsToday] = useState(0);
  const [patientsMonth] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');

  const [fullName, setFullName] = useState('');
  const [fileNumber, setFileNumber] = useState('');

  const [searchFileNumber, setSearchFileNumber] = useState('');
  const [foundPatient, setFoundPatient] = useState(null);
  const [assignPhysioId, setAssignPhysioId] = useState('');

  const navigate = useNavigate();

  // ✅ FETCH LOGGED-IN USER
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('users/me/');
        setUser(res.data);
      } catch (err) {
        console.error(err);
        navigate('/login');
      }
    };

    fetchUser();
  }, []);

  // Logout
  const handleLogout = async () => {
    await api.post('users/logout/');
    navigate('/login');
  };

  // Search (general)
  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?q=${searchQuery}`);
  };

  // Register Patient
  const handleCreatePatient = async (e) => {
    e.preventDefault();
    try {
      await api.post('patients/create/', {
        full_name: fullName,
        file_number: fileNumber,
      });

      alert(`✅ Patient "${fullName}" registered`);
      setFullName('');
      setFileNumber('');
    } catch {
      alert('Error creating patient');
    }
  };

  // Assign - search
  const handleSearchPatient = async (e) => {
    e.preventDefault();
    try {
      const res = await api.get(`patients/search/?file_number=${searchFileNumber}`);

      if (res.data.length > 0) {
        setFoundPatient(res.data[0]);
      } else {
        setFoundPatient(null);
        alert('Patient not found');
      }
    } catch {
      alert('Error searching');
    }
  };

  // Assign physio
  const handleAssignPhysio = async (e) => {
    e.preventDefault();
    try {
      await api.post(`patients/${foundPatient.id}/assign_physio/`, {
        physiotherapist_id: assignPhysioId,
      });

      alert('Assigned successfully');
      setFoundPatient(null);
      setSearchFileNumber('');
    } catch {
      alert('Error assigning');
    }
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <h2>Reception</h2>

        {/* ✅ USER NAME HERE */}
        <p style={styles.welcome}>
          Welcome back, <strong>{user?.username || '...'}</strong> 👋
        </p>

        <button style={styles.button} onClick={() => setActivePanel('dashboard')}>Dashboard</button>
        <button style={styles.button} onClick={() => setActivePanel('search')}>Search Patient</button>
        <button style={styles.button} onClick={() => setActivePanel('assign')}>Assign Patient</button>
        <button style={styles.button} onClick={() => setActivePanel('register')}>Register Patient</button>

        <button style={{ ...styles.button, ...styles.logout }} onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Content */}
      <div style={styles.content}>

        {activePanel === 'dashboard' && (
          <div>
            <h1>Dashboard</h1>
            <p>Patients today: {patientsToday}</p>
            <p>Patients this month: {patientsMonth}</p>
          </div>
        )}

        {activePanel === 'search' && (
          <form onSubmit={handleSearch}>
            <input style={styles.input} value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..." />
            <button style={styles.submitButton}>Search</button>
          </form>
        )}

        {activePanel === 'assign' && (
          <div>
            <h2>Assign Patient</h2>

            <form onSubmit={handleSearchPatient}>
              <input style={styles.input}
                placeholder="File Number"
                value={searchFileNumber}
                onChange={(e) => setSearchFileNumber(e.target.value)}
              />
              <button style={styles.submitButton}>Search</button>
            </form>

            {foundPatient && (
              <form onSubmit={handleAssignPhysio}>
                <p>{foundPatient.full_name}</p>

                <select style={styles.input}
                  value={assignPhysioId}
                  onChange={(e) => setAssignPhysioId(e.target.value)}>

                  <option value="">Select Physio</option>
                  {physios.map(p => (
                    <option key={p.id} value={p.id}>{p.username}</option>
                  ))}
                </select>

                <button style={styles.submitButton}>Assign</button>
              </form>
            )}
          </div>
        )}

        {activePanel === 'register' && (
          <form onSubmit={handleCreatePatient}>
            <input style={styles.input}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full Name" />

            <br /><br />

            <input style={styles.input}
              value={fileNumber}
              onChange={(e) => setFileNumber(e.target.value)}
              placeholder="File Number" />

            <br /><br />

            <button style={styles.submitButton}>Create</button>
          </form>
        )}

      </div>
    </div>
  );
}

// Styles
const styles = {
  container: { display: 'flex', height: '100vh' },
  sidebar: { width: '250px', background: '#2c3e50', color: 'white', padding: '20px' },
  welcome: { marginBottom: '20px' },
  button: { display: 'block', width: '100%', padding: '10px', marginBottom: '10px', background: '#34495e', color: 'white', border: 'none' },
  logout: { background: '#e74c3c' },
  content: { flex: 1, padding: '30px' },
  input: { padding: '10px', width: '100%' },
  submitButton: { padding: '10px', marginTop: '10px', background: '#1abc9c', color: 'white', border: 'none' },
};
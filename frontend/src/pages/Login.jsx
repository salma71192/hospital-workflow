import { useState } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post('users/login/', {
        username,
        password
      });

      if (res.data.success) {
        // ROLE BASED REDIRECT
        if (res.data.is_superuser) {
          navigate('/admin');
        } else if (res.data.role === 'reception') {
          navigate('/reception');
        } else if (res.data.role === 'physiotherapist') {
          navigate('/physio');
        } else if (res.data.role === 'callcenter') {
          navigate('/callcenter');
        } else if (res.data.role === 'approvals') {
          navigate('/approvals');
        } else if (res.data.role === 'rcm') {
          navigate('/rcm');
        } else {
          navigate('/visitors');
        }
      }

    } catch (err) {
      alert('Invalid username or password');
    }
  };

  return (
    <div className="login-box">
      <h1>Hospital Login</h1>

      <form onSubmit={handleLogin}>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />

        <button type="submit">Login</button>
      </form>
    </div>
  );
}
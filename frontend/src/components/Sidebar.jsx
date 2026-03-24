import { useNavigate } from 'react-router-dom';
import api from '../api/api';

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('users/logout/');
      navigate('/login');  // redirect to React login page
    } catch (error) {
      console.error('Logout failed');
    }
  };

  return (
    <button onClick={handleLogout} style={{ background: 'red', color: 'white' }}>
      Logout
    </button>
  );
}
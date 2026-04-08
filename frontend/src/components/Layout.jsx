import { useAuth } from '../auth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          <span className="logo-icon">💸</span>
          <span>SplitEase</span>
        </div>
        <div className="user-section">
          <div
            className="avatar"
            style={{ background: user?.avatar_color || '#6C5CE7', width: 32, height: 32, fontSize: '0.75rem' }}
          >
            {user?.name?.charAt(0) || '?'}
          </div>
          <span className="user-name">{user?.name}</span>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
      <motion.main
        className="app-content"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      >
        {children}
      </motion.main>
    </div>
  );
}

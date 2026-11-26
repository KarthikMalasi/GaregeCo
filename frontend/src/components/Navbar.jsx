import { useAuth } from '../context/AuthContext';
import NotificationPanel from './NotificationPanel';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'GG';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button type="button" className="menu-toggle" onClick={onMenuClick}>
          ☰
        </button>
        <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          GarageGo Platform
        </span>
      </div>

      <div className="topbar-right">
        <NotificationPanel />
        <div className="user-pill">
          <div className="user-avatar">{initials}</div>
          <div className="user-meta">
            <strong>{user?.name}</strong>
            <span>{user?.role}</span>
          </div>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;

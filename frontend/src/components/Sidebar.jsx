import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = {
  owner: [
    { to: '/owner', label: 'Dashboard', end: true },
    { to: '/owner/vehicles', label: 'My Vehicles' },
    { to: '/owner/garages', label: 'Explore Garages' },
    { to: '/owner/book', label: 'Book Service' },
    { to: '/owner/bookings', label: 'My Bookings' },
    { to: '/owner/track', label: 'Track Service' },
  ],
  manager: [
    { to: '/manager', label: 'Dashboard', end: true },
    { to: '/manager/bookings', label: 'Manage Bookings' },
    { to: '/manager/job-cards', label: 'Job Cards' },
    { to: '/manager/reports', label: 'Revenue & Reports' },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', end: true },
    { to: '/admin/users', label: 'Manage Users' },
    { to: '/admin/garages', label: 'Manage Garages' },
    { to: '/admin/bookings', label: 'All Bookings' },
  ],
};

const Sidebar = ({ open, onClose }) => {
  const { user } = useAuth();
  const links = NAV_ITEMS[user?.role] || [];

  return (
    <>
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">GG</div>
          <div className="brand-text">
            <h2>GarageGo</h2>
            <span>Your Vehicle. Our Priority.</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div>Signed in as</div>
          <strong style={{ color: '#f8fafc' }}>{user?.name}</strong>
          <div style={{ textTransform: 'capitalize' }}>Role: {user?.role}</div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

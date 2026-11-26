import { useState } from 'react';
import { useSocket } from '../context/SocketContext';

const NotificationPanel = () => {
  const { notifications, unreadCount, markAllRead, connected } = useSocket();
  const [open, setOpen] = useState(false);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      markAllRead();
    }
  };

  return (
    <div className="notif-wrapper">
      <button type="button" className="notif-btn" onClick={handleToggle}>
        <span className={`socket-dot ${connected ? 'online' : 'offline'}`} />
        <span>Alerts</span>
        {unreadCount > 0 && <span className="notif-count">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span>Live Notifications</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {connected ? 'Connected' : 'Reconnecting...'}
            </span>
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No real-time notifications yet.
            </div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`}>
                <div>{n.message}</div>
                <div className="notif-time">
                  {new Date(n.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;

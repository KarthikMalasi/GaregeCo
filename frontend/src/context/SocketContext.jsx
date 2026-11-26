import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL =
  (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [lastBookingEvent, setLastBookingEvent] = useState(null);

  const pushNotification = useCallback((event, payload) => {
    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      event,
      message: payload.message || `Booking update: ${payload.status}`,
      bookingId: payload.bookingId,
      status: payload.status,
      booking: payload.booking,
      read: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications((prev) => [item, ...prev].slice(0, 30));
    setToasts((prev) => [...prev, item]);
    setLastBookingEvent({ event, payload, timestamp: Date.now() });

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== item.id));
    }, 5500);
  }, []);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setConnected(false);
      return;
    }

    const token = localStorage.getItem('garagego_access_token');
    if (!token) return;

    const s = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));

    const events = [
      'bookingCreated',
      'bookingAccepted',
      'bookingRejected',
      'serviceStatusUpdated',
      'bookingCancelled',
    ];

    events.forEach((ev) => {
      s.on(ev, (payload) => pushNotification(ev, payload));
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [user, pushNotification]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        notifications,
        unreadCount,
        markAllRead,
        lastBookingEvent,
      }}
    >
      {children}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((t) => (
            <div key={t.id} className="toast">
              <strong>Live Update</strong>
              <div>{t.message}</div>
            </div>
          ))}
        </div>
      )}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside SocketProvider');
  return ctx;
};

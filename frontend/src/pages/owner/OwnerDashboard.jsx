import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import StatCard from '../../components/StatCard';
import BookingCard from '../../components/BookingCard';
import Loading from '../../components/Loading';

const OwnerDashboard = () => {
  const { lastBookingEvent } = useSocket();
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [vehRes, bookRes] = await Promise.all([
        apiRequest('/vehicles'),
        apiRequest('/bookings'),
      ]);
      setVehicles(vehRes.data || []);
      setBookings(bookRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (lastBookingEvent) {
      fetchData();
    }
  }, [lastBookingEvent, fetchData]);

  if (loading) return <Loading text="Loading owner dashboard..." />;

  const upcomingCount = bookings.filter((b) => ['PENDING', 'ACCEPTED'].includes(b.status)).length;
  const activeCount = bookings.filter((b) =>
    ['RECEIVED', 'IN SERVICE', 'READY'].includes(b.status)
  ).length;
  const completedCount = bookings.filter((b) => b.status === 'DELIVERED').length;
  const recentBookings = bookings.slice(0, 4);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Owner Dashboard</h1>
          <p className="page-subtitle">Overview of your vehicles and service appointments</p>
        </div>
        <Link to="/owner/book" className="btn btn-primary">
          + Book a Service
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard title="Registered Vehicles" value={vehicles.length} icon="🚗" color="blue" />
        <StatCard title="Upcoming Bookings" value={upcomingCount} icon="📅" color="orange" />
        <StatCard title="Active Services" value={activeCount} icon="🔧" color="purple" />
        <StatCard title="Completed Services" value={completedCount} icon="✅" color="green" />
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Booking Activity</h2>
          <Link to="/owner/bookings" className="btn btn-outline btn-sm">
            View All
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="empty-state">
            <h3>No bookings yet</h3>
            <p>Register a vehicle and book your first garage service.</p>
          </div>
        ) : (
          <div className="grid-2">
            {recentBookings.map((b) => (
              <BookingCard
                key={b._id}
                booking={b}
                actions={
                  <Link to="/owner/track" className="btn btn-outline btn-sm">
                    Track Progress
                  </Link>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;

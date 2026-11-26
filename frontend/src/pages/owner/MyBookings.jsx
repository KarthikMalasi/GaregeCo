import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import BookingCard from '../../components/BookingCard';
import Loading from '../../components/Loading';

const MyBookings = () => {
  const { lastBookingEvent } = useSocket();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadBookings = useCallback(async () => {
    try {
      const res = await apiRequest('/bookings');
      setBookings(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    if (lastBookingEvent) {
      loadBookings();
    }
  }, [lastBookingEvent, loadBookings]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    setError('');
    setSuccess('');
    try {
      await apiRequest(`/bookings/${id}/cancel`, {
        method: 'PUT',
        body: JSON.stringify({ notes: 'Cancelled by owner' }),
      });
      setSuccess('Booking cancelled successfully');
      loadBookings();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Loading text="Loading your bookings..." />;

  const filtered = bookings.filter((b) => {
    if (filter === 'ACTIVE') {
      return ['PENDING', 'ACCEPTED', 'RECEIVED', 'IN SERVICE', 'READY'].includes(b.status);
    }
    if (filter === 'DELIVERED') return b.status === 'DELIVERED';
    if (filter === 'CLOSED') return ['CANCELLED', 'REJECTED'].includes(b.status);
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Bookings</h1>
          <p className="page-subtitle">View booking history and manage upcoming appointments</p>
        </div>
        <Link to="/owner/book" className="btn btn-primary">
          + New Booking
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['ALL', 'ACTIVE', 'DELIVERED', 'CLOSED'].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`btn btn-sm ${filter === tab ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-state">
          <h3>No bookings in this view</h3>
          <p>Create a new booking to get started.</p>
        </div>
      ) : (
        <div className="grid-2">
          {filtered.map((b) => (
            <BookingCard
              key={b._id}
              booking={b}
              actions={
                <>
                  <Link to="/owner/track" className="btn btn-outline btn-sm">
                    Track
                  </Link>
                  {['PENDING', 'ACCEPTED'].includes(b.status) && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleCancel(b._id)}
                    >
                      Cancel
                    </button>
                  )}
                </>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;

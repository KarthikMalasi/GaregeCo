import { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import StatusBadge from '../../components/StatusBadge';
import Loading from '../../components/Loading';

const ManageBookings = () => {
  const { lastBookingEvent } = useSocket();
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
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

  const handleAction = async (bookingId, status) => {
    setError('');
    setSuccess('');
    try {
      await apiRequest(`/bookings/${bookingId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status,
          notes:
            status === 'ACCEPTED'
              ? 'Booking accepted by garage manager'
              : 'Booking rejected by garage manager',
        }),
      });
      setSuccess(`Booking ${status.toLowerCase()} successfully`);
      loadBookings();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Loading text="Loading bookings..." />;

  const filtered =
    statusFilter === 'ALL' ? bookings : bookings.filter((b) => b.status === statusFilter);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Bookings</h1>
          <p className="page-subtitle">Accept or reject incoming service requests</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['ALL', 'PENDING', 'ACCEPTED', 'RECEIVED', 'IN SERVICE', 'READY', 'DELIVERED'].map(
          (st) => (
            <button
              key={st}
              type="button"
              className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setStatusFilter(st)}
            >
              {st}
            </button>
          )
        )}
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <h3>No bookings found</h3>
            <p>No bookings match the selected status filter.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Owner</th>
                  <th>Requested Services</th>
                  <th>Date & Slot</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b._id}>
                    <td>
                      <strong>{b.vehicle?.registrationNumber}</strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {b.vehicle?.brand} {b.vehicle?.model} ({b.vehicle?.fuelType})
                      </div>
                    </td>
                    <td>
                      <div>{b.owner?.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {b.owner?.phone}
                      </div>
                    </td>
                    <td>{b.services?.map((s) => s.name).join(', ')}</td>
                    <td>
                      {new Date(b.appointmentDate).toLocaleDateString('en-IN', {
                        timeZone: 'UTC',
                      })}
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {b.timeSlot}
                      </div>
                    </td>
                    <td>₹{b.totalAmount}</td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td>
                      {b.status === 'PENDING' ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            className="btn btn-success btn-sm"
                            onClick={() => handleAction(b._id, 'ACCEPTED')}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleAction(b._id, 'REJECTED')}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {b.mechanicName ? `Mech: ${b.mechanicName}` : 'Processed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageBookings;

import { useEffect, useState } from 'react';
import { apiRequest } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import Loading from '../../components/Loading';

const AllBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const res = await apiRequest('/admin/bookings');
        setBookings(res.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadBookings();
  }, []);

  if (loading) return <Loading text="Loading all platform bookings..." />;

  const filtered =
    statusFilter === 'ALL' ? bookings : bookings.filter((b) => b.status === statusFilter);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">All Platform Bookings</h1>
          <p className="page-subtitle">Complete overview of bookings across all garages</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['ALL', 'PENDING', 'ACCEPTED', 'RECEIVED', 'IN SERVICE', 'READY', 'DELIVERED', 'CANCELLED', 'REJECTED'].map(
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
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Owner</th>
                  <th>Garage</th>
                  <th>Date & Slot</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b._id}>
                    <td>
                      <strong>{b.vehicle?.registrationNumber}</strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {b.vehicle?.brand} {b.vehicle?.model}
                      </div>
                    </td>
                    <td>{b.owner?.name}</td>
                    <td>{b.garage?.name}</td>
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

export default AllBookings;

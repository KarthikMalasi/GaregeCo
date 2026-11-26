import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Loading from '../../components/Loading';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const { lastBookingEvent } = useSocket();
  const [bookings, setBookings] = useState([]);
  const [revenueSummary, setRevenueSummary] = useState({ totalRevenue: 0, totalCompletedBookings: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!user?.isApproved) {
      setLoading(false);
      return;
    }
    try {
      const [bRes, rRes] = await Promise.all([
        apiRequest('/bookings'),
        apiRequest('/reports/revenue'),
      ]);
      setBookings(bRes.data || []);
      setRevenueSummary(rRes.data?.summary || { totalRevenue: 0, totalCompletedBookings: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.isApproved]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (lastBookingEvent) {
      loadData();
    }
  }, [lastBookingEvent, loadData]);

  if (loading) return <Loading text="Loading manager dashboard..." />;

  if (!user?.isApproved) {
    return (
      <div className="card">
        <div className="alert alert-warning" style={{ marginBottom: 0 }}>
          <div>
            <strong>Pending Admin Approval:</strong> Your garage manager account is awaiting
            administrator approval. Once approved, you will have full access to manage bookings,
            job cards, and reports.
          </div>
        </div>
      </div>
    );
  }

  const pendingCount = bookings.filter((b) => b.status === 'PENDING').length;
  const inServiceCount = bookings.filter((b) =>
    ['RECEIVED', 'IN SERVICE', 'READY'].includes(b.status)
  ).length;
  const completedCount = bookings.filter((b) => b.status === 'DELIVERED').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Garage Manager Dashboard</h1>
          <p className="page-subtitle">Monitor bookings, active service bays, and revenue</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/manager/bookings" className="btn btn-outline">
            Manage Bookings
          </Link>
          <Link to="/manager/job-cards" className="btn btn-primary">
            Open Job Cards
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard title="Total Bookings" value={bookings.length} icon="📋" color="blue" />
        <StatCard title="Pending Requests" value={pendingCount} icon="⏳" color="orange" />
        <StatCard title="In Service" value={inServiceCount} icon="🔧" color="purple" />
        <StatCard
          title="Total Revenue"
          value={`₹${(revenueSummary.totalRevenue || 0).toLocaleString('en-IN')}`}
          subtitle={`${completedCount} delivered`}
          icon="💰"
          color="green"
        />
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Bookings</h2>
          <Link to="/manager/bookings" className="btn btn-outline btn-sm">
            View All
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="empty-state">
            <h3>No bookings yet</h3>
            <p>Incoming vehicle service requests will appear here in real time.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Owner</th>
                  <th>Date & Slot</th>
                  <th>Services</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 6).map((b) => (
                  <tr key={b._id}>
                    <td>
                      <strong>{b.vehicle?.registrationNumber}</strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {b.vehicle?.brand} {b.vehicle?.model}
                      </div>
                    </td>
                    <td>
                      <div>{b.owner?.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {b.owner?.phone}
                      </div>
                    </td>
                    <td>
                      {new Date(b.appointmentDate).toLocaleDateString('en-IN', {
                        timeZone: 'UTC',
                      })}
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {b.timeSlot}
                      </div>
                    </td>
                    <td>{b.services?.map((s) => s.name).join(', ')}</td>
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

export default ManagerDashboard;

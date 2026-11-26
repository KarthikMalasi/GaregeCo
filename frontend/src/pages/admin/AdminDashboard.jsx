import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import StatCard from '../../components/StatCard';
import Loading from '../../components/Loading';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    garages: 0,
    vehicles: 0,
    bookings: 0,
    revenue: 0,
  });
  const [revenueByGarage, setRevenueByGarage] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const [uRes, gRes, vRes, bRes, revRes, svcRes] = await Promise.all([
          apiRequest('/admin/users'),
          apiRequest('/admin/garages'),
          apiRequest('/vehicles'),
          apiRequest('/admin/bookings'),
          apiRequest('/reports/revenue'),
          apiRequest('/reports/services'),
        ]);

        setStats({
          users: (uRes.data || []).length,
          garages: (gRes.data || []).length,
          vehicles: (vRes.data || []).length,
          bookings: (bRes.data || []).length,
          revenue: revRes.data?.summary?.totalRevenue || 0,
        });
        setRevenueByGarage(revRes.data?.revenueByGarage || []);
        setTopServices(svcRes.data?.services || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadAdminData();
  }, []);

  if (loading) return <Loading text="Loading platform overview..." />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Platform-wide metrics, approvals, and revenue analytics</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/admin/users" className="btn btn-outline">
            Manage Users
          </Link>
          <Link to="/admin/garages" className="btn btn-primary">
            Manage Garages
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard title="Total Users" value={stats.users} icon="👥" color="blue" />
        <StatCard title="Registered Garages" value={stats.garages} icon="🏭" color="orange" />
        <StatCard title="Total Vehicles" value={stats.vehicles} icon="🚗" color="purple" />
        <StatCard
          title="Platform Revenue"
          value={`₹${stats.revenue.toLocaleString('en-IN')}`}
          subtitle={`${stats.bookings} total bookings`}
          icon="💰"
          color="green"
        />
      </div>

      <div className="grid-2">
        <div className="card">
          <h2 className="card-title" style={{ marginBottom: 14 }}>
            Revenue by Garage (Delivered)
          </h2>
          {revenueByGarage.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No completed revenue data yet.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Garage</th>
                    <th>Completed</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueByGarage.map((g) => (
                    <tr key={g.garageId}>
                      <td>
                        <strong>{g.garageName}</strong>
                      </td>
                      <td>{g.completedBookings}</td>
                      <td>₹{g.revenue.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="card-title" style={{ marginBottom: 14 }}>
            Most Popular Services
          </h2>
          {topServices.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No service data yet.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Bookings</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topServices.slice(0, 6).map((s) => (
                    <tr key={s.serviceId}>
                      <td>
                        <strong>{s.serviceName}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {s.category}
                        </div>
                      </td>
                      <td>{s.bookingCount}</td>
                      <td>₹{s.totalRevenue.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

import { useEffect, useState } from 'react';
import { apiRequest } from '../../services/api';
import StatCard from '../../components/StatCard';
import Loading from '../../components/Loading';

const Reports = () => {
  const [revenueData, setRevenueData] = useState(null);
  const [serviceData, setServiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadReports = async () => {
      try {
        const [revRes, svcRes] = await Promise.all([
          apiRequest('/reports/revenue'),
          apiRequest('/reports/services'),
        ]);
        setRevenueData(revRes.data);
        setServiceData(svcRes.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, []);

  if (loading) return <Loading text="Generating MongoDB aggregation reports..." />;

  const summary = revenueData?.summary || {
    totalRevenue: 0,
    totalCompletedBookings: 0,
    averageBookingValue: 0,
  };
  const byMonth = revenueData?.revenueByMonth || [];
  const byGarage = revenueData?.revenueByGarage || [];
  const services = serviceData?.services || [];
  const topService = serviceData?.mostPopularService;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Revenue & Service Reports</h1>
          <p className="page-subtitle">
            Powered by MongoDB Aggregation Pipelines (DELIVERED bookings only)
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard
          title="Total Revenue"
          value={`₹${(summary.totalRevenue || 0).toLocaleString('en-IN')}`}
          icon="💰"
          color="green"
        />
        <StatCard
          title="Completed Bookings"
          value={summary.totalCompletedBookings || 0}
          icon="✅"
          color="blue"
        />
        <StatCard
          title="Avg. Booking Value"
          value={`₹${(summary.averageBookingValue || 0).toLocaleString('en-IN')}`}
          icon="📊"
          color="purple"
        />
        <StatCard
          title="Top Service"
          value={topService ? topService.serviceName : 'N/A'}
          subtitle={topService ? `${topService.bookingCount} bookings` : ''}
          icon="⭐"
          color="orange"
        />
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h2 className="card-title" style={{ marginBottom: 14 }}>
            Revenue by Month
          </h2>
          {byMonth.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No completed bookings yet.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Completed Bookings</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {byMonth.map((row) => (
                    <tr key={row.period}>
                      <td>
                        <strong>{row.period}</strong>
                      </td>
                      <td>{row.completedBookings}</td>
                      <td>₹{row.revenue.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="card-title" style={{ marginBottom: 14 }}>
            Revenue by Garage
          </h2>
          {byGarage.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No garage revenue data yet.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Garage</th>
                    <th>Bookings</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {byGarage.map((g) => (
                    <tr key={g.garageId}>
                      <td>
                        <strong>{g.garageName}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {g.address}
                        </div>
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
      </div>

      <div className="card">
        <h2 className="card-title" style={{ marginBottom: 14 }}>
          Service-wise Breakdown
        </h2>
        {services.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No service analytics available yet.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Service Name</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>Bookings Count</th>
                  <th>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.serviceId}>
                    <td>
                      <strong>{s.serviceName}</strong>
                    </td>
                    <td>{s.category}</td>
                    <td>₹{s.unitPrice}</td>
                    <td>{s.bookingCount}</td>
                    <td>
                      <strong>₹{s.totalRevenue.toLocaleString('en-IN')}</strong>
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

export default Reports;

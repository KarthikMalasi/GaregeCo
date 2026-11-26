import { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import StatusBadge from '../../components/StatusBadge';
import Loading from '../../components/Loading';

const STAGES = ['RECEIVED', 'IN SERVICE', 'READY', 'DELIVERED'];

const TrackService = () => {
  const { lastBookingEvent, connected } = useSocket();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBookings = useCallback(async () => {
    try {
      const res = await apiRequest('/bookings');
      const activeOrRecent = (res.data || []).filter(
        (b) => !['CANCELLED', 'REJECTED'].includes(b.status)
      );
      setBookings(activeOrRecent);
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

  if (loading) return <Loading text="Loading live service tracker..." />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Live Service Tracker</h1>
          <p className="page-subtitle">
            Real-time repair updates via Socket.IO{' '}
            <span style={{ fontWeight: 600, color: connected ? 'var(--green)' : 'var(--red)' }}>
              ({connected ? 'Live Connected' : 'Reconnecting...'})
            </span>
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {bookings.length === 0 ? (
        <div className="card empty-state">
          <h3>No active services to track</h3>
          <p>Once your booking is created and received by a garage, live progress appears here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {bookings.map((b) => {
            const currentIdx = STAGES.indexOf(b.status);

            return (
              <div key={b._id} className="card">
                <div className="card-header">
                  <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                      {b.vehicle?.brand} {b.vehicle?.model} ({b.vehicle?.registrationNumber})
                    </h2>
                    <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                      {b.garage?.name} • {b.timeSlot}
                      {b.mechanicName ? ` • Mechanic: ${b.mechanicName}` : ''}
                    </div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>

                {/* Mandatory 4-stage flow stepper */}
                <div className="stepper">
                  {STAGES.map((stage, idx) => {
                    let cls = '';
                    if (currentIdx > idx || b.status === 'DELIVERED') {
                      cls = 'completed';
                    } else if (currentIdx === idx) {
                      cls = 'current';
                    }

                    return (
                      <div key={stage} className={`step-item ${cls}`}>
                        <div className="step-circle">
                          {cls === 'completed' ? '✓' : idx + 1}
                        </div>
                        <div className="step-label">{stage}</div>
                      </div>
                    );
                  })}
                </div>

                {b.notes && (
                  <div
                    style={{
                      padding: '10px 14px',
                      background: '#f8fafc',
                      borderRadius: 8,
                      fontSize: '0.86rem',
                      marginBottom: 12,
                    }}
                  >
                    <strong>Latest Manager Note:</strong> {b.notes}
                  </div>
                )}

                {b.statusHistory && b.statusHistory.length > 0 && (
                  <div>
                    <strong style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      Status Timeline
                    </strong>
                    <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {b.statusHistory.map((h, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.82rem',
                            color: 'var(--text-secondary)',
                            borderLeft: '2px solid var(--accent)',
                            paddingLeft: 10,
                          }}
                        >
                          <span>
                            <strong>{h.status}</strong>
                            {h.notes ? ` — ${h.notes}` : ''}
                          </span>
                          <span>{new Date(h.updatedAt).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TrackService;

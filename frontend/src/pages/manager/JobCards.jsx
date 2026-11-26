import { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import StatusBadge from '../../components/StatusBadge';
import Loading from '../../components/Loading';

const NEXT_STATUS = {
  ACCEPTED: 'RECEIVED',
  RECEIVED: 'IN SERVICE',
  'IN SERVICE': 'READY',
  READY: 'DELIVERED',
};

const JobCards = () => {
  const { lastBookingEvent } = useSocket();
  const [bookings, setBookings] = useState([]);
  const [edits, setEdits] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadBookings = useCallback(async () => {
    try {
      const res = await apiRequest('/bookings');
      const relevant = (res.data || []).filter((b) =>
        ['ACCEPTED', 'RECEIVED', 'IN SERVICE', 'READY', 'DELIVERED'].includes(b.status)
      );
      setBookings(relevant);
      const initialEdits = {};
      relevant.forEach((b) => {
        initialEdits[b._id] = {
          mechanicName: b.mechanicName || '',
          notes: b.notes || '',
        };
      });
      setEdits(initialEdits);
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

  const handleFieldChange = (id, field, value) => {
    setEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleUpdate = async (booking, nextStatus) => {
    setError('');
    setSuccess('');
    const currentEdit = edits[booking._id] || {};
    try {
      await apiRequest(`/bookings/${booking._id}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: nextStatus || booking.status,
          mechanicName: currentEdit.mechanicName,
          notes: currentEdit.notes,
        }),
      });
      setSuccess(
        nextStatus
          ? `Job card moved to ${nextStatus} & owner notified!`
          : 'Job card details saved'
      );
      loadBookings();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Loading text="Loading job cards..." />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Job Cards & Service Workflow</h1>
          <p className="page-subtitle">
            Status flow: RECEIVED → IN SERVICE → READY → DELIVERED (Live Socket.IO updates)
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {bookings.length === 0 ? (
        <div className="card empty-state">
          <h3>No active job cards</h3>
          <p>Accept a pending booking to start a job card.</p>
        </div>
      ) : (
        <div className="grid-2">
          {bookings.map((b) => {
            const nextStatus = NEXT_STATUS[b.status];
            const formState = edits[b._id] || { mechanicName: '', notes: '' };

            return (
              <div key={b._id} className="card">
                <div className="card-header">
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                      {b.vehicle?.brand} {b.vehicle?.model} ({b.vehicle?.registrationNumber})
                    </h3>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      Owner: {b.owner?.name} ({b.owner?.phone}) • {b.timeSlot}
                    </div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>

                <div className="service-chips" style={{ marginBottom: 14 }}>
                  {b.services?.map((s) => (
                    <span key={s._id} className="chip">
                      {s.name}
                    </span>
                  ))}
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Mechanic</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter mechanic name"
                    value={formState.mechanicName}
                    disabled={b.status === 'DELIVERED'}
                    onChange={(e) => handleFieldChange(b._id, 'mechanicName', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Service Notes</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Inspection findings or repair notes..."
                    value={formState.notes}
                    disabled={b.status === 'DELIVERED'}
                    onChange={(e) => handleFieldChange(b._id, 'notes', e.target.value)}
                  />
                </div>

                {b.status !== 'DELIVERED' && (
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => handleUpdate(b, null)}
                    >
                      Save Notes
                    </button>
                    {nextStatus && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleUpdate(b, nextStatus)}
                      >
                        Move to {nextStatus} →
                      </button>
                    )}
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

export default JobCards;

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import Loading from '../../components/Loading';

const TIME_SLOTS = [
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '12:00 - 13:00',
  '14:00 - 15:00',
  '15:00 - 16:00',
  '16:00 - 17:00',
  '17:00 - 18:00',
];

const BookService = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [garages, setGarages] = useState([]);
  const [services, setServices] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);

  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedGarage, setSelectedGarage] = useState(searchParams.get('garage') || '');
  const [selectedServices, setSelectedServices] = useState([]);
  const [appointmentDate, setAppointmentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [timeSlot, setTimeSlot] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [vRes, gRes] = await Promise.all([
          apiRequest('/vehicles'),
          apiRequest('/garages'),
        ]);
        const vList = vRes.data || [];
        const gList = gRes.data || [];
        setVehicles(vList);
        setGarages(gList);

        if (vList.length > 0) setSelectedVehicle(vList[0]._id);
        if (!selectedGarage && gList.length > 0) setSelectedGarage(gList[0]._id);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
  }, []);

  useEffect(() => {
    if (!selectedGarage) return;
    const loadServices = async () => {
      try {
        const res = await apiRequest(`/services?garage=${selectedGarage}`);
        setServices(res.data || []);
        setSelectedServices([]);
      } catch (err) {
        setError(err.message);
      }
    };
    loadServices();
  }, [selectedGarage]);

  useEffect(() => {
    if (!selectedGarage || !appointmentDate) return;
    const loadSlots = async () => {
      try {
        const res = await apiRequest(
          `/bookings/slots?garage=${selectedGarage}&date=${appointmentDate}`
        );
        setBookedSlots(res.data || []);
        setTimeSlot('');
      } catch {
        setBookedSlots([]);
      }
    };
    loadSlots();
  }, [selectedGarage, appointmentDate]);

  const toggleService = (serviceId) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const selectedServiceObjects = services.filter((s) => selectedServices.includes(s._id));
  const totalAmount = selectedServiceObjects.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServiceObjects.reduce((sum, s) => sum + s.estimatedDuration, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (selectedServices.length === 0) {
      setError('Please select at least one service.');
      return;
    }
    if (!timeSlot) {
      setError('Please select an available time slot.');
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          vehicle: selectedVehicle,
          garage: selectedGarage,
          services: selectedServices,
          appointmentDate,
          timeSlot,
          notes,
        }),
      });
      navigate('/owner/bookings');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading text="Loading booking form..." />;

  if (vehicles.length === 0) {
    return (
      <div className="card empty-state">
        <h3>No registered vehicles</h3>
        <p>Please register a vehicle before booking a service.</p>
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: 12 }}
          onClick={() => navigate('/owner/vehicles')}
        >
          Register Vehicle
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Book a Service</h1>
          <p className="page-subtitle">Select your vehicle, garage, services, and preferred time slot</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="grid-2">
        <div className="card">
          <h2 className="card-title" style={{ marginBottom: 16 }}>
            1. Vehicle & Garage Details
          </h2>

          <div className="form-group">
            <label className="form-label">Select Vehicle</label>
            <select
              className="form-select"
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              required
            >
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.brand} {v.model} — {v.registrationNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Select Garage</label>
            <select
              className="form-select"
              value={selectedGarage}
              onChange={(e) => setSelectedGarage(e.target.value)}
              required
            >
              {garages.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name} ({g.address})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Appointment Date</label>
            <input
              type="date"
              className="form-input"
              min={new Date().toISOString().split('T')[0]}
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Select Available Time Slot</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {TIME_SLOTS.map((slot) => {
                const isBooked = bookedSlots.includes(slot);
                const isSelected = timeSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={isBooked}
                    onClick={() => setTimeSlot(slot)}
                    className={`btn btn-sm ${
                      isSelected ? 'btn-primary' : 'btn-outline'
                    }`}
                    style={
                      isBooked
                        ? { textDecoration: 'line-through', opacity: 0.45 }
                        : undefined
                    }
                  >
                    {slot} {isBooked ? '(Booked)' : ''}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Additional Notes (Optional)</label>
            <textarea
              className="form-textarea"
              placeholder="Describe any specific issue or request..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h2 className="card-title" style={{ marginBottom: 16 }}>
              2. Select Services
            </h2>

            {services.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No services available for this garage.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {services.map((svc) => {
                  const checked = selectedServices.includes(svc._id);
                  return (
                    <label
                      key={svc._id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 12,
                        borderRadius: 8,
                        border: `1px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
                        background: checked ? 'var(--accent-soft)' : '#ffffff',
                        cursor: 'pointer',
                        gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleService(svc._id)}
                          style={{ marginTop: 4 }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{svc.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {svc.category} • ~{svc.estimatedDuration} mins
                          </div>
                        </div>
                      </div>
                      <strong style={{ color: 'var(--text-primary)' }}>₹{svc.price}</strong>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Selected Services</span>
              <strong>{selectedServices.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Estimated Duration</span>
              <strong>{totalDuration} mins</strong>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.15rem',
                marginBottom: 16,
              }}
            >
              <strong>Estimated Total</strong>
              <strong style={{ color: 'var(--accent)' }}>
                ₹{totalAmount.toLocaleString('en-IN')}
              </strong>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={submitting || selectedServices.length === 0}
            >
              {submitting ? 'Confirming Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BookService;

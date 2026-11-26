import { useEffect, useState } from 'react';
import { apiRequest } from '../../services/api';
import Loading from '../../components/Loading';

const EMPTY_FORM = {
  registrationNumber: '',
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  fuelType: 'Petrol',
  vehicleType: 'Sedan',
};

const MyVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadVehicles = async () => {
    try {
      const res = await apiRequest('/vehicles');
      setVehicles(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError('');
  };

  const handleEdit = (v) => {
    setEditingId(v._id);
    setForm({
      registrationNumber: v.registrationNumber,
      brand: v.brand,
      model: v.model,
      year: v.year,
      fuelType: v.fuelType,
      vehicleType: v.vehicleType,
    });
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    setError('');
    setSuccess('');
    try {
      await apiRequest(`/vehicles/${id}`, { method: 'DELETE' });
      setVehicles((prev) => prev.filter((v) => v._id !== id));
      setSuccess('Vehicle deleted successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const payload = { ...form, year: Number(form.year) };
      if (editingId) {
        const res = await apiRequest(`/vehicles/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setVehicles((prev) => prev.map((v) => (v._id === editingId ? res.data : v)));
        setSuccess('Vehicle updated successfully');
      } else {
        const res = await apiRequest('/vehicles', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setVehicles((prev) => [res.data, ...prev]);
        setSuccess('Vehicle registered successfully');
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading text="Loading your vehicles..." />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Vehicles</h1>
          <p className="page-subtitle">Manage your registered vehicles</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
          + Add Vehicle
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h2 className="card-title">{editingId ? 'Edit Vehicle' : 'Register New Vehicle'}</h2>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid-3">
            <div className="form-group">
              <label className="form-label">Registration Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. MH12AB1234"
                value={form.registrationNumber}
                onChange={(e) =>
                  setForm({ ...form, registrationNumber: e.target.value.toUpperCase() })
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Brand</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Hyundai"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Model</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Creta"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Manufacturing Year</label>
              <input
                type="number"
                className="form-input"
                min="1950"
                max={new Date().getFullYear() + 1}
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Fuel Type</label>
              <select
                className="form-select"
                value={form.fuelType}
                onChange={(e) => setForm({ ...form, fuelType: e.target.value })}
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
                <option value="CNG">CNG</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Vehicle Type</label>
              <select
                className="form-select"
                value={form.vehicleType}
                onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
              >
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Hatchback">Hatchback</option>
                <option value="Motorcycle">Motorcycle</option>
                <option value="Truck">Truck</option>
                <option value="Van">Van</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : editingId ? 'Update Vehicle' : 'Register Vehicle'}
              </button>
            </div>
          </form>
        </div>
      )}

      {vehicles.length === 0 ? (
        <div className="card empty-state">
          <h3>No vehicles registered</h3>
          <p>Click &quot;+ Add Vehicle&quot; to register your first vehicle.</p>
        </div>
      ) : (
        <div className="grid-3">
          {vehicles.map((v) => (
            <div key={v._id} className="card">
              <div className="card-header" style={{ marginBottom: 8 }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                    {v.brand} {v.model}
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 700 }}>
                    {v.registrationNumber}
                  </span>
                </div>
                <span className="chip">{v.vehicleType}</span>
              </div>

              <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
                <div>Year: {v.year}</div>
                <div>Fuel: {v.fuelType}</div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => handleEdit(v)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(v._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyVehicles;

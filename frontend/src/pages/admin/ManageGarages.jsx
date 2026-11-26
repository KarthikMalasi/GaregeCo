import { useEffect, useState } from 'react';
import { apiRequest } from '../../services/api';
import Loading from '../../components/Loading';

const ManageGarages = () => {
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadGarages = async () => {
    try {
      const res = await apiRequest('/admin/garages');
      setGarages(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGarages();
  }, []);

  const handleToggleApprove = async (garage) => {
    setError('');
    setSuccess('');
    try {
      const res = await apiRequest(`/admin/garages/${garage._id}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !garage.isActive }),
      });
      setGarages((prev) => prev.map((g) => (g._id === garage._id ? res.data : g)));
      setSuccess(res.message);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Loading text="Loading garages..." />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Garages</h1>
          <p className="page-subtitle">Approve or deactivate service centers on GarageGo</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        {garages.length === 0 ? (
          <div className="empty-state">
            <h3>No garages registered</h3>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Garage Name</th>
                  <th>Address & Phone</th>
                  <th>Manager</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {garages.map((g) => (
                  <tr key={g._id}>
                    <td>
                      <strong>{g.name}</strong>
                    </td>
                    <td>
                      <div>{g.address}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {g.phone}
                      </div>
                    </td>
                    <td>
                      <div>{g.manager?.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {g.manager?.email}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${g.isActive ? 'badge-delivered' : 'badge-rejected'}`}>
                        {g.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`btn btn-sm ${g.isActive ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => handleToggleApprove(g)}
                      >
                        {g.isActive ? 'Deactivate' : 'Approve & Activate'}
                      </button>
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

export default ManageGarages;

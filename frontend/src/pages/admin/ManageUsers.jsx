import { useEffect, useState } from 'react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loading from '../../components/Loading';

const ManageUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadUsers = async () => {
    try {
      const res = await apiRequest('/admin/users');
      setUsers(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleUpdateUser = async (userId, updates) => {
    setError('');
    setSuccess('');
    try {
      const res = await apiRequest(`/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      setUsers((prev) => prev.map((u) => (u._id === userId ? res.data : u)));
      setSuccess('User updated successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Loading text="Loading users..." />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Users</h1>
          <p className="page-subtitle">Approve garage managers and manage platform accounts</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email & Phone</th>
                <th>Role</th>
                <th>Approval</th>
                <th>Account Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <strong>{u.name}</strong>
                  </td>
                  <td>
                    <div>{u.email}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {u.phone}
                    </div>
                  </td>
                  <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{u.role}</td>
                  <td>
                    <span className={`badge ${u.isApproved ? 'badge-delivered' : 'badge-pending'}`}>
                      {u.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge-accepted' : 'badge-rejected'}`}>
                      {u.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {u.role === 'manager' && (
                        <button
                          type="button"
                          className={`btn btn-sm ${u.isApproved ? 'btn-outline' : 'btn-success'}`}
                          onClick={() => handleUpdateUser(u._id, { isApproved: !u.isApproved })}
                        >
                          {u.isApproved ? 'Revoke Approval' : 'Approve Manager'}
                        </button>
                      )}
                      {u._id !== currentUser?._id && (
                        <button
                          type="button"
                          className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-secondary'}`}
                          onClick={() => handleUpdateUser(u._id, { isActive: !u.isActive })}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;

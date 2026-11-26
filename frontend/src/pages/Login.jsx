import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_HOME = {
  owner: '/owner',
  manager: '/manager',
  admin: '/admin',
};

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(ROLE_HOME[user.role] || '/owner', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-logo">GG</div>
          <div>
            <h1>GarageGo</h1>
            <p>Your Vehicle. Our Priority.</p>
          </div>
        </div>

        <h2 style={{ fontSize: '1.2rem', marginBottom: 6 }}>Welcome back</h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
          Sign in to manage your vehicles, bookings, or garage operations.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don&apos;t have an account? <Link to="/register">Create account</Link>
        </div>

        <div className="demo-box">
          <strong>Demo Accounts (Password: Password@123)</strong>
          <div>Owner: rahul.owner@garagego.com</div>
          <div>Manager: vikram.manager@garagego.com</div>
          <div>Admin: admin@garagego.com</div>
        </div>
      </div>
    </div>
  );
};

export default Login;

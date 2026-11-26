import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import Loading from '../../components/Loading';

const ExploreGarages = () => {
  const [garages, setGarages] = useState([]);
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [gRes, sRes] = await Promise.all([
          apiRequest('/garages'),
          apiRequest('/services'),
        ]);
        setGarages(gRes.data || []);
        setServices(sRes.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loading text="Loading garages & services..." />;

  const categories = [...new Set(services.map((s) => s.category))];

  const filteredGarages = garages.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Explore Garages & Services</h1>
          <p className="page-subtitle">Browse verified service centers and their service catalogues</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input
          type="text"
          className="form-input"
          style={{ flex: '1 1 240px' }}
          placeholder="Search garage by name or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="form-select"
          style={{ width: 220 }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Service Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {filteredGarages.length === 0 ? (
        <div className="card empty-state">
          <h3>No matching garages found</h3>
          <p>Try adjusting your search filter.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {filteredGarages.map((garage) => {
            const garageServices = services.filter(
              (s) =>
                (s.garage?._id || s.garage) === garage._id &&
                (!categoryFilter || s.category === categoryFilter)
            );

            return (
              <div key={garage._id} className="card">
                <div className="card-header">
                  <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{garage.name}</h2>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                      📍 {garage.address} • 📞 {garage.phone}
                    </div>
                    {garage.description && (
                      <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: 6 }}>
                        {garage.description}
                      </p>
                    )}
                  </div>
                  <Link to={`/owner/book?garage=${garage._id}`} className="btn btn-primary">
                    Book Service
                  </Link>
                </div>

                {garageServices.length === 0 ? (
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    No services match the selected category.
                  </p>
                ) : (
                  <div className="grid-3">
                    {garageServices.map((svc) => (
                      <div
                        key={svc._id}
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: 10,
                          padding: 14,
                          background: '#f8fafc',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                          <strong style={{ fontSize: '0.95rem' }}>{svc.name}</strong>
                          <span className="chip">{svc.category}</span>
                        </div>
                        <p
                          style={{
                            fontSize: '0.82rem',
                            color: 'var(--text-secondary)',
                            margin: '6px 0 10px',
                          }}
                        >
                          {svc.description}
                        </p>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.84rem',
                            fontWeight: 600,
                          }}
                        >
                          <span style={{ color: 'var(--accent)' }}>₹{svc.price}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            ~{svc.estimatedDuration} mins
                          </span>
                        </div>
                      </div>
                    ))}
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

export default ExploreGarages;

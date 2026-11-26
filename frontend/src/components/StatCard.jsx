const StatCard = ({ title, value, icon, color = 'orange', subtitle }) => (
  <div className="stat-card">
    <div>
      <div className="stat-label">{title}</div>
      <div className="stat-value">{value}</div>
      {subtitle && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
          {subtitle}
        </div>
      )}
    </div>
    <div className={`stat-icon ${color}`}>{icon}</div>
  </div>
);

export default StatCard;

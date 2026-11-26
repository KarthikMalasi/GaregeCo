import StatusBadge from './StatusBadge';

const BookingCard = ({ booking, actions }) => {
  const dateLabel = new Date(booking.appointmentDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return (
    <div className="booking-card">
      <div className="booking-card-top">
        <div>
          <strong style={{ fontSize: '1rem' }}>
            {booking.vehicle?.brand} {booking.vehicle?.model} ({booking.vehicle?.registrationNumber})
          </strong>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            {booking.garage?.name} • {dateLabel} • {booking.timeSlot}
          </div>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="service-chips">
        {booking.services?.map((s) => (
          <span key={s._id} className="chip">
            {s.name} (₹{s.price})
          </span>
        ))}
      </div>

      {booking.mechanicName && (
        <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          <strong>Mechanic:</strong> {booking.mechanicName}
        </div>
      )}

      {booking.notes && (
        <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          <strong>Notes:</strong> {booking.notes}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid var(--border)',
          paddingTop: 10,
          marginTop: 4,
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <strong style={{ color: 'var(--text-primary)' }}>
          Total: ₹{booking.totalAmount?.toLocaleString('en-IN')}
        </strong>
        {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
      </div>
    </div>
  );
};

export default BookingCard;

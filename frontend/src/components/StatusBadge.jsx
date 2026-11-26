const STATUS_CLASSES = {
  PENDING: 'badge-pending',
  ACCEPTED: 'badge-accepted',
  RECEIVED: 'badge-received',
  'IN SERVICE': 'badge-in-service',
  READY: 'badge-ready',
  DELIVERED: 'badge-delivered',
  REJECTED: 'badge-rejected',
  CANCELLED: 'badge-cancelled',
};

const StatusBadge = ({ status }) => {
  const cls = STATUS_CLASSES[status] || 'badge-pending';
  return <span className={`badge ${cls}`}>{status}</span>;
};

export default StatusBadge;

function getSlaStatus(ticket) {
  if (ticket.resolvedAt) {
    return new Date(ticket.resolvedAt) > new Date(ticket.slaDeadline) ? 'breached' : 'on-time';
  }
  const now = new Date();
  const deadline = new Date(ticket.slaDeadline);
  const hoursRemaining = (deadline - now) / (1000 * 60 * 60);
  if (hoursRemaining < 0) return 'breached';
  if (hoursRemaining <= 1) return 'at-risk';
  return 'on-track';
}

export default function TicketCard({ ticket, onStatusChange, allowedNext = [], engineers, onAssign }) {
  const slaStatus = getSlaStatus(ticket);

  return (
    <div className="card">
      <div className="card-top">
        <strong>{ticket.title}</strong>
        <span className={`badge ${slaStatus}`}>{slaStatus}</span>
      </div>
      <p>{ticket.description}</p>
      <div className="meta-row">
        <span>Status: {ticket.status}</span>
        <span>Priority: {ticket.priority}</span>
        <span>Category: {ticket.category}</span>
        <span>{ticket.assignedTo ? `Assigned to: ${ticket.assignedTo.name || ticket.assignedTo}` : 'Unassigned'}</span>
      </div>

      {onAssign && engineers && engineers.length > 0 && (
        <div className="action-row">
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) onAssign(ticket._id, e.target.value);
            }}
          >
            <option value="" disabled>Assign to engineer...</option>
            {engineers.map((eng) => (
              <option key={eng._id} value={eng._id}>{eng.name}</option>
            ))}
          </select>
        </div>
      )}

      {onStatusChange && allowedNext.length > 0 && (
        <div className="action-row">
          {allowedNext.map((next) => (
            <button key={next} onClick={() => onStatusChange(ticket._id, next)}>
              Mark {next}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
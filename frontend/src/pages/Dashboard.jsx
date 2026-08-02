import { useEffect, useState } from 'react';
import api from '../api/axiosInstance.js';
import { useAuth } from '../context/AuthContext.jsx';
import TicketCard from '../components/TicketCard.jsx';
import TicketForm from '../components/TicketForm.jsx';

const ALLOWED_TRANSITIONS = {
  Open: ['In Progress', 'Cancelled'],
  'In Progress': ['Resolved', 'Cancelled'],
  Resolved: ['Closed', 'In Progress'],
  Closed: [],
  Cancelled: ['Open'],
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  async function fetchTickets() {
    setLoading(true);
    try {
      const endpoint = user.role === 'Manager' || user.role === 'Admin' ? '/tickets' : '/tickets/my';
      const res = await api.get(endpoint);
      setTickets(res.data.tickets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchEngineers() {
    if (user.role !== 'Manager' && user.role !== 'Admin') return;
    try {
      const res = await api.get('/users/engineers');
      setEngineers(res.data.engineers);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchTickets();
    fetchEngineers();
  }, []);

  async function handleStatusChange(ticketId, newStatus) {
    try {
      await api.patch(`/tickets/${ticketId}/status`, { status: newStatus });
      fetchTickets();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  }

  async function handleAssign(ticketId, engineerId) {
    try {
      await api.patch(`/tickets/${ticketId}/assign`, { engineerId });
      fetchTickets();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign ticket');
    }
  }

  const filtered = statusFilter === 'All' ? tickets : tickets.filter((t) => t.status === statusFilter);
  const sorted = [...filtered].sort((a, b) => new Date(a.slaDeadline) - new Date(b.slaDeadline));

  const canAssign = user.role === 'Manager' || user.role === 'Admin';
  const canUpdateStatus = user.role === 'Engineer' || user.role === 'Manager' || user.role === 'Admin';

  return (
    <div className="page">
      <div className="header-row">
        <h2>OpsDesk — {user.role}</h2>
        <button className="secondary" onClick={logout}>Logout</button>
      </div>

      {user.role === 'Reporter' && <TicketForm onCreated={fetchTickets} />}

      <div className="filter-row">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option>All</option>
          <option>Open</option>
          <option>In Progress</option>
          <option>Resolved</option>
          <option>Closed</option>
          <option>Cancelled</option>
        </select>
      </div>

      {loading ? (
        <p className="empty-state">Loading tickets...</p>
      ) : sorted.length === 0 ? (
        <p className="empty-state">No tickets to show.</p>
      ) : (
        sorted.map((ticket) => (
          <TicketCard
            key={ticket._id}
            ticket={ticket}
            onStatusChange={canUpdateStatus ? handleStatusChange : null}
            allowedNext={ALLOWED_TRANSITIONS[ticket.status] || []}
            engineers={canAssign ? engineers : null}
            onAssign={canAssign ? handleAssign : null}
          />
        ))
      )}
    </div>
  );
}
import { useState } from 'react';
import api from '../api/axiosInstance.js';

export default function TicketForm({ onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [checking, setChecking] = useState(false);

  async function handleCheckAndSubmit(e) {
    e.preventDefault();
    setError('');

    if (!duplicateWarning) {
      setChecking(true);
      try {
        const res = await api.post('/tickets/check-duplicates', { title, description });
        if (res.data.isDuplicate) {
          setDuplicateWarning(res.data.matches);
          setChecking(false);
          return;
        }
      } catch (err) {
        // fail silently, never block submission
      }
      setChecking(false);
    }

    try {
      const res = await api.post('/tickets', { title, description });
      setTitle('');
      setDescription('');
      setDuplicateWarning(null);
      onCreated(res.data.ticket);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ticket');
    }
  }

  return (
    <form onSubmit={handleCheckAndSubmit} className="card">
      <input
        value={title}
        onChange={(e) => { setTitle(e.target.value); setDuplicateWarning(null); }}
        placeholder="Title"
      />
      <textarea
        value={description}
        onChange={(e) => { setDescription(e.target.value); setDuplicateWarning(null); }}
        placeholder="Description"
        rows={3}
      />

      {duplicateWarning && (
        <div className="warning-box">
          <strong>This looks similar to existing ticket(s):</strong>
          <ul>
            {duplicateWarning.map((m) => (
              <li key={m.ticketId}>{m.title} ({m.similarity}% similar)</li>
            ))}
          </ul>
          <span>Click "Submit Anyway" to submit regardless.</span>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}

      <button type="submit" disabled={checking}>
        {checking ? 'Checking...' : duplicateWarning ? 'Submit Anyway' : 'Submit Ticket'}
      </button>
    </form>
  );
}
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/axios';
import QRModal from '../components/QRModal';
import { Ticket, Clock, QrCode, ArrowLeft, RefreshCw } from 'lucide-react';

const TicketView = () => {
  const { ticketNumber } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQR, setShowQR] = useState(false);

  const fetchTicket = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get(`/queue/tickets/${ticketNumber}`);
      setTicket(res.data.ticket);
    } catch (err) {
      setError(err.response?.data?.error || `Ticket ${ticketNumber} not found.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
    const interval = setInterval(fetchTicket, 5000);
    return () => clearInterval(interval);
  }, [ticketNumber]);

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Searching ticket details...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto 0 auto' }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} />
        <span>Back to Home</span>
      </Link>

      {error ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3 style={{ color: 'var(--accent-danger)', marginBottom: '0.5rem' }}>Token Not Found</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>
          <Link to="/" className="btn btn-primary">Go Back</Link>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <span className={`badge badge-${ticket.status}`}>{ticket.status}</span>
              <h1 style={{ fontSize: '3rem', color: 'var(--accent-secondary)', fontWeight: 800, margin: '0.2rem 0' }}>
                {ticket.ticket_number}
              </h1>
              <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{ticket.service_name}</div>
            </div>

            <button onClick={fetchTicket} className="btn btn-secondary btn-sm">
              <RefreshCw size={16} />
            </button>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Citizen Name:</span>
              <strong>{ticket.citizen_name}</strong>
            </div>

            {ticket.counter_name && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--accent-warning)' }}>
                <span>Assigned Counter Desk:</span>
                <strong>{ticket.counter_name}</strong>
              </div>
            )}

            {ticket.status === 'waiting' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>People Ahead:</span>
                  <strong style={{ color: '#fcd34d' }}>{ticket.ahead_count} citizens</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Est. Wait Time:</span>
                  <strong style={{ color: 'var(--accent-secondary)' }}>~{ticket.est_wait_mins} mins</strong>
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setShowQR(true)} className="btn btn-primary" style={{ flex: 1 }}>
              <QrCode size={18} />
              <span>Show QR Code</span>
            </button>
          </div>
        </div>
      )}

      {showQR && ticket && (
        <QRModal ticket={ticket} onClose={() => setShowQR(false)} />
      )}
    </div>
  );
};

export default TicketView;

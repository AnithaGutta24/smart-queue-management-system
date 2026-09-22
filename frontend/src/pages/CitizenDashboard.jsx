import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import QRModal from '../components/QRModal';
import { Ticket, Clock, RefreshCw, QrCode, PlusCircle, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';

const CitizenDashboard = () => {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [guestName, setGuestName] = useState(user?.name || '');
  const [guestPhone, setGuestPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [activeQRModalTicket, setActiveQRModalTicket] = useState(null);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [svcRes, tktRes] = await Promise.all([
        API.get('/services'),
        user ? API.get('/queue/my-tickets') : Promise.resolve({ data: { tickets: [] } })
      ]);
      setServices(svcRes.data.services);
      setMyTickets(tktRes.data.tickets);
    } catch (err) {
      console.error("Failed to fetch citizen dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto refresh ticket status every 6 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 6000);

    return () => clearInterval(interval);
  }, [user]);

  const handleGenerateTicket = async (e) => {
    e.preventDefault();
    if (!selectedService) {
      setError('Please select a service');
      return;
    }
    setError('');
    setGenerating(true);

    try {
      const res = await API.post('/queue/tickets', {
        service_id: selectedService,
        citizen_name: guestName || user?.name || 'Walk-in Citizen',
        citizen_phone: guestPhone || user?.phone || ''
      });

      // Refresh list & automatically pop up QR modal for new ticket!
      await fetchData();
      setActiveQRModalTicket(res.data.ticket);
      setShowQRModal(true);
      setSelectedService('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate queue token');
    } finally {
      setGenerating(false);
    }
  };

  const openQR = (ticket) => {
    setActiveQRModalTicket(ticket);
    setShowQRModal(true);
  };

  const activeTicket = myTickets.find(t => ['waiting', 'called', 'serving'].includes(t.status));

  return (
    <div>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>Citizen Queue Portal</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Welcome back, <strong style={{ color: 'var(--text-main)' }}>{user ? user.name : 'Guest'}</strong>. Take tokens & monitor live status.
          </p>
        </div>

        <button onClick={fetchData} className="btn btn-secondary btn-sm">
          <RefreshCw size={16} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Active Live Ticket Notification Banner if user has an active token */}
      {activeTicket && (
        <div className="glass-card" style={{
          background: activeTicket.status === 'called'
            ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(15, 23, 42, 0.9))'
            : 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(15, 23, 42, 0.9))',
          border: activeTicket.status === 'called'
            ? '2px solid var(--accent-secondary)'
            : '1px solid var(--accent-primary)',
          marginBottom: '2.5rem',
          position: 'relative'
        }}>
          {activeTicket.status === 'called' && (
            <div style={{
              position: 'absolute',
              top: '-12px',
              right: '20px',
              background: 'var(--accent-secondary)',
              color: '#000',
              padding: '0.2rem 0.8rem',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '1px'
            }}>
              🔔 YOU ARE CALLED NOW!
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <span className={`badge badge-${activeTicket.status}`} style={{ marginBottom: '0.5rem' }}>
                Status: {activeTicket.status}
              </span>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-secondary)', letterSpacing: '-1px' }}>
                {activeTicket.ticket_number}
              </h2>
              <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                {activeTicket.service_name}
              </p>

              {activeTicket.counter_name && (
                <p style={{ color: 'var(--accent-warning)', fontWeight: 700, fontSize: '1.1rem', marginTop: '0.4rem' }}>
                  👉 Proceed to: {activeTicket.counter_name}
                </p>
              )}
            </div>

            {/* Waiting metrics */}
            {activeTicket.status === 'waiting' && (
              <div style={{
                display: 'flex',
                gap: '2rem',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '1rem 1.5rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)'
              }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>People Ahead</span>
                  <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fcd34d' }}>{activeTicket.ahead_count}</p>
                </div>
                <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '2rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Est. Wait Time</span>
                  <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>~{activeTicket.est_wait_mins}m</p>
                </div>
              </div>
            )}

            <div>
              <button onClick={() => openQR(activeTicket)} className="btn btn-primary btn-lg">
                <QrCode size={22} />
                <span>View QR Code</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Generate Token & Active Services */}
      <div className="grid-2" style={{ marginBottom: '3rem' }}>
        {/* Token Generator Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <div style={{
              background: 'rgba(99, 102, 241, 0.15)',
              padding: '0.5rem',
              borderRadius: '10px',
              color: 'var(--accent-primary)'
            }}>
              <PlusCircle size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.3rem' }}>Take Digital Token</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Select a public desk to join remote queue</p>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              padding: '0.65rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleGenerateTicket}>
            <div className="form-group">
              <label className="form-label">Select Public Service Desk</label>
              <select
                className="form-control"
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                required
              >
                <option value="">-- Select a Service --</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code}) - {s.waiting_count} waiting (~{s.est_wait_mins} mins)
                  </option>
                ))}
              </select>
            </div>

            {!user && (
              <>
                <div className="form-group">
                  <label className="form-label">Your Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter full name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="For SMS status updates"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                  />
                </div>
              </>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={generating}>
              <Ticket size={18} />
              <span>{generating ? 'Generating Digital Token...' : 'Generate Token Ticket'}</span>
            </button>
          </form>
        </div>

        {/* Live Services Summary */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Active Service Desk Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {services.map(s => (
              <div key={s.id} style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid var(--border-color)',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{s.name}</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg serve: {s.avg_service_time_mins} mins</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-waiting">{s.waiting_count} In Line</span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', marginTop: '0.2rem' }}>
                    Est: ~{s.est_wait_mins}m
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ticket History Section */}
      <section>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>My Queue Token History</h2>
        {myTickets.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
            You have no queue token history yet. Generate a token above to get started!
          </div>
        ) : (
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Token #</th>
                    <th>Service Desk</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Counter</th>
                    <th>QR Code</th>
                  </tr>
                </thead>
                <tbody>
                  {myTickets.map(t => (
                    <tr key={t.id}>
                      <td>
                        <strong style={{ color: 'var(--accent-secondary)' }}>{t.ticket_number}</strong>
                      </td>
                      <td>{t.service_name}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {new Date(t.created_at).toLocaleString()}
                      </td>
                      <td>
                        <span className={`badge badge-${t.status}`}>{t.status}</span>
                      </td>
                      <td>{t.counter_name || '-'}</td>
                      <td>
                        <button onClick={() => openQR(t)} className="btn btn-secondary btn-sm">
                          <QrCode size={14} />
                          <span>QR</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* QR Code Viewer Modal */}
      {showQRModal && (
        <QRModal
          ticket={activeQRModalTicket}
          onClose={() => setShowQRModal(false)}
        />
      )}
    </div>
  );
};

export default CitizenDashboard;

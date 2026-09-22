import React, { useState, useEffect, useRef } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import QRScannerModal from '../components/QRScannerModal';
import {
  PhoneCall,
  CheckCircle2,
  XCircle,
  Clock,
  Camera,
  UserCheck,
  RefreshCw,
  AlertCircle,
  Volume2,
  Users
} from 'lucide-react';

const StaffDashboard = () => {
  const { user } = useAuth();
  const [counters, setCounters] = useState([]);
  const [selectedCounterId, setSelectedCounterId] = useState('');
  const selectedCounterIdRef = useRef('');
  
  const [currentCounter, setCurrentCounter] = useState(null);
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Keep ref synchronized with selectedCounterId state
  useEffect(() => {
    selectedCounterIdRef.current = selectedCounterId;
  }, [selectedCounterId]);

  const fetchStaffData = async () => {
    try {
      const res = await API.get('/counters');
      const fetchedCounters = res.data.counters || [];
      setCounters(fetchedCounters);

      // Auto select initial counter ONLY if user hasn't selected any counter yet
      if (!selectedCounterIdRef.current && fetchedCounters.length > 0) {
        const staffCounter = fetchedCounters.find(c => c.staff_id === user?.id) || fetchedCounters[0];
        const defaultId = String(staffCounter.id);
        setSelectedCounterId(defaultId);
        selectedCounterIdRef.current = defaultId;
      }
    } catch (err) {
      console.error("Failed to fetch staff data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
    const interval = setInterval(fetchStaffData, 3000);
    return () => clearInterval(interval);
  }, [user]);

  // Update current counter object & waiting queue whenever selectedCounterId or counters change
  useEffect(() => {
    if (selectedCounterId && counters.length > 0) {
      const found = counters.find(c => String(c.id) === String(selectedCounterId));
      setCurrentCounter(found || null);

      if (found && found.service_id) {
        API.get('/queue/live-board').then(res => {
          const serviceWaiting = (res.data.waiting_queue || []).filter(
            t => t.service_id === found.service_id
          );
          setWaitingQueue(serviceWaiting);
        }).catch(e => console.error(e));
      } else {
        API.get('/queue/live-board').then(res => {
          setWaitingQueue(res.data.waiting_queue || []);
        }).catch(e => console.error(e));
      }
    }
  }, [selectedCounterId, counters]);

  const handleCounterChange = (e) => {
    const newId = e.target.value;
    setSelectedCounterId(newId);
    selectedCounterIdRef.current = newId;
    setMessage('');
    setError('');
  };

  const handleCallNext = async () => {
    if (!selectedCounterId) return;
    setActionLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await API.post('/queue/staff/call-next', { counter_id: parseInt(selectedCounterId) });
      setMessage(res.data.message);
      await fetchStaffData();

      // Play audio chime beep
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch (e) { }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to call next token');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (ticketId, status) => {
    setActionLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await API.post('/queue/staff/update-status', { ticket_id: ticketId, status });
      setMessage(`Ticket status updated to '${status}'`);
      await fetchStaffData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update ticket status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleQRVerified = (ticket) => {
    setMessage(`Scanned Token #${ticket.ticket_number} for ${ticket.citizen_name} verified!`);
    fetchStaffData();
  };

  const activeTicket = currentCounter?.current_ticket;

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>Staff Counter Console</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Logged in as <strong style={{ color: 'var(--text-main)' }}>{user?.name}</strong> • Counter Operator
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Counter Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Desk:</span>
            <select
              className="form-control"
              value={selectedCounterId}
              onChange={handleCounterChange}
              style={{ width: 'auto', padding: '0.4rem 0.8rem' }}
            >
              {counters.map(c => (
                <option key={c.id} value={String(c.id)}>
                  {c.name} ({c.service_code || 'All Services'})
                </option>
              ))}
            </select>
          </div>

          <button onClick={() => setShowScanner(true)} className="btn btn-secondary btn-sm">
            <Camera size={16} />
            <span>Scan QR</span>
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#6ee7b7',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.9rem',
          marginBottom: '1.5rem'
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#fca5a5',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.9rem',
          marginBottom: '1.5rem'
        }}>
          {error}
        </div>
      )}

      {/* Main Staff Control Hero Card */}
      <div className="glass-card" style={{
        padding: '2.5rem',
        marginBottom: '2.5rem',
        border: '1px solid var(--accent-glow)',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
              CURRENT COUNTER STATUS ({currentCounter?.name || 'DESK'})
            </span>

            {activeTicket ? (
              <div style={{ marginTop: '0.75rem' }}>
                <span className={`badge badge-${activeTicket.status}`}>
                  {activeTicket.status === 'called' ? '🔔 CALLED - AWAITING CITIZEN' : '⚡ CURRENTLY SERVING'}
                </span>

                <h1 style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--accent-secondary)', margin: '0.3rem 0', letterSpacing: '-2px' }}>
                  {activeTicket.ticket_number}
                </h1>

                <div style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Citizen: <span style={{ color: '#fff' }}>{activeTicket.citizen_name}</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Service: {activeTicket.service_name} • Phone: {activeTicket.citizen_phone || 'N/A'}
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '1rem' }}>
                <h2 style={{ fontSize: '2rem', color: 'var(--text-muted)' }}>No Active Token Called</h2>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem' }}>
                  Service Desk: <strong style={{ color: 'var(--accent-secondary)' }}>{currentCounter?.service_name || 'General Desk'}</strong> • Click "Call Next Token" to draw next waiting citizen.
                </p>
              </div>
            )}
          </div>

          {/* Large Action Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', minWidth: '260px' }}>
            <button
              onClick={handleCallNext}
              className="btn btn-primary btn-lg"
              disabled={actionLoading}
              style={{ padding: '1.1rem 1.8rem', fontSize: '1.1rem' }}
            >
              <PhoneCall size={22} />
              <span>CALL NEXT TOKEN</span>
            </button>

            {activeTicket && activeTicket.status === 'called' && (
              <button
                onClick={() => handleUpdateStatus(activeTicket.id, 'serving')}
                className="btn btn-success btn-lg"
                disabled={actionLoading}
              >
                <UserCheck size={20} />
                <span>Start Serving</span>
              </button>
            )}

            {activeTicket && ['called', 'serving'].includes(activeTicket.status) && (
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button
                  onClick={() => handleUpdateStatus(activeTicket.id, 'completed')}
                  className="btn btn-success"
                  style={{ flex: 1 }}
                  disabled={actionLoading}
                >
                  <CheckCircle2 size={18} />
                  <span>Complete</span>
                </button>

                <button
                  onClick={() => handleUpdateStatus(activeTicket.id, 'missed')}
                  className="btn btn-danger"
                  style={{ flex: 1 }}
                  disabled={actionLoading}
                >
                  <XCircle size={18} />
                  <span>No-Show</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Counters Overview Grid */}
      <section>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '1.25rem' }}>Public Desk Overview</h2>
        <div className="grid-4">
          {counters.map(c => (
            <div key={c.id} className="glass-card" style={{
              border: String(c.id) === String(selectedCounterId) ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
              background: String(c.id) === String(selectedCounterId) ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-card)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <strong style={{ fontSize: '1rem' }}>{c.name}</strong>
                <span className={`badge badge-${c.status === 'open' ? 'completed' : 'waiting'}`}>
                  {c.status}
                </span>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Desk: {c.service_name || 'General'}
              </div>

              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '0.65rem',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Serving Token:</span>
                <strong style={{ fontSize: '1.2rem', color: c.current_ticket ? 'var(--accent-secondary)' : 'var(--text-muted)' }}>
                  {c.current_ticket ? c.current_ticket.ticket_number : 'IDLE'}
                </strong>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Camera QR Scanner Modal */}
      {showScanner && (
        <QRScannerModal
          onClose={() => setShowScanner(false)}
          onVerified={handleQRVerified}
        />
      )}
    </div>
  );
};

export default StaffDashboard;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { Ticket, Users, Clock, Shield, Search, ArrowRight, CheckCircle2, Sparkles, Monitor } from 'lucide-react';

const Home = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lookupNumber, setLookupNumber] = useState('');
  const [lookupError, setLookupError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await API.get('/services');
        setServices(res.data.services);
      } catch (err) {
        console.error("Failed to load services", err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleLookup = (e) => {
    e.preventDefault();
    if (!lookupNumber.trim()) return;
    setLookupError('');
    navigate(`/ticket/${lookupNumber.trim().toUpperCase()}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        textAlign: 'center',
        padding: '3rem 1rem 4rem 1rem',
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          padding: '0.4rem 1rem',
          borderRadius: '50px',
          color: '#a5b4fc',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '1.5rem'
        }}>
          <Sparkles size={16} />
          <span>Smart Virtual Queueing for Citizens & Public Service Centers</span>
        </div>

        <h1 style={{ fontSize: '2.8rem', lineHeight: '1.15', marginBottom: '1.25rem', letterSpacing: '-1px' }}>
          Skip the Physical Line.<br />
          <span style={{
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Track Your Queue Remotely.
          </span>
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2.5rem', maxWidth: '700px', margin: '0 auto 2.5rem auto' }}>
          Take a digital token from your phone or kiosk, monitor live waiting positions in real-time with QR verification, and arrive right when your counter is called.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3rem' }}>
          <Link to="/citizen" className="btn btn-primary btn-lg">
            <Ticket size={22} />
            <span>Take Digital Token</span>
          </Link>
          <Link to="/display" className="btn btn-secondary btn-lg">
            <Monitor size={22} />
            <span>Open TV Display Board</span>
          </Link>
        </div>

        {/* Token Direct Lookup Bar */}
        <div className="glass-card" style={{ maxWidth: '550px', margin: '0 auto', padding: '1.25rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 600 }}>
            HAVE AN EXISTING TOKEN NUMBER? LOOK IT UP HERE:
          </p>
          <form onSubmit={handleLookup} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. PASS-101 or UTIL-102"
              value={lookupNumber}
              onChange={(e) => setLookupNumber(e.target.value)}
              style={{ textTransform: 'uppercase' }}
            />
            <button type="submit" className="btn btn-primary">
              <Search size={18} />
              <span>Track</span>
            </button>
          </form>
        </div>
      </section>

      {/* Public Services Grid */}
      <section style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem' }}>Available Services & Live Wait Times</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Real-time queue metrics across public service center desks</p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading live services...</div>
        ) : (
          <div className="grid-2">
            {services.map((svc) => (
              <div key={svc.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        background: 'rgba(99, 102, 241, 0.15)',
                        padding: '0.65rem',
                        borderRadius: '12px',
                        color: 'var(--accent-primary)'
                      }}>
                        <Ticket size={24} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.15rem' }}>{svc.name}</h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', fontWeight: 700 }}>
                          CODE: {svc.code}
                        </span>
                      </div>
                    </div>

                    <span className="badge badge-waiting">
                      {svc.waiting_count} Waiting
                    </span>
                  </div>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                    {svc.description}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '1rem',
                  marginTop: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <Clock size={16} />
                    <span>Est Wait: ~{svc.est_wait_mins} mins</span>
                  </div>

                  <Link to="/citizen" className="btn btn-secondary btn-sm">
                    <span>Book Token</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Role Guide Cards */}
      <section style={{ marginTop: '4rem' }}>
        <h2 style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: '2rem' }}>Role Access Demo Portals</h2>
        <div className="grid-3">
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.2)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}>
              <Users size={24} />
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>1. Citizen Portal</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Generate digital tokens, track position live on your smartphone, & show QR code to staff.
            </p>
            <Link to="/citizen" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
              Citizen Dashboard
            </Link>
          </div>

          <div className="glass-card" style={{ textAlign: 'center' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: 'rgba(6, 182, 212, 0.2)',
              color: 'var(--accent-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}>
              <Ticket size={24} />
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>2. Staff Counter</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Call next token, scan citizen QR code, mark completed/missed, and manage counter desk.
            </p>
            <Link to="/staff" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
              Staff Desk
            </Link>
          </div>

          <div className="glass-card" style={{ textAlign: 'center' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.2)',
              color: 'var(--accent-warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}>
              <Shield size={24} />
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>3. Admin Control</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Full analytics dashboard, add public services, configure counters, and manage staff users.
            </p>
            <Link to="/admin" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
              Admin Panel
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

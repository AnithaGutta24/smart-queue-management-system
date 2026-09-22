import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  BarChart3,
  Users,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Ticket,
  UserPlus,
  CheckCircle,
  AlertCircle,
  FolderPlus,
  Monitor
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [services, setServices] = useState([]);
  const [counters, setCounters] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states for creating service & staff
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [svcName, setSvcName] = useState('');
  const [svcCode, setSvcCode] = useState('');
  const [svcDesc, setSvcDesc] = useState('');
  const [svcMins, setSvcMins] = useState(10);

  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  const [showCounterModal, setShowCounterModal] = useState(false);
  const [counterName, setCounterName] = useState('');
  const [counterSvcId, setCounterSvcId] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchAdminData = async () => {
    try {
      const [analyticsRes, servicesRes, countersRes, usersRes] = await Promise.all([
        API.get('/admin/analytics'),
        API.get('/services'),
        API.get('/counters'),
        API.get('/admin/users')
      ]);

      setAnalytics(analyticsRes.data);
      setServices(servicesRes.data.services);
      setCounters(countersRes.data.counters);
      setUsersList(usersRes.data.users);
    } catch (err) {
      console.error("Failed to load admin dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleCreateService = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await API.post('/admin/services', {
        name: svcName,
        code: svcCode,
        description: svcDesc,
        avg_service_time_mins: svcMins
      });
      setMessage(`Service '${svcName}' created successfully!`);
      setShowServiceModal(false);
      setSvcName('');
      setSvcCode('');
      setSvcDesc('');
      fetchAdminData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create service');
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await API.post('/admin/users/staff', {
        name: staffName,
        email: staffEmail,
        phone: staffPhone,
        password: staffPassword
      });
      setMessage(`Staff account '${staffName}' created!`);
      setShowStaffModal(false);
      setStaffName('');
      setStaffEmail('');
      setStaffPassword('');
      fetchAdminData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create staff user');
    }
  };

  const handleCreateCounter = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await API.post('/admin/counters', {
        name: counterName,
        service_id: counterSvcId ? parseInt(counterSvcId) : null
      });
      setMessage(`Counter desk '${counterName}' created!`);
      setShowCounterModal(false);
      setCounterName('');
      fetchAdminData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create counter desk');
    }
  };

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading analytics & management controls...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>System Administration</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Queue Analytics, Service Catalog & Counter Management
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={() => setShowServiceModal(true)} className="btn btn-primary btn-sm">
            <Plus size={16} />
            <span>Add Service Desk</span>
          </button>
          <button onClick={() => setShowCounterModal(true)} className="btn btn-secondary btn-sm">
            <Monitor size={16} />
            <span>Add Counter Desk</span>
          </button>
          <button onClick={() => setShowStaffModal(true)} className="btn btn-secondary btn-sm">
            <UserPlus size={16} />
            <span>Create Staff Account</span>
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

      {/* Metric Stat Cards */}
      <div className="grid-4" style={{ marginBottom: '2.5rem' }}>
        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Tokens Today</span>
          <h2 style={{ fontSize: '2.2rem', color: 'var(--accent-primary)', marginTop: '0.3rem' }}>
            {analytics?.total_today || 0}
          </h2>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>All public service desks</div>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Waiting in Queue</span>
          <h2 style={{ fontSize: '2.2rem', color: '#fcd34d', marginTop: '0.3rem' }}>
            {analytics?.waiting_today || 0}
          </h2>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>Citizens currently waiting</div>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Successfully Served</span>
          <h2 style={{ fontSize: '2.2rem', color: 'var(--accent-success)', marginTop: '0.3rem' }}>
            {analytics?.completed_today || 0}
          </h2>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>Tokens marked completed</div>
        </div>

        <div className="glass-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Avg Wait Time</span>
          <h2 style={{ fontSize: '2.2rem', color: 'var(--accent-secondary)', marginTop: '0.3rem' }}>
            {analytics?.avg_wait_mins || 0} <span style={{ fontSize: '1.1rem' }}>mins</span>
          </h2>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>Average time in line</div>
        </div>
      </div>

      {/* Services & Counters Management Section */}
      <div className="grid-2" style={{ marginBottom: '3rem' }}>
        {/* Service Desks */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Public Service Desks ({services.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {services.map(s => (
              <div key={s.id} style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-color)',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{s.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)' }}>Code: {s.code} • Avg: {s.avg_service_time_mins} mins</div>
                </div>
                <span className="badge badge-waiting">{s.waiting_count} Waiting</span>
              </div>
            ))}
          </div>
        </div>

        {/* Counter Desks */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Configured Counters ({counters.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {counters.map(c => (
              <div key={c.id} style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-color)',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{c.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Assigned Service: {c.service_name || 'All Services'}
                  </div>
                </div>
                <span className={`badge badge-${c.status === 'open' ? 'completed' : 'waiting'}`}>{c.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Accounts Management */}
      <section>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Registered System Users ({usersList.length})</h2>
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Registered Date</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map(u => (
                  <tr key={u.id}>
                    <td>#{u.id}</td>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-waiting' : u.role === 'staff' ? 'badge-called' : 'badge-serving'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Create Service Modal */}
      {showServiceModal && (
        <div className="modal-overlay" onClick={() => setShowServiceModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Add New Public Service</h3>
            <form onSubmit={handleCreateService}>
              <div className="form-group">
                <label className="form-label">Service Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Passport & Visa Desk"
                  value={svcName}
                  onChange={(e) => setSvcName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Service Code Prefix (3-4 uppercase chars)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. PASS, UTIL, TAX"
                  value={svcCode}
                  onChange={(e) => setSvcCode(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Service description"
                  value={svcDesc}
                  onChange={(e) => setSvcDesc(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Avg Minutes per Citizen</label>
                <input
                  type="number"
                  className="form-control"
                  value={svcMins}
                  onChange={(e) => setSvcMins(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowServiceModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Service</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Counter Modal */}
      {showCounterModal && (
        <div className="modal-overlay" onClick={() => setShowCounterModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Add New Service Counter</h3>
            <form onSubmit={handleCreateCounter}>
              <div className="form-group">
                <label className="form-label">Counter Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Counter 5 - Priority Desk"
                  value={counterName}
                  onChange={(e) => setCounterName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Assign Service Desk</label>
                <select
                  className="form-control"
                  value={counterSvcId}
                  onChange={(e) => setCounterSvcId(e.target.value)}
                >
                  <option value="">All Services (General Desk)</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowCounterModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Counter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Staff Account Modal */}
      {showStaffModal && (
        <div className="modal-overlay" onClick={() => setShowStaffModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Register Staff User</h3>
            <form onSubmit={handleCreateStaff}>
              <div className="form-group">
                <label className="form-label">Staff Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. John Doe"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="staff@queue.com"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="+1 555-0100"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Login Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Initial password"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowStaffModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Register Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Ticket, LogOut, User, Shield, Monitor, LayoutDashboard, LogIn } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      background: 'rgba(15, 23, 42, 0.9)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            padding: '0.5rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 15px var(--accent-glow)'
          }}>
            <Ticket size={24} />
          </div>
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
              Smart<span style={{ color: 'var(--accent-secondary)' }}>Queue</span>
            </span>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '-4px' }}>
              Public Service Center
            </span>
          </div>
        </Link>

        {/* Navigation Items */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <Link to="/display" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
            <Monitor size={18} />
            <span>Live TV Board</span>
          </Link>

          {user ? (
            <>
              {user.role === 'citizen' && (
                <Link to="/citizen" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                  <Ticket size={18} />
                  <span>My Tokens</span>
                </Link>
              )}

              {user.role === 'staff' && (
                <Link to="/staff" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
                  <LayoutDashboard size={18} />
                  <span>Counter Desk</span>
                </Link>
              )}

              {user.role === 'admin' && (
                <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-warning)', fontSize: '0.9rem', fontWeight: 600 }}>
                  <Shield size={18} />
                  <span>Admin Panel</span>
                </Link>
              )}

              {/* User badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '0.35rem 0.85rem',
                borderRadius: '50px',
                border: '1px solid var(--border-color)'
              }}>
                <User size={16} color="var(--accent-primary)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {user.name}
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '10px',
                  background: user.role === 'admin' ? 'rgba(245, 158, 11, 0.2)' : user.role === 'staff' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                  color: user.role === 'admin' ? '#fcd34d' : user.role === 'staff' ? '#67e8f9' : '#a5b4fc',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>
                  {user.role}
                </span>
              </div>

              <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Log Out">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                <LogIn size={16} />
                <span>Log In</span>
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                <span>Register</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

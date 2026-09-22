import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <h1 style={{ fontSize: '4rem', color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>404</h1>
      <h2 style={{ marginBottom: '1rem' }}>Page Not Found</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>The requested queue page does not exist.</p>
      <Link to="/" className="btn btn-primary">Return to Home</Link>
    </div>
  );
};

export default NotFound;

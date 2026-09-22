import React from 'react';
import { Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-color)',
      background: 'rgba(15, 23, 42, 0.9)',
      padding: '1.5rem 0',
      textAlign: 'center',
      color: 'var(--text-dim)',
      fontSize: '0.85rem'
    }}>
      <div className="main-content" style={{ padding: '0 1.5rem' }}>
        <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
          Smart Virtual Queue Management System • College Community Service Project
        </p>
        <p style={{ marginTop: '0.3rem', fontSize: '0.8rem' }}>
          Designed to eliminate physical waiting lines & streamline public service centers.
        </p>
      </div>
    </footer>
  );
};

export default Footer;

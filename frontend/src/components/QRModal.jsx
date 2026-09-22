import React from 'react';
import { X, QrCode, Download, Share2 } from 'lucide-react';

const QRModal = ({ ticket, onClose }) => {
  if (!ticket) return null;

  const handleDownload = () => {
    if (!ticket.qr_code_data) return;
    const link = document.createElement('a');
    link.href = ticket.qr_code_data;
    link.download = `Ticket-${ticket.ticket_number}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{
          display: 'inline-flex',
          padding: '0.6rem',
          background: 'rgba(99, 102, 241, 0.15)',
          borderRadius: '50%',
          color: 'var(--accent-primary)',
          marginBottom: '1rem'
        }}>
          <QrCode size={28} />
        </div>

        <h3 style={{ fontSize: '1.4rem', marginBottom: '0.2rem' }}>Digital Ticket QR Code</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Show this QR code at the service counter desk for instant verification.
        </p>

        {/* QR Code Container */}
        <div style={{
          background: '#ffffff',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          display: 'inline-block',
          boxShadow: '0 0 25px rgba(255, 255, 255, 0.1)',
          marginBottom: '1.25rem'
        }}>
          {ticket.qr_code_data ? (
            <img
              src={ticket.qr_code_data}
              alt={`QR code for ${ticket.ticket_number}`}
              style={{ width: '180px', height: '180px', display: 'block' }}
            />
          ) : (
            <div style={{ width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
              No QR data
            </div>
          )}
        </div>

        {/* Ticket summary */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: 'var(--radius-sm)',
          padding: '1rem',
          textAlign: 'left',
          marginBottom: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Token Number:</span>
            <span style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>{ticket.ticket_number}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Service:</span>
            <span style={{ fontWeight: 600 }}>{ticket.service_name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Citizen Name:</span>
            <span style={{ fontWeight: 600 }}>{ticket.citizen_name}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button onClick={handleDownload} className="btn btn-primary" style={{ flex: 1 }}>
            <Download size={18} />
            <span>Save QR Image</span>
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRModal;

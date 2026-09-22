import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera, Search, AlertCircle } from 'lucide-react';
import API from '../api/axios';

const QRScannerModal = ({ onClose, onVerified }) => {
  const [manualToken, setManualToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    // Initialize html5-qrcode scanner
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 220, height: 220 } },
      /* verbose= */ false
    );

    scanner.render(onScanSuccess, onScanFailure);
    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Scanner clear error", err));
      }
    };
  }, []);

  const onScanSuccess = async (decodedText) => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(e => console.error(e));
    }
    verifyToken(decodedText);
  };

  const onScanFailure = (error) => {
    // Silent ignore continuous frame scan errors
  };

  const verifyToken = async (tokenString) => {
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/queue/staff/verify-qr', { qr_data: tokenString });
      onVerified(res.data.ticket);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to verify token QR');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualToken.trim()) {
      verifyToken(manualToken.trim());
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <div style={{
            background: 'rgba(6, 182, 212, 0.15)',
            padding: '0.5rem',
            borderRadius: '10px',
            color: 'var(--accent-secondary)'
          }}>
            <Camera size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem' }}>Scan Citizen Ticket QR</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Point webcam at ticket QR or enter Token ID</p>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Camera Scanner View */}
        <div id="qr-reader" style={{
          width: '100%',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          marginBottom: '1.25rem',
          border: '1px solid var(--border-color)',
          background: 'rgba(0, 0, 0, 0.3)'
        }}></div>

        {/* Manual Fallback Entry */}
        <div style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '1rem'
        }}>
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Or enter Token (e.g. PASS-101)"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary" disabled={loading}>
              <Search size={16} />
              <span>Verify</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;

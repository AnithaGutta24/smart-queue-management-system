import React, { useState, useEffect, useRef } from 'react';
import API from '../api/axios';
import { Volume2, VolumeX, Maximize, Monitor, Ticket, Clock } from 'lucide-react';

const QueueDisplayBoard = () => {
  const [boardData, setBoardData] = useState({ counters: [], waiting_queue: [] });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const previousCalledRef = useRef({});

  const fetchBoardData = async () => {
    try {
      const res = await API.get('/queue/live-board');
      setBoardData(res.data);

      // Check if any counter has called a new token to play audio chime
      if (soundEnabled && res.data.counters) {
        res.data.counters.forEach(c => {
          if (c.current_ticket && c.current_ticket.status === 'called') {
            const prevToken = previousCalledRef.current[c.counter_id];
            if (prevToken !== c.current_ticket.ticket_number) {
              playChimeSound();
              previousCalledRef.current[c.counter_id] = c.current_ticket.ticket_number;
            }
          }
        });
      }
    } catch (err) {
      console.error("Failed to update public live display board", err);
    }
  };

  useEffect(() => {
    fetchBoardData();
    const interval = setInterval(fetchBoardData, 3000);
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, [soundEnabled]);

  const playChimeSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.2); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.log("Audio autoplay blocked by browser context");
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else {
      document.exitFullscreen().catch(err => console.log(err));
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0f1d',
      color: '#fff',
      padding: '1.5rem 2rem',
      fontFamily: 'var(--font-heading)'
    }}>
      {/* Top Header Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '1.25rem',
        borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            padding: '0.65rem',
            borderRadius: '12px'
          }}>
            <Monitor size={32} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
              PUBLIC SERVICE CENTER • LIVE QUEUE DISPLAY
            </h1>
            <p style={{ color: 'var(--accent-secondary)', fontSize: '1rem', fontWeight: 600 }}>
              Please proceed to your assigned counter desk when your Token ID is announced
            </p>
          </div>
        </div>

        {/* Live Clock & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fcd34d', letterSpacing: '1px' }}>
              {currentTime.toLocaleTimeString()}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="btn btn-secondary btn-sm"
              style={{ background: 'rgba(255, 255, 255, 0.1)' }}
              title="Toggle Audio Announcement Chime"
            >
              {soundEnabled ? <Volume2 size={20} color="#10b981" /> : <VolumeX size={20} color="#ef4444" />}
            </button>
            <button
              onClick={toggleFullScreen}
              className="btn btn-secondary btn-sm"
              style={{ background: 'rgba(255, 255, 255, 0.1)' }}
              title="Full Screen Display Mode"
            >
              <Maximize size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Counters vs Upcoming Waiting List */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.2fr', gap: '2rem' }}>
        {/* Active Counters Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {boardData.counters.map(c => {
            const isCalled = c.current_ticket && c.current_ticket.status === 'called';
            return (
              <div
                key={c.counter_id}
                style={{
                  background: isCalled
                    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(30, 41, 59, 0.95))'
                    : 'rgba(30, 41, 59, 0.7)',
                  border: isCalled ? '3px solid var(--accent-secondary)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2rem',
                  textAlign: 'center',
                  boxShadow: isCalled ? '0 0 35px rgba(6, 182, 212, 0.35)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '0.5rem'
                }}>
                  {c.counter_name}
                </div>
                <div style={{ fontSize: '0.95rem', color: 'var(--accent-primary)', marginBottom: '1.25rem' }}>
                  {c.service_name}
                </div>

                {c.current_ticket ? (
                  <div>
                    <div style={{
                      fontSize: '4rem',
                      fontWeight: 900,
                      color: isCalled ? '#67e8f9' : '#a5b4fc',
                      lineHeight: '1',
                      marginBottom: '0.75rem',
                      letterSpacing: '-2px'
                    }}>
                      {c.current_ticket.ticket_number}
                    </div>

                    <div style={{
                      display: 'inline-block',
                      padding: '0.35rem 1rem',
                      borderRadius: '50px',
                      background: isCalled ? 'rgba(6, 182, 212, 0.3)' : 'rgba(99, 102, 241, 0.3)',
                      color: isCalled ? '#fff' : '#a5b4fc',
                      fontWeight: 700,
                      fontSize: '0.9rem'
                    }}>
                      {isCalled ? '🔔 PROCEED NOW' : '⚡ SERVING'}
                    </div>

                    <div style={{ marginTop: '0.75rem', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 600 }}>
                      {c.current_ticket.citizen_name}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '2rem 0', color: 'var(--text-dim)' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>---</div>
                    <span style={{ fontSize: '0.9rem' }}>DESK OPEN</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Sidebar: Upcoming Waiting Queue */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '1.5rem'
        }}>
          <h2 style={{
            fontSize: '1.2rem',
            color: 'var(--accent-warning)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Clock size={20} />
            <span>UPCOMING WAITING QUEUE</span>
          </h2>

          {boardData.waiting_queue.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem 0' }}>
              No citizens waiting in line
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {boardData.waiting_queue.map(t => (
                <div key={t.id} style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <strong style={{ fontSize: '1.2rem', color: 'var(--accent-secondary)' }}>
                      {t.ticket_number}
                    </strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.citizen_name}</div>
                  </div>
                  <span className="badge badge-waiting">{t.service_code}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QueueDisplayBoard;

import React, { useState } from 'react';
import { X, Play, Pause, Volume2, ShieldCheck, CheckCircle2, ListVideo } from 'lucide-react';

interface VideoPlayerViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VideoPlayerView: React.FC<VideoPlayerViewProps> = ({ isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState('1.25x');
  const [quality, setQuality] = useState('1080p HD');
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);

  if (!isOpen) return null;

  const playlist = [
    { title: 'Lecture 1: Reflection & Spherical Mirrors', duration: '35 mins', status: 'COMPLETED' },
    { title: 'Lecture 2: Refractive Index & Snell Law', duration: '42 mins', status: 'IN_PROGRESS' },
    { title: 'Lecture 3: Lens Formula & Numerical Solved', duration: '50 mins', status: 'LOCKED' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1000px', padding: '0', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', background: 'var(--bg-card-solid)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="badge badge-emerald" style={{ marginBottom: '4px' }}>
              <ShieldCheck size={12} /> DRM PROTECTED VIDEO STREAMING (VDOCIPHER / S3)
            </span>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '800' }}>
              {playlist[activeVideoIdx].title}
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              color: 'var(--text-secondary)',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Main Grid: Video Screen + Playlist */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          {/* Video Container */}
          <div style={{ background: '#000000', position: 'relative', aspectRatio: '16/9', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px' }}>
            {/* Watermark for DRM */}
            <div style={{ position: 'absolute', top: '16px', right: '16px', opacity: 0.6, fontSize: '0.75rem', color: '#FFF', background: 'rgba(0,0,0,0.5)', padding: '4px 10px', borderRadius: '4px' }}>
              Watermark: EDU-99201 (Shamshad)
            </div>

            {/* Simulated Video Content Screen */}
            <div style={{ margin: 'auto', textAlign: 'center' }}>
              <div
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'var(--primary-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                  cursor: 'pointer',
                  boxShadow: '0 8px 30px rgba(99,102,241,0.5)'
                }}
              >
                {isPlaying ? <Pause size={32} color="#FFF" /> : <Play size={32} color="#FFF" style={{ marginLeft: '4px' }} />}
              </div>
              <h3 style={{ fontSize: '1.2rem', color: '#FFF', fontWeight: '700' }}>
                {isPlaying ? 'Playing Adaptive Stream...' : 'Video Paused'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Resolution: {quality} | Speed: {playbackSpeed}
              </p>
            </div>

            {/* Video Controls Bar */}
            <div style={{ background: 'rgba(15, 23, 42, 0.9)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={() => setIsPlaying(!isPlaying)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}>
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <Volume2 size={20} color="var(--text-secondary)" />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>14:20 / 35:00</span>
              </div>

              {/* Speed & Quality Pickers */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <select
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#FFF', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  <option value="1x">1.0x Normal</option>
                  <option value="1.25x">1.25x Speed</option>
                  <option value="1.5x">1.5x Speed</option>
                  <option value="2x">2.0x Fast</option>
                </select>

                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#FFF', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  <option value="1080p HD">1080p HD</option>
                  <option value="720p HD">720p HD</option>
                  <option value="480p SD">480p Data Saver</option>
                </select>
              </div>
            </div>
          </div>

          {/* Chapter Video Playlist Sidebar */}
          <div style={{ background: 'var(--bg-card-solid)', padding: '24px', borderLeft: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ListVideo size={18} color="var(--primary-accent)" />
              Chapter Video Playlist
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {playlist.map((item, idx) => {
                const isActive = activeVideoIdx === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setActiveVideoIdx(idx)}
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      background: isActive ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)',
                      border: isActive ? '1px solid rgba(99,102,241,0.4)' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                        PART {idx + 1}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.duration}</span>
                    </div>

                    <div style={{ fontSize: '0.92rem', fontWeight: '700', color: isActive ? '#818CF8' : 'var(--text-primary)', marginBottom: '6px' }}>
                      {item.title}
                    </div>

                    {item.status === 'COMPLETED' && (
                      <span style={{ fontSize: '0.75rem', color: '#34D399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> Watched 100%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

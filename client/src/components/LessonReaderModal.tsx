import React, { useState } from 'react';
import { X, BookOpen, Bookmark, Type } from 'lucide-react';

interface LessonReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LessonReaderModal: React.FC<LessonReaderModalProps> = ({ isOpen, onClose }) => {
  const [fontSize, setFontSize] = useState(16);
  const [isBookmarked, setIsBookmarked] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px', padding: '32px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <span className="badge badge-primary" style={{ marginBottom: '6px' }}>
              <BookOpen size={12} /> LEVEL 6 RICH-TEXT LESSON VIEWER
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>
              Lesson 1.1: Laws of Reflection & Ray Diagrams
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: '8px' }}>
              <Type size={16} />
              <button onClick={() => setFontSize((s) => Math.max(14, s - 2))} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontWeight: '800' }}>A-</button>
              <button onClick={() => setFontSize((s) => Math.min(22, s + 2))} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontWeight: '800' }}>A+</button>
            </div>

            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              style={{
                background: isBookmarked ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)',
                border: isBookmarked ? '1px solid #FBBF24' : 'none',
                color: isBookmarked ? '#FBBF24' : 'var(--text-secondary)',
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem'
              }}
            >
              <Bookmark size={16} /> {isBookmarked ? 'Bookmarked' : 'Bookmark'}
            </button>

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
        </div>

        {/* Formatted Text Content */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          padding: '28px',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          fontSize: `${fontSize}px`,
          lineHeight: 1.8,
          color: 'var(--text-primary)'
        }}>
          <h3 style={{ fontSize: '1.4em', marginBottom: '12px', color: '#818CF8' }}>
            1. Introduction to Light & Reflection
          </h3>
          <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
            Light is a form of electromagnetic radiation energy that enables us to see objects around us. When light falls on a polished surface such as a plane or spherical mirror, most of it is bounced back into the same medium. This phenomenon is called <strong>Reflection of Light</strong>.
          </p>

          <div style={{ background: 'rgba(99,102,241,0.1)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid var(--primary-accent)', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '1.1em', fontWeight: '800', marginBottom: '8px', color: '#FFF' }}>
              📌 The Two Fundamental Laws of Reflection:
            </h4>
            <ol style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
              <li>The angle of incidence (\(i\)) is always equal to the angle of reflection (\(r\)). Formula: \(\angle i = \angle r\).</li>
              <li>The incident ray, the reflected ray, and the normal to the mirror at the point of incidence all lie in the same plane.</li>
            </ol>
          </div>

          <h3 style={{ fontSize: '1.4em', marginBottom: '12px', color: '#34D399' }}>
            2. Spherical Mirrors (Concave & Convex)
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            A spherical mirror is a mirror whose reflecting surface is part of a hollow sphere of glass. If the inner reflecting surface is curved inwards, it is a <strong>Concave Mirror</strong> (converging). If it is curved outwards, it is a <strong>Convex Mirror</strong> (diverging).
          </p>
        </div>
      </div>
    </div>
  );
};

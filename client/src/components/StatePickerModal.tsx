import React from 'react';
import { X, MapPin, CheckCircle2 } from 'lucide-react';
import { INDIAN_STATES, StateOption } from '../mockData';

interface StatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedState: StateOption;
  onSelectState: (state: StateOption) => void;
}

export const StatePickerModal: React.FC<StatePickerModalProps> = ({
  isOpen,
  onClose,
  selectedState,
  onSelectState
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <span className="badge badge-emerald" style={{ marginBottom: '6px' }}>
              <MapPin size={12} /> LEVEL 1 STATE LOCALIZATION
            </span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800' }}>
              Select Your State / Region
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

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px' }}>
          Content, state board syllabus, competitive exams, and government job prep modules will be personalized according to your selected state.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {INDIAN_STATES.map((st) => {
            const isSelected = selectedState.id === st.id;
            return (
              <div
                key={st.id}
                onClick={() => {
                  onSelectState(st);
                  onClose();
                }}
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                  border: isSelected ? '2px solid #34D399' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ fontWeight: '800', fontSize: '1.1rem', color: isSelected ? '#34D399' : '#FFF' }}>
                    {st.name} ({st.code})
                  </div>
                  {isSelected && <CheckCircle2 size={20} color="#34D399" />}
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--primary-accent)', fontWeight: '700', marginBottom: '4px' }}>
                  {st.popularCourse}
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Enrolled Students: {st.studentsCount}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

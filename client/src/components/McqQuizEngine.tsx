import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle2, XCircle, Award, HelpCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { MOCK_MCQS, McqQuestion } from '../mockData';

interface McqQuizEngineProps {
  isOpen: boolean;
  onClose: () => void;
}

export const McqQuizEngine: React.FC<McqQuizEngineProps> = ({ isOpen, onClose }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [showExplanation, setShowExplanation] = useState<{ [key: number]: boolean }>({});
  const [timeLeft, setTimeLeft] = useState(300); // 5 mins countdown
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (!isOpen || isFinished) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, isFinished]);

  if (!isOpen) return null;

  const currentQ: McqQuestion = MOCK_MCQS[currentIdx];
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (qId: number, optIdx: number) => {
    if (isFinished) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optIdx }));
    setShowExplanation((prev) => ({ ...prev, [qId]: true }));
  };

  const calculateScore = () => {
    let score = 0;
    MOCK_MCQS.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctOptionIndex) {
        score += 1;
      }
    });
    return score;
  };

  const resetQuiz = () => {
    setCurrentIdx(0);
    setSelectedAnswers({});
    setShowExplanation({});
    setTimeLeft(300);
    setIsFinished(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px', padding: '32px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <span className="badge badge-emerald" style={{ marginBottom: '6px' }}>
              <HelpCircle size={12} /> LEVEL 6 INTERACTIVE MCQ QUIZ ENGINE
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>
              Physics: Light & Reflection Practice Test
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239,68,68,0.15)', color: '#FCA5A5', padding: '6px 14px', borderRadius: '50px', fontWeight: '800', fontSize: '0.9rem' }}>
              <Clock size={16} /> {formatTime(timeLeft)}
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
        </div>

        {/* Finished Scorecard */}
        {isFinished ? (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'var(--emerald-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              boxShadow: '0 8px 30px rgba(16,185,129,0.4)'
            }}>
              <Award size={44} color="#FFF" />
            </div>

            <h3 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '8px' }}>
              Test Submitted Successfully!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '24px' }}>
              You scored <strong style={{ color: 'var(--badge-emerald-color, #047857)', fontSize: '1.4rem' }}>{calculateScore()}</strong> out of <strong style={{ color: 'var(--text-primary)' }}>{MOCK_MCQS.length}</strong> questions ({Math.round((calculateScore() / MOCK_MCQS.length) * 100)}% Accuracy).
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button className="btn-primary" onClick={resetQuiz}>
                <RotateCcw size={16} /> Retake Quiz
              </button>
              <button className="btn-secondary" onClick={onClose}>
                Close Engine
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Question Navigator Bar */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
              {MOCK_MCQS.map((q, idx) => {
                const isAnswered = selectedAnswers[q.id] !== undefined;
                const isCurrent = currentIdx === idx;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    style={{
                      minWidth: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      border: isCurrent ? '2px solid var(--primary-accent)' : '1px solid var(--border-color)',
                      background: isAnswered ? 'rgba(16,185,129,0.2)' : isCurrent ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                      color: isAnswered ? 'var(--badge-emerald-color, #047857)' : isCurrent ? '#818CF8' : 'var(--text-secondary)',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    Q{idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Current Question Display */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--primary-accent)', fontWeight: '800', marginBottom: '8px' }}>
                QUESTION {currentIdx + 1} OF {MOCK_MCQS.length}
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '20px', lineHeight: 1.5 }}>
                {currentQ.question}
              </h3>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {currentQ.options.map((opt, optIdx) => {
                  const isSelected = selectedAnswers[currentQ.id] === optIdx;
                  const isCorrect = currentQ.correctOptionIndex === optIdx;
                  const isAnswered = selectedAnswers[currentQ.id] !== undefined;

                  let bgColor = 'rgba(255,255,255,0.04)';
                  let borderColor = 'var(--border-color)';
                  let textColor = 'var(--text-primary)';

                  if (isAnswered) {
                    if (isCorrect) {
                      bgColor = 'rgba(16,185,129,0.12)';
                      borderColor = 'var(--badge-emerald-color, #047857)';
                      textColor = 'var(--badge-emerald-color, #047857)';
                    } else if (isSelected && !isCorrect) {
                      bgColor = 'rgba(239,68,68,0.12)';
                      borderColor = '#E11D48';
                      textColor = '#E11D48';
                    }
                  }

                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleSelectOption(currentQ.id, optIdx)}
                      style={{
                        padding: '14px 18px',
                        borderRadius: '12px',
                        background: bgColor,
                        border: `1px solid ${borderColor}`,
                        color: textColor,
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.06)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.85rem',
                          fontWeight: '800'
                        }}>
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>

                      {isAnswered && isCorrect && <CheckCircle2 size={20} color="#34D399" />}
                      {isAnswered && isSelected && !isCorrect && <XCircle size={20} color="#FCA5A5" />}
                    </div>
                  );
                })}
              </div>

              {/* Instant Explanation Box */}
              {showExplanation[currentQ.id] && (
                <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(99,102,241,0.1)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.3)' }}>
                  <div style={{ fontWeight: '800', color: '#818CF8', fontSize: '0.85rem', marginBottom: '4px' }}>
                    💡 EXPLANATION:
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {currentQ.explanation}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Navigation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                className="btn-secondary"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((prev) => prev - 1)}
              >
                Previous
              </button>

              {currentIdx < MOCK_MCQS.length - 1 ? (
                <button className="btn-primary" onClick={() => setCurrentIdx((prev) => prev + 1)}>
                  Next Question <ArrowRight size={16} />
                </button>
              ) : (
                <button className="btn-emerald" onClick={() => setIsFinished(true)}>
                  Submit Test <CheckCircle2 size={16} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Check, MapPin, GraduationCap, Sparkles, BookOpen, ShieldCheck, Landmark, Award, ChevronRight, ArrowLeft } from 'lucide-react';
import { INDIAN_STATES_LIST, CORE_MODULES_LIST, CoreModuleItem, SubCategoryItem, getSubCategoriesForModuleAndState, getSubjectsForStateAndModule } from '../services/taxonomyTree';
import { updateStudentLearningPreference } from '../services/authService';

interface StudentPreferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedUser: any) => void;
  initialStateCode?: string;
  initialCategoryCode?: string;
  initialSubCategory?: string;
}

export const StudentPreferenceModal: React.FC<StudentPreferenceModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialStateCode = 'GLOBAL',
  initialCategoryCode = 'SCHOOL_K12',
  initialSubCategory = ''
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedState, setSelectedState] = useState<string>(initialStateCode);
  const [selectedModuleCode, setSelectedModuleCode] = useState<string>(initialCategoryCode);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>(initialSubCategory);
  const [selectedStream, setSelectedStream] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All Subjects (Complete Package)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const currentModule: CoreModuleItem =
    CORE_MODULES_LIST.find((m) => m.code === selectedModuleCode) || CORE_MODULES_LIST[0];

  const currentSubCategories: SubCategoryItem[] = getSubCategoriesForModuleAndState(selectedModuleCode, selectedState);

  const selectedSubCategoryObj = currentSubCategories.find((s) => s.code === selectedSubCategory);

  const getModuleIcon = (iconName: string) => {
    switch (iconName) {
      case 'GraduationCap': return <GraduationCap size={22} className="text-emerald-400" />;
      case 'Sparkles': return <Sparkles size={22} className="text-sky-400" />;
      case 'BookOpen': return <BookOpen size={22} className="text-purple-400" />;
      case 'ShieldCheck': return <ShieldCheck size={22} className="text-emerald-400" />;
      case 'Landmark': return <Landmark size={22} className="text-amber-400" />;
      case 'Award': return <Award size={22} className="text-rose-400" />;
      default: return <GraduationCap size={22} />;
    }
  };

  const handleSavePreference = async () => {
    if (!selectedSubCategory) {
      setErrorMsg('Please select your specific target board, exam, or degree.');
      return;
    }

    if (selectedSubCategoryObj?.hasStreams && !selectedStream) {
      setErrorMsg('Please select your Senior Secondary stream (Arts, Commerce, or Science).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const res = await updateStudentLearningPreference({
      stateCode: selectedState,
      categoryCode: selectedModuleCode,
      subCategory: selectedSubCategory,
      subCategoryTitle: selectedSubCategoryObj ? selectedSubCategoryObj.title : '',
      stream: selectedStream,
      boardOrGrade: selectedSubCategoryObj ? selectedSubCategoryObj.title : '',
      subjectName: selectedSubject
    });

    setIsSubmitting(false);

    if (res.success && res.data) {
      onSaved(res.data.user);
      onClose();
    } else {
      setErrorMsg(res.message || 'Failed to save preference. Please try again.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        padding: '16px'
      }}
    >
      <div
        className="glass-card animate-fadeIn"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span className="badge badge-primary" style={{ padding: '3px 10px', fontSize: '0.72rem' }}>
                🎯 STUDENT PERSONALIZATION ENGINE
              </span>
              <span className="badge badge-emerald" style={{ padding: '3px 10px', fontSize: '0.72rem' }}>
                STEP {step} OF 3
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, letterSpacing: '-0.3px' }}>
              Select Your Learning Goal & Preference
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', margin: 0 }}>
              We filter courses to match your exact state, board, and exam targets.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.4)', color: '#FB7185', fontSize: '0.84rem', fontWeight: '600', marginBottom: '16px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Step Indicator Bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <div style={{ flex: 1, height: '5px', borderRadius: '4px', background: step >= 1 ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.1)' }} />
          <div style={{ flex: 1, height: '5px', borderRadius: '4px', background: step >= 2 ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.1)' }} />
          <div style={{ flex: 1, height: '5px', borderRadius: '4px', background: step >= 3 ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* STEP 1: STATE SELECTION */}
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} className="text-emerald-400" /> Step 1: Select Your State / Region (Level 1)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px', marginBottom: '20px' }}>
              {INDIAN_STATES_LIST.map((st) => {
                const isSelected = selectedState === st.code;
                return (
                  <button
                    key={st.code}
                    type="button"
                    onClick={() => setSelectedState(st.code)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid #10B981' : '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
                      color: isSelected ? '#34D399' : 'var(--text-primary)',
                      fontWeight: isSelected ? '800' : '500',
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span>{st.name}</span>
                    {isSelected && <Check size={16} className="text-emerald-400" />}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn-emerald"
                onClick={() => setStep(2)}
                style={{ padding: '10px 20px', fontSize: '0.88rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                Next: Select Category <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: MAIN CORE MODULE CATEGORY */}
        {step === 2 && (
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={18} className="text-sky-400" /> Step 2: Select Main Category / Goal (Level 2)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px', marginBottom: '20px' }}>
              {CORE_MODULES_LIST.map((mod) => {
                const isSelected = selectedModuleCode === mod.code;
                return (
                  <div
                    key={mod.code}
                    onClick={() => {
                      setSelectedModuleCode(mod.code);
                      setSelectedSubCategory('');
                      setSelectedStream('');
                    }}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '14px',
                      border: isSelected ? '2px solid #6366F1' : '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)' }}>
                      {getModuleIcon(mod.icon)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '800', fontSize: '0.95rem', color: isSelected ? '#A5B4FC' : 'var(--text-primary)' }}>
                        {mod.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {mod.description}
                      </div>
                    </div>
                    {isSelected && <Check size={18} className="text-indigo-400" />}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                className="btn-secondary"
                onClick={() => setStep(1)}
                style={{ padding: '8px 16px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft size={16} /> Back to State
              </button>
              <button
                className="btn-emerald"
                onClick={() => setStep(3)}
                style={{ padding: '10px 20px', fontSize: '0.88rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                Next: Select Course / Board <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUBCATEGORY, BOARD, EXAM & STREAM */}
        {step === 3 && (
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} className="text-purple-400" /> Step 3: Select Specific Course / Board / Exam (Level 3)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Sub-categories inside <strong>{currentModule.title}</strong>:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px', marginBottom: '16px' }}>
              {currentSubCategories.map((sub) => {
                const isSelected = selectedSubCategory === sub.code;
                return (
                  <div
                    key={sub.code}
                    onClick={() => {
                      setSelectedSubCategory(sub.code);
                      if (!sub.hasStreams) setSelectedStream('');
                    }}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid #34D399' : '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.03)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontWeight: isSelected ? '800' : '600', fontSize: '0.88rem', color: isSelected ? '#34D399' : 'var(--text-primary)' }}>
                      {sub.title}
                    </span>
                    {isSelected && <Check size={18} className="text-emerald-400" />}
                  </div>
                );
              })}
            </div>

            {/* Stream Selector for PUC / Senior Secondary */}
            {selectedSubCategoryObj?.hasStreams && selectedSubCategoryObj.streams && (
              <div style={{ marginBottom: '16px', padding: '14px', borderRadius: '12px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.3)' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '800', color: '#A5B4FC', display: 'block', marginBottom: '8px' }}>
                  🎓 Select Your Senior Secondary (+1 & +2) Academic Stream:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px' }}>
                  {selectedSubCategoryObj.streams.map((st) => {
                    const isSelected = selectedStream === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setSelectedStream(st)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #818CF8' : '1px solid var(--border-color)',
                          background: isSelected ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)',
                          color: isSelected ? '#FFF' : 'var(--text-secondary)',
                          fontWeight: '700',
                          fontSize: '0.78rem',
                          cursor: 'pointer'
                        }}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <button
                className="btn-secondary"
                onClick={() => setStep(2)}
                style={{ padding: '8px 16px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft size={16} /> Back to Category
              </button>

              <button
                className="btn-emerald"
                disabled={!selectedSubCategory}
                onClick={() => setStep(4)}
                style={{ padding: '10px 22px', fontSize: '0.88rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                Next: Select Subject Focus <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: PRIMARY SUBJECT FOCUS (LEVEL 5) */}
        {step === 4 && (
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} className="text-amber-400" /> Step 4: Select Primary Subject Focus (Level 5)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Select specific subject course target or complete package:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px', marginBottom: '16px' }}>
              {getSubjectsForStateAndModule(selectedState).map((sbj) => {
                const isSelected = selectedSubject === sbj;
                return (
                  <div
                    key={sbj}
                    onClick={() => setSelectedSubject(sbj)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid #F59E0B' : '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)',
                      color: isSelected ? '#FBBF24' : 'var(--text-primary)',
                      fontWeight: isSelected ? '800' : '600',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                  >
                    <span>{sbj}</span>
                    {isSelected && <Check size={16} className="text-amber-400" />}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <button
                className="btn-secondary"
                onClick={() => setStep(3)}
                style={{ padding: '8px 16px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft size={16} /> Back to Course Target
              </button>

              <button
                className="btn-emerald"
                disabled={isSubmitting}
                onClick={handleSavePreference}
                style={{ padding: '10px 22px', fontSize: '0.88rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {isSubmitting ? 'Saving Preference...' : '🎉 Save & Filter Courses'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

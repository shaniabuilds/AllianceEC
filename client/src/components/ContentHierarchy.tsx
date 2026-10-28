import React, { useState } from 'react';
import { 
  GraduationCap, Award, BookOpen, Building2, Landmark, UserCheck, 
  ChevronRight, Play, FileText, HelpCircle, 
  Sparkles, Zap, Calculator, FlaskConical, Dna
} from 'lucide-react';
import { 
  MAIN_CATEGORIES, MOCK_COURSES, MOCK_SUBJECTS, MOCK_CHAPTERS, 
  StateOption, MainCategory, Course, Subject
} from '../mockData';

interface ContentHierarchyProps {
  selectedState: StateOption;
  onOpenStatePicker: () => void;
  onLaunchMcq: () => void;
  onLaunchVideo: () => void;
  onLaunchLesson: () => void;
}

export const ContentHierarchy: React.FC<ContentHierarchyProps> = ({
  selectedState,
  onOpenStatePicker,
  onLaunchMcq,
  onLaunchVideo,
  onLaunchLesson
}) => {
  const [selectedCategory, setSelectedCategory] = useState<MainCategory | null>(MAIN_CATEGORIES[0]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(MOCK_COURSES[0]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(MOCK_SUBJECTS[0]);

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'GraduationCap': return <GraduationCap size={28} />;
      case 'Award': return <Award size={28} />;
      case 'BookOpen': return <BookOpen size={28} />;
      case 'Building2': return <Building2 size={28} />;
      case 'Landmark': return <Landmark size={28} />;
      case 'UserCheck': return <UserCheck size={28} />;
      default: return <BookOpen size={28} />;
    }
  };

  const renderSubjectIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap': return <Zap size={20} color="#6366F1" />;
      case 'Calculator': return <Calculator size={20} color="#10B981" />;
      case 'FlaskConical': return <FlaskConical size={20} color="#0EA5E9" />;
      case 'Dna': return <Dna size={20} color="#EC4899" />;
      default: return <BookOpen size={20} color="#6366F1" />;
    }
  };

  return (
    <div>
      {/* Hero Banner with State Localization */}
      <div className="glass-card" style={{ padding: '32px', marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '800px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span className="badge badge-emerald">
              <Sparkles size={12} /> STATE LOCALIZATION ACTIVE: {selectedState.name.toUpperCase()} ({selectedState.code})
            </span>
            <span className="badge badge-primary">6-LEVEL HIERARCHY ENGINE</span>
          </div>

          <h1 style={{ fontSize: '2.4rem', fontWeight: '800', marginBottom: '12px' }}>
            Tailored Learning for <span className="gradient-text">{selectedState.name}</span> Students & Aspirants
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '20px' }}>
            Showing customized courses for state boards, entrance exams, and state public service job prep. Over <strong style={{ color: '#FFF' }}>{selectedState.studentsCount}</strong> enrolled in this state region.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn-emerald" onClick={onOpenStatePicker}>
              Change State Preference ({selectedState.code})
            </button>
            <button className="btn-secondary" onClick={() => setSelectedCategory(MAIN_CATEGORIES[0])}>
              Browse K-12 School Courses
            </button>
          </div>
        </div>
      </div>

      {/* LEVEL 2: 6 CORE MAIN CATEGORIES GRID */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800' }}>
              Level 2: Select Main Category
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              6 specialized educational verticals catering to school, entrance, degree & job exams
            </p>
          </div>
        </div>

        <div className="grid-responsive-3">
          {MAIN_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory?.id === cat.id;
            return (
              <div
                key={cat.id}
                className="glass-card glass-card-interactive"
                onClick={() => {
                  setSelectedCategory(cat);
                  // Default to first course if category changes
                  setSelectedCourse(MOCK_COURSES[0]);
                }}
                style={{
                  padding: '24px',
                  border: isSelected ? '2px solid var(--primary-accent)' : '1px solid var(--border-color)',
                  background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-card)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '16px',
                    background: cat.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFF',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.3)'
                  }}>
                    {renderIcon(cat.iconName)}
                  </div>
                  <span className="badge badge-primary">{cat.coursesCount} Courses</span>
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '6px' }}>
                  {cat.title}
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px', minHeight: '42px' }}>
                  {cat.subtitle}
                </p>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {cat.popularItems.slice(0, 2).map((item, idx) => (
                    <span key={idx} style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '6px', color: 'var(--text-muted)' }}>
                      • {item}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* LEVEL 3 & 4: COURSES & SUBJECTS DRILLDOWN */}
      {selectedCategory && (
        <div style={{ marginBottom: '40px' }}>
          {/* Breadcrumb path */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <span>{selectedState.name}</span>
            <ChevronRight size={16} />
            <span style={{ color: 'var(--primary-accent)', fontWeight: '700' }}>{selectedCategory.title}</span>
            <ChevronRight size={16} />
            <span style={{ color: '#FFF', fontWeight: '700' }}>{selectedCourse?.title}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
            {/* Level 3: Courses List */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen color="var(--primary-accent)" size={20} />
                Level 3: Courses / Boards / Grades
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {MOCK_COURSES.map((course) => {
                  const isSelected = selectedCourse?.id === course.id;
                  return (
                    <div
                      key={course.id}
                      onClick={() => setSelectedCourse(course)}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255,255,255,0.02)',
                        border: isSelected ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--primary-accent)', fontWeight: '800' }}>
                          {course.level}
                        </span>
                        {course.badge && <span className="badge badge-amber">{course.badge}</span>}
                      </div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '6px' }}>
                        {course.title}
                      </h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                        <span style={{ color: '#34D399', fontWeight: '800' }}>₹ {course.price}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{course.subjectsCount} Subjects • ⭐ {course.rating}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Level 4: Subjects List */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap color="#10B981" size={20} />
                Level 4: Subjects ({selectedCourse?.title})
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {MOCK_SUBJECTS.map((subj) => {
                  const isSelected = selectedSubject?.id === subj.id;
                  const progressPct = Math.round((subj.completedLessons / subj.totalLessons) * 100);
                  return (
                    <div
                      key={subj.id}
                      onClick={() => setSelectedSubject(subj)}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.02)',
                        border: isSelected ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {renderSubjectIcon(subj.icon)}
                          <span style={{ fontWeight: '700', fontSize: '0.98rem' }}>{subj.title}</span>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                          {subj.chaptersCount} Chapters
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <span>Progress</span>
                          <span>{progressPct}% ({subj.completedLessons}/{subj.totalLessons} Lessons)</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${progressPct}%`, height: '100%', background: subj.color }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LEVEL 5 & 6: CHAPTERS & LEARNING ASSET LAUNCHERS */}
      {selectedSubject && (
        <div className="glass-card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span className="badge badge-emerald" style={{ marginBottom: '8px' }}>
                LEVEL 5 & 6: CHAPTERS & LEARNING ASSETS
              </span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: '800' }}>
                {selectedSubject.title} — Chapters Breakdown
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-emerald" onClick={onLaunchMcq}>
                <HelpCircle size={16} /> Take MCQ Quiz
              </button>
              <button className="btn-primary" onClick={onLaunchVideo}>
                <Play size={16} /> Watch Video Class
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {MOCK_CHAPTERS.map((chap) => (
              <div
                key={chap.id}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '20px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary-accent)', fontWeight: '800' }}>
                      CHAPTER {chap.chapterNumber}
                    </span>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginTop: '2px' }}>
                      {chap.title}
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '8px' }}>
                    ⏱️ {chap.duration}
                  </span>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  {chap.description}
                </p>

                {/* Level 6 Asset Badges & Interactive Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '14px' }}>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>📖 {chap.assets.lessonsCount} Lessons</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>📝 {chap.assets.notesCount} PDF Notes</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>❓ {chap.assets.mcqsCount} MCQs</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>🎥 {chap.assets.videosCount} Videos</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary" onClick={onLaunchLesson} style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                      <FileText size={14} /> Lesson Notes
                    </button>
                    <button className="btn-secondary" onClick={onLaunchVideo} style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                      <Play size={14} /> Play DRM Video
                    </button>
                    <button className="btn-emerald" onClick={onLaunchMcq} style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                      <HelpCircle size={14} /> Test MCQs
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

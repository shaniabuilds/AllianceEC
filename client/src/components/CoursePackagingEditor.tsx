import React, { useState } from 'react';
import {
  BookOpen, Video, Radio, FileText, Plus, Trash2,
  Sparkles, Award, Layers, X
} from 'lucide-react';
import { CourseInclusions, CourseCurriculumItem } from '../services/adminService';

interface CoursePackagingEditorProps {
  subjectName: string;
  syllabusTopics: string[];
  onTopicsChange: (topics: string[]) => void;
  courseMode: 'LIVE_ONLINE' | 'RECORDED_VIDEO' | 'HYBRID';
  onCourseModeChange: (mode: 'LIVE_ONLINE' | 'RECORDED_VIDEO' | 'HYBRID') => void;
  liveMeetingUrl: string;
  onLiveMeetingUrlChange: (url: string) => void;
  lectureVideoUrl: string;
  onLectureVideoUrlChange: (url: string) => void;
  demoVideoUrl: string;
  onDemoVideoUrlChange: (url: string) => void;
  liveSchedule: string;
  onLiveScheduleChange: (schedule: string) => void;
  ebookTitle: string;
  onEbookTitleChange: (title: string) => void;
  ebookPdfUrl: string;
  onEbookPdfUrlChange: (url: string) => void;
  inclusions: CourseInclusions;
  onInclusionsChange: (inclusions: CourseInclusions) => void;
  curriculum: CourseCurriculumItem[];
  onCurriculumChange: (curriculum: CourseCurriculumItem[]) => void;
}

export const CoursePackagingEditor: React.FC<CoursePackagingEditorProps> = ({
  subjectName,
  syllabusTopics,
  onTopicsChange,
  courseMode,
  onCourseModeChange,
  liveMeetingUrl,
  onLiveMeetingUrlChange,
  lectureVideoUrl,
  onLectureVideoUrlChange,
  demoVideoUrl,
  onDemoVideoUrlChange,
  liveSchedule,
  onLiveScheduleChange,
  ebookTitle,
  onEbookTitleChange,
  ebookPdfUrl,
  onEbookPdfUrlChange,
  inclusions,
  onInclusionsChange,
  curriculum,
  onCurriculumChange
}) => {
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [newCurriculumTitle, setNewCurriculumTitle] = useState('');
  const [newCurriculumLectures, setNewCurriculumLectures] = useState('5');
  const [showCurriculumBuilder, setShowCurriculumBuilder] = useState(curriculum.length > 0);

  // Add individual or comma-separated custom topics
  const handleAddTopic = () => {
    const raw = customTopicInput.trim();
    if (!raw) return;

    // Support comma-separated batch topic entry (e.g. "Algebra, Geometry, Trigonometry")
    const parts = raw.split(/[,;\n]+/).map(p => p.trim()).filter(Boolean);
    const updated = [...syllabusTopics];

    parts.forEach(part => {
      if (!updated.includes(part)) {
        updated.push(part);
      }
    });

    onTopicsChange(updated);
    setCustomTopicInput('');
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    onTopicsChange(syllabusTopics.filter((t) => t !== topicToRemove));
  };

  const handleClearAllTopics = () => {
    onTopicsChange([]);
  };

  const handleInclusionUpdate = (field: keyof CourseInclusions, value: any) => {
    onInclusionsChange({
      ...inclusions,
      [field]: value
    });
  };

  const handleAddCurriculumModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCurriculumTitle.trim()) return;
    const item: CourseCurriculumItem = {
      title: newCurriculumTitle.trim(),
      description: '',
      lectureCount: Number(newCurriculumLectures) || 1
    };
    onCurriculumChange([...curriculum, item]);
    setNewCurriculumTitle('');
    setNewCurriculumLectures('5');
  };

  const handleRemoveCurriculumModule = (index: number) => {
    onCurriculumChange(curriculum.filter((_, idx) => idx !== index));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* 1. CUSTOM TOPICS BUILDER (No hardcoded predefined lists - 100% custom & infinite) */}
      <div
        style={{
          background: 'rgba(99, 102, 241, 0.05)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '12px',
          padding: '12px 14px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="badge badge-primary" style={{ fontSize: '0.66rem', padding: '1px 6px', fontWeight: '800' }}>
              <Layers size={11} style={{ marginRight: '3px' }} /> SYLLABUS TOPICS
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {subjectName ? `${subjectName} Topics` : 'Topics Covered'} ({syllabusTopics.length})
            </span>
          </div>

          {syllabusTopics.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllTopics}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.72rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Clear All
            </button>
          )}
        </div>

        {/* Input for Custom Topics */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input
            type="text"
            className="form-input"
            value={customTopicInput}
            onChange={(e) => setCustomTopicInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTopic();
              }
            }}
            placeholder="Type topic name (e.g. Algebra, Trigonometry) & press Enter..."
            style={{ padding: '6px 10px', fontSize: '0.82rem', flex: 1 }}
          />
          <button
            type="button"
            className="btn-primary"
            onClick={handleAddTopic}
            style={{ fontSize: '0.76rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
          >
            <Plus size={13} /> Add
          </button>
        </div>

        {/* Dynamic Topic Tag Chips */}
        {syllabusTopics.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '120px', overflowY: 'auto', padding: '2px' }}>
            {syllabusTopics.map((topic) => (
              <span
                key={topic}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 8px',
                  borderRadius: '16px',
                  fontSize: '0.74rem',
                  fontWeight: '600',
                  background: 'rgba(99, 102, 241, 0.18)',
                  border: '1px solid rgba(99, 102, 241, 0.35)',
                  color: '#C7D2FE'
                }}
              >
                <span>#{topic}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTopic(topic)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#A5B4FC',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Remove topic"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
            No topics added yet. Add specific topics so students know what they will learn.
          </p>
        )}
      </div>

      {/* 2. COMPLETE COURSE PACKAGING & INCLUSIONS */}
      <div
        style={{
          background: 'rgba(16, 185, 129, 0.04)',
          border: '1px solid rgba(16, 185, 129, 0.22)',
          borderRadius: '12px',
          padding: '12px 14px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="badge badge-emerald" style={{ fontSize: '0.66rem', padding: '1px 6px', fontWeight: '800' }}>
              <Sparkles size={11} style={{ marginRight: '3px' }} /> PACKAGE DELIVERABLES
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Course Inclusions & Perks
            </span>
          </div>

          {/* Delivery Mode Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Format:</label>
            <select
              className="form-input"
              value={courseMode}
              onChange={(e) => onCourseModeChange(e.target.value as any)}
              style={{ padding: '3px 8px', fontSize: '0.78rem', fontWeight: '700', color: '#34D399', width: 'auto' }}
            >
              <option value="LIVE_ONLINE">🔴 Live Online Class</option>
              <option value="RECORDED_VIDEO">📹 Recorded Video</option>
              <option value="HYBRID">⚡ Hybrid (Live + Recorded)</option>
            </select>
          </div>
        </div>

        {/* Video Vault + Live Schedule in Compact 2-Column Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '10px' }}>
          {/* Video Vault Card */}
          <div style={{ background: 'var(--bg-surface)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: '800', color: '#818CF8', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Video size={13} /> 1. Video Lectures
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
              <div>
                <label style={{ fontSize: '0.68rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block' }}>Lectures Count</label>
                <input
                  type="number"
                  className="form-input"
                  value={inclusions.totalLectures || ''}
                  onChange={(e) => handleInclusionUpdate('totalLectures', Number(e.target.value) || 0)}
                  placeholder="e.g. 40"
                  style={{ padding: '4px 6px', fontSize: '0.78rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.68rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block' }}>Total Hours</label>
                <input
                  type="number"
                  className="form-input"
                  value={inclusions.totalHours || ''}
                  onChange={(e) => handleInclusionUpdate('totalHours', Number(e.target.value) || 0)}
                  placeholder="e.g. 50"
                  style={{ padding: '4px 6px', fontSize: '0.78rem' }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.68rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block' }}>Lecture / Playlist URL</label>
              <input
                type="url"
                className="form-input"
                value={lectureVideoUrl}
                onChange={(e) => onLectureVideoUrlChange(e.target.value)}
                placeholder="https://youtube.com/... or stream link"
                style={{ padding: '4px 6px', fontSize: '0.78rem' }}
              />
            </div>
            <div style={{ marginTop: '4px' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: '600', color: '#10B981', display: 'block' }}>Free Demo Video Link</label>
              <input
                type="url"
                className="form-input"
                value={demoVideoUrl}
                onChange={(e) => onDemoVideoUrlChange(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                style={{ padding: '4px 6px', fontSize: '0.78rem' }}
              />
            </div>
          </div>

          {/* Live Classroom Card */}
          <div style={{ background: 'var(--bg-surface)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: '800', color: '#34D399', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Radio size={13} /> 2. Live Interactive Class
            </div>
            <div style={{ marginBottom: '6px' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block' }}>Live Meeting Link (Zoom / Meet)</label>
              <input
                type="url"
                className="form-input"
                value={liveMeetingUrl}
                onChange={(e) => onLiveMeetingUrlChange(e.target.value)}
                placeholder="https://meet.google.com/... or zoom link"
                style={{ padding: '4px 6px', fontSize: '0.78rem' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '6px' }}>
              <div>
                <label style={{ fontSize: '0.68rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block' }}>Class Schedule Timing</label>
                <input
                  type="text"
                  className="form-input"
                  value={liveSchedule}
                  onChange={(e) => onLiveScheduleChange(e.target.value)}
                  placeholder="e.g. Mon, Wed & Fri @ 7 PM"
                  style={{ padding: '4px 6px', fontSize: '0.78rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.68rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block' }}>Live Sessions</label>
                <input
                  type="number"
                  className="form-input"
                  value={inclusions.totalLiveSessions || ''}
                  onChange={(e) => handleInclusionUpdate('totalLiveSessions', Number(e.target.value) || 0)}
                  placeholder="e.g. 15"
                  style={{ padding: '4px 6px', fontSize: '0.78rem' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* E-Books & Mock Tests in 2-Column Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '10px' }}>
          {/* E-Books Card */}
          <div style={{ background: 'var(--bg-surface)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: '800', color: '#F59E0B', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <BookOpen size={13} /> 3. E-Books & Study Notes (PDF)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '6px', marginBottom: '6px' }}>
              <div>
                <label style={{ fontSize: '0.68rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block' }}>E-Book / Notes Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={ebookTitle}
                  onChange={(e) => onEbookTitleChange(e.target.value)}
                  placeholder="e.g. Formula Book & Notes"
                  style={{ padding: '4px 6px', fontSize: '0.78rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.68rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block' }}>Total PDFs</label>
                <input
                  type="number"
                  className="form-input"
                  value={inclusions.totalEbooks || ''}
                  onChange={(e) => handleInclusionUpdate('totalEbooks', Number(e.target.value) || 0)}
                  placeholder="e.g. 5"
                  style={{ padding: '4px 6px', fontSize: '0.78rem' }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.68rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block' }}>PDF Download Link</label>
              <input
                type="url"
                className="form-input"
                value={ebookPdfUrl}
                onChange={(e) => onEbookPdfUrlChange(e.target.value)}
                placeholder="Google Drive or Cloud PDF link"
                style={{ padding: '4px 6px', fontSize: '0.78rem' }}
              />
            </div>
          </div>

          {/* Mock Tests & Assessments Card */}
          <div style={{ background: 'var(--bg-surface)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: '800', color: '#EC4899', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <FileText size={13} /> 4. Mock Test Series
            </div>
            <div>
              <label style={{ fontSize: '0.68rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block' }}>Total Mock Test Papers</label>
              <input
                type="number"
                className="form-input"
                value={inclusions.totalMockTests || ''}
                onChange={(e) => handleInclusionUpdate('totalMockTests', Number(e.target.value) || 0)}
                placeholder="e.g. 10"
                style={{ padding: '4px 6px', fontSize: '0.78rem', marginBottom: '6px' }}
              />
            </div>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.3 }}>
              Full-length practice test papers with solution keys included.
            </p>
          </div>
        </div>

        {/* 5. Course Perks & Badges (Clean 2x2 Grid) */}
        <div style={{ background: 'var(--bg-surface)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#10B981', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Award size={13} /> 5. Course Perks & Badges
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '6px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={inclusions.hasCertificate ?? true}
                onChange={(e) => handleInclusionUpdate('hasCertificate', e.target.checked)}
              />
              Completion Certificate
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={inclusions.hasDoubtSupport ?? true}
                onChange={(e) => handleInclusionUpdate('hasDoubtSupport', e.target.checked)}
              />
              1-on-1 Doubt Clearing
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={inclusions.hasDownloadableNotes ?? true}
                onChange={(e) => handleInclusionUpdate('hasDownloadableNotes', e.target.checked)}
              />
              Downloadable Summary Sheets
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={inclusions.hasLifetimeAccess ?? false}
                onChange={(e) => handleInclusionUpdate('hasLifetimeAccess', e.target.checked)}
              />
              Lifetime Validity Access
            </label>
          </div>
        </div>
      </div>

      {/* 3. OPTIONAL CHAPTER BREAKDOWN (Collapsible) */}
      <div
        style={{
          background: 'rgba(245, 158, 11, 0.04)',
          border: '1px solid rgba(245, 158, 11, 0.22)',
          borderRadius: '12px',
          padding: '10px 14px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: '800', color: '#F59E0B' }}>
              📚 Course Chapters / Modules ({curriculum.length})
            </span>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowCurriculumBuilder(!showCurriculumBuilder)}
            style={{ fontSize: '0.72rem', padding: '3px 8px' }}
          >
            {showCurriculumBuilder ? 'Hide Chapters' : '+ Add Chapters / Modules'}
          </button>
        </div>

        {showCurriculumBuilder && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              <input
                type="text"
                className="form-input"
                value={newCurriculumTitle}
                onChange={(e) => setNewCurriculumTitle(e.target.value)}
                placeholder="Chapter name (e.g. Chapter 1: Real Numbers)..."
                style={{ padding: '5px 8px', fontSize: '0.78rem', flex: 1 }}
              />
              <input
                type="number"
                className="form-input"
                value={newCurriculumLectures}
                onChange={(e) => setNewCurriculumLectures(e.target.value)}
                placeholder="Lectures"
                style={{ padding: '5px 8px', fontSize: '0.78rem', width: '80px' }}
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={handleAddCurriculumModule}
                style={{ fontSize: '0.74rem', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                <Plus size={12} /> Add
              </button>
            </div>

            {curriculum.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '100px', overflowY: 'auto' }}>
                {curriculum.map((mod, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'var(--bg-surface)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.74rem'
                    }}
                  >
                    <span>
                      <strong>{idx + 1}. {mod.title}</strong>
                      <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>({mod.lectureCount || 1} Lectures)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCurriculumModule(idx)}
                      style={{ background: 'none', border: 'none', color: '#FB7185', cursor: 'pointer', padding: 0 }}
                      title="Remove"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

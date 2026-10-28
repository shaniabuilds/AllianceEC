import React, { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { fetchCourseRichContents, RichContentView } from '../services/studentService';

export const CourseRichContentViewer: React.FC<{ courseId: string }> = ({ courseId }) => {
  const [items, setItems] = useState<RichContentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError('');
      const res = await fetchCourseRichContents(courseId);
      if (!active) return;
      if (res.success && res.data) setItems(res.data.richContents || []);
      else setError(res.message || 'Content load nahi ho paaya.');
      setLoading(false);
    })();
    return () => { active = false; };
  }, [courseId]);

  if (loading) return <div style={{ padding: 16, color: 'var(--text-muted)' }}>Loading study content...</div>;
  if (error) return <div style={{ padding: 16, color: '#FB7185' }}>{error}</div>;
  if (items.length === 0) {
    return <div style={{ padding: 16, color: 'var(--text-muted)' }}>Is batch me abhi koi study content add nahi hua hai.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {items.map((rc, i) => (
        <article key={i} className="glass-card" style={{ padding: '18px 22px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--primary-accent)', fontWeight: 700 }}>#{rc.topic}</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '4px 0 10px' }}>{rc.title}</h3>
          <div className="rich-view" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rc.html) }} />
        </article>
      ))}
    </div>
  );
};
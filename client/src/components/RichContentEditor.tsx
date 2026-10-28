import React, { useRef } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

interface RichContentEditorProps {
  value: string;
  onChange: (html: string) => void;
  onUploadImage?: (file: File) => Promise<string>; // returns hosted image URL
}

const btn = (active = false): React.CSSProperties => ({
  padding: '4px 9px',
  borderRadius: '6px',
  border: '1px solid var(--border-color)',
  background: active ? '#EC4899' : 'var(--bg-surface)',
  color: active ? '#FFF' : 'var(--text-secondary)',
  fontSize: '0.72rem',
  fontWeight: 700,
  cursor: 'pointer'
});

export const RichContentEditor: React.FC<RichContentEditorProps> = ({ value, onChange, onUploadImage }) => {
  const editorRef = useRef<Editor | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertUploadedImage = async (file: File) => {
    if (!onUploadImage) return;
    try {
      const url = await onUploadImage(file);
      editorRef.current?.chain().focus().setImage({ src: url }).run();
    } catch (err: any) {
      alert(err?.message || 'Image upload fail ho gayi.');
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      // Word se aane wali broken file:// images hata do
      transformPastedHTML: (html) => html.replace(/<img[^>]+src=["']file:[^"']*["'][^>]*>/gi, ''),
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files || []).filter((f) => f.type.startsWith('image/'));
        const hasHtml = !!event.clipboardData?.getData('text/html');
        // Sirf screenshot / image copy ho to upload karke daalo
        if (files.length > 0 && !hasHtml && onUploadImage) {
          files.forEach(insertUploadedImage);
          return true;
        }
        return false; // baaki sab TipTap khud handle karega (text, tables, lists)
      }
    }
  });
  editorRef.current = editor;

  if (!editor) return null;

  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', padding: '8px', borderBottom: '1px solid var(--border-color)' }}>
        <button type="button" style={btn(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
        <button type="button" style={btn(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()}>I</button>
        <button type="button" style={btn(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button type="button" style={btn(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</button>
        <button type="button" style={btn(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</button>
        <button type="button" style={btn()} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>▦ Table</button>
        {editor.isActive('table') && (
          <>
            <button type="button" style={btn()} onClick={() => editor.chain().focus().addRowAfter().run()}>+ Row</button>
            <button type="button" style={btn()} onClick={() => editor.chain().focus().addColumnAfter().run()}>+ Col</button>
            <button type="button" style={btn()} onClick={() => editor.chain().focus().deleteTable().run()}>🗑 Table</button>
          </>
        )}
        {onUploadImage && (
          <>
            <button type="button" style={btn()} onClick={() => fileInputRef.current?.click()}>🖼 Image</button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) insertUploadedImage(f);
                e.target.value = '';
              }}
            />
          </>
        )}
        <button type="button" style={btn()} onClick={() => editor.chain().focus().undo().run()}>↶</button>
        <button type="button" style={btn()} onClick={() => editor.chain().focus().redo().run()}>↷</button>
      </div>
      <EditorContent editor={editor} className="rich-content" />
    </div>
  );
};
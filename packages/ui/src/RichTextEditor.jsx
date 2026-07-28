import { useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

export default function RichTextEditor({ value, onChange, placeholder, className }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder || 'Start writing...' }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  const fileInputRef = useRef(null);

  if (!editor) return null;

  function addImage() {
    const url = prompt('Image URL:');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }

  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'content');
    fetch('/api/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('kc_token')}` },
      body: formData,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.url) editor.chain().focus().setImage({ src: data.url }).run();
      })
      .catch(() => {});
    e.target.value = '';
  }

  function setLink() {
    const url = prompt('Link URL:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  }

  return (
    <div className={`rich-editor ${className || ''}`}>
      <div className="rich-editor-toolbar">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''} title="Bold"><span className="nf nf-fa-bold" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''} title="Italic"><span className="nf nf-fa-italic" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''} title="Strikethrough"><span className="nf nf-fa-strikethrough" /></button>
        <span className="rich-editor-sep" />
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''} title="Heading 1"><span className="nf nf-fa-heading" />1</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''} title="Heading 2"><span className="nf nf-fa-heading" />2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''} title="Heading 3"><span className="nf nf-fa-heading" />3</button>
        <span className="rich-editor-sep" />
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''} title="Bullet List"><span className="nf nf-fa-list_ul" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''} title="Ordered List"><span className="nf nf-fa-list_ol" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'is-active' : ''} title="Quote"><span className="nf nf-fa-quote_right" /></button>
        <span className="rich-editor-sep" />
        <button type="button" onClick={setLink} className={editor.isActive('link') ? 'is-active' : ''} title="Link"><span className="nf nf-fa-link" /></button>
        <button type="button" onClick={() => fileInputRef.current?.click()} title="Upload Image"><span className="nf nf-fa-cloud_upload" /></button>
        <button type="button" onClick={addImage} title="Image URL"><span className="nf nf-fa-image" /></button>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleImageUpload} style={{ display: 'none' }} />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

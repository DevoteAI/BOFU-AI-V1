import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { 
  Bold, Italic, List, ListOrdered, Image as ImageIcon, 
  Heading2, Undo, Redo
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
}

export function RichTextEditor({ content, onChange, onImageUpload }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    }
  });

  if (!editor) {
    return null;
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onImageUpload || !e.target.files || !e.target.files.length) return;
    
    const file = e.target.files[0];
    try {
      const url = await onImageUpload(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-secondary-900 border-primary-500/30">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-primary-500/30 bg-secondary-800">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-secondary-700 ${editor.isActive('bold') ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400'}`}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-secondary-700 ${editor.isActive('italic') ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400'}`}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded hover:bg-secondary-700 ${editor.isActive('heading', { level: 2 }) ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400'}`}
          title="Heading"
        >
          <Heading2 size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded hover:bg-secondary-700 ${editor.isActive('bulletList') ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400'}`}
          title="Bullet list"
        >
          <List size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded hover:bg-secondary-700 ${editor.isActive('orderedList') ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400'}`}
          title="Ordered list"
        >
          <ListOrdered size={16} />
        </button>
        <label className="p-1.5 rounded hover:bg-secondary-700 text-gray-400 cursor-pointer" title="Image">
          <ImageIcon size={16} />
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
        </label>
        <button
          onClick={() => editor.chain().focus().undo().run()}
          className="p-1.5 rounded hover:bg-secondary-700 text-gray-400 ml-auto"
          title="Undo"
          disabled={!editor.can().chain().focus().undo().run()}
        >
          <Undo size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          className="p-1.5 rounded hover:bg-secondary-700 text-gray-400"
          title="Redo"
          disabled={!editor.can().chain().focus().redo().run()}
        >
          <Redo size={16} />
        </button>
      </div>
      <EditorContent editor={editor} className="prose max-w-none text-gray-300 p-4 min-h-[200px] focus:outline-none prose-headings:text-primary-400 prose-a:text-primary-400" />
    </div>
  );
}
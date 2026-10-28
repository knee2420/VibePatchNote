import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

interface RichTextEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  readOnly?: boolean;
  className?: string;
}

const EXTENSIONS = [StarterKit];

export function RichTextEditor({
  initialContent = '',
  onChange,
  readOnly = false,
  className = '',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: EXTENSIONS,
    content: initialContent,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    // We add some basic ProseMirror styling using Tailwind typography classes or raw CSS classes
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[100px] w-full',
      },
    },
  });

  useEffect(() => {
    if (editor && editor.isEditable !== !readOnly) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`rich-text-editor-container border border-slate-200 rounded-md p-4 bg-white shadow-sm ${className}`}>
      {/* TODO: Add BubbleMenu for AI Block Masking feature here later */}
      <EditorContent editor={editor} />
    </div>
  );
}

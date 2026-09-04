import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect } from 'react';
import { ScaffoldEditorExtensions } from '../extensions';
import '../styles/scaffold.css';

export interface ScaffoldCanvasEditorProps {
  initialContent?: string;
  onChangeHtml?: (html: string) => void;
  onChangeMarkdown?: (markdown: string) => void;
  className?: string;
  readOnly?: boolean;
}

export function ScaffoldCanvasEditor({
  initialContent = '',
  onChangeHtml,
  onChangeMarkdown,
  className = '',
  readOnly = false,
}: ScaffoldCanvasEditorProps) {
  const editor = useEditor({
    extensions: ScaffoldEditorExtensions,
    content: initialContent,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChangeHtml?.(html);

      // tiptap-markdown 저장소에서 순수 마크다운 추출
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const markdown = (editor.storage as any).markdown?.getMarkdown?.() || '';
      onChangeMarkdown?.(markdown);
    },
    editorProps: {
      attributes: {
        class: 'scaffold-prose outline-none min-h-[500px] w-full text-slate-900 focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (editor && initialContent && editor.getHTML() !== initialContent) {
      editor.commands.setContent(initialContent, { emitUpdate: true });
    }
  }, [editor, initialContent]);

  useEffect(() => {
    if (editor && editor.isEditable !== !readOnly) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={`scaffold-editor-root w-full bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col ${className}`}
      style={{
        backgroundColor: '#ffffff',
        color: '#0f172a',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* 2단 및 3단 그리드를 무조건 강제하는 격리 스타일 */}
      <style>{`
        .scaffold-editor-root div[data-type="column-group"],
        .scaffold-editor-root .column-group {
          display: grid !important;
          grid-template-columns: 1.25fr 1fr !important;
          gap: 1.25rem !important;
          width: 100% !important;
          margin: 1rem 0 !important;
          box-sizing: border-box !important;
        }
        .scaffold-editor-root div[data-type="column-group"][data-cols="3"],
        .scaffold-editor-root .column-group[data-cols="3"] {
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        }
        .scaffold-editor-root div[data-type="column"],
        .scaffold-editor-root .column-box {
          display: block !important;
          min-width: 0 !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
        .scaffold-editor-root .text-right {
          text-align: right !important;
        }
      `}</style>

      {/* 에디터 본문 A4 용지 캔버스 영역 */}
      <div className="flex-1 p-8 sm:p-10 overflow-y-auto max-h-[800px]" style={{ backgroundColor: '#ffffff' }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

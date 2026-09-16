import { Layers } from 'lucide-react';
import { ScaffoldCanvasEditor } from '@vibe/tiptap-scaffold';

interface DocumentWireframeEditorProps {
  documentKey: string;
  initialHtml: string;
  onChangeHtml: (html: string) => void;
  onChangeMarkdown: (md: string) => void;
}

/**
 * 와이어프레임 본문 에디터 (Tiptap 기반 A4 다단 그리드 캔버스)
 */
export function DocumentWireframeEditor({
  documentKey,
  initialHtml,
  onChangeHtml,
  onChangeMarkdown,
}: DocumentWireframeEditorProps) {
  return (
    <div className="w-full max-w-4xl flex flex-col items-center">
      <div className="w-full max-w-3xl mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-md bg-purple-500/20 text-purple-400">
            <Layers className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white">와이어프레임 편집 캔버스</h3>
            <p className="text-[11px] text-slate-400">
              A4 용지 규격의 Tiptap 다단 그리드 레이아웃
            </p>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
          💡 수정 즉시 백엔드 아카이브 및 MCP 마크다운에 실시간 저장됩니다
        </div>
      </div>

      <div className="w-full max-w-3xl">
        <ScaffoldCanvasEditor
          key={documentKey}
          initialContent={initialHtml}
          onChangeHtml={onChangeHtml}
          onChangeMarkdown={onChangeMarkdown}
        />
      </div>
    </div>
  );
}

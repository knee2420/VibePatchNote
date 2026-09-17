import { ZoomIn, ZoomOut } from 'lucide-react';
import { WordCountBadge } from '@vibe/editor-workspace';

interface EditorLabStatusBarProps {
  sectionTitle: string;
  wordCount: number;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

export function EditorLabStatusBar({
  sectionTitle,
  wordCount,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: EditorLabStatusBarProps) {
  return (
    <div className="h-7 px-4 flex items-center justify-between text-xs text-slate-500 bg-white select-none">
      {/* 브레드크럼 경로 */}
      <div className="flex items-center gap-1.5 font-medium">
        <span className="text-slate-400">문서</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-600">범용 시스템 기술 제안서</span>
        <span className="text-slate-300">/</span>
        <span className="text-indigo-600 font-semibold">{sectionTitle}</span>
      </div>

      {/* 우측 인디케이터 (글자수, 줌 제어) */}
      <div className="flex items-center gap-3">
        <WordCountBadge
          charCount={wordCount * 3}
          wordCount={wordCount}
          targetCount={500}
        />
        <div className="h-3.5 w-[1px] bg-slate-200" />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onZoomOut}
            className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
            title="축소"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onZoomReset}
            className="px-1.5 py-0.5 hover:bg-slate-100 rounded text-[11px] font-mono text-slate-600 cursor-pointer"
            title="100% 복원"
          >
            {zoom}%
          </button>
          <button
            type="button"
            onClick={onZoomIn}
            className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
            title="확대"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

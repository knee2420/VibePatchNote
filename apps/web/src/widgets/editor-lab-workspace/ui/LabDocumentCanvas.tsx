import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  PagedCanvasContainer,
  type PageLayoutMode,
} from '@vibe/editor-workspace';

import type { LabSectionContent } from '../model/mockData';

interface LabDocumentCanvasProps {
  section: LabSectionContent;
  layoutMode: PageLayoutMode;
  zoom: number;
  onTriggerAiAssist: (paragraphText: string, paragraphIndex: number) => void;
}

export function LabDocumentCanvas({
  section,
  layoutMode,
  zoom,
  onTriggerAiAssist,
}: LabDocumentCanvasProps) {
  return (
    <PagedCanvasContainer
      layoutMode={layoutMode}
      zoom={zoom}
      currentPage={1}
      totalPages={4}
    >
      <div className="w-full max-w-3xl mx-auto space-y-6">
        {/* 섹션 메타 헤더 카드 */}
        <div className="p-6 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                SLOT #{section.slotNumber}
              </span>
              <span
                className={`px-2 py-0.5 text-[11px] font-semibold rounded-md flex items-center gap-1 ${
                  section.status === '완료'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : section.status === '검토필요'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {section.status === '완료' ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                ) : section.status === '검토필요' ? (
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                ) : (
                  <Clock className="w-3 h-3 text-slate-500" />
                )}
                {section.status}
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {section.wordCount} words
            </span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {section.title}
          </h1>

          <p className="text-sm text-slate-500 leading-relaxed bg-slate-50/80 p-3 rounded-lg border border-slate-100">
            {section.summary}
          </p>
        </div>

        {/* 단락 리스트 카드 */}
        <div className="space-y-4">
          {section.paragraphs.map((para, idx) => (
            <div
              key={idx}
              className="group relative p-5 bg-white rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-xs transition-all text-slate-800 leading-relaxed text-[15px]"
            >
              {/* 단락 인라인 액션 렌즈 버튼 (hover 시 노출) */}
              <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-white/95 backdrop-blur-xs px-2 py-1 rounded-lg border border-slate-200 shadow-xs text-xs">
                <button
                  type="button"
                  onClick={() => onTriggerAiAssist(para, idx)}
                  className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>AI 보강</span>
                </button>
              </div>

              <p>{para}</p>
            </div>
          ))}
        </div>
      </div>
    </PagedCanvasContainer>
  );
}

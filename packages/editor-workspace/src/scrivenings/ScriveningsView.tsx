import { FileText, Layers } from 'lucide-react';
import type { ScriveningsViewProps } from './types';

/**
 * 스크리브너 스타일의 스크리브닝스(Scrivenings) 복합 뷰 컴포넌트.
 * 분할된 여러 청크/섹션 노드들을 단일 연속 스크롤 문서처럼 이어서 편집 및 검토할 수 있습니다.
 */
export function ScriveningsView({
  chunks,
  activeChunkId,
  onChunkFocus,
  onChangeChunk,
  renderChunkContent,
  emptyText = '선택된 청크 노드가 없습니다.',
  className = '',
}: ScriveningsViewProps) {
  if (!chunks || chunks.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 p-8 bg-slate-100/70">
        <Layers className="w-8 h-8 stroke-[1.5] opacity-40 text-slate-400" />
        <p className="text-xs font-medium text-slate-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className={`w-full h-full overflow-y-auto p-8 bg-slate-100/70 flex flex-col items-center select-text ${className}`}>
      <div className="w-full max-w-3xl flex flex-col gap-6">
        {chunks.map((chunk, index) => {
          const isActive = chunk.id === activeChunkId;

          return (
            <section
              key={chunk.id}
              onClick={() => onChunkFocus?.(chunk.id)}
              className={`group relative flex flex-col rounded-2xl bg-white border transition-all ${
                isActive
                  ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                  : 'border-slate-200/80 hover:border-slate-300 shadow-xs'
              }`}
            >
              {/* 1. 청크 상단 헤더 띠 */}
              <div className="px-5 py-2.5 border-b border-slate-100 bg-slate-50/60 rounded-t-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600">
                    <FileText className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 tracking-wide">
                    {chunk.title}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  #{index + 1} • {chunk.id}
                </span>
              </div>

              {/* 2. 본문 렌더러 슬롯 */}
              <div className="p-6">
                {renderChunkContent ? (
                  renderChunkContent(chunk)
                ) : (
                  <textarea
                    readOnly={chunk.readOnly}
                    value={chunk.content}
                    onChange={(e) => onChangeChunk?.(chunk.id, e.target.value)}
                    placeholder="내용을 입력하세요..."
                    className="w-full min-h-[140px] bg-transparent resize-none text-xs leading-relaxed text-slate-800 outline-none placeholder-slate-400 font-sans"
                  />
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

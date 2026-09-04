import { memo } from 'react';
import { Sparkles } from 'lucide-react';

import { useSyncMappingStore } from '@/shared/model';

interface SyncMappingHighlightOverlayProps {
  nodeId: string;
  fileName?: string;
}

/**
 * SyncMappingHighlightOverlay (Entity UI)
 *
 * 피그마/미로 스타일의 양방향 동기화 컬러 태깅(Color Sync Matching) 오버레이.
 * 우측 Tiptap 서식 슬롯에 커서가 올려지면, 해당 서식과 연동된 '특정 원본 참고 문서'에서만
 * 동일한 보라색 배경과 '#1', '#2' 번호 뱃지를 즉시 띄워 바운더리를 시각화합니다.
 */
export const SyncMappingHighlightOverlay = memo(function SyncMappingHighlightOverlay({
  nodeId,
  fileName = '',
}: SyncMappingHighlightOverlayProps) {
  const activeMapping = useSyncMappingStore((s) => s.activeMapping);

  if (!activeMapping || !activeMapping.box_2d) {
    return null;
  }

  // 1. targetNodeId가 지정된 경우: 정확히 해당 노드에서만 렌더링
  if (activeMapping.targetNodeId && activeMapping.targetNodeId !== nodeId) {
    return null;
  }

  // 2. sourcePdfFileName이 지정된 경우: 파일명 포함 여부 검증
  if (activeMapping.sourcePdfFileName) {
    const cleanSource = activeMapping.sourcePdfFileName.toLowerCase();
    const cleanCurrent = fileName.toLowerCase();
    if (cleanCurrent && !cleanCurrent.includes(cleanSource) && !cleanSource.includes(cleanCurrent)) {
      return null;
    }
  }

  const [ymin, xmin, ymax, xmax] = activeMapping.box_2d;

  const style = {
    top: `${ymin / 10}%`,
    left: `${xmin / 10}%`,
    width: `${Math.max((xmax - xmin) / 10, 5)}%`,
    height: `${Math.max((ymax - ymin) / 10, 3)}%`,
  };

  return (
    <div
      style={style}
      className={`
        absolute z-30 pointer-events-none rounded-lg border-2 border-purple-500 bg-purple-500/20
        shadow-[0_0_25px_rgba(168,85,247,0.45)] ring-4 ring-purple-400/40
        transition-all duration-200 ease-out animate-in fade-in zoom-in-95
      `}
    >
      {/* 펄스 발광 오버레이 */}
      <div className="absolute inset-0 rounded-md bg-purple-400/10 animate-pulse" />

      {/* 상단 솟아오르는 번호 뱃지 (#1, #2...) + 라벨 */}
      <div className="absolute -top-7 left-0 flex items-center gap-1.5 shadow-lg pointer-events-none select-none z-40 animate-in slide-in-from-bottom-2 duration-150">
        <div className="px-2 py-0.5 rounded-md bg-purple-600 text-white font-extrabold text-[11px] font-mono shadow-md border border-purple-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-purple-200" />
          <span>#{activeMapping.number}</span>
        </div>
        {activeMapping.label && (
          <div className="px-2 py-0.5 rounded-md bg-slate-900/90 text-purple-200 font-semibold text-[10px] shadow-md border border-purple-800/80 backdrop-blur-xs max-w-[200px] truncate">
            {activeMapping.label}
          </div>
        )}
      </div>

      {/* 모서리 가이드 앵커 포인트 */}
      <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-purple-500 border-2 border-white rounded-full shadow-sm" />
      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-500 border-2 border-white rounded-full shadow-sm" />
      <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-purple-500 border-2 border-white rounded-full shadow-sm" />
      <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-purple-500 border-2 border-white rounded-full shadow-sm" />
    </div>
  );
});

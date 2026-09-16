import { Camera, RotateCcw, GitCompare, Trash2, History, Loader2 } from 'lucide-react';
import type { SnapshotInspectorProps } from './types';

/**
 * 특정 문서 또는 청크의 스냅샷 이력을 관리하고 복원/비교할 수 있는 인스펙터 컴포넌트.
 */
export function SnapshotInspector({
  snapshots,
  onTakeSnapshot,
  onRestoreSnapshot,
  onDeleteSnapshot,
  onCompare,
  isTakingSnapshot = false,
  emptyText = '저장된 스냅샷 이력이 없습니다.',
  className = '',
}: SnapshotInspectorProps) {
  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className={`w-full h-full flex flex-col p-4 select-none ${className}`}>
      {/* 1. 상단 스냅샷 캡처 액션 버튼 */}
      {onTakeSnapshot && (
        <button
          type="button"
          disabled={isTakingSnapshot}
          onClick={onTakeSnapshot}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50 mb-4"
        >
          {isTakingSnapshot ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Camera className="w-3.5 h-3.5" />
          )}
          <span>현재 상태 스냅샷 저장</span>
        </button>
      )}

      {/* 2. 스냅샷 목록 */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2.5">
        {snapshots.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-slate-500 gap-2 text-center p-4">
            <History className="w-6 h-6 stroke-[1.5] opacity-50" />
            <p className="text-xs">{emptyText}</p>
            <p className="text-[10px] text-slate-600">
              상단 버튼을 눌러 중요한 변경 직전에 복원점을 남기세요.
            </p>
          </div>
        ) : (
          snapshots.map((snap) => (
            <div
              key={snap.id}
              className="group p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-1">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    {snap.title}
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {formatTime(snap.timestamp)}
                  </span>
                </div>

                {/* 액션 버튼 그룹 */}
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  {onCompare && (
                    <button
                      type="button"
                      onClick={() => onCompare(snap)}
                      className="p-1 rounded text-slate-400 hover:text-purple-300 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="현재 버전과 Diff 비교"
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {onRestoreSnapshot && (
                    <button
                      type="button"
                      onClick={() => onRestoreSnapshot(snap)}
                      className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="이 시점으로 복원"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {onDeleteSnapshot && (
                    <button
                      type="button"
                      onClick={() => onDeleteSnapshot(snap.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="스냅샷 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* 미리보기 텍스트 */}
              {snap.previewText && (
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed bg-slate-950/60 p-2 rounded border border-slate-800/60">
                  {snap.previewText}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

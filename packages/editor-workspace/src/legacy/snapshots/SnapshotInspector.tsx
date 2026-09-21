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
    <div className={`w-full h-full flex flex-col p-3 select-none bg-white text-slate-800 ${className}`}>
      {/* 1. 상단 스냅샷 캡처 액션 버튼 */}
      {onTakeSnapshot && (
        <button
          type="button"
          disabled={isTakingSnapshot}
          onClick={onTakeSnapshot}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 mb-3"
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
      <div className="flex-1 overflow-y-auto flex flex-col gap-2">
        {snapshots.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-slate-400 gap-2 text-center p-4">
            <History className="w-6 h-6 stroke-[1.5] opacity-40 text-slate-400" />
            <p className="text-xs font-medium text-slate-500">{emptyText}</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              상단 버튼을 눌러 중요한 변경 직전에 복원점을 남기세요.
            </p>
          </div>
        ) : (
          snapshots.map((snap) => (
            <div
              key={snap.id}
              className="group p-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-2xs transition-all flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-1">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    {snap.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatTime(snap.timestamp)}
                  </span>
                </div>

                {/* 액션 버튼 그룹 */}
                <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                  {onCompare && (
                    <button
                      type="button"
                      onClick={() => onCompare(snap)}
                      className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="현재 버전과 Diff 비교"
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {onRestoreSnapshot && (
                    <button
                      type="button"
                      onClick={() => onRestoreSnapshot(snap)}
                      className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="이 시점으로 복원"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {onDeleteSnapshot && (
                    <button
                      type="button"
                      onClick={() => onDeleteSnapshot(snap.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="스냅샷 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* 미리보기 텍스트 */}
              {snap.previewText && (
                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-200/80 font-sans">
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

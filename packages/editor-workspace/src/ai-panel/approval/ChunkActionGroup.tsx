import { memo } from 'react';
import { Check, X, Edit3, RotateCw } from 'lucide-react';
import type { ChunkActionGroupProps } from './types';

/**
 * ChunkActionGroup (청크별 선별 승인 액션 바)
 *
 * 생성된 개별 단락/슬롯별로 수락, 거절, 직접 수정, 재시도를 결정하는 버튼 툴바.
 */
export const ChunkActionGroup = memo(function ChunkActionGroup({
  chunkId,
  status,
  onAccept,
  onReject,
  onEdit,
  onRetry,
  className = '',
}: ChunkActionGroupProps) {
  return (
    <div className={`flex items-center gap-1 shrink-0 ${className}`}>
      {status === 'accepted' ? (
        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 border border-emerald-700/60 text-emerald-300">
          ✓ 수락됨
        </span>
      ) : status === 'rejected' ? (
        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950 border border-rose-800 text-rose-300">
          ✕ 거절됨
        </span>
      ) : (
        <>
          <button
            type="button"
            onClick={() => onAccept(chunkId)}
            title="본문에 수락 반영"
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-xs"
          >
            <Check className="w-3 h-3" />
            <span>수락</span>
          </button>

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(chunkId)}
              title="직접 수정 후 반영"
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>수정</span>
            </button>
          )}

          {onRetry && (
            <button
              type="button"
              onClick={() => onRetry(chunkId)}
              title="이 부분만 재시도"
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RotateCw className="w-3 h-3" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onReject(chunkId)}
            title="제안 거절"
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
            <span>거절</span>
          </button>
        </>
      )}
    </div>
  );
});
